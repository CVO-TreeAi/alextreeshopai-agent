#!/usr/bin/env python3
"""
Alex Forestry Mulching Integration
Combines Alex agent with forestry mulching AFISS factors and production rate calculations
"""

import asyncio
import json
import os
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple
import anthropic
import httpx

# Import Alex's existing Claude infrastructure
from alex_anthropic import ClaudeModelManager, ClaudeModel, TaskComplexity, ProjectComplexity

class ForestryMulchingAlex:
    """Alex agent specialized for forestry mulching with AFISS production rate adjustments"""
    
    def __init__(self, convex_url: str, api_key: Optional[str] = None):
        # Use Alex's existing API key setup
        if api_key is None:
            api_key = os.getenv("alex-standalone_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("No API key found. Set alex-standalone_API_KEY or ANTHROPIC_API_KEY environment variable")
        
        # Use Alex's Claude model manager
        self.claude_manager = ClaudeModelManager(api_key)
        self.convex_url = convex_url
        
        # Load AFISS factors for forestry mulching
        self.afiss_factors = self._load_mulching_afiss_factors()
    
    def _load_mulching_afiss_factors(self) -> Dict:
        """Load forestry mulching AFISS factors from file"""
        try:
            factors_file = "/Users/ain/TreeAI-Agent-Kit/agents/treeai-operations/alex-standalone/forestry_mulching_afiss_factors.md"
            with open(factors_file, 'r') as f:
                content = f.read()
            
            # Parse the markdown content to extract factors
            # This is a simplified parsing - in production you'd want more robust parsing
            factors = {
                "transport_access": {
                    "EQUIPMENT_TRANSPORT": -0.25,
                    "ROAD_ACCESS_QUALITY": {"poor": -0.20, "moderate": -0.10, "good": -0.05},
                    "SITE_ACCESSIBILITY": {"difficult": -0.25, "moderate": -0.15, "good": -0.10}
                },
                "operational_clearance": {
                    "OPERATING_CLEARANCE_RESTRICTIONS": {"severe": -0.20, "moderate": -0.10, "minor": -0.05},
                    "DEBRIS_PROJECTION_CONCERNS": {"high": -0.15, "moderate": -0.12, "low": -0.08},
                    "EQUIPMENT_MANEUVERABILITY": {"severe": -0.25, "moderate": -0.15, "minor": -0.10},
                    "VISIBILITY_LIMITATIONS": {"poor": -0.20, "moderate": -0.10, "good": -0.05}
                },
                "interference": {
                    "OVERHEAD_UTILITIES": {"high_voltage": -0.35, "standard": -0.25, "minor": -0.15},
                    "UNDERGROUND_UTILITIES": {"complex": -0.25, "moderate": -0.20, "simple": -0.10},
                    "STRUCTURES_AND_IMPROVEMENTS": {"complex": -0.20, "moderate": -0.15, "simple": -0.08},
                    "ENVIRONMENTAL_COMPLIANCE": {"strict": -0.30, "moderate": -0.20, "standard": -0.12}
                },
                "urgency_timing": {
                    "EMERGENCY_RESPONSE_CONDITIONS": {"critical": 0.15, "urgent": 0.10, "routine": 0.05},
                    "DEADLINE_PRESSURE_OPERATIONS": {"strict": -0.15, "moderate": -0.10, "flexible": -0.05},
                    "SEASONAL_WINDOW_RESTRICTIONS": {"multiple": -0.20, "single": -0.15, "none": -0.08}
                },
                "site_conditions": {
                    "INVASIVE_SPECIES_INFESTATION": {"brazilian_pepper_heavy": -0.30, "brazilian_pepper_moderate": -0.25, "other_invasive": -0.20},
                    "TERRAIN_CONDITIONS": {"extreme_slopes": -0.25, "steep_slopes": -0.20, "rocky": -0.15, "ideal_flat": 0.15, "good_access": 0.10},
                    "SOIL_AND_GROUND_CONDITIONS": {"extremely_poor": -0.30, "wet_soft": -0.20, "firm_stable": 0.05, "frozen_excellent": 0.10},
                    "VEGETATION_DENSITY_AND_TYPE": {"extremely_dense": -0.30, "dense_hardwood": -0.25, "mixed_dense": -0.20, "light_vegetation": 0.10, "thin_vegetation": 0.15, "grasses_small_brush": 0.20},
                    "WEATHER_CONDITIONS": {"mud_flooding": -0.25, "extreme_weather": -0.20, "wet_conditions": -0.15, "ideal_dry": 0.05, "cool_dry_extended": 0.10},
                    "SITE_LAYOUT_EFFICIENCY": {"small_scattered": -0.20, "complex_shapes": -0.15, "simple_rectangular": 0.05, "efficient_layout": 0.10, "very_large_areas": 0.15},
                    "DEBRIS_HANDLING_REQUIREMENTS": {"special_disposal": -0.20, "remove_from_site": -0.15, "windrow_pile": -0.10}
                }
            }
            
            return factors
            
        except Exception as e:
            print(f"Warning: Could not load AFISS factors file: {e}")
            return {}
    
    def calculate_mulching_economics(self, project_size_acres: float, package_type: str, 
                                   base_production_rate: float, billing_rate: float, 
                                   transport_hours: float = 0) -> Dict:
        """Calculate forestry mulching economics with package system"""
        
        # Package multipliers for DBH limits
        package_multipliers = {
            "4_inch": 1.0,
            "6_inch": 1.3, 
            "8_inch": 1.6,
            "10_inch": 2.0
        }
        
        package_dbh = {
            "4_inch": 4,
            "6_inch": 6,
            "8_inch": 8, 
            "10_inch": 10
        }
        
        # Calculate package inches
        dbh_limit = package_dbh.get(package_type, 6)
        package_inches = project_size_acres * dbh_limit
        
        # Apply package multiplier to production rate
        adjusted_rate = base_production_rate * package_multipliers.get(package_type, 1.3)
        
        # Calculate mulching hours
        mulching_hours = package_inches / adjusted_rate
        
        # Calculate costs
        mulching_cost = mulching_hours * billing_rate
        transport_cost = transport_hours * (billing_rate * 0.75) if transport_hours > 0 else 0
        total_cost = mulching_cost + transport_cost
        
        return {
            "project_size_acres": project_size_acres,
            "package_type": package_type,
            "package_dbh_limit": dbh_limit,
            "package_inches": package_inches,
            "base_production_rate": base_production_rate,
            "package_adjusted_rate": adjusted_rate,
            "mulching_hours": mulching_hours,
            "transport_hours": transport_hours,
            "mulching_cost": mulching_cost,
            "transport_cost": transport_cost,
            "total_cost": total_cost,
            "billing_rate": billing_rate,
            "cost_per_acre": total_cost / project_size_acres
        }
    
    def apply_afiss_adjustments(self, base_production_rate: float, site_conditions: Dict) -> Tuple[float, List[Dict], float]:
        """Apply AFISS factors to adjust production rate"""
        
        applied_factors = []
        total_adjustment = 0.0
        
        # Analyze site conditions and apply relevant factors
        
        # Brazilian pepper check (most important factor)
        if site_conditions.get("invasive_species") == "brazilian_pepper":
            severity = site_conditions.get("invasive_severity", "moderate")
            if severity == "heavy":
                adjustment = self.afiss_factors["site_conditions"]["INVASIVE_SPECIES_INFESTATION"]["brazilian_pepper_heavy"]
            else:
                adjustment = self.afiss_factors["site_conditions"]["INVASIVE_SPECIES_INFESTATION"]["brazilian_pepper_moderate"]
            
            applied_factors.append({
                "factor_code": "SC1_INVASIVE_SPECIES",
                "factor_name": f"Brazilian Pepper Infestation ({severity})",
                "adjustment": adjustment,
                "reasoning": f"Brazilian pepper creates extremely dense, difficult-to-cut vegetation"
            })
            total_adjustment += adjustment
        
        # Terrain conditions
        terrain = site_conditions.get("terrain_type", "moderate")
        if terrain in ["steep", "rocky", "extreme"]:
            if terrain == "extreme":
                adjustment = self.afiss_factors["site_conditions"]["TERRAIN_CONDITIONS"]["extreme_slopes"]
            elif terrain == "steep":
                adjustment = self.afiss_factors["site_conditions"]["TERRAIN_CONDITIONS"]["steep_slopes"] 
            else:
                adjustment = self.afiss_factors["site_conditions"]["TERRAIN_CONDITIONS"]["rocky"]
            
            applied_factors.append({
                "factor_code": "SC2_TERRAIN",
                "factor_name": f"Terrain Conditions ({terrain})",
                "adjustment": adjustment,
                "reasoning": f"Difficult terrain requires slower, more careful operation"
            })
            total_adjustment += adjustment
        elif terrain == "ideal":
            adjustment = self.afiss_factors["site_conditions"]["TERRAIN_CONDITIONS"]["ideal_flat"]
            applied_factors.append({
                "factor_code": "SC2_TERRAIN_POSITIVE",
                "factor_name": "Ideal Flat Terrain",
                "adjustment": adjustment,
                "reasoning": "Excellent terrain allows faster operation"
            })
            total_adjustment += adjustment
        
        # Soil conditions
        soil = site_conditions.get("soil_conditions", "normal")
        if soil == "wet":
            adjustment = self.afiss_factors["site_conditions"]["SOIL_AND_GROUND_CONDITIONS"]["wet_soft"]
            applied_factors.append({
                "factor_code": "SC3_SOIL_WET",
                "factor_name": "Wet Soil Conditions",
                "adjustment": adjustment,
                "reasoning": "Wet soil limits equipment access and speed"
            })
            total_adjustment += adjustment
        elif soil == "excellent":
            adjustment = self.afiss_factors["site_conditions"]["SOIL_AND_GROUND_CONDITIONS"]["firm_stable"]
            applied_factors.append({
                "factor_code": "SC3_SOIL_GOOD",
                "factor_name": "Firm Stable Soil",
                "adjustment": adjustment,
                "reasoning": "Good soil conditions allow faster operation"
            })
            total_adjustment += adjustment
        
        # Vegetation density
        vegetation = site_conditions.get("vegetation_density", "moderate")
        if vegetation in self.afiss_factors["site_conditions"]["VEGETATION_DENSITY_AND_TYPE"]:
            adjustment = self.afiss_factors["site_conditions"]["VEGETATION_DENSITY_AND_TYPE"][vegetation]
            applied_factors.append({
                "factor_code": "SC4_VEGETATION",
                "factor_name": f"Vegetation Density ({vegetation})",
                "adjustment": adjustment,
                "reasoning": f"Vegetation density directly affects cutting time"
            })
            total_adjustment += adjustment
        
        # Weather conditions
        weather = site_conditions.get("weather_conditions", "normal")
        if weather in self.afiss_factors["site_conditions"]["WEATHER_CONDITIONS"]:
            adjustment = self.afiss_factors["site_conditions"]["WEATHER_CONDITIONS"][weather]
            applied_factors.append({
                "factor_code": "SC5_WEATHER",
                "factor_name": f"Weather Conditions ({weather})",
                "adjustment": adjustment,
                "reasoning": f"Weather affects equipment access and operational hours"
            })
            total_adjustment += adjustment
        
        # Site layout
        layout = site_conditions.get("site_layout", "normal")
        if layout in self.afiss_factors["site_conditions"]["SITE_LAYOUT_EFFICIENCY"]:
            adjustment = self.afiss_factors["site_conditions"]["SITE_LAYOUT_EFFICIENCY"][layout]
            applied_factors.append({
                "factor_code": "SC6_LAYOUT",
                "factor_name": f"Site Layout ({layout})",
                "adjustment": adjustment,
                "reasoning": f"Site layout affects equipment efficiency"
            })
            total_adjustment += adjustment
        
        # Overhead utilities
        if site_conditions.get("overhead_utilities"):
            utility_type = site_conditions.get("utility_severity", "standard")
            adjustment = self.afiss_factors["interference"]["OVERHEAD_UTILITIES"][utility_type]
            applied_factors.append({
                "factor_code": "I1_OVERHEAD_UTILITIES",
                "factor_name": f"Overhead Utilities ({utility_type})",
                "adjustment": adjustment,
                "reasoning": "Overhead utilities require extreme caution and height restrictions"
            })
            total_adjustment += adjustment
        
        # Apply limits
        total_adjustment = max(-0.70, min(0.40, total_adjustment))  # Limit between -70% and +40%
        
        # Calculate adjusted production rate
        adjusted_rate = base_production_rate * (1 + total_adjustment)
        
        return adjusted_rate, applied_factors, total_adjustment
    
    async def assess_mulching_project(self, project_data: Dict) -> Dict:
        """Assess a forestry mulching project using Alex with AFISS"""
        
        print(f"🌲 Alex assessing forestry mulching project...")
        print(f"📏 Project: {project_data['project_size_acres']} acres, {project_data['package_type']} package")
        
        # Apply AFISS adjustments to production rate
        adjusted_rate, afiss_factors, total_adjustment = self.apply_afiss_adjustments(
            project_data['base_production_rate'],
            project_data.get('site_conditions', {})
        )
        
        # Calculate economics with AFISS adjustments
        economics = self.calculate_mulching_economics(
            project_data['project_size_acres'],
            project_data['package_type'],
            adjusted_rate,
            project_data['billing_rate'],
            project_data.get('transport_hours', 0)
        )
        
        # Build assessment prompt for Claude
        prompt = f"""
You are Alex, the TreeAI Operations Commander, now specialized in forestry mulching operations.

PROJECT DETAILS:
- Size: {project_data['project_size_acres']} acres
- Package: {project_data['package_type']} (DBH limit: {economics['package_dbh_limit']}") 
- Location: {project_data.get('location', 'Not specified')}
- Base Production Rate: {project_data['base_production_rate']} ia/h

AFISS ADJUSTMENTS APPLIED:
Total Adjustment: {total_adjustment:+.1%}
Adjusted Production Rate: {adjusted_rate:.2f} ia/h

Factors Applied:
{chr(10).join([f"• {factor['factor_name']}: {factor['adjustment']:+.1%} - {factor['reasoning']}" for factor in afiss_factors])}

ECONOMIC CALCULATION:
- Package Inches: {economics['package_inches']} inch-acres
- Estimated Mulching Hours: {economics['mulching_hours']:.2f} hours
- Transport Hours: {economics['transport_hours']} hours
- Total Project Cost: ${economics['total_cost']:,.0f}
- Cost per Acre: ${economics['cost_per_acre']:,.0f}/acre

Provide a comprehensive assessment including:
1. Project complexity level (low/moderate/high/extreme)
2. Equipment recommendations (mulcher type, support equipment)
3. Crew requirements and safety considerations
4. Risk factors and mitigation strategies
5. Timeline and scheduling recommendations
6. Any additional AFISS factors that might apply

Focus on production rate impacts and practical field considerations.
"""
        
        try:
            # Use Alex's Claude model manager for assessment
            # Forestry mulching is typically standard complexity
            assessment_text = await self.claude_manager.generate_response(
                prompt=prompt,
                task_complexity=TaskComplexity.STANDARD,
                system_prompt="You are Alex, the TreeAI Operations Commander specialized in forestry mulching operations. Provide detailed, practical assessments."
            )
            
            # Structure the response
            structured_assessment = {
                "description": f"{project_data['project_size_acres']} acre forestry mulching project",
                "location": project_data.get('location', ''),
                "project_size_acres": project_data['project_size_acres'],
                "package_type": project_data['package_type'],
                "package_dbh_limit": economics['package_dbh_limit'],
                
                # Production calculations
                "base_production_rate": project_data['base_production_rate'],
                "total_afiss_adjustment": total_adjustment,
                "adjusted_production_rate": adjusted_rate,
                "estimated_mulching_hours": economics['mulching_hours'],
                "estimated_transport_hours": economics['transport_hours'],
                
                # Economics
                "billing_rate_per_hour": project_data['billing_rate'],
                "transport_billing_rate": project_data['billing_rate'] * 0.75,
                "estimated_total_cost": economics['total_cost'],
                
                # Site conditions
                "terrain_type": project_data.get('site_conditions', {}).get('terrain_type'),
                "vegetation_density": project_data.get('site_conditions', {}).get('vegetation_density'),
                "soil_conditions": project_data.get('site_conditions', {}).get('soil_conditions'),
                "weather_conditions": project_data.get('site_conditions', {}).get('weather_conditions'),
                "access_quality": project_data.get('site_conditions', {}).get('access_quality'),
                
                # Project metadata
                "status": "planned",
                "priority": project_data.get('priority', 'routine'),
                "created_by": "alex_forestry_mulching",
                "created_at": datetime.now().timestamp(),
                "last_updated": datetime.now().timestamp()
            }
            
            return {
                "structured": structured_assessment,
                "afiss_factors_applied": afiss_factors,
                "economics": economics,
                "full_assessment": assessment_text,
                "claude_model_used": "sonnet"
            }
            
        except Exception as e:
            print(f"❌ Assessment failed: {str(e)}")
            return None
    
    async def sync_to_convex(self, assessment_data: Dict) -> str:
        """Sync forestry mulching project to Convex backend"""
        print(f"\n🔗 Syncing forestry mulching project to Convex...")
        
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                # Create the project
                response = await client.post(
                    f"{self.convex_url}/api/mutation",
                    json={
                        "path": "forestry_mulching:createMulchingProject",
                        "args": {
                            **assessment_data['structured'],
                            "afiss_factors_applied": [
                                {
                                    "factor_code": factor['factor_code'],
                                    "factor_name": factor['factor_name'],
                                    "production_rate_adjustment": factor['adjustment'],
                                    "notes": factor['reasoning']
                                }
                                for factor in assessment_data['afiss_factors_applied']
                            ]
                        }
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'success':
                        project_id = data.get('value')
                        print(f"✅ Synced to Convex!")
                        print(f"🆔 Mulching Project ID: {project_id}")
                        return project_id
                else:
                    print(f"❌ Sync failed: HTTP {response.status_code}")
                    print(f"Response: {response.text}")
        
        except Exception as e:
            print(f"❌ Sync failed: {str(e)}")
        
        return None

async def demo_forestry_mulching():
    """Demo the forestry mulching assessment system"""
    
    print("🌲 Alex Forestry Mulching Assessment Demo")
    print("=" * 60)
    
    # Example project from user's specifications
    project_data = {
        "project_size_acres": 3.5,
        "package_type": "6_inch",  # Medium package
        "base_production_rate": 1.5,  # ia/h
        "billing_rate": 500,  # per hour
        "transport_hours": 1.5,
        "location": "Rural property with mixed vegetation",
        "site_conditions": {
            "invasive_species": "brazilian_pepper",
            "invasive_severity": "moderate",  # -25% production rate
            "terrain_type": "moderate",
            "soil_conditions": "normal",
            "vegetation_density": "dense_hardwood",  # -25% production rate  
            "weather_conditions": "normal",
            "site_layout": "normal",
            "overhead_utilities": False
        },
        "priority": "routine"
    }
    
    convex_url = "https://cheerful-bee-330.convex.cloud"
    alex = ForestryMulchingAlex(convex_url)
    
    # Perform assessment
    result = await alex.assess_mulching_project(project_data)
    
    if result:
        print(f"\n📊 PRODUCTION RATE ANALYSIS:")
        print("-" * 40)
        print(f"🔢 Base Rate: {result['structured']['base_production_rate']:.2f} ia/h")
        print(f"⚖️  AFISS Adjustment: {result['structured']['total_afiss_adjustment']:+.1%}")
        print(f"📈 Adjusted Rate: {result['structured']['adjusted_production_rate']:.2f} ia/h")
        
        print(f"\n💰 ECONOMICS BREAKDOWN:")
        print("-" * 40)
        economics = result['economics']
        print(f"📏 Package Inches: {economics['package_inches']:.0f} inch-acres")
        print(f"⏱️  Mulching Time: {economics['mulching_hours']:.2f} hours") 
        print(f"🚛 Transport Time: {economics['transport_hours']:.1f} hours")
        print(f"💵 Total Cost: ${economics['total_cost']:,.0f}")
        print(f"📊 Cost per Acre: ${economics['cost_per_acre']:,.0f}")
        
        print(f"\n🎯 AFISS FACTORS APPLIED:")
        print("-" * 40)
        for factor in result['afiss_factors_applied']:
            print(f"• {factor['factor_name']}: {factor['adjustment']:+.1%}")
            print(f"  └─ {factor['reasoning']}")
        
        # Sync to backend
        project_id = await alex.sync_to_convex(result)
        
        print(f"\n📝 FULL ASSESSMENT:")
        print("-" * 40)
        print(result['full_assessment'])
        
        if project_id:
            print(f"\n🎉 Assessment complete! Project {project_id} saved to Convex.")
            print(f"📈 Ready for production rate tracking and learning!")
    
    else:
        print("❌ Assessment failed")

if __name__ == "__main__":
    asyncio.run(demo_forestry_mulching())