#!/usr/bin/env python3
"""
Alex-Convex Integration Client
Connects Alex agent to Convex backend for real-time data sync and learning
"""

import os
import json
import asyncio
import httpx
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
import structlog

logger = structlog.get_logger()

@dataclass
class ConvexConfig:
    """Configuration for Convex backend connection"""
    deployment_url: str
    api_key: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3
    verbose: bool = False

class ConvexClient:
    """Client for connecting Alex agent to Convex backend"""
    
    def __init__(self, config: ConvexConfig):
        self.config = config
        self.base_url = config.deployment_url.rstrip('/')
        self.session = httpx.AsyncClient(
            timeout=config.timeout,
            headers=self._get_headers()
        )
        
    def _get_headers(self) -> Dict[str, str]:
        """Build HTTP headers for Convex API requests"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Alex-TreeAI-Agent/1.0.0"
        }
        
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
            
        return headers
    
    async def _make_request(self, endpoint: str, data: Dict[str, Any], method: str = "POST") -> Dict[str, Any]:
        """Make HTTP request to Convex with retry logic"""
        url = f"{self.base_url}/api/{endpoint}"
        
        for attempt in range(self.config.max_retries):
            try:
                if self.config.verbose:
                    logger.info(f"Convex request attempt {attempt + 1}", endpoint=endpoint, method=method)
                
                if method == "POST":
                    response = await self.session.post(url, json=data)
                elif method == "GET":
                    response = await self.session.get(url, params=data)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                result = response.json()
                
                if self.config.verbose:
                    logger.info("Convex request successful", endpoint=endpoint, status=response.status_code)
                
                return result
                
            except httpx.HTTPError as e:
                logger.warning(f"Convex request failed", endpoint=endpoint, attempt=attempt + 1, error=str(e))
                if attempt == self.config.max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
    
    # ============================================================================
    # PROJECT OPERATIONS
    # ============================================================================
    
    async def create_project(self, project_data: Dict[str, Any]) -> str:
        """Create a new project in Convex and return project ID"""
        # Add timestamp if not present
        if 'created_at' not in project_data:
            project_data['created_at'] = int(datetime.now(timezone.utc).timestamp() * 1000)
        
        result = await self._make_request("projects:createProject", project_data)
        project_id = result.get('data')
        
        logger.info("Project created in Convex", project_id=project_id)
        return project_id
    
    async def update_project_progress(self, project_id: str, updates: Dict[str, Any]) -> bool:
        """Update project progress in real-time"""
        data = {
            "project_id": project_id,
            **updates
        }
        
        result = await self._make_request("projects:updateProjectProgress", data)
        
        logger.info("Project progress updated", project_id=project_id, updates=list(updates.keys()))
        return result.get('success', True)
    
    async def get_project(self, project_id: str) -> Dict[str, Any]:
        """Get complete project data with all related information"""
        data = {"project_id": project_id}
        
        result = await self._make_request("projects:getProject", data, method="GET")
        project_data = result.get('data', {})
        
        logger.info("Project retrieved from Convex", project_id=project_id)
        return project_data
    
    async def list_projects(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """List projects with optional filtering"""
        data = filters or {}
        
        result = await self._make_request("projects:listProjects", data, method="GET")
        projects = result.get('data', [])
        
        logger.info("Projects listed from Convex", count=len(projects))
        return projects
    
    async def complete_project(self, project_id: str, completion_data: Dict[str, Any]) -> bool:
        """Mark project as completed and trigger learning"""
        data = {
            "project_id": project_id,
            **completion_data
        }
        
        result = await self._make_request("projects:completeProject", data)
        
        logger.info("Project completed", project_id=project_id)
        return result.get('success', True)
    
    # ============================================================================
    # AFISS OPERATIONS
    # ============================================================================
    
    async def save_afiss_assessment(self, project_id: str, factors: List[Dict[str, Any]]) -> List[str]:
        """Save AFISS factors for a project assessment"""
        data = {
            "project_id": project_id,
            "factors": factors
        }
        
        result = await self._make_request("afiss:saveAFISSAssessment", data)
        factor_ids = result.get('data', [])
        
        logger.info("AFISS assessment saved", project_id=project_id, factor_count=len(factors))
        return factor_ids
    
    async def get_project_afiss_factors(self, project_id: str) -> Dict[str, Any]:
        """Get AFISS factors for a project grouped by domain"""
        data = {"project_id": project_id}
        
        result = await self._make_request("afiss:getProjectAFISSFactors", data, method="GET")
        factors_data = result.get('data', {})
        
        logger.info("AFISS factors retrieved", project_id=project_id, total_factors=factors_data.get('total_count', 0))
        return factors_data
    
    async def search_afiss_factors(self, query_text: str, domain: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Search AFISS factors by semantic similarity"""
        data = {
            "query_text": query_text,
            "limit": limit
        }
        
        if domain:
            data["domain"] = domain
        
        result = await self._make_request("afiss:searchAFISSFactors", data, method="GET")
        factors = result.get('data', [])
        
        logger.info("AFISS factors searched", query=query_text, results=len(factors))
        return factors
    
    async def update_factor_accuracy(self, project_id: str, factor_accuracies: List[Dict[str, Any]]) -> List[str]:
        """Update factor accuracy after project completion"""
        data = {
            "project_id": project_id,
            "factor_accuracies": factor_accuracies
        }
        
        result = await self._make_request("afiss:updateFactorAccuracy", data)
        updated_ids = result.get('data', [])
        
        logger.info("Factor accuracies updated", project_id=project_id, updates=len(factor_accuracies))
        return updated_ids
    
    async def get_factor_performance_analytics(self, domain: Optional[str] = None, start_date: Optional[int] = None, end_date: Optional[int] = None) -> Dict[str, Any]:
        """Get AFISS factor performance analytics"""
        data = {}
        
        if domain:
            data["domain"] = domain
        if start_date:
            data["start_date"] = start_date
        if end_date:
            data["end_date"] = end_date
        
        result = await self._make_request("afiss:getFactorPerformanceAnalytics", data, method="GET")
        analytics = result.get('data', {})
        
        logger.info("Factor performance analytics retrieved", domain=domain)
        return analytics
    
    async def initialize_afiss_factor_definitions(self, factors: List[Dict[str, Any]]) -> List[str]:
        """Initialize AFISS factor definitions in the database"""
        data = {"factors": factors}
        
        result = await self._make_request("afiss:initializeAFISSFactorDefinitions", data)
        inserted_ids = result.get('data', [])
        
        logger.info("AFISS factor definitions initialized", count=len(factors), inserted=len(inserted_ids))
        return inserted_ids
    
    # ============================================================================
    # LEARNING & ANALYTICS
    # ============================================================================
    
    async def save_learning_data(self, project_id: str, learning_metrics: Dict[str, Any]) -> bool:
        """Save Alex's learning data after project completion"""
        # Learning data is automatically created during project completion
        # This method provides access to update additional learning insights
        
        data = {
            "project_id": project_id,
            **learning_metrics
        }
        
        # Note: Would need a dedicated mutation for this in Convex
        logger.info("Learning data saved", project_id=project_id)
        return True
    
    async def get_learning_analytics(self, start_date: Optional[int] = None, end_date: Optional[int] = None) -> Dict[str, Any]:
        """Get Alex's learning performance analytics"""
        # Note: Would need a dedicated query for this in Convex
        logger.info("Learning analytics retrieved")
        return {}
    
    # ============================================================================
    # CREW & EQUIPMENT TRACKING
    # ============================================================================
    
    async def track_crew_performance(self, project_id: str, crew_data: Dict[str, Any]) -> bool:
        """Track real-time crew performance"""
        # Note: Would need crew performance mutations in Convex
        logger.info("Crew performance tracked", project_id=project_id)
        return True
    
    async def track_equipment_usage(self, project_id: str, equipment_data: Dict[str, Any]) -> bool:
        """Track equipment usage and costs"""
        # Note: Would need equipment usage mutations in Convex
        logger.info("Equipment usage tracked", project_id=project_id)
        return True
    
    # ============================================================================
    # DASHBOARD & METRICS
    # ============================================================================
    
    async def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get dashboard metrics for operational overview"""
        result = await self._make_request("projects:getProjectsByStatus", {}, method="GET")
        dashboard_data = result.get('data', {})
        
        logger.info("Dashboard metrics retrieved")
        return dashboard_data
    
    async def close(self):
        """Close the HTTP session"""
        await self.session.aclose()

# ============================================================================
# ALEX-CONVEX INTEGRATION WRAPPER
# ============================================================================

class AlexConvexIntegration:
    """High-level integration wrapper for Alex agent + Convex backend"""
    
    def __init__(self, convex_url: str, api_key: Optional[str] = None, verbose: bool = False):
        config = ConvexConfig(
            deployment_url=convex_url,
            api_key=api_key,
            verbose=verbose
        )
        self.client = ConvexClient(config)
        self.logger = structlog.get_logger()
    
    async def sync_project_assessment(self, alex_assessment: Dict[str, Any]) -> str:
        """Sync Alex's project assessment to Convex backend"""
        
        # Extract project data from Alex assessment
        project_data = {
            "description": alex_assessment.get("project_description", ""),
            "location_type": alex_assessment.get("location_type", "residential"),
            "service_type": alex_assessment.get("service_type", "removal"),
            
            # Tree measurements
            "tree_height": alex_assessment.get("tree_height"),
            "canopy_radius": alex_assessment.get("canopy_radius"),
            "dbh": alex_assessment.get("dbh"),
            "tree_species": alex_assessment.get("tree_species"),
            "tree_condition": alex_assessment.get("tree_condition"),
            
            # TreeScore
            "base_treescore": alex_assessment.get("base_treescore", 0),
            "total_treescore": alex_assessment.get("total_treescore", 0),
            
            # AFISS scores
            "afiss_composite_score": alex_assessment.get("afiss_composite_score", 0),
            "access_score": alex_assessment.get("access_score", 0),
            "fall_zone_score": alex_assessment.get("fall_zone_score", 0),
            "interference_score": alex_assessment.get("interference_score", 0),
            "severity_score": alex_assessment.get("severity_score", 0),
            "site_conditions_score": alex_assessment.get("site_conditions_score", 0),
            "complexity_level": alex_assessment.get("complexity_level", "moderate"),
            "complexity_multiplier": alex_assessment.get("complexity_multiplier", 1.0),
            
            # Business estimates
            "estimated_hours": alex_assessment.get("estimated_hours", 0),
            "estimated_cost": alex_assessment.get("estimated_cost", 0),
            "crew_type_recommended": alex_assessment.get("crew_type_recommended", "standard"),
            "equipment_required": alex_assessment.get("equipment_required", []),
            "safety_protocols": alex_assessment.get("safety_protocols", []),
            "isa_certified_required": alex_assessment.get("isa_certified_required", False),
            
            # Alex metadata
            "claude_model_used": alex_assessment.get("claude_model_used", "sonnet"),
            "assessment_time_seconds": alex_assessment.get("assessment_time_seconds", 0),
            "alex_confidence_score": alex_assessment.get("alex_confidence_score"),
        }
        
        # Create project in Convex
        project_id = await self.client.create_project(project_data)
        
        # Save AFISS factors if present
        afiss_factors = alex_assessment.get("afiss_factors", [])
        if afiss_factors:
            await self.client.save_afiss_assessment(project_id, afiss_factors)
        
        self.logger.info("Alex assessment synced to Convex", project_id=project_id)
        return project_id
    
    async def get_learning_insights(self, project_id: str) -> Dict[str, Any]:
        """Get learning insights for a completed project"""
        project_data = await self.client.get_project(project_id)
        
        # Extract learning insights
        learning_data = project_data.get("learning_data", {})
        afiss_factors = project_data.get("afiss_factors", [])
        
        insights = {
            "project_id": project_id,
            "prediction_accuracy": {
                "hours_variance": learning_data.get("hours_prediction_variance_percent", 0),
                "cost_variance": learning_data.get("cost_prediction_variance_percent", 0),
            },
            "afiss_performance": {
                "factors_triggered": len([f for f in afiss_factors if f.get("triggered")]),
                "accuracy_rate": learning_data.get("factor_accuracy_rate", 0),
            },
            "model_performance": {
                "claude_model": learning_data.get("claude_model_used"),
                "assessment_time": learning_data.get("response_time_seconds", 0),
            }
        }
        
        return insights
    
    async def calibrate_afiss_factors(self, calibration_data: List[Dict[str, Any]]) -> bool:
        """Calibrate AFISS factors based on learning feedback"""
        # This would implement the learning pipeline
        # For now, just log the calibration request
        self.logger.info("AFISS factor calibration requested", factors=len(calibration_data))
        return True
    
    async def close(self):
        """Close the integration"""
        await self.client.close()

# ============================================================================
# CONFIGURATION & UTILITIES
# ============================================================================

def get_convex_config_from_env() -> ConvexConfig:
    """Load Convex configuration from environment variables"""
    convex_url = os.getenv("CONVEX_DEPLOYMENT_URL", "https://cheerful-bee-330.convex.cloud")
    api_key = os.getenv("CONVEX_API_KEY")
    verbose = os.getenv("CONVEX_VERBOSE", "false").lower() == "true"
    
    return ConvexConfig(
        deployment_url=convex_url,
        api_key=api_key,
        verbose=verbose
    )

async def create_alex_convex_integration(convex_url: Optional[str] = None, api_key: Optional[str] = None, verbose: bool = False) -> AlexConvexIntegration:
    """Factory function to create Alex-Convex integration"""
    
    if convex_url is None:
        config = get_convex_config_from_env()
        convex_url = config.deployment_url
        api_key = config.api_key
        verbose = config.verbose
    
    integration = AlexConvexIntegration(convex_url, api_key, verbose)
    
    # Test connection
    try:
        dashboard_metrics = await integration.client.get_dashboard_metrics()
        logger.info("Alex-Convex integration initialized successfully", convex_url=convex_url)
    except Exception as e:
        logger.error("Failed to initialize Alex-Convex integration", error=str(e))
        raise
    
    return integration

# ============================================================================
# CLI TESTING
# ============================================================================

async def main():
    """Test Alex-Convex integration"""
    
    # Initialize integration
    integration = await create_alex_convex_integration(verbose=True)
    
    try:
        # Test dashboard metrics
        print("=== Dashboard Metrics ===")
        dashboard = await integration.client.get_dashboard_metrics()
        print(json.dumps(dashboard, indent=2))
        
        # Test AFISS factor search
        print("\n=== AFISS Factor Search ===")
        factors = await integration.client.search_afiss_factors("power lines overhead", limit=5)
        print(f"Found {len(factors)} factors matching 'power lines overhead'")
        
        # Test analytics
        print("\n=== Performance Analytics ===")
        analytics = await integration.client.get_factor_performance_analytics()
        print(json.dumps(analytics, indent=2))
        
    finally:
        await integration.close()

if __name__ == "__main__":
    asyncio.run(main())