#!/usr/bin/env python3
"""
Demo: Alex with Complete Pricing Intelligence
Show Alex analyzing a tree project with full TreeScore + AFISS + Equipment + Employee pricing
"""

import asyncio
import json
from datetime import datetime

# Import our pricing system
from quick_pricing_demo import QuickPricingCalculator, EquipmentCategory, EmployeePosition

class AlexCompletePricingDemo:
    """Alex with complete pricing intelligence demo"""
    
    def __init__(self):
        self.calculator = QuickPricingCalculator()
        self.fuel_price = 4.25
        self.competitive_rates = {
            "tree_removal": (200, 350),
            "forestry_mulching": (400, 600),
            "stump_grinding": (180, 320)
        }
    
    def calculate_treescore(self, height: float, canopy_radius: float, dbh: float, service_type: str = "removal") -> float:
        """Calculate TreeScore points"""
        if service_type == "removal":
            base_points = height * (canopy_radius * 2) * (dbh / 12)
        elif service_type == "stump_grinding":
            base_points = (height + 12) * dbh
        else:  # trimming
            base_points = height * canopy_radius * (dbh / 24)
        return base_points
    
    def assess_afiss_factors(self, project_description: str) -> dict:
        """Simplified AFISS assessment"""
        desc_lower = project_description.lower()
        
        # Access domain
        access_score = 5.0
        if "narrow" in desc_lower or "driveway" in desc_lower:
            access_score += 10.0
        if "steep" in desc_lower:
            access_score += 8.0
        
        # Fall zone domain
        fall_zone_score = 8.0
        if "house" in desc_lower or "building" in desc_lower:
            fall_zone_score += 20.0
        if "20 feet" in desc_lower or "close" in desc_lower:
            fall_zone_score += 15.0
        
        # Interference domain
        interference_score = 6.0
        if "power line" in desc_lower or "electrical" in desc_lower:
            interference_score += 25.0
        if "overhead" in desc_lower:
            interference_score += 10.0
        
        # Severity domain
        severity_score = 4.0
        if "large" in desc_lower:
            severity_score += 8.0
        if "80 feet" in desc_lower or "tall" in desc_lower:
            severity_score += 12.0
        
        # Site conditions
        site_conditions_score = 2.0
        if "concrete" in desc_lower:
            site_conditions_score += 5.0
        if "residential" in desc_lower:
            site_conditions_score += 3.0
        
        # Calculate composite score with domain weights
        composite_score = (
            access_score * 0.20 +
            fall_zone_score * 0.25 +
            interference_score * 0.20 +
            severity_score * 0.30 +
            site_conditions_score * 0.05
        )
        
        # Determine complexity
        if composite_score <= 28:
            complexity = "low"
            multiplier_range = (1.12, 1.28)
        elif composite_score <= 46:
            complexity = "moderate"
            multiplier_range = (1.45, 1.85)
        elif composite_score <= 58:
            complexity = "high"
            multiplier_range = (2.1, 2.8)
        else:
            complexity = "extreme"
            multiplier_range = (2.5, 3.5)
        
        return {
            "access_score": access_score,
            "fall_zone_score": fall_zone_score,
            "interference_score": interference_score,
            "severity_score": severity_score,
            "site_conditions_score": site_conditions_score,
            "composite_score": composite_score,
            "complexity": complexity,
            "multiplier_range": multiplier_range,
            "afiss_bonus": composite_score * 2.5  # AFISS bonus points
        }
    
    def recommend_loadout(self, complexity: str, service_type: str) -> tuple:
        """Recommend equipment and crew based on project complexity"""
        
        if service_type == "forestry_mulching":
            equipment = [EquipmentCategory.SKID_STEER_MULCHER, EquipmentCategory.PICKUP_TRUCK]
            if complexity in ["high", "extreme"]:
                crew = [EmployeePosition.EQUIPMENT_OPERATOR, EmployeePosition.GROUND_CREW_MEMBER, EmployeePosition.GROUND_CREW_MEMBER]
            else:
                crew = [EmployeePosition.EQUIPMENT_OPERATOR, EmployeePosition.GROUND_CREW_MEMBER]
        else:
            # Tree service
            equipment = [EquipmentCategory.BUCKET_TRUCK, EquipmentCategory.CHIPPER, EquipmentCategory.PICKUP_TRUCK]
            
            if complexity == "extreme":
                crew = [EmployeePosition.ISA_CERTIFIED_ARBORIST, EmployeePosition.ISA_CERTIFIED_ARBORIST, 
                       EmployeePosition.GROUND_CREW_MEMBER, EmployeePosition.GROUND_CREW_MEMBER]
            elif complexity == "high":
                crew = [EmployeePosition.ISA_CERTIFIED_ARBORIST, EmployeePosition.GROUND_CREW_MEMBER, 
                       EmployeePosition.GROUND_CREW_MEMBER]
            else:
                crew = [EmployeePosition.ISA_CERTIFIED_ARBORIST, EmployeePosition.GROUND_CREW_MEMBER]
        
        return equipment, crew
    
    def estimate_project_hours(self, total_treescore: float, complexity: str) -> float:
        """Estimate project hours based on TreeScore and complexity"""
        
        # Base PpH rates by complexity
        pph_rates = {
            "low": 400,
            "moderate": 350,
            "high": 280,
            "extreme": 220
        }
        
        pph = pph_rates.get(complexity, 350)
        hours = total_treescore / pph
        
        return max(2.0, hours)  # Minimum 2 hours
    
    async def assess_complete_project(self, project_description: str, tree_data: dict) -> dict:
        """Alex's complete project assessment with pricing intelligence"""
        
        print("🤖 ALEX TREEAI OPERATIONS AGENT")
        print("=" * 50)
        print("Performing complete project assessment with pricing intelligence...")
        
        # Step 1: TreeScore Calculation
        print(f"\n📊 STEP 1: TreeScore Calculation")
        base_treescore = self.calculate_treescore(
            height=tree_data["height"],
            canopy_radius=tree_data["canopy_radius"],
            dbh=tree_data["dbh"],
            service_type=tree_data.get("service_type", "removal")
        )
        print(f"   Base TreeScore: {base_treescore:.1f} points")
        
        # Step 2: AFISS Risk Assessment
        print(f"\n⚠️  STEP 2: AFISS Risk Assessment")
        afiss = self.assess_afiss_factors(project_description)
        total_treescore = base_treescore + afiss["afiss_bonus"]
        
        print(f"   Access Score: {afiss['access_score']:.1f}%")
        print(f"   Fall Zone Score: {afiss['fall_zone_score']:.1f}%") 
        print(f"   Interference Score: {afiss['interference_score']:.1f}%")
        print(f"   Severity Score: {afiss['severity_score']:.1f}%")
        print(f"   Site Conditions Score: {afiss['site_conditions_score']:.1f}%")
        print(f"   Composite AFISS Score: {afiss['composite_score']:.1f}%")
        print(f"   Complexity Level: {afiss['complexity'].upper()}")
        print(f"   Multiplier Range: {afiss['multiplier_range'][0]:.2f}x - {afiss['multiplier_range'][1]:.2f}x")
        print(f"   AFISS Bonus Points: +{afiss['afiss_bonus']:.1f}")
        print(f"   Total TreeScore: {total_treescore:.1f} points")
        
        # Step 3: Loadout Recommendation
        print(f"\n🎯 STEP 3: Optimal Loadout Selection")
        service_type = tree_data.get("service_type", "removal")
        equipment_list, crew_list = self.recommend_loadout(afiss['complexity'], service_type)
        
        print(f"   Service Type: {service_type.replace('_', ' ').title()}")
        print(f"   Recommended Equipment:")
        for eq in equipment_list:
            print(f"     • {eq.value.replace('_', ' ').title()}")
        print(f"   Recommended Crew:")
        for crew in crew_list:
            print(f"     • {crew.value.replace('_', ' ').title()}")
        
        # Step 4: Equipment Cost Analysis
        print(f"\n🛠️  STEP 4: Equipment Cost Intelligence")
        severity_factor = 1.0 if afiss['complexity'] == "low" else 1.1 if afiss['complexity'] == "moderate" else 1.25 if afiss['complexity'] == "high" else 1.45
        
        total_equipment_cost = 0.0
        equipment_breakdown = {}
        
        for equipment in equipment_list:
            cost = self.calculator.calculate_equipment_cost(equipment)
            adjusted_cost = cost.total_cost_per_hour * severity_factor
            equipment_breakdown[equipment.value] = adjusted_cost
            total_equipment_cost += adjusted_cost
            print(f"   • {equipment.value.replace('_', ' ').title()}: ${adjusted_cost:.2f}/hr")
        
        print(f"   Severity Factor: {severity_factor:.2f}x ({afiss['complexity']} complexity)")
        print(f"   Total Equipment Cost: ${total_equipment_cost:.2f}/hr")
        
        # Step 5: Employee Cost Analysis
        print(f"\n👷 STEP 5: True Employee Cost Analysis")
        total_employee_cost = 0.0
        total_base_wages = 0.0
        employee_breakdown = {}
        
        for position in crew_list:
            cost = self.calculator.calculate_employee_cost(position)
            employee_breakdown[position.value] = {
                "base_rate": cost.hourly_rate,
                "true_cost": cost.true_hourly_cost,
                "burden_cost": cost.true_hourly_cost - cost.hourly_rate
            }
            total_employee_cost += cost.true_hourly_cost
            total_base_wages += cost.hourly_rate
            print(f"   • {position.value.replace('_', ' ').title()}: ${cost.hourly_rate:.2f}/hr → ${cost.true_hourly_cost:.2f}/hr")
        
        hidden_employee_cost = total_employee_cost - total_base_wages
        print(f"   Total Base Wages: ${total_base_wages:.2f}/hr")
        print(f"   Total Burden Costs: ${hidden_employee_cost:.2f}/hr")
        print(f"   Total True Employee Cost: ${total_employee_cost:.2f}/hr")
        print(f"   Burden Multiplier: {total_employee_cost/total_base_wages:.2f}x")
        
        # Step 6: Small Tools Pool
        print(f"\n🔧 STEP 6: Small Tools & Consumables Pool")
        crew_size = len(crew_list)
        small_tools_cost = crew_size * 2.5  # Simplified: $2.50 per crew member
        print(f"   Crew Size: {crew_size} members")
        print(f"   Small Tools Pool: ${small_tools_cost:.2f}/hr")
        
        # Step 7: Total Cost Calculation
        print(f"\n💰 STEP 7: Complete Cost Analysis")
        total_cost_per_hour = total_equipment_cost + total_employee_cost + small_tools_cost
        
        print(f"   Equipment Cost: ${total_equipment_cost:.2f}/hr")
        print(f"   Employee Cost: ${total_employee_cost:.2f}/hr") 
        print(f"   Small Tools Cost: ${small_tools_cost:.2f}/hr")
        print(f"   TOTAL COST: ${total_cost_per_hour:.2f}/hr")
        
        # Step 8: Time Estimation
        print(f"\n⏱️  STEP 8: Project Time Estimation")
        estimated_hours = self.estimate_project_hours(total_treescore, afiss['complexity'])
        print(f"   TreeScore: {total_treescore:.1f} points")
        print(f"   Complexity: {afiss['complexity']}")
        print(f"   Estimated Hours: {estimated_hours:.1f} hours")
        
        # Step 9: Pricing Intelligence
        print(f"\n🎯 STEP 9: Intelligent Pricing Recommendations")
        
        # Target margins by service type
        target_margins = {
            "removal": 0.35,
            "trimming": 0.40,
            "forestry_mulching": 0.30,
            "stump_grinding": 0.35
        }
        
        target_margin = target_margins.get(service_type, 0.35)
        recommended_rate = total_cost_per_hour / (1 - target_margin)
        break_even_rate = total_cost_per_hour
        
        # Competitive analysis
        competitive_range = self.competitive_rates.get(service_type, (200, 350))
        
        if competitive_range[0] <= recommended_rate <= competitive_range[1]:
            competitive_position = "COMPETITIVE"
        elif recommended_rate < competitive_range[0]:
            competitive_position = "BELOW MARKET"
        else:
            competitive_position = "PREMIUM PRICING"
        
        print(f"   Break-Even Rate: ${break_even_rate:.2f}/hr")
        print(f"   Recommended Rate: ${recommended_rate:.2f}/hr")
        print(f"   Target Margin: {target_margin*100:.0f}%")
        print(f"   Market Range: ${competitive_range[0]:.0f} - ${competitive_range[1]:.0f}/hr")
        print(f"   Competitive Position: {competitive_position}")
        
        # Step 10: Project Economics
        print(f"\n📊 STEP 10: Complete Project Economics")
        total_project_cost = total_cost_per_hour * estimated_hours
        total_project_revenue = recommended_rate * estimated_hours
        total_project_profit = total_project_revenue - total_project_cost
        project_roi = (total_project_profit / total_project_cost) * 100
        
        print(f"   Project Duration: {estimated_hours:.1f} hours")
        print(f"   Total Project Cost: ${total_project_cost:,.0f}")
        print(f"   Total Project Revenue: ${total_project_revenue:,.0f}")
        print(f"   Total Project Profit: ${total_project_profit:,.0f}")
        print(f"   Project ROI: {project_roi:.0f}%")
        
        # Return complete assessment
        return {
            "project_id": f"alex_assessment_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "treescore": {
                "base_points": base_treescore,
                "afiss_bonus": afiss["afiss_bonus"],
                "total_points": total_treescore
            },
            "afiss_assessment": afiss,
            "loadout": {
                "equipment": [eq.value for eq in equipment_list],
                "crew": [pos.value for pos in crew_list],
                "severity_factor": severity_factor
            },
            "costs": {
                "equipment_per_hour": total_equipment_cost,
                "employee_per_hour": total_employee_cost,
                "small_tools_per_hour": small_tools_cost,
                "total_per_hour": total_cost_per_hour,
                "equipment_breakdown": equipment_breakdown,
                "employee_breakdown": employee_breakdown
            },
            "pricing": {
                "break_even_rate": break_even_rate,
                "recommended_rate": recommended_rate,
                "target_margin": target_margin * 100,
                "competitive_position": competitive_position,
                "competitive_range": competitive_range
            },
            "project_economics": {
                "estimated_hours": estimated_hours,
                "total_cost": total_project_cost,
                "total_revenue": total_project_revenue,
                "total_profit": total_project_profit,
                "roi_percentage": project_roi
            }
        }

async def demo_alex_complete_assessment():
    """Demonstrate Alex's complete assessment capabilities"""
    
    alex = AlexCompletePricingDemo()
    
    # Test case: Complex residential tree removal
    project_description = """
    Large oak tree removal in residential neighborhood. Tree is 80 feet tall, 
    30 foot canopy radius, 36 inch DBH. Located 20 feet from house, power lines 
    run directly overhead. Steep driveway access with concrete surface. 
    Customer concerned about property damage. High complexity job requiring
    ISA certified arborist supervision.
    """
    
    tree_data = {
        "height": 80.0,
        "canopy_radius": 30.0, 
        "dbh": 36.0,
        "service_type": "removal",
        "species": "oak",
        "condition": "healthy"
    }
    
    print("🌳 PROJECT DESCRIPTION:")
    print("=" * 50)
    print(project_description.strip())
    
    # Get Alex's complete assessment
    assessment = await alex.assess_complete_project(project_description, tree_data)
    
    # Summary
    print(f"\n\n🎉 ALEX'S COMPLETE ASSESSMENT SUMMARY")
    print("=" * 60)
    print(f"🆔 Project ID: {assessment['project_id']}")
    print(f"🌳 TreeScore: {assessment['treescore']['total_points']:.1f} points")
    print(f"⚠️  AFISS Risk: {assessment['afiss_assessment']['composite_score']:.1f}% ({assessment['afiss_assessment']['complexity']})")
    print(f"💰 True Hourly Cost: ${assessment['costs']['total_per_hour']:.2f}/hr")
    print(f"🎯 Recommended Rate: ${assessment['pricing']['recommended_rate']:.2f}/hr")
    print(f"📊 Project Profit: ${assessment['project_economics']['total_profit']:,.0f}")
    print(f"📈 ROI: {assessment['project_economics']['roi_percentage']:.0f}%")
    
    print(f"\n🧠 KEY INSIGHTS:")
    print(f"   • Equipment vs Employee Cost: ${assessment['costs']['equipment_per_hour']:.0f}/hr vs ${assessment['costs']['employee_per_hour']:.0f}/hr")
    print(f"   • Hidden employee burden: ${assessment['costs']['employee_per_hour'] - sum(emp['base_rate'] for emp in assessment['costs']['employee_breakdown'].values()):.0f}/hr")
    print(f"   • Competitive position: {assessment['pricing']['competitive_position']}")
    print(f"   • Project complexity requires {assessment['afiss_assessment']['complexity']} crew protocols")
    
    return assessment

async def main():
    """Run the complete Alex pricing demo"""
    print("🚀 TreeAI Alex - Complete Pricing Intelligence Demo")
    print("=" * 70)
    print(f"Demo started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        assessment = await demo_alex_complete_assessment()
        
        print(f"\n✅ DEMO COMPLETE - Alex now provides:")
        print(f"   🎯 Complete business intelligence for every project")
        print(f"   💰 True costs with zero hidden expenses")  
        print(f"   📊 Intelligent pricing recommendations")
        print(f"   🏆 Competitive analysis and profit optimization")
        print(f"   ⚡ Instant calculations - no spreadsheets needed!")
        
        return True
        
    except Exception as e:
        print(f"❌ Demo failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(main())