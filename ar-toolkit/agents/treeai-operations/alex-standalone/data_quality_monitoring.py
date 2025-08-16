#!/usr/bin/env python3
"""
TreeAI Data Quality Monitoring System
Comprehensive data validation and quality checks for 340+ AFISS factors and pricing intelligence
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import json
import logging
import asyncio
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
import redis
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart

class DataQualityLevel(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class DataQualityStatus(Enum):
    PASSED = "passed"
    WARNING = "warning"
    FAILED = "failed"
    ERROR = "error"

@dataclass
class DataQualityRule:
    """Data quality validation rule definition"""
    rule_id: str
    rule_name: str
    description: str
    table_name: str
    column_name: Optional[str]
    rule_type: str  # range, uniqueness, completeness, consistency, business_logic
    validation_query: str
    expected_result: Any
    tolerance: float = 0.0
    severity: DataQualityLevel = DataQualityLevel.MEDIUM
    enabled: bool = True

@dataclass
class DataQualityResult:
    """Result of a data quality check"""
    rule_id: str
    execution_timestamp: datetime
    status: DataQualityStatus
    actual_result: Any
    expected_result: Any
    variance: float
    error_message: Optional[str] = None
    affected_records: int = 0
    execution_time_ms: float = 0.0

@dataclass
class DataQualityReport:
    """Comprehensive data quality report"""
    report_id: str
    execution_timestamp: datetime
    total_rules_checked: int
    rules_passed: int
    rules_warned: int
    rules_failed: int
    rules_error: int
    overall_score: float
    critical_issues: List[DataQualityResult]
    recommendations: List[str]

class TreeAIDataQualityMonitor:
    """Main data quality monitoring system for TreeAI"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.db_engine = create_engine(config['database_url'])
        self.redis_client = redis.Redis.from_url(config['redis_url'])
        
        # Load data quality rules
        self.rules = self._load_data_quality_rules()
        
        # Email configuration for alerts
        self.smtp_config = config.get('smtp_config', {})
        
        logging.info(f"Data quality monitor initialized with {len(self.rules)} rules")
    
    def _load_data_quality_rules(self) -> List[DataQualityRule]:
        """Load data quality rules from configuration"""
        
        rules = [
            # AFISS Factor Validation Rules
            DataQualityRule(
                rule_id="AFISS_001",
                rule_name="AFISS Factor Count Validation",
                description="Verify total AFISS factor count is 340+",
                table_name="afiss_factors",
                column_name=None,
                rule_type="completeness",
                validation_query="SELECT COUNT(*) FROM afiss_factors WHERE version = 'latest' AND active = true",
                expected_result=340,
                tolerance=0.0,
                severity=DataQualityLevel.CRITICAL
            ),
            
            DataQualityRule(
                rule_id="AFISS_002",
                rule_name="AFISS Domain Weight Sum",
                description="Domain weights must sum to 1.0 (100%)",
                table_name="afiss_domain_weights",
                column_name="weight",
                rule_type="business_logic",
                validation_query="SELECT SUM(weight) FROM afiss_domain_weights WHERE active = true",
                expected_result=1.0,
                tolerance=0.001,
                severity=DataQualityLevel.CRITICAL
            ),
            
            DataQualityRule(
                rule_id="AFISS_003",
                rule_name="AFISS Factor Percentage Range",
                description="Base percentages must be between 0 and 100",
                table_name="afiss_factors",
                column_name="base_percentage",
                rule_type="range",
                validation_query="SELECT COUNT(*) FROM afiss_factors WHERE version = 'latest' AND (base_percentage < 0 OR base_percentage > 100)",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.HIGH
            ),
            
            DataQualityRule(
                rule_id="AFISS_004",
                rule_name="AFISS Factor Code Uniqueness",
                description="Factor codes must be unique within latest version",
                table_name="afiss_factors",
                column_name="factor_code",
                rule_type="uniqueness",
                validation_query="SELECT COUNT(*) FROM (SELECT factor_code, COUNT(*) FROM afiss_factors WHERE version = 'latest' GROUP BY factor_code HAVING COUNT(*) > 1) duplicates",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.CRITICAL
            ),
            
            DataQualityRule(
                rule_id="AFISS_005",
                rule_name="AFISS Domain Coverage",
                description="Each domain must have at least 5 factors",
                table_name="afiss_factors",
                column_name="domain_name",
                rule_type="business_logic",
                validation_query="SELECT COUNT(*) FROM (SELECT domain_name, COUNT(*) as factor_count FROM afiss_factors WHERE version = 'latest' GROUP BY domain_name HAVING COUNT(*) < 5) insufficient",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.HIGH
            ),
            
            # Equipment Cost Validation Rules
            DataQualityRule(
                rule_id="EQUIPMENT_001",
                rule_name="Equipment Cost Reasonableness",
                description="Equipment hourly costs should be between $10 and $500",
                table_name="equipment_costs",
                column_name="cost_per_hour",
                rule_type="range",
                validation_query="SELECT COUNT(*) FROM equipment_costs WHERE active = true AND (cost_per_hour < 10 OR cost_per_hour > 500)",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.MEDIUM
            ),
            
            DataQualityRule(
                rule_id="EQUIPMENT_002",
                rule_name="Equipment Cost Completeness",
                description="All active equipment must have cost data",
                table_name="equipment_costs",
                column_name="cost_per_hour",
                rule_type="completeness",
                validation_query="SELECT COUNT(*) FROM equipment_costs WHERE active = true AND (cost_per_hour IS NULL OR depreciation_per_hour IS NULL)",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.HIGH
            ),
            
            DataQualityRule(
                rule_id="EQUIPMENT_003",
                rule_name="Equipment Cost Consistency",
                description="Total cost should equal depreciation + operating costs",
                table_name="equipment_costs",
                column_name="cost_per_hour",
                rule_type="consistency",
                validation_query="SELECT COUNT(*) FROM equipment_costs WHERE active = true AND ABS(cost_per_hour - (depreciation_per_hour + operating_per_hour)) > 0.01",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.MEDIUM
            ),
            
            # Employee Rate Validation Rules
            DataQualityRule(
                rule_id="EMPLOYEE_001",
                rule_name="Minimum Wage Compliance",
                description="Hourly rates must meet state minimum wage requirements",
                table_name="employee_rates",
                column_name="hourly_rate",
                rule_type="business_logic",
                validation_query="""
                SELECT COUNT(*) FROM employee_rates er
                JOIN state_minimum_wages smw ON er.location_state = smw.state
                WHERE er.active = true AND er.hourly_rate < smw.minimum_wage
                """,
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.CRITICAL
            ),
            
            DataQualityRule(
                rule_id="EMPLOYEE_002",
                rule_name="Burden Multiplier Range",
                description="Burden multipliers should be between 1.25 and 2.5",
                table_name="employee_rates",
                column_name="burden_multiplier",
                rule_type="range",
                validation_query="SELECT COUNT(*) FROM employee_rates WHERE active = true AND (burden_multiplier < 1.25 OR burden_multiplier > 2.5)",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.MEDIUM
            ),
            
            DataQualityRule(
                rule_id="EMPLOYEE_003",
                rule_name="True Hourly Cost Calculation",
                description="True hourly cost should equal hourly rate * burden multiplier",
                table_name="employee_rates",
                column_name="true_hourly_cost",
                rule_type="consistency",
                validation_query="SELECT COUNT(*) FROM employee_rates WHERE active = true AND ABS(true_hourly_cost - (hourly_rate * burden_multiplier)) > 0.01",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.HIGH
            ),
            
            # Project Data Validation Rules
            DataQualityRule(
                rule_id="PROJECT_001",
                rule_name="TreeScore Reasonableness",
                description="TreeScore values should be between 50 and 50000 points",
                table_name="project_assessments",
                column_name="treescore_points",
                rule_type="range",
                validation_query="SELECT COUNT(*) FROM project_assessments WHERE treescore_points < 50 OR treescore_points > 50000",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.MEDIUM
            ),
            
            DataQualityRule(
                rule_id="PROJECT_002",
                rule_name="AFISS Score Range",
                description="AFISS composite scores should be between 0 and 100",
                table_name="project_assessments",
                column_name="afiss_composite_score",
                rule_type="range",
                validation_query="SELECT COUNT(*) FROM project_assessments WHERE afiss_composite_score < 0 OR afiss_composite_score > 100",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.HIGH
            ),
            
            DataQualityRule(
                rule_id="PROJECT_003",
                rule_name="Project Cost Reasonableness",
                description="Project costs should be positive and reasonable",
                table_name="project_assessments",
                column_name="total_project_cost",
                rule_type="range",
                validation_query="SELECT COUNT(*) FROM project_assessments WHERE total_project_cost <= 0 OR total_project_cost > 100000",
                expected_result=0,
                tolerance=0.0,
                severity=DataQualityLevel.MEDIUM
            ),
            
            # Data Freshness Rules
            DataQualityRule(
                rule_id="FRESHNESS_001",
                rule_name="Recent AFISS Updates",
                description="AFISS factors should be updated within last 30 days",
                table_name="afiss_factors",
                column_name="last_updated",
                rule_type="business_logic",
                validation_query="SELECT COUNT(*) FROM afiss_factors WHERE version = 'latest' AND last_updated < NOW() - INTERVAL '30 days'",
                expected_result=0,
                tolerance=0.05,  # Allow 5% of factors to be older
                severity=DataQualityLevel.LOW
            ),
            
            DataQualityRule(
                rule_id="FRESHNESS_002",
                rule_name="Equipment Cost Updates",
                description="Equipment costs should be updated within last 7 days",
                table_name="equipment_costs",
                column_name="last_updated",
                rule_type="business_logic",
                validation_query="SELECT COUNT(*) FROM equipment_costs WHERE active = true AND last_updated < NOW() - INTERVAL '7 days'",
                expected_result=0,
                tolerance=0.10,  # Allow 10% to be older
                severity=DataQualityLevel.MEDIUM
            )
        ]
        
        return rules
    
    async def execute_data_quality_check(self, rule: DataQualityRule) -> DataQualityResult:
        """Execute a single data quality check"""
        
        start_time = datetime.now()
        
        try:
            # Execute validation query
            with self.db_engine.connect() as conn:
                result = conn.execute(text(rule.validation_query))
                actual_result = result.scalar()
            
            # Calculate variance
            if isinstance(rule.expected_result, (int, float)) and isinstance(actual_result, (int, float)):
                if rule.expected_result != 0:
                    variance = abs(actual_result - rule.expected_result) / abs(rule.expected_result)
                else:
                    variance = abs(actual_result - rule.expected_result)
            else:
                variance = 0.0 if actual_result == rule.expected_result else 1.0
            
            # Determine status
            if variance <= rule.tolerance:
                status = DataQualityStatus.PASSED
            elif variance <= rule.tolerance * 2:
                status = DataQualityStatus.WARNING
            else:
                status = DataQualityStatus.FAILED
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return DataQualityResult(
                rule_id=rule.rule_id,
                execution_timestamp=start_time,
                status=status,
                actual_result=actual_result,
                expected_result=rule.expected_result,
                variance=variance,
                execution_time_ms=execution_time
            )
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return DataQualityResult(
                rule_id=rule.rule_id,
                execution_timestamp=start_time,
                status=DataQualityStatus.ERROR,
                actual_result=None,
                expected_result=rule.expected_result,
                variance=1.0,
                error_message=str(e),
                execution_time_ms=execution_time
            )
    
    async def run_all_quality_checks(self) -> DataQualityReport:
        """Execute all data quality checks and generate report"""
        
        report_id = f"DQ_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        start_time = datetime.now()
        
        # Execute all rules concurrently
        enabled_rules = [rule for rule in self.rules if rule.enabled]
        
        tasks = [self.execute_data_quality_check(rule) for rule in enabled_rules]
        results = await asyncio.gather(*tasks)
        
        # Analyze results
        rules_passed = sum(1 for r in results if r.status == DataQualityStatus.PASSED)
        rules_warned = sum(1 for r in results if r.status == DataQualityStatus.WARNING)
        rules_failed = sum(1 for r in results if r.status == DataQualityStatus.FAILED)
        rules_error = sum(1 for r in results if r.status == DataQualityStatus.ERROR)
        
        # Calculate overall score
        total_rules = len(results)
        score_weights = {
            DataQualityStatus.PASSED: 1.0,
            DataQualityStatus.WARNING: 0.5,
            DataQualityStatus.FAILED: 0.0,
            DataQualityStatus.ERROR: 0.0
        }
        
        overall_score = sum(score_weights[r.status] for r in results) / total_rules * 100
        
        # Identify critical issues
        critical_issues = [
            r for r in results
            if r.status in [DataQualityStatus.FAILED, DataQualityStatus.ERROR]
            and any(rule.rule_id == r.rule_id and rule.severity == DataQualityLevel.CRITICAL for rule in enabled_rules)
        ]
        
        # Generate recommendations
        recommendations = self._generate_recommendations(results, enabled_rules)
        
        report = DataQualityReport(
            report_id=report_id,
            execution_timestamp=start_time,
            total_rules_checked=total_rules,
            rules_passed=rules_passed,
            rules_warned=rules_warned,
            rules_failed=rules_failed,
            rules_error=rules_error,
            overall_score=overall_score,
            critical_issues=critical_issues,
            recommendations=recommendations
        )
        
        # Store report
        await self._store_quality_report(report, results)
        
        # Send alerts if needed
        if critical_issues or overall_score < 85:
            await self._send_quality_alerts(report)
        
        return report
    
    def _generate_recommendations(self, results: List[DataQualityResult], rules: List[DataQualityRule]) -> List[str]:
        """Generate actionable recommendations based on quality check results"""
        
        recommendations = []
        
        # Check for AFISS factor issues
        afiss_issues = [r for r in results if r.rule_id.startswith('AFISS') and r.status != DataQualityStatus.PASSED]
        if afiss_issues:
            recommendations.append("Review AFISS factor configuration and update encyclopedia if needed")
            recommendations.append("Validate AFISS domain weights and factor distributions")
        
        # Check for equipment cost issues
        equipment_issues = [r for r in results if r.rule_id.startswith('EQUIPMENT') and r.status != DataQualityStatus.PASSED]
        if equipment_issues:
            recommendations.append("Update equipment cost data from market sources")
            recommendations.append("Review USACE cost methodology implementation")
        
        # Check for employee rate issues
        employee_issues = [r for r in results if r.rule_id.startswith('EMPLOYEE') and r.status != DataQualityStatus.PASSED]
        if employee_issues:
            recommendations.append("Verify state minimum wage compliance")
            recommendations.append("Update burden factor calculations based on latest tax rates")
        
        # Check for data freshness issues
        freshness_issues = [r for r in results if r.rule_id.startswith('FRESHNESS') and r.status != DataQualityStatus.PASSED]
        if freshness_issues:
            recommendations.append("Increase frequency of data updates from external sources")
            recommendations.append("Implement automated data refresh schedules")
        
        # Check overall failure rate
        failure_rate = len([r for r in results if r.status == DataQualityStatus.FAILED]) / len(results)
        if failure_rate > 0.10:
            recommendations.append("Conduct comprehensive data audit and cleanup")
            recommendations.append("Review ETL pipeline configuration and error handling")
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    async def _store_quality_report(self, report: DataQualityReport, results: List[DataQualityResult]):
        """Store quality report and results in database"""
        
        # Store main report
        report_data = asdict(report)
        report_data['critical_issues'] = [asdict(issue) for issue in report.critical_issues]
        
        with self.db_engine.connect() as conn:
            # Insert report
            conn.execute(text("""
                INSERT INTO data_quality_reports 
                (report_id, execution_timestamp, total_rules_checked, rules_passed, rules_warned, 
                 rules_failed, rules_error, overall_score, recommendations)
                VALUES (:report_id, :execution_timestamp, :total_rules_checked, :rules_passed, 
                        :rules_warned, :rules_failed, :rules_error, :overall_score, :recommendations)
            """), {
                'report_id': report.report_id,
                'execution_timestamp': report.execution_timestamp,
                'total_rules_checked': report.total_rules_checked,
                'rules_passed': report.rules_passed,
                'rules_warned': report.rules_warned,
                'rules_failed': report.rules_failed,
                'rules_error': report.rules_error,
                'overall_score': report.overall_score,
                'recommendations': json.dumps(report.recommendations)
            })
            
            # Insert detailed results
            for result in results:
                conn.execute(text("""
                    INSERT INTO data_quality_results
                    (report_id, rule_id, execution_timestamp, status, actual_result, 
                     expected_result, variance, error_message, execution_time_ms)
                    VALUES (:report_id, :rule_id, :execution_timestamp, :status, :actual_result,
                            :expected_result, :variance, :error_message, :execution_time_ms)
                """), {
                    'report_id': report.report_id,
                    'rule_id': result.rule_id,
                    'execution_timestamp': result.execution_timestamp,
                    'status': result.status.value,
                    'actual_result': str(result.actual_result),
                    'expected_result': str(result.expected_result),
                    'variance': result.variance,
                    'error_message': result.error_message,
                    'execution_time_ms': result.execution_time_ms
                })
            
            conn.commit()
        
        # Cache report in Redis
        self.redis_client.setex(
            f"dq:report:{report.report_id}",
            timedelta(days=7),
            json.dumps(report_data, default=str)
        )
    
    async def _send_quality_alerts(self, report: DataQualityReport):
        """Send email alerts for critical data quality issues"""
        
        if not self.smtp_config:
            logging.warning("SMTP configuration not provided, skipping email alerts")
            return
        
        # Prepare email content
        subject = f"TreeAI Data Quality Alert - Score: {report.overall_score:.1f}%"
        
        html_content = f"""
        <html>
        <body>
            <h2>TreeAI Data Quality Report</h2>
            <p><strong>Report ID:</strong> {report.report_id}</p>
            <p><strong>Execution Time:</strong> {report.execution_timestamp}</p>
            <p><strong>Overall Score:</strong> {report.overall_score:.1f}%</p>
            
            <h3>Summary</h3>
            <ul>
                <li>Total Rules Checked: {report.total_rules_checked}</li>
                <li>Rules Passed: {report.rules_passed}</li>
                <li>Rules with Warnings: {report.rules_warned}</li>
                <li>Rules Failed: {report.rules_failed}</li>
                <li>Rules with Errors: {report.rules_error}</li>
            </ul>
            
            <h3>Critical Issues</h3>
            <ul>
        """
        
        for issue in report.critical_issues:
            html_content += f"<li><strong>{issue.rule_id}:</strong> {issue.error_message or 'Validation failed'}</li>"
        
        html_content += f"""
            </ul>
            
            <h3>Recommendations</h3>
            <ul>
        """
        
        for rec in report.recommendations:
            html_content += f"<li>{rec}</li>"
        
        html_content += """
            </ul>
            
            <p>Please address these issues promptly to maintain data quality standards.</p>
        </body>
        </html>
        """
        
        # Send email
        try:
            msg = MimeMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.smtp_config['from_email']
            msg['To'] = ', '.join(self.smtp_config['alert_recipients'])
            
            msg.attach(MimeText(html_content, 'html'))
            
            with smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port']) as server:
                if self.smtp_config.get('use_tls'):
                    server.starttls()
                if self.smtp_config.get('username'):
                    server.login(self.smtp_config['username'], self.smtp_config['password'])
                
                server.send_message(msg)
            
            logging.info(f"Data quality alert sent for report {report.report_id}")
            
        except Exception as e:
            logging.error(f"Failed to send data quality alert: {str(e)}")
    
    def get_quality_trends(self, days: int = 30) -> Dict[str, Any]:
        """Get data quality trends over specified time period"""
        
        with self.db_engine.connect() as conn:
            trends_query = text("""
                SELECT 
                    DATE(execution_timestamp) as report_date,
                    AVG(overall_score) as avg_score,
                    COUNT(*) as total_reports,
                    AVG(rules_failed) as avg_failures
                FROM data_quality_reports
                WHERE execution_timestamp >= NOW() - INTERVAL :days DAY
                GROUP BY DATE(execution_timestamp)
                ORDER BY report_date DESC
            """)
            
            trends_result = conn.execute(trends_query, {'days': days})
            trends_data = [dict(row) for row in trends_result]
        
        # Calculate trend metrics
        if len(trends_data) >= 2:
            recent_score = trends_data[0]['avg_score']
            previous_score = trends_data[1]['avg_score']
            score_trend = recent_score - previous_score
        else:
            score_trend = 0.0
        
        return {
            'trend_data': trends_data,
            'score_trend': score_trend,
            'avg_score_period': np.mean([d['avg_score'] for d in trends_data]) if trends_data else 0,
            'days_analyzed': days
        }

async def main():
    """Demonstrate data quality monitoring system"""
    
    config = {
        'database_url': 'postgresql://treeai_user:password@localhost:5432/treeai',
        'redis_url': 'redis://localhost:6379/0',
        'smtp_config': {
            'host': 'smtp.gmail.com',
            'port': 587,
            'use_tls': True,
            'username': 'alerts@treeai.com',
            'password': 'app_password',
            'from_email': 'alerts@treeai.com',
            'alert_recipients': ['data-engineering@treeai.com', 'ops@treeai.com']
        }
    }
    
    monitor = TreeAIDataQualityMonitor(config)
    
    print("TreeAI Data Quality Monitoring System")
    print("=" * 50)
    
    # Run comprehensive quality checks
    report = await monitor.run_all_quality_checks()
    
    print(f"Report ID: {report.report_id}")
    print(f"Execution Time: {report.execution_timestamp}")
    print(f"Overall Score: {report.overall_score:.1f}%")
    print()
    print(f"Rules Summary:")
    print(f"  Passed: {report.rules_passed}")
    print(f"  Warnings: {report.rules_warned}")
    print(f"  Failed: {report.rules_failed}")
    print(f"  Errors: {report.rules_error}")
    
    if report.critical_issues:
        print(f"\nCritical Issues ({len(report.critical_issues)}):")
        for issue in report.critical_issues:
            print(f"  • {issue.rule_id}: {issue.error_message or 'Validation failed'}")
    
    print(f"\nRecommendations:")
    for i, rec in enumerate(report.recommendations, 1):
        print(f"  {i}. {rec}")
    
    # Get quality trends
    trends = monitor.get_quality_trends(30)
    print(f"\n30-Day Quality Trends:")
    print(f"  Average Score: {trends['avg_score_period']:.1f}%")
    print(f"  Score Trend: {trends['score_trend']:+.1f} points")
    print(f"  Reports Analyzed: {len(trends['trend_data'])}")

if __name__ == "__main__":
    asyncio.run(main())