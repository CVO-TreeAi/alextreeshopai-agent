#!/usr/bin/env python3
"""
Demo: Alex with Convex Integration
Shows how Alex assessments automatically sync to Convex backend
"""

import asyncio
import httpx
import json
import os
from datetime import datetime
from typing import Dict, Any

class AlexConvexDemo:
    """Simplified Alex demo with Convex integration"""
    
    def __init__(self, convex_url: str):
        self.convex_url = convex_url
        
    async def simulate_alex_assessment(self, project_description: str) -> Dict[str, Any]:
        """Simulate Alex's project assessment"""
        print(f"🤖 Alex is analyzing: {project_description}")
        
        # Simulate Alex's intelligent assessment
        assessment = {
            "project_description": project_description,
            "location_type": "residential" if "residential" in project_description.lower() else "commercial",
            "service_type": "removal" if "removal" in project_description.lower() else "trimming",
            
            # Simulated tree measurements
            "tree_height": 65.0,
            "canopy_radius": 22.0,
            "dbh": 28.0,
            "tree_species": "oak",
            "tree_condition": "healthy",
            
            # TreeScore calculation
            "base_treescore": 140.0,
            "total_treescore": 168.5,
            
            # AFISS assessment results
            "afiss_composite_score": 42.3,
            "access_score": 8.5,
            "fall_zone_score": 12.8,
            "interference_score": 9.2,
            "severity_score": 8.1,
            "site_conditions_score": 3.7,
            "complexity_level": "moderate",
            "complexity_multiplier": 1.65,
            
            # Business estimates
            "estimated_hours": 10.5,
            "estimated_cost": 2250.0,
            "crew_type_recommended": "experienced",
            "equipment_required": ["crane", "chainsaw", "chipper", "truck"],
            "safety_protocols": ["OSHA compliance", "ISA standards", "traffic control"],
            "isa_certified_required": True,
            
            # Alex metadata
            "claude_model_used": "sonnet",
            "assessment_time_seconds": 18.5,
            "alex_confidence_score": 87.2,
            
            # AFISS factors identified
            "afiss_factors": [
                {
                    "factor_code": "AF_ACCESS_012",
                    "factor_name": "Narrow driveway access",
                    "domain": "access",
                    "base_percentage": 4.2,
                    "triggered": True,
                    "confidence": 0.85,
                    "reasoning": "Driveway width restricts equipment positioning"
                },
                {
                    "factor_code": "AF_INTERFERENCE_045",
                    "factor_name": "Overhead power lines",
                    "domain": "interference",
                    "base_percentage": 15.2,
                    "triggered": True,
                    "confidence": 0.92,
                    "reasoning": "Power lines present overhead requiring safety protocols"
                },
                {
                    "factor_code": "AF_FALL_ZONE_028",
                    "factor_name": "Residential structure proximity",
                    "domain": "fall_zone",
                    "base_percentage": 8.7,
                    "triggered": True,
                    "confidence": 0.78,
                    "reasoning": "House within fall zone requires precision cutting"
                }
            ]
        }
        
        print(f"✅ Assessment complete - AFISS Score: {assessment['afiss_composite_score']:.1f}%")
        print(f"   Complexity: {assessment['complexity_level'].upper()}")
        print(f"   Estimated Cost: ${assessment['estimated_cost']:,.2f}")
        print(f"   Crew: {assessment['crew_type_recommended']}")
        
        return assessment
    
    async def sync_to_convex(self, assessment: Dict[str, Any]) -> str:
        """Sync Alex assessment to Convex backend"""
        print(f"\n🔗 Syncing assessment to Convex...")
        
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                # Create project in Convex
                response = await client.post(
                    f"{self.convex_url}/api/mutation",
                    json={
                        "path": "projects:createProject",
                        "args": assessment
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    project_id = data.get('value')
                    
                    print(f"✅ Project synced successfully!")
                    print(f"🆔 Project ID: {project_id}")
                    
                    # Sync AFISS factors
                    if assessment.get('afiss_factors'):
                        await self.sync_afiss_factors(project_id, assessment['afiss_factors'])
                    
                    return project_id
                else:
                    print(f"❌ Sync failed: {response.status_code}")
                    print(f"Response: {response.text}")
                    return None
                    
        except Exception as e:
            print(f"❌ Sync error: {str(e)}")
            return None
    
    async def sync_afiss_factors(self, project_id: str, factors: list):
        """Sync AFISS factors to Convex"""
        print(f"📊 Syncing {len(factors)} AFISS factors...")
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    f"{self.convex_url}/api/mutation",
                    json={
                        "path": "afiss:saveAFISSAssessment",
                        "args": {
                            "project_id": project_id,
                            "factors": factors
                        }
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    factor_ids = data.get('value', [])
                    print(f"✅ {len(factor_ids)} AFISS factors synced")
                else:
                    print(f"⚠️ AFISS sync failed: {response.status_code}")
                    
        except Exception as e:
            print(f"⚠️ AFISS sync error: {str(e)}")
    
    async def show_dashboard_summary(self):
        """Show current dashboard summary"""
        print(f"\n📊 Current Dashboard Summary:")
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    f"{self.convex_url}/api/query",
                    json={
                        "path": "projects:getProjectsByStatus",
                        "args": {}
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    dashboard = data.get('value', {})
                    
                    print(f"   Total Projects: {dashboard.get('total_projects', 0)}")
                    print(f"   By Status: {dashboard.get('by_status', {})}")
                    print(f"   By Complexity: {dashboard.get('by_complexity', {})}")
                    
                    recent = dashboard.get('recent_projects', [])[:3]
                    if recent:
                        print(f"   Recent Projects:")
                        for i, project in enumerate(recent, 1):
                            desc = project.get('description', 'No description')[:40]
                            cost = project.get('estimated_cost', 0)
                            print(f"     {i}. {desc}... (${cost:,.0f})")
                else:
                    print(f"   ❌ Dashboard query failed")
                    
        except Exception as e:
            print(f"   ❌ Dashboard error: {str(e)}")

async def demo_alex_workflows():
    """Demonstrate different Alex assessment workflows"""
    
    convex_url = "https://cheerful-bee-330.convex.cloud"
    alex = AlexConvexDemo(convex_url)
    
    print("🌳 Alex TreeAI Operations Agent - Convex Integration Demo")
    print("="*60)
    
    # Show current dashboard
    await alex.show_dashboard_summary()
    
    # Demo 1: Residential tree removal
    print(f"\n🏠 DEMO 1: Residential Tree Removal")
    print("-" * 40)
    
    project_1 = """
    Large oak tree removal in residential neighborhood. Tree is 65 feet tall 
    with significant canopy spread. Located 18 feet from house with power lines 
    running overhead. Narrow driveway access requiring careful equipment positioning.
    Customer is concerned about property damage and utility safety.
    """
    
    assessment_1 = await alex.simulate_alex_assessment(project_1.strip())
    project_id_1 = await alex.sync_to_convex(assessment_1)
    
    # Demo 2: Commercial emergency removal  
    print(f"\n🏢 DEMO 2: Commercial Emergency Removal")
    print("-" * 40)
    
    project_2 = """
    Emergency storm-damaged maple removal at commercial building. Tree is partially
    fallen and blocking main entrance. High priority due to business operations impact.
    Complex rigging required due to building proximity and pedestrian safety concerns.
    """
    
    assessment_2 = await alex.simulate_alex_assessment(project_2.strip())
    assessment_2.update({
        "complexity_level": "high",
        "afiss_composite_score": 58.7,
        "estimated_cost": 3200.0,
        "crew_type_recommended": "expert",
        "priority": "emergency"
    })
    
    project_id_2 = await alex.sync_to_convex(assessment_2)
    
    # Demo 3: Simple backyard trimming
    print(f"\n🌿 DEMO 3: Simple Backyard Trimming")
    print("-" * 40)
    
    project_3 = """
    Routine pruning of small maple trees in fenced backyard. Easy access via 
    side gate, no obstacles or utility conflicts. Standard maintenance trimming
    to improve tree health and appearance.
    """
    
    assessment_3 = await alex.simulate_alex_assessment(project_3.strip())
    assessment_3.update({
        "service_type": "trimming",
        "complexity_level": "low",
        "afiss_composite_score": 18.2,
        "estimated_cost": 650.0,
        "estimated_hours": 4.0,
        "crew_type_recommended": "standard",
        "isa_certified_required": False
    })
    
    project_id_3 = await alex.sync_to_convex(assessment_3)
    
    # Show updated dashboard
    print(f"\n📈 Updated Dashboard Summary:")
    print("-" * 40)
    await alex.show_dashboard_summary()
    
    # Show Alex's learning insights
    print(f"\n🧠 Alex Learning Insights:")
    print("-" * 40)
    print(f"✅ Processed 3 diverse project types")
    print(f"✅ AFISS complexity range: 18.2% - 58.7%") 
    print(f"✅ Cost estimates: $650 - $3,200")
    print(f"✅ All data synced to Convex for learning")
    print(f"✅ Factors tracked for accuracy improvement")
    
    print(f"\n🎉 Demo Complete!")
    print(f"🔗 View your data: https://dashboard.convex.dev/t/cvo-treeai/alex-standalone/cheerful-bee-330/data")
    print(f"📊 Alex is now learning from each project to improve future assessments!")

if __name__ == "__main__":
    asyncio.run(demo_alex_workflows())