#!/usr/bin/env python3
"""
Alex TreeAI Agent - Pricing Intelligence Integration
Integrates the complete pricing system into Alex's decision-making capabilities
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime

# Import Alex's existing capabilities
from alex_agent import AlexTreeAIAgent, ProjectAssessment, AFISSAssessment, TreeScoreResult
from convex_client import AlexConvexIntegration

# Import new pricing intelligence
try:
    from equipment_cost_intelligence import EquipmentCostIntelligence, EquipmentCategory, SeverityFactor
    from true_hourly_employee_cost import TrueHourlyEmployeeCostCalculator, EmployeePosition, LocationState
    from loadout_pricing_intelligence import LoadoutPricingIntelligence, ProjectType, LoadoutConfiguration
    PRICING_AVAILABLE = True
except ImportError:
    # Fallback to simplified version if full system not available
    from quick_pricing_demo import QuickPricingCalculator, EquipmentCategory, EmployeePosition
    PRICING_AVAILABLE = False

@dataclass
class ComprehensiveProjectPricing:
    """Complete project pricing with TreeScore, AFISS, and loadout costs"""
    project_id: str
    
    # TreeScore Assessment
    tree_score: TreeScoreResult
    afiss_assessment: AFISSAssessment
    
    # Loadout Pricing
    equipment_cost_per_hour: float
    employee_cost_per_hour: float
    total_cost_per_hour: float
    
    # Pricing Intelligence
    recommended_billing_rate: float
    break_even_rate: float
    profit_margin_percentage: float
    
    # Project Economics
    estimated_project_hours: float
    total_project_cost: float
    total_project_revenue: float
    total_project_profit: float
    
    # Competitive Analysis
    competitive_position: str
    pricing_confidence: float

class AlexPricingAgent(AlexTreeAIAgent):
    """Enhanced Alex Agent with complete pricing intelligence"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        # Initialize pricing systems
        if PRICING_AVAILABLE:
            self.equipment_engine = EquipmentCostIntelligence()
            self.employee_calculator = TrueHourlyEmployeeCostCalculator()
            self.pricing_intelligence = LoadoutPricingIntelligence()
        else:
            self.quick_calculator = QuickPricingCalculator()
        
        # Default location for pricing calculations
        self.default_location = LocationState.FLORIDA if PRICING_AVAILABLE else "florida"
        
        # Add pricing tools to Alex's toolkit
        self.tools.extend(self._initialize_pricing_tools())
    
    def _initialize_pricing_tools(self) -> List:
        """Add pricing intelligence tools to Alex's capabilities"""
        pricing_tools = []
        
        # Equipment cost calculation tool
        def calculate_equipment_hourly_cost(equipment_list: str, severity: str = "standard") -> str:
            """Calculate hourly cost for equipment loadout.
            
            Args:
                equipment_list: Comma-separated list of equipment (e.g., "bucket_truck,chipper,pickup_truck")
                severity: Project severity (light, standard, heavy, extreme)
            """
            try:
                equipment_types = [eq.strip() for eq in equipment_list.split(',')]
                
                if PRICING_AVAILABLE:
                    # Use full system
                    severity_map = {
                        "light": SeverityFactor.LIGHT_RESIDENTIAL,
                        "standard": SeverityFactor.STANDARD_WORK,
                        "heavy": SeverityFactor.HEAVY_VEGETATION,
                        "extreme": SeverityFactor.DISASTER_RECOVERY
                    }
                    severity_factor = severity_map.get(severity, SeverityFactor.STANDARD_WORK)
                    
                    total_cost = 0.0
                    equipment_details = []
                    
                    for eq_type in equipment_types:
                        try:
                            eq_category = EquipmentCategory(eq_type)
                            cost_breakdown = asyncio.run(
                                self.equipment_engine.calculate_equipment_cost(eq_category, severity_factor=severity_factor)
                            )
                            total_cost += cost_breakdown.total_cost_per_hour
                            equipment_details.append(f"{eq_type}: ${cost_breakdown.total_cost_per_hour:.2f}/hr")
                        except ValueError:
                            equipment_details.append(f"{eq_type}: Not found in database")
                    
                    result = f"EQUIPMENT COST ANALYSIS:\n"
                    result += f"Total Equipment Cost: ${total_cost:.2f}/hr\n"
                    result += f"Severity Factor: {severity}\n\n"
                    result += "Equipment Breakdown:\n" + "\n".join(equipment_details)
                    
                else:
                    # Use simplified system
                    calculator = self.quick_calculator
                    equipment_enum_list = []
                    
                    for eq_type in equipment_types:
                        try:
                            equipment_enum_list.append(EquipmentCategory(eq_type))
                        except ValueError:
                            continue
                    
                    severity_map = {"light": 1.0, "standard": 1.1, "heavy": 1.25, "extreme": 1.45}
                    severity_factor_val = severity_map.get(severity, 1.1)
                    
                    total_cost = 0.0
                    for equipment in equipment_enum_list:
                        cost = calculator.calculate_equipment_cost(equipment)
                        total_cost += cost.total_cost_per_hour
                    
                    result = f"EQUIPMENT COST ANALYSIS (Simplified):\n"
                    result += f"Total Equipment Cost: ${total_cost:.2f}/hr\n"
                    result += f"Severity Factor: {severity_factor_val}x"
                
                return result
                
            except Exception as e:
                return f"Equipment cost calculation failed: {str(e)}"
        
        # Employee cost calculation tool
        def calculate_crew_hourly_cost(crew_composition: str, location: str = "florida") -> str:
            """Calculate true hourly cost for crew including all burden costs.
            
            Args:
                crew_composition: Comma-separated crew positions (e.g., "isa_certified_arborist,ground_crew_member,ground_crew_member")
                location: State location for tax calculations
            """
            try:
                crew_positions = [pos.strip() for pos in crew_composition.split(',')]
                
                if PRICING_AVAILABLE:
                    location_state = LocationState(location.lower())
                    crew_config = []
                    
                    for position in crew_positions:
                        try:
                            emp_position = EmployeePosition(position)
                            crew_config.append({"position": position, "hourly_rate": None})
                        except ValueError:
                            continue
                    
                    crew_cost = self.employee_calculator.calculate_crew_cost(crew_config, location_state)
                    
                    result = f"CREW COST ANALYSIS:\n"
                    result += f"Total Crew Cost: ${crew_cost['crew_summary']['total_true_hourly_cost']:.2f}/hr\n"
                    result += f"Base Wages: ${crew_cost['crew_summary']['total_base_hourly_rate']:.2f}/hr\n"
                    result += f"Burden Costs: ${crew_cost['crew_summary']['total_burden_cost_per_hour']:.2f}/hr\n"
                    result += f"Burden Multiplier: {crew_cost['crew_summary']['average_burden_multiplier']:.2f}x\n\n"
                    
                    result += "Crew Breakdown:\n"
                    for member in crew_cost['crew_members']:
                        position_name = member['position'].replace('_', ' ').title()
                        result += f"• {position_name}: ${member['hourly_rate']:.2f}/hr → ${member['true_hourly_cost']:.2f}/hr\n"
                
                else:
                    # Use simplified system
                    calculator = self.quick_calculator
                    crew_enum_list = []
                    
                    for position in crew_positions:
                        try:
                            crew_enum_list.append(EmployeePosition(position))
                        except ValueError:
                            continue
                    
                    total_base_cost = 0.0
                    total_true_cost = 0.0
                    
                    for position in crew_enum_list:
                        cost = calculator.calculate_employee_cost(position)
                        total_base_cost += cost.hourly_rate
                        total_true_cost += cost.true_hourly_cost
                    
                    result = f"CREW COST ANALYSIS (Simplified):\n"
                    result += f"Total Crew Cost: ${total_true_cost:.2f}/hr\n"
                    result += f"Base Wages: ${total_base_cost:.2f}/hr\n"
                    result += f"Burden Multiplier: {calculator.burden_multiplier:.2f}x"
                
                return result
                
            except Exception as e:
                return f"Crew cost calculation failed: {str(e)}"
        
        # Complete loadout pricing tool
        def calculate_complete_loadout_pricing(equipment_list: str, crew_composition: str, 
                                             project_type: str = "tree_removal", 
                                             severity: str = "standard") -> str:
            """Calculate complete loadout pricing with profit recommendations.
            
            Args:
                equipment_list: Comma-separated equipment list
                crew_composition: Comma-separated crew positions  
                project_type: Type of project (tree_removal, forestry_mulching, etc.)
                severity: Project severity level
            """
            try:
                if PRICING_AVAILABLE:
                    # Use full pricing intelligence system
                    equipment_types = [eq.strip() for eq in equipment_list.split(',')]
                    crew_positions = [pos.strip() for pos in crew_composition.split(',')]
                    
                    # Create loadout configuration
                    equipment_config = []
                    for eq_type in equipment_types:
                        try:
                            EquipmentCategory(eq_type)  # Validate
                            equipment_config.append({
                                "type": eq_type,
                                "make_model": f"Standard {eq_type.replace('_', ' ').title()}",
                                "purchase_price": None,  # Use defaults
                                "year": 2022
                            })
                        except ValueError:
                            continue
                    
                    crew_config = []
                    for position in crew_positions:
                        try:
                            EmployeePosition(position)  # Validate
                            crew_config.append({"position": position, "hourly_rate": None})
                        except ValueError:
                            continue
                    
                    severity_map = {
                        "light": SeverityFactor.LIGHT_RESIDENTIAL,
                        "standard": SeverityFactor.STANDARD_WORK,
                        "heavy": SeverityFactor.HEAVY_VEGETATION,
                        "extreme": SeverityFactor.DISASTER_RECOVERY
                    }
                    
                    loadout_config = LoadoutConfiguration(
                        name="Custom Assessment Loadout",
                        project_type=ProjectType(project_type),
                        equipment_list=equipment_config,
                        crew_composition=crew_config,
                        location_state=self.default_location,
                        severity_factor=severity_map.get(severity, SeverityFactor.STANDARD_WORK)
                    )
                    
                    pricing = asyncio.run(self.pricing_intelligence.calculate_loadout_pricing(loadout_config))
                    
                    result = f"COMPLETE LOADOUT PRICING:\n"
                    result += f"Equipment Cost: ${pricing.equipment_cost_per_hour:.2f}/hr\n"
                    result += f"Employee Cost: ${pricing.employee_cost_per_hour:.2f}/hr\n"
                    result += f"Total Cost: ${pricing.total_cost_per_hour:.2f}/hr\n\n"
                    result += f"PRICING INTELLIGENCE:\n"
                    result += f"Break-Even Rate: ${pricing.break_even_rate:.2f}/hr\n"
                    result += f"Recommended Rate: ${pricing.recommended_billing_rate:.2f}/hr\n"
                    result += f"Target Margin: {pricing.profit_margin_percentage:.0f}%\n"
                    result += f"Competitive Range: ${pricing.competitive_rate_range[0]:.0f}-${pricing.competitive_rate_range[1]:.0f}/hr"
                
                else:
                    # Use simplified system
                    calculator = self.quick_calculator
                    equipment_types = [EquipmentCategory(eq.strip()) for eq in equipment_list.split(',') 
                                     if eq.strip() in [e.value for e in EquipmentCategory]]
                    crew_types = [EmployeePosition(pos.strip()) for pos in crew_composition.split(',')
                                 if pos.strip() in [e.value for e in EmployeePosition]]
                    
                    severity_map = {"light": 1.0, "standard": 1.1, "heavy": 1.25, "extreme": 1.45}
                    severity_factor = severity_map.get(severity, 1.1)
                    
                    # Calculate using simplified system (mock the enum conversion)
                    total_equipment_cost = len(equipment_types) * 40.0  # Simplified
                    total_employee_cost = len(crew_types) * 35.0 * calculator.burden_multiplier
                    total_cost = total_equipment_cost + total_employee_cost + 5.0  # Small tools
                    
                    recommended_rate = total_cost / 0.65  # 35% margin
                    
                    result = f"COMPLETE LOADOUT PRICING (Simplified):\n"
                    result += f"Equipment Cost: ${total_equipment_cost:.2f}/hr\n"
                    result += f"Employee Cost: ${total_employee_cost:.2f}/hr\n"
                    result += f"Total Cost: ${total_cost:.2f}/hr\n\n"
                    result += f"PRICING INTELLIGENCE:\n"
                    result += f"Break-Even Rate: ${total_cost:.2f}/hr\n"
                    result += f"Recommended Rate: ${recommended_rate:.2f}/hr\n"
                    result += f"Target Margin: 35%"
                
                return result
                
            except Exception as e:
                return f"Complete loadout pricing failed: {str(e)}"
        
        # Add tools to the list (these would be properly wrapped as LangChain tools in production)
        pricing_tools.extend([
            calculate_equipment_hourly_cost,
            calculate_crew_hourly_cost,
            calculate_complete_loadout_pricing
        ])
        
        return pricing_tools
    
    async def assess_complete_project_with_pricing(self, project_input: str) -> ComprehensiveProjectPricing:
        """Perform complete project assessment including TreeScore, AFISS, and pricing intelligence"""
        
        # First get Alex's standard assessment
        standard_assessment = await self.assess_complete_project(project_input)
        
        # Extract key information for pricing
        project_data = self._parse_project_description(project_input)
        
        # Determine appropriate loadout based on project characteristics
        equipment_list, crew_composition = self._recommend_loadout(project_data)
        
        # Calculate pricing
        if PRICING_AVAILABLE:
            # Use full system
            severity = self._map_afiss_to_severity(standard_assessment.get('afiss_composite_score', 30))
            
            loadout_config = LoadoutConfiguration(
                name=f"Project {project_data.get('id', 'assessment')} Loadout",
                project_type=self._determine_project_type(project_data),
                equipment_list=equipment_list,
                crew_composition=crew_composition,
                location_state=self.default_location,
                severity_factor=severity
            )
            
            pricing = await self.pricing_intelligence.calculate_loadout_pricing(loadout_config)
            
            # Calculate project totals
            estimated_hours = float(standard_assessment.get('estimated_hours', 8.0))
            total_cost = pricing.total_cost_per_hour * estimated_hours
            total_revenue = pricing.recommended_billing_rate * estimated_hours
            total_profit = total_revenue - total_cost
            
            comprehensive_pricing = ComprehensiveProjectPricing(
                project_id=project_data.get('id', f"proj_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
                tree_score=None,  # Would extract from standard_assessment
                afiss_assessment=None,  # Would extract from standard_assessment
                equipment_cost_per_hour=pricing.equipment_cost_per_hour,
                employee_cost_per_hour=pricing.employee_cost_per_hour,
                total_cost_per_hour=pricing.total_cost_per_hour,
                recommended_billing_rate=pricing.recommended_billing_rate,
                break_even_rate=pricing.break_even_rate,
                profit_margin_percentage=pricing.profit_margin_percentage,
                estimated_project_hours=estimated_hours,
                total_project_cost=total_cost,
                total_project_revenue=total_revenue,
                total_project_profit=total_profit,
                competitive_position=self._assess_competitive_position(pricing),
                pricing_confidence=pricing.profitability_score / 100
            )
        
        else:
            # Use simplified system
            calculator = self.quick_calculator
            estimated_hours = 8.0  # Default
            
            # Mock loadout calculation
            total_cost_per_hour = 200.0  # Simplified
            recommended_rate = total_cost_per_hour / 0.65  # 35% margin
            
            total_cost = total_cost_per_hour * estimated_hours
            total_revenue = recommended_rate * estimated_hours
            total_profit = total_revenue - total_cost
            
            comprehensive_pricing = ComprehensiveProjectPricing(
                project_id=f"proj_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                tree_score=None,
                afiss_assessment=None,
                equipment_cost_per_hour=100.0,
                employee_cost_per_hour=100.0,
                total_cost_per_hour=total_cost_per_hour,
                recommended_billing_rate=recommended_rate,
                break_even_rate=total_cost_per_hour,
                profit_margin_percentage=35.0,
                estimated_project_hours=estimated_hours,
                total_project_cost=total_cost,
                total_project_revenue=total_revenue,
                total_project_profit=total_profit,
                competitive_position="COMPETITIVE",
                pricing_confidence=0.85
            )
        
        return comprehensive_pricing
    
    def _recommend_loadout(self, project_data: Dict[str, Any]) -> tuple:
        """Recommend appropriate equipment and crew based on project data"""
        
        # Simplified loadout recommendation logic
        service_type = project_data.get('service_type', 'removal')
        
        if 'mulching' in service_type.lower():
            equipment = [
                {"type": "skid_steer_mulcher", "make_model": "Standard Mulcher", "purchase_price": None, "year": 2022},
                {"type": "pickup_truck", "make_model": "Support Truck", "purchase_price": None, "year": 2022}
            ]
            crew = [
                {"position": "equipment_operator", "hourly_rate": None},
                {"position": "ground_crew_member", "hourly_rate": None}
            ]
        else:
            # Standard tree service
            equipment = [
                {"type": "bucket_truck", "make_model": "Standard Bucket Truck", "purchase_price": None, "year": 2022},
                {"type": "chipper", "make_model": "Standard Chipper", "purchase_price": None, "year": 2022},
                {"type": "pickup_truck", "make_model": "Support Truck", "purchase_price": None, "year": 2022}
            ]
            crew = [
                {"position": "isa_certified_arborist", "hourly_rate": None},
                {"position": "ground_crew_member", "hourly_rate": None},
                {"position": "ground_crew_member", "hourly_rate": None}
            ]
        
        return equipment, crew
    
    def _map_afiss_to_severity(self, afiss_score: float) -> 'SeverityFactor':
        """Map AFISS composite score to equipment severity factor"""
        if not PRICING_AVAILABLE:
            return "standard"
            
        if afiss_score <= 28:
            return SeverityFactor.LIGHT_RESIDENTIAL
        elif afiss_score <= 46:
            return SeverityFactor.STANDARD_WORK
        elif afiss_score <= 58:
            return SeverityFactor.HEAVY_VEGETATION
        else:
            return SeverityFactor.DISASTER_RECOVERY
    
    def _determine_project_type(self, project_data: Dict[str, Any]) -> 'ProjectType':
        """Determine project type from project data"""
        if not PRICING_AVAILABLE:
            return "tree_removal"
            
        service_type = project_data.get('service_type', 'removal').lower()
        
        if 'mulching' in service_type:
            return ProjectType.FORESTRY_MULCHING
        elif 'stump' in service_type:
            return ProjectType.STUMP_GRINDING
        elif 'trimming' in service_type or 'pruning' in service_type:
            return ProjectType.TREE_TRIMMING
        elif 'emergency' in service_type:
            return ProjectType.EMERGENCY_RESPONSE
        else:
            return ProjectType.TREE_REMOVAL
    
    def _assess_competitive_position(self, pricing) -> str:
        """Assess competitive position based on pricing"""
        if not hasattr(pricing, 'competitive_rate_range'):
            return "COMPETITIVE"
            
        min_rate, max_rate = pricing.competitive_rate_range
        recommended = pricing.recommended_billing_rate
        
        if min_rate <= recommended <= max_rate:
            return "COMPETITIVE"
        elif recommended < min_rate:
            return "BELOW_MARKET"
        else:
            return "PREMIUM"

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

async def demonstrate_alex_pricing_integration():
    """Demonstrate Alex with integrated pricing intelligence"""
    
    print("🤖 Alex TreeAI Agent with Pricing Intelligence Demo")
    print("=" * 70)
    
    # Initialize Alex with pricing capabilities
    config = {
        'afiss_data_path': "/Users/ain/TreeAI-Agent-Kit/AFISS",
        'learning_enabled': True,
        'pricing_enabled': True
    }
    
    alex_pricing = AlexPricingAgent(config)
    await alex_pricing.initialize()
    
    # Test project
    project_description = """
    Large oak tree removal in residential neighborhood. Tree is 80 feet tall, 
    30 foot canopy radius, 36 inch DBH. Located 20 feet from house, power lines 
    run directly overhead. Steep driveway access with concrete surface. 
    Customer concerned about property damage. High complexity job requiring
    ISA certified arborist supervision.
    """
    
    print(f"Project Description:")
    print(f"  {project_description.strip()}")
    
    # Get comprehensive assessment with pricing
    comprehensive_assessment = await alex_pricing.assess_complete_project_with_pricing(project_description)
    
    print(f"\n🎯 ALEX'S COMPREHENSIVE ASSESSMENT:")
    print("=" * 50)
    print(f"Project ID: {comprehensive_assessment.project_id}")
    
    print(f"\n💰 COST BREAKDOWN:")
    print(f"  • Equipment Cost: ${comprehensive_assessment.equipment_cost_per_hour:.2f}/hr")
    print(f"  • Employee Cost: ${comprehensive_assessment.employee_cost_per_hour:.2f}/hr")
    print(f"  • Total Cost: ${comprehensive_assessment.total_cost_per_hour:.2f}/hr")
    
    print(f"\n🎯 PRICING INTELLIGENCE:")
    print(f"  • Break-Even Rate: ${comprehensive_assessment.break_even_rate:.2f}/hr")
    print(f"  • Recommended Rate: ${comprehensive_assessment.recommended_billing_rate:.2f}/hr")
    print(f"  • Profit Margin: {comprehensive_assessment.profit_margin_percentage:.0f}%")
    print(f"  • Competitive Position: {comprehensive_assessment.competitive_position}")
    print(f"  • Pricing Confidence: {comprehensive_assessment.pricing_confidence:.0%}")
    
    print(f"\n📊 PROJECT ECONOMICS:")
    print(f"  • Estimated Hours: {comprehensive_assessment.estimated_project_hours:.1f}")
    print(f"  • Total Project Cost: ${comprehensive_assessment.total_project_cost:,.0f}")
    print(f"  • Total Project Revenue: ${comprehensive_assessment.total_project_revenue:,.0f}")
    print(f"  • Total Project Profit: ${comprehensive_assessment.total_project_profit:,.0f}")
    
    roi = (comprehensive_assessment.total_project_profit / comprehensive_assessment.total_project_cost) * 100
    print(f"  • Project ROI: {roi:.0f}%")
    
    print(f"\n✅ Alex now provides complete business intelligence!")
    print(f"   • TreeScore calculation with AFISS risk assessment")
    print(f"   • True equipment costs with USACE methodology")
    print(f"   • True employee costs with full burden factors") 
    print(f"   • Intelligent pricing recommendations")
    print(f"   • Competitive analysis and profit optimization")

if __name__ == "__main__":
    asyncio.run(demonstrate_alex_pricing_integration())