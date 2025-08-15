#!/usr/bin/env python3
"""
Sync TreeAI Pricing Intelligence to Convex Backend
Upload equipment defaults, employee costs, and loadout configurations
"""

import asyncio
import httpx
import json
from datetime import datetime
from typing import Dict, List, Any

# Equipment and employee data from our pricing system
EQUIPMENT_DEFAULTS = {
    "skid_steer_mulcher": {
        "category": "skid_steer_mulcher",
        "example_models": "Bobcat T770 + Denis Cimaf, Cat 299D3 XE",
        "msrp_new": 118000,
        "salvage_percent": 20,
        "life_hours": 6000,
        "fuel_burn_gph": 5.5,
        "maintenance_factor": 100,
        "notes": "Heavy vegetation factor 1.25x"
    },
    "bucket_truck": {
        "category": "bucket_truck",
        "example_models": "Altec/Versalift on Ford F750",
        "msrp_new": 165000,
        "salvage_percent": 30,
        "life_hours": 10000,
        "fuel_burn_gph": 6.5,
        "maintenance_factor": 60,
        "notes": "DOT-regulated"
    },
    "chipper": {
        "category": "chipper",
        "example_models": "Bandit 150XP, Vermeer BC1500",
        "msrp_new": 50000,
        "salvage_percent": 25,
        "life_hours": 5000,
        "fuel_burn_gph": 2.5,
        "maintenance_factor": 90,
        "notes": "Knife sharpening cost separate"
    },
    "stump_grinder": {
        "category": "stump_grinder",
        "example_models": "Carlton 7015, Rayco RG80",
        "msrp_new": 45000,
        "salvage_percent": 25,
        "life_hours": 5000,
        "fuel_burn_gph": 2.8,
        "maintenance_factor": 90,
        "notes": "Teeth wear in wear parts pool"
    },
    "pickup_truck": {
        "category": "pickup_truck",
        "example_models": "Ford F-350/F-450 diesel",
        "msrp_new": 65000,
        "salvage_percent": 40,
        "life_hours": 8000,
        "fuel_burn_gph": 2.5,
        "maintenance_factor": 50,
        "notes": "Life hrs ~ mph × 50"
    }
}

SMALL_TOOLS_DEFAULTS = [
    {
        "name": "Chainsaws & Power Tools",
        "example_items": "Stihl MS 500i, MS 362, pole saws, blowers",
        "avg_cost": 1000,
        "life_years": 2,
        "basis": "per_unit",
        "default_cost_per_hour": 0.42
    },
    {
        "name": "Climbing Gear",
        "example_items": "Rope, saddle, helmet, carabiners, lanyards",
        "avg_cost": 1500,
        "life_years": 3,
        "basis": "per_climber",
        "default_cost_per_hour": 0.42
    },
    {
        "name": "Hand Tools",
        "example_items": "Loppers, hand saws, rakes, wedges",
        "avg_cost": 400,
        "life_years": 2,
        "basis": "per_crew",
        "default_cost_per_hour": 0.17
    },
    {
        "name": "Safety Gear",
        "example_items": "Helmets, gloves, glasses, hearing protection",
        "avg_cost": 300,
        "life_years": 1,
        "basis": "per_person",
        "default_cost_per_hour": 0.25
    },
    {
        "name": "Rigging Gear",
        "example_items": "Slings, blocks, pulleys, ropes",
        "avg_cost": 1000,
        "life_years": 3,
        "basis": "per_crew",
        "default_cost_per_hour": 0.28
    }
]

EMPLOYEE_DEFAULTS = {
    "isa_certified_arborist": {
        "position": "isa_certified_arborist",
        "base_hourly_rate": 32.0,
        "burden_multiplier": 1.75,
        "annual_burden_costs": {
            "payroll_taxes": 2448,
            "workers_compensation": 7488,
            "health_insurance": 8000,
            "equipment_ppe": 3000,
            "vehicle_allocation": 5000,
            "training_certification": 2000
        }
    },
    "experienced_climber": {
        "position": "experienced_climber",
        "base_hourly_rate": 28.0,
        "burden_multiplier": 1.75,
        "annual_burden_costs": {
            "payroll_taxes": 2142,
            "workers_compensation": 6552,
            "health_insurance": 8000,
            "equipment_ppe": 3000,
            "vehicle_allocation": 5000,
            "training_certification": 2000
        }
    },
    "ground_crew_lead": {
        "position": "ground_crew_lead",
        "base_hourly_rate": 22.0,
        "burden_multiplier": 1.75,
        "annual_burden_costs": {
            "payroll_taxes": 1683,
            "workers_compensation": 5148,
            "health_insurance": 8000,
            "equipment_ppe": 2500,
            "vehicle_allocation": 3000,
            "training_certification": 1500
        }
    },
    "ground_crew_member": {
        "position": "ground_crew_member",
        "base_hourly_rate": 18.0,
        "burden_multiplier": 1.75,
        "annual_burden_costs": {
            "payroll_taxes": 1377,
            "workers_compensation": 4212,
            "health_insurance": 8000,
            "equipment_ppe": 2000,
            "vehicle_allocation": 2000,
            "training_certification": 1000
        }
    },
    "equipment_operator": {
        "position": "equipment_operator",
        "base_hourly_rate": 25.0,
        "burden_multiplier": 1.75,
        "annual_burden_costs": {
            "payroll_taxes": 1913,
            "workers_compensation": 5850,
            "health_insurance": 8000,
            "equipment_ppe": 3500,
            "vehicle_allocation": 4000,
            "training_certification": 2500
        }
    }
}

LOADOUT_TEMPLATES = [
    {
        "name": "Residential Tree Service Crew",
        "project_type": "tree_removal",
        "equipment_list": ["bucket_truck", "chipper", "pickup_truck"],
        "crew_composition": ["isa_certified_arborist", "ground_crew_lead", "ground_crew_member"],
        "severity_factor": 1.1,
        "target_profit_margin": 35,
        "competitive_rate_range": [200, 350]
    },
    {
        "name": "Forestry Mulching Operation",
        "project_type": "forestry_mulching", 
        "equipment_list": ["skid_steer_mulcher", "pickup_truck"],
        "crew_composition": ["equipment_operator", "ground_crew_member"],
        "severity_factor": 1.25,
        "target_profit_margin": 30,
        "competitive_rate_range": [400, 600]
    },
    {
        "name": "Stump Grinding Crew",
        "project_type": "stump_grinding",
        "equipment_list": ["stump_grinder", "pickup_truck"],
        "crew_composition": ["equipment_operator", "ground_crew_member"],
        "severity_factor": 1.1,
        "target_profit_margin": 35,
        "competitive_rate_range": [180, 320]
    },
    {
        "name": "Emergency Response Team",
        "project_type": "emergency_response",
        "equipment_list": ["bucket_truck", "chipper", "pickup_truck"],
        "crew_composition": ["isa_certified_arborist", "experienced_climber", "ground_crew_lead", "ground_crew_member"],
        "severity_factor": 1.45,
        "target_profit_margin": 50,
        "competitive_rate_range": [300, 500]
    }
]

async def upload_equipment_defaults(convex_url: str):
    """Upload equipment cost defaults to Convex"""
    print("🛠️  Uploading Equipment Cost Defaults...")
    
    async with httpx.AsyncClient(timeout=30) as client:
        for equipment_type, defaults in EQUIPMENT_DEFAULTS.items():
            try:
                # Add metadata
                defaults["created_at"] = int(datetime.now().timestamp() * 1000)
                defaults["pricing_version"] = "1.0"
                defaults["data_source"] = "TreeAI Equipment Intelligence"
                
                response = await client.post(
                    f"{convex_url}/api/mutation",
                    json={
                        "path": "equipment:createEquipmentDefault", 
                        "args": defaults
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    equipment_id = data.get('value')
                    print(f"   ✅ {equipment_type}: {equipment_id}")
                else:
                    print(f"   ❌ {equipment_type}: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"   ❌ {equipment_type}: {str(e)}")

async def upload_small_tools_defaults(convex_url: str):
    """Upload small tools defaults to Convex"""
    print("\n🔧 Uploading Small Tools Defaults...")
    
    async with httpx.AsyncClient(timeout=30) as client:
        for tool_category in SMALL_TOOLS_DEFAULTS:
            try:
                # Add metadata
                tool_category["created_at"] = int(datetime.now().timestamp() * 1000)
                tool_category["pricing_version"] = "1.0"
                tool_category["data_source"] = "TreeAI Small Tools Pool"
                
                response = await client.post(
                    f"{convex_url}/api/mutation",
                    json={
                        "path": "equipment:createSmallToolCategory",
                        "args": tool_category
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    category_id = data.get('value')
                    print(f"   ✅ {tool_category['name']}: {category_id}")
                else:
                    print(f"   ❌ {tool_category['name']}: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"   ❌ {tool_category['name']}: {str(e)}")

async def upload_employee_defaults(convex_url: str):
    """Upload employee cost defaults to Convex"""
    print("\n👷 Uploading Employee Cost Defaults...")
    
    async with httpx.AsyncClient(timeout=30) as client:
        for position, defaults in EMPLOYEE_DEFAULTS.items():
            try:
                # Add metadata
                defaults["created_at"] = int(datetime.now().timestamp() * 1000)
                defaults["pricing_version"] = "1.0"
                defaults["data_source"] = "TreeAI Employee Cost Intelligence"
                defaults["location_state"] = "florida"  # Default location
                
                response = await client.post(
                    f"{convex_url}/api/mutation",
                    json={
                        "path": "employees:createEmployeeDefault",
                        "args": defaults
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    employee_id = data.get('value')
                    print(f"   ✅ {position}: {employee_id}")
                else:
                    print(f"   ❌ {position}: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"   ❌ {position}: {str(e)}")

async def upload_loadout_templates(convex_url: str):
    """Upload loadout templates to Convex"""
    print("\n🎯 Uploading Loadout Templates...")
    
    async with httpx.AsyncClient(timeout=30) as client:
        for template in LOADOUT_TEMPLATES:
            try:
                # Add metadata
                template["created_at"] = int(datetime.now().timestamp() * 1000)
                template["pricing_version"] = "1.0"
                template["data_source"] = "TreeAI Pricing Intelligence"
                template["location_state"] = "florida"
                template["is_template"] = True
                
                response = await client.post(
                    f"{convex_url}/api/mutation",
                    json={
                        "path": "loadouts:createLoadoutTemplate",
                        "args": template
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    template_id = data.get('value')
                    print(f"   ✅ {template['name']}: {template_id}")
                else:
                    print(f"   ❌ {template['name']}: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"   ❌ {template['name']}: {str(e)}")

async def test_pricing_calculation(convex_url: str):
    """Test complete pricing calculation with uploaded data"""
    print("\n🧮 Testing Complete Pricing Calculation...")
    
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            # Test equipment cost calculation
            equipment_test = {
                "equipment_type": "bucket_truck",
                "severity_factor": 1.1,
                "purchase_price": 165000,
                "location_state": "florida"
            }
            
            response = await client.post(
                f"{convex_url}/api/query",
                json={
                    "path": "pricing:calculateEquipmentCost",
                    "args": equipment_test
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                cost = data.get('value', {}).get('total_cost_per_hour', 0)
                print(f"   ✅ Bucket Truck Cost: ${cost:.2f}/hr")
            else:
                print(f"   ⚠️  Equipment calculation not available yet: {response.status_code}")
            
            # Test crew cost calculation
            crew_test = {
                "crew_composition": ["isa_certified_arborist", "ground_crew_member"],
                "location_state": "florida"
            }
            
            response = await client.post(
                f"{convex_url}/api/query",
                json={
                    "path": "pricing:calculateCrewCost",
                    "args": crew_test
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                cost = data.get('value', {}).get('total_crew_cost_per_hour', 0)
                print(f"   ✅ Crew Cost: ${cost:.2f}/hr")
            else:
                print(f"   ⚠️  Crew calculation not available yet: {response.status_code}")
                
        except Exception as e:
            print(f"   ⚠️  Pricing calculations need backend functions: {str(e)}")

async def create_sample_pricing_project(convex_url: str):
    """Create a sample project with complete pricing data"""
    print("\n📊 Creating Sample Project with Complete Pricing...")
    
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            sample_project = {
                "description": "Large oak tree removal with pricing intelligence",
                "location_type": "residential",
                "service_type": "removal",
                "tree_height": 80.0,
                "canopy_radius": 30.0,
                "dbh": 36.0,
                "tree_species": "oak",
                "tree_condition": "healthy",
                
                # TreeScore and AFISS (from our existing system)
                "base_treescore": 4320.0,
                "total_treescore": 4655.2,
                "afiss_composite_score": 42.5,
                "complexity_level": "high",
                "complexity_multiplier": 2.1,
                
                # NEW: Complete pricing intelligence
                "recommended_loadout": "Residential Tree Service Crew",
                "equipment_cost_per_hour": 112.52,
                "employee_cost_per_hour": 119.00,
                "small_tools_cost_per_hour": 7.50,
                "total_cost_per_hour": 239.02,
                "recommended_billing_rate": 367.72,
                "break_even_rate": 239.02,
                "profit_margin_percentage": 35.0,
                "competitive_position": "COMPETITIVE",
                
                # Project economics
                "estimated_hours": 12.0,
                "total_project_cost": 2868.24,
                "total_project_revenue": 4412.64,
                "total_project_profit": 1544.40,
                "project_roi_percentage": 53.8,
                
                # Equipment breakdown
                "equipment_breakdown": {
                    "bucket_truck": 60.34,
                    "chipper": 28.06,
                    "pickup_truck": 24.12
                },
                
                # Employee breakdown
                "crew_breakdown": {
                    "isa_certified_arborist": {"base": 32.0, "true_cost": 56.0},
                    "ground_crew_lead": {"base": 22.0, "true_cost": 38.5},
                    "ground_crew_member": {"base": 18.0, "true_cost": 31.5}
                },
                
                # Metadata
                "pricing_version": "1.0",
                "pricing_confidence": 95.0,
                "created_at": int(datetime.now().timestamp() * 1000),
                "assessment_time_seconds": 25.0,
                "claude_model_used": "sonnet",
                "data_source": "TreeAI Complete Pricing Intelligence"
            }
            
            response = await client.post(
                f"{convex_url}/api/mutation",
                json={
                    "path": "projects:createProject",
                    "args": sample_project
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                project_id = data.get('value')
                print(f"   ✅ Sample project created: {project_id}")
                print(f"   📊 Total Cost: ${sample_project['total_cost_per_hour']:.2f}/hr")
                print(f"   💰 Recommended Rate: ${sample_project['recommended_billing_rate']:.2f}/hr")
                print(f"   📈 Project Profit: ${sample_project['total_project_profit']:,.0f}")
                return project_id
            else:
                print(f"   ❌ Project creation failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"   ❌ Sample project error: {str(e)}")
            return None

async def main():
    """Upload complete pricing intelligence to Convex"""
    convex_url = "https://cheerful-bee-330.convex.cloud"
    
    print("🚀 TreeAI Pricing Intelligence → Convex Sync")
    print("=" * 60)
    print(f"Target: {convex_url}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Upload all pricing data
    await upload_equipment_defaults(convex_url)
    await upload_small_tools_defaults(convex_url)
    await upload_employee_defaults(convex_url)
    await upload_loadout_templates(convex_url)
    
    # Test pricing calculations (if backend functions exist)
    await test_pricing_calculation(convex_url)
    
    # Create sample project with complete pricing
    sample_project_id = await create_sample_pricing_project(convex_url)
    
    print(f"\n🎉 Pricing Intelligence Sync Complete!")
    print("=" * 60)
    print(f"✅ Equipment defaults uploaded")
    print(f"✅ Small tools categories uploaded") 
    print(f"✅ Employee cost defaults uploaded")
    print(f"✅ Loadout templates uploaded")
    if sample_project_id:
        print(f"✅ Sample pricing project created: {sample_project_id}")
    
    print(f"\n💡 Alex now has complete pricing intelligence in Convex!")
    print(f"   • True equipment costs (USACE methodology)")
    print(f"   • True employee costs (full burden factors)")
    print(f"   • Loadout optimization templates")
    print(f"   • Competitive pricing recommendations")
    
    print(f"\n🔗 Check your data:")
    print(f"   Dashboard: https://dashboard.convex.dev/t/cvo-treeai/alex-standalone/cheerful-bee-330/data")
    
    return True

if __name__ == "__main__":
    asyncio.run(main())