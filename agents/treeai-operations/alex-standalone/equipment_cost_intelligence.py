#!/usr/bin/env python3
"""
TreeAI Equipment Cost Intelligence System
Implements USACE-style equipment costing with automated AI lookups and small tools pools
"""

import json
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import structlog

logger = structlog.get_logger()

class EquipmentCategory(Enum):
    SKID_STEER_MULCHER = "skid_steer_mulcher"
    COMPACT_TRACK_LOADER = "compact_track_loader"
    MINI_EXCAVATOR = "mini_excavator"
    BUCKET_TRUCK = "bucket_truck"
    CHIPPER = "chipper"
    STUMP_GRINDER = "stump_grinder"
    LOG_TRUCK = "log_truck"
    PICKUP_TRUCK = "pickup_truck"

class SeverityFactor(Enum):
    LIGHT_RESIDENTIAL = 1.0
    STANDARD_WORK = 1.1
    HEAVY_VEGETATION = 1.25
    DISASTER_RECOVERY = 1.45

@dataclass
class EquipmentDefaults:
    """Default values for equipment categories (TreeAI starter brain)"""
    category: EquipmentCategory
    example_models: str
    msrp_new: float
    salvage_percent: float
    life_hours: int
    fuel_burn_gph: float
    maintenance_factor: float  # Percentage of depreciation
    notes: str

@dataclass
class SmallToolCategory:
    """Small tools pool category definition"""
    name: str
    example_items: str
    avg_cost: float
    life_years: float
    basis: str  # "per_unit", "per_climber", "per_crew", "per_person"
    default_cost_per_hour: float

@dataclass
class EquipmentCostBreakdown:
    """Complete equipment cost breakdown"""
    equipment_id: str
    category: EquipmentCategory
    make_model: str
    
    # Ownership costs per hour
    depreciation_per_hour: float
    interest_per_hour: float
    insurance_taxes_storage_per_hour: float
    total_ownership_per_hour: float
    
    # Operating costs per hour
    fuel_per_hour: float
    lubrication_per_hour: float
    repairs_maintenance_per_hour: float
    wear_parts_per_hour: float
    total_operating_per_hour: float
    
    # Final totals
    total_cost_per_hour: float
    severity_factor: float
    severity_adjusted_cost: float

class EquipmentCostIntelligence:
    """Main equipment cost intelligence engine"""
    
    def __init__(self):
        self.equipment_defaults = self._load_equipment_defaults()
        self.small_tools_defaults = self._load_small_tools_defaults()
        self.fuel_price = 4.25  # Default fuel price per gallon
        self.interest_rate = 0.06  # 6% cost of capital
        self.annual_hours = 1200  # Default annual usage hours
        
    def _load_equipment_defaults(self) -> Dict[EquipmentCategory, EquipmentDefaults]:
        """Load TreeAI equipment defaults (starter brain)"""
        defaults = {
            EquipmentCategory.SKID_STEER_MULCHER: EquipmentDefaults(
                category=EquipmentCategory.SKID_STEER_MULCHER,
                example_models="Bobcat T770 + Denis Cimaf, Cat 299D3 XE",
                msrp_new=118000,
                salvage_percent=20,
                life_hours=6000,
                fuel_burn_gph=5.5,
                maintenance_factor=100,  # Heavy vegetation factor 1.25x
                notes="Heavy vegetation factor 1.25"
            ),
            EquipmentCategory.COMPACT_TRACK_LOADER: EquipmentDefaults(
                category=EquipmentCategory.COMPACT_TRACK_LOADER,
                example_models="Bobcat T76, Cat 279D3",
                msrp_new=75000,
                salvage_percent=25,
                life_hours=6000,
                fuel_burn_gph=4.0,
                maintenance_factor=80,
                notes="Residential/light work"
            ),
            EquipmentCategory.MINI_EXCAVATOR: EquipmentDefaults(
                category=EquipmentCategory.MINI_EXCAVATOR,
                example_models="Cat 305, Bobcat E50",
                msrp_new=70000,
                salvage_percent=25,
                life_hours=8000,
                fuel_burn_gph=3.0,
                maintenance_factor=75,
                notes=""
            ),
            EquipmentCategory.BUCKET_TRUCK: EquipmentDefaults(
                category=EquipmentCategory.BUCKET_TRUCK,
                example_models="Altec/Versalift on Ford F750",
                msrp_new=165000,
                salvage_percent=30,
                life_hours=10000,
                fuel_burn_gph=6.5,
                maintenance_factor=60,
                notes="DOT-regulated"
            ),
            EquipmentCategory.CHIPPER: EquipmentDefaults(
                category=EquipmentCategory.CHIPPER,
                example_models="Bandit 150XP, Vermeer BC1500",
                msrp_new=50000,
                salvage_percent=25,
                life_hours=5000,
                fuel_burn_gph=2.5,
                maintenance_factor=90,
                notes="Knife sharpening cost separate"
            ),
            EquipmentCategory.STUMP_GRINDER: EquipmentDefaults(
                category=EquipmentCategory.STUMP_GRINDER,
                example_models="Carlton 7015, Rayco RG80",
                msrp_new=45000,
                salvage_percent=25,
                life_hours=5000,
                fuel_burn_gph=2.8,
                maintenance_factor=90,
                notes="Teeth wear in wear parts pool"
            ),
            EquipmentCategory.LOG_TRUCK: EquipmentDefaults(
                category=EquipmentCategory.LOG_TRUCK,
                example_models="Palfinger/Midwest log loader on Mack",
                msrp_new=220000,
                salvage_percent=35,
                life_hours=12000,
                fuel_burn_gph=7.0,
                maintenance_factor=65,
                notes=""
            ),
            EquipmentCategory.PICKUP_TRUCK: EquipmentDefaults(
                category=EquipmentCategory.PICKUP_TRUCK,
                example_models="Ford F-350/F-450 diesel",
                msrp_new=65000,
                salvage_percent=40,
                life_hours=8000,  # Converted from 200,000 miles
                fuel_burn_gph=2.5,
                maintenance_factor=50,
                notes="Life hrs ~ mph × 50"
            )
        }
        return defaults
    
    def _load_small_tools_defaults(self) -> List[SmallToolCategory]:
        """Load small tools and consumables pool defaults"""
        return [
            SmallToolCategory(
                name="Chainsaws & Power Tools",
                example_items="Stihl MS 500i, MS 362, pole saws, blowers",
                avg_cost=1000,
                life_years=2,
                basis="per_unit",
                default_cost_per_hour=0.42
            ),
            SmallToolCategory(
                name="Climbing Gear",
                example_items="Rope, saddle, helmet, carabiners, lanyards",
                avg_cost=1500,
                life_years=3,
                basis="per_climber",
                default_cost_per_hour=0.42
            ),
            SmallToolCategory(
                name="Hand Tools",
                example_items="Loppers, hand saws, rakes, wedges",
                avg_cost=400,
                life_years=2,
                basis="per_crew",
                default_cost_per_hour=0.17
            ),
            SmallToolCategory(
                name="Safety Gear",
                example_items="Helmets, gloves, glasses, hearing protection",
                avg_cost=300,
                life_years=1,
                basis="per_person",
                default_cost_per_hour=0.25
            ),
            SmallToolCategory(
                name="Rigging Gear",
                example_items="Slings, blocks, pulleys, ropes",
                avg_cost=1000,
                life_years=3,
                basis="per_crew",
                default_cost_per_hour=0.28
            ),
            SmallToolCategory(
                name="Fuel for Small Tools",
                example_items="Mixed gas, bar oil",
                avg_cost=400,
                life_years=1,
                basis="per_crew",
                default_cost_per_hour=0.33
            ),
            SmallToolCategory(
                name="PPE Consumables",
                example_items="Ear plugs, respirator filters",
                avg_cost=50,
                life_years=0.25,
                basis="per_person",
                default_cost_per_hour=0.10
            )
        ]
    
    async def calculate_equipment_cost(self, 
                                     equipment_type: EquipmentCategory,
                                     make_model: Optional[str] = None,
                                     purchase_price: Optional[float] = None,
                                     year: Optional[int] = None,
                                     severity_factor: SeverityFactor = SeverityFactor.STANDARD_WORK) -> EquipmentCostBreakdown:
        """Calculate complete equipment cost using USACE methodology"""
        
        logger.info("Calculating equipment cost", equipment_type=equipment_type.value, make_model=make_model)
        
        # Get defaults for this equipment type
        defaults = self.equipment_defaults[equipment_type]
        
        # Use provided purchase price or default MSRP
        if purchase_price is None:
            purchase_price = defaults.msrp_new
            if year and year < datetime.now().year:
                # Apply depreciation for used equipment
                age = datetime.now().year - year
                purchase_price *= (1 - 0.08) ** age  # 8% per year depreciation
        
        # Calculate salvage value
        salvage_value = purchase_price * (defaults.salvage_percent / 100)
        
        # Calculate ownership costs per hour
        depreciation_per_hour = (purchase_price - salvage_value) / defaults.life_hours
        
        average_investment = (purchase_price + salvage_value) / 2
        interest_per_hour = (average_investment * self.interest_rate) / self.annual_hours
        
        # Insurance, taxes, storage (estimated at 3% of purchase price annually)
        insurance_taxes_storage_per_hour = (purchase_price * 0.03) / self.annual_hours
        
        total_ownership_per_hour = (depreciation_per_hour + 
                                   interest_per_hour + 
                                   insurance_taxes_storage_per_hour)
        
        # Calculate operating costs per hour
        fuel_per_hour = defaults.fuel_burn_gph * self.fuel_price
        lubrication_per_hour = fuel_per_hour * 0.15  # 15% of fuel cost
        
        # Repairs and maintenance as percentage of depreciation
        repairs_maintenance_per_hour = depreciation_per_hour * (defaults.maintenance_factor / 100)
        
        # Apply severity factor to repairs/maintenance
        repairs_maintenance_per_hour *= severity_factor.value
        
        # Wear parts (simplified - would be more detailed in production)
        wear_parts_per_hour = depreciation_per_hour * 0.20  # 20% of depreciation
        
        total_operating_per_hour = (fuel_per_hour + 
                                   lubrication_per_hour + 
                                   repairs_maintenance_per_hour + 
                                   wear_parts_per_hour)
        
        total_cost_per_hour = total_ownership_per_hour + total_operating_per_hour
        severity_adjusted_cost = total_cost_per_hour  # Already applied to R&M
        
        breakdown = EquipmentCostBreakdown(
            equipment_id=f"{equipment_type.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            category=equipment_type,
            make_model=make_model or defaults.example_models.split(',')[0].strip(),
            
            depreciation_per_hour=depreciation_per_hour,
            interest_per_hour=interest_per_hour,
            insurance_taxes_storage_per_hour=insurance_taxes_storage_per_hour,
            total_ownership_per_hour=total_ownership_per_hour,
            
            fuel_per_hour=fuel_per_hour,
            lubrication_per_hour=lubrication_per_hour,
            repairs_maintenance_per_hour=repairs_maintenance_per_hour,
            wear_parts_per_hour=wear_parts_per_hour,
            total_operating_per_hour=total_operating_per_hour,
            
            total_cost_per_hour=total_cost_per_hour,
            severity_factor=severity_factor.value,
            severity_adjusted_cost=severity_adjusted_cost
        )
        
        logger.info("Equipment cost calculated", 
                   equipment_type=equipment_type.value,
                   total_cost_per_hour=total_cost_per_hour)
        
        return breakdown
    
    def calculate_small_tools_pool_cost(self, 
                                       crew_config: Dict[str, int]) -> Dict[str, float]:
        """Calculate small tools pool cost for a crew configuration
        
        Args:
            crew_config: Dictionary with keys like 'climbers', 'ground_crew', 'chainsaws', 'crews'
        """
        
        logger.info("Calculating small tools pool cost", crew_config=crew_config)
        
        total_cost_per_hour = 0.0
        category_breakdown = {}
        
        for tool_category in self.small_tools_defaults:
            category_cost = 0.0
            
            if tool_category.basis == "per_unit" and "chainsaws" in crew_config:
                category_cost = tool_category.default_cost_per_hour * crew_config["chainsaws"]
            elif tool_category.basis == "per_climber" and "climbers" in crew_config:
                category_cost = tool_category.default_cost_per_hour * crew_config["climbers"]
            elif tool_category.basis == "per_crew" and "crews" in crew_config:
                category_cost = tool_category.default_cost_per_hour * crew_config["crews"]
            elif tool_category.basis == "per_person":
                total_people = crew_config.get("climbers", 0) + crew_config.get("ground_crew", 0)
                category_cost = tool_category.default_cost_per_hour * total_people
            
            category_breakdown[tool_category.name] = category_cost
            total_cost_per_hour += category_cost
        
        category_breakdown["Total Small Tools Pool"] = total_cost_per_hour
        
        logger.info("Small tools pool cost calculated", 
                   total_cost_per_hour=total_cost_per_hour,
                   crew_config=crew_config)
        
        return category_breakdown
    
    async def calculate_loadout_equipment_cost(self, 
                                             equipment_list: List[Dict[str, Any]],
                                             crew_config: Dict[str, int],
                                             severity_factor: SeverityFactor = SeverityFactor.STANDARD_WORK) -> Dict[str, Any]:
        """Calculate total equipment cost for a complete loadout"""
        
        logger.info("Calculating loadout equipment cost", 
                   equipment_count=len(equipment_list),
                   crew_config=crew_config)
        
        heavy_equipment_costs = []
        total_heavy_equipment_cost = 0.0
        
        # Calculate heavy equipment costs
        for equipment in equipment_list:
            equipment_type = EquipmentCategory(equipment["type"])
            
            cost_breakdown = await self.calculate_equipment_cost(
                equipment_type=equipment_type,
                make_model=equipment.get("make_model"),
                purchase_price=equipment.get("purchase_price"),
                year=equipment.get("year"),
                severity_factor=severity_factor
            )
            
            heavy_equipment_costs.append(asdict(cost_breakdown))
            total_heavy_equipment_cost += cost_breakdown.total_cost_per_hour
        
        # Calculate small tools pool cost
        small_tools_breakdown = self.calculate_small_tools_pool_cost(crew_config)
        total_small_tools_cost = small_tools_breakdown["Total Small Tools Pool"]
        
        # Calculate total loadout cost
        total_loadout_cost_per_hour = total_heavy_equipment_cost + total_small_tools_cost
        
        loadout_cost_summary = {
            "heavy_equipment": {
                "equipment_details": heavy_equipment_costs,
                "total_cost_per_hour": total_heavy_equipment_cost
            },
            "small_tools_pool": {
                "category_breakdown": small_tools_breakdown,
                "total_cost_per_hour": total_small_tools_cost
            },
            "loadout_summary": {
                "total_equipment_cost_per_hour": total_loadout_cost_per_hour,
                "heavy_equipment_percentage": (total_heavy_equipment_cost / total_loadout_cost_per_hour * 100),
                "small_tools_percentage": (total_small_tools_cost / total_loadout_cost_per_hour * 100),
                "crew_configuration": crew_config,
                "severity_factor": severity_factor.value
            }
        }
        
        logger.info("Loadout equipment cost calculated",
                   total_cost_per_hour=total_loadout_cost_per_hour,
                   heavy_equipment_cost=total_heavy_equipment_cost,
                   small_tools_cost=total_small_tools_cost)
        
        return loadout_cost_summary

# ============================================================================
# EXAMPLE USAGE AND DEMONSTRATION
# ============================================================================

async def demonstrate_equipment_costing():
    """Demonstrate the equipment cost intelligence system"""
    
    print("🛠️  TreeAI Equipment Cost Intelligence Demo")
    print("=" * 60)
    
    engine = EquipmentCostIntelligence()
    
    # Example 1: Single equipment cost calculation
    print("\n📊 Example 1: Forestry Mulcher Cost Analysis")
    print("-" * 50)
    
    mulcher_cost = await engine.calculate_equipment_cost(
        equipment_type=EquipmentCategory.SKID_STEER_MULCHER,
        make_model="2022 Bobcat T770 + Denis Cimaf 180D",
        purchase_price=118000,
        year=2022,
        severity_factor=SeverityFactor.HEAVY_VEGETATION
    )
    
    print(f"Equipment: {mulcher_cost.make_model}")
    print(f"Category: {mulcher_cost.category.value}")
    print(f"\nOwnership Costs:")
    print(f"  • Depreciation: ${mulcher_cost.depreciation_per_hour:.2f}/hr")
    print(f"  • Interest: ${mulcher_cost.interest_per_hour:.2f}/hr")
    print(f"  • Insurance/Taxes/Storage: ${mulcher_cost.insurance_taxes_storage_per_hour:.2f}/hr")
    print(f"  • Total Ownership: ${mulcher_cost.total_ownership_per_hour:.2f}/hr")
    print(f"\nOperating Costs:")
    print(f"  • Fuel: ${mulcher_cost.fuel_per_hour:.2f}/hr")
    print(f"  • Lubrication: ${mulcher_cost.lubrication_per_hour:.2f}/hr")
    print(f"  • Repairs/Maintenance: ${mulcher_cost.repairs_maintenance_per_hour:.2f}/hr")
    print(f"  • Wear Parts: ${mulcher_cost.wear_parts_per_hour:.2f}/hr")
    print(f"  • Total Operating: ${mulcher_cost.total_operating_per_hour:.2f}/hr")
    print(f"\n💰 TOTAL COST: ${mulcher_cost.total_cost_per_hour:.2f}/hr")
    print(f"Severity Factor: {mulcher_cost.severity_factor}x ({SeverityFactor.HEAVY_VEGETATION.name})")
    
    # Example 2: Complete loadout cost
    print("\n\n📊 Example 2: Complete Loadout Cost Analysis")
    print("-" * 50)
    
    # Define a typical forestry mulching loadout
    equipment_list = [
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
    ]
    
    crew_config = {
        "climbers": 0,      # No climbers for mulching
        "ground_crew": 2,   # 2 ground crew members
        "chainsaws": 2,     # 2 chainsaws for cleanup
        "crews": 1          # 1 crew
    }
    
    loadout_cost = await engine.calculate_loadout_equipment_cost(
        equipment_list=equipment_list,
        crew_config=crew_config,
        severity_factor=SeverityFactor.HEAVY_VEGETATION
    )
    
    print(f"🚜 Heavy Equipment Cost: ${loadout_cost['heavy_equipment']['total_cost_per_hour']:.2f}/hr")
    print(f"🔧 Small Tools Pool Cost: ${loadout_cost['small_tools_pool']['total_cost_per_hour']:.2f}/hr")
    print(f"💰 TOTAL LOADOUT COST: ${loadout_cost['loadout_summary']['total_equipment_cost_per_hour']:.2f}/hr")
    
    print(f"\nSmall Tools Breakdown:")
    for category, cost in loadout_cost['small_tools_pool']['category_breakdown'].items():
        if category != "Total Small Tools Pool":
            print(f"  • {category}: ${cost:.2f}/hr")
    
    # Example 3: Tree service crew loadout
    print("\n\n📊 Example 3: Tree Service Crew Loadout")
    print("-" * 50)
    
    tree_service_equipment = [
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
    ]
    
    tree_crew_config = {
        "climbers": 2,      # 2 certified arborists
        "ground_crew": 2,   # 2 ground crew
        "chainsaws": 4,     # 4 chainsaws total
        "crews": 1          # 1 crew
    }
    
    tree_loadout_cost = await engine.calculate_loadout_equipment_cost(
        equipment_list=tree_service_equipment,
        crew_config=tree_crew_config,
        severity_factor=SeverityFactor.STANDARD_WORK
    )
    
    print(f"🚜 Heavy Equipment Cost: ${tree_loadout_cost['heavy_equipment']['total_cost_per_hour']:.2f}/hr")
    print(f"🔧 Small Tools Pool Cost: ${tree_loadout_cost['small_tools_pool']['total_cost_per_hour']:.2f}/hr")
    print(f"💰 TOTAL TREE SERVICE LOADOUT: ${tree_loadout_cost['loadout_summary']['total_equipment_cost_per_hour']:.2f}/hr")
    
    print(f"\n📈 Cost Distribution:")
    print(f"  • Heavy Equipment: {tree_loadout_cost['loadout_summary']['heavy_equipment_percentage']:.1f}%")
    print(f"  • Small Tools Pool: {tree_loadout_cost['loadout_summary']['small_tools_percentage']:.1f}%")
    
    print(f"\n✅ Equipment Cost Intelligence Demo Complete!")
    print(f"🎯 Key Benefit: Zero spreadsheet work - AI calculates everything automatically!")

if __name__ == "__main__":
    asyncio.run(demonstrate_equipment_costing())