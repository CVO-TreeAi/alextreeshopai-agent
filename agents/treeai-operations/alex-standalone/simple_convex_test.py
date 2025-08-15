#!/usr/bin/env python3
"""
Simple Convex Integration Test
Just test basic connection without heavy dependencies
"""

import asyncio
import httpx
import json

async def test_basic_convex_connection():
    """Test basic connection to Convex"""
    convex_url = "https://cheerful-bee-330.convex.cloud"
    
    print("🔗 Testing basic Convex connection...")
    print(f"   URL: {convex_url}")
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Test basic dashboard query  
            response = await client.post(
                f"{convex_url}/api/query",
                json={
                    "path": "projects:getProjectsByStatus",
                    "args": {}
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Connection successful!")
                print(f"📊 Response: {json.dumps(data, indent=2)}")
                return True
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

async def test_create_sample_project():
    """Test creating a sample project"""
    convex_url = "https://cheerful-bee-330.convex.cloud"
    
    print("\n📝 Testing project creation...")
    
    try:
        sample_project = {
            "description": "Test oak tree removal",
            "location_type": "residential",
            "service_type": "removal",
            "tree_height": 50.0,
            "canopy_radius": 20.0,
            "dbh": 24.0,
            "tree_species": "oak",
            "tree_condition": "healthy",
            "base_treescore": 100.0,
            "total_treescore": 125.0,
            "afiss_composite_score": 25.0,
            "access_score": 5.0,
            "fall_zone_score": 8.0,
            "interference_score": 6.0,
            "severity_score": 4.0,
            "site_conditions_score": 2.0,
            "complexity_level": "moderate",
            "complexity_multiplier": 1.5,
            "estimated_hours": 8.0,
            "estimated_cost": 1500.0,
            "crew_type_recommended": "experienced",
            "equipment_required": ["chainsaw", "chipper", "crane"],
            "safety_protocols": ["OSHA protocols", "traffic control"],
            "isa_certified_required": False,
            "claude_model_used": "sonnet",
            "assessment_time_seconds": 15.0
        }
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{convex_url}/api/mutation",
                json={
                    "path": "projects:createProject",
                    "args": sample_project
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Project created successfully!")
                print(f"📄 Full response: {json.dumps(data, indent=2)}")
                
                # Extract project ID from Convex response format
                project_id = data.get('value') or data.get('data')
                print(f"🆔 Project ID: {project_id}")
                return project_id
            else:
                print(f"❌ Project creation failed: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Project creation error: {str(e)}")
        return None

async def main():
    """Run simple tests"""
    print("🧪 Simple Convex Integration Test")
    print("="*50)
    
    # Test 1: Basic connection
    connection_ok = await test_basic_convex_connection()
    
    if connection_ok:
        # Test 2: Create a project
        project_id = await test_create_sample_project()
        
        if project_id:
            print(f"\n🎉 All tests passed!")
            print(f"✅ Convex backend is fully operational")
            print(f"✅ Schema deployed correctly")
            print(f"✅ API functions working")
            print(f"\n🔗 Check your dashboard: https://dashboard.convex.dev/t/cvo-treeai/alex-standalone/cheerful-bee-330/data")
        else:
            print(f"\n⚠️  Connection works but project creation failed")
    else:
        print(f"\n❌ Connection test failed")

if __name__ == "__main__":
    asyncio.run(main())