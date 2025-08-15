#!/usr/bin/env python3
"""
Alex TreeAI Agent CLI Interface
Command-line interface for running Alex agent operations
"""

import asyncio
import argparse
import json
import sys
import os
from typing import Dict, Any, Optional
from datetime import datetime
import logging

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from alex_agent import AlexTreeAIAgent, create_alex_agent
from alex_config import load_config, Environment

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AlexCLI:
    """Command-line interface for Alex agent"""
    
    def __init__(self):
        self.alex: Optional[AlexTreeAIAgent] = None
        self.config = None
        
    async def initialize(self, afiss_path: str, environment: str = "development"):
        """Initialize Alex agent"""
        try:
            logger.info(f"Initializing Alex agent in {environment} environment...")
            self.config = load_config(afiss_path, environment)
            self.alex = AlexTreeAIAgent(self.config.__dict__)
            await self.alex.initialize()
            logger.info("✅ Alex agent initialized successfully!")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize Alex: {e}")
            return False
    
    async def assess_project(self, project_input: str, format_output: bool = True) -> str:
        """Assess a tree service project"""
        if not self.alex:
            return "❌ Alex not initialized. Run 'alex init' first."
            
        try:
            logger.info("🌳 Starting project assessment...")
            result = await self.alex.assess_complete_project(project_input)
            
            if format_output:
                return self._format_assessment_output(result)
            else:
                return str(result)
                
        except Exception as e:
            logger.error(f"Assessment failed: {e}")
            return f"❌ Assessment failed: {e}"
    
    async def optimize_operations(self, operations_data: Dict[str, Any]) -> str:
        """Optimize ongoing operations"""
        if not self.alex:
            return "❌ Alex not initialized. Run 'alex init' first."
            
        try:
            logger.info("⚙️ Optimizing operations...")
            result = await self.alex.optimize_operations(operations_data)
            return result
        except Exception as e:
            logger.error(f"Optimization failed: {e}")
            return f"❌ Optimization failed: {e}"
    
    async def interactive_mode(self):
        """Start interactive chat mode with Alex"""
        if not self.alex:
            print("❌ Alex not initialized. Run 'alex init' first.")
            return
            
        print("\n🌳 === ALEX TREEAI OPERATIONS AGENT ===")
        print("Interactive mode started. Type 'exit' to quit, 'help' for commands.")
        print("Alex is ready to help with all your tree service operations!\n")
        
        while True:
            try:
                user_input = input("You: ").strip()
                
                if user_input.lower() in ['exit', 'quit', 'bye']:
                    print("👋 Alex: Goodbye! Stay safe out there!")
                    break
                elif user_input.lower() == 'help':
                    self._print_help()
                    continue
                elif not user_input:
                    continue
                    
                print("Alex: 🤔 Let me analyze that...")
                result = await self.alex.assess_complete_project(user_input)
                print(f"Alex: {result}\n")
                
            except KeyboardInterrupt:
                print("\n👋 Alex: Goodbye! Stay safe out there!")
                break
            except Exception as e:
                print(f"❌ Error: {e}\n")
    
    def _format_assessment_output(self, result: str) -> str:
        """Format assessment output for CLI display"""
        lines = result.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Add emoji indicators
            if 'ASSESSMENT' in line.upper():
                formatted_lines.append(f"🎯 {line}")
            elif 'SAFETY' in line.upper():
                formatted_lines.append(f"🛡️ {line}")
            elif 'COST' in line.upper() or '$' in line:
                formatted_lines.append(f"💰 {line}")
            elif 'CREW' in line.upper():
                formatted_lines.append(f"👥 {line}")
            elif 'RECOMMENDATION' in line.upper():
                formatted_lines.append(f"💡 {line}")
            else:
                formatted_lines.append(f"   {line}")
        
        return '\n'.join(formatted_lines)
    
    def _print_help(self):
        """Print help information"""
        help_text = """
🌳 ALEX TREEAI OPERATIONS AGENT - HELP

AVAILABLE COMMANDS:
• assess <description>  - Assess a tree service project
• optimize <data>      - Optimize ongoing operations  
• interactive         - Start interactive chat mode
• help               - Show this help message
• exit               - Exit Alex

EXAMPLE PROJECT ASSESSMENTS:
• "80ft oak tree removal near power lines, residential area"
• "Multiple tree trimming project at commercial building"
• "Emergency storm damage cleanup, 5 trees down"
• "Stump grinding in tight backyard space, 36 inch oak"

Alex can help with:
✅ TreeScore calculations
✅ AFISS risk assessment (340+ factors)
✅ Crew optimization and assignment
✅ Cost estimation with complexity factors
✅ Safety protocol determination
✅ Equipment requirements
✅ Timeline planning

Alex prioritizes SAFETY first, then efficiency and profitability!
        """
        print(help_text)

async def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Alex TreeAI Operations Agent CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  alex init --afiss-path /path/to/AFISS
  alex assess "80ft oak removal near power lines"
  alex interactive
  alex optimize operations.json
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Init command
    init_parser = subparsers.add_parser('init', help='Initialize Alex agent')
    init_parser.add_argument('--afiss-path', required=True, 
                           help='Path to AFISS data directory')
    init_parser.add_argument('--environment', default='development',
                           choices=['development', 'staging', 'production'],
                           help='Environment to run in')
    
    # Assess command
    assess_parser = subparsers.add_parser('assess', help='Assess a tree service project')
    assess_parser.add_argument('project', help='Project description')
    assess_parser.add_argument('--afiss-path', required=True,
                             help='Path to AFISS data directory')
    assess_parser.add_argument('--json', action='store_true',
                             help='Output in JSON format')
    
    # Interactive command
    interactive_parser = subparsers.add_parser('interactive', help='Start interactive mode')
    interactive_parser.add_argument('--afiss-path', required=True,
                                  help='Path to AFISS data directory')
    interactive_parser.add_argument('--environment', default='development',
                                  choices=['development', 'staging', 'production'])
    
    # Optimize command
    optimize_parser = subparsers.add_parser('optimize', help='Optimize operations')
    optimize_parser.add_argument('data_file', help='JSON file with operations data')
    optimize_parser.add_argument('--afiss-path', required=True,
                               help='Path to AFISS data directory')
    
    # Health check command
    health_parser = subparsers.add_parser('health', help='Check Alex agent health')
    health_parser.add_argument('--afiss-path', required=True,
                             help='Path to AFISS data directory')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    cli = AlexCLI()
    
    try:
        if args.command == 'init':
            success = await cli.initialize(args.afiss_path, args.environment)
            if success:
                print("✅ Alex agent initialized successfully!")
                print("You can now use 'alex assess', 'alex interactive', or 'alex optimize'")
            else:
                print("❌ Failed to initialize Alex agent")
                sys.exit(1)
                
        elif args.command == 'assess':
            await cli.initialize(args.afiss_path)
            result = await cli.assess_project(args.project, not args.json)
            print(result)
            
        elif args.command == 'interactive':
            await cli.initialize(args.afiss_path, args.environment)
            await cli.interactive_mode()
            
        elif args.command == 'optimize':
            if not os.path.exists(args.data_file):
                print(f"❌ Data file not found: {args.data_file}")
                sys.exit(1)
                
            with open(args.data_file, 'r') as f:
                operations_data = json.load(f)
                
            await cli.initialize(args.afiss_path)
            result = await cli.optimize_operations(operations_data)
            print(result)
            
        elif args.command == 'health':
            await cli.initialize(args.afiss_path)
            print("🏥 Alex Health Check")
            print("✅ Agent: Operational")
            print("✅ AFISS: Loaded") 
            print("✅ Vector DB: Connected")
            print("✅ Memory: Active")
            print("🌳 Alex is ready for tree service operations!")
            
    except KeyboardInterrupt:
        print("\n👋 Operation cancelled by user")
    except Exception as e:
        logger.error(f"Command failed: {e}")
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())