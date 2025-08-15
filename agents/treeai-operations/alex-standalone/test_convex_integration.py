#!/usr/bin/env python3
"""
Test Alex-Convex Integration
Demonstrates Alex agent syncing assessments to Convex backend
"""

import asyncio
import os
import sys
from pathlib import Path

# Add current directory to path so we can import our modules
sys.path.insert(0, str(Path(__file__).parent))

from alex_anthropic import create_alex_agent
from convex_client import create_alex_convex_integration

async def test_convex_connection():
    """Test basic Convex connection"""
    print("🔗 Testing Convex Connection...")
    
    try:
        # Initialize Convex integration
        convex_url = "https://cheerful-bee-330.convex.cloud"
        integration = await create_alex_convex_integration(convex_url, verbose=True)
        
        # Test dashboard metrics
        dashboard = await integration.client.get_dashboard_metrics()
        print(f"✅ Connected to Convex successfully!")
        print(f"📊 Dashboard: {dashboard.get('total_projects', 0)} total projects")
        
        await integration.close()
        return True
        
    except Exception as e:
        print(f"❌ Convex connection failed: {str(e)}")
        return False

async def test_alex_with_convex():
    """Test Alex agent with full Convex integration"""
    print("\n🤖 Testing Alex Agent with Convex Integration...")
    
    # Check if ANTHROPIC_API_KEY is set
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY environment variable not set")
        print("   Set it with: export ANTHROPIC_API_KEY='your-key-here'")
        return False
    
    try:
        # Initialize Alex with Convex
        afiss_path = "/Users/ain/TreeAI-Agent-Kit/AFISS"
        convex_url = "https://cheerful-bee-330.convex.cloud"
        
        print(f"📁 AFISS Path: {afiss_path}")
        print(f"🔗 Convex URL: {convex_url}")
        
        alex = await create_alex_agent(
            afiss_data_path=afiss_path,
            convex_url=convex_url,
            convex_verbose=True
        )
        
        print("✅ Alex agent initialized with Convex integration!")
        
        # Test project assessment
        test_project = """
        Medium complexity tree removal in residential area. 
        60ft oak tree with 25ft canopy radius, 24 inch DBH. 
        Located 15 feet from house, minor power line clearance needed.
        Standard driveway access on flat terrain.
        """
        
        print(f"\n📝 Assessing test project...")
        print(f"Project: {test_project.strip()}")
        
        # Perform assessment (this should sync to Convex automatically)
        assessment = await alex.assess_complete_project(test_project)
        
        print(f"\n📋 Assessment Complete!")
        print("="*80)
        print(assessment)
        print("="*80)
        
        # Show model usage stats
        print(f"\n📊 Model Usage Stats:")
        for model, stats in alex.model_manager.usage_stats.items():
            print(f"   {model.value}: {stats['requests']} requests, {stats['total_tokens']} tokens")
        
        # Close Convex connection
        if alex.convex_integration:
            await alex.convex_integration.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Alex+Convex test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_convex_data_retrieval():
    """Test retrieving data from Convex"""
    print("\n📊 Testing Convex Data Retrieval...")
    
    try:
        # Connect to Convex
        convex_url = "https://cheerful-bee-330.convex.cloud"
        integration = await create_alex_convex_integration(convex_url, verbose=True)
        
        # Get recent projects
        projects = await integration.client.list_projects(limit=5)
        print(f"📋 Found {len(projects)} recent projects:")
        
        for i, project in enumerate(projects, 1):
            print(f"   {i}. {project.get('description', 'No description')[:50]}...")
            print(f"      Complexity: {project.get('complexity_level', 'unknown')}")
            print(f"      AFISS Score: {project.get('afiss_composite_score', 0):.1f}%")
        
        # Get AFISS performance analytics
        analytics = await integration.client.get_factor_performance_analytics()
        if analytics:
            summary = analytics.get('summary', {})
            print(f"\n📈 AFISS Performance Analytics:")
            print(f"   Total factors used: {summary.get('total_factors', 0)}")
            print(f"   Trigger rate: {summary.get('trigger_rate', 0)*100:.1f}%")
            print(f"   Accuracy rate: {summary.get('accuracy_rate', 0)*100:.1f}%")
        
        await integration.close()
        return True
        
    except Exception as e:
        print(f"❌ Data retrieval test failed: {str(e)}")
        return False

async def main():
    """Run all integration tests"""
    print("🧪 Alex-Convex Integration Test Suite")
    print("="*50)
    
    # Test 1: Basic Convex connection
    test1_passed = await test_convex_connection()
    
    # Test 2: Alex with Convex (only if connection works)
    test2_passed = False
    if test1_passed:
        test2_passed = await test_alex_with_convex()
    else:
        print("⏭️  Skipping Alex test due to connection failure")
    
    # Test 3: Data retrieval (only if previous tests work)
    test3_passed = False
    if test1_passed:
        test3_passed = await test_convex_data_retrieval()
    else:
        print("⏭️  Skipping data retrieval test due to connection failure")
    
    # Summary
    print(f"\n🏁 Test Results Summary:")
    print(f"   Convex Connection: {'✅ PASS' if test1_passed else '❌ FAIL'}")
    print(f"   Alex Integration: {'✅ PASS' if test2_passed else '❌ FAIL'}")
    print(f"   Data Retrieval: {'✅ PASS' if test3_passed else '❌ FAIL'}")
    
    if all([test1_passed, test2_passed, test3_passed]):
        print(f"\n🎉 All tests passed! Alex-Convex integration is working perfectly.")
        return 0
    else:
        print(f"\n⚠️  Some tests failed. Check the error messages above.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)