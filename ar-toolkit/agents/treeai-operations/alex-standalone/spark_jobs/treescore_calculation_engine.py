#!/usr/bin/env python3
"""
TreeAI TreeScore Calculation Engine - Apache Spark Job
High-performance calculation engine for TreeScore with AFISS integration
Optimized for 100+ concurrent assessments with sub-second response times
"""

from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import (
    col, lit, when, coalesce, struct, array, map_from_arrays,
    udf, broadcast, cache, sum as spark_sum, avg, max as spark_max,
    explode, collect_list, first, last, count, window, from_json, to_json
)
from pyspark.sql.types import (
    StructType, StructField, StringType, FloatType, IntegerType,
    ArrayType, MapType, BooleanType, TimestampType
)
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.regression import RandomForestRegressor
from pyspark.ml.evaluation import RegressionEvaluator

import json
import logging
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import redis
import pickle

@dataclass
class SparkJobConfig:
    """Configuration for TreeScore Spark job"""
    app_name: str = "TreeAI_TreeScore_Engine"
    master: str = "yarn"  # or "local[*]" for development
    max_concurrent_assessments: int = 100
    cache_ttl_minutes: int = 60
    checkpoint_interval: int = 10
    batch_size: int = 1000
    partitions: int = 16

class TreeScoreCalculationEngine:
    """Main TreeScore calculation engine using Apache Spark"""
    
    def __init__(self, config: SparkJobConfig):
        self.config = config
        self.spark = self._initialize_spark_session()
        self.redis_client = self._initialize_redis()
        
        # Load reference data into broadcast variables for performance
        self.afiss_factors_broadcast = self._load_afiss_factors()
        self.equipment_costs_broadcast = self._load_equipment_costs()
        self.employee_rates_broadcast = self._load_employee_rates()
        
        logging.info(f"TreeScore calculation engine initialized with {config.partitions} partitions")
    
    def _initialize_spark_session(self) -> SparkSession:
        """Initialize Spark session with optimized configuration"""
        
        spark = SparkSession.builder \
            .appName(self.config.app_name) \
            .master(self.config.master) \
            .config("spark.sql.adaptive.enabled", "true") \
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
            .config("spark.sql.adaptive.skewJoin.enabled", "true") \
            .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
            .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
            .config("spark.sql.execution.arrow.maxRecordsPerBatch", "10000") \
            .config("spark.sql.streaming.checkpointLocation", "/tmp/spark-checkpoints") \
            .config("spark.default.parallelism", str(self.config.partitions * 2)) \
            .config("spark.sql.shuffle.partitions", str(self.config.partitions)) \
            .config("spark.streaming.backpressure.enabled", "true") \
            .config("spark.streaming.kafka.consumer.cache.enabled", "true") \
            .getOrCreate()
        
        spark.sparkContext.setLogLevel("WARN")
        return spark
    
    def _initialize_redis(self) -> redis.Redis:
        """Initialize Redis connection for caching"""
        return redis.Redis(
            host='treeai-redis-cluster.cache.amazonaws.com',
            port=6379,
            decode_responses=False,  # Keep binary for pickle
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True
        )
    
    def _load_afiss_factors(self):
        """Load AFISS factors into broadcast variable"""
        
        # Load from PostgreSQL
        afiss_df = self.spark.read \
            .format("jdbc") \
            .option("url", "jdbc:postgresql://treeai-postgres:5432/treeai") \
            .option("dbtable", "(SELECT factor_code, domain_name, base_percentage, multiplier_rules FROM afiss_factors WHERE version = 'latest') AS afiss") \
            .option("user", "treeai_user") \
            .option("password", "treeai_password") \
            .option("driver", "org.postgresql.Driver") \
            .load()
        
        # Convert to dictionary for broadcast
        afiss_dict = {}
        for row in afiss_df.collect():
            afiss_dict[row.factor_code] = {
                'domain': row.domain_name,
                'base_percentage': row.base_percentage,
                'multiplier_rules': json.loads(row.multiplier_rules) if row.multiplier_rules else {}
            }
        
        return self.spark.sparkContext.broadcast(afiss_dict)
    
    def _load_equipment_costs(self):
        """Load equipment cost data into broadcast variable"""
        
        equipment_df = self.spark.read \
            .format("jdbc") \
            .option("url", "jdbc:postgresql://treeai-postgres:5432/treeai") \
            .option("dbtable", "(SELECT category, cost_per_hour, depreciation_per_hour, operating_per_hour FROM equipment_costs WHERE active = true) AS equipment") \
            .option("user", "treeai_user") \
            .option("password", "treeai_password") \
            .option("driver", "org.postgresql.Driver") \
            .load()
        
        equipment_dict = {}
        for row in equipment_df.collect():
            equipment_dict[row.category] = {
                'cost_per_hour': row.cost_per_hour,
                'depreciation_per_hour': row.depreciation_per_hour,
                'operating_per_hour': row.operating_per_hour
            }
        
        return self.spark.sparkContext.broadcast(equipment_dict)
    
    def _load_employee_rates(self):
        """Load employee rate data into broadcast variable"""
        
        employee_df = self.spark.read \
            .format("jdbc") \
            .option("url", "jdbc:postgresql://treeai-postgres:5432/treeai") \
            .option("dbtable", "(SELECT position, location_state, hourly_rate, burden_multiplier, true_hourly_cost FROM employee_rates WHERE active = true) AS employees") \
            .option("user", "treeai_user") \
            .option("password", "treeai_password") \
            .option("driver", "org.postgresql.Driver") \
            .load()
        
        employee_dict = {}
        for row in employee_df.collect():
            key = f"{row.position}_{row.location_state}"
            employee_dict[key] = {
                'hourly_rate': row.hourly_rate,
                'burden_multiplier': row.burden_multiplier,
                'true_hourly_cost': row.true_hourly_cost
            }
        
        return self.spark.sparkContext.broadcast(employee_dict)
    
    def calculate_afiss_score_udf(self):
        """UDF for calculating AFISS composite score"""
        
        def calculate_afiss(project_factors: List[str], site_conditions: Dict[str, Any]) -> float:
            """Calculate AFISS composite score from project factors"""
            
            afiss_factors = self.afiss_factors_broadcast.value
            domain_weights = {
                'access': 0.20,
                'fall_zone': 0.25,
                'interference': 0.20,
                'severity': 0.30,
                'site_conditions': 0.05
            }
            
            domain_scores = {domain: 0.0 for domain in domain_weights.keys()}
            
            # Calculate domain scores
            for factor_code in project_factors:
                if factor_code in afiss_factors:
                    factor_data = afiss_factors[factor_code]
                    domain = factor_data['domain']
                    base_score = factor_data['base_percentage']
                    
                    # Apply multipliers based on site conditions
                    multiplier = 1.0
                    for condition, value in site_conditions.items():
                        if condition in factor_data['multiplier_rules']:
                            multiplier *= factor_data['multiplier_rules'][condition].get(str(value), 1.0)
                    
                    domain_scores[domain] += base_score * multiplier
            
            # Calculate weighted composite score
            composite_score = sum(
                domain_scores[domain] * domain_weights[domain]
                for domain in domain_weights.keys()
            )
            
            return min(composite_score, 100.0)  # Cap at 100%
        
        return udf(calculate_afiss, FloatType())
    
    def calculate_equipment_cost_udf(self):
        """UDF for calculating equipment costs"""
        
        def calculate_equipment_cost(equipment_list: List[str], severity_factor: float) -> float:
            """Calculate total equipment cost per hour"""
            
            equipment_costs = self.equipment_costs_broadcast.value
            total_cost = 0.0
            
            for equipment_category in equipment_list:
                if equipment_category in equipment_costs:
                    base_cost = equipment_costs[equipment_category]['cost_per_hour']
                    total_cost += base_cost * severity_factor
            
            return total_cost
        
        return udf(calculate_equipment_cost, FloatType())
    
    def calculate_crew_cost_udf(self):
        """UDF for calculating crew costs"""
        
        def calculate_crew_cost(crew_positions: List[str], location_state: str) -> float:
            """Calculate total crew cost per hour"""
            
            employee_rates = self.employee_rates_broadcast.value
            total_cost = 0.0
            
            for position in crew_positions:
                key = f"{position}_{location_state}"
                if key in employee_rates:
                    total_cost += employee_rates[key]['true_hourly_cost']
                else:
                    # Fallback to default rate
                    total_cost += 35.0 * 1.65  # Default rate with burden
            
            return total_cost
        
        return udf(calculate_crew_cost, FloatType())
    
    def calculate_treescore_udf(self):
        """UDF for TreeScore calculation using geometric progression"""
        
        def calculate_treescore(tree_characteristics: Dict[str, Any]) -> float:
            """Calculate TreeScore points based on tree characteristics"""
            
            # Base factors
            dbh = float(tree_characteristics.get('dbh_inches', 12))
            height = float(tree_characteristics.get('height_feet', 30))
            species_factor = float(tree_characteristics.get('species_factor', 1.0))
            condition_factor = float(tree_characteristics.get('condition_factor', 1.0))
            access_factor = float(tree_characteristics.get('access_factor', 1.0))
            
            # TreeScore geometric calculation
            base_score = (dbh ** 1.2) * (height ** 0.8) * 2.5
            
            # Apply multipliers
            treescore = base_score * species_factor * condition_factor * access_factor
            
            return round(treescore, 1)
        
        return udf(calculate_treescore, FloatType())
    
    def process_assessment_batch(self, assessment_df: DataFrame) -> DataFrame:
        """Process a batch of project assessments"""
        
        # Register UDFs
        afiss_udf = self.calculate_afiss_score_udf()
        equipment_udf = self.calculate_equipment_cost_udf()
        crew_udf = self.calculate_crew_cost_udf()
        treescore_udf = self.calculate_treescore_udf()
        
        # Calculate AFISS scores
        result_df = assessment_df.withColumn(
            "afiss_composite_score",
            afiss_udf(col("project_factors"), col("site_conditions"))
        )
        
        # Calculate TreeScore
        result_df = result_df.withColumn(
            "treescore_points",
            treescore_udf(col("tree_characteristics"))
        )
        
        # Calculate equipment costs
        result_df = result_df.withColumn(
            "equipment_cost_per_hour",
            equipment_udf(col("equipment_list"), col("afiss_composite_score") / 100.0)
        )
        
        # Calculate crew costs
        result_df = result_df.withColumn(
            "crew_cost_per_hour",
            crew_udf(col("crew_positions"), col("location_state"))
        )
        
        # Calculate total costs and pricing
        result_df = result_df.withColumn(
            "total_cost_per_hour",
            col("equipment_cost_per_hour") + col("crew_cost_per_hour") + lit(5.0)  # Small tools
        ).withColumn(
            "estimated_hours",
            col("treescore_points") / lit(300.0)  # 300 points per hour baseline
        ).withColumn(
            "total_project_cost",
            col("total_cost_per_hour") * col("estimated_hours")
        ).withColumn(
            "recommended_billing_rate",
            col("total_cost_per_hour") / lit(0.65)  # 35% margin
        ).withColumn(
            "total_project_revenue",
            col("recommended_billing_rate") * col("estimated_hours")
        ).withColumn(
            "project_profit",
            col("total_project_revenue") - col("total_project_cost")
        ).withColumn(
            "calculation_timestamp",
            lit(datetime.now())
        )
        
        return result_df
    
    def run_streaming_calculations(self, kafka_servers: str, input_topic: str, output_topic: str):
        """Run streaming TreeScore calculations from Kafka"""
        
        # Define input schema
        input_schema = StructType([
            StructField("project_id", StringType(), True),
            StructField("customer_id", StringType(), True),
            StructField("tree_characteristics", MapType(StringType(), StringType()), True),
            StructField("project_factors", ArrayType(StringType()), True),
            StructField("site_conditions", MapType(StringType(), StringType()), True),
            StructField("equipment_list", ArrayType(StringType()), True),
            StructField("crew_positions", ArrayType(StringType()), True),
            StructField("location_state", StringType(), True),
            StructField("timestamp", TimestampType(), True)
        ])
        
        # Read from Kafka
        kafka_df = self.spark \
            .readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", kafka_servers) \
            .option("subscribe", input_topic) \
            .option("startingOffsets", "latest") \
            .option("failOnDataLoss", "false") \
            .load()
        
        # Parse JSON messages
        parsed_df = kafka_df.select(
            col("key").cast("string").alias("project_id"),
            col("value").cast("string").alias("json_data"),
            col("timestamp").alias("kafka_timestamp")
        ).select(
            col("project_id"),
            from_json(col("json_data"), input_schema).alias("data"),
            col("kafka_timestamp")
        ).select(
            col("project_id"),
            col("data.*"),
            col("kafka_timestamp")
        )
        
        # Process calculations
        processed_df = self.process_assessment_batch(parsed_df)
        
        # Prepare output
        output_df = processed_df.select(
            col("project_id"),
            struct(
                col("treescore_points"),
                col("afiss_composite_score"),
                col("equipment_cost_per_hour"),
                col("crew_cost_per_hour"),
                col("total_cost_per_hour"),
                col("estimated_hours"),
                col("total_project_cost"),
                col("recommended_billing_rate"),
                col("total_project_revenue"),
                col("project_profit"),
                col("calculation_timestamp")
            ).alias("calculation_results")
        ).select(
            col("project_id").alias("key"),
            to_json(col("calculation_results")).alias("value")
        )
        
        # Write to Kafka
        query = output_df.writeStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", kafka_servers) \
            .option("topic", output_topic) \
            .option("checkpointLocation", "/tmp/treescore-streaming-checkpoint") \
            .outputMode("append") \
            .trigger(processingTime="5 seconds") \
            .start()
        
        return query
    
    def run_batch_calculations(self, input_path: str, output_path: str):
        """Run batch TreeScore calculations"""
        
        # Read input data
        input_df = self.spark.read.parquet(input_path)
        
        # Repartition for optimal processing
        input_df = input_df.repartition(self.config.partitions, "location_state")
        
        # Process calculations
        result_df = self.process_assessment_batch(input_df)
        
        # Cache results for multiple outputs
        result_df = result_df.cache()
        
        # Write main results
        result_df.write \
            .mode("overwrite") \
            .partitionBy("location_state", "calculation_date") \
            .parquet(f"{output_path}/calculations")
        
        # Write aggregated statistics
        stats_df = result_df.groupBy("location_state") \
            .agg(
                count("project_id").alias("total_assessments"),
                avg("treescore_points").alias("avg_treescore"),
                avg("afiss_composite_score").alias("avg_afiss_score"),
                avg("total_cost_per_hour").alias("avg_cost_per_hour"),
                avg("recommended_billing_rate").alias("avg_billing_rate"),
                spark_sum("project_profit").alias("total_profit")
            )
        
        stats_df.write \
            .mode("overwrite") \
            .parquet(f"{output_path}/statistics")
        
        # Update cache with recent calculations
        self._update_calculation_cache(result_df)
        
        logging.info(f"Processed {result_df.count()} assessments successfully")
    
    def _update_calculation_cache(self, result_df: DataFrame):
        """Update Redis cache with recent calculation results"""
        
        # Convert recent results to cache format
        recent_results = result_df.filter(
            col("calculation_timestamp") > (datetime.now() - timedelta(hours=1))
        ).collect()
        
        for row in recent_results:
            cache_key = f"treescore:calculation:{row.project_id}"
            cache_data = {
                'treescore_points': row.treescore_points,
                'afiss_composite_score': row.afiss_composite_score,
                'total_cost_per_hour': row.total_cost_per_hour,
                'recommended_billing_rate': row.recommended_billing_rate,
                'calculation_timestamp': row.calculation_timestamp.isoformat()
            }
            
            self.redis_client.setex(
                cache_key,
                timedelta(minutes=self.config.cache_ttl_minutes),
                pickle.dumps(cache_data)
            )
        
        logging.info(f"Updated cache with {len(recent_results)} recent calculations")
    
    def train_predictive_model(self, training_data_path: str, model_output_path: str):
        """Train ML model for TreeScore prediction optimization"""
        
        # Load historical data
        training_df = self.spark.read.parquet(training_data_path)
        
        # Feature engineering
        feature_cols = [
            "treescore_points", "afiss_composite_score", "equipment_cost_per_hour",
            "crew_cost_per_hour", "estimated_hours"
        ]
        
        assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")
        feature_df = assembler.transform(training_df)
        
        # Train Random Forest model
        rf = RandomForestRegressor(
            featuresCol="features",
            labelCol="actual_project_hours",  # Target variable
            numTrees=100,
            maxDepth=10,
            seed=42
        )
        
        model = rf.fit(feature_df)
        
        # Evaluate model
        predictions = model.transform(feature_df)
        evaluator = RegressionEvaluator(
            labelCol="actual_project_hours",
            predictionCol="prediction",
            metricName="rmse"
        )
        
        rmse = evaluator.evaluate(predictions)
        logging.info(f"Model RMSE: {rmse:.2f}")
        
        # Save model
        model.write().overwrite().save(model_output_path)
        
        return model, rmse
    
    def generate_performance_report(self, calculations_path: str) -> Dict[str, Any]:
        """Generate performance and accuracy report"""
        
        results_df = self.spark.read.parquet(calculations_path)
        
        # Performance metrics
        total_calculations = results_df.count()
        avg_calculation_time = results_df.agg(
            avg("calculation_duration_ms").alias("avg_time")
        ).collect()[0]["avg_time"]
        
        # Accuracy metrics (compared to actual outcomes)
        accuracy_df = results_df.filter(col("actual_hours").isNotNull())
        
        accuracy_stats = accuracy_df.agg(
            avg(abs(col("estimated_hours") - col("actual_hours")) / col("actual_hours")).alias("avg_error_rate"),
            count("project_id").alias("validated_projects")
        ).collect()[0]
        
        # Business metrics
        business_stats = results_df.agg(
            avg("project_profit").alias("avg_profit"),
            spark_sum("project_profit").alias("total_profit"),
            avg("recommended_billing_rate").alias("avg_billing_rate")
        ).collect()[0]
        
        report = {
            'performance': {
                'total_calculations': total_calculations,
                'avg_calculation_time_ms': avg_calculation_time,
                'calculations_per_second': 1000 / avg_calculation_time if avg_calculation_time else 0
            },
            'accuracy': {
                'avg_error_rate': accuracy_stats['avg_error_rate'],
                'validated_projects': accuracy_stats['validated_projects']
            },
            'business_impact': {
                'avg_profit_per_project': business_stats['avg_profit'],
                'total_profit_generated': business_stats['total_profit'],
                'avg_billing_rate': business_stats['avg_billing_rate']
            },
            'report_timestamp': datetime.now().isoformat()
        }
        
        return report
    
    def cleanup(self):
        """Cleanup Spark session and resources"""
        self.spark.stop()
        self.redis_client.close()

def main():
    """Main execution function for TreeScore calculation engine"""
    
    config = SparkJobConfig(
        app_name="TreeAI_TreeScore_Production",
        master="yarn",
        max_concurrent_assessments=100,
        partitions=16
    )
    
    engine = TreeScoreCalculationEngine(config)
    
    try:
        # Example: Process batch calculations
        engine.run_batch_calculations(
            input_path="s3a://treeai-data/assessments/pending/",
            output_path="s3a://treeai-data/calculations/results/"
        )
        
        # Generate performance report
        report = engine.generate_performance_report(
            "s3a://treeai-data/calculations/results/calculations/"
        )
        
        print("TreeScore Calculation Engine Performance Report:")
        print(f"Total calculations: {report['performance']['total_calculations']:,}")
        print(f"Avg calculation time: {report['performance']['avg_calculation_time_ms']:.2f}ms")
        print(f"Calculations per second: {report['performance']['calculations_per_second']:.1f}")
        print(f"Accuracy (avg error): {report['accuracy']['avg_error_rate']:.1%}")
        print(f"Total profit generated: ${report['business_impact']['total_profit_generated']:,.0f}")
        
    finally:
        engine.cleanup()

if __name__ == "__main__":
    main()