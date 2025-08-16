# TreeAI Infrastructure - Main Configuration
# Multi-region deployment with auto-scaling and disaster recovery

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket         = "treeai-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "treeai-terraform-locks"
  }
}

# Primary AWS Provider (US East)
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Project     = "TreeAI"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "TreeAI-Operations"
    }
  }
}

# Secondary AWS Provider (US West - DR)
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      Project     = "TreeAI"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "TreeAI-Operations"
      Purpose     = "DisasterRecovery"
    }
  }
}

# EU AWS Provider
provider "aws" {
  alias  = "eu"
  region = var.eu_region

  default_tags {
    tags = {
      Project     = "TreeAI"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "TreeAI-Operations"
      Region      = "Europe"
    }
  }
}

# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "aws_availability_zones" "eu" {
  provider = aws.eu
  state    = "available"
}

# Local values
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  # Seasonal scaling configuration
  seasonal_config = {
    peak = {
      min_agents = 30
      max_agents = 150
      target_cpu = 60
    }
    normal = {
      min_agents = 15
      max_agents = 60
      target_cpu = 70
    }
    low = {
      min_agents = 5
      max_agents = 20
      target_cpu = 80
    }
  }

  # Common tags
  common_tags = {
    Project      = var.project_name
    Environment  = var.environment
    ManagedBy    = "Terraform"
    Architecture = "TreeAI-Multi-Region"
  }
}

# Primary Region Infrastructure
module "primary_infrastructure" {
  source = "./modules/region"
  
  providers = {
    aws = aws.primary
  }

  # Basic Configuration
  region             = var.primary_region
  environment        = var.environment
  project_name       = var.project_name
  availability_zones = slice(data.aws_availability_zones.primary.names, 0, 3)
  
  # Network Configuration
  vpc_cidr           = var.primary_vpc_cidr
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  # EKS Configuration
  eks_cluster_version = var.eks_cluster_version
  node_groups = var.primary_node_groups
  
  # Database Configuration
  db_instance_class     = var.db_instance_class
  db_allocated_storage  = var.db_allocated_storage
  db_multi_az          = true
  enable_backup        = true
  backup_retention     = 30
  
  # Cache Configuration
  cache_node_type      = var.cache_node_type
  cache_num_cache_nodes = var.cache_num_cache_nodes
  
  # Monitoring Configuration
  enable_monitoring    = true
  enable_logging      = true
  log_retention_days  = 90
  
  # Auto-scaling Configuration
  seasonal_config = local.seasonal_config
  
  # Security Configuration
  enable_encryption   = true
  enable_waf         = true
  
  # Cost Optimization
  enable_spot_instances = true
  spot_instance_ratio  = 0.7
  
  tags = local.common_tags
}

# Secondary Region Infrastructure (DR)
module "secondary_infrastructure" {
  source = "./modules/region"
  
  providers = {
    aws = aws.secondary
  }

  # Basic Configuration
  region             = var.secondary_region
  environment        = "${var.environment}-dr"
  project_name       = var.project_name
  availability_zones = slice(data.aws_availability_zones.secondary.names, 0, 3)
  
  # Network Configuration
  vpc_cidr           = var.secondary_vpc_cidr
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  # EKS Configuration (Smaller for DR)
  eks_cluster_version = var.eks_cluster_version
  node_groups = {
    general = {
      instance_types = ["t3.medium"]
      capacity_type  = "SPOT"
      scaling_config = {
        desired_size = 2
        max_size     = 10
        min_size     = 1
      }
    }
  }
  
  # Database Configuration (Read Replica)
  db_instance_class     = "db.t3.medium"
  db_allocated_storage  = var.db_allocated_storage
  db_multi_az          = false
  enable_backup        = true
  backup_retention     = 7
  
  # Cache Configuration (Smaller)
  cache_node_type      = "cache.t3.micro"
  cache_num_cache_nodes = 1
  
  # Monitoring Configuration
  enable_monitoring    = true
  enable_logging      = true
  log_retention_days  = 30
  
  # Auto-scaling Configuration (Minimal)
  seasonal_config = {
    normal = {
      min_agents = 1
      max_agents = 10
      target_cpu = 80
    }
  }
  
  # Security Configuration
  enable_encryption   = true
  enable_waf         = false
  
  # Cost Optimization
  enable_spot_instances = true
  spot_instance_ratio  = 0.9
  
  tags = merge(local.common_tags, {
    Purpose = "DisasterRecovery"
  })
}

# EU Region Infrastructure
module "eu_infrastructure" {
  source = "./modules/region"
  
  providers = {
    aws = aws.eu
  }

  # Basic Configuration
  region             = var.eu_region
  environment        = var.environment
  project_name       = var.project_name
  availability_zones = slice(data.aws_availability_zones.eu.names, 0, 3)
  
  # Network Configuration
  vpc_cidr           = var.eu_vpc_cidr
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  # EKS Configuration
  eks_cluster_version = var.eks_cluster_version
  node_groups = var.eu_node_groups
  
  # Database Configuration
  db_instance_class     = var.db_instance_class
  db_allocated_storage  = var.db_allocated_storage
  db_multi_az          = true
  enable_backup        = true
  backup_retention     = 30
  
  # Cache Configuration
  cache_node_type      = var.cache_node_type
  cache_num_cache_nodes = var.cache_num_cache_nodes
  
  # Monitoring Configuration
  enable_monitoring    = true
  enable_logging      = true
  log_retention_days  = 90
  
  # Auto-scaling Configuration
  seasonal_config = local.seasonal_config
  
  # Security Configuration
  enable_encryption   = true
  enable_waf         = true
  
  # Cost Optimization
  enable_spot_instances = true
  spot_instance_ratio  = 0.7
  
  tags = merge(local.common_tags, {
    Region = "Europe"
    DataResidency = "EU"
  })
}

# Global Infrastructure Components
module "global_infrastructure" {
  source = "./modules/global"
  
  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
    aws.eu        = aws.eu
  }

  # Route53 Configuration
  domain_name = var.domain_name
  
  # CloudFront Configuration
  enable_cloudfront = true
  price_class      = "PriceClass_All"
  
  # WAF Configuration
  enable_waf = true
  
  # Cross-region Replication
  enable_cross_region_backup = true
  
  # Global Load Balancing
  health_check_path = "/health"
  
  # DNS Failover Configuration
  primary_region_endpoints = {
    api = module.primary_infrastructure.api_endpoint
    web = module.primary_infrastructure.web_endpoint
  }
  
  secondary_region_endpoints = {
    api = module.secondary_infrastructure.api_endpoint
    web = module.secondary_infrastructure.web_endpoint
  }
  
  eu_region_endpoints = {
    api = module.eu_infrastructure.api_endpoint
    web = module.eu_infrastructure.web_endpoint
  }
  
  tags = local.common_tags
}

# Data Pipeline Infrastructure
module "data_pipeline" {
  source = "./modules/data-pipeline"
  
  providers = {
    aws = aws.primary
  }

  # Kinesis Configuration
  kinesis_shard_count = var.kinesis_shard_count
  kinesis_retention_period = 24
  
  # Lambda Configuration
  lambda_memory_size = var.lambda_memory_size
  lambda_timeout     = var.lambda_timeout
  
  # SQS Configuration
  sqs_visibility_timeout = 300
  sqs_message_retention  = 1209600 # 14 days
  
  # S3 Configuration
  data_lake_bucket = "${local.name_prefix}-data-lake"
  enable_versioning = true
  enable_lifecycle = true
  
  # Analytics Configuration
  enable_redshift = var.enable_redshift
  redshift_cluster_type = var.redshift_cluster_type
  redshift_node_count   = var.redshift_node_count
  
  tags = local.common_tags
}

# Monitoring and Observability
module "monitoring" {
  source = "./modules/monitoring"
  
  providers = {
    aws = aws.primary
  }

  # CloudWatch Configuration
  log_retention_days = 90
  metric_namespace   = "TreeAI"
  
  # Prometheus Configuration
  enable_prometheus = true
  prometheus_storage_size = "100Gi"
  
  # Grafana Configuration
  enable_grafana = true
  grafana_admin_password = var.grafana_admin_password
  
  # Alerting Configuration
  slack_webhook_url = var.slack_webhook_url
  pagerduty_integration_key = var.pagerduty_integration_key
  
  # Cost Monitoring
  daily_cost_budget = var.daily_cost_budget
  monthly_cost_budget = var.monthly_cost_budget
  
  tags = local.common_tags
}