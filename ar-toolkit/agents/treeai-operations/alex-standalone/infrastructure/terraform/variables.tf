# TreeAI Infrastructure Variables

# Basic Configuration
variable "project_name" {
  description = "Name of the TreeAI project"
  type        = string
  default     = "treeai"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

# Region Configuration
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "eu_region" {
  description = "European AWS region"
  type        = string
  default     = "eu-west-1"
}

# VPC Configuration
variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "secondary_vpc_cidr" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "eu_vpc_cidr" {
  description = "CIDR block for EU VPC"
  type        = string
  default     = "10.2.0.0/16"
}

# EKS Configuration
variable "eks_cluster_version" {
  description = "Kubernetes version for EKS clusters"
  type        = string
  default     = "1.28"
}

variable "primary_node_groups" {
  description = "EKS node groups configuration for primary region"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    scaling_config = object({
      desired_size = number
      max_size     = number
      min_size     = number
    })
  }))
  default = {
    # General purpose nodes with mix of on-demand and spot
    general = {
      instance_types = ["t3.large", "t3.xlarge"]
      capacity_type  = "ON_DEMAND"
      scaling_config = {
        desired_size = 5
        max_size     = 20
        min_size     = 3
      }
    }
    # Spot instances for cost optimization
    spot = {
      instance_types = ["t3.large", "t3.xlarge", "m5.large", "m5.xlarge"]
      capacity_type  = "SPOT"
      scaling_config = {
        desired_size = 10
        max_size     = 50
        min_size     = 5
      }
    }
    # Memory optimized for data processing
    memory_optimized = {
      instance_types = ["r5.large", "r5.xlarge"]
      capacity_type  = "ON_DEMAND"
      scaling_config = {
        desired_size = 2
        max_size     = 10
        min_size     = 1
      }
    }
  }
}

variable "eu_node_groups" {
  description = "EKS node groups configuration for EU region"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    scaling_config = object({
      desired_size = number
      max_size     = number
      min_size     = number
    })
  }))
  default = {
    general = {
      instance_types = ["t3.large", "t3.xlarge"]
      capacity_type  = "ON_DEMAND"
      scaling_config = {
        desired_size = 3
        max_size     = 15
        min_size     = 2
      }
    }
    spot = {
      instance_types = ["t3.large", "t3.xlarge", "m5.large"]
      capacity_type  = "SPOT"
      scaling_config = {
        desired_size = 5
        max_size     = 25
        min_size     = 2
      }
    }
  }
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class for Aurora PostgreSQL"
  type        = string
  default     = "db.r5.xlarge"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS instances"
  type        = number
  default     = 1000
}

# Cache Configuration
variable "cache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "cache_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 3
}

# Data Pipeline Configuration
variable "kinesis_shard_count" {
  description = "Number of shards for Kinesis Data Streams"
  type        = number
  default     = 10
}

variable "lambda_memory_size" {
  description = "Memory size for Lambda functions"
  type        = number
  default     = 1024
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 300
}

# Analytics Configuration
variable "enable_redshift" {
  description = "Enable Redshift for analytics"
  type        = bool
  default     = true
}

variable "redshift_cluster_type" {
  description = "Redshift cluster node type"
  type        = string
  default     = "ra3.xlplus"
}

variable "redshift_node_count" {
  description = "Number of nodes in Redshift cluster"
  type        = number
  default     = 2
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for TreeAI services"
  type        = string
  default     = "treeai.com"
}

# Cost Management
variable "daily_cost_budget" {
  description = "Daily cost budget for alerts"
  type        = number
  default     = 1000
}

variable "monthly_cost_budget" {
  description = "Monthly cost budget for alerts"
  type        = number
  default     = 25000
}

# Monitoring Configuration
variable "grafana_admin_password" {
  description = "Admin password for Grafana"
  type        = string
  sensitive   = true
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  sensitive   = true
  default     = ""
}

variable "pagerduty_integration_key" {
  description = "PagerDuty integration key for critical alerts"
  type        = string
  sensitive   = true
  default     = ""
}

# Seasonal Configuration
variable "current_season" {
  description = "Current season for auto-scaling (peak, normal, low)"
  type        = string
  default     = "normal"
  validation {
    condition     = contains(["peak", "normal", "low"], var.current_season)
    error_message = "Season must be peak, normal, or low."
  }
}

# Feature Flags
variable "enable_spot_instances" {
  description = "Enable spot instances for cost optimization"
  type        = bool
  default     = true
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

variable "enable_encryption" {
  description = "Enable encryption at rest and in transit"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Enable AWS WAF for web application firewall"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backup"
  type        = bool
  default     = true
}

# Agent Configuration
variable "max_agents_per_region" {
  description = "Maximum number of agents per region"
  type        = number
  default     = 150
}

variable "min_agents_per_region" {
  description = "Minimum number of agents per region"
  type        = number
  default     = 5
}

# Performance Configuration
variable "target_cpu_utilization" {
  description = "Target CPU utilization for auto-scaling"
  type        = number
  default     = 70
  validation {
    condition     = var.target_cpu_utilization >= 50 && var.target_cpu_utilization <= 90
    error_message = "Target CPU utilization must be between 50 and 90."
  }
}

variable "target_memory_utilization" {
  description = "Target memory utilization for auto-scaling"
  type        = number
  default     = 80
  validation {
    condition     = var.target_memory_utilization >= 50 && var.target_memory_utilization <= 90
    error_message = "Target memory utilization must be between 50 and 90."
  }
}

# Emergency Scaling Configuration
variable "emergency_scale_enabled" {
  description = "Enable emergency scaling for disaster events"
  type        = bool
  default     = true
}

variable "emergency_max_agents" {
  description = "Maximum agents during emergency scaling"
  type        = number
  default     = 500
}

# Data Retention Configuration
variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 90
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

variable "archive_retention_years" {
  description = "Archive retention period in years"
  type        = number
  default     = 7
}