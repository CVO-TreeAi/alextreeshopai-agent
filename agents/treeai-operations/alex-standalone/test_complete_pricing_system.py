#!/usr/bin/env python3
"""
Test Complete TreeAI Pricing System
Tests all pricing components: equipment costs, employee costs, and loadout pricing intelligence
"""

import asyncio
import json
from datetime import datetime
import traceback

# Import all pricing modules
from equipment_cost_intelligence import (
    EquipmentCostIntelligence, EquipmentCategory, SeverityFactor
)
from true_hourly_employee_cost import (
    TrueHourlyEmployeeCostCalculator, EmployeePosition, LocationState
)
from loadout_pricing_intelligence import (
    LoadoutPricingIntelligence, ProjectType, LoadoutConfiguration
)

async def test_equipment_cost_intelligence():
    """Test the equipment cost intelligence system"""
    print("🛠️  Testing Equipment Cost Intelligence")
    print("=" * 50)
    
    try:
        engine = EquipmentCostIntelligence()
        
        # Test single equipment calculation
        print("\n1. Testing single equipment cost calculation...")
        mulcher_cost = await engine.calculate_equipment_cost(
            equipment_type=EquipmentCategory.SKID_STEER_MULCHER,
            make_model="2022 Bobcat T770 + Denis Cimaf",
            purchase_price=118000,
            year=2022,
            severity_factor=SeverityFactor.HEAVY_VEGETATION
        )
        
        print(f"   ✅ Mulcher cost calculated: ${mulcher_cost.total_cost_per_hour:.2f}/hr")
        assert mulcher_cost.total_cost_per_hour > 0, "Cost should be positive"
        assert mulcher_cost.total_cost_per_hour < 200, "Cost seems too high"
        
        # Test small tools pool calculation
        print("\n2. Testing small tools pool calculation...")
        crew_config = {
            "climbers": 2,
            "ground_crew": 2,
            "chainsaws": 4,
            "crews": 1
        }
        
        small_tools_cost = engine.calculate_small_tools_pool_cost(crew_config)
        total_small_tools = small_tools_cost["Total Small Tools Pool"]
        
        print(f"   ✅ Small tools pool calculated: ${total_small_tools:.2f}/hr")
        assert total_small_tools > 0, "Small tools cost should be positive"
        assert total_small_tools < 50, "Small tools cost seems too high"
        
        # Test complete loadout equipment cost
        print("\n3. Testing complete loadout equipment cost...")
        equipment_list = [
            {
                "type": "skid_steer_mulcher",
                "make_model": "Bobcat T770 + Denis Cimaf",
                "purchase_price": 118000,
                "year": 2022
            },
            {
                "type": "pickup_truck",
                "make_model": "Ford F-350",
                "purchase_price": 65000,
                "year": 2023
            }
        ]
        
        loadout_cost = await engine.calculate_loadout_equipment_cost(
            equipment_list=equipment_list,
            crew_config=crew_config,
            severity_factor=SeverityFactor.HEAVY_VEGETATION
        )
        
        total_equipment_cost = loadout_cost['loadout_summary']['total_equipment_cost_per_hour']
        print(f"   ✅ Complete loadout equipment cost: ${total_equipment_cost:.2f}/hr")
        assert total_equipment_cost > 0, "Total equipment cost should be positive"
        
        print("✅ Equipment Cost Intelligence tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Equipment Cost Intelligence test failed: {str(e)}")
        traceback.print_exc()
        return False

def test_employee_cost_calculator():
    """Test the true hourly employee cost calculator"""
    print("\n👷 Testing True Hourly Employee Cost Calculator")
    print("=" * 50)
    
    try:
        calculator = TrueHourlyEmployeeCostCalculator()
        
        # Test single employee calculation
        print("\n1. Testing single employee cost calculation...")
        arborist_cost = calculator.calculate_true_hourly_cost(
            position=EmployeePosition.ISA_CERTIFIED_ARBORIST,
            location_state=LocationState.FLORIDA,
            hourly_rate=25.0
        )
        
        print(f"   ✅ Arborist true cost calculated: ${arborist_cost.true_hourly_cost:.2f}/hr")
        print(f"      (vs ${arborist_cost.hourly_rate:.2f}/hr base rate = {arborist_cost.burden_multiplier:.2f}x multiplier)")
        
        assert arborist_cost.true_hourly_cost > arborist_cost.hourly_rate, "True cost should be higher than base rate"
        assert arborist_cost.burden_multiplier > 1.4, "Burden multiplier should be significant for tree care"
        assert arborist_cost.burden_multiplier < 3.0, "Burden multiplier seems too high"
        
        # Test crew cost calculation
        print("\n2. Testing crew cost calculation...")
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
        
        total_base_rate = crew_cost['crew_summary']['total_base_hourly_rate']
        total_true_cost = crew_cost['crew_summary']['total_true_hourly_cost']
        
        print(f"   ✅ Crew cost calculated: ${total_true_cost:.2f}/hr (vs ${total_base_rate:.2f}/hr base)")
        assert total_true_cost > total_base_rate, "True cost should be higher than base rates"
        
        # Test state comparison
        print("\n3. Testing state-by-state comparison...")
        fl_cost = calculator.calculate_true_hourly_cost(
            position=EmployeePosition.GROUND_CREW_MEMBER,
            location_state=LocationState.FLORIDA,
            hourly_rate=18.0
        )
        
        ca_cost = calculator.calculate_true_hourly_cost(
            position=EmployeePosition.GROUND_CREW_MEMBER,
            location_state=LocationState.CALIFORNIA,
            hourly_rate=18.0
        )
        
        print(f"   ✅ Florida: ${fl_cost.true_hourly_cost:.2f}/hr")
        print(f"   ✅ California: ${ca_cost.true_hourly_cost:.2f}/hr")
        assert ca_cost.true_hourly_cost > fl_cost.true_hourly_cost, "California should be more expensive"
        
        print("✅ Employee Cost Calculator tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Employee Cost Calculator test failed: {str(e)}")
        traceback.print_exc()
        return False

async def test_loadout_pricing_intelligence():
    """Test the complete loadout pricing intelligence system"""
    print("\n🎯 Testing Loadout Pricing Intelligence")
    print("=" * 50)
    
    try:
        pricing_engine = LoadoutPricingIntelligence()
        
        # Test single loadout pricing
        print("\n1. Testing single loadout pricing...")
        residential_config = pricing_engine.loadout_templates["residential_tree_service"]
        residential_pricing = await pricing_engine.calculate_loadout_pricing(residential_config)
        
        print(f"   ✅ Residential loadout pricing calculated:")
        print(f"      Total Cost: ${residential_pricing.total_cost_per_hour:.2f}/hr")
        print(f"      Recommended Rate: ${residential_pricing.recommended_billing_rate:.2f}/hr")
        print(f"      Profit Margin: {residential_pricing.profit_margin_percentage:.0f}%")
        
        assert residential_pricing.total_cost_per_hour > 0, "Total cost should be positive"
        assert residential_pricing.recommended_billing_rate > residential_pricing.total_cost_per_hour, "Billing rate should be higher than cost"
        assert 20 <= residential_pricing.profit_margin_percentage <= 60, "Profit margin should be reasonable"
        
        # Test scenario comparison
        print("\n2. Testing scenario comparison...")
        scenarios = [
            pricing_engine.loadout_templates["residential_tree_service"],
            pricing_engine.loadout_templates["forestry_mulching_operation"],
            pricing_engine.loadout_templates["stump_grinding_crew"]
        ]
        
        comparison = await pricing_engine.compare_loadout_scenarios(scenarios)
        
        print(f"   ✅ Compared {len(scenarios)} scenarios successfully")
        assert len(comparison['scenarios']) == len(scenarios), "Should have results for all scenarios"
        assert 'best_cost_efficiency' in comparison['analysis'], "Should have analysis results"
        
        # Test project optimization
        print("\n3. Testing project-specific optimization...")
        project_requirements = {
            "project_type": "forestry_mulching",
            "location_state": "florida",
            "complexity": "high"
        }
        
        optimized_config = await pricing_engine.optimize_loadout_for_project(project_requirements)
        optimized_pricing = await pricing_engine.calculate_loadout_pricing(optimized_config)
        
        print(f"   ✅ Optimized loadout: ${optimized_pricing.total_cost_per_hour:.2f}/hr")
        assert optimized_config.project_type.value == "forestry_mulching", "Should match requested project type"
        assert optimized_config.severity_factor.value > 1.0, "High complexity should have severity factor > 1.0"
        
        print("✅ Loadout Pricing Intelligence tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Loadout Pricing Intelligence test failed: {str(e)}")
        traceback.print_exc()
        return False

async def test_integration():
    """Test integration between all pricing systems"""
    print("\n🔗 Testing System Integration")
    print("=" * 50)
    
    try:
        # Create a custom loadout and test end-to-end
        print("\n1. Testing end-to-end custom loadout pricing...")
        
        custom_loadout = LoadoutConfiguration(
            name="Custom Test Loadout",
            project_type=ProjectType.TREE_REMOVAL,
            equipment_list=[
                {
                    "type": "bucket_truck",
                    "make_model": "Test Bucket Truck",
                    "purchase_price": 150000,
                    "year": 2022
                },
                {
                    "type": "chipper",
                    "make_model": "Test Chipper",
                    "purchase_price": 45000,
                    "year": 2021
                }
            ],
            crew_composition=[
                {"position": "isa_certified_arborist", "hourly_rate": 30.0},
                {"position": "ground_crew_lead", "hourly_rate": 20.0},
                {"position": "ground_crew_member", "hourly_rate": 16.0}
            ],
            location_state=LocationState.FLORIDA,
            severity_factor=SeverityFactor.STANDARD_WORK
        )
        
        pricing_engine = LoadoutPricingIntelligence()
        custom_pricing = await pricing_engine.calculate_loadout_pricing(custom_loadout)
        
        print(f"   ✅ Custom loadout pricing calculated:")
        print(f"      Equipment Cost: ${custom_pricing.equipment_cost_per_hour:.2f}/hr")
        print(f"      Employee Cost: ${custom_pricing.employee_cost_per_hour:.2f}/hr")
        print(f"      Total Cost: ${custom_pricing.total_cost_per_hour:.2f}/hr")
        print(f"      Recommended Rate: ${custom_pricing.recommended_billing_rate:.2f}/hr")
        
        # Verify the integration logic
        expected_total = custom_pricing.equipment_cost_per_hour + custom_pricing.employee_cost_per_hour
        assert abs(custom_pricing.total_cost_per_hour - expected_total) < 0.01, "Total should equal equipment + employee costs"
        
        # Test profit calculation
        expected_profit_rate = custom_pricing.total_cost_per_hour / (1 - 0.35)  # 35% margin for tree removal
        assert abs(custom_pricing.recommended_billing_rate - expected_profit_rate) < 1.0, "Profit calculation should be correct"
        
        print("\n2. Testing data consistency...")
        
        # Verify equipment costs are reasonable
        assert 20 <= custom_pricing.equipment_cost_per_hour <= 150, f"Equipment cost seems unreasonable: ${custom_pricing.equipment_cost_per_hour:.2f}/hr"
        
        # Verify employee costs are reasonable
        assert 30 <= custom_pricing.employee_cost_per_hour <= 200, f"Employee cost seems unreasonable: ${custom_pricing.employee_cost_per_hour:.2f}/hr"
        
        # Verify total costs are reasonable
        assert 50 <= custom_pricing.total_cost_per_hour <= 300, f"Total cost seems unreasonable: ${custom_pricing.total_cost_per_hour:.2f}/hr"
        
        print("   ✅ Data consistency checks passed")
        
        print("✅ System Integration tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Integration test failed: {str(e)}")
        traceback.print_exc()
        return False

async def run_performance_benchmark():
    """Run performance benchmark on the pricing system"""
    print("\n⚡ Performance Benchmark")
    print("=" * 50)
    
    try:
        pricing_engine = LoadoutPricingIntelligence()
        
        # Time multiple calculations
        start_time = datetime.now()
        
        tasks = []
        for template_name in pricing_engine.loadout_templates:
            config = pricing_engine.loadout_templates[template_name]
            task = pricing_engine.calculate_loadout_pricing(config)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"   ✅ Calculated {len(results)} loadout pricings in {duration:.2f} seconds")
        print(f"   ✅ Average time per calculation: {duration/len(results):.3f} seconds")
        
        assert duration < 5.0, "Performance should be reasonable"
        assert all(r.total_cost_per_hour > 0 for r in results), "All calculations should succeed"
        
        print("✅ Performance benchmark passed!")
        return True
        
    except Exception as e:
        print(f"❌ Performance benchmark failed: {str(e)}")
        traceback.print_exc()
        return False

async def main():
    """Run all tests for the complete pricing system"""
    print("🚀 TreeAI Complete Pricing System Test Suite")
    print("=" * 70)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_results = []
    
    # Run all test suites
    test_suites = [
        ("Equipment Cost Intelligence", test_equipment_cost_intelligence()),
        ("Employee Cost Calculator", test_employee_cost_calculator()),
        ("Loadout Pricing Intelligence", test_loadout_pricing_intelligence()),
        ("System Integration", test_integration()),
        ("Performance Benchmark", run_performance_benchmark())
    ]
    
    for suite_name, test_coro in test_suites:
        print(f"\n" + "="*70)
        try:
            if asyncio.iscoroutine(test_coro):
                result = await test_coro
            else:
                result = test_coro
            test_results.append((suite_name, result))
        except Exception as e:
            print(f"❌ {suite_name} failed with exception: {str(e)}")
            test_results.append((suite_name, False))
    
    # Print final results
    print(f"\n" + "="*70)
    print("🏁 TEST RESULTS SUMMARY")
    print("="*70)
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for suite_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{suite_name:<30} {status}")
        if result:
            passed_tests += 1
    
    print(f"\nOverall Result: {passed_tests}/{total_tests} test suites passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED! TreeAI pricing system is ready!")
        print("\n🎯 System Capabilities:")
        print("   • Equipment cost intelligence with USACE methodology")
        print("   • True hourly employee cost with burden factors")
        print("   • Small tools and consumables pool management")  
        print("   • Complete loadout pricing intelligence")
        print("   • Competitive analysis and profit optimization")
        print("   • Multi-state and multi-project type support")
        print("\n💡 Alex can now:")
        print("   • Calculate true equipment costs automatically")
        print("   • Account for all employee burden costs")
        print("   • Provide intelligent pricing recommendations")
        print("   • Optimize loadouts for profitability")
        print("   • Analyze competitive positioning")
    else:
        print(f"⚠️  {total_tests - passed_tests} test suites failed. Please review errors above.")
        return False
    
    return True

if __name__ == "__main__":
    asyncio.run(main())