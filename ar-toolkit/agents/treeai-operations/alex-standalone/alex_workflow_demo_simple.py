#!/usr/bin/env python3
"""
Alex Pricing Intelligence Workflow - Simple Demo
Complete workflow without external dependencies
"""

from enum import Enum
from dataclasses import dataclass
from typing import List, Dict, Tuple

class EquipmentCategory(Enum):
    SKID_STEER_MULCHER = "skid_steer_mulcher"
    BUCKET_TRUCK = "bucket_truck"
    CHIPPER = "chipper"
    STUMP_GRINDER = "stump_grinder"
    MINI_EXCAVATOR = "mini_excavator"
    SERVICE_TRUCK = "service_truck"
    CRANE_TRUCK = "crane_truck"

class EmployeePosition(Enum):
    ISA_CERTIFIED_ARBORIST = "isa_certified_arborist"
    EXPERIENCED_CLIMBER = "experienced_climber"
    GROUND_CREW_LEAD = "ground_crew_lead"
    GROUND_CREW_MEMBER = "ground_crew_member"
    EQUIPMENT_OPERATOR = "equipment_operator"

class ProjectType(Enum):
    RESIDENTIAL_REMOVAL = "residential_removal"
    COMMERCIAL_PRUNING = "commercial_pruning"
    UTILITY_CLEARANCE = "utility_clearance"
    STORM_CLEANUP = "storm_cleanup"

@dataclass
class TreeDetails:
    """Individual tree assessment data"""
    dbh: int          # Diameter at breast height in inches
    height: int       # Height in feet
    crown_radius: int # Crown radius in feet
    
@dataclass
class StumpDetails:
    """Stump assessment data"""
    diameter: int     # Stump diameter in inches
    complexity: str   # "simple", "moderate", "complex"
    
@dataclass
class ProjectDetails:
    """Project details for pricing analysis"""
    address: str
    description: str
    trees: List[TreeDetails]
    stumps: List[StumpDetails]
    project_type: ProjectType
    estimated_hours: float
    access_challenges: List[str]
    special_requirements: List[str]

def calculate_equipment_cost_simple(equipment: EquipmentCategory, severity_factor: float = 1.0) -> float:
    """Simplified equipment cost calculation"""
    
    # Equipment defaults (USACE methodology)
    defaults = {
        EquipmentCategory.SKID_STEER_MULCHER: {
            "msrp_new": 118000,
            "salvage_percentage": 20,
            "expected_life_hours": 6000,
            "fuel_burn_gph": 5.5,
            "maintenance_factor": 100
        },
        EquipmentCategory.BUCKET_TRUCK: {
            "msrp_new": 165000,
            "salvage_percentage": 30,
            "expected_life_hours": 10000,
            "fuel_burn_gph": 6.5,
            "maintenance_factor": 60
        },
        EquipmentCategory.CHIPPER: {
            "msrp_new": 50000,
            "salvage_percentage": 25,
            "expected_life_hours": 5000,
            "fuel_burn_gph": 2.5,
            "maintenance_factor": 90
        },
        EquipmentCategory.STUMP_GRINDER: {
            "msrp_new": 45000,
            "salvage_percentage": 25,
            "expected_life_hours": 5000,
            "fuel_burn_gph": 2.8,
            "maintenance_factor": 90
        },
        EquipmentCategory.SERVICE_TRUCK: {
            "msrp_new": 65000,
            "salvage_percentage": 40,
            "expected_life_hours": 8000,
            "fuel_burn_gph": 2.5,
            "maintenance_factor": 50
        },
        EquipmentCategory.CRANE_TRUCK: {
            "msrp_new": 450000,
            "salvage_percentage": 35,
            "expected_life_hours": 12000,
            "fuel_burn_gph": 12.0,
            "maintenance_factor": 80
        }
    }
    
    if equipment not in defaults:
        return 0.0
    
    data = defaults[equipment]
    
    # USACE calculation
    purchase_price = data["msrp_new"]
    salvage_value = purchase_price * (data["salvage_percentage"] / 100)
    life_hours = data["expected_life_hours"]
    annual_hours = 1200  # Typical utilization
    
    # Ownership costs per hour
    depreciation_per_hour = (purchase_price - salvage_value) / life_hours
    avg_investment = (purchase_price + salvage_value) / 2
    interest_per_hour = (avg_investment * 0.06) / annual_hours  # 6% interest
    insurance_tax_storage = (purchase_price * 0.03) / annual_hours  # 3% annually
    
    # Operating costs per hour
    fuel_cost = data["fuel_burn_gph"] * 4.25  # $4.25/gallon
    lubrication_cost = fuel_cost * 0.15  # 15% of fuel
    maintenance_cost = depreciation_per_hour * (data["maintenance_factor"] / 100) * severity_factor
    wear_parts_cost = depreciation_per_hour * 0.20 * severity_factor
    
    total_cost = (depreciation_per_hour + interest_per_hour + insurance_tax_storage + 
                  fuel_cost + lubrication_cost + maintenance_cost + wear_parts_cost)
    
    return total_cost

def calculate_employee_cost_simple(position: EmployeePosition) -> float:
    """Simplified employee cost calculation"""
    
    # Base hourly rates
    base_rates = {
        EmployeePosition.ISA_CERTIFIED_ARBORIST: 32.00,
        EmployeePosition.EXPERIENCED_CLIMBER: 28.00,
        EmployeePosition.GROUND_CREW_LEAD: 22.00,
        EmployeePosition.GROUND_CREW_MEMBER: 18.00,
        EmployeePosition.EQUIPMENT_OPERATOR: 25.00
    }
    
    base_rate = base_rates.get(position, 20.00)
    
    # Tree care industry burden multiplier: 1.75x
    # Then adjust for productive hours (1,670 vs 2,080)
    burden_multiplier = 1.75
    productivity_factor = 2080 / 1670  # Account for non-productive time
    
    true_cost = base_rate * burden_multiplier * productivity_factor
    return true_cost

class AlexPricingWorkflow:
    """Alex's complete pricing workflow demonstration"""
    
    def __init__(self):
        self.project = None
        self.afiss_factors = []
        self.treescore = 0
        self.equipment_needs = []
        self.crew_needs = []
        self.total_cost = 0
        self.recommended_price = 0
        
    def analyze_project(self, project: ProjectDetails):
        """Step 1: Analyze project requirements"""
        print("🌳 ALEX PRICING INTELLIGENCE WORKFLOW")
        print("=" * 60)
        print(f"📍 Project: {project.description}")
        print(f"📍 Location: {project.address}")
        print(f"🌲 Trees: {len(project.trees)} trees")
        
        # Show individual tree details
        for i, tree in enumerate(project.trees, 1):
            print(f"   Tree {i}: {tree.height}ft H × {tree.dbh}\" DBH × {tree.crown_radius}ft CR")
        
        # Show stump details
        if project.stumps:
            print(f"🪵 Stumps: {len(project.stumps)} stumps")
            for i, stump in enumerate(project.stumps, 1):
                print(f"   Stump {i}: {stump.diameter}\" diameter ({stump.complexity})")
        
        print(f"⏱️  Estimated Duration: {project.estimated_hours} hours")
        print(f"🏷️  Project Type: {project.project_type.value}")
        
        self.project = project
        return self
    
    def assess_afiss_factors(self):
        """Step 2: AFISS Risk Assessment"""
        print(f"\n📊 AFISS RISK ASSESSMENT")
        print("-" * 40)
        
        # Simulate AFISS factor identification based on project details
        access_score = 0
        fallzone_score = 0
        interference_score = 0
        severity_score = 0
        site_score = 0
        
        # Access factors
        if "narrow street" in self.project.access_challenges:
            access_score += 12
            self.afiss_factors.append("AF_ACCESS_002 - Narrow Street Access (12%)")
        
        if "backyard only" in self.project.access_challenges:
            access_score += 18
            self.afiss_factors.append("AF_ACCESS_003 - Backyard Access Only (18%)")
        
        # Fall zone factors
        if self.project.project_type == ProjectType.RESIDENTIAL_REMOVAL:
            fallzone_score += 20
            self.afiss_factors.append("AF_FALLZONE_001 - Primary Structure Threat (20%)")
        
        # Severity factors (based on largest tree)
        largest_tree = max(self.project.trees, key=lambda t: t.dbh)
        if largest_tree.dbh > 36:
            severity_score += 12
            self.afiss_factors.append("AF_SEVERITY_010 - Exceptional Size (12%)")
        
        if largest_tree.height > 80:
            severity_score += 8  # Additional modifier
            
        # Power line interference (common in residential)
        if "power lines nearby" in self.project.access_challenges:
            interference_score += 18
            self.afiss_factors.append("AF_INTERFERENCE_002 - Secondary Power Lines (18%)")
        
        # Weather considerations
        site_score += 8
        self.afiss_factors.append("AF_SITE_001 - Weather Conditions (8%)")
        
        # Calculate composite AFISS score
        afiss_composite = (
            access_score * 0.20 +      # 20% weight
            fallzone_score * 0.25 +    # 25% weight  
            interference_score * 0.20 + # 20% weight
            severity_score * 0.30 +     # 30% weight
            site_score * 0.05           # 5% weight
        )
        
        print(f"🎯 Identified AFISS Factors:")
        for factor in self.afiss_factors:
            print(f"   • {factor}")
        
        print(f"\n📈 Domain Scores:")
        print(f"   Access: {access_score}% (weighted: {access_score * 0.20:.1f}%)")
        print(f"   Fall Zone: {fallzone_score}% (weighted: {fallzone_score * 0.25:.1f}%)")
        print(f"   Interference: {interference_score}% (weighted: {interference_score * 0.20:.1f}%)")
        print(f"   Severity: {severity_score}% (weighted: {severity_score * 0.30:.1f}%)")
        print(f"   Site Conditions: {site_score}% (weighted: {site_score * 0.05:.1f}%)")
        print(f"\n🎯 AFISS Composite Score: {afiss_composite:.1f}%")
        
        # Determine complexity multiplier based on AFISS score
        if afiss_composite >= 47:
            complexity_multiplier = 2.5  # High Risk
            complexity_level = "High Risk"
        elif afiss_composite >= 29:
            complexity_multiplier = 1.85  # Moderate Risk  
            complexity_level = "Moderate Risk"
        elif afiss_composite >= 8:
            complexity_multiplier = 1.28  # Low Risk
            complexity_level = "Low Risk"
        else:
            complexity_multiplier = 1.0   # Minimal Risk
            complexity_level = "Minimal Risk"
        
        # Calculate TreeScore for each tree using correct formula: Height × (Crown Radius × 2) × (DBH ÷ 12)
        total_treescore = 0
        print(f"\n🌳 TreeScore Calculations:")
        
        for i, tree in enumerate(self.project.trees, 1):
            tree_treescore = tree.height * (tree.crown_radius * 2) * (tree.dbh / 12)
            total_treescore += tree_treescore
            print(f"   Tree {i}: {tree.height} × ({tree.crown_radius} × 2) × ({tree.dbh} ÷ 12) = {tree_treescore:,.1f} points")
        
        # Apply complexity multiplier
        self.treescore = total_treescore * complexity_multiplier
        
        print(f"\n📊 Final TreeScore:")
        print(f"   Base TreeScore: {total_treescore:,.1f} points")
        print(f"   AFISS Level: {complexity_level} ({afiss_composite:.1f}%)")
        print(f"   Complexity Multiplier: {complexity_multiplier}x")
        print(f"   Final TreeScore: {self.treescore:,.1f} points")
        
        return self
    
    def determine_equipment_needs(self):
        """Step 3: Equipment Requirements Analysis"""
        print(f"\n🚛 EQUIPMENT REQUIREMENTS ANALYSIS")
        print("-" * 40)
        
        # Determine equipment based on project type and tree size
        equipment_list = []
        
        if self.project.project_type == ProjectType.RESIDENTIAL_REMOVAL:
            # Standard residential removal equipment
            equipment_list.extend([
                EquipmentCategory.BUCKET_TRUCK,
                EquipmentCategory.CHIPPER,
                EquipmentCategory.SERVICE_TRUCK
            ])
            
            # Add stump grinder if stumps need grinding
            if self.project.stumps:
                equipment_list.append(EquipmentCategory.STUMP_GRINDER)
                
            # Add crane for very large trees or difficult access
            largest_tree = max(self.project.trees, key=lambda t: t.height)
            if (largest_tree.height > 80 or 
                "crane access" in self.project.access_challenges):
                equipment_list.append(EquipmentCategory.CRANE_TRUCK)
        
        self.equipment_needs = equipment_list
        
        print(f"📋 Required Equipment:")
        for equipment in equipment_list:
            print(f"   • {equipment.value}")
        
        return self
    
    def determine_crew_requirements(self):
        """Step 4: Crew Requirements Analysis"""
        print(f"\n👷 CREW REQUIREMENTS ANALYSIS")
        print("-" * 40)
        
        # Determine crew based on project complexity and equipment
        crew_positions = []
        
        # Base crew for tree removal
        crew_positions.extend([
            EmployeePosition.ISA_CERTIFIED_ARBORIST,  # Lead/climber
            EmployeePosition.EXPERIENCED_CLIMBER,      # Second climber for large trees
            EmployeePosition.GROUND_CREW_LEAD,         # Ground supervisor
            EmployeePosition.GROUND_CREW_MEMBER        # Ground support
        ])
        
        # Add equipment operator if heavy equipment needed
        if (EquipmentCategory.CRANE_TRUCK in self.equipment_needs or 
            EquipmentCategory.SKID_STEER_MULCHER in self.equipment_needs):
            crew_positions.append(EmployeePosition.EQUIPMENT_OPERATOR)
        
        # Additional ground crew for large projects
        if len(self.project.trees) > 3 or self.treescore > 15000:
            crew_positions.append(EmployeePosition.GROUND_CREW_MEMBER)
        
        self.crew_needs = crew_positions
        
        print(f"👥 Required Crew ({len(crew_positions)} people):")
        for position in crew_positions:
            print(f"   • {position.value}")
        
        return self
    
    def calculate_true_costs(self):
        """Step 5: True Cost Calculation"""
        print(f"\n💰 TRUE COST CALCULATION")
        print("-" * 40)
        
        # Calculate equipment costs
        total_equipment_cost = 0
        equipment_details = []
        
        print(f"🚛 Equipment Costs (per hour):")
        for equipment in self.equipment_needs:
            # Apply severity factor based on AFISS score
            if self.treescore > 15000:  # High complexity
                severity_factor = 1.25  # Heavy vegetation/complex conditions
            elif self.treescore > 8000:  # Moderate complexity
                severity_factor = 1.1   # Standard work
            else:
                severity_factor = 1.0   # Light residential
            
            cost_per_hour = calculate_equipment_cost_simple(equipment, severity_factor)
            total_equipment_cost += cost_per_hour
            equipment_details.append((equipment.value, cost_per_hour))
            print(f"   • {equipment.value}: ${cost_per_hour:.2f}/hr")
        
        # Calculate employee costs
        total_employee_cost = 0
        employee_details = []
        
        print(f"\n👷 Employee Costs (true hourly cost):")
        for position in self.crew_needs:
            true_cost = calculate_employee_cost_simple(position)
            total_employee_cost += true_cost
            employee_details.append((position.value, true_cost))
            print(f"   • {position.value}: ${true_cost:.2f}/hr")
        
        # Small tools pool (calculated per crew)
        small_tools_cost = 4.70  # From our small tools calculation
        
        # Total cost per hour
        total_cost_per_hour = total_equipment_cost + total_employee_cost + small_tools_cost
        
        # Project total cost
        self.total_cost = total_cost_per_hour * self.project.estimated_hours
        
        print(f"\n📊 Cost Summary:")
        print(f"   Equipment Total: ${total_equipment_cost:.2f}/hr")
        print(f"   Employee Total: ${total_employee_cost:.2f}/hr") 
        print(f"   Small Tools Pool: ${small_tools_cost:.2f}/hr")
        print(f"   Total Cost/Hour: ${total_cost_per_hour:.2f}/hr")
        print(f"   Project Duration: {self.project.estimated_hours} hours")
        print(f"   PROJECT TOTAL COST: ${self.total_cost:.2f}")
        
        return self
    
    def generate_pricing_recommendation(self):
        """Step 6: Pricing Recommendation"""
        print(f"\n🎯 PRICING RECOMMENDATION")
        print("-" * 40)
        
        # Target margin based on project complexity
        if self.treescore > 15000:
            target_margin = 0.35  # 35% margin for high complexity
            margin_desc = "High Complexity"
        elif self.treescore > 8000:
            target_margin = 0.30  # 30% margin for moderate complexity
            margin_desc = "Moderate Complexity"
        else:
            target_margin = 0.25  # 25% margin for standard work
            margin_desc = "Standard Work"
        
        # Calculate recommended price
        self.recommended_price = self.total_cost / (1 - target_margin)
        
        # Alternative pricing scenarios
        conservative_price = self.total_cost / (1 - 0.20)  # 20% margin
        aggressive_price = self.total_cost / (1 - 0.40)    # 40% margin
        
        print(f"📈 Pricing Analysis:")
        print(f"   True Project Cost: ${self.total_cost:.2f}")
        print(f"   Complexity Level: {margin_desc}")
        print(f"   Target Margin: {target_margin:.0%}")
        print(f"   ")
        print(f"💡 Pricing Options:")
        print(f"   Conservative (20% margin): ${conservative_price:.2f}")
        print(f"   RECOMMENDED ({target_margin:.0%} margin): ${self.recommended_price:.2f}")
        print(f"   Premium (40% margin): ${aggressive_price:.2f}")
        
        # Competitive analysis
        market_rate_per_hour = 85  # Typical market rate
        market_estimate = market_rate_per_hour * self.project.estimated_hours
        
        print(f"\n🏪 Market Comparison:")
        print(f"   Typical Market Rate: ${market_rate_per_hour}/hr")
        print(f"   Market Estimate: ${market_estimate:.2f}")
        print(f"   Our Recommended Price: ${self.recommended_price:.2f}")
        
        if self.recommended_price > market_estimate:
            premium = ((self.recommended_price - market_estimate) / market_estimate) * 100
            print(f"   Premium over market: +{premium:.1f}%")
            print(f"   ✅ Justified by complexity and true cost analysis")
        else:
            savings = ((market_estimate - self.recommended_price) / market_estimate) * 100
            print(f"   Savings vs market: -{savings:.1f}%")
            print(f"   🎯 Competitive pricing with known profit margin")
        
        return self
    
    def generate_proposal_summary(self):
        """Step 7: Proposal Summary"""
        print(f"\n📋 PROPOSAL SUMMARY")
        print("=" * 60)
        
        print(f"Project: {self.project.description}")
        print(f"Location: {self.project.address}")
        largest_tree = max(self.project.trees, key=lambda t: t.dbh)
        print(f"Scope: {len(self.project.trees)} trees, largest {largest_tree.height}ft/{largest_tree.dbh}\" × {largest_tree.crown_radius}ft CR")
        print(f"")
        print(f"Risk Assessment:")
        print(f"• TreeScore: {self.treescore:.0f} points")
        print(f"• AFISS Factors: {len(self.afiss_factors)} identified")
        print(f"• Complexity: {'High' if self.treescore > 15000 else 'Moderate' if self.treescore > 8000 else 'Standard'}")
        print(f"")
        print(f"Resource Requirements:")
        print(f"• Equipment: {len(self.equipment_needs)} pieces")
        print(f"• Crew: {len(self.crew_needs)} people")
        print(f"• Duration: {self.project.estimated_hours} hours")
        print(f"")
        print(f"Investment Breakdown:")
        print(f"• True Project Cost: ${self.total_cost:.2f}")
        print(f"• Recommended Price: ${self.recommended_price:.2f}")
        print(f"• Your Investment: ${self.recommended_price:.2f}")
        
        print(f"\n✅ PRICING INTELLIGENCE COMPLETE")
        print(f"Alex has calculated the true cost and optimal pricing")
        print(f"for this project using proven methodologies.")
        
        return self

def run_example_workflow():
    """Run the complete workflow example"""
    
    # Example project: Large oak removal in residential area
    oak_tree = TreeDetails(
        dbh=42,          # 42-inch diameter
        height=85,       # 85 feet tall  
        crown_radius=35  # 35-foot crown radius
    )
    
    oak_stump = StumpDetails(
        diameter=44,     # Slightly larger than DBH at ground level
        complexity="moderate"  # Moderate complexity due to size
    )
    
    project = ProjectDetails(
        address="123 Oak Street, Residential Neighborhood",
        description="Remove large red oak tree threatening house",
        trees=[oak_tree],
        stumps=[oak_stump],
        project_type=ProjectType.RESIDENTIAL_REMOVAL,
        estimated_hours=8.0,  # Full day job
        access_challenges=["narrow street", "power lines nearby"],
        special_requirements=["protect house", "stump grinding included"]
    )
    
    # Run Alex's complete pricing workflow
    workflow = AlexPricingWorkflow()
    
    result = (workflow
              .analyze_project(project)
              .assess_afiss_factors()
              .determine_equipment_needs()
              .determine_crew_requirements()
              .calculate_true_costs()
              .generate_pricing_recommendation()
              .generate_proposal_summary())
    
    return result

if __name__ == "__main__":
    print("🤖 Starting Alex Pricing Intelligence Workflow Example...")
    print()
    
    try:
        result = run_example_workflow()
        print(f"\n🎉 Workflow completed successfully!")
        print(f"💰 Final Price Recommendation: ${result.recommended_price:.2f}")
        
    except Exception as e:
        print(f"❌ Error in workflow: {str(e)}")
        import traceback
        traceback.print_exc()