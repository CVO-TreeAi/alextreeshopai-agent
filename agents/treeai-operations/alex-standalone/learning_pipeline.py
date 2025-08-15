#!/usr/bin/env python3
"""
Alex Learning Pipeline for AFISS Factor Calibration
Continuous learning system that improves Alex's assessment accuracy over time
"""

import asyncio
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import structlog
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

from convex_client import AlexConvexIntegration

logger = structlog.get_logger()

@dataclass
class LearningMetrics:
    """Metrics tracking Alex's learning performance"""
    cycle_number: int
    projects_analyzed: int
    hours_prediction_mae: float  # Mean Absolute Error for hours
    cost_prediction_mae: float   # Mean Absolute Error for cost
    afiss_accuracy_rate: float   # Percentage of AFISS factors correctly applied
    complexity_accuracy_rate: float  # Percentage of complexity levels correctly assessed
    model_improvement_score: float   # Overall improvement score (0-100)
    factors_weight_adjusted: int     # Number of factors that had weight adjustments
    
@dataclass
class FactorCalibration:
    """Calibration data for individual AFISS factors"""
    factor_code: str
    original_weight: float
    current_weight: float
    usage_count: int
    accuracy_rate: float
    average_impact: float
    recommended_adjustment: float
    confidence_score: float

class AFISSLearningEngine:
    """Core learning engine for AFISS factor calibration"""
    
    def __init__(self, convex_integration: AlexConvexIntegration):
        self.convex = convex_integration
        self.learning_threshold = 10  # Minimum projects before making adjustments
        self.adjustment_damping = 0.1  # Conservative adjustment factor
        self.confidence_threshold = 0.7  # Minimum confidence for factor adjustments
        
    async def analyze_prediction_accuracy(self, lookback_days: int = 30) -> Dict[str, float]:
        """Analyze Alex's prediction accuracy over recent projects"""
        logger.info("Analyzing prediction accuracy", lookback_days=lookback_days)
        
        try:
            # Get completed projects from the lookback period
            end_date = int(datetime.now().timestamp() * 1000)
            start_date = int((datetime.now() - timedelta(days=lookback_days)).timestamp() * 1000)
            
            # Get projects data (would need to implement this in Convex)
            # For now, simulate with sample data
            projects = await self._get_completed_projects(start_date, end_date)
            
            if not projects:
                logger.warning("No completed projects found for analysis")
                return {'hours_mae': 0.0, 'cost_mae': 0.0, 'count': 0}
            
            # Calculate prediction errors
            hours_errors = []
            cost_errors = []
            
            for project in projects:
                estimated_hours = project.get('estimated_hours', 0)
                actual_hours = project.get('actual_hours', 0)
                estimated_cost = project.get('estimated_cost', 0)
                actual_cost = project.get('actual_cost', 0)
                
                if estimated_hours > 0 and actual_hours > 0:
                    hours_error = abs(actual_hours - estimated_hours)
                    hours_errors.append(hours_error)
                
                if estimated_cost > 0 and actual_cost > 0:
                    cost_error = abs(actual_cost - estimated_cost)
                    cost_errors.append(cost_error)
            
            accuracy_metrics = {
                'hours_mae': np.mean(hours_errors) if hours_errors else 0.0,
                'cost_mae': np.mean(cost_errors) if cost_errors else 0.0,
                'hours_variance': np.var(hours_errors) if hours_errors else 0.0,
                'cost_variance': np.var(cost_errors) if cost_errors else 0.0,
                'projects_analyzed': len(projects),
                'hours_samples': len(hours_errors),
                'cost_samples': len(cost_errors)
            }
            
            logger.info("Prediction accuracy analysis complete", **accuracy_metrics)
            return accuracy_metrics
            
        except Exception as e:
            logger.error("Failed to analyze prediction accuracy", error=str(e))
            return {'hours_mae': 0.0, 'cost_mae': 0.0, 'count': 0}
    
    async def _get_completed_projects(self, start_date: int, end_date: int) -> List[Dict[str, Any]]:
        """Get completed projects within date range"""
        # This would use Convex to get actual project data
        # For now, return sample data for testing
        
        sample_projects = [
            {
                'project_id': 'proj_001',
                'estimated_hours': 8.0,
                'actual_hours': 9.5,
                'estimated_cost': 1500.0,
                'actual_cost': 1650.0,
                'afiss_composite_score': 35.2,
                'complexity_level': 'moderate',
                'actual_complexity': 'moderate'  # Would be assessed post-completion
            },
            {
                'project_id': 'proj_002',
                'estimated_hours': 12.0,
                'actual_hours': 10.5,
                'estimated_cost': 2200.0,
                'actual_cost': 2100.0,
                'afiss_composite_score': 58.7,
                'complexity_level': 'high',
                'actual_complexity': 'high'
            },
            {
                'project_id': 'proj_003',
                'estimated_hours': 6.0,
                'actual_hours': 8.0,
                'estimated_cost': 1200.0,
                'actual_cost': 1400.0,
                'afiss_composite_score': 22.1,
                'complexity_level': 'low',
                'actual_complexity': 'moderate'  # Complexity was underestimated
            }
        ]
        
        logger.info("Retrieved sample project data", count=len(sample_projects))
        return sample_projects
    
    async def calibrate_afiss_factors(self) -> List[FactorCalibration]:
        """Calibrate AFISS factors based on historical performance"""
        logger.info("Starting AFISS factor calibration")
        
        try:
            # Get factor performance analytics
            analytics = await self.convex.client.get_factor_performance_analytics()
            
            if not analytics:
                logger.warning("No factor performance data available for calibration")
                return []
            
            calibrations = []
            
            # Analyze each factor's performance
            most_used_factors = analytics.get('most_used_factors', [])
            
            for factor_usage in most_used_factors:
                factor_code = factor_usage.get('factor_code')
                usage_count = factor_usage.get('usage_count', 0)
                
                if usage_count < self.learning_threshold:
                    continue  # Not enough data for calibration
                
                # Get detailed factor history
                factor_history = await self.convex.client.get_historical_factor_usage(
                    factor_code=factor_code
                )
                
                calibration = await self._calculate_factor_calibration(
                    factor_code, 
                    factor_history
                )
                
                if calibration and calibration.confidence_score >= self.confidence_threshold:
                    calibrations.append(calibration)
            
            logger.info("Factor calibration completed", calibrations=len(calibrations))
            return calibrations
            
        except Exception as e:
            logger.error("Factor calibration failed", error=str(e))
            return []
    
    async def _calculate_factor_calibration(self, factor_code: str, factor_history: Dict[str, Any]) -> Optional[FactorCalibration]:
        """Calculate calibration adjustments for a specific factor"""
        
        factors_data = factor_history.get('factors', [])
        if not factors_data:
            return None
        
        # Analyze factor performance
        usage_count = factor_history.get('total_usage', 0)
        accuracy_rate = factor_history.get('accuracy_rate', 0.5)
        average_confidence = factor_history.get('average_confidence', 0.5)
        
        # Get current weight (would be from factor definitions)
        current_weight = 5.0  # Default base percentage
        
        # Calculate recommended adjustment based on accuracy
        if accuracy_rate > 0.8:
            # Factor is performing well, slight increase
            adjustment = current_weight * 0.05
        elif accuracy_rate < 0.4:
            # Factor is performing poorly, decrease
            adjustment = -current_weight * 0.1
        else:
            # Factor is average, minimal adjustment
            adjustment = 0.0
        
        # Apply damping to prevent large swings
        adjustment *= self.adjustment_damping
        
        # Calculate confidence in this calibration
        confidence = min(
            usage_count / 50,  # More usage = higher confidence
            accuracy_rate,     # Higher accuracy = higher confidence  
            average_confidence # Higher avg confidence = higher confidence
        )
        
        calibration = FactorCalibration(
            factor_code=factor_code,
            original_weight=current_weight,
            current_weight=current_weight + adjustment,
            usage_count=usage_count,
            accuracy_rate=accuracy_rate,
            average_impact=current_weight + adjustment,
            recommended_adjustment=adjustment,
            confidence_score=confidence
        )
        
        logger.debug("Factor calibration calculated", 
                    factor_code=factor_code,
                    adjustment=adjustment,
                    confidence=confidence)
        
        return calibration
    
    async def apply_factor_calibrations(self, calibrations: List[FactorCalibration]) -> bool:
        """Apply factor weight calibrations to the system"""
        logger.info("Applying factor calibrations", count=len(calibrations))
        
        try:
            # Prepare weight adjustments for Convex
            weight_adjustments = []
            
            for calibration in calibrations:
                if abs(calibration.recommended_adjustment) > 0.01:  # Only apply meaningful changes
                    weight_adjustments.append({
                        'factor_code': calibration.factor_code,
                        'new_weight': calibration.current_weight,
                        'adjustment_reason': f"Learning calibration: {calibration.recommended_adjustment:+.3f} based on {calibration.usage_count} uses, {calibration.accuracy_rate:.1%} accuracy"
                    })
            
            if not weight_adjustments:
                logger.info("No significant weight adjustments needed")
                return True
            
            # Apply adjustments via Convex
            updated_ids = await self.convex.client.update_factor_weights(weight_adjustments)
            
            logger.info("Factor calibrations applied", 
                       adjustments=len(weight_adjustments),
                       updated=len(updated_ids))
            
            return len(updated_ids) > 0
            
        except Exception as e:
            logger.error("Failed to apply factor calibrations", error=str(e))
            return False

class ModelPerformanceTracker:
    """Tracks Claude model performance and optimization"""
    
    def __init__(self, convex_integration: AlexConvexIntegration):
        self.convex = convex_integration
        
    async def analyze_model_performance(self) -> Dict[str, Any]:
        """Analyze performance of different Claude models"""
        logger.info("Analyzing Claude model performance")
        
        try:
            # Get learning data grouped by model
            # This would query Convex for actual data
            model_performance = {
                'claude-3-haiku-20240307': {
                    'requests': 45,
                    'avg_response_time': 2.3,
                    'avg_accuracy': 0.82,
                    'total_tokens': 12500,
                    'cost_efficiency': 0.95
                },
                'claude-3-5-sonnet-20241022': {
                    'requests': 78,
                    'avg_response_time': 4.1,
                    'avg_accuracy': 0.91,
                    'total_tokens': 45200,
                    'cost_efficiency': 0.87
                },
                'claude-3-opus-20240229': {
                    'requests': 12,
                    'avg_response_time': 8.7,
                    'avg_accuracy': 0.96,
                    'total_tokens': 18900,
                    'cost_efficiency': 0.78
                }
            }
            
            # Calculate optimization recommendations
            recommendations = self._generate_model_recommendations(model_performance)
            
            analysis = {
                'model_performance': model_performance,
                'recommendations': recommendations,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
            logger.info("Model performance analysis completed")
            return analysis
            
        except Exception as e:
            logger.error("Model performance analysis failed", error=str(e))
            return {}
    
    def _generate_model_recommendations(self, performance_data: Dict[str, Any]) -> List[str]:
        """Generate recommendations for model usage optimization"""
        recommendations = []
        
        # Analyze each model's performance
        for model, metrics in performance_data.items():
            accuracy = metrics.get('avg_accuracy', 0)
            response_time = metrics.get('avg_response_time', 0)
            cost_efficiency = metrics.get('cost_efficiency', 0)
            
            if 'haiku' in model.lower():
                if accuracy > 0.85:
                    recommendations.append("Haiku performing well for fast operations, consider expanding usage")
                if response_time > 3.0:
                    recommendations.append("Haiku response time higher than expected, check task complexity")
            
            elif 'sonnet' in model.lower():
                if accuracy > 0.90:
                    recommendations.append("Sonnet delivering high accuracy, optimal for main assessments")
                if cost_efficiency < 0.85:
                    recommendations.append("Consider task routing optimization for Sonnet cost efficiency")
            
            elif 'opus' in model.lower():
                if accuracy > 0.95:
                    recommendations.append("Opus showing excellent performance for complex analysis")
                if metrics.get('requests', 0) > 20:
                    recommendations.append("High Opus usage detected, verify complex task routing is appropriate")
        
        return recommendations

class ContinuousLearningPipeline:
    """Main continuous learning pipeline orchestrator"""
    
    def __init__(self, convex_integration: AlexConvexIntegration):
        self.convex = convex_integration
        self.afiss_engine = AFISSLearningEngine(convex_integration)
        self.model_tracker = ModelPerformanceTracker(convex_integration)
        self.learning_cycle = 0
        
    async def run_learning_cycle(self) -> LearningMetrics:
        """Execute a complete learning cycle"""
        self.learning_cycle += 1
        logger.info("Starting learning cycle", cycle=self.learning_cycle)
        
        try:
            # Step 1: Analyze prediction accuracy
            accuracy_metrics = await self.afiss_engine.analyze_prediction_accuracy()
            
            # Step 2: Calibrate AFISS factors
            calibrations = await self.afiss_engine.calibrate_afiss_factors()
            
            # Step 3: Apply calibrations
            calibration_success = await self.afiss_engine.apply_factor_calibrations(calibrations)
            
            # Step 4: Analyze model performance
            model_analysis = await self.model_tracker.analyze_model_performance()
            
            # Step 5: Calculate learning metrics
            learning_metrics = LearningMetrics(
                cycle_number=self.learning_cycle,
                projects_analyzed=accuracy_metrics.get('projects_analyzed', 0),
                hours_prediction_mae=accuracy_metrics.get('hours_mae', 0.0),
                cost_prediction_mae=accuracy_metrics.get('cost_mae', 0.0),
                afiss_accuracy_rate=np.mean([c.accuracy_rate for c in calibrations]) if calibrations else 0.0,
                complexity_accuracy_rate=0.85,  # Would calculate from actual data
                model_improvement_score=self._calculate_improvement_score(accuracy_metrics, calibrations),
                factors_weight_adjusted=len([c for c in calibrations if abs(c.recommended_adjustment) > 0.01])
            )
            
            # Step 6: Log learning results
            await self._log_learning_cycle(learning_metrics, model_analysis)
            
            logger.info("Learning cycle completed", 
                       cycle=self.learning_cycle,
                       improvement_score=learning_metrics.model_improvement_score)
            
            return learning_metrics
            
        except Exception as e:
            logger.error("Learning cycle failed", cycle=self.learning_cycle, error=str(e))
            return self._get_default_metrics()
    
    def _calculate_improvement_score(self, accuracy_metrics: Dict[str, Any], calibrations: List[FactorCalibration]) -> float:
        """Calculate overall improvement score for this learning cycle"""
        
        # Base score from prediction accuracy (lower MAE = higher score)
        hours_mae = accuracy_metrics.get('hours_mae', 10.0)
        cost_mae = accuracy_metrics.get('cost_mae', 500.0)
        
        # Normalize MAE to score (lower is better)
        hours_score = max(0, 100 - (hours_mae * 10))  # 1 hour error = 10 points off
        cost_score = max(0, 100 - (cost_mae / 10))    # $100 error = 10 points off
        
        # Factor calibration contribution
        calibration_score = 50  # Baseline
        if calibrations:
            avg_accuracy = np.mean([c.accuracy_rate for c in calibrations])
            calibration_score = avg_accuracy * 100
        
        # Weighted average
        improvement_score = (
            hours_score * 0.3 + 
            cost_score * 0.3 + 
            calibration_score * 0.4
        )
        
        return min(100.0, max(0.0, improvement_score))
    
    async def _log_learning_cycle(self, metrics: LearningMetrics, model_analysis: Dict[str, Any]):
        """Log learning cycle results"""
        
        learning_log = {
            'cycle_number': metrics.cycle_number,
            'timestamp': datetime.now().isoformat(),
            'metrics': {
                'projects_analyzed': metrics.projects_analyzed,
                'hours_mae': metrics.hours_prediction_mae,
                'cost_mae': metrics.cost_prediction_mae,
                'afiss_accuracy': metrics.afiss_accuracy_rate,
                'complexity_accuracy': metrics.complexity_accuracy_rate,
                'improvement_score': metrics.model_improvement_score,
                'factors_adjusted': metrics.factors_weight_adjusted
            },
            'model_analysis': model_analysis
        }
        
        # Would store in Convex learning logs table
        logger.info("Learning cycle logged", **learning_log)
    
    def _get_default_metrics(self) -> LearningMetrics:
        """Get default metrics if learning cycle fails"""
        return LearningMetrics(
            cycle_number=self.learning_cycle,
            projects_analyzed=0,
            hours_prediction_mae=0.0,
            cost_prediction_mae=0.0,
            afiss_accuracy_rate=0.0,
            complexity_accuracy_rate=0.0,
            model_improvement_score=0.0,
            factors_weight_adjusted=0
        )

# ============================================================================
# AUTOMATED LEARNING SCHEDULER
# ============================================================================

class LearningScheduler:
    """Automated scheduler for running learning cycles"""
    
    def __init__(self, pipeline: ContinuousLearningPipeline):
        self.pipeline = pipeline
        self.is_running = False
        
    async def start_automated_learning(self, interval_hours: int = 24):
        """Start automated learning cycles"""
        logger.info("Starting automated learning scheduler", interval_hours=interval_hours)
        
        self.is_running = True
        
        while self.is_running:
            try:
                # Run learning cycle
                metrics = await self.pipeline.run_learning_cycle()
                
                # Log results
                logger.info("Automated learning cycle completed",
                           cycle=metrics.cycle_number,
                           improvement=metrics.model_improvement_score)
                
                # Wait for next cycle
                await asyncio.sleep(interval_hours * 3600)  # Convert hours to seconds
                
            except Exception as e:
                logger.error("Automated learning cycle failed", error=str(e))
                await asyncio.sleep(3600)  # Wait 1 hour before retrying
    
    def stop_automated_learning(self):
        """Stop automated learning cycles"""
        logger.info("Stopping automated learning scheduler")
        self.is_running = False

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

async def demonstrate_learning_pipeline():
    """Demonstrate the learning pipeline capabilities"""
    print("🧠 Demonstrating Alex Learning Pipeline")
    
    try:
        # Initialize Convex integration
        from convex_client import create_alex_convex_integration
        
        convex_url = "https://cheerful-bee-330.convex.cloud"
        integration = await create_alex_convex_integration(convex_url, verbose=True)
        
        # Initialize learning pipeline
        pipeline = ContinuousLearningPipeline(integration)
        
        # Run a single learning cycle
        print("\n🔄 Running Learning Cycle...")
        metrics = await pipeline.run_learning_cycle()
        
        print(f"\n📊 Learning Cycle Results:")
        print(f"   Cycle Number: {metrics.cycle_number}")
        print(f"   Projects Analyzed: {metrics.projects_analyzed}")
        print(f"   Hours Prediction MAE: {metrics.hours_prediction_mae:.2f}")
        print(f"   Cost Prediction MAE: ${metrics.cost_prediction_mae:.2f}")
        print(f"   AFISS Accuracy Rate: {metrics.afiss_accuracy_rate:.1%}")
        print(f"   Complexity Accuracy: {metrics.complexity_accuracy_rate:.1%}")
        print(f"   Improvement Score: {metrics.model_improvement_score:.1f}/100")
        print(f"   Factors Adjusted: {metrics.factors_weight_adjusted}")
        
        await integration.close()
        print("\n✅ Learning pipeline demonstration completed!")
        
    except Exception as e:
        print(f"❌ Learning pipeline demonstration failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(demonstrate_learning_pipeline())