#!/usr/bin/env python3
"""
Teaching Alex - Learning Methods Guide
Shows all the ways to improve Alex's knowledge and accuracy
"""

import asyncio
import json
from datetime import datetime

class AlexLearningSystem:
    """Guide to teaching Alex new knowledge and improving accuracy"""
    
    def __init__(self):
        pass
    
    def show_learning_methods(self):
        """Display all available learning methods"""
        
        print("🧠 How to Teach Alex More")
        print("="*60)
        
        print("\n1️⃣ PROJECT FEEDBACK LEARNING")
        print("-" * 40)
        print("📝 When projects complete, provide feedback on:")
        print("   • Were time estimates accurate?")
        print("   • Was cost estimate correct?") 
        print("   • Did AFISS factors actually apply?")
        print("   • What complexity was it really?")
        print("   • Any factors Alex missed?")
        print()
        print("🔄 This automatically updates AFISS factor weights")
        print("📈 Alex gets more accurate with each completed project")
        
        print("\n2️⃣ AFISS FACTOR CALIBRATION")
        print("-" * 40)
        print("🎯 Teach Alex by adjusting factor weights:")
        print("   • If a factor always applies → increase weight")
        print("   • If a factor rarely matters → decrease weight")
        print("   • Add new factors Alex should watch for")
        print("   • Remove factors that don't apply to your area")
        print()
        print("⚙️  Accessed through: Learning Pipeline system")
        
        print("\n3️⃣ REAL PROJECT DATA TRAINING")
        print("-" * 40)
        print("📊 Feed Alex your historical project data:")
        print("   • Upload past projects with actual times/costs")
        print("   • Alex learns your crew's specific performance")
        print("   • Calibrates estimates to YOUR operation")
        print("   • Understands local market conditions")
        print()
        print("💾 Method: Bulk import via Convex API")
        
        print("\n4️⃣ CUSTOM KNOWLEDGE BASE")
        print("-" * 40) 
        print("📚 Add specific knowledge Alex should know:")
        print("   • Local regulations and permit requirements")
        print("   • Specific equipment capabilities")
        print("   • Regional tree species and conditions")
        print("   • Your company's standard procedures")
        print("   • Customer preferences and pricing")
        print()
        print("🔧 Method: Vector database updates")
        
        print("\n5️⃣ MANUAL CORRECTIONS")
        print("-" * 40)
        print("✏️  Directly correct Alex's assessments:")
        print("   • Mark factors as accurate/inaccurate") 
        print("   • Adjust complexity scoring")
        print("   • Update crew performance expectations")
        print("   • Refine equipment recommendations")
        print()
        print("🎛️  Method: Assessment review interface")
        
        print("\n6️⃣ CONTINUOUS MONITORING")
        print("-" * 40)
        print("📈 Alex automatically learns from:")
        print("   • Weather impact on project times")
        print("   • Seasonal variations in difficulty")
        print("   • Equipment performance data")
        print("   • Customer satisfaction correlations")
        print("   • Safety incident patterns")
        print()
        print("🤖 Method: Automated learning pipeline")
    
    def show_feedback_examples(self):
        """Show examples of how to provide feedback"""
        
        print("\n\n📋 EXAMPLE: Project Feedback")
        print("="*60)
        
        project_feedback = {
            "project_id": "k1770j7kqy4chyytgmvdm441s57nj377",
            "feedback_type": "completion_review",
            "alex_estimates": {
                "estimated_hours": 7.0,
                "estimated_cost": 2100,
                "complexity_level": "moderate",
                "afiss_score": 23.1
            },
            "actual_results": {
                "actual_hours": 4.0,  # Your elite crew was faster
                "actual_cost": 4866,  # Higher billing rate
                "actual_complexity": "low",  # Turned out easier
                "weather_impact": "none",
                "crew_performance": "excellent"
            },
            "factor_feedback": [
                {
                    "factor_code": "AF_ACCESS_015",
                    "was_accurate": True,
                    "impact_observed": "Medium - did affect setup time"
                },
                {
                    "factor_code": "AF_FALL_ZONE_028", 
                    "was_accurate": False,
                    "impact_observed": "Low - house wasn't really in danger"
                }
            ],
            "lessons_learned": [
                "Elite crew (1000 PpH) significantly faster than standard estimates",
                "Suburban oaks with good access are lower complexity than assessed",
                "Fall zone concerns were overestimated for this tree size/location"
            ]
        }
        
        print("📝 Sample feedback structure:")
        print(json.dumps(project_feedback, indent=2))
        
    def show_learning_commands(self):
        """Show specific commands to teach Alex"""
        
        print("\n\n🛠️  PRACTICAL LEARNING COMMANDS")
        print("="*60)
        
        print("\n🔧 1. Update Factor Weight:")
        print("```python")
        print("await alex.learning_pipeline.update_factor_weight(")
        print("    factor_code='AF_ACCESS_015',")
        print("    new_weight=12.5,  # Increased from 8.0")
        print("    reason='Factor consistently applies in suburban areas'")
        print(")")
        print("```")
        
        print("\n🔧 2. Add Custom Factor:")
        print("```python")
        print("await alex.afiss_kb.add_custom_factor({")
        print("    'factor_code': 'AF_LOCAL_001',")
        print("    'factor_name': 'City permit required',")
        print("    'domain': 'access',")
        print("    'base_percentage': 15.0,")
        print("    'description': 'Local ordinance requires permits for removals >20ft'")
        print("})")
        print("```")
        
        print("\n🔧 3. Train on Historical Data:")
        print("```python")
        print("historical_projects = [")
        print("    {'description': '...', 'actual_hours': 6.5, 'estimated_hours': 8.0},")
        print("    # ... more projects")
        print("]")
        print("await alex.learning_pipeline.train_on_historical_data(historical_projects)")
        print("```")
        
        print("\n🔧 4. Set Crew Performance:")
        print("```python")
        print("await alex.set_crew_performance({")
        print("    'standard_pph': 350,")
        print("    'experienced_pph': 450,") 
        print("    'expert_pph': 600,")
        print("    'elite_pph': 1000  # Your crew!")
        print("})")
        print("```")
        
        print("\n🔧 5. Update Local Knowledge:")
        print("```python")
        print("await alex.update_local_knowledge({")
        print("    'region': 'Your City, State',")
        print("    'typical_tree_species': ['Oak', 'Maple', 'Pine'],")
        print("    'permit_requirements': 'Required for trees >20ft',")
        print("    'utility_company': 'Local Electric Co',")
        print("    'peak_season': 'Spring/Fall'")
        print("})")
        print("```")
    
    def show_learning_dashboard(self):
        """Show how to monitor Alex's learning progress"""
        
        print("\n\n📊 LEARNING PROGRESS DASHBOARD")
        print("="*60)
        
        print("📈 Track Alex's improvement:")
        print("   • Prediction accuracy over time")
        print("   • AFISS factor performance")
        print("   • Cost estimate variance")
        print("   • Time estimate accuracy")
        print("   • Customer satisfaction correlation")
        print()
        print("🔍 Access via:")
        print("   • Convex dashboard: Analytics section") 
        print("   • Alex CLI: `alex learning-stats`")
        print("   • Python: `alex.get_learning_analytics()`")
        
        sample_analytics = {
            "learning_cycles_completed": 15,
            "projects_learned_from": 47,
            "current_accuracy_rates": {
                "hours_prediction": "87.3%",
                "cost_prediction": "91.2%", 
                "complexity_assessment": "94.1%",
                "afiss_factor_accuracy": "89.7%"
            },
            "improvement_trend": "+12.4% over last 30 days",
            "top_performing_factors": [
                "AF_ACCESS_012: 96% accuracy",
                "AF_INTERFERENCE_045: 94% accuracy"
            ],
            "factors_needing_calibration": [
                "AF_SEVERITY_023: 67% accuracy"
            ]
        }
        
        print("\n📊 Sample Analytics:")
        print(json.dumps(sample_analytics, indent=2))

def show_quick_training_session():
    """Show a quick training session example"""
    
    print("\n\n🎓 QUICK TRAINING SESSION EXAMPLE")
    print("="*60)
    
    print("Scenario: Your elite crew just completed the oak tree project")
    print()
    print("Step 1: Review Alex's Assessment")
    print("   Alex predicted: 7 hours, $2,100, moderate complexity")
    print("   Reality: 4.06 hours, $4,866, low complexity")
    print()
    print("Step 2: Provide Feedback") 
    print("   ✅ Factor AF_ACCESS_015 was accurate")
    print("   ❌ Factor AF_FALL_ZONE_028 was overestimated")
    print("   ℹ️  Elite crew performance not factored in")
    print()
    print("Step 3: Update Alex's Knowledge")
    print("   • Set your crew PpH to 1000")
    print("   • Reduce fall zone factor weight for suburban trees")
    print("   • Add note about good access in this neighborhood")
    print()
    print("Step 4: Verify Learning")
    print("   • Alex now knows your crew is elite tier")
    print("   • Future suburban assessments will be more accurate")
    print("   • AFISS factors calibrated to your experience")
    print()
    print("🎯 Result: Next similar project will be much more accurate!")

async def main():
    """Main learning guide"""
    
    learning_system = AlexLearningSystem()
    
    # Show all learning methods
    learning_system.show_learning_methods()
    
    # Show feedback examples
    learning_system.show_feedback_examples()
    
    # Show practical commands
    learning_system.show_learning_commands()
    
    # Show learning dashboard
    learning_system.show_learning_dashboard()
    
    # Show quick training example
    show_quick_training_session()
    
    print("\n\n🚀 NEXT STEPS TO TEACH ALEX:")
    print("="*60)
    print("1. Complete your oak tree project and provide feedback")
    print("2. Set your crew performance to 1000 PpH")
    print("3. Review AFISS factors that didn't match reality")
    print("4. Add any local knowledge specific to your area")
    print("5. Monitor learning analytics in Convex dashboard")
    print()
    print("💡 Pro Tip: The more feedback you provide, the smarter Alex becomes!")
    print("   After 20-30 projects, Alex will be incredibly accurate for YOUR operation.")

if __name__ == "__main__":
    asyncio.run(main())