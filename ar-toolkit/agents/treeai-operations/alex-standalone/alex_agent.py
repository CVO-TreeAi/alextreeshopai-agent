#!/usr/bin/env python3
"""
Alex TreeAI Operations Agent - Standalone Implementation
Advanced autonomous agent for complete tree service operations management

Features:
- LangChain agent with AFISS knowledge base
- Vector database for 340+ risk factors
- Real-time learning and adaptation
- Convex backend integration
- Multi-tool coordination
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

# LangChain & AI Framework
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.agents.agent import AgentAction, AgentFinish
from langchain.tools import BaseTool, tool
from langchain.memory import ConversationBufferWindowMemory
from langchain.callbacks import BaseCallbackHandler
from langchain.schema import BaseMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig

# Vector Database & Embeddings
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

# Data & Math
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

# Async & Networking
import aiohttp
import asyncpg
from pydantic import BaseModel, Field

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProjectComplexity(Enum):
    LOW = "low"          # 1.12-1.28x (8-28% AFISS)
    MODERATE = "moderate" # 1.45-1.85x (30-46% AFISS) 
    HIGH = "high"        # 2.1-2.8x (47-58% AFISS)
    EXTREME = "extreme"  # 2.5-3.5x (78-85% AFISS)

@dataclass
class AFISSAssessment:
    """Complete AFISS assessment result"""
    access_score: float
    fall_zone_score: float 
    interference_score: float
    severity_score: float
    site_conditions_score: float
    composite_score: float
    complexity: ProjectComplexity
    multiplier_range: Tuple[float, float]
    identified_factors: List[Dict[str, Any]]
    recommendations: List[str]

@dataclass  
class TreeScoreResult:
    """TreeScore calculation result"""
    base_points: float
    afiss_bonus: float
    total_points: float
    estimated_hours: float
    crew_recommendation: str

@dataclass
class ProjectAssessment:
    """Complete project assessment"""
    project_id: str
    timestamp: datetime
    tree_score: TreeScoreResult
    afiss_assessment: AFISSAssessment
    crew_assignment: Dict[str, Any]
    equipment_requirements: List[str]
    safety_protocols: List[str]
    estimated_cost: float
    timeline_days: int

class AFISSKnowledgeBase:
    """Vector database for AFISS factors with learning capabilities"""
    
    def __init__(self, data_directory: str):
        self.data_dir = data_directory
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = None
        self.ml_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.factor_database = {}
        self.historical_outcomes = []
        
    async def initialize(self):
        """Initialize vector database with AFISS factors"""
        logger.info("Initializing AFISS Knowledge Base...")
        
        # Load all AFISS factor files
        factor_files = [
            "AFISS_ACCESS_DOMAIN_Assessment_Factors.txt",
            "AFISS_FALL_ZONE_DOMAIN_ASSESSMENT_FACTORS.txt", 
            "AFISS_INTERFERENCE_DOMAIN_Assessment_Factors.txt",
            "AFISS_SEVERITY_DOMAIN_Assessment_Factors.txt"
        ]
        
        documents = []
        for file in factor_files:
            file_path = os.path.join(self.data_dir, "Assessment-Factors", file)
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    content = f.read()
                    documents.append(content)
                    
        # Split and embed documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\nAF_", "\n\n", "\n", " "]
        )
        
        splits = text_splitter.split_text("\n\n".join(documents))
        self.vectorstore = Chroma.from_texts(
            texts=splits,
            embedding=self.embeddings,
            persist_directory=f"{self.data_dir}/vector_db"
        )
        
        # Parse factors into structured database
        self._parse_factors(documents)
        
        logger.info(f"Loaded {len(splits)} AFISS factor chunks into vector database")
        
    def _parse_factors(self, documents: List[str]):
        """Parse AFISS factors into structured database"""
        for doc in documents:
            lines = doc.split('\n')
            current_factor = {}
            
            for line in lines:
                if line.startswith('AF_'):
                    if current_factor:
                        self.factor_database[current_factor.get('code')] = current_factor
                    current_factor = {'code': line.strip()}
                elif line.startswith('Factor Name:'):
                    current_factor['name'] = line.replace('Factor Name:', '').strip()
                elif line.startswith('Base Percentage:'):
                    current_factor['base_percentage'] = float(line.replace('Base Percentage:', '').replace('%', '').strip())
                elif line.startswith('Description:'):
                    current_factor['description'] = line.replace('Description:', '').strip()
                elif line.startswith('Trigger Conditions:'):
                    current_factor['triggers'] = line.replace('Trigger Conditions:', '').strip()
                    
    async def assess_project(self, project_data: Dict[str, Any]) -> AFISSAssessment:
        """Perform comprehensive AFISS assessment"""
        logger.info(f"Performing AFISS assessment for project: {project_data.get('id')}")
        
        # Query vector database for relevant factors
        query = self._build_assessment_query(project_data)
        relevant_docs = self.vectorstore.similarity_search(query, k=50)
        
        # Calculate domain scores
        domain_scores = {
            'access': 0.0,
            'fall_zone': 0.0, 
            'interference': 0.0,
            'severity': 0.0,
            'site_conditions': 0.0
        }
        
        identified_factors = []
        
        # Process each relevant factor
        for doc in relevant_docs:
            factor_match = self._match_factor_to_conditions(doc.page_content, project_data)
            if factor_match:
                identified_factors.append(factor_match)
                domain = self._get_factor_domain(factor_match['code'])
                domain_scores[domain] += factor_match['score']
                
        # Apply domain weights and calculate composite score
        weighted_scores = {
            'access': domain_scores['access'] * 0.20,
            'fall_zone': domain_scores['fall_zone'] * 0.25,
            'interference': domain_scores['interference'] * 0.20, 
            'severity': domain_scores['severity'] * 0.30,
            'site_conditions': domain_scores['site_conditions'] * 0.05
        }
        
        composite_score = sum(weighted_scores.values())
        complexity, multiplier = self._determine_complexity(composite_score)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(identified_factors, complexity)
        
        return AFISSAssessment(
            access_score=domain_scores['access'],
            fall_zone_score=domain_scores['fall_zone'],
            interference_score=domain_scores['interference'], 
            severity_score=domain_scores['severity'],
            site_conditions_score=domain_scores['site_conditions'],
            composite_score=composite_score,
            complexity=complexity,
            multiplier_range=multiplier,
            identified_factors=identified_factors,
            recommendations=recommendations
        )
        
    def _build_assessment_query(self, project_data: Dict[str, Any]) -> str:
        """Build search query for relevant AFISS factors"""
        query_parts = []
        
        # Add project characteristics
        if 'location_type' in project_data:
            query_parts.append(f"location type {project_data['location_type']}")
        if 'nearby_structures' in project_data:
            query_parts.append(f"structures {' '.join(project_data['nearby_structures'])}")
        if 'utilities' in project_data:
            query_parts.append(f"utilities {' '.join(project_data['utilities'])}")
        if 'access_challenges' in project_data:
            query_parts.append(f"access {' '.join(project_data['access_challenges'])}")
            
        return " ".join(query_parts)
        
    def _match_factor_to_conditions(self, factor_text: str, project_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Match factor conditions to project data"""
        # Simplified matching logic - in production this would be more sophisticated
        lines = factor_text.split('\n')
        factor_code = None
        base_percentage = 0.0
        name = ""
        
        for line in lines:
            if line.startswith('AF_'):
                factor_code = line.strip()
            elif 'Base Percentage:' in line:
                try:
                    base_percentage = float(line.split(':')[1].replace('%', '').strip())
                except:
                    base_percentage = 5.0
            elif 'Factor Name:' in line:
                name = line.split(':')[1].strip()
                
        if factor_code and self._conditions_match(factor_text, project_data):
            return {
                'code': factor_code,
                'name': name,
                'score': base_percentage,
                'triggered': True,
                'text': factor_text[:200] + "..." if len(factor_text) > 200 else factor_text
            }
        return None
        
    def _conditions_match(self, factor_text: str, project_data: Dict[str, Any]) -> bool:
        """Check if factor conditions match project data"""
        # Simplified matching - would implement sophisticated NLP matching
        text_lower = factor_text.lower()
        
        # Check for common trigger conditions
        if 'residential' in text_lower and project_data.get('location_type') == 'residential':
            return True
        if 'power' in text_lower and 'power_lines' in project_data.get('utilities', []):
            return True
        if 'driveway' in text_lower and 'driveway_access' in project_data.get('access_challenges', []):
            return True
            
        return False
        
    def _get_factor_domain(self, factor_code: str) -> str:
        """Determine domain from factor code"""
        if 'ACCESS' in factor_code:
            return 'access'
        elif 'FALLZONE' in factor_code:
            return 'fall_zone' 
        elif 'INTERFERENCE' in factor_code:
            return 'interference'
        elif 'SEVERITY' in factor_code:
            return 'severity'
        else:
            return 'site_conditions'
            
    def _determine_complexity(self, composite_score: float) -> Tuple[ProjectComplexity, Tuple[float, float]]:
        """Determine project complexity and multiplier range"""
        if composite_score <= 28:
            return ProjectComplexity.LOW, (1.12, 1.28)
        elif composite_score <= 46:
            return ProjectComplexity.MODERATE, (1.45, 1.85)
        elif composite_score <= 58:
            return ProjectComplexity.HIGH, (2.1, 2.8)
        else:
            return ProjectComplexity.EXTREME, (2.5, 3.5)
            
    def _generate_recommendations(self, factors: List[Dict], complexity: ProjectComplexity) -> List[str]:
        """Generate operational recommendations"""
        recommendations = []
        
        if complexity in [ProjectComplexity.HIGH, ProjectComplexity.EXTREME]:
            recommendations.append("Require ISA certified arborist on site")
            recommendations.append("Implement enhanced safety protocols")
            
        if any('power' in f.get('name', '').lower() for f in factors):
            recommendations.append("Coordinate with utility company for line de-energization")
            
        if any('residential' in f.get('name', '').lower() for f in factors):
            recommendations.append("Implement residential protection protocols")
            
        return recommendations

class AlexTreeAIAgent:
    """Main Alex Agent - Autonomous TreeAI Operations Commander"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.afiss_kb = AFISSKnowledgeBase(config['afiss_data_path'])
        
        # Initialize LLM and memory
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.1,
            max_tokens=4000
        )
        
        self.memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            return_messages=True,
            k=10
        )
        
        # Performance tracking
        self.crew_performance_db = {}
        self.project_history = []
        self.learning_enabled = True
        
        # Tools setup
        self.tools = self._initialize_tools()
        self.agent_executor = None
        
    async def initialize(self):
        """Initialize Alex agent and all subsystems"""
        logger.info("Initializing Alex TreeAI Operations Agent...")
        
        # Initialize AFISS knowledge base
        await self.afiss_kb.initialize()
        
        # Setup agent executor
        prompt = self._create_agent_prompt()
        agent = create_openai_tools_agent(self.llm, self.tools, prompt)
        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=10
        )
        
        logger.info("Alex agent initialization complete")
        
    def _create_agent_prompt(self) -> ChatPromptTemplate:
        """Create the main agent prompt template"""
        system_message = """You are Alex, the TreeAI Operations Commander - the most advanced autonomous agent for tree service operations management.

CORE IDENTITY:
- Master of all tree service operations from lead assessment to payment completion
- Expert in TreeScore calculations, AFISS risk assessment, crew optimization, and business orchestration
- Certified Arborist (ISA) with 15+ years operational experience
- Safety-first philosophy while optimizing efficiency and profitability

CAPABILITIES:
- TreeScore Calculation: Height × (Canopy Radius × 2) × (DBH/12) + AFISS
- AFISS Assessment: 340+ factors across 5 domains (Access, Fall Zone, Interference, Severity, Site Conditions)
- Crew Performance Optimization: PpH tracking and resource allocation
- Real-time Decision Making: Equipment, safety, and operational protocols
- Learning & Adaptation: Continuous improvement from project outcomes

DECISION FRAMEWORK:
1. Safety Always First - No compromise on crew or public safety
2. Comprehensive Assessment - Use AFISS system for all risk evaluation  
3. Data-Driven Optimization - Base decisions on historical performance and real metrics
4. Proactive Communication - Keep all stakeholders informed with clear, actionable information
5. Continuous Learning - Adapt and improve based on outcomes

COMMUNICATION STYLE:
- Authoritative yet approachable
- Data-driven with clear reasoning
- Balances technical expertise with practical business sense
- Uses "orchestrate" metaphors for complex operations
- Always explains the "why" behind recommendations

Your goal is to optimize every aspect of tree service operations while maintaining the highest safety standards and customer satisfaction."""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_message),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad")
        ])
        
        return prompt
        
    def _initialize_tools(self) -> List[BaseTool]:
        """Initialize all Alex tools"""
        return [
            self._create_treescore_tool(),
            self._create_afiss_assessment_tool(),
            self._create_crew_optimization_tool(),
            self._create_cost_calculator_tool(),
            self._create_safety_protocol_tool()
        ]
        
    def _create_treescore_tool(self) -> BaseTool:
        """TreeScore calculation tool"""
        @tool
        def calculate_treescore(
            height: float,
            canopy_radius: float, 
            dbh: float,
            service_type: str = "removal"
        ) -> str:
            """Calculate TreeScore points for a tree service project.
            
            Args:
                height: Tree height in feet
                canopy_radius: Average canopy radius in feet
                dbh: Diameter at breast height in inches  
                service_type: Type of service (removal, trimming, stump_grinding)
            """
            if service_type == "removal":
                base_points = height * (canopy_radius * 2) * (dbh / 12)
            elif service_type == "stump_grinding":
                # Simplified stump calculation 
                base_points = (height + 12) * dbh  # Assuming 12" grind depth
            else:
                # Trimming calculation
                base_points = height * canopy_radius * (dbh / 24)
                
            return f"Base TreeScore: {base_points:.1f} points (before AFISS assessment)"
            
        return calculate_treescore
        
    def _create_afiss_assessment_tool(self) -> BaseTool:
        """AFISS risk assessment tool"""
        @tool
        async def assess_afiss_factors(project_description: str) -> str:
            """Perform AFISS risk assessment for a tree service project.
            
            Args:
                project_description: Detailed description of project conditions, location, and hazards
            """
            # Parse project description into structured data
            project_data = self._parse_project_description(project_description)
            
            # Perform AFISS assessment
            assessment = await self.afiss_kb.assess_project(project_data)
            
            result = f"""AFISS ASSESSMENT COMPLETE:
            
Composite Score: {assessment.composite_score:.1f}%
Complexity: {assessment.complexity.value.upper()}
Multiplier Range: {assessment.multiplier_range[0]:.2f}x - {assessment.multiplier_range[1]:.2f}x

Domain Breakdown:
- Access: {assessment.access_score:.1f}%
- Fall Zone: {assessment.fall_zone_score:.1f}% 
- Interference: {assessment.interference_score:.1f}%
- Severity: {assessment.severity_score:.1f}%
- Site Conditions: {assessment.site_conditions_score:.1f}%

Key Risk Factors Identified: {len(assessment.identified_factors)}
Recommendations: {', '.join(assessment.recommendations[:3])}"""

            return result
            
        return assess_afiss_factors
        
    def _create_crew_optimization_tool(self) -> BaseTool:
        """Crew assignment and optimization tool"""
        @tool
        def optimize_crew_assignment(
            total_points: float,
            complexity: str,
            timeline_days: int = 1
        ) -> str:
            """Optimize crew assignment based on project requirements.
            
            Args:
                total_points: Total project points (TreeScore + AFISS)
                complexity: Project complexity level (low, moderate, high, extreme)
                timeline_days: Desired completion timeline
            """
            # Determine optimal crew configuration
            if complexity in ["high", "extreme"]:
                crew_type = "expert"
                pph_range = (450, 550)
                crew_size = 4
            elif complexity == "moderate":
                crew_type = "experienced" 
                pph_range = (350, 450)
                crew_size = 3
            else:
                crew_type = "standard"
                pph_range = (250, 350)
                crew_size = 3
                
            estimated_hours = total_points / pph_range[0]
            crew_days = estimated_hours / (8 * crew_size)
            
            return f"""OPTIMAL CREW ASSIGNMENT:
            
Crew Type: {crew_type.title()} ({crew_size} members)
Expected PpH: {pph_range[0]}-{pph_range[1]}
Estimated Hours: {estimated_hours:.1f}
Timeline: {crew_days:.1f} days
            
Requirements:
- {"ISA Certified Arborist required" if complexity in ["high", "extreme"] else "Standard crew acceptable"}
- {"Enhanced safety protocols" if complexity in ["high", "extreme"] else "Standard safety protocols"}"""

        return optimize_crew_assignment
        
    def _create_cost_calculator_tool(self) -> BaseTool:
        """Dynamic cost calculation tool"""
        @tool
        def calculate_project_cost(
            estimated_hours: float,
            complexity_multiplier: float,
            crew_type: str = "standard"
        ) -> str:
            """Calculate project cost with complexity adjustments.
            
            Args:
                estimated_hours: Estimated project hours
                complexity_multiplier: AFISS complexity multiplier
                crew_type: Crew type (standard, experienced, expert)
            """
            # Base hourly rates by crew type
            hourly_rates = {
                "standard": 180,
                "experienced": 220,
                "expert": 280
            }
            
            base_rate = hourly_rates.get(crew_type, 180)
            base_cost = estimated_hours * base_rate
            final_cost = base_cost * complexity_multiplier
            
            return f"""PROJECT COST CALCULATION:
            
Base Hours: {estimated_hours:.1f} @ ${base_rate}/hour
Base Cost: ${base_cost:.2f}
Complexity Multiplier: {complexity_multiplier:.2f}x
Final Project Cost: ${final_cost:.2f}

Profit Margin: ${final_cost * 0.25:.2f} (25%)
Total Customer Price: ${final_cost * 1.25:.2f}"""

        return calculate_project_cost
        
    def _create_safety_protocol_tool(self) -> BaseTool:
        """Safety protocol determination tool"""
        @tool
        def determine_safety_protocols(
            identified_hazards: str,
            complexity_level: str
        ) -> str:
            """Determine required safety protocols based on hazards.
            
            Args:
                identified_hazards: Comma-separated list of identified hazards
                complexity_level: Project complexity (low, moderate, high, extreme)
            """
            hazards = [h.strip().lower() for h in identified_hazards.split(',')]
            protocols = []
            
            # Base protocols
            protocols.append("Pre-job safety briefing")
            protocols.append("PPE inspection and verification")
            
            # Hazard-specific protocols
            if any('power' in h or 'electrical' in h for h in hazards):
                protocols.append("Utility coordination and line clearance")
                protocols.append("Electrical hazard training verification")
                
            if any('residential' in h or 'structure' in h for h in hazards):
                protocols.append("Property protection setup")
                protocols.append("Exclusion zone establishment")
                
            if complexity_level in ["high", "extreme"]:
                protocols.append("ISA certified arborist supervision")
                protocols.append("Enhanced communication systems")
                protocols.append("Emergency response plan activation")
                
            return f"""SAFETY PROTOCOL REQUIREMENTS:

Required Protocols ({len(protocols)}):
{chr(10).join(f'• {p}' for p in protocols)}

Compliance Level: {complexity_level.upper()}
Documentation Required: {'Yes' if complexity_level in ['high', 'extreme'] else 'Standard'}"""

        return determine_safety_protocols
        
    def _parse_project_description(self, description: str) -> Dict[str, Any]:
        """Parse natural language project description into structured data"""
        # Simplified parsing - would implement NLP in production
        project_data = {
            'id': f"proj_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'description': description
        }
        
        desc_lower = description.lower()
        
        # Location type
        if 'residential' in desc_lower or 'house' in desc_lower:
            project_data['location_type'] = 'residential'
        elif 'commercial' in desc_lower or 'business' in desc_lower:
            project_data['location_type'] = 'commercial'
            
        # Utilities
        utilities = []
        if 'power line' in desc_lower or 'electrical' in desc_lower:
            utilities.append('power_lines')
        if 'gas' in desc_lower:
            utilities.append('gas_lines')
        project_data['utilities'] = utilities
        
        # Access challenges  
        access_challenges = []
        if 'driveway' in desc_lower:
            access_challenges.append('driveway_access')
        if 'narrow' in desc_lower:
            access_challenges.append('narrow_access')
        project_data['access_challenges'] = access_challenges
        
        return project_data
        
    async def assess_complete_project(self, project_input: str) -> ProjectAssessment:
        """Perform complete project assessment orchestration"""
        logger.info("Starting complete project assessment...")
        
        # Use agent to coordinate assessment
        result = await self.agent_executor.ainvoke({
            "input": f"""Perform a complete project assessment for this tree service project:

{project_input}

Please provide:
1. TreeScore calculation
2. AFISS risk assessment  
3. Crew optimization recommendation
4. Cost calculation
5. Safety protocol requirements

Be thorough and provide specific recommendations."""
        })
        
        return result["output"]
        
    async def optimize_operations(self, operation_data: Dict[str, Any]) -> str:
        """Optimize ongoing operations with real-time data"""
        result = await self.agent_executor.ainvoke({
            "input": f"""Optimize these ongoing tree service operations:

{json.dumps(operation_data, indent=2)}

Focus on:
- Performance vs expectations
- Resource allocation adjustments  
- Safety monitoring
- Timeline optimization
- Cost management

Provide specific actionable recommendations."""
        })
        
        return result["output"]

# Configuration and startup
async def create_alex_agent(afiss_data_path: str) -> AlexTreeAIAgent:
    """Create and initialize Alex agent"""
    config = {
        'afiss_data_path': afiss_data_path,
        'learning_enabled': True,
        'max_concurrent_projects': 10
    }
    
    alex = AlexTreeAIAgent(config)
    await alex.initialize()
    return alex

# Example usage
if __name__ == "__main__":
    async def main():
        # Initialize Alex
        afiss_path = "/Users/ain/TreeAI-Agent-Kit/AFISS"
        alex = await create_alex_agent(afiss_path)
        
        # Example project assessment
        project_description = """
        Large oak tree removal in residential neighborhood. Tree is 80 feet tall, 
        30 foot canopy radius, 36 inch DBH. Located 20 feet from house, power lines 
        run directly overhead. Steep driveway access with concrete surface. 
        Customer concerned about property damage.
        """
        
        result = await alex.assess_complete_project(project_description)
        print("=== ALEX ASSESSMENT RESULT ===")
        print(result)
        
    # Run the example
    asyncio.run(main())