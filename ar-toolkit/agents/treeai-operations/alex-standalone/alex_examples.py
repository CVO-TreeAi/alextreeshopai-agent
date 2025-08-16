#!/usr/bin/env python3
"""
Alex TreeAI Examples - See Alex assessments in action
"""

from alex_demo_interactive import AlexDemo

def run_examples():
    """Run Alex assessment examples"""
    demo = AlexDemo()
    
    examples = [
        "Large oak tree removal in residential neighborhood. Tree is 65 feet tall with power lines overhead and close to house.",
        "Emergency storm-damaged tree blocking commercial driveway. High priority removal needed.",
        "Simple backyard maple trimming, easy access, no obstacles.",
        "80-foot pine removal near power lines requiring crane and traffic control.",
        "Dead elm tree removal next to swimming pool with narrow gate access.",
        "Routine pruning of street trees along busy commercial road."
    ]
    
    print(f"🌳 ALEX TREEAI OPERATIONS AGENT")
    print("=" * 50)
    print("AI-Powered Tree Service Assessment System")
    print("Using AFISS Risk Assessment Framework")
    print(f"Analyzing {len(examples)} example projects...\n")
    
    for i, example in enumerate(examples, 1):
        print(f"📋 ASSESSMENT {i} of {len(examples)}")
        assessment = demo.simulate_assessment(example)
        demo.print_assessment(assessment)
        
        if i < len(examples):
            print(f"\n{'─' * 60}")
            print("Moving to next assessment...")
            print(f"{'─' * 60}")

if __name__ == "__main__":
    run_examples()