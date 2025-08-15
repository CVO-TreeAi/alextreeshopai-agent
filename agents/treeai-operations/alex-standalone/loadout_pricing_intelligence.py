#!/usr/bin/env python3
"""
TreeAI Loadout Pricing Intelligence System
Complete pricing intelligence combining equipment costs, employee costs, and profitability analysis
"""

import json
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import structlog

from equipment_cost_intelligence import (
    EquipmentCostIntelligence, EquipmentCategory, SeverityFactor
)
from true_hourly_employee_cost import (
    TrueHourlyEmployeeCostCalculator, EmployeePosition, LocationState
)

logger = structlog.get_logger()

class ProjectType(Enum):
    TREE_REMOVAL = "tree_removal"
    TREE_TRIMMING = "tree_trimming"
    FORESTRY_MULCHING = "forestry_mulching"
    STUMP_GRINDING = "stump_grinding"
    EMERGENCY_RESPONSE = "emergency_response"
    LOT_CLEARING = "lot_clearing"

@dataclass
class LoadoutConfiguration:
    """Complete loadout configuration"""
    name: str
    project_type: ProjectType
    equipment_list: List[Dict[str, Any]]
    crew_composition: List[Dict[str, Any]]
    location_state: LocationState
    severity_factor: SeverityFactor

@dataclass
class LoadoutPricingBreakdown:
    """Complete loadout pricing breakdown"""
    loadout_id: str
    configuration: LoadoutConfiguration
    
    # Equipment costs
    equipment_cost_per_hour: float
    heavy_equipment_cost: float
    small_tools_cost: float
    
    # Employee costs
    employee_cost_per_hour: float
    base_wages_per_hour: float
    burden_cost_per_hour: float
    
    # Total costs
    total_cost_per_hour: float
    
    # Pricing intelligence
    recommended_billing_rate: float
    profit_margin_percentage: float
    break_even_rate: float
    competitive_rate_range: Tuple[float, float]
    
    # Performance metrics
    cost_efficiency_score: float
    profitability_score: float

class LoadoutPricingIntelligence:
    """Main loadout pricing intelligence system"""
    
    def __init__(self):
        self.equipment_engine = EquipmentCostIntelligence()
        self.employee_calculator = TrueHourlyEmployeeCostCalculator()
        
        # Industry benchmarks and profit margins
        self.target_profit_margins = {
            ProjectType.TREE_REMOVAL: 0.35,  # 35% target margin
            ProjectType.TREE_TRIMMING: 0.40,
            ProjectType.FORESTRY_MULCHING: 0.30,
            ProjectType.STUMP_GRINDING: 0.35,
            ProjectType.EMERGENCY_RESPONSE: 0.50,  # Higher margin for emergency
            ProjectType.LOT_CLEARING: 0.32
        }
        
        # Competitive rate ranges per hour (market research data)
        self.competitive_rates = {
            ProjectType.TREE_REMOVAL: (200, 350),
            ProjectType.TREE_TRIMMING: (150, 280),
            ProjectType.FORESTRY_MULCHING: (400, 600),
            ProjectType.STUMP_GRINDING: (180, 320),
            ProjectType.EMERGENCY_RESPONSE: (300, 500),
            ProjectType.LOT_CLEARING: (350, 550)
        }
        
        # Predefined loadout templates
        self.loadout_templates = self._initialize_loadout_templates()
    
    def _initialize_loadout_templates(self) -> Dict[str, LoadoutConfiguration]:
        """Initialize common loadout templates"""
        templates = {
            "residential_tree_service": LoadoutConfiguration(
                name="Residential Tree Service Crew",
                project_type=ProjectType.TREE_REMOVAL,
                equipment_list=[
                    {
                        "type": "bucket_truck",
                        "make_model": "Altec on Ford F750",
                        "purchase_price": 165000,
                        "year": 2021
                    },
                    {
                        "type": "chipper",
                        "make_model": "Bandit 150XP",
                        "purchase_price": 50000,
                        "year": 2020
                    },
                    {
                        "type": "pickup_truck",
                        "make_model": "Ford F-350",
                        "purchase_price": 65000,
                        "year": 2023
                    }
                ],
                crew_composition=[
                    {"position": "isa_certified_arborist", "hourly_rate": 32.0},
                    {"position": "experienced_climber", "hourly_rate": 28.0},
                    {"position": "ground_crew_lead", "hourly_rate": 22.0},
                    {"position": "ground_crew_member", "hourly_rate": 18.0}
                ],
                location_state=LocationState.FLORIDA,
                severity_factor=SeverityFactor.STANDARD_WORK
            ),
            
            "forestry_mulching_operation": LoadoutConfiguration(
                name="Forestry Mulching Operation",
                project_type=ProjectType.FORESTRY_MULCHING,
                equipment_list=[
                    {
                        "type": "skid_steer_mulcher",
                        "make_model": "Bobcat T770 + Denis Cimaf",
                        "purchase_price": 118000,
                        "year": 2022
                    },
                    {
                        "type": "pickup_truck",
                        "make_model": "Ford F-350 Diesel",
                        "purchase_price": 65000,
                        "year": 2023
                    }
                ],
                crew_composition=[
                    {"position": "equipment_operator", "hourly_rate": 25.0},
                    {"position": "ground_crew_lead", "hourly_rate": 22.0},
                    {"position": "ground_crew_member", "hourly_rate": 18.0}
                ],
                location_state=LocationState.FLORIDA,
                severity_factor=SeverityFactor.HEAVY_VEGETATION
            ),
            
            "stump_grinding_crew": LoadoutConfiguration(
                name="Stump Grinding Crew",
                project_type=ProjectType.STUMP_GRINDING,
                equipment_list=[
                    {
                        "type": "stump_grinder",
                        "make_model": "Carlton 7015",
                        "purchase_price": 45000,
                        "year": 2020
                    },
                    {
                        "type": "pickup_truck",
                        "make_model": "Ford F-350",
                        "purchase_price": 65000,
                        "year": 2023
                    }
                ],
                crew_composition=[
                    {"position": "equipment_operator", "hourly_rate": 25.0},
                    {"position": "ground_crew_member", "hourly_rate": 18.0}
                ],
                location_state=LocationState.FLORIDA,
                severity_factor=SeverityFactor.STANDARD_WORK
            ),
            
            "emergency_response_team": LoadoutConfiguration(
                name="Emergency Response Team",
                project_type=ProjectType.EMERGENCY_RESPONSE,
                equipment_list=[
                    {
                        "type": "bucket_truck",
                        "make_model": "Altec on Ford F750",
                        "purchase_price": 165000,
                        "year": 2021
                    },
                    {
                        "type": "chipper",
                        "make_model": "Bandit 150XP",
                        "purchase_price": 50000,
                        "year": 2020
                    },
                    {
                        "type": "pickup_truck",
                        "make_model": "Ford F-350",
                        "purchase_price": 65000,
                        "year": 2023
                    }
                ],
                crew_composition=[
                    {"position": "isa_certified_arborist", "hourly_rate": 35.0},
                    {"position": "experienced_climber", "hourly_rate": 30.0},
                    {"position": "ground_crew_lead", "hourly_rate": 25.0},
                    {"position": "ground_crew_member", "hourly_rate": 20.0},
                    {"position": "safety_manager", "hourly_rate": 40.0}
                ],
                location_state=LocationState.FLORIDA,
                severity_factor=SeverityFactor.DISASTER_RECOVERY
            )
        }
        
        return templates
    
    async def calculate_loadout_pricing(self, 
                                      loadout_config: LoadoutConfiguration) -> LoadoutPricingBreakdown:
        """Calculate complete loadout pricing breakdown"""
        
        logger.info("Calculating loadout pricing", 
                   loadout_name=loadout_config.name,
                   project_type=loadout_config.project_type.value)
        
        # Calculate equipment costs
        crew_config = self._extract_crew_config(loadout_config.crew_composition)
        equipment_cost_data = await self.equipment_engine.calculate_loadout_equipment_cost(
            equipment_list=loadout_config.equipment_list,
            crew_config=crew_config,
            severity_factor=loadout_config.severity_factor
        )
        
        equipment_cost_per_hour = equipment_cost_data['loadout_summary']['total_equipment_cost_per_hour']
        heavy_equipment_cost = equipment_cost_data['heavy_equipment']['total_cost_per_hour']
        small_tools_cost = equipment_cost_data['small_tools_pool']['total_cost_per_hour']
        
        # Calculate employee costs
        employee_cost_data = self.employee_calculator.calculate_crew_cost(
            crew_composition=loadout_config.crew_composition,
            location_state=loadout_config.location_state
        )
        
        employee_cost_per_hour = employee_cost_data['crew_summary']['total_true_hourly_cost']
        base_wages_per_hour = employee_cost_data['crew_summary']['total_base_hourly_rate']
        burden_cost_per_hour = employee_cost_data['crew_summary']['total_burden_cost_per_hour']
        
        # Calculate total costs
        total_cost_per_hour = equipment_cost_per_hour + employee_cost_per_hour
        
        # Calculate pricing intelligence
        target_margin = self.target_profit_margins[loadout_config.project_type]
        recommended_billing_rate = total_cost_per_hour / (1 - target_margin)
        break_even_rate = total_cost_per_hour
        competitive_range = self.competitive_rates[loadout_config.project_type]
        
        # Calculate performance metrics
        cost_efficiency_score = self._calculate_cost_efficiency_score(
            equipment_cost_per_hour, employee_cost_per_hour, loadout_config.project_type
        )
        profitability_score = self._calculate_profitability_score(
            recommended_billing_rate, competitive_range, target_margin
        )
        
        # Generate loadout ID
        loadout_id = f"{loadout_config.project_type.value}_{loadout_config.location_state.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        breakdown = LoadoutPricingBreakdown(
            loadout_id=loadout_id,
            configuration=loadout_config,
            
            equipment_cost_per_hour=equipment_cost_per_hour,
            heavy_equipment_cost=heavy_equipment_cost,
            small_tools_cost=small_tools_cost,
            
            employee_cost_per_hour=employee_cost_per_hour,
            base_wages_per_hour=base_wages_per_hour,
            burden_cost_per_hour=burden_cost_per_hour,
            
            total_cost_per_hour=total_cost_per_hour,
            
            recommended_billing_rate=recommended_billing_rate,
            profit_margin_percentage=target_margin * 100,
            break_even_rate=break_even_rate,
            competitive_rate_range=competitive_range,
            
            cost_efficiency_score=cost_efficiency_score,
            profitability_score=profitability_score
        )
        
        logger.info("Loadout pricing calculated",
                   loadout_name=loadout_config.name,
                   total_cost_per_hour=total_cost_per_hour,
                   recommended_billing_rate=recommended_billing_rate)
        
        return breakdown
    
    def _extract_crew_config(self, crew_composition: List[Dict[str, Any]]) -> Dict[str, int]:
        """Extract crew configuration for equipment cost calculations"""
        climbers = sum(1 for member in crew_composition 
                      if member["position"] in ["isa_certified_arborist", "experienced_climber"])
        ground_crew = sum(1 for member in crew_composition 
                         if "ground_crew" in member["position"])
        total_crew = len(crew_composition)
        
        # Estimate chainsaws (typically 1-2 per climber + 1-2 for ground crew)
        chainsaws = max(2, climbers * 2 + max(1, ground_crew // 2))
        
        return {
            "climbers": climbers,
            "ground_crew": ground_crew,
            "chainsaws": chainsaws,
            "crews": 1
        }
    
    def _calculate_cost_efficiency_score(self, 
                                       equipment_cost: float, 
                                       employee_cost: float, 
                                       project_type: ProjectType) -> float:
        """Calculate cost efficiency score (0-100)"""
        
        # Industry benchmarks for cost ratios
        benchmarks = {
            ProjectType.TREE_REMOVAL: {"equipment_ratio": 0.30, "employee_ratio": 0.70},
            ProjectType.FORESTRY_MULCHING: {"equipment_ratio": 0.60, "employee_ratio": 0.40},
            ProjectType.STUMP_GRINDING: {"equipment_ratio": 0.45, "employee_ratio": 0.55},
            ProjectType.EMERGENCY_RESPONSE: {"equipment_ratio": 0.35, "employee_ratio": 0.65}
        }
        
        total_cost = equipment_cost + employee_cost
        actual_equipment_ratio = equipment_cost / total_cost
        actual_employee_ratio = employee_cost / total_cost
        
        benchmark = benchmarks.get(project_type, {"equipment_ratio": 0.40, "employee_ratio": 0.60})
        
        # Calculate variance from optimal ratios
        equipment_variance = abs(actual_equipment_ratio - benchmark["equipment_ratio"])
        employee_variance = abs(actual_employee_ratio - benchmark["employee_ratio"])
        
        # Score based on how close to optimal ratios (lower variance = higher score)
        efficiency_score = max(0, 100 - (equipment_variance + employee_variance) * 200)
        
        return efficiency_score
    
    def _calculate_profitability_score(self, 
                                     recommended_rate: float, 
                                     competitive_range: Tuple[float, float], 
                                     target_margin: float) -> float:
        """Calculate profitability score (0-100)"""
        
        min_competitive, max_competitive = competitive_range
        
        # Check if recommended rate falls within competitive range
        if min_competitive <= recommended_rate <= max_competitive:
            # Rate is competitive - score based on position in range
            range_position = (recommended_rate - min_competitive) / (max_competitive - min_competitive)
            base_score = 70 + (range_position * 20)  # 70-90 base score
        elif recommended_rate < min_competitive:
            # Rate is below market - potentially too low
            base_score = 50
        else:
            # Rate is above market - potentially not competitive
            excess_ratio = (recommended_rate - max_competitive) / max_competitive
            base_score = max(30, 70 - (excess_ratio * 100))
        
        # Adjust for target margin achievement
        margin_bonus = min(10, target_margin * 25)  # Up to 10 point bonus for higher margins
        
        profitability_score = min(100, base_score + margin_bonus)
        
        return profitability_score
    
    async def compare_loadout_scenarios(self, 
                                      scenarios: List[LoadoutConfiguration]) -> Dict[str, Any]:
        """Compare multiple loadout scenarios"""
        
        logger.info("Comparing loadout scenarios", scenario_count=len(scenarios))
        
        scenario_results = []
        
        for scenario in scenarios:
            pricing = await self.calculate_loadout_pricing(scenario)
            scenario_results.append(asdict(pricing))
        
        # Find best scenarios
        best_cost_efficiency = max(scenario_results, key=lambda x: x['cost_efficiency_score'])
        best_profitability = max(scenario_results, key=lambda x: x['profitability_score'])
        lowest_total_cost = min(scenario_results, key=lambda x: x['total_cost_per_hour'])
        
        comparison = {
            "scenarios": scenario_results,
            "analysis": {
                "best_cost_efficiency": best_cost_efficiency['configuration']['name'],
                "best_profitability": best_profitability['configuration']['name'],
                "lowest_total_cost": lowest_total_cost['configuration']['name']
            },
            "recommendations": self._generate_scenario_recommendations(scenario_results)
        }
        
        return comparison
    
    def _generate_scenario_recommendations(self, scenario_results: List[Dict]) -> List[str]:
        """Generate recommendations based on scenario comparison"""
        recommendations = []
        
        # Analyze cost patterns
        avg_total_cost = sum(s['total_cost_per_hour'] for s in scenario_results) / len(scenario_results)
        avg_profitability = sum(s['profitability_score'] for s in scenario_results) / len(scenario_results)
        
        for scenario in scenario_results:
            name = scenario['configuration']['name']
            total_cost = scenario['total_cost_per_hour']
            profitability = scenario['profitability_score']
            
            if total_cost < avg_total_cost * 0.9 and profitability > avg_profitability:
                recommendations.append(f"{name}: Excellent balance of low cost and high profitability")
            elif profitability > 85:
                recommendations.append(f"{name}: High profitability scenario - premium pricing opportunity")
            elif total_cost < avg_total_cost * 0.8:
                recommendations.append(f"{name}: Low-cost leader - competitive advantage on price")
        
        return recommendations
    
    async def optimize_loadout_for_project(self, 
                                         project_requirements: Dict[str, Any]) -> LoadoutConfiguration:
        """Optimize loadout configuration for specific project requirements"""
        
        project_type = ProjectType(project_requirements.get("project_type", "tree_removal"))
        location_state = LocationState(project_requirements.get("location_state", "florida"))
        complexity = project_requirements.get("complexity", "standard")
        
        # Map complexity to severity factor
        severity_mapping = {
            "low": SeverityFactor.LIGHT_RESIDENTIAL,
            "standard": SeverityFactor.STANDARD_WORK,
            "high": SeverityFactor.HEAVY_VEGETATION,
            "extreme": SeverityFactor.DISASTER_RECOVERY
        }
        
        severity_factor = severity_mapping.get(complexity, SeverityFactor.STANDARD_WORK)
        
        # Start with appropriate template
        if project_type == ProjectType.FORESTRY_MULCHING:
            base_config = self.loadout_templates["forestry_mulching_operation"]
        elif project_type == ProjectType.STUMP_GRINDING:
            base_config = self.loadout_templates["stump_grinding_crew"]
        elif project_type == ProjectType.EMERGENCY_RESPONSE:
            base_config = self.loadout_templates["emergency_response_team"]
        else:
            base_config = self.loadout_templates["residential_tree_service"]
        
        # Customize configuration
        optimized_config = LoadoutConfiguration(
            name=f"Optimized {project_type.value.replace('_', ' ').title()} Loadout",
            project_type=project_type,
            equipment_list=base_config.equipment_list.copy(),
            crew_composition=base_config.crew_composition.copy(),
            location_state=location_state,
            severity_factor=severity_factor
        )
        
        # Adjust crew based on complexity
        if complexity == "extreme":
            # Add safety manager and increase crew rates
            optimized_config.crew_composition.append(
                {"position": "safety_manager", "hourly_rate": 40.0}
            )
            # Increase all rates by 15% for extreme conditions
            for member in optimized_config.crew_composition:
                member["hourly_rate"] *= 1.15
        
        return optimized_config

# ============================================================================
# DEMONSTRATION AND EXAMPLES
# ============================================================================

async def demonstrate_loadout_pricing_intelligence():
    """Demonstrate the complete loadout pricing intelligence system"""
    
    print("🎯 TreeAI Loadout Pricing Intelligence Demo")
    print("=" * 70)
    
    pricing_engine = LoadoutPricingIntelligence()
    
    # Example 1: Analyze residential tree service loadout
    print("\n📊 Example 1: Residential Tree Service Loadout Analysis")
    print("-" * 60)
    
    residential_config = pricing_engine.loadout_templates["residential_tree_service"]
    residential_pricing = await pricing_engine.calculate_loadout_pricing(residential_config)
    
    print(f"Loadout: {residential_pricing.configuration.name}")
    print(f"Project Type: {residential_pricing.configuration.project_type.value.replace('_', ' ').title()}")
    print(f"Location: {residential_pricing.configuration.location_state.value.title()}")
    print(f"Severity Factor: {residential_pricing.configuration.severity_factor.value}x")
    
    print(f"\n💰 COST BREAKDOWN:")
    print(f"  • Equipment Cost: ${residential_pricing.equipment_cost_per_hour:.2f}/hr")
    print(f"    - Heavy Equipment: ${residential_pricing.heavy_equipment_cost:.2f}/hr")
    print(f"    - Small Tools Pool: ${residential_pricing.small_tools_cost:.2f}/hr")
    print(f"  • Employee Cost: ${residential_pricing.employee_cost_per_hour:.2f}/hr")
    print(f"    - Base Wages: ${residential_pricing.base_wages_per_hour:.2f}/hr")
    print(f"    - Burden Costs: ${residential_pricing.burden_cost_per_hour:.2f}/hr")
    print(f"  • TOTAL COST: ${residential_pricing.total_cost_per_hour:.2f}/hr")
    
    print(f"\n🎯 PRICING INTELLIGENCE:")
    print(f"  • Break-Even Rate: ${residential_pricing.break_even_rate:.2f}/hr")
    print(f"  • Recommended Billing Rate: ${residential_pricing.recommended_billing_rate:.2f}/hr")
    print(f"  • Target Profit Margin: {residential_pricing.profit_margin_percentage:.0f}%")
    print(f"  • Competitive Range: ${residential_pricing.competitive_rate_range[0]:.0f} - ${residential_pricing.competitive_rate_range[1]:.0f}/hr")
    
    print(f"\n📈 PERFORMANCE SCORES:")
    print(f"  • Cost Efficiency Score: {residential_pricing.cost_efficiency_score:.0f}/100")
    print(f"  • Profitability Score: {residential_pricing.profitability_score:.0f}/100")
    
    competitive_status = "COMPETITIVE" if (residential_pricing.competitive_rate_range[0] <= 
                                          residential_pricing.recommended_billing_rate <= 
                                          residential_pricing.competitive_rate_range[1]) else "OUT OF RANGE"
    print(f"  • Market Position: {competitive_status}")
    
    # Example 2: Compare multiple loadout scenarios
    print("\n\n📊 Example 2: Loadout Scenario Comparison")
    print("-" * 60)
    
    scenarios = [
        pricing_engine.loadout_templates["residential_tree_service"],
        pricing_engine.loadout_templates["forestry_mulching_operation"],
        pricing_engine.loadout_templates["stump_grinding_crew"],
        pricing_engine.loadout_templates["emergency_response_team"]
    ]
    
    comparison = await pricing_engine.compare_loadout_scenarios(scenarios)
    
    print(f"Comparing {len(scenarios)} loadout scenarios:\n")
    print(f"{'Loadout':<25} {'Total Cost':<12} {'Billing Rate':<13} {'Profit Score':<12} {'Efficiency'}")
    print("-" * 75)
    
    for scenario in comparison['scenarios']:
        name = scenario['configuration']['name'][:24]
        total_cost = scenario['total_cost_per_hour']
        billing_rate = scenario['recommended_billing_rate']
        profit_score = scenario['profitability_score']
        efficiency = scenario['cost_efficiency_score']
        
        print(f"{name:<25} ${total_cost:<11.2f} ${billing_rate:<12.2f} {profit_score:<11.0f} {efficiency:.0f}")
    
    print(f"\n🏆 ANALYSIS RESULTS:")
    print(f"  • Best Cost Efficiency: {comparison['analysis']['best_cost_efficiency']}")
    print(f"  • Best Profitability: {comparison['analysis']['best_profitability']}")
    print(f"  • Lowest Total Cost: {comparison['analysis']['lowest_total_cost']}")
    
    print(f"\n💡 RECOMMENDATIONS:")
    for i, rec in enumerate(comparison['recommendations'], 1):
        print(f"  {i}. {rec}")
    
    # Example 3: Project-specific optimization
    print("\n\n📊 Example 3: Project-Specific Loadout Optimization")
    print("-" * 60)
    
    project_requirements = {
        "project_type": "forestry_mulching",
        "location_state": "florida",
        "complexity": "high",
        "acreage": 5.0,
        "terrain": "challenging"
    }
    
    optimized_config = await pricing_engine.optimize_loadout_for_project(project_requirements)
    optimized_pricing = await pricing_engine.calculate_loadout_pricing(optimized_config)
    
    print(f"Project Requirements:")
    print(f"  • Type: {project_requirements['project_type'].replace('_', ' ').title()}")
    print(f"  • Location: {project_requirements['location_state'].title()}")
    print(f"  • Complexity: {project_requirements['complexity'].title()}")
    
    print(f"\nOptimized Loadout: {optimized_config.name}")
    print(f"Total Cost: ${optimized_pricing.total_cost_per_hour:.2f}/hr")
    print(f"Recommended Rate: ${optimized_pricing.recommended_billing_rate:.2f}/hr")
    print(f"Profit Margin: {optimized_pricing.profit_margin_percentage:.0f}%")
    
    # Example 4: ROI Analysis
    print("\n\n📊 Example 4: 8-Hour Project ROI Analysis")
    print("-" * 60)
    
    project_hours = 8.0
    
    for scenario in comparison['scenarios'][:3]:  # Top 3 scenarios
        name = scenario['configuration']['name']
        total_cost = scenario['total_cost_per_hour'] * project_hours
        revenue = scenario['recommended_billing_rate'] * project_hours
        profit = revenue - total_cost
        roi = (profit / total_cost) * 100
        
        print(f"\n{name}:")
        print(f"  • Project Cost: ${total_cost:,.0f}")
        print(f"  • Project Revenue: ${revenue:,.0f}")
        print(f"  • Project Profit: ${profit:,.0f}")
        print(f"  • ROI: {roi:.1f}%")
    
    print(f"\n✅ Loadout Pricing Intelligence Demo Complete!")
    print(f"🎯 Key Benefits:")
    print(f"   • Complete cost transparency - no hidden expenses")
    print(f"   • Intelligent pricing recommendations based on market data")
    print(f"   • Profitability optimization across different project types")
    print(f"   • Competitive analysis and positioning")
    print(f"💡 Alex now has complete pricing intelligence for any loadout!")

if __name__ == "__main__":
    asyncio.run(demonstrate_loadout_pricing_intelligence())