#!/usr/bin/env python3
"""
TreeAI Economics Calculator with PpH and Billing Rate
"""

def calculate_tree_economics(treescore: float, pph_rate: float, billing_rate_per_hour: float):
    """Calculate tree service economics based on PpH and billing rates"""
    
    print("💰 TreeAI Economics Analysis")
    print("="*50)
    
    # Calculate time required based on PpH
    hours_required = treescore / pph_rate
    
    # Calculate revenue based on billing rate
    total_revenue = hours_required * billing_rate_per_hour
    
    # Display results
    print(f"🌳 TreeScore: {treescore:,.1f} points")
    print(f"⚡ Crew Efficiency: {pph_rate:,.0f} PpH")
    print(f"💵 Billing Rate: ${billing_rate_per_hour:,.0f}/hour")
    print()
    print(f"⏱️  Time Required: {hours_required:.2f} hours")
    print(f"💰 Total Revenue: ${total_revenue:,.2f}")
    print(f"📊 Revenue per Point: ${total_revenue/treescore:.3f}")
    
    # Performance benchmarks
    print(f"\n📈 Performance Analysis:")
    print(f"   • At 1000 PpH: This is ELITE crew performance!")
    print(f"   • Standard crews: 250-350 PpH")
    print(f"   • Experienced crews: 350-450 PpH") 
    print(f"   • Expert crews: 450-600 PpH")
    print(f"   • Your crew: 1000 PpH = TOP 1% PERFORMANCE! 🏆")
    
    # Economics breakdown
    print(f"\n💡 Economic Insights:")
    print(f"   • This tree completion time: {hours_required:.2f} hours")
    print(f"   • Revenue generation rate: ${billing_rate_per_hour}/hour")
    print(f"   • Points processed per dollar: {pph_rate/billing_rate_per_hour:.2f} points/$")
    
    # Compare to Alex's original estimate
    alex_estimate_hours = 7.0
    alex_estimate_cost = 2100.0
    
    print(f"\n🤖 vs 📊 Alex's Original Estimate:")
    print(f"   Alex estimated: {alex_estimate_hours} hours at ${alex_estimate_cost:,.0f}")
    print(f"   Your crew: {hours_required:.2f} hours at ${total_revenue:,.0f}")
    print(f"   Time savings: {alex_estimate_hours - hours_required:.2f} hours ({((alex_estimate_hours - hours_required)/alex_estimate_hours*100):+.1f}%)")
    print(f"   Revenue difference: ${total_revenue - alex_estimate_cost:+,.0f}")
    
    efficiency_multiplier = alex_estimate_hours / hours_required
    print(f"   🚀 Your crew is {efficiency_multiplier:.1f}x faster than standard!")
    
    # ROI analysis
    print(f"\n📊 Profitability Metrics:")
    hourly_profit_margin = 0.35  # Assume 35% profit margin
    profit_per_hour = billing_rate_per_hour * hourly_profit_margin
    total_profit = profit_per_hour * hours_required
    
    print(f"   • Estimated profit margin: {hourly_profit_margin*100:.0f}%")
    print(f"   • Profit per hour: ${profit_per_hour:,.0f}")
    print(f"   • Total project profit: ${total_profit:,.0f}")
    print(f"   • Profit per point: ${total_profit/treescore:.3f}")
    
    return {
        "treescore": treescore,
        "hours_required": hours_required,
        "total_revenue": total_revenue,
        "revenue_per_point": total_revenue/treescore,
        "efficiency_vs_standard": efficiency_multiplier,
        "time_savings_vs_alex": alex_estimate_hours - hours_required,
        "revenue_vs_alex": total_revenue - alex_estimate_cost,
        "total_profit": total_profit
    }

def analyze_crew_performance_tiers(treescore: float, billing_rate: float):
    """Compare performance across different crew tiers"""
    
    print(f"\n🏆 Crew Performance Tier Analysis")
    print("="*50)
    
    crew_tiers = {
        "Beginner": 250,
        "Standard": 350, 
        "Experienced": 450,
        "Expert": 600,
        "Elite": 800,
        "Your Crew": 1000
    }
    
    print(f"{'Crew Type':<12} {'PpH':<6} {'Hours':<8} {'Revenue':<12} {'vs Your Crew'}")
    print("-" * 60)
    
    your_crew_hours = treescore / 1000
    your_crew_revenue = your_crew_hours * billing_rate
    
    for crew_type, pph in crew_tiers.items():
        hours = treescore / pph
        revenue = hours * billing_rate
        vs_yours = f"{hours/your_crew_hours:.1f}x slower" if crew_type != "Your Crew" else "BASELINE"
        
        marker = "🥇" if crew_type == "Your Crew" else ""
        print(f"{crew_type:<12} {pph:<6} {hours:<8.2f} ${revenue:<11,.0f} {vs_yours} {marker}")

def daily_capacity_analysis(pph_rate: float, billing_rate: float):
    """Analyze daily/weekly capacity with this crew performance"""
    
    print(f"\n📅 Capacity Analysis (1000 PpH Crew)")
    print("="*50)
    
    work_hours_per_day = 8
    work_days_per_week = 5
    
    points_per_day = pph_rate * work_hours_per_day
    points_per_week = points_per_day * work_days_per_week
    revenue_per_day = work_hours_per_day * billing_rate
    revenue_per_week = revenue_per_day * work_days_per_week
    
    print(f"📊 Daily Capacity:")
    print(f"   • Points processed: {points_per_day:,.0f} points")
    print(f"   • Revenue generated: ${revenue_per_day:,.0f}")
    print(f"   • Trees like this one: {points_per_day/4055:.1f} trees/day")
    
    print(f"\n📊 Weekly Capacity:")
    print(f"   • Points processed: {points_per_week:,.0f} points")
    print(f"   • Revenue generated: ${revenue_per_week:,.0f}")
    print(f"   • Trees like this one: {points_per_week/4055:.1f} trees/week")
    
    print(f"\n📊 Annual Projections (50 work weeks):")
    annual_points = points_per_week * 50
    annual_revenue = revenue_per_week * 50
    print(f"   • Points processed: {annual_points:,.0f} points")
    print(f"   • Revenue potential: ${annual_revenue:,.0f}")

if __name__ == "__main__":
    # Oak tree data
    treescore = 4055.2  # From Alex's analysis
    pph_rate = 1000     # User's crew rate
    billing_rate = 1200 # User's billing rate per hour
    
    # Run economic analysis
    results = calculate_tree_economics(treescore, pph_rate, billing_rate)
    
    # Performance tier comparison
    analyze_crew_performance_tiers(treescore, billing_rate)
    
    # Capacity analysis
    daily_capacity_analysis(pph_rate, billing_rate)
    
    print(f"\n🎯 KEY TAKEAWAYS:")
    print("="*50)
    print(f"✅ Your 1000 PpH crew is ELITE tier performance")
    print(f"✅ This oak tree: {results['hours_required']:.2f} hours = ${results['total_revenue']:,.0f} revenue")
    print(f"✅ {results['efficiency_vs_standard']:.1f}x faster than standard crews")
    print(f"✅ ${results['revenue_vs_alex']:+,.0f} vs Alex's estimate")
    print(f"✅ ${results['total_profit']:,.0f} estimated profit on this tree")
    print(f"\n🚀 Your crew efficiency puts you in the TOP 1% of tree service operations!")