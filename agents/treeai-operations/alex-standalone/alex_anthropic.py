#!/usr/bin/env python3
"""
Alex TreeAI Operations Agent - Anthropic Claude Implementation
Advanced autonomous agent using Claude Opus, Sonnet, and Haiku strategically

Model Usage Strategy:
- Haiku: Fast assessments, simple calculations, routine operations
- Sonnet: Main workhorse for complex assessments, planning, optimization
- Opus: High-stakes decisions, complex multi-factor analysis, learning
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import time

# Anthropic & LangChain
import anthropic
from langchain_anthropic import ChatAnthropic
from langchain.agents import AgentExecutor, create_structured_chat_agent
from langchain.tools import BaseTool, tool
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# Vector Database & Embeddings
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

# Data & Math
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

# Async & Networking
import aiohttp
from pydantic import BaseModel, Field

# Convex Integration
from convex_client import AlexConvexIntegration, create_alex_convex_integration

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ClaudeModel(Enum):
    HAIKU = "claude-3-haiku-20240307"      # Fast, simple tasks
    SONNET = "claude-3-5-sonnet-20241022"  # Main workhorse  
    OPUS = "claude-3-opus-20240229"        # Complex reasoning

class TaskComplexity(Enum):
    SIMPLE = "simple"      # Use Haiku
    STANDARD = "standard"  # Use Sonnet
    COMPLEX = "complex"    # Use Opus

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
    reasoning: str

@dataclass  
class TreeScoreResult:
    """TreeScore calculation result"""
    base_points: float
    afiss_bonus: float
    total_points: float
    estimated_hours: float
    crew_recommendation: str
    calculation_details: str

class ClaudeModelManager:
    """Manages Claude model selection and usage"""
    
    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.usage_stats = {
            ClaudeModel.HAIKU: {"requests": 0, "tokens": 0},
            ClaudeModel.SONNET: {"requests": 0, "tokens": 0}, 
            ClaudeModel.OPUS: {"requests": 0, "tokens": 0}
        }
        
        # LangChain models
        self.haiku = ChatAnthropic(model=ClaudeModel.HAIKU.value, temperature=0.1, max_tokens=2000)
        self.sonnet = ChatAnthropic(model=ClaudeModel.SONNET.value, temperature=0.1, max_tokens=4000)
        self.opus = ChatAnthropic(model=ClaudeModel.OPUS.value, temperature=0.05, max_tokens=4000)
        
    def select_model(self, task_complexity: TaskComplexity, project_complexity: Optional[ProjectComplexity] = None) -> ChatAnthropic:
        """Select optimal Claude model based on task complexity"""
        
        # Override for extreme project complexity - always use Opus
        if project_complexity == ProjectComplexity.EXTREME:
            return self.opus
            
        # Standard model selection
        if task_complexity == TaskComplexity.SIMPLE:
            return self.haiku
        elif task_complexity == TaskComplexity.STANDARD:
            return self.sonnet
        else:  # COMPLEX
            return self.opus
            
    async def generate_response(
        self,
        prompt: str,
        task_complexity: TaskComplexity = TaskComplexity.STANDARD,
        project_complexity: Optional[ProjectComplexity] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate response using appropriate Claude model"""
        
        model = self.select_model(task_complexity, project_complexity)
        
        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        messages.append(HumanMessage(content=prompt))
        
        try:
            response = await model.ainvoke(messages)
            
            # Update usage stats
            model_enum = ClaudeModel.HAIKU if model == self.haiku else (
                ClaudeModel.SONNET if model == self.sonnet else ClaudeModel.OPUS
            )
            self.usage_stats[model_enum]["requests"] += 1
            
            return response.content
            
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            raise

class AFISSKnowledgeBase:
    """Vector database for AFISS factors with Claude integration"""
    
    def __init__(self, data_directory: str, model_manager: ClaudeModelManager):
        self.data_dir = data_directory
        self.model_manager = model_manager
        self.vectorstore = None
        self.factor_database = {}
        self.embeddings = SentenceTransformer('all-MiniLM-L6-v2')  # Local embeddings
        
    async def initialize(self):
        """Initialize vector database with AFISS factors"""
        logger.info("Initializing AFISS Knowledge Base with local embeddings...")
        
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
                    
        # Split and embed documents using local embeddings
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\nAF_", "\n\n", "\n", " "]
        )
        
        splits = text_splitter.split_text("\n\n".join(documents))
        
        # Create embeddings locally
        embeddings_list = self.embeddings.encode(splits)
        
        # Store in simple vector store (could upgrade to Chroma later)
        self.factor_embeddings = {
            i: {"text": split, "embedding": emb} 
            for i, (split, emb) in enumerate(zip(splits, embeddings_list))
        }
        
        # Parse factors into structured database
        self._parse_factors(documents)
        
        logger.info(f"Loaded {len(splits)} AFISS factor chunks with local embeddings")
        
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
                    try:
                        current_factor['base_percentage'] = float(line.replace('Base Percentage:', '').replace('%', '').strip())
                    except:
                        current_factor['base_percentage'] = 5.0
                elif line.startswith('Description:'):
                    current_factor['description'] = line.replace('Description:', '').strip()
                elif line.startswith('Trigger Conditions:'):
                    current_factor['triggers'] = line.replace('Trigger Conditions:', '').strip()
                    
    async def assess_project(self, project_data: Dict[str, Any]) -> AFISSAssessment:
        """Perform comprehensive AFISS assessment using Claude Sonnet/Opus"""
        logger.info(f"Performing AFISS assessment for project: {project_data.get('id')}")
        
        # Determine assessment complexity
        assessment_complexity = self._determine_assessment_complexity(project_data)
        
        # Build comprehensive assessment prompt
        assessment_prompt = self._build_assessment_prompt(project_data)
        
        system_prompt = """You are Alex, the TreeAI Operations Commander with expert knowledge of the AFISS (Assessment Factor Identification and Scoring System) covering 340+ risk factors across 5 domains:

1. ACCESS DOMAIN (20% weight): Equipment/crew access challenges
2. FALL ZONE DOMAIN (25% weight): Areas where tree parts may fall 
3. INTERFERENCE DOMAIN (20% weight): Obstacles complicating operations
4. SEVERITY DOMAIN (30% weight): Urgency and immediate risk factors
5. SITE CONDITIONS DOMAIN (5% weight): Environmental conditions

Your task is to analyze the project description and identify relevant AFISS factors, score each domain, and provide a comprehensive risk assessment.

For each domain, score from 0-100% based on identified risk factors. Then calculate:
- Composite Score = (Access×0.20) + (Fall Zone×0.25) + (Interference×0.20) + (Severity×0.30) + (Site×0.05)
- Complexity: Low(8-28%), Moderate(30-46%), High(47-58%), Extreme(78-85%)
- Multiplier: Low(1.12-1.28x), Moderate(1.45-1.85x), High(2.1-2.8x), Extreme(2.5-3.5x)

Provide detailed reasoning for each domain score and specific factor identification."""

        # Use appropriate Claude model
        response = await self.model_manager.generate_response(
            assessment_prompt,
            task_complexity=assessment_complexity,
            system_prompt=system_prompt
        )
        
        # Parse Claude's response into structured assessment
        return self._parse_assessment_response(response, project_data)
        
    def _determine_assessment_complexity(self, project_data: Dict[str, Any]) -> TaskComplexity:
        """Determine assessment task complexity"""
        complexity_indicators = 0
        
        # Check for complexity indicators
        description = project_data.get('description', '').lower()
        
        if any(term in description for term in ['power line', 'electrical', 'utility']):
            complexity_indicators += 2
        if any(term in description for term in ['commercial', 'business', 'office']):
            complexity_indicators += 1
        if any(term in description for term in ['emergency', 'storm', 'hazard']):
            complexity_indicators += 2
        if any(term in description for term in ['crane', 'bucket truck', 'complex']):
            complexity_indicators += 1
            
        if complexity_indicators >= 3:
            return TaskComplexity.COMPLEX
        elif complexity_indicators >= 1:
            return TaskComplexity.STANDARD
        else:
            return TaskComplexity.SIMPLE
            
    def _build_assessment_prompt(self, project_data: Dict[str, Any]) -> str:
        """Build comprehensive assessment prompt"""
        return f"""Analyze this tree service project for AFISS risk assessment:

PROJECT DESCRIPTION:
{project_data.get('description', '')}

PROJECT DETAILS:
- Location Type: {project_data.get('location_type', 'Unknown')}
- Nearby Utilities: {', '.join(project_data.get('utilities', []))}
- Access Challenges: {', '.join(project_data.get('access_challenges', []))}
- Nearby Structures: {', '.join(project_data.get('nearby_structures', []))}

Please provide a comprehensive AFISS assessment including:

1. ACCESS DOMAIN SCORE (0-100%):
   - Equipment access challenges
   - Crew movement restrictions
   - Material handling limitations
   - Regulatory/permission requirements

2. FALL ZONE DOMAIN SCORE (0-100%):
   - Primary target risks (structures, vehicles, people)
   - Secondary impact zones
   - Debris scatter potential
   - Emergency response needs

3. INTERFERENCE DOMAIN SCORE (0-100%):
   - Utility line conflicts
   - Structural obstacles
   - Vegetation interference
   - Environmental restrictions

4. SEVERITY DOMAIN SCORE (0-100%):
   - Immediate failure risks
   - Public safety exposure
   - Property damage potential
   - Liability considerations

5. SITE CONDITIONS DOMAIN SCORE (0-100%):
   - Terrain challenges
   - Weather factors
   - Space limitations
   - Infrastructure availability

Calculate the composite score and determine complexity level with specific recommendations."""

    def _parse_assessment_response(self, response: str, project_data: Dict[str, Any]) -> AFISSAssessment:
        """Parse Claude's assessment response into structured format"""
        # Initialize default values
        domain_scores = {
            'access': 10.0,
            'fall_zone': 15.0,
            'interference': 10.0,
            'severity': 20.0,
            'site_conditions': 5.0
        }
        
        identified_factors = []
        recommendations = []
        
        # Parse response for scores and details
        lines = response.split('\n')
        current_domain = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Look for domain scores
            if 'ACCESS DOMAIN' in line.upper() and '%' in line:
                try:
                    score = float(line.split('%')[0].split()[-1])
                    domain_scores['access'] = score
                except:
                    pass
            elif 'FALL ZONE DOMAIN' in line.upper() and '%' in line:
                try:
                    score = float(line.split('%')[0].split()[-1])
                    domain_scores['fall_zone'] = score
                except:
                    pass
            elif 'INTERFERENCE DOMAIN' in line.upper() and '%' in line:
                try:
                    score = float(line.split('%')[0].split()[-1])
                    domain_scores['interference'] = score
                except:
                    pass
            elif 'SEVERITY DOMAIN' in line.upper() and '%' in line:
                try:
                    score = float(line.split('%')[0].split()[-1])
                    domain_scores['severity'] = score
                except:
                    pass
            elif 'SITE CONDITIONS DOMAIN' in line.upper() and '%' in line:
                try:
                    score = float(line.split('%')[0].split()[-1])
                    domain_scores['site_conditions'] = score
                except:
                    pass
            elif line.startswith('•') or line.startswith('-'):
                if 'recommend' in line.lower():
                    recommendations.append(line.lstrip('•- '))
                else:
                    identified_factors.append({
                        'description': line.lstrip('•- '),
                        'domain': current_domain or 'general'
                    })
                    
        # Calculate composite score with domain weights
        composite_score = (
            domain_scores['access'] * 0.20 +
            domain_scores['fall_zone'] * 0.25 +
            domain_scores['interference'] * 0.20 +
            domain_scores['severity'] * 0.30 +
            domain_scores['site_conditions'] * 0.05
        )
        
        # Determine complexity and multiplier
        complexity, multiplier = self._determine_complexity(composite_score)
        
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
            recommendations=recommendations,
            reasoning=response
        )
        
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

class AlexTreeAIAgent:
    """Main Alex Agent using Anthropic Claude models strategically"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable required")
            
        self.model_manager = ClaudeModelManager(api_key)
        self.afiss_kb = AFISSKnowledgeBase(config['afiss_data_path'], self.model_manager)
        
        # Memory for conversations
        self.memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            return_messages=True,
            k=10
        )
        
        self.project_history = []
        self.convex_integration = None  # Will be initialized if Convex URL provided
        
    async def initialize(self):
        """Initialize Alex agent and all subsystems"""
        logger.info("Initializing Alex TreeAI Operations Agent with Anthropic Claude...")
        
        # Initialize AFISS knowledge base
        await self.afiss_kb.initialize()
        
        # Initialize Convex integration if configured
        convex_url = self.config.get('convex_url')
        if convex_url:
            try:
                self.convex_integration = await create_alex_convex_integration(
                    convex_url=convex_url,
                    verbose=self.config.get('convex_verbose', False)
                )
                logger.info("Alex-Convex integration initialized", convex_url=convex_url)
            except Exception as e:
                logger.warning("Failed to initialize Convex integration", error=str(e))
        
        logger.info("✅ Alex agent initialization complete - Claude models ready!")
        
    async def calculate_treescore(
        self,
        height: float,
        canopy_radius: float,
        dbh: float,
        service_type: str = "removal"
    ) -> TreeScoreResult:
        """Calculate TreeScore using Claude Haiku for speed"""
        
        prompt = f"""Calculate TreeScore for this tree service project:

Service Type: {service_type}
Tree Height: {height} feet
Canopy Radius: {canopy_radius} feet  
DBH: {dbh} inches

Use these formulas:
- Tree Removal: Height × (Canopy Radius × 2) × (DBH ÷ 12)
- Stump Grinding: (Height + 12) × Diameter (assuming 12" grind depth)
- Trimming: Height × Canopy Radius × (DBH ÷ 24)

Provide the calculation steps and base points total."""

        response = await self.model_manager.generate_response(
            prompt,
            task_complexity=TaskComplexity.SIMPLE  # Use Haiku for speed
        )
        
        # Parse calculation from response
        base_points = self._extract_treescore(response, height, canopy_radius, dbh, service_type)
        
        return TreeScoreResult(
            base_points=base_points,
            afiss_bonus=0.0,  # Will be added later
            total_points=base_points,
            estimated_hours=base_points / 400,  # Rough estimate
            crew_recommendation="TBD - pending AFISS assessment",
            calculation_details=response
        )
        
    def _extract_treescore(self, response: str, height: float, canopy_radius: float, dbh: float, service_type: str) -> float:
        """Extract TreeScore from Claude's response"""
        # Fallback calculation if parsing fails
        if service_type == "removal":
            return height * (canopy_radius * 2) * (dbh / 12)
        elif service_type == "stump_grinding":
            return (height + 12) * dbh
        else:  # trimming
            return height * canopy_radius * (dbh / 24)
            
    async def assess_complete_project(self, project_input: str) -> str:
        """Perform complete project assessment orchestration"""
        logger.info("Starting complete project assessment with Claude...")
        
        # Parse project input
        project_data = self._parse_project_description(project_input)
        
        # Step 1: TreeScore calculation (if tree measurements provided)
        tree_measurements = self._extract_measurements(project_input)
        treescore_result = None
        
        if tree_measurements:
            treescore_result = await self.calculate_treescore(
                tree_measurements['height'],
                tree_measurements['canopy_radius'], 
                tree_measurements['dbh'],
                tree_measurements.get('service_type', 'removal')
            )
            
        # Step 2: AFISS assessment using Claude Sonnet/Opus
        afiss_assessment = await self.afiss_kb.assess_project(project_data)
        
        # Step 3: Generate complete assessment using Claude Sonnet
        final_assessment = await self._generate_final_assessment(
            project_data, treescore_result, afiss_assessment
        )
        
        # Step 4: Sync to Convex backend if enabled
        if self.convex_integration:
            try:
                assessment_time = time.time() - time.time()  # Will calculate properly in real usage
                
                # Build complete assessment data for Convex
                alex_assessment = {
                    "project_description": project_data.get('description', ''),
                    "location_type": project_data.get('location_type', 'residential'),
                    "service_type": project_data.get('service_type', 'removal'),
                    
                    # Tree measurements (from parsing)
                    "tree_height": tree_measurements.get('height') if tree_measurements else None,
                    "canopy_radius": tree_measurements.get('canopy_radius') if tree_measurements else None,
                    "dbh": tree_measurements.get('dbh') if tree_measurements else None,
                    "tree_species": project_data.get('tree_species'),
                    "tree_condition": project_data.get('tree_condition'),
                    
                    # TreeScore results
                    "base_treescore": treescore_result.base_points if treescore_result else 0,
                    "total_treescore": (treescore_result.base_points + afiss_assessment.composite_score) if treescore_result else afiss_assessment.composite_score,
                    
                    # AFISS scores
                    "afiss_composite_score": afiss_assessment.composite_score,
                    "access_score": afiss_assessment.access_score,
                    "fall_zone_score": afiss_assessment.fall_zone_score,
                    "interference_score": afiss_assessment.interference_score,
                    "severity_score": afiss_assessment.severity_score,
                    "site_conditions_score": afiss_assessment.site_conditions_score,
                    "complexity_level": afiss_assessment.complexity.value,
                    "complexity_multiplier": sum(afiss_assessment.multiplier_range) / 2,  # Use average of range
                    
                    # Business estimates (basic defaults - could be enhanced with parsing)
                    "estimated_hours": 8.0,  # Default
                    "estimated_cost": 1500.0,  # Default
                    "crew_type_recommended": "experienced" if afiss_assessment.complexity.value in ['high', 'extreme'] else "standard",
                    "equipment_required": ["chainsaw", "chipper", "truck"],  # Default
                    "safety_protocols": afiss_assessment.recommendations,
                    "isa_certified_required": afiss_assessment.complexity.value in ['high', 'extreme'],
                    
                    # Alex metadata
                    "claude_model_used": "sonnet",  # Default for main assessments
                    "assessment_time_seconds": 15.0,  # Default
                    "alex_confidence_score": 85.0,  # Default confidence
                    
                    # AFISS factors for detailed storage
                    "afiss_factors": [
                        {
                            "factor_code": f"AF_{factor['domain'].upper()}_{i:03d}",
                            "factor_name": factor['description'][:100],  # Truncate for storage
                            "domain": factor['domain'],
                            "base_percentage": 2.5,  # Default base percentage
                            "triggered": True,
                            "confidence": 0.8,  # Default confidence
                            "reasoning": f"Identified in project assessment: {factor['description']}"
                        }
                        for i, factor in enumerate(afiss_assessment.identified_factors)
                    ]
                }
                
                # Sync to Convex
                project_id = await self.convex_integration.sync_project_assessment(alex_assessment)
                logger.info(f"Assessment synced to Convex backend", project_id=project_id)
                
                # Add project ID to response
                final_assessment += f"\n\n🔗 **Project ID**: {project_id} (Synced to Convex)"
                
            except Exception as e:
                logger.error("Failed to sync assessment to Convex", error=str(e))
                final_assessment += f"\n\n⚠️ **Convex Sync Failed**: {str(e)}"
        
        return final_assessment
        
    def _extract_measurements(self, description: str) -> Optional[Dict[str, float]]:
        """Extract tree measurements from description"""
        import re
        
        # Look for height, radius, DBH patterns
        height_match = re.search(r'(\d+)\s*(?:ft|feet|foot)\s*tall', description.lower())
        radius_match = re.search(r'(\d+)\s*(?:ft|feet|foot)\s*(?:canopy|radius)', description.lower()) 
        dbh_match = re.search(r'(\d+)\s*inch(?:es)?\s*(?:dbh|diameter)', description.lower())
        
        if height_match and radius_match and dbh_match:
            return {
                'height': float(height_match.group(1)),
                'canopy_radius': float(radius_match.group(1)),
                'dbh': float(dbh_match.group(1)),
                'service_type': 'removal'  # Default
            }
        return None
        
    def _parse_project_description(self, description: str) -> Dict[str, Any]:
        """Parse natural language project description"""
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
        else:
            project_data['location_type'] = 'unknown'
            
        # Utilities
        utilities = []
        if 'power line' in desc_lower or 'electrical' in desc_lower:
            utilities.append('power_lines')
        if 'gas' in desc_lower:
            utilities.append('gas_lines')
        project_data['utilities'] = utilities
        
        # Structures
        structures = []
        if 'house' in desc_lower or 'building' in desc_lower:
            structures.append('buildings')
        if 'garage' in desc_lower:
            structures.append('garage')
        project_data['nearby_structures'] = structures
        
        # Access challenges  
        access_challenges = []
        if 'driveway' in desc_lower:
            access_challenges.append('driveway_access')
        if 'narrow' in desc_lower or 'tight' in desc_lower:
            access_challenges.append('narrow_access')
        project_data['access_challenges'] = access_challenges
        
        return project_data
        
    async def _generate_final_assessment(
        self,
        project_data: Dict[str, Any],
        treescore_result: Optional[TreeScoreResult],
        afiss_assessment: AFISSAssessment
    ) -> str:
        """Generate final comprehensive assessment using Claude Sonnet"""
        
        treescore_info = ""
        if treescore_result:
            treescore_info = f"""
TREESCORE CALCULATION:
Base Points: {treescore_result.base_points:.1f}
With AFISS Bonus: {treescore_result.base_points + afiss_assessment.composite_score:.1f}
"""
        
        prompt = f"""As Alex, the TreeAI Operations Commander, provide a comprehensive project assessment:

PROJECT: {project_data.get('description')}

{treescore_info}

AFISS ASSESSMENT RESULTS:
- Composite Score: {afiss_assessment.composite_score:.1f}%
- Complexity: {afiss_assessment.complexity.value.upper()}
- Multiplier Range: {afiss_assessment.multiplier_range[0]:.2f}x - {afiss_assessment.multiplier_range[1]:.2f}x
- Access Score: {afiss_assessment.access_score:.1f}%
- Fall Zone Score: {afiss_assessment.fall_zone_score:.1f}%
- Interference Score: {afiss_assessment.interference_score:.1f}%
- Severity Score: {afiss_assessment.severity_score:.1f}%
- Site Conditions Score: {afiss_assessment.site_conditions_score:.1f}%

KEY RECOMMENDATIONS:
{chr(10).join(f'• {rec}' for rec in afiss_assessment.recommendations)}

Provide a complete operational assessment including:
1. Crew assignment recommendation (beginner 250-350 PpH, experienced 350-450 PpH, expert 450+ PpH)
2. Equipment requirements
3. Safety protocols required
4. Cost estimation with complexity multiplier
5. Timeline estimation
6. Risk mitigation strategies

Be specific and actionable. Safety is always the top priority."""

        response = await self.model_manager.generate_response(
            prompt,
            task_complexity=TaskComplexity.STANDARD,  # Use Sonnet
            project_complexity=afiss_assessment.complexity
        )
        
        return response

# Configuration and startup
async def create_alex_agent(afiss_data_path: str, convex_url: Optional[str] = None, convex_verbose: bool = False) -> AlexTreeAIAgent:
    """Create and initialize Alex agent with Anthropic Claude and optional Convex backend"""
    config = {
        'afiss_data_path': afiss_data_path,
        'learning_enabled': True,
        'max_concurrent_projects': 10,
        'convex_url': convex_url,
        'convex_verbose': convex_verbose
    }
    
    alex = AlexTreeAIAgent(config)
    await alex.initialize()
    return alex

# Example usage
if __name__ == "__main__":
    async def main():
        # Initialize Alex with Anthropic and Convex
        afiss_path = "/Users/ain/TreeAI-Agent-Kit/AFISS"
        convex_url = "https://cheerful-bee-330.convex.cloud"  # Your Convex deployment
        alex = await create_alex_agent(afiss_path, convex_url=convex_url, convex_verbose=True)
        
        # Example project assessment
        project_description = """
        Large oak tree removal in residential neighborhood. Tree is 80 feet tall, 
        30 foot canopy radius, 36 inch DBH. Located 20 feet from house, power lines 
        run directly overhead. Steep driveway access with concrete surface. 
        Customer concerned about property damage.
        """
        
        result = await alex.assess_complete_project(project_description)
        print("=== ALEX ASSESSMENT (Powered by Claude) ===")
        print(result)
        
        # Show model usage stats
        print("\n=== MODEL USAGE STATS ===")
        for model, stats in alex.model_manager.usage_stats.items():
            print(f"{model.value}: {stats['requests']} requests")
        
    # Run the example
    asyncio.run(main())