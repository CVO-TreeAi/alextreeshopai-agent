# TreeAI Infrastructure Outputs

# Primary Region Outputs
output "primary_region_info" {
  description = "Primary region infrastructure information"
  value = {
    region             = var.primary_region
    vpc_id            = module.primary_infrastructure.vpc_id
    eks_cluster_name  = module.primary_infrastructure.eks_cluster_name
    eks_cluster_endpoint = module.primary_infrastructure.eks_cluster_endpoint
    database_endpoint = module.primary_infrastructure.database_endpoint
    cache_endpoint    = module.primary_infrastructure.cache_endpoint
    api_endpoint      = module.primary_infrastructure.api_endpoint
    web_endpoint      = module.primary_infrastructure.web_endpoint
  }
}

# Secondary Region Outputs (DR)
output "secondary_region_info" {
  description = "Secondary region infrastructure information"
  value = {
    region             = var.secondary_region
    vpc_id            = module.secondary_infrastructure.vpc_id
    eks_cluster_name  = module.secondary_infrastructure.eks_cluster_name
    eks_cluster_endpoint = module.secondary_infrastructure.eks_cluster_endpoint
    database_endpoint = module.secondary_infrastructure.database_endpoint
    cache_endpoint    = module.secondary_infrastructure.cache_endpoint
    api_endpoint      = module.secondary_infrastructure.api_endpoint
    web_endpoint      = module.secondary_infrastructure.web_endpoint
  }
}

# EU Region Outputs
output "eu_region_info" {
  description = "EU region infrastructure information"
  value = {
    region             = var.eu_region
    vpc_id            = module.eu_infrastructure.vpc_id
    eks_cluster_name  = module.eu_infrastructure.eks_cluster_name
    eks_cluster_endpoint = module.eu_infrastructure.eks_cluster_endpoint
    database_endpoint = module.eu_infrastructure.database_endpoint
    cache_endpoint    = module.eu_infrastructure.cache_endpoint
    api_endpoint      = module.eu_infrastructure.api_endpoint
    web_endpoint      = module.eu_infrastructure.web_endpoint
  }
}

# Global Infrastructure Outputs
output "global_infrastructure" {
  description = "Global infrastructure endpoints and configuration"
  value = {
    domain_name         = var.domain_name
    cloudfront_domain   = module.global_infrastructure.cloudfront_domain
    route53_zone_id     = module.global_infrastructure.route53_zone_id
    global_api_endpoint = module.global_infrastructure.global_api_endpoint
    global_web_endpoint = module.global_infrastructure.global_web_endpoint
    waf_web_acl_id     = module.global_infrastructure.waf_web_acl_id
  }
}

# Data Pipeline Outputs
output "data_pipeline" {
  description = "Data pipeline infrastructure information"
  value = {
    kinesis_stream_name = module.data_pipeline.kinesis_stream_name
    kinesis_stream_arn  = module.data_pipeline.kinesis_stream_arn
    data_lake_bucket    = module.data_pipeline.data_lake_bucket
    sqs_queue_url       = module.data_pipeline.sqs_queue_url
    lambda_function_names = module.data_pipeline.lambda_function_names
    redshift_cluster_endpoint = module.data_pipeline.redshift_cluster_endpoint
    redshift_cluster_id = module.data_pipeline.redshift_cluster_id
  }
}

# Monitoring Outputs
output "monitoring" {
  description = "Monitoring and observability infrastructure"
  value = {
    prometheus_endpoint = module.monitoring.prometheus_endpoint
    grafana_endpoint    = module.monitoring.grafana_endpoint
    cloudwatch_log_groups = module.monitoring.cloudwatch_log_groups
    sns_topic_arns     = module.monitoring.sns_topic_arns
    cost_budget_name   = module.monitoring.cost_budget_name
  }
}

# Connection Information
output "connection_info" {
  description = "Connection information for external systems"
  value = {
    # Kubernetes connection
    primary_kubeconfig_command = "aws eks update-kubeconfig --region ${var.primary_region} --name ${module.primary_infrastructure.eks_cluster_name}"
    eu_kubeconfig_command      = "aws eks update-kubeconfig --region ${var.eu_region} --name ${module.eu_infrastructure.eks_cluster_name}"
    
    # Database connections
    primary_db_connection_string = "postgresql://${module.primary_infrastructure.database_username}:${module.primary_infrastructure.database_password}@${module.primary_infrastructure.database_endpoint}:5432/${module.primary_infrastructure.database_name}"
    eu_db_connection_string      = "postgresql://${module.eu_infrastructure.database_username}:${module.eu_infrastructure.database_password}@${module.eu_infrastructure.database_endpoint}:5432/${module.eu_infrastructure.database_name}"
    
    # Cache connections
    primary_cache_endpoint = module.primary_infrastructure.cache_endpoint
    eu_cache_endpoint      = module.eu_infrastructure.cache_endpoint
    
    # API endpoints
    primary_api_url = "https://${module.primary_infrastructure.api_endpoint}"
    eu_api_url      = "https://${module.eu_infrastructure.api_endpoint}"
    global_api_url  = "https://${module.global_infrastructure.global_api_endpoint}"
  }
  sensitive = true
}

# Security Information
output "security_info" {
  description = "Security configuration and access information"
  value = {
    # IAM roles
    primary_node_group_role = module.primary_infrastructure.node_group_role_arn
    eu_node_group_role      = module.eu_infrastructure.node_group_role_arn
    
    # Security groups
    primary_security_groups = module.primary_infrastructure.security_group_ids
    eu_security_groups      = module.eu_infrastructure.security_group_ids
    
    # KMS keys
    primary_kms_key_id = module.primary_infrastructure.kms_key_id
    eu_kms_key_id      = module.eu_infrastructure.kms_key_id
    
    # Certificate ARNs
    ssl_certificate_arn = module.global_infrastructure.ssl_certificate_arn
  }
}

# Cost Information
output "cost_estimation" {
  description = "Cost estimation for different seasons"
  value = {
    peak_season_monthly_estimate = {
      compute      = "$18,000"
      storage      = "$8,000"
      data_transfer = "$4,000"
      total        = "$30,000"
    }
    normal_season_monthly_estimate = {
      compute      = "$12,000"
      storage      = "$6,000"
      data_transfer = "$2,500"
      total        = "$20,500"
    }
    low_season_monthly_estimate = {
      compute      = "$6,000"
      storage      = "$4,000"
      data_transfer = "$1,500"
      total        = "$11,500"
    }
    cost_optimization_features = {
      spot_instances_enabled = var.enable_spot_instances
      intelligent_tiering    = "S3 Intelligent Tiering enabled"
      auto_scaling          = "HPA and Cluster Autoscaler configured"
      lifecycle_policies    = "Automated data lifecycle management"
    }
  }
}

# Operational Information
output "operational_info" {
  description = "Operational procedures and commands"
  value = {
    # Scaling commands
    scale_up_command = "kubectl scale deployment treeai-agent --replicas=150 -n treeai"
    scale_down_command = "kubectl scale deployment treeai-agent --replicas=10 -n treeai"
    
    # Emergency procedures
    failover_to_secondary = "Update Route53 weighted routing to secondary region"
    failover_to_eu        = "Update Route53 weighted routing to EU region"
    
    # Backup procedures
    manual_backup_command = "aws rds create-db-cluster-snapshot --db-cluster-identifier ${module.primary_infrastructure.database_cluster_id} --db-cluster-snapshot-identifier manual-backup-$(date +%Y%m%d%H%M%S)"
    
    # Monitoring access
    grafana_url           = "https://${module.monitoring.grafana_endpoint}"
    prometheus_url        = "https://${module.monitoring.prometheus_endpoint}"
    cloudwatch_dashboard  = "https://console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=TreeAI-Overview"
  }
}

# Health Check Information
output "health_checks" {
  description = "Health check endpoints and status"
  value = {
    primary_health_check   = "https://${module.primary_infrastructure.api_endpoint}/health"
    secondary_health_check = "https://${module.secondary_infrastructure.api_endpoint}/health"
    eu_health_check        = "https://${module.eu_infrastructure.api_endpoint}/health"
    global_health_check    = "https://${module.global_infrastructure.global_api_endpoint}/health"
    
    # SLA targets
    availability_target    = "99.9%"
    response_time_target   = "< 200ms"
    error_rate_target      = "< 0.1%"
  }
}

# Disaster Recovery Information
output "disaster_recovery" {
  description = "Disaster recovery configuration and procedures"
  value = {
    # RTO/RPO targets
    recovery_time_objective  = "15 minutes for critical services"
    recovery_point_objective = "5 minutes for real-time data"
    
    # Backup information
    backup_frequency         = "Daily automated backups"
    backup_retention         = "${var.backup_retention_days} days"
    cross_region_replication = "Enabled to secondary regions"
    
    # DR procedures
    primary_to_secondary_failover = "Automated DNS failover configured"
    manual_failover_procedure     = "Update Route53 weighted routing policies"
    data_replication_lag          = "< 1 minute for Aurora Global Database"
    
    # Testing schedule
    dr_test_frequency = "Monthly automated DR testing"
    last_dr_test      = "Test results in CloudWatch metrics"
  }
}