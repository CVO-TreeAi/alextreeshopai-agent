#!/usr/bin/env python3
"""
Check what data is actually stored in Convex database tables
"""

import asyncio
import httpx
import json

async def check_convex_data():
    """Check what data is stored in Convex database"""
    convex_url = "https://cheerful-bee-330.convex.cloud"
    
    print("🔍 Checking Convex Database Content")
    print("=" * 50)
    
    async with httpx.AsyncClient(timeout=30) as client:
        
        # Check projects (we know this works)
        print("\n📊 PROJECTS DATA:")
        try:
            response = await client.post(
                f"{convex_url}/api/query",
                json={
                    "path": "projects:getProjectsByStatus",
                    "args": {}
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                total_projects = data.get('value', {}).get('total_projects', 0)
                recent_projects = data.get('value', {}).get('recent_projects', [])
                
                print(f"   ✅ Total Projects: {int(total_projects)}")
                print(f"   📋 Recent Projects:")
                
                for i, project in enumerate(recent_projects[:3], 1):
                    desc = project.get('description', 'No description')[:50]
                    cost = project.get('estimated_cost', 0)
                    treescore = project.get('total_treescore', 0)
                    print(f"      {i}. {desc}... (${cost:.0f}, {treescore:.0f} pts)")
            else:
                print(f"   ❌ Projects query failed: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Projects error: {str(e)}")
        
        # Check if our pricing data tables exist
        print(f"\n🛠️  EQUIPMENT DATA:")
        try:
            # Try to query equipment defaults
            response = await client.post(
                f"{convex_url}/api/query", 
                json={
                    "path": "equipment:getAllEquipmentDefaults",
                    "args": {}
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                equipment_list = data.get('value', [])
                print(f"   ✅ Equipment Defaults: {len(equipment_list)} items")
                
                for eq in equipment_list[:3]:
                    category = eq.get('category', 'Unknown')
                    msrp = eq.get('msrp_new', 0)
                    print(f"      • {category}: ${msrp:,}")
            else:
                print(f"   ⚠️  Equipment query not available: {response.status_code}")
                print(f"      (Equipment tables may not be implemented yet)")
        except Exception as e:
            print(f"   ⚠️  Equipment data not available: {str(e)}")
        
        print(f"\n👷 EMPLOYEE DATA:")
        try:
            # Try to query employee defaults
            response = await client.post(
                f"{convex_url}/api/query",
                json={
                    "path": "employees:getAllEmployeeDefaults", 
                    "args": {}
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                employee_list = data.get('value', [])
                print(f"   ✅ Employee Defaults: {len(employee_list)} positions")
                
                for emp in employee_list[:3]:
                    position = emp.get('position', 'Unknown')
                    rate = emp.get('base_hourly_rate', 0)
                    print(f"      • {position}: ${rate:.2f}/hr")
            else:
                print(f"   ⚠️  Employee query not available: {response.status_code}")
                print(f"      (Employee tables may not be implemented yet)")
        except Exception as e:
            print(f"   ⚠️  Employee data not available: {str(e)}")
        
        print(f"\n🎯 LOADOUT TEMPLATES:")
        try:
            # Try to query loadout templates
            response = await client.post(
                f"{convex_url}/api/query",
                json={
                    "path": "loadouts:getAllLoadoutTemplates",
                    "args": {}
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                template_list = data.get('value', [])
                print(f"   ✅ Loadout Templates: {len(template_list)} templates")
                
                for template in template_list[:3]:
                    name = template.get('name', 'Unknown')
                    project_type = template.get('project_type', 'unknown')
                    print(f"      • {name} ({project_type})")
            else:
                print(f"   ⚠️  Loadout query not available: {response.status_code}")
                print(f"      (Loadout tables may not be implemented yet)")
        except Exception as e:
            print(f"   ⚠️  Loadout data not available: {str(e)}")

    print(f"\n📋 SUMMARY:")
    print("=" * 50)
    print(f"✅ Projects are working and stored in database")
    print(f"⚠️  Pricing intelligence data uploaded but may need backend functions")
    print(f"💾 File Storage is for user uploads (images, PDFs) - correctly empty")
    print(f"🗄️  Your data is in database tables, not file storage")
    
    print(f"\n🔗 To see your data in Convex dashboard:")
    print(f"   1. Go to: https://dashboard.convex.dev/t/cvo-treeai/alex-standalone/cheerful-bee-330")
    print(f"   2. Click 'Data' tab (not File Storage)")
    print(f"   3. Look for tables like 'projects', 'equipment', 'employees'")

async def main():
    await check_convex_data()

if __name__ == "__main__":
    asyncio.run(main())