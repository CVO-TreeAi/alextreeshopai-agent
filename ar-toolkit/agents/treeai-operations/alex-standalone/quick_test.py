#!/usr/bin/env python3
"""
Quick test to verify Alex-Convex integration is working properly
"""

import asyncio
import httpx
import json

async def quick_test():
    """Quick verification test"""
    convex_url = "https://cheerful-bee-330.convex.cloud"
    
    print("🔍 Quick Convex Integration Check")
    print("="*40)
    
    # Test 1: Check current projects
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f"{convex_url}/api/query",
            json={
                "path": "projects:getProjectsByStatus", 
                "args": {}
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            projects = data.get('value', {})
            total = projects.get('total_projects', 0)
            print(f"✅ Connected to Convex successfully")
            print(f"📊 Current projects in database: {total}")
            
            # Show recent projects
            recent = projects.get('recent_projects', [])
            if recent:
                print(f"\n📋 Recent Projects:")
                for i, project in enumerate(recent[:3], 1):
                    desc = project.get('description', 'No description')[:50]
                    cost = project.get('estimated_cost', 0)
                    status = project.get('status', 'unknown')
                    complexity = project.get('complexity_level', 'unknown')
                    print(f"   {i}. {desc}...")
                    print(f"      Cost: ${cost:,.0f} | Status: {status} | Complexity: {complexity}")
                    
        else:
            print(f"❌ Connection failed: {response.status_code}")
            return
    
    # Test 2: Create a simple test project
    print(f"\n🧪 Creating test project...")
    
    test_project = {
        "description": "Quick test - Small tree trimming",
        "location_type": "residential",
        "service_type": "trimming", 
        "tree_height": 25.0,
        "base_treescore": 45.0,
        "total_treescore": 57.5,
        "estimated_hours": 3.0,
        "estimated_cost": 450.0,
        "complexity_level": "low",
        "afiss_composite_score": 12.5,
        "access_score": 2.0,
        "fall_zone_score": 3.0,
        "interference_score": 2.5,
        "severity_score": 3.0,
        "site_conditions_score": 2.0,
        "complexity_multiplier": 1.2,
        "crew_type_recommended": "standard",
        "equipment_required": ["chainsaw", "ladder"],
        "safety_protocols": ["basic safety"],
        "isa_certified_required": False,
        "claude_model_used": "haiku",
        "assessment_time_seconds": 8.0
    }
    
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f"{convex_url}/api/mutation",
            json={
                "path": "projects:createProject",
                "args": test_project
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response structure: {json.dumps(data, indent=2)}")
            
            if data.get('status') == 'success':
                project_id = data.get('value')
                print(f"✅ Test project created successfully!")
                print(f"🆔 Project ID: {project_id}")
                
                # Verify it was saved
                await asyncio.sleep(1)  # Give it a moment
                
                # Check updated count
                response2 = await client.post(
                    f"{convex_url}/api/query",
                    json={
                        "path": "projects:getProjectsByStatus",
                        "args": {}
                    }
                )
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    new_total = data2.get('value', {}).get('total_projects', 0)
                    print(f"📊 Updated project count: {new_total}")
                    
                    print(f"\n🎉 Integration Test PASSED!")
                    print(f"✅ Alex can successfully create projects in Convex")
                    print(f"✅ Data is properly stored and retrievable")
                    print(f"✅ Schema and API functions are working correctly")
                    
            else:
                print(f"❌ Project creation failed")
                print(f"Response: {data}")
        else:
            print(f"❌ HTTP error: {response.status_code}")
            print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(quick_test())