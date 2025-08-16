#!/usr/bin/env python3
"""
Test Convex AI Integration
Checks if the endpoint exists and what functionality is available
"""

import asyncio
import httpx
import json

async def test_convex_ai_endpoints():
    """Test Convex AI endpoint availability"""
    convex_url = "https://cheerful-bee-330.convex.cloud"
    
    print("🔍 Testing Convex AI Integration")
    print("=" * 40)
    
    # Test 1: Check if basic Convex is working
    try:
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
                print(f"✅ Basic Convex connection: OK")
                print(f"📊 Current projects in database: {total}")
            else:
                print(f"❌ Basic Convex connection failed: {response.status_code}")
                return
                
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return
    
    # Test 2: Check if AI assessment endpoint exists
    print(f"\n🧠 Testing AI Assessment Endpoint")
    print("-" * 30)
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{convex_url}/api/action",
                json={
                    "path": "alex_ai_assessment:performAIAssessment",
                    "args": {
                        "projectDescription": "Test project for endpoint check",
                        "requestId": "test_123"
                    }
                }
            )
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ AI Assessment endpoint exists")
                print(f"Response: {json.dumps(result, indent=2)}")
            elif response.status_code == 400:
                error_data = response.text
                print(f"⚠️  Endpoint exists but has configuration issues:")
                print(f"Error: {error_data}")
                if "ANTHROPIC_API_KEY" in error_data:
                    print(f"💡 Solution: Add ANTHROPIC_API_KEY to Convex environment variables")
            else:
                print(f"❌ AI Assessment endpoint not found: {response.status_code}")
                print(f"Response: {response.text}")
                
    except Exception as e:
        print(f"❌ AI endpoint test error: {e}")
    
    # Test 3: Check available Convex functions
    print(f"\n📋 Available Convex Functions")
    print("-" * 30)
    
    # Try some known endpoints to see what's available
    test_endpoints = [
        "projects:createProject",
        "projects:getProjectsByStatus",
        "alex_ai_assessment:getAIAssessments",
        "alex_ai_assessment:storeAIAssessment"
    ]
    
    for endpoint in test_endpoints:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                # For mutations/actions, we'll send minimal test data
                if "getProjectsByStatus" in endpoint:
                    response = await client.post(
                        f"{convex_url}/api/query",
                        json={"path": endpoint, "args": {}}
                    )
                elif "getAIAssessments" in endpoint:
                    response = await client.post(
                        f"{convex_url}/api/mutation",
                        json={"path": endpoint, "args": {"limit": 1}}
                    )
                else:
                    # Skip testing endpoints that require data for now
                    print(f"⏭️  Skipping {endpoint} (requires data)")
                    continue
                
                if response.status_code == 200:
                    print(f"✅ {endpoint} - Available")
                elif response.status_code == 400:
                    print(f"⚠️  {endpoint} - Exists but needs proper args")
                else:
                    print(f"❌ {endpoint} - Not found ({response.status_code})")
                    
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")
    
    print(f"\n📝 Summary & Next Steps")
    print("=" * 40)
    print(f"1. ✅ Basic Convex integration is working")
    print(f"2. ⚠️  AI endpoint needs to be deployed to Convex")
    print(f"3. 🔑 ANTHROPIC_API_KEY needs to be added to Convex environment")
    print(f"4. 🚀 After deployment, Alex will have full AI capabilities")
    
    print(f"\n💡 To complete the setup:")
    print(f"   1. Deploy alex_ai_assessment.ts to Convex")
    print(f"   2. Add ANTHROPIC_API_KEY to Convex environment variables")
    print(f"   3. Test with alex_convex_ai.py")

if __name__ == "__main__":
    asyncio.run(test_convex_ai_endpoints())