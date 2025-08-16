#!/usr/bin/env python3
"""
Interactive Alex Demo - Works without API keys
Shows Alex's assessment logic and capabilities
"""

import asyncio
import json
from typing import Dict, Any
from datetime import datetime

class AlexDemo:
    """Interactive Alex demonstration"""
    
    def __init__(self):
        self.convex_url = "https://cheerful-bee-330.convex.cloud"
        
    def simulate_assessment(self, project_input: str) -> Dict[str, Any]:
        """Simulate Alex's intelligent assessment logic"""
        
        # Analyze project description keywords
        description_lower = project_input.lower()
        
        # Determine service type
        if any(word in description_lower for word in ['removal', 'remove', 'cut down', 'take down']):
            service_type = "removal"
        elif any(word in description_lower for word in ['trim', 'prune', 'shape', 'reduce']):
            service_type = "trimming"
        elif any(word in description_lower for word in ['stump', 'grind', 'grinding']):
            service_type = "stump_grinding"
        elif any(word in description_lower for word in ['emergency', 'storm', 'fallen', 'down']):
            service_type = "emergency"
        else:
            service_type = "removal"
            
        # Determine location type
        location_type = "residential" if any(word in description_lower for word in ['residential', 'backyard', 'front yard', 'house', 'home']) else "commercial"
        
        # Extract height if mentioned
        import re
        height_match = re.search(r'(\d+)(?:\s*(?:ft|feet|foot))', description_lower)
        height = float(height_match.group(1)) if height_match else 45.0
        
        # Assess complexity factors
        complexity_factors = []
        access_score = 5.0
        fall_zone_score = 8.0
        interference_score = 6.0
        severity_score = 7.0
        site_conditions_score = 3.0
        
        # ACCESS assessment
        if any(word in description_lower for word in ['narrow', 'tight', 'difficult access', 'steep']):
            access_score += 8.0
            complexity_factors.append("Limited access")
        if any(word in description_lower for word in ['crane', 'lift', 'bucket truck']):
            access_score += 5.0
            complexity_factors.append("Special equipment needed")
            
        # FALL ZONE assessment  
        if any(word in description_lower for word in ['house', 'building', 'structure', 'near']):
            fall_zone_score += 10.0
            complexity_factors.append("Structures in fall zone")
        if any(word in description_lower for word in ['property', 'damage', 'close']):
            fall_zone_score += 5.0
            
        # INTERFERENCE assessment
        if any(word in description_lower for word in ['power line', 'electrical', 'utility', 'wire']):
            interference_score += 15.0
            complexity_factors.append("Power line interference")
        if any(word in description_lower for word in ['fence', 'pool', 'deck', 'patio']):
            interference_score += 8.0
            complexity_factors.append("Property obstacles")
            
        # SEVERITY assessment
        if any(word in description_lower for word in ['emergency', 'urgent', 'dangerous', 'hazard']):
            severity_score += 12.0
            complexity_factors.append("High urgency/danger")
        if any(word in description_lower for word in ['storm', 'wind damage', 'fallen', 'leaning']):
            severity_score += 8.0
            complexity_factors.append("Storm damage")
            
        # SITE CONDITIONS assessment
        if any(word in description_lower for word in ['wet', 'muddy', 'soft ground', 'slope']):
            site_conditions_score += 5.0
            complexity_factors.append("Poor site conditions")
            
        # Calculate composite AFISS score
        composite_score = (
            access_score * 0.20 +
            fall_zone_score * 0.25 +
            interference_score * 0.20 +
            severity_score * 0.30 +
            site_conditions_score * 0.05
        )
        
        # Determine complexity level and multiplier
        if composite_score >= 50:
            complexity = "extreme"
            multiplier = 3.2
            crew_type = "specialist"
        elif composite_score >= 35:
            complexity = "high"
            multiplier = 2.4
            crew_type = "expert"
        elif composite_score >= 20:
            complexity = "moderate"
            multiplier = 1.6
            crew_type = "experienced"
        else:
            complexity = "low"
            multiplier = 1.2
            crew_type = "standard"
            
        # Calculate TreeScore and estimates
        canopy = height * 0.4  # Estimate canopy as 40% of height
        dbh = height * 0.5    # Estimate DBH based on height
        
        if service_type == "removal":
            base_treescore = height * (canopy * 2) * (dbh / 12)
            base_hours = height / 8.0  # Rule of thumb: 8 feet per hour
        elif service_type == "trimming":
            base_treescore = height * canopy * 0.3
            base_hours = height / 12.0  # Faster for trimming
        else:
            base_treescore = height * canopy * 0.5
            base_hours = height / 10.0
            
        total_treescore = base_treescore * multiplier
        estimated_hours = base_hours * multiplier
        
        # Cost calculation (example rates)
        base_rate = 150.0  # $150/hour base rate
        estimated_cost = estimated_hours * base_rate * multiplier
        
        # Equipment and safety requirements
        equipment = ["chainsaw", "safety gear"]
        safety_protocols = ["basic safety"]
        isa_required = False
        
        if complexity in ["high", "extreme"]:
            equipment.extend(["crane", "rigging equipment"])
            safety_protocols.extend(["advanced rigging", "traffic control"])
            isa_required = True
            
        if "power" in description_lower:
            equipment.append("insulated tools")
            safety_protocols.append("electrical safety protocols")
            isa_required = True
            
        return {
            "description": project_input,
            "service_type": service_type,
            "location_type": location_type,
            "tree_height": height,
            "canopy_radius": canopy,
            "dbh": dbh,
            "base_treescore": round(base_treescore, 1),
            "total_treescore": round(total_treescore, 1),
            "afiss_composite_score": round(composite_score, 1),
            "access_score": access_score,
            "fall_zone_score": fall_zone_score,
            "interference_score": interference_score,
            "severity_score": severity_score,
            "site_conditions_score": site_conditions_score,
            "complexity_level": complexity,
            "complexity_multiplier": round(multiplier, 2),
            "complexity_factors": complexity_factors,
            "estimated_hours": round(estimated_hours, 1),
            "estimated_cost": round(estimated_cost, 0),
            "crew_type_recommended": crew_type,
            "equipment_required": equipment,
            "safety_protocols": safety_protocols,
            "isa_certified_required": isa_required,
            "assessment_timestamp": datetime.now().isoformat()
        }
    
    def print_assessment(self, assessment: Dict[str, Any]):
        """Print a formatted assessment report"""
        
        print(f"\n{'='*60}")
        print(f"🌳 ALEX TREE ASSESSMENT REPORT")
        print(f"{'='*60}")
        
        print(f"\n📝 PROJECT DESCRIPTION:")
        print(f"   {assessment['description']}")
        
        print(f"\n🌲 TREE ANALYSIS:")
        print(f"   Height: {assessment['tree_height']:.0f} ft")
        print(f"   Canopy: {assessment['canopy_radius']:.0f} ft radius")
        print(f"   DBH: {assessment['dbh']:.0f} inches")
        print(f"   Service: {assessment['service_type'].title()}")
        print(f"   Location: {assessment['location_type'].title()}")
        
        print(f"\n🎯 TREESCORE CALCULATION:")
        print(f"   Base TreeScore: {assessment['base_treescore']:.1f}")
        print(f"   Complexity Multiplier: {assessment['complexity_multiplier']:.2f}x")
        print(f"   Total TreeScore: {assessment['total_treescore']:.1f}")
        
        print(f"\n⚠️  AFISS RISK ASSESSMENT:")
        print(f"   Composite Score: {assessment['afiss_composite_score']:.1f}%")
        print(f"   └─ Access: {assessment['access_score']:.1f}")
        print(f"   └─ Fall Zone: {assessment['fall_zone_score']:.1f}")
        print(f"   └─ Interference: {assessment['interference_score']:.1f}")
        print(f"   └─ Severity: {assessment['severity_score']:.1f}")
        print(f"   └─ Site Conditions: {assessment['site_conditions_score']:.1f}")
        
        print(f"\n🔧 COMPLEXITY ANALYSIS:")
        print(f"   Level: {assessment['complexity_level'].upper()}")
        if assessment['complexity_factors']:
            print(f"   Factors:")
            for factor in assessment['complexity_factors']:
                print(f"   • {factor}")
        
        print(f"\n👥 CREW REQUIREMENTS:")
        print(f"   Type: {assessment['crew_type_recommended'].title()}")
        print(f"   ISA Certified Required: {'Yes' if assessment['isa_certified_required'] else 'No'}")
        
        print(f"\n🛠️  EQUIPMENT & SAFETY:")
        print(f"   Equipment: {', '.join(assessment['equipment_required'])}")
        print(f"   Safety Protocols: {', '.join(assessment['safety_protocols'])}")
        
        print(f"\n💰 BUSINESS ESTIMATES:")
        print(f"   Estimated Hours: {assessment['estimated_hours']:.1f}")
        print(f"   Estimated Cost: ${assessment['estimated_cost']:,.0f}")
        
        print(f"\n{'='*60}")
        
    async def interactive_demo(self):
        """Run interactive assessment demo"""
        
        print("🌳 Welcome to Alex TreeAI Operations Agent!")
        print("=" * 50)
        print("I'm Alex, your AI-powered tree service operations commander.")
        print("I can assess any tree service project and provide comprehensive")
        print("estimates using the AFISS risk assessment framework.")
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
                    
                print(f"\n🔍 Analyzing project...")
                assessment = self.simulate_assessment(user_input)
                self.print_assessment(assessment)
                
                # Ask if they want to see another example
                print(f"\n💡 Try another assessment? (Or type 'quit' to exit)")
                
            except KeyboardInterrupt:
                print(f"\n\n🌳 Thanks for using Alex! Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                print("Please try again...")

def main():
    """Run the demo"""
    demo = AlexDemo()
    
    print("Choose demo mode:")
    print("1. Interactive mode - Chat with Alex")
    print("2. Example assessments - See Alex in action")
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "1":
        asyncio.run(demo.interactive_demo())
    else:
        # Show example assessments
        examples = [
            "Large oak tree removal in residential neighborhood. Tree is 65 feet tall with power lines overhead and close to house.",
            "Emergency storm-damaged tree blocking commercial driveway. High priority removal needed.",
            "Simple backyard maple trimming, easy access, no obstacles.",
            "80-foot pine removal near power lines requiring crane and traffic control."
        ]
        
        print(f"\n🌳 Alex Assessment Examples:")
        print("=" * 40)
        
        for i, example in enumerate(examples, 1):
            print(f"\n📋 EXAMPLE {i}:")
            assessment = demo.simulate_assessment(example)
            demo.print_assessment(assessment)
            
            if i < len(examples):
                input("\nPress Enter for next example...")

if __name__ == "__main__":
    main()