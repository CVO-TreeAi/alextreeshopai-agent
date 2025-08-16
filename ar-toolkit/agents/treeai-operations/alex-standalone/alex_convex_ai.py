#!/usr/bin/env python3
"""
Alex TreeAI Agent - Convex AI Integration
Uses Convex backend with Anthropic API key for AI assessments
"""

import asyncio
import httpx
import json
from typing import Dict, Any, Optional
from datetime import datetime

class AlexConvexAI:
    """Alex agent using Convex backend for AI assessments"""
    
    def __init__(self, convex_url: str = "https://cheerful-bee-330.convex.cloud"):
        self.convex_url = convex_url
        
    async def assess_project(self, project_description: str, request_id: Optional[str] = None) -> Dict[str, Any]:
        """Perform AI-powered project assessment via Convex"""
        print(f"🤖 Alex analyzing project via Convex AI...")
        print(f"📝 Description: {project_description}")
        
        try:
            start_time = datetime.now()
            
            # Call Convex AI assessment endpoint
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    f"{self.convex_url}/api/action",
                    json={
                        "path": "alex_ai_assessment:performAndStoreAssessment",
                        "args": {
                            "projectDescription": project_description,
                            "requestId": request_id or f"alex_{int(datetime.now().timestamp())}"
                        }
                    }
                )
                
                processing_time = (datetime.now() - start_time).total_seconds()
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if result.get('status') == 'success':
                        assessment = result['assessment']
                        storage_info = result['storage']
                        
                        print(f"✅ AI Assessment complete! ({processing_time:.1f}s)")
                        print(f"🆔 Assessment ID: {storage_info.get('assessment_id')}")
                        
                        if storage_info.get('project_id'):
                            print(f"📊 Project ID: {storage_info.get('project_id')}")
                        
                        return {
                            "status": "success",
                            "assessment": assessment,
                            "storage": storage_info,
                            "processing_time": processing_time,
                        }
                    else:
                        print(f"❌ Assessment failed: {result.get('error', 'Unknown error')}")
                        return {
                            "status": "error",
                            "error": result.get('error', 'Unknown error'),
                            "processing_time": processing_time,
                        }
                else:
                    print(f"❌ HTTP Error: {response.status_code}")
                    return {
                        "status": "error",
                        "error": f"HTTP {response.status_code}: {response.text}",
                        "processing_time": processing_time,
                    }
                    
        except Exception as e:
            print(f"❌ Assessment failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "processing_time": 0,
            }
    
    def print_assessment(self, result: Dict[str, Any]):
        """Print a formatted assessment report"""
        
        if result.get('status') != 'success':
            print(f"\n❌ Assessment Failed: {result.get('error', 'Unknown error')}")
            return
            
        assessment = result.get('assessment', {})
        
        # Handle fallback responses
        if assessment.get('fallback'):
            print(f"\n{'='*60}")
            print(f"🌳 ALEX AI ASSESSMENT - FALLBACK MODE")
            print(f"{'='*60}")
            print(f"⚠️  AI parsing failed, showing raw response:")
            print(f"{assessment.get('raw_assessment', 'No response available')}")
            return
        
        print(f"\n{'='*60}")
        print(f"🌳 ALEX AI ASSESSMENT REPORT")
        print(f"{'='*60}")
        
        print(f"\n📝 PROJECT DESCRIPTION:")
        print(f"   {assessment.get('project_description', 'No description')}")
        
        # Tree measurements
        tree_data = assessment.get('tree_measurements', {})
        if tree_data:
            print(f"\n🌲 TREE ANALYSIS:")
            print(f"   Height: {tree_data.get('height', 0):.0f} ft")
            print(f"   Canopy: {tree_data.get('canopy_radius', 0):.0f} ft radius")
            print(f"   DBH: {tree_data.get('dbh', 0):.0f} inches")
            print(f"   Species: {tree_data.get('species', 'Unknown')}")
            print(f"   Condition: {tree_data.get('condition', 'Unknown')}")
        
        # Service details
        service_data = assessment.get('service_details', {})
        if service_data:
            print(f"   Service: {service_data.get('service_type', 'Unknown').title()}")
            print(f"   Location: {service_data.get('location_type', 'Unknown').title()}")
        
        # TreeScore
        treescore_data = assessment.get('treescore', {})
        if treescore_data:
            print(f"\n🎯 TREESCORE CALCULATION:")
            print(f"   Base TreeScore: {treescore_data.get('base_score', 0):.1f}")
            print(f"   Total TreeScore: {treescore_data.get('total_score', 0):.1f}")
        
        # AFISS Assessment
        afiss_data = assessment.get('afiss_assessment', {})
        if afiss_data:
            print(f"\n⚠️  AFISS RISK ASSESSMENT:")
            print(f"   Composite Score: {afiss_data.get('composite_score', 0):.1f}%")
            print(f"   └─ Access: {afiss_data.get('access_score', 0):.1f}")
            print(f"   └─ Fall Zone: {afiss_data.get('fall_zone_score', 0):.1f}")
            print(f"   └─ Interference: {afiss_data.get('interference_score', 0):.1f}")
            print(f"   └─ Severity: {afiss_data.get('severity_score', 0):.1f}")
            print(f"   └─ Site Conditions: {afiss_data.get('site_conditions_score', 0):.1f}")
        
        # Complexity
        complexity_data = assessment.get('complexity', {})
        if complexity_data:
            print(f"\n🔧 COMPLEXITY ANALYSIS:")
            print(f"   Level: {complexity_data.get('level', 'Unknown').upper()}")
            print(f"   Multiplier: {complexity_data.get('multiplier', 1.0):.2f}x")
            factors = complexity_data.get('factors', [])
            if factors:
                print(f"   Factors:")
                for factor in factors:
                    print(f"   • {factor}")
        
        # Business estimates
        business_data = assessment.get('business_estimates', {})
        if business_data:
            print(f"\n👥 CREW REQUIREMENTS:")
            print(f"   Type: {business_data.get('crew_type', 'Unknown').title()}")
            print(f"   ISA Certified Required: {'Yes' if business_data.get('isa_certified_required') else 'No'}")
            
            equipment = business_data.get('equipment_required', [])
            if equipment:
                print(f"\n🛠️  EQUIPMENT & SAFETY:")
                print(f"   Equipment: {', '.join(equipment)}")
            
            protocols = business_data.get('safety_protocols', [])
            if protocols:
                print(f"   Safety Protocols: {', '.join(protocols)}")
            
            print(f"\n💰 BUSINESS ESTIMATES:")
            print(f"   Estimated Hours: {business_data.get('estimated_hours', 0):.1f}")
            print(f"   Estimated Cost: ${business_data.get('estimated_cost', 0):,.0f}")
        
        # AI Model info
        print(f"\n🧠 AI ANALYSIS:")
        print(f"   Model: {assessment.get('model_used', 'Unknown')}")
        print(f"   Processing Time: {result.get('processing_time', 0):.1f} seconds")
        
        # Reasoning (if available)
        reasoning = assessment.get('reasoning')
        if reasoning:
            print(f"\n💭 AI REASONING:")
            print(f"   {reasoning}")
        
        print(f"\n{'='*60}")
    
    async def get_assessment_history(self, limit: int = 5) -> Dict[str, Any]:
        """Get recent AI assessment history"""
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{self.convex_url}/api/mutation",
                    json={
                        "path": "alex_ai_assessment:getAIAssessments",
                        "args": {"limit": limit}
                    }
                )
                
                if response.status_code == 200:
                    return {"status": "success", "assessments": response.json()}
                else:
                    return {"status": "error", "error": f"HTTP {response.status_code}"}
                    
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def interactive_demo(self):
        """Run interactive AI assessment demo"""
        
        print("🌳 Welcome to Alex TreeAI Operations Agent with AI!")
        print("=" * 50)
        print("I'm Alex, powered by Claude AI through Convex backend.")
        print("I can assess any tree service project with real AI intelligence.")
        print("\nType 'quit' to exit, or describe a tree service project...")
        
        while True:
            try:
                print(f"\n🤖 Alex: What tree service project would you like me to assess?")
                user_input = input("You: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("🌳 Thanks for using Alex! Have a great day!")
                    break
                    
                if not user_input:
                    continue
                    
                print(f"\n🔍 Calling AI assessment via Convex...")
                result = await self.assess_project(user_input)
                self.print_assessment(result)
                
                # Ask if they want to see another example
                print(f"\n💡 Try another assessment? (Or type 'quit' to exit)")
                
            except KeyboardInterrupt:
                print(f"\n\n🌳 Thanks for using Alex! Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                print("Please try again...")

async def main():
    """Run Alex with Convex AI demo"""
    alex = AlexConvexAI()
    
    print("Choose demo mode:")
    print("1. Interactive mode - Chat with AI Alex")
    print("2. Example assessments - See AI Alex in action")
    print("3. Assessment history - View recent AI assessments")
    
    try:
        choice = input("Enter choice (1, 2, or 3): ").strip()
    except (EOFError, KeyboardInterrupt):
        choice = "2"  # Default to examples
    
    if choice == "1":
        await alex.interactive_demo()
    elif choice == "3":
        print(f"\n📊 Recent AI Assessments:")
        print("=" * 40)
        history = await alex.get_assessment_history()
        if history['status'] == 'success':
            assessments = history['assessments']
            for i, assessment in enumerate(assessments, 1):
                timestamp = datetime.fromtimestamp(assessment['assessment_timestamp'] / 1000)
                print(f"{i}. {assessment['project_description'][:50]}...")
                print(f"   Model: {assessment['model_used']} | {timestamp.strftime('%Y-%m-%d %H:%M')}")
        else:
            print(f"❌ Error: {history['error']}")
    else:
        # Show example assessments
        examples = [
            "Large oak tree removal in residential neighborhood. Tree is 65 feet tall with power lines overhead and close to house.",
            "Emergency storm-damaged tree blocking commercial driveway. High priority removal needed.",
            "Simple backyard maple trimming, easy access, no obstacles.",
            "80-foot pine removal near power lines requiring crane and traffic control."
        ]
        
        print(f"\n🌳 Alex AI Assessment Examples:")
        print("=" * 40)
        
        for i, example in enumerate(examples, 1):
            print(f"\n📋 AI ASSESSMENT {i} of {len(examples)}:")
            result = await alex.assess_project(example)
            alex.print_assessment(result)
            
            if i < len(examples):
                print(f"\n{'─' * 60}")
                print("Moving to next AI assessment...")
                print(f"{'─' * 60}")

if __name__ == "__main__":
    asyncio.run(main())