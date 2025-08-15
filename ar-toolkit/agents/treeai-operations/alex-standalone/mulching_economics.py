#!/usr/bin/env python3
"""
Forestry Mulching Economics Calculator
Implements the package-based pricing system with AFISS production rate adjustments
"""

def calculate_mulching_economics(project_size_acres: float, package_type: str, 
                               base_production_rate: float, billing_rate: float,
                               afiss_adjustment: float = 0.0, transport_hours: float = 0) -> dict:
    """
    Calculate forestry mulching economics using the package system
    
    Args:
        project_size_acres: Size of project in acres
        package_type: "4_inch", "6_inch", "8_inch", or "10_inch" 
        base_production_rate: Base production rate in ia/h (inch acres per hour)
        billing_rate: Hourly billing rate
        afiss_adjustment: AFISS factor adjustment (-0.5 to +0.4)
        transport_hours: Transport time in hours
    
    Returns:
        Dictionary with complete economic breakdown
    """
    
    print("🌲 Forestry Mulching Economics Calculator")
    print("=" * 50)
    
    # Package definitions - CORRECTED: larger diameter = harder = lower rate
    package_specs = {
        "4_inch": {"dbh_limit": 4, "difficulty_factor": 1.0, "description": "Light brush, small trees (baseline)"},
        "6_inch": {"dbh_limit": 6, "difficulty_factor": 0.77, "description": "Medium package (23% slower)"}, 
        "8_inch": {"dbh_limit": 8, "difficulty_factor": 0.63, "description": "Heavy vegetation (37% slower)"},
        "10_inch": {"dbh_limit": 10, "difficulty_factor": 0.50, "description": "Large trees, clearing (50% slower)"}
    }
    
    if package_type not in package_specs:
        raise ValueError(f"Invalid package type. Must be one of: {list(package_specs.keys())}")
    
    package_info = package_specs[package_type]
    dbh_limit = package_info["dbh_limit"]
    difficulty_factor = package_info["difficulty_factor"]
    
    print(f"📦 Package: {package_type} (DBH limit: {dbh_limit}\", {package_info['description']})")
    print(f"📏 Project Size: {project_size_acres} acres")
    print(f"💰 Billing Rate: ${billing_rate}/hour")
    
    # Calculate package inches using the formula
    package_inches = project_size_acres * dbh_limit
    print(f"📊 Package Inches: {package_inches:.1f} inch-acres")
    
    # Apply AFISS adjustment to production rate
    afiss_adjusted_rate = base_production_rate * (1 + afiss_adjustment)
    
    # Apply package difficulty factor 
    final_production_rate = afiss_adjusted_rate * difficulty_factor
    
    print(f"\n📈 Production Rate Analysis:")
    print(f"   • Base Rate: {base_production_rate:.2f} ia/h")
    if afiss_adjustment != 0:
        print(f"   • AFISS Adjusted: {afiss_adjusted_rate:.2f} ia/h ({afiss_adjustment:+.1%})")
    print(f"   • Package Difficulty: {difficulty_factor:.2f}x ({((difficulty_factor-1)*100):+.0f}%)")  
    print(f"   • Final Rate: {final_production_rate:.2f} ia/h")
    
    # Calculate mulching hours using the formula: hours = package_inches / production_rate
    mulching_hours = package_inches / final_production_rate
    
    # Calculate costs
    mulching_cost = mulching_hours * billing_rate
    transport_cost = transport_hours * (billing_rate * 0.75) if transport_hours > 0 else 0
    total_cost = mulching_cost + transport_cost
    
    print(f"\n⏱️  Time Analysis:")
    print(f"   • Mulching Hours: {mulching_hours:.2f} hours")
    if transport_hours > 0:
        print(f"   • Transport Hours: {transport_hours:.1f} hours (@ 75% billing rate)")
    print(f"   • Total Project Time: {mulching_hours + transport_hours:.2f} hours")
    
    print(f"\n💰 Cost Breakdown:")
    print(f"   • Mulching Cost: ${mulching_cost:,.0f}")
    if transport_cost > 0:
        print(f"   • Transport Cost: ${transport_cost:,.0f}")
    print(f"   • Total Project Cost: ${total_cost:,.0f}")
    print(f"   • Cost per Acre: ${total_cost/project_size_acres:,.0f}")
    print(f"   • Cost per Hour: ${total_cost/(mulching_hours + transport_hours):,.0f}")
    
    # Performance metrics
    print(f"\n📊 Performance Metrics:")
    print(f"   • Acres per Hour: {project_size_acres/mulching_hours:.2f} acres/hour")
    print(f"   • Revenue per Hour: ${billing_rate:,.0f}/hour")
    print(f"   • Inch-Acres per Hour: {final_production_rate:.2f} ia/h")
    
    return {
        "project_details": {
            "project_size_acres": project_size_acres,
            "package_type": package_type,
            "package_dbh_limit": dbh_limit,
            "package_inches": package_inches,
            "package_description": package_info["description"]
        },
        "production_rates": {
            "base_production_rate": base_production_rate,
            "afiss_adjustment": afiss_adjustment,
            "afiss_adjusted_rate": afiss_adjusted_rate,
            "package_difficulty_factor": difficulty_factor,
            "final_production_rate": final_production_rate
        },
        "time_breakdown": {
            "mulching_hours": mulching_hours,
            "transport_hours": transport_hours,
            "total_hours": mulching_hours + transport_hours
        },
        "cost_breakdown": {
            "billing_rate_per_hour": billing_rate,
            "transport_billing_rate": billing_rate * 0.75,
            "mulching_cost": mulching_cost,
            "transport_cost": transport_cost,
            "total_cost": total_cost,
            "cost_per_acre": total_cost / project_size_acres,
            "cost_per_hour": total_cost / (mulching_hours + transport_hours)
        },
        "performance_metrics": {
            "acres_per_hour": project_size_acres / mulching_hours,
            "revenue_per_hour": billing_rate,
            "inch_acres_per_hour": final_production_rate
        }
    }

def compare_package_options(project_size_acres: float, base_production_rate: float, 
                          billing_rate: float, afiss_adjustment: float = 0.0):
    """Compare economics across all package types"""
    
    print(f"\n🔍 Package Comparison for {project_size_acres} acre project")
    print("=" * 60)
    
    packages = ["4_inch", "6_inch", "8_inch", "10_inch"]
    results = []
    
    print(f"{'Package':<8} {'Hours':<8} {'Cost':<12} {'$/Acre':<10} {'Rate (ia/h)'}")
    print("-" * 60)
    
    for package in packages:
        economics = calculate_mulching_economics(
            project_size_acres, package, base_production_rate, 
            billing_rate, afiss_adjustment, transport_hours=0
        )
        
        results.append(economics)
        
        print(f"{package:<8} {economics['time_breakdown']['mulching_hours']:<8.2f} "
              f"${economics['cost_breakdown']['total_cost']:<11,.0f} "
              f"${economics['cost_breakdown']['cost_per_acre']:<9,.0f} "
              f"{economics['production_rates']['final_production_rate']:.2f}")
    
    return results

def analyze_afiss_impact(project_size_acres: float, package_type: str,
                        base_production_rate: float, billing_rate: float):
    """Analyze the impact of different AFISS adjustments"""
    
    print(f"\n📊 AFISS Impact Analysis - {package_type} package")
    print("=" * 50)
    
    # Test different AFISS scenarios
    scenarios = [
        {"name": "Ideal Conditions", "adjustment": 0.25, "description": "Perfect terrain, light vegetation"},
        {"name": "Standard Conditions", "adjustment": 0.0, "description": "Normal site conditions"},
        {"name": "Moderate Challenges", "adjustment": -0.15, "description": "Some difficult factors"},
        {"name": "Brazilian Pepper", "adjustment": -0.25, "description": "Moderate invasive species"},
        {"name": "Heavy Brazilian Pepper", "adjustment": -0.30, "description": "Dense invasive vegetation"},
        {"name": "Multiple Challenges", "adjustment": -0.45, "description": "Brazilian pepper + wet soil + steep terrain"}
    ]
    
    print(f"{'Scenario':<20} {'Adj':<6} {'Hours':<8} {'Cost':<12} {'Rate'}")
    print("-" * 55)
    
    baseline_cost = None
    
    for scenario in scenarios:
        economics = calculate_mulching_economics(
            project_size_acres, package_type, base_production_rate,
            billing_rate, scenario["adjustment"], transport_hours=0
        )
        
        if scenario["name"] == "Standard Conditions":
            baseline_cost = economics['cost_breakdown']['total_cost']
        
        cost_diff = ""
        if baseline_cost and scenario["name"] != "Standard Conditions":
            diff = economics['cost_breakdown']['total_cost'] - baseline_cost
            cost_diff = f"({diff:+,.0f})"
        
        print(f"{scenario['name']:<20} {scenario['adjustment']:>+5.1%} "
              f"{economics['time_breakdown']['mulching_hours']:<8.2f} "
              f"${economics['cost_breakdown']['total_cost']:<8,.0f} {cost_diff:<8} "
              f"{economics['production_rates']['final_production_rate']:.2f}")
        print(f"{'└─ ' + scenario['description']:<20}")
        print()

def demo_user_example():
    """Demo using the user's specific example"""
    
    print("🌲 USER EXAMPLE: 3.5 acres, medium package, Brazilian pepper")
    print("=" * 70)
    
    # User's specifications
    project_size = 3.5  # acres
    package_type = "6_inch"  # medium package
    base_rate = 1.5  # ia/h production rate
    billing_rate = 500  # per hour
    transport_hours = 1.5
    
    # AFISS factors from the user's example:
    # - Brazilian pepper (moderate): -25%
    # - Dense hardwood vegetation: -20% (estimated)
    total_afiss_adjustment = -0.25 + -0.20  # -45% total
    
    print(f"Project: {project_size} acres")
    print(f"Package: {package_type} (medium)")
    print(f"Base Rate: {base_rate} ia/h")
    print(f"Billing: ${billing_rate}/hour")
    print(f"Transport: {transport_hours} hours")
    print(f"AFISS Factors: Brazilian pepper (-25%) + Dense vegetation (-20%) = {total_afiss_adjustment:.1%}")
    
    # Calculate with AFISS adjustments
    economics = calculate_mulching_economics(
        project_size, package_type, base_rate, billing_rate, 
        total_afiss_adjustment, transport_hours
    )
    
    print(f"\n🎯 FINAL RESULTS:")
    print("-" * 30)
    print(f"Mulching Hours: {economics['time_breakdown']['mulching_hours']:.2f}")
    print(f"Transport Hours: {economics['time_breakdown']['transport_hours']:.1f}")
    print(f"Total Hours: {economics['time_breakdown']['total_hours']:.2f}")
    print(f"Total Cost: ${economics['cost_breakdown']['total_cost']:,.0f}")
    print(f"Cost per Acre: ${economics['cost_breakdown']['cost_per_acre']:,.0f}")
    
    # Compare to user's original calculation
    print(f"\n📊 User's Formula Verification:")
    package_inches = project_size * 6  # 6" package
    original_hours = package_inches / base_rate  # Without AFISS
    with_afiss_hours = package_inches / economics['production_rates']['final_production_rate']
    
    print(f"Package inches: {package_inches} inch-acres")
    print(f"Original estimate: {original_hours:.2f} hours")
    print(f"With AFISS: {with_afiss_hours:.2f} hours")
    print(f"AFISS impact: +{with_afiss_hours - original_hours:.2f} hours ({((with_afiss_hours/original_hours)-1)*100:+.1f}%)")

if __name__ == "__main__":
    # Run the user's example
    demo_user_example()
    
    # Show package comparison
    compare_package_options(3.5, 1.5, 500, -0.45)
    
    # Show AFISS impact analysis  
    analyze_afiss_impact(3.5, "6_inch", 1.5, 500)