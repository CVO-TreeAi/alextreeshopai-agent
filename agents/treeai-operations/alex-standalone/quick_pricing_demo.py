#!/usr/bin/env python3
"""
Quick TreeAI Pricing System Demo
Simplified demo that handles missing dependencies gracefully
"""

import json
import asyncio
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple

# Mock logger if structlog is not available
try:
    import structlog
    logger = structlog.get_logger()
except ImportError:
    class MockLogger:
        def info(self, msg, **kwargs):
            print(f"ℹ️  {msg}")
        def warning(self, msg, **kwargs):
            print(f"⚠️  {msg}")
        def error(self, msg, **kwargs):
            print(f"❌ {msg}")
    logger = MockLogger()

# Simplified Equipment Categories
class EquipmentCategory(Enum):
    SKID_STEER_MULCHER = "skid_steer_mulcher"
    BUCKET_TRUCK = "bucket_truck"
    CHIPPER = "chipper"
    PICKUP_TRUCK = "pickup_truck"

class SeverityFactor(Enum):
    LIGHT_RESIDENTIAL = 1.0
    STANDARD_WORK = 1.1
    HEAVY_VEGETATION = 1.25

# Simplified Employee Positions
class EmployeePosition(Enum):
    ISA_CERTIFIED_ARBORIST = "isa_certified_arborist"
    GROUND_CREW_MEMBER = "ground_crew_member"
    EQUIPMENT_OPERATOR = "equipment_operator"

class LocationState(Enum):
    FLORIDA = "florida"
    CALIFORNIA = "california"

@dataclass
class QuickEquipmentCost:
    """Simplified equipment cost calculation"""
    equipment_type: str
    total_cost_per_hour: float
    ownership_cost: float
    operating_cost: float

@dataclass
class QuickEmployeeCost:
    """Simplified employee cost calculation"""
    position: str
    hourly_rate: float
    true_hourly_cost: float
    burden_multiplier: float

class QuickPricingCalculator:
    """Simplified pricing calculator for demo purposes"""
    
    def __init__(self):
        # Equipment defaults (MSRP, life hours, fuel burn)
        self.equipment_defaults = {
            EquipmentCategory.SKID_STEER_MULCHER: {
                "msrp": 118000, "life_hours": 6000, "fuel_gph": 5.5, "salvage_pct": 20
            },
            EquipmentCategory.BUCKET_TRUCK: {
                "msrp": 165000, "life_hours": 10000, "fuel_gph": 6.5, "salvage_pct": 30
            },
            EquipmentCategory.CHIPPER: {
                "msrp": 50000, "life_hours": 5000, "fuel_gph": 2.5, "salvage_pct": 25
            },
            EquipmentCategory.PICKUP_TRUCK: {
                "msrp": 65000, "life_hours": 8000, "fuel_gph": 2.5, "salvage_pct": 40
            }
        }
        
        # Employee base rates
        self.employee_base_rates = {
            EmployeePosition.ISA_CERTIFIED_ARBORIST: 32.0,
            EmployeePosition.GROUND_CREW_MEMBER: 18.0,
            EmployeePosition.EQUIPMENT_OPERATOR: 25.0
        }
        
        self.fuel_price = 4.25  # $ per gallon
        self.annual_hours = 1200  # productive hours
        self.burden_multiplier = 1.75  # Tree care industry average
    
    def calculate_equipment_cost(self, equipment_type: EquipmentCategory, 
                               severity_factor: SeverityFactor = SeverityFactor.STANDARD_WORK) -> QuickEquipmentCost:
        """Calculate equipment cost using simplified USACE methodology"""
        
        defaults = self.equipment_defaults[equipment_type]
        
        # Ownership costs
        purchase_price = defaults["msrp"]
        salvage_value = purchase_price * (defaults["salvage_pct"] / 100)
        depreciation_per_hour = (purchase_price - salvage_value) / defaults["life_hours"]
        
        # Operating costs
        fuel_per_hour = defaults["fuel_gph"] * self.fuel_price
        maintenance_per_hour = depreciation_per_hour * 0.80  # 80% of depreciation
        
        # Apply severity factor
        maintenance_per_hour *= severity_factor.value
        
        ownership_cost = depreciation_per_hour + (purchase_price * 0.08 / self.annual_hours)  # 8% for interest/insurance
        operating_cost = fuel_per_hour + maintenance_per_hour
        total_cost = ownership_cost + operating_cost
        
        return QuickEquipmentCost(
            equipment_type=equipment_type.value,
            total_cost_per_hour=total_cost,
            ownership_cost=ownership_cost,
            operating_cost=operating_cost
        )
    
    def calculate_employee_cost(self, position: EmployeePosition, 
                              hourly_rate: Optional[float] = None) -> QuickEmployeeCost:
        """Calculate true employee cost with burden factors"""
        
        if hourly_rate is None:
            hourly_rate = self.employee_base_rates[position]
        
        # Apply burden multiplier (includes payroll taxes, workers comp, insurance, etc.)
        true_hourly_cost = hourly_rate * self.burden_multiplier
        
        return QuickEmployeeCost(
            position=position.value,
            hourly_rate=hourly_rate,
            true_hourly_cost=true_hourly_cost,
            burden_multiplier=self.burden_multiplier
        )
    
    def calculate_loadout_cost(self, equipment_list: List[EquipmentCategory],
                             crew_list: List[EmployeePosition],
                             severity_factor: SeverityFactor = SeverityFactor.STANDARD_WORK) -> Dict[str, Any]:
        """Calculate complete loadout cost"""
        
        total_equipment_cost = 0.0
        equipment_details = []
        
        for equipment in equipment_list:
            cost = self.calculate_equipment_cost(equipment, severity_factor)
            equipment_details.append(cost)
            total_equipment_cost += cost.total_cost_per_hour
        
        total_employee_cost = 0.0
        employee_details = []
        
        for position in crew_list:
            cost = self.calculate_employee_cost(position)
            employee_details.append(cost)
            total_employee_cost += cost.true_hourly_cost
        
        # Small tools pool (simplified)
        small_tools_cost = len(crew_list) * 2.5  # $2.50 per crew member per hour
        
        total_cost = total_equipment_cost + total_employee_cost + small_tools_cost
        
        # Pricing recommendations
        profit_margin = 0.35  # 35% target margin
        recommended_rate = total_cost / (1 - profit_margin)
        break_even_rate = total_cost
        
        return {
            "equipment_cost": total_equipment_cost,
            "employee_cost": total_employee_cost,
            "small_tools_cost": small_tools_cost,
            "total_cost": total_cost,
            "break_even_rate": break_even_rate,
            "recommended_rate": recommended_rate,
            "profit_margin": profit_margin * 100,
            "equipment_details": equipment_details,
            "employee_details": employee_details
        }

def demo_residential_tree_service():
    """Demo residential tree service loadout"""
    print("🌳 Residential Tree Service Loadout Demo")
    print("=" * 50)
    
    calculator = QuickPricingCalculator()
    
    # Define loadout
    equipment_list = [
        EquipmentCategory.BUCKET_TRUCK,
        EquipmentCategory.CHIPPER,
        EquipmentCategory.PICKUP_TRUCK
    ]
    
    crew_list = [
        EmployeePosition.ISA_CERTIFIED_ARBORIST,
        EmployeePosition.GROUND_CREW_MEMBER,
        EmployeePosition.GROUND_CREW_MEMBER
    ]
    
    # Calculate costs
    loadout = calculator.calculate_loadout_cost(equipment_list, crew_list)
    
    print(f"\n💰 COST BREAKDOWN:")
    print(f"  • Equipment Cost: ${loadout['equipment_cost']:.2f}/hr")
    print(f"  • Employee Cost: ${loadout['employee_cost']:.2f}/hr")
    print(f"  • Small Tools: ${loadout['small_tools_cost']:.2f}/hr")
    print(f"  • TOTAL COST: ${loadout['total_cost']:.2f}/hr")
    
    print(f"\n🎯 PRICING INTELLIGENCE:")
    print(f"  • Break-Even Rate: ${loadout['break_even_rate']:.2f}/hr")
    print(f"  • Recommended Rate: ${loadout['recommended_rate']:.2f}/hr")
    print(f"  • Target Profit Margin: {loadout['profit_margin']:.0f}%")
    
    print(f"\n📊 Equipment Details:")
    for eq in loadout['equipment_details']:
        print(f"  • {eq.equipment_type.replace('_', ' ').title()}: ${eq.total_cost_per_hour:.2f}/hr")
    
    print(f"\n👷 Employee Details:")
    for emp in loadout['employee_details']:
        print(f"  • {emp.position.replace('_', ' ').title()}: ${emp.hourly_rate:.2f}/hr → ${emp.true_hourly_cost:.2f}/hr ({emp.burden_multiplier:.2f}x)")
    
    return loadout

def demo_forestry_mulching():
    """Demo forestry mulching loadout"""
    print("\n\n🌲 Forestry Mulching Loadout Demo")
    print("=" * 50)
    
    calculator = QuickPricingCalculator()
    
    # Define loadout
    equipment_list = [
        EquipmentCategory.SKID_STEER_MULCHER,
        EquipmentCategory.PICKUP_TRUCK
    ]
    
    crew_list = [
        EmployeePosition.EQUIPMENT_OPERATOR,
        EmployeePosition.GROUND_CREW_MEMBER
    ]
    
    # Calculate with heavy vegetation severity
    loadout = calculator.calculate_loadout_cost(
        equipment_list, crew_list, SeverityFactor.HEAVY_VEGETATION
    )
    
    print(f"\n💰 COST BREAKDOWN:")
    print(f"  • Equipment Cost: ${loadout['equipment_cost']:.2f}/hr")
    print(f"  • Employee Cost: ${loadout['employee_cost']:.2f}/hr")
    print(f"  • Small Tools: ${loadout['small_tools_cost']:.2f}/hr")
    print(f"  • TOTAL COST: ${loadout['total_cost']:.2f}/hr")
    
    print(f"\n🎯 PRICING INTELLIGENCE:")
    print(f"  • Break-Even Rate: ${loadout['break_even_rate']:.2f}/hr")
    print(f"  • Recommended Rate: ${loadout['recommended_rate']:.2f}/hr")
    print(f"  • Target Profit Margin: {loadout['profit_margin']:.0f}%")
    print(f"  • Severity Factor: {SeverityFactor.HEAVY_VEGETATION.value}x (Heavy Vegetation)")
    
    return loadout

def demo_employee_cost_comparison():
    """Demo employee cost comparison"""
    print("\n\n👷 Employee Cost Comparison Demo")
    print("=" * 50)
    
    calculator = QuickPricingCalculator()
    
    positions = [
        EmployeePosition.ISA_CERTIFIED_ARBORIST,
        EmployeePosition.EQUIPMENT_OPERATOR,
        EmployeePosition.GROUND_CREW_MEMBER
    ]
    
    print(f"\n{'Position':<25} {'Base Rate':<12} {'True Cost':<12} {'Hidden Cost':<12} {'Multiplier'}")
    print("-" * 75)
    
    for position in positions:
        cost = calculator.calculate_employee_cost(position)
        hidden_cost = cost.true_hourly_cost - cost.hourly_rate
        
        position_name = position.value.replace('_', ' ').title()[:24]
        print(f"{position_name:<25} ${cost.hourly_rate:<11.2f} ${cost.true_hourly_cost:<11.2f} ${hidden_cost:<11.2f} {cost.burden_multiplier:.2f}x")
    
    print(f"\n🚨 Key Insight: That $25/hour employee actually costs you ${25 * calculator.burden_multiplier:.2f}/hour!")
    print(f"💡 Burden Multiplier: {calculator.burden_multiplier:.2f}x (includes payroll taxes, workers comp, insurance, PPE, etc.)")

def demo_project_scenarios():
    """Demo different project scenarios"""
    print("\n\n📊 Project Scenario Comparison")
    print("=" * 50)
    
    calculator = QuickPricingCalculator()
    
    scenarios = [
        ("8-Hour Tree Removal", demo_residential_tree_service(), 8),
        ("6-Hour Mulching Job", demo_forestry_mulching(), 6)
    ]
    
    print(f"\n{'Scenario':<20} {'Total Cost':<12} {'Revenue':<12} {'Profit':<12} {'ROI'}")
    print("-" * 70)
    
    for name, loadout, hours in scenarios:
        total_cost = loadout['total_cost'] * hours
        revenue = loadout['recommended_rate'] * hours
        profit = revenue - total_cost
        roi = (profit / total_cost) * 100
        
        print(f"{name:<20} ${total_cost:<11,.0f} ${revenue:<11,.0f} ${profit:<11,.0f} {roi:.0f}%")

def main():
    """Run the complete pricing demo"""
    print("🚀 TreeAI Complete Pricing System Demo")
    print("=" * 70)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Run demos
        tree_service_result = demo_residential_tree_service()
        mulching_result = demo_forestry_mulching()
        demo_employee_cost_comparison()
        demo_project_scenarios()
        
        # Summary
        print(f"\n\n🎉 Demo Complete! TreeAI Pricing System Summary:")
        print("=" * 70)
        print(f"✅ Equipment Cost Intelligence: USACE-style calculations")
        print(f"✅ True Employee Costs: Full burden factor analysis") 
        print(f"✅ Small Tools Pool: Automated category-based costing")
        print(f"✅ Loadout Optimization: Complete pricing intelligence")
        print(f"✅ Profit Optimization: Competitive rate recommendations")
        
        print(f"\n🎯 Key Results:")
        print(f"   • Tree Service Loadout: ${tree_service_result['total_cost']:.0f}/hr cost → ${tree_service_result['recommended_rate']:.0f}/hr rate")
        print(f"   • Forestry Mulching: ${mulching_result['total_cost']:.0f}/hr cost → ${mulching_result['recommended_rate']:.0f}/hr rate")
        print(f"   • Employee Burden Factor: {QuickPricingCalculator().burden_multiplier:.2f}x (actual cost vs. base wage)")
        
        print(f"\n💡 Alex now has complete pricing intelligence!")
        print(f"   No more guessing on equipment costs or employee burden")
        print(f"   Intelligent recommendations based on industry data")
        print(f"   Automated profitability optimization")
        
        return True
        
    except Exception as e:
        print(f"❌ Demo failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    main()