#!/usr/bin/env python3
"""
TreeAI True Hourly Employee Cost Calculator
Implements comprehensive employee costing including all burden costs and non-productive time
"""

import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import structlog

logger = structlog.get_logger()

class EmployeePosition(Enum):
    ISA_CERTIFIED_ARBORIST = "isa_certified_arborist"
    EXPERIENCED_CLIMBER = "experienced_climber"
    GROUND_CREW_LEAD = "ground_crew_lead"
    GROUND_CREW_MEMBER = "ground_crew_member"
    EQUIPMENT_OPERATOR = "equipment_operator"
    APPRENTICE = "apprentice"
    CREW_SUPERVISOR = "crew_supervisor"
    SAFETY_MANAGER = "safety_manager"

class LocationState(Enum):
    FLORIDA = "florida"
    GEORGIA = "georgia"
    TEXAS = "texas"
    CALIFORNIA = "california"
    NORTH_CAROLINA = "north_carolina"
    # Add more states as needed

@dataclass
class EmployeeBurdenFactors:
    """Burden cost factors for tree care industry"""
    payroll_taxes_rate: float = 0.0765  # FICA 7.65%
    federal_unemployment_rate: float = 0.006  # FUTA 0.6%
    state_unemployment_rate: float = 0.027  # FL SUTA average
    workers_comp_rate: float = 0.12  # 12% for tree care (high-risk)
    health_insurance_annual: float = 8000  # Annual per employee
    equipment_ppe_annual: float = 3000  # PPE, tools, uniforms
    vehicle_allocation_annual: float = 5000  # Vehicle costs per employee
    training_certification_annual: float = 2000  # Training costs
    overhead_allocation_rate: float = 0.20  # 20% general overhead

@dataclass
class NonProductiveTime:
    """Non-productive time factors"""
    pto_sick_hours: int = 100  # PTO and sick days
    training_hours: int = 60  # Continuing education
    equipment_maintenance_downtime: int = 50  # Equipment maintenance time
    weather_delay_hours: int = 80  # Weather delays (varies by region)
    administrative_time: int = 100  # Paperwork, meetings, etc.
    
    @property
    def total_non_productive_hours(self) -> int:
        return (self.pto_sick_hours + self.training_hours + 
                self.equipment_maintenance_downtime + self.weather_delay_hours + 
                self.administrative_time)

@dataclass
class EmployeeCostBreakdown:
    """Complete employee cost breakdown"""
    employee_id: str
    position: EmployeePosition
    location_state: LocationState
    
    # Base compensation
    hourly_rate: float
    annual_base_wages: float
    
    # Burden costs (annual)
    payroll_taxes: float
    unemployment_taxes: float
    workers_compensation: float
    health_insurance: float
    equipment_ppe: float
    vehicle_allocation: float
    training_certification: float
    overhead_allocation: float
    total_annual_burden: float
    
    # Time analysis
    total_scheduled_hours: int
    non_productive_hours: int
    productive_hours: int
    
    # Final calculations
    total_annual_cost: float
    true_hourly_cost: float
    burden_multiplier: float
    
    # Performance metrics
    productive_hour_percentage: float
    cost_per_productive_hour: float

class TrueHourlyEmployeeCostCalculator:
    """Main calculator for true hourly employee costs"""
    
    def __init__(self):
        self.default_burden_factors = EmployeeBurdenFactors()
        self.default_non_productive_time = NonProductiveTime()
        self.standard_annual_hours = 2080  # 40 hours/week × 52 weeks
        
        # Position-specific base rates (market data for tree care industry)
        self.position_base_rates = {
            EmployeePosition.ISA_CERTIFIED_ARBORIST: 32.0,
            EmployeePosition.EXPERIENCED_CLIMBER: 28.0,
            EmployeePosition.GROUND_CREW_LEAD: 22.0,
            EmployeePosition.GROUND_CREW_MEMBER: 18.0,
            EmployeePosition.EQUIPMENT_OPERATOR: 25.0,
            EmployeePosition.APPRENTICE: 15.0,
            EmployeePosition.CREW_SUPERVISOR: 35.0,
            EmployeePosition.SAFETY_MANAGER: 40.0
        }
        
        # State-specific adjustments for workers' comp and unemployment
        self.state_adjustments = {
            LocationState.FLORIDA: {
                "workers_comp_rate": 0.12,
                "state_unemployment_rate": 0.027,
                "weather_delay_hours": 80
            },
            LocationState.GEORGIA: {
                "workers_comp_rate": 0.10,
                "state_unemployment_rate": 0.025,
                "weather_delay_hours": 60
            },
            LocationState.TEXAS: {
                "workers_comp_rate": 0.11,
                "state_unemployment_rate": 0.026,
                "weather_delay_hours": 40
            },
            LocationState.CALIFORNIA: {
                "workers_comp_rate": 0.15,  # Higher in CA
                "state_unemployment_rate": 0.034,
                "weather_delay_hours": 20
            },
            LocationState.NORTH_CAROLINA: {
                "workers_comp_rate": 0.09,
                "state_unemployment_rate": 0.024,
                "weather_delay_hours": 50
            }
        }
    
    def calculate_true_hourly_cost(self,
                                 position: EmployeePosition,
                                 location_state: LocationState,
                                 hourly_rate: Optional[float] = None,
                                 custom_burden_factors: Optional[EmployeeBurdenFactors] = None,
                                 custom_non_productive_time: Optional[NonProductiveTime] = None) -> EmployeeCostBreakdown:
        """Calculate true hourly cost for an employee"""
        
        logger.info("Calculating true hourly employee cost", 
                   position=position.value, 
                   location=location_state.value)
        
        # Use provided rate or default for position
        if hourly_rate is None:
            hourly_rate = self.position_base_rates[position]
        
        # Use custom factors or defaults
        burden_factors = custom_burden_factors or self.default_burden_factors
        non_productive_time = custom_non_productive_time or self.default_non_productive_time
        
        # Apply state-specific adjustments
        state_adjustments = self.state_adjustments.get(location_state, {})
        if state_adjustments:
            # Create a copy of burden factors with state adjustments
            burden_factors = EmployeeBurdenFactors(
                payroll_taxes_rate=burden_factors.payroll_taxes_rate,
                federal_unemployment_rate=burden_factors.federal_unemployment_rate,
                state_unemployment_rate=state_adjustments.get("state_unemployment_rate", burden_factors.state_unemployment_rate),
                workers_comp_rate=state_adjustments.get("workers_comp_rate", burden_factors.workers_comp_rate),
                health_insurance_annual=burden_factors.health_insurance_annual,
                equipment_ppe_annual=burden_factors.equipment_ppe_annual,
                vehicle_allocation_annual=burden_factors.vehicle_allocation_annual,
                training_certification_annual=burden_factors.training_certification_annual,
                overhead_allocation_rate=burden_factors.overhead_allocation_rate
            )
            
            # Adjust weather delay hours
            non_productive_time = NonProductiveTime(
                pto_sick_hours=non_productive_time.pto_sick_hours,
                training_hours=non_productive_time.training_hours,
                equipment_maintenance_downtime=non_productive_time.equipment_maintenance_downtime,
                weather_delay_hours=state_adjustments.get("weather_delay_hours", non_productive_time.weather_delay_hours),
                administrative_time=non_productive_time.administrative_time
            )
        
        # Calculate annual base wages
        annual_base_wages = hourly_rate * self.standard_annual_hours
        
        # Calculate burden costs
        payroll_taxes = annual_base_wages * burden_factors.payroll_taxes_rate
        unemployment_taxes = annual_base_wages * (burden_factors.federal_unemployment_rate + burden_factors.state_unemployment_rate)
        workers_compensation = annual_base_wages * burden_factors.workers_comp_rate
        health_insurance = burden_factors.health_insurance_annual
        equipment_ppe = burden_factors.equipment_ppe_annual
        vehicle_allocation = burden_factors.vehicle_allocation_annual
        training_certification = burden_factors.training_certification_annual
        overhead_allocation = annual_base_wages * burden_factors.overhead_allocation_rate
        
        total_annual_burden = (payroll_taxes + unemployment_taxes + workers_compensation + 
                              health_insurance + equipment_ppe + vehicle_allocation + 
                              training_certification + overhead_allocation)
        
        # Calculate productive hours
        total_scheduled_hours = self.standard_annual_hours
        total_non_productive_hours = non_productive_time.total_non_productive_hours
        productive_hours = total_scheduled_hours - total_non_productive_hours
        
        # Calculate final costs
        total_annual_cost = annual_base_wages + total_annual_burden
        true_hourly_cost = total_annual_cost / productive_hours
        burden_multiplier = total_annual_cost / annual_base_wages
        
        # Performance metrics
        productive_hour_percentage = (productive_hours / total_scheduled_hours) * 100
        cost_per_productive_hour = true_hourly_cost
        
        breakdown = EmployeeCostBreakdown(
            employee_id=f"{position.value}_{location_state.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            position=position,
            location_state=location_state,
            
            hourly_rate=hourly_rate,
            annual_base_wages=annual_base_wages,
            
            payroll_taxes=payroll_taxes,
            unemployment_taxes=unemployment_taxes,
            workers_compensation=workers_compensation,
            health_insurance=health_insurance,
            equipment_ppe=equipment_ppe,
            vehicle_allocation=vehicle_allocation,
            training_certification=training_certification,
            overhead_allocation=overhead_allocation,
            total_annual_burden=total_annual_burden,
            
            total_scheduled_hours=total_scheduled_hours,
            non_productive_hours=total_non_productive_hours,
            productive_hours=productive_hours,
            
            total_annual_cost=total_annual_cost,
            true_hourly_cost=true_hourly_cost,
            burden_multiplier=burden_multiplier,
            
            productive_hour_percentage=productive_hour_percentage,
            cost_per_productive_hour=cost_per_productive_hour
        )
        
        logger.info("True hourly employee cost calculated",
                   position=position.value,
                   hourly_rate=hourly_rate,
                   true_hourly_cost=true_hourly_cost,
                   burden_multiplier=burden_multiplier)
        
        return breakdown
    
    def calculate_crew_cost(self, 
                           crew_composition: List[Dict[str, Any]],
                           location_state: LocationState) -> Dict[str, Any]:
        """Calculate total cost for a crew with multiple employees"""
        
        logger.info("Calculating crew cost", 
                   crew_size=len(crew_composition),
                   location=location_state.value)
        
        crew_members = []
        total_hourly_rate = 0.0
        total_true_cost = 0.0
        total_burden_cost = 0.0
        
        for member in crew_composition:
            position = EmployeePosition(member["position"])
            hourly_rate = member.get("hourly_rate")
            
            employee_cost = self.calculate_true_hourly_cost(
                position=position,
                location_state=location_state,
                hourly_rate=hourly_rate
            )
            
            crew_members.append(asdict(employee_cost))
            total_hourly_rate += employee_cost.hourly_rate
            total_true_cost += employee_cost.true_hourly_cost
            total_burden_cost += (employee_cost.true_hourly_cost - employee_cost.hourly_rate)
        
        avg_burden_multiplier = total_true_cost / total_hourly_rate
        
        crew_cost_summary = {
            "crew_members": crew_members,
            "crew_summary": {
                "total_base_hourly_rate": total_hourly_rate,
                "total_true_hourly_cost": total_true_cost,
                "total_burden_cost_per_hour": total_burden_cost,
                "average_burden_multiplier": avg_burden_multiplier,
                "crew_size": len(crew_composition),
                "location_state": location_state.value
            }
        }
        
        logger.info("Crew cost calculated",
                   crew_size=len(crew_composition),
                   total_true_cost=total_true_cost,
                   avg_burden_multiplier=avg_burden_multiplier)
        
        return crew_cost_summary
    
    def compare_hiring_scenarios(self,
                               position: EmployeePosition,
                               location_state: LocationState,
                               hourly_rates: List[float]) -> Dict[str, Any]:
        """Compare different hiring scenarios for the same position"""
        
        scenarios = []
        
        for rate in hourly_rates:
            cost_breakdown = self.calculate_true_hourly_cost(
                position=position,
                location_state=location_state,
                hourly_rate=rate
            )
            
            scenarios.append({
                "hourly_rate": rate,
                "true_hourly_cost": cost_breakdown.true_hourly_cost,
                "annual_cost": cost_breakdown.total_annual_cost,
                "burden_multiplier": cost_breakdown.burden_multiplier,
                "cost_difference_vs_rate": cost_breakdown.true_hourly_cost - rate
            })
        
        return {
            "position": position.value,
            "location_state": location_state.value,
            "scenarios": scenarios
        }

# ============================================================================
# DEMONSTRATION AND EXAMPLES
# ============================================================================

def demonstrate_employee_costing():
    """Demonstrate the true hourly employee cost calculator"""
    
    print("👷 TreeAI True Hourly Employee Cost Calculator Demo")
    print("=" * 65)
    
    calculator = TrueHourlyEmployeeCostCalculator()
    
    # Example 1: Single employee cost calculation
    print("\n📊 Example 1: ISA Certified Arborist in Florida")
    print("-" * 50)
    
    arborist_cost = calculator.calculate_true_hourly_cost(
        position=EmployeePosition.ISA_CERTIFIED_ARBORIST,
        location_state=LocationState.FLORIDA,
        hourly_rate=25.0
    )
    
    print(f"Position: {arborist_cost.position.value.replace('_', ' ').title()}")
    print(f"Location: {arborist_cost.location_state.value.title()}")
    print(f"Base Hourly Rate: ${arborist_cost.hourly_rate:.2f}")
    print(f"\nAnnual Base Wages: ${arborist_cost.annual_base_wages:,.0f}")
    print(f"\nBurden Costs (Annual):")
    print(f"  • Payroll Taxes: ${arborist_cost.payroll_taxes:,.0f}")
    print(f"  • Unemployment Taxes: ${arborist_cost.unemployment_taxes:,.0f}")
    print(f"  • Workers' Compensation: ${arborist_cost.workers_compensation:,.0f}")
    print(f"  • Health Insurance: ${arborist_cost.health_insurance:,.0f}")
    print(f"  • Equipment/PPE: ${arborist_cost.equipment_ppe:,.0f}")
    print(f"  • Vehicle Allocation: ${arborist_cost.vehicle_allocation:,.0f}")
    print(f"  • Training/Certification: ${arborist_cost.training_certification:,.0f}")
    print(f"  • Overhead Allocation: ${arborist_cost.overhead_allocation:,.0f}")
    print(f"  • Total Annual Burden: ${arborist_cost.total_annual_burden:,.0f}")
    print(f"\nTime Analysis:")
    print(f"  • Total Scheduled Hours: {arborist_cost.total_scheduled_hours:,}")
    print(f"  • Non-Productive Hours: {arborist_cost.non_productive_hours:,}")
    print(f"  • Productive Hours: {arborist_cost.productive_hours:,}")
    print(f"  • Productive Hour %: {arborist_cost.productive_hour_percentage:.1f}%")
    print(f"\n💰 TRUE HOURLY COST: ${arborist_cost.true_hourly_cost:.2f}")
    print(f"Burden Multiplier: {arborist_cost.burden_multiplier:.2f}x")
    print(f"Cost Increase: ${arborist_cost.true_hourly_cost - arborist_cost.hourly_rate:.2f}/hr (+{((arborist_cost.burden_multiplier - 1) * 100):.0f}%)")
    
    # Example 2: Crew cost calculation
    print("\n\n📊 Example 2: Complete Tree Service Crew")
    print("-" * 50)
    
    crew_composition = [
        {"position": "isa_certified_arborist", "hourly_rate": 32.0},
        {"position": "experienced_climber", "hourly_rate": 28.0},
        {"position": "ground_crew_lead", "hourly_rate": 22.0},
        {"position": "ground_crew_member", "hourly_rate": 18.0}
    ]
    
    crew_cost = calculator.calculate_crew_cost(
        crew_composition=crew_composition,
        location_state=LocationState.FLORIDA
    )
    
    print(f"Crew Composition ({crew_cost['crew_summary']['crew_size']} members):")
    for i, member in enumerate(crew_cost['crew_members'], 1):
        position_name = member['position'].replace('_', ' ').title()
        print(f"  {i}. {position_name}: ${member['hourly_rate']:.2f}/hr → ${member['true_hourly_cost']:.2f}/hr")
    
    print(f"\n💰 CREW COST SUMMARY:")
    print(f"  • Total Base Hourly Rate: ${crew_cost['crew_summary']['total_base_hourly_rate']:.2f}/hr")
    print(f"  • Total True Hourly Cost: ${crew_cost['crew_summary']['total_true_hourly_cost']:.2f}/hr")
    print(f"  • Total Burden Cost: ${crew_cost['crew_summary']['total_burden_cost_per_hour']:.2f}/hr")
    print(f"  • Average Burden Multiplier: {crew_cost['crew_summary']['average_burden_multiplier']:.2f}x")
    
    hidden_cost = crew_cost['crew_summary']['total_true_hourly_cost'] - crew_cost['crew_summary']['total_base_hourly_rate']
    print(f"\n🚨 HIDDEN COST: ${hidden_cost:.2f}/hr you weren't accounting for!")
    
    # Example 3: Hiring scenario comparison
    print("\n\n📊 Example 3: Ground Crew Member Hiring Scenarios")
    print("-" * 50)
    
    scenarios = calculator.compare_hiring_scenarios(
        position=EmployeePosition.GROUND_CREW_MEMBER,
        location_state=LocationState.FLORIDA,
        hourly_rates=[15.0, 18.0, 20.0, 22.0]
    )
    
    print(f"Position: {scenarios['position'].replace('_', ' ').title()}")
    print(f"Location: {scenarios['location_state'].title()}")
    print(f"\n{'Base Rate':<10} {'True Cost':<10} {'Annual':<12} {'Multiplier':<10} {'Hidden Cost'}")
    print("-" * 60)
    
    for scenario in scenarios['scenarios']:
        print(f"${scenario['hourly_rate']:<9.2f} "
              f"${scenario['true_hourly_cost']:<9.2f} "
              f"${scenario['annual_cost']:<11,.0f} "
              f"{scenario['burden_multiplier']:<9.2f}x "
              f"${scenario['cost_difference_vs_rate']:.2f}/hr")
    
    # Example 4: State comparison
    print("\n\n📊 Example 4: State-by-State Comparison")
    print("-" * 50)
    
    states_to_compare = [LocationState.FLORIDA, LocationState.CALIFORNIA, LocationState.TEXAS]
    
    print(f"Position: Ground Crew Member @ $18/hr")
    print(f"\n{'State':<15} {'True Cost':<12} {'Workers Comp':<13} {'Weather Delays'}")
    print("-" * 55)
    
    for state in states_to_compare:
        cost = calculator.calculate_true_hourly_cost(
            position=EmployeePosition.GROUND_CREW_MEMBER,
            location_state=state,
            hourly_rate=18.0
        )
        
        wc_rate = calculator.state_adjustments[state]["workers_comp_rate"] * 100
        weather_hours = calculator.state_adjustments[state]["weather_delay_hours"]
        
        print(f"{state.value.title():<15} "
              f"${cost.true_hourly_cost:<11.2f} "
              f"{wc_rate:<12.1f}% "
              f"{weather_hours} hours")
    
    print(f"\n✅ True Hourly Employee Cost Calculator Demo Complete!")
    print(f"🎯 Key Insight: That $25/hour employee actually costs you $50+/hour!")
    print(f"💡 Use this for accurate job pricing and profitability analysis!")

if __name__ == "__main__":
    demonstrate_employee_costing()