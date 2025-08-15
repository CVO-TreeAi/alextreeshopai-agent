#!/usr/bin/env python3
"""
Vector RAG System Integration with Convex
Implements intelligent AFISS factor retrieval and storage using vector embeddings
"""

import asyncio
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
import structlog
from sklearn.metrics.pairwise import cosine_similarity

from convex_client import AlexConvexIntegration

logger = structlog.get_logger()

class VectorRAGManager:
    """Manages vector embeddings and semantic search for AFISS factors"""
    
    def __init__(self, convex_integration: AlexConvexIntegration):
        self.convex = convex_integration
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.factor_embeddings = {}  # Cache for local embeddings
        self.embedding_dimension = 384  # Dimension for all-MiniLM-L6-v2
        
    async def initialize_vector_database(self, afiss_factors: List[Dict[str, Any]]) -> bool:
        """Initialize vector database with AFISS factor embeddings"""
        logger.info("Initializing vector database with AFISS factors", count=len(afiss_factors))
        
        try:
            # Generate embeddings for all factors
            factors_with_embeddings = []
            
            for factor in afiss_factors:
                # Create searchable text from factor details
                searchable_text = self._create_searchable_text(factor)
                
                # Generate embedding
                embedding = self.embedding_model.encode(searchable_text)
                
                # Add embedding to factor data
                factor_with_embedding = {
                    **factor,
                    "embedding": embedding.tolist()  # Convert numpy array to list for JSON storage
                }
                
                factors_with_embeddings.append(factor_with_embedding)
                
                # Cache locally for fast retrieval
                self.factor_embeddings[factor['factor_code']] = {
                    'text': searchable_text,
                    'embedding': embedding,
                    'factor_data': factor
                }
            
            # Store in Convex
            inserted_ids = await self.convex.client.initialize_afiss_factor_definitions(factors_with_embeddings)
            
            logger.info("Vector database initialized", 
                       factors_stored=len(inserted_ids),
                       embedding_dimension=self.embedding_dimension)
            
            return len(inserted_ids) > 0
            
        except Exception as e:
            logger.error("Failed to initialize vector database", error=str(e))
            return False
    
    def _create_searchable_text(self, factor: Dict[str, Any]) -> str:
        """Create comprehensive searchable text from factor data"""
        text_parts = [
            factor.get('factor_name', ''),
            factor.get('description', ''),
            factor.get('trigger_conditions', ''),
            factor.get('impact_justification', ''),
            factor.get('field_assessment_method', ''),
            factor.get('category', ''),
            factor.get('subcategory', ''),
            f"Domain: {factor.get('domain', '')}",
        ]
        
        # Filter out empty parts and join
        return ' '.join(part for part in text_parts if part.strip())
    
    async def semantic_search(self, query: str, domain: Optional[str] = None, top_k: int = 10) -> List[Dict[str, Any]]:
        """Perform semantic search for relevant AFISS factors"""
        logger.info("Performing semantic search", query=query, domain=domain, top_k=top_k)
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query)
            
            # First try Convex search (limited text search for now)
            convex_results = await self.convex.client.search_afiss_factors(
                query_text=query, 
                domain=domain, 
                limit=top_k * 2  # Get more for better filtering
            )
            
            if not convex_results:
                # Fallback to local semantic search
                return self._local_semantic_search(query_embedding, domain, top_k)
            
            # Enhanced semantic scoring using local embeddings
            scored_results = []
            
            for result in convex_results:
                factor_code = result.get('factor_code')
                
                # Calculate semantic similarity if we have local embedding
                similarity_score = 0.5  # Default score
                
                if factor_code in self.factor_embeddings:
                    factor_embedding = self.factor_embeddings[factor_code]['embedding']
                    similarity_score = cosine_similarity(
                        [query_embedding], 
                        [factor_embedding]
                    )[0][0]
                
                scored_result = {
                    **result,
                    'semantic_score': float(similarity_score),
                    'relevance_explanation': self._explain_relevance(query, result)
                }
                
                scored_results.append(scored_result)
            
            # Sort by semantic score
            scored_results.sort(key=lambda x: x['semantic_score'], reverse=True)
            
            logger.info("Semantic search completed", results=len(scored_results[:top_k]))
            return scored_results[:top_k]
            
        except Exception as e:
            logger.error("Semantic search failed", error=str(e))
            return []
    
    def _local_semantic_search(self, query_embedding: np.ndarray, domain: Optional[str], top_k: int) -> List[Dict[str, Any]]:
        """Fallback local semantic search using cached embeddings"""
        logger.info("Performing local semantic search fallback")
        
        similarities = []
        
        for factor_code, factor_data in self.factor_embeddings.items():
            # Filter by domain if specified
            if domain and factor_data['factor_data'].get('domain') != domain:
                continue
            
            # Calculate similarity
            similarity = cosine_similarity(
                [query_embedding], 
                [factor_data['embedding']]
            )[0][0]
            
            similarities.append({
                'factor_code': factor_code,
                'semantic_score': float(similarity),
                'factor_data': factor_data['factor_data'],
                'relevance_explanation': f"Local similarity: {similarity:.3f}"
            })
        
        # Sort and return top results
        similarities.sort(key=lambda x: x['semantic_score'], reverse=True)
        return similarities[:top_k]
    
    def _explain_relevance(self, query: str, factor: Dict[str, Any]) -> str:
        """Generate explanation for why a factor is relevant to the query"""
        query_words = set(query.lower().split())
        
        factor_text = self._create_searchable_text(factor).lower()
        factor_words = set(factor_text.split())
        
        # Find overlapping keywords
        overlap = query_words.intersection(factor_words)
        
        if overlap:
            return f"Matched keywords: {', '.join(list(overlap)[:3])}"
        else:
            return f"Semantic similarity to '{factor.get('factor_name', 'factor')}'"
    
    async def update_factor_usage(self, factor_code: str, was_accurate: bool, impact_observed: Optional[float] = None) -> bool:
        """Update factor usage statistics for learning"""
        try:
            # This would be used to update the factor's performance metrics
            # For now, just log the update
            logger.info("Factor usage updated", 
                       factor_code=factor_code, 
                       was_accurate=was_accurate, 
                       impact_observed=impact_observed)
            
            # Update local cache if available
            if factor_code in self.factor_embeddings:
                factor_data = self.factor_embeddings[factor_code]['factor_data']
                factor_data['last_used'] = asyncio.get_event_loop().time()
                factor_data['usage_count'] = factor_data.get('usage_count', 0) + 1
                
                if was_accurate is not None:
                    accuracy_history = factor_data.get('accuracy_history', [])
                    accuracy_history.append(was_accurate)
                    factor_data['accuracy_history'] = accuracy_history[-10:]  # Keep last 10
                    factor_data['accuracy_rate'] = sum(accuracy_history) / len(accuracy_history)
            
            return True
            
        except Exception as e:
            logger.error("Failed to update factor usage", error=str(e), factor_code=factor_code)
            return False
    
    async def intelligent_factor_recommendation(self, project_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Recommend AFISS factors based on project context using intelligent analysis"""
        logger.info("Generating intelligent factor recommendations")
        
        # Build comprehensive query from project context
        query_parts = [
            project_context.get('description', ''),
            f"location: {project_context.get('location_type', '')}",
            f"service: {project_context.get('service_type', '')}",
            f"utilities: {', '.join(project_context.get('utilities', []))}",
            f"access: {', '.join(project_context.get('access_challenges', []))}",
            f"structures: {', '.join(project_context.get('nearby_structures', []))}"
        ]
        
        comprehensive_query = ' '.join(part for part in query_parts if part.strip())
        
        # Get recommendations for each domain
        all_recommendations = []
        
        domains = ['access', 'fall_zone', 'interference', 'severity', 'site_conditions']
        
        for domain in domains:
            domain_query = f"{comprehensive_query} {domain}"
            domain_factors = await self.semantic_search(
                query=domain_query,
                domain=domain,
                top_k=15  # Get more factors per domain
            )
            
            # Filter factors with high semantic score
            relevant_factors = [
                factor for factor in domain_factors 
                if factor.get('semantic_score', 0) > 0.3  # Minimum relevance threshold
            ]
            
            all_recommendations.extend(relevant_factors)
        
        # Remove duplicates and sort by relevance
        unique_recommendations = {}
        for factor in all_recommendations:
            factor_code = factor.get('factor_code')
            if factor_code and factor_code not in unique_recommendations:
                unique_recommendations[factor_code] = factor
        
        final_recommendations = list(unique_recommendations.values())
        final_recommendations.sort(key=lambda x: x.get('semantic_score', 0), reverse=True)
        
        logger.info("Factor recommendations generated", count=len(final_recommendations))
        return final_recommendations[:25]  # Return top 25 most relevant factors

# ============================================================================
# ENHANCED AFISS KNOWLEDGE BASE WITH VECTOR RAG
# ============================================================================

class EnhancedAFISSKnowledgeBase:
    """Enhanced AFISS Knowledge Base with vector RAG capabilities"""
    
    def __init__(self, data_dir: str, convex_integration: AlexConvexIntegration):
        self.data_dir = data_dir
        self.convex = convex_integration
        self.vector_rag = VectorRAGManager(convex_integration)
        self.afiss_factors = []
        
    async def initialize(self) -> bool:
        """Initialize the enhanced knowledge base with vector RAG"""
        logger.info("Initializing Enhanced AFISS Knowledge Base with Vector RAG")
        
        try:
            # Load AFISS factors from files
            self.afiss_factors = await self._load_afiss_factors()
            
            # Initialize vector database
            success = await self.vector_rag.initialize_vector_database(self.afiss_factors)
            
            if success:
                logger.info("Enhanced AFISS Knowledge Base ready", factors=len(self.afiss_factors))
                return True
            else:
                logger.error("Failed to initialize vector database")
                return False
                
        except Exception as e:
            logger.error("Knowledge base initialization failed", error=str(e))
            return False
    
    async def _load_afiss_factors(self) -> List[Dict[str, Any]]:
        """Load AFISS factors from data files"""
        # This would load from the actual AFISS factor files
        # For now, return sample factors for testing
        
        sample_factors = [
            {
                'factor_code': 'AF_ACCESS_001',
                'factor_name': 'Steep Driveway Access',
                'domain': 'access',
                'category': 'driveway_conditions',
                'subcategory': 'slope',
                'base_percentage': 8.5,
                'description': 'Driveway has steep grade making equipment access challenging',
                'trigger_conditions': 'Driveway grade >15%, equipment stability concerns',
                'impact_justification': 'Increased setup time, safety concerns, potential equipment positioning issues',
                'field_assessment_method': 'Visual inspection, grade measurement if needed'
            },
            {
                'factor_code': 'AF_INTERFERENCE_045',
                'factor_name': 'Overhead Power Lines',
                'domain': 'interference',
                'category': 'utility_conflicts',
                'subcategory': 'electrical',
                'base_percentage': 15.2,
                'description': 'Electrical power lines present overhead in work area',
                'trigger_conditions': 'Power lines within 10 feet of tree or work area',
                'impact_justification': 'Requires specialized safety protocols, potential utility coordination',
                'field_assessment_method': 'Visual assessment, distance measurement, utility contact if needed'
            },
            {
                'factor_code': 'AF_FALL_ZONE_023',
                'factor_name': 'Residential Structure Proximity',
                'domain': 'fall_zone',
                'category': 'target_structures',
                'subcategory': 'residential',
                'base_percentage': 12.8,
                'description': 'Residential structures within potential fall zone',
                'trigger_conditions': 'Buildings within 1.5x tree height',
                'impact_justification': 'Requires precision cutting, rigging, increased care',
                'field_assessment_method': 'Distance measurement, fall zone calculation'
            }
        ]
        
        logger.info("Sample AFISS factors loaded", count=len(sample_factors))
        return sample_factors
    
    async def intelligent_project_assessment(self, project_context: Dict[str, Any]) -> Dict[str, Any]:
        """Perform intelligent project assessment using vector RAG"""
        logger.info("Performing intelligent project assessment with Vector RAG")
        
        try:
            # Get intelligent factor recommendations
            recommended_factors = await self.vector_rag.intelligent_factor_recommendation(project_context)
            
            # Calculate domain scores based on recommended factors
            domain_scores = self._calculate_domain_scores(recommended_factors)
            
            # Determine complexity and multipliers
            composite_score = sum(domain_scores.values())
            complexity_level = self._determine_complexity(composite_score)
            multiplier_range = self._get_multiplier_range(complexity_level)
            
            # Generate recommendations
            recommendations = self._generate_smart_recommendations(recommended_factors, complexity_level)
            
            assessment = {
                'composite_score': composite_score,
                'domain_scores': domain_scores,
                'complexity_level': complexity_level,
                'multiplier_range': multiplier_range,
                'identified_factors': recommended_factors,
                'recommendations': recommendations,
                'assessment_method': 'vector_rag_enhanced'
            }
            
            logger.info("Intelligent assessment completed", 
                       composite_score=composite_score, 
                       complexity=complexity_level,
                       factors_identified=len(recommended_factors))
            
            return assessment
            
        except Exception as e:
            logger.error("Intelligent assessment failed", error=str(e))
            return self._get_fallback_assessment()
    
    def _calculate_domain_scores(self, factors: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate domain scores from identified factors"""
        domain_scores = {
            'access': 0.0,
            'fall_zone': 0.0,
            'interference': 0.0,
            'severity': 0.0,
            'site_conditions': 0.0
        }
        
        for factor in factors:
            domain = factor.get('domain', 'general')
            if domain in domain_scores:
                base_percentage = factor.get('base_percentage', 0)
                semantic_score = factor.get('semantic_score', 0.5)
                
                # Weight the factor by semantic relevance
                weighted_score = base_percentage * semantic_score
                domain_scores[domain] += weighted_score
        
        # Cap domain scores at reasonable maximums
        domain_caps = {
            'access': 25.0,
            'fall_zone': 30.0,
            'interference': 25.0,
            'severity': 35.0,
            'site_conditions': 15.0
        }
        
        for domain, cap in domain_caps.items():
            domain_scores[domain] = min(domain_scores[domain], cap)
        
        return domain_scores
    
    def _determine_complexity(self, composite_score: float) -> str:
        """Determine complexity level from composite score"""
        if composite_score >= 65:
            return 'extreme'
        elif composite_score >= 45:
            return 'high'
        elif composite_score >= 25:
            return 'moderate'
        else:
            return 'low'
    
    def _get_multiplier_range(self, complexity_level: str) -> Tuple[float, float]:
        """Get complexity multiplier range"""
        multipliers = {
            'low': (1.12, 1.28),
            'moderate': (1.45, 1.85),
            'high': (2.1, 2.8),
            'extreme': (2.5, 3.5)
        }
        return multipliers.get(complexity_level, (1.0, 1.2))
    
    def _generate_smart_recommendations(self, factors: List[Dict[str, Any]], complexity_level: str) -> List[str]:
        """Generate smart recommendations based on identified factors"""
        recommendations = []
        
        # Complexity-based recommendations
        if complexity_level in ['high', 'extreme']:
            recommendations.append("ISA Certified Arborist required")
            recommendations.append("Specialized equipment recommended")
            recommendations.append("Extended safety protocols required")
        
        # Factor-specific recommendations
        domains_present = set(factor.get('domain') for factor in factors)
        
        if 'interference' in domains_present:
            recommendations.append("Utility coordination may be required")
        
        if 'fall_zone' in domains_present:
            recommendations.append("Precision rigging techniques recommended")
        
        if 'access' in domains_present:
            recommendations.append("Equipment positioning requires careful planning")
        
        return recommendations
    
    def _get_fallback_assessment(self) -> Dict[str, Any]:
        """Fallback assessment if vector RAG fails"""
        return {
            'composite_score': 25.0,
            'domain_scores': {
                'access': 5.0,
                'fall_zone': 8.0,
                'interference': 5.0,
                'severity': 5.0,
                'site_conditions': 2.0
            },
            'complexity_level': 'moderate',
            'multiplier_range': (1.45, 1.85),
            'identified_factors': [],
            'recommendations': ['Standard safety protocols apply'],
            'assessment_method': 'fallback'
        }

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

async def demonstrate_vector_rag():
    """Demonstrate Vector RAG system capabilities"""
    print("🔍 Demonstrating Vector RAG System for AFISS")
    
    try:
        # Initialize Convex integration
        from convex_client import create_alex_convex_integration
        
        convex_url = "https://cheerful-bee-330.convex.cloud"
        integration = await create_alex_convex_integration(convex_url, verbose=True)
        
        # Initialize enhanced knowledge base
        afiss_path = "/Users/ain/TreeAI-Agent-Kit/AFISS"
        enhanced_kb = EnhancedAFISSKnowledgeBase(afiss_path, integration)
        
        success = await enhanced_kb.initialize()
        if not success:
            print("❌ Failed to initialize enhanced knowledge base")
            return
        
        # Test semantic search
        print("\n🔍 Testing Semantic Search:")
        search_results = await enhanced_kb.vector_rag.semantic_search(
            "steep driveway power lines overhead", 
            top_k=5
        )
        
        for i, result in enumerate(search_results, 1):
            print(f"{i}. {result.get('factor_name', 'Unknown Factor')} (Score: {result.get('semantic_score', 0):.3f})")
            print(f"   {result.get('relevance_explanation', 'No explanation')}")
        
        # Test intelligent assessment
        print("\n🤖 Testing Intelligent Assessment:")
        test_project = {
            'description': 'Large oak removal near house with power lines',
            'location_type': 'residential',
            'service_type': 'removal',
            'utilities': ['power_lines'],
            'access_challenges': ['steep_driveway'],
            'nearby_structures': ['house']
        }
        
        assessment = await enhanced_kb.intelligent_project_assessment(test_project)
        
        print(f"Composite Score: {assessment['composite_score']:.1f}%")
        print(f"Complexity: {assessment['complexity_level'].upper()}")
        print(f"Factors Identified: {len(assessment['identified_factors'])}")
        print(f"Recommendations: {len(assessment['recommendations'])}")
        
        await integration.close()
        print("\n✅ Vector RAG demonstration completed successfully!")
        
    except Exception as e:
        print(f"❌ Demonstration failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(demonstrate_vector_rag())