#!/usr/bin/env python3
"""
Alex TreeAI Agent - Simplified Version with Convex Integration
Uses Anthropic API directly without LangChain to avoid dependency conflicts
"""

import asyncio
import os
import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
import anthropic
import httpx

class SimpleAlex:
    """Simplified Alex agent using direct Anthropic API"""
    
    def __init__(self, convex_url: str):
        # Initialize Anthropic client
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable required")
        
        self.anthropic = anthropic.Anthropic(api_key=api_key)
        self.convex_url = convex_url
        
    async def assess_project(self, project_description: str) -> Dict[str, Any]:
        """Perform complete project assessment using Claude"""
        print(f"🤖 Alex analyzing project...")
        print(f"📝 Description: {project_description}")
        
        # Create comprehensive assessment prompt
        prompt = f"""
You are Alex, the TreeAI Operations Commander. Analyze this tree service project and provide a comprehensive assessment.

PROJECT DESCRIPTION:
{project_description}

Please provide a complete assessment including:

1. TREE MEASUREMENTS (estimate if not provided):
   - Height (feet)
   - Canopy radius (feet) 
   - DBH - Diameter at Breast Height (inches)
   - Species (if identifiable)
   - Condition (healthy/declining/hazardous/dead)

2. SERVICE TYPE:
   - Primary service (removal/trimming/stump_grinding/emergency)
   - Location type (residential/commercial/municipal)

3. AFISS RISK ASSESSMENT (0-100% for each domain):
   - ACCESS: Equipment and crew access challenges
   - FALL ZONE: Areas where tree parts may fall
   - INTERFERENCE: Obstacles like power lines, structures
   - SEVERITY: Urgency and immediate risk factors
   - SITE CONDITIONS: Environmental conditions

4. BUSINESS ESTIMATES:
   - Estimated hours
   - Estimated cost ($)
   - Crew type needed (standard/experienced/expert/specialist)
   - Equipment required
   - Safety protocols needed
   - ISA certified arborist required? (yes/no)

5. COMPLEXITY ASSESSMENT:
   - Overall complexity (low/moderate/high/extreme)
   - Complexity multiplier (1.1x - 3.5x)

Provide specific numerical values and detailed reasoning. Be comprehensive but concise.
Format your response clearly with section headers.
"""

        try:
            # Call Claude Sonnet for main assessment
            response = self.anthropic.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                temperature=0.1,
                messages=[{"role": "user", "content": prompt}]
            )
            
            assessment_text = response.content[0].text
            print(f"✅ Assessment complete!")
            
            # Parse the assessment into structured data
            structured_assessment = self._parse_assessment(assessment_text, project_description)
            
            return structured_assessment
            
        except Exception as e:
            print(f"❌ Assessment failed: {str(e)}")
            return self._get_fallback_assessment(project_description)
    
    def _parse_assessment(self, assessment_text: str, description: str) -> Dict[str, Any]:
        """Parse Claude's assessment into structured format"""
        
        # Extract numerical values using regex
        def extract_number(pattern: str, text: str, default: float = 0.0) -> float:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1))
                except:
                    return default
            return default
        
        def extract_text(pattern: str, text: str, default: str = "") -> str:
            match = re.search(pattern, text, re.IGNORECASE)
            return match.group(1).strip() if match else default
        
        # Parse tree measurements
        height = extract_number(r'height[:\s]*(\d+(?:\.\d+)?)', assessment_text, 50.0)
        canopy = extract_number(r'canopy[^:]*[:\s]*(\d+(?:\.\d+)?)', assessment_text, 20.0)
        dbh = extract_number(r'dbh[^:]*[:\s]*(\d+(?:\.\d+)?)', assessment_text, 24.0)
        
        # Parse AFISS scores
        access_score = extract_number(r'access[^:]*[:\s]*(\d+(?:\.\d+)?)', assessment_text, 8.0)
        fall_zone_score = extract_number(r'fall\s*zone[^:]*[:\s]*(\d+(?:\.\d+)?)', assessment_text, 12.0)
        interference_score = extract_number(r'interference[^:]*[:\s]*(\d+(?:\.\d+)?)', assessment_text, 10.0)
        severity_score = extract_number(r'severity[^:]*[:\s]*(\d+(?:\.\d+)?)', assessment_text, 8.0)
        site_conditions_score = extract_number(r'site\s*conditions[^:]*[:\s]*(\d+(?:\.\d+)?)', assessment_text, 3.0)
        
        # Calculate composite AFISS score with domain weights
        composite_score = (
            access_score * 0.20 +      # ACCESS: 20%
            fall_zone_score * 0.25 +   # FALL ZONE: 25%
            interference_score * 0.20 + # INTERFERENCE: 20%
            severity_score * 0.30 +    # SEVERITY: 30%
            site_conditions_score * 0.05 # SITE CONDITIONS: 5%
        )
        
        # Determine complexity
        if composite_score >= 65:
            complexity = "extreme"
            multiplier = 3.2
        elif composite_score >= 45:
            complexity = "high"
            multiplier = 2.4
        elif composite_score >= 25:
            complexity = "moderate"
            multiplier = 1.6
        else:
            complexity = "low"
            multiplier = 1.2
        
        # Parse business estimates
        hours = extract_number(r'(?:estimated\s*)?hours[^:]*[:\s]*(\d+(?:\.\d+)?)', assessment_text, 8.0)
        cost = extract_number(r'(?:estimated\s*)?cost[^:]*[$]?[:\s]*(\d+(?:,?\d+)*(?:\.\d+)?)', assessment_text, 1500.0)
        
        # Determine crew type based on complexity
        crew_mapping = {
            "low": "standard",
            "moderate": "experienced", 
            "high": "expert",
            "extreme": "specialist"
        }
        crew_type = crew_mapping.get(complexity, "experienced")
        
        # Calculate TreeScore
        base_treescore = height * (canopy * 2) * (dbh / 12)
        total_treescore = base_treescore + composite_score
        
        # Determine service type
        service_type = "removal"
        if "trim" in description.lower() or "prun" in description.lower():
            service_type = "trimming"
        elif "stump" in description.lower():
            service_type = "stump_grinding"
        elif "emergency" in description.lower() or "storm" in description.lower():
            service_type = "emergency"
        
        # Determine location type
        location_type = "residential"
        if "commercial" in description.lower() or "business" in description.lower():
            location_type = "commercial"
        elif "municipal" in description.lower() or "city" in description.lower():
            location_type = "municipal"
        
        # Build structured assessment
        structured = {
            "description": description,
            "location_type": location_type,
            "service_type": service_type,
            
            # Tree measurements
            "tree_height": height,
            "canopy_radius": canopy,
            "dbh": dbh,
            "tree_species": extract_text(r'species[^:]*:\s*([^\n.]+)', assessment_text, "oak"),
            "tree_condition": extract_text(r'condition[^:]*:\s*([^\n.]+)', assessment_text, "healthy"),
            
            # TreeScore
            "base_treescore": base_treescore,
            "total_treescore": total_treescore,
            
            # AFISS scores
            "afiss_composite_score": composite_score,
            "access_score": access_score,
            "fall_zone_score": fall_zone_score,
            "interference_score": interference_score,
            "severity_score": severity_score,
            "site_conditions_score": site_conditions_score,
            "complexity_level": complexity,
            "complexity_multiplier": multiplier,
            
            # Business estimates
            "estimated_hours": hours,
            "estimated_cost": cost * multiplier,  # Apply complexity multiplier
            "crew_type_recommended": crew_type,
            "equipment_required": self._determine_equipment(service_type, complexity),
            "safety_protocols": self._determine_safety_protocols(complexity, assessment_text),
            "isa_certified_required": complexity in ["high", "extreme"],
            
            # Alex metadata
            "claude_model_used": "sonnet",
            "assessment_time_seconds": 12.0,
            "alex_confidence_score": min(95.0, 70.0 + (composite_score * 0.3)),
            
            # Note: full_assessment excluded from Convex sync to match schema
        }
        
        return structured
    
    def _determine_equipment(self, service_type: str, complexity: str) -> List[str]:
        """Determine required equipment based on service and complexity"""
        base_equipment = ["chainsaw", "safety_gear"]
        
        if service_type == "removal":
            base_equipment.extend(["chipper", "truck"])
            if complexity in ["high", "extreme"]:
                base_equipment.append("crane")
        elif service_type == "trimming":
            base_equipment.extend(["ladder", "pole_saw"])
            if complexity in ["moderate", "high", "extreme"]:
                base_equipment.append("bucket_truck")
        elif service_type == "stump_grinding":
            base_equipment.extend(["stump_grinder", "shovel"])
        
        return base_equipment
    
    def _determine_safety_protocols(self, complexity: str, assessment_text: str) -> List[str]:
        """Determine safety protocols based on complexity and risks"""
        protocols = ["Basic OSHA compliance"]
        
        if "power" in assessment_text.lower() or "electrical" in assessment_text.lower():
            protocols.append("Electrical safety protocols")
        
        if complexity in ["high", "extreme"]:
            protocols.extend([
                "ISA safety standards",
                "Advanced rigging techniques",
                "Emergency response plan"
            ])
        
        if "traffic" in assessment_text.lower() or "road" in assessment_text.lower():
            protocols.append("Traffic control")
        
        return protocols
    
    def _get_fallback_assessment(self, description: str) -> Dict[str, Any]:
        """Fallback assessment if Claude call fails"""
        return {
            "description": description,
            "location_type": "residential",
            "service_type": "removal",
            "tree_height": 50.0,
            "canopy_radius": 20.0,
            "dbh": 24.0,
            "tree_species": "unknown",
            "tree_condition": "unknown",
            "base_treescore": 100.0,
            "total_treescore": 130.0,
            "afiss_composite_score": 30.0,
            "access_score": 6.0,
            "fall_zone_score": 8.0,
            "interference_score": 7.0,
            "severity_score": 7.0,
            "site_conditions_score": 2.0,
            "complexity_level": "moderate",
            "complexity_multiplier": 1.5,
            "estimated_hours": 8.0,
            "estimated_cost": 1800.0,
            "crew_type_recommended": "experienced",
            "equipment_required": ["chainsaw", "chipper", "truck"],
            "safety_protocols": ["Basic OSHA compliance"],
            "isa_certified_required": False,
            "claude_model_used": "fallback",
            "assessment_time_seconds": 0.0,
            "alex_confidence_score": 50.0,
            "full_assessment": "Fallback assessment due to API error"
        }
    
    async def sync_to_convex(self, assessment: Dict[str, Any]) -> Optional[str]:
        """Sync assessment to Convex backend"""
        print(f"\n🔗 Syncing to Convex...")
        
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(
                    f"{self.convex_url}/api/mutation",
                    json={
                        "path": "projects:createProject",
                        "args": assessment
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'success':
                        project_id = data.get('value')
                        print(f"✅ Synced to Convex!")
                        print(f"🆔 Project ID: {project_id}")
                        return project_id
                    else:
                        print(f"❌ Convex error: {data}")
                        return None
                else:
                    print(f"❌ HTTP error: {response.status_code}")
                    return None
                    
        except Exception as e:
            print(f"❌ Sync failed: {str(e)}")
            return None
    
    async def show_dashboard(self):
        """Show current Convex dashboard data"""
        print(f"\n📊 Convex Dashboard:")
        
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
                    
                else:
                    print(f"   ❌ Dashboard query failed")
                    
        except Exception as e:
            print(f"   ❌ Dashboard error: {str(e)}")

# Demo function
async def demo_alex_real():
    """Demo Alex with real Anthropic API and Convex"""
    
    convex_url = "https://cheerful-bee-330.convex.cloud"
    alex = SimpleAlex(convex_url)
    
    print("🌳 Alex TreeAI Agent - Real Demo with Anthropic & Convex")
    print("="*60)
    
    # Show current dashboard
    await alex.show_dashboard()
    
    # Test project
    project = """
    Large red oak tree removal in suburban residential area. Tree appears to be 
    approximately 75 feet tall with a canopy spread of about 35 feet. The trunk 
    diameter at breast height is roughly 32 inches. Tree is healthy but homeowner 
    wants it removed due to proximity to house (about 15 feet away) and concerns 
    about power lines that run overhead about 8 feet above the canopy. 
    
    Access is via a narrow concrete driveway that slopes upward toward the house. 
    There's a neighbor's fence on one side and the house foundation on the other, 
    limiting equipment positioning. Customer is very concerned about potential 
    damage to the house, driveway, and neighboring property.
    """
    
    print(f"\n🔍 ANALYZING REAL PROJECT:")
    print("-" * 50)
    
    # Get Alex's assessment
    assessment = await alex.assess_project(project.strip())
    
    # Show structured results
    print(f"\n📋 ALEX'S STRUCTURED ASSESSMENT:")
    print("-" * 50)
    print(f"🌳 Tree: {assessment['tree_height']:.0f}ft {assessment['tree_species']} ({assessment['tree_condition']})")
    print(f"📐 Measurements: {assessment['canopy_radius']:.0f}ft canopy, {assessment['dbh']:.0f}\" DBH")
    print(f"🔢 TreeScore: {assessment['base_treescore']:.0f} base → {assessment['total_treescore']:.0f} total")
    print(f"⚠️  AFISS Risk: {assessment['afiss_composite_score']:.1f}% ({assessment['complexity_level'].upper()})")
    print(f"💰 Cost: ${assessment['estimated_cost']:,.0f} ({assessment['complexity_multiplier']:.1f}x multiplier)")
    print(f"⏱️  Time: {assessment['estimated_hours']:.1f} hours")
    print(f"👥 Crew: {assessment['crew_type_recommended']}")
    print(f"🛡️  Safety: ISA Required = {assessment['isa_certified_required']}")
    print(f"🔧 Equipment: {', '.join(assessment['equipment_required'])}")
    
    # Sync to Convex
    project_id = await alex.sync_to_convex(assessment)
    
    # Show updated dashboard
    if project_id:
        print(f"\n📊 Updated Dashboard:")
        await alex.show_dashboard()
        print(f"\n🎉 Complete! Project {project_id} is now in Convex for tracking and learning.")
    
    # Show the full assessment text
    print(f"\n📝 FULL CLAUDE ASSESSMENT:")
    print("-" * 50)
    print(assessment['full_assessment'])

if __name__ == "__main__":
    asyncio.run(demo_alex_real())