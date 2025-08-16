# TreeAI Regional Infrastructure Module
# This module deploys all infrastructure components for a single region

terraform {
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
}

# Local values for this region
locals {
  name_prefix = "${var.project_name}-${var.environment}-${var.region}"
  
  # Subnet configuration
  private_subnets = [
    for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, i)
  ]
  
  public_subnets = [
    for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, i + length(var.availability_zones))
  ]
  
  database_subnets = [
    for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, i + 2 * length(var.availability_zones))
  ]

  # Current seasonal configuration
  current_scaling = var.seasonal_config[var.current_season != null ? var.current_season : "normal"]
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpc"
    Type = "Main VPC"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnets[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-${var.availability_zones[count.index]}"
    Type = "Public"
    "kubernetes.io/cluster/${local.name_prefix}-eks" = "shared"
    "kubernetes.io/role/elb" = "1"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-${var.availability_zones[count.index]}"
    Type = "Private"
    "kubernetes.io/cluster/${local.name_prefix}-eks" = "owned"
    "kubernetes.io/role/internal-elb" = "1"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.database_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-database-${var.availability_zones[count.index]}"
    Type = "Database"
  })
}

# NAT Gateway
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# Security Groups
resource "aws_security_group" "eks_cluster" {
  name_prefix = "${local.name_prefix}-eks-cluster-"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-eks-cluster-sg"
  })
}

resource "aws_security_group" "eks_nodes" {
  name_prefix = "${local.name_prefix}-eks-nodes-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-eks-nodes-sg"
  })
}

resource "aws_security_group" "database" {
  name_prefix = "${local.name_prefix}-database-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-database-sg"
  })
}

resource "aws_security_group" "cache" {
  name_prefix = "${local.name_prefix}-cache-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-cache-sg"
  })
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  count = var.enable_encryption ? 1 : 0

  description             = "KMS key for ${local.name_prefix} encryption"
  deletion_window_in_days = 7

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  count = var.enable_encryption ? 1 : 0

  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main[0].key_id
}

# EKS Cluster
module "eks" {
  source = "./eks"

  cluster_name     = "${local.name_prefix}-eks"
  cluster_version  = var.eks_cluster_version
  
  vpc_id           = aws_vpc.main.id
  subnet_ids       = aws_subnet.private[*].id
  
  cluster_security_group_id = aws_security_group.eks_cluster.id
  node_security_group_id    = aws_security_group.eks_nodes.id
  
  node_groups      = var.node_groups
  
  enable_encryption = var.enable_encryption
  kms_key_arn      = var.enable_encryption ? aws_kms_key.main[0].arn : null
  
  enable_spot_instances = var.enable_spot_instances
  spot_instance_ratio   = var.spot_instance_ratio
  
  seasonal_config  = var.seasonal_config
  current_season   = var.current_season
  
  tags = var.tags
}

# RDS Aurora PostgreSQL
module "database" {
  source = "./database"

  cluster_identifier = "${local.name_prefix}-aurora"
  
  vpc_id                = aws_vpc.main.id
  db_subnet_group_name  = aws_db_subnet_group.main.name
  security_group_ids    = [aws_security_group.database.id]
  
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  multi_az            = var.db_multi_az
  
  backup_retention_period = var.backup_retention
  enable_backup          = var.enable_backup
  
  enable_encryption    = var.enable_encryption
  kms_key_id          = var.enable_encryption ? aws_kms_key.main[0].arn : null
  
  tags = var.tags
}

# ElastiCache Redis
module "cache" {
  source = "./cache"

  cluster_id = "${local.name_prefix}-redis"
  
  vpc_id             = aws_vpc.main.id
  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.cache.id]
  
  node_type          = var.cache_node_type
  num_cache_nodes    = var.cache_num_cache_nodes
  
  enable_encryption  = var.enable_encryption
  
  tags = var.tags
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "prod"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-alb"
  })
}

resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  count = var.enable_logging ? 1 : 0

  name              = "/aws/treeai/${var.environment}/application"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-app-logs"
  })
}

resource "aws_cloudwatch_log_group" "system" {
  count = var.enable_logging ? 1 : 0

  name              = "/aws/treeai/${var.environment}/system"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-system-logs"
  })
}