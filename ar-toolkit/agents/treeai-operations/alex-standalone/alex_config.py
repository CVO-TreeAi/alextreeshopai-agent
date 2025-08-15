#!/usr/bin/env python3
"""
Alex TreeAI Agent Configuration
Centralized configuration management for Alex standalone agent
"""

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum

class Environment(Enum):
    DEVELOPMENT = "development"
    STAGING = "staging" 
    PRODUCTION = "production"

@dataclass
class AFISSConfig:
    """AFISS system configuration"""
    data_path: str
    vector_db_path: str = field(default="")
    embedding_model: str = "text-embedding-ada-002"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    similarity_threshold: float = 0.7
    max_relevant_factors: int = 50
    
    def __post_init__(self):
        if not self.vector_db_path:
            self.vector_db_path = os.path.join(self.data_path, "vector_db")

@dataclass
class LLMConfig:
    """Language model configuration"""
    model_name: str = "gpt-4-turbo-preview"
    temperature: float = 0.1
    max_tokens: int = 4000
    timeout: int = 60
    max_retries: int = 3
    api_key: Optional[str] = None
    
    def __post_init__(self):
        if not self.api_key:
            self.api_key = os.getenv("OPENAI_API_KEY")

@dataclass
class MemoryConfig:
    """Memory and conversation management"""
    memory_type: str = "buffer_window"
    max_messages: int = 10
    persist_conversations: bool = True
    conversation_db_path: str = "./conversations"

@dataclass
class CrewConfig:
    """Crew performance and management settings"""
    performance_update_interval: int = 15  # minutes
    pph_benchmarks: Dict[str, Dict[str, tuple]] = field(default_factory=lambda: {
        "tree_removal": {
            "beginner": (250, 350),
            "experienced": (350, 450),
            "expert": (450, 550)
        },
        "stump_grinding": {
            "beginner": (400, 500),
            "experienced": (500, 600), 
            "expert": (600, 800)
        },
        "trimming": {
            "beginner": (300, 400),
            "experienced": (400, 500),
            "expert": (500, 600)
        }
    })
    
    # Hourly rates by crew type
    hourly_rates: Dict[str, int] = field(default_factory=lambda: {
        "standard": 180,
        "experienced": 220,
        "expert": 280,
        "specialist": 320
    })

@dataclass
class DatabaseConfig:
    """Database connection settings"""
    # PostgreSQL for main data
    postgres_url: Optional[str] = None
    postgres_pool_size: int = 10
    
    # Redis for caching
    redis_url: Optional[str] = None
    redis_ttl: int = 3600  # 1 hour
    
    # Local SQLite fallback
    sqlite_path: str = "./alex_data.db"
    
    def __post_init__(self):
        if not self.postgres_url:
            self.postgres_url = os.getenv("DATABASE_URL")
        if not self.redis_url:
            self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

@dataclass
class ConvexConfig:
    """Convex backend integration settings"""
    enabled: bool = False
    deployment_url: Optional[str] = None
    api_key: Optional[str] = None
    sync_interval: int = 300  # 5 minutes
    
    def __post_init__(self):
        if not self.deployment_url:
            self.deployment_url = os.getenv("CONVEX_URL")
        if not self.api_key:
            self.api_key = os.getenv("CONVEX_API_KEY")
        self.enabled = bool(self.deployment_url and self.api_key)

@dataclass
class SafetyConfig:
    """Safety protocol and compliance settings"""
    osha_compliance_level: str = "strict"
    isa_certification_required: List[str] = field(default_factory=lambda: ["high", "extreme"])
    safety_factor_weight: float = 1.5  # Multiplier for safety-related AFISS factors
    emergency_contact_timeout: int = 30  # seconds
    incident_report_required: List[str] = field(default_factory=lambda: ["high", "extreme"])

@dataclass
class AlertConfig:
    """Alerting and notification settings"""
    email_alerts: bool = True
    sms_alerts: bool = False
    webhook_alerts: bool = True
    alert_thresholds: Dict[str, float] = field(default_factory=lambda: {
        "pph_variance": 20.0,  # % variance from expected
        "cost_overrun": 15.0,  # % over budget
        "timeline_delay": 10.0,  # % behind schedule
        "safety_score": 75.0   # Minimum safety score
    })

@dataclass
class AlexAgentConfig:
    """Main Alex agent configuration"""
    environment: Environment = Environment.DEVELOPMENT
    agent_name: str = "Alex"
    agent_version: str = "1.0.0"
    
    # Component configurations
    afiss: AFISSConfig = field(default_factory=lambda: AFISSConfig(data_path=""))
    llm: LLMConfig = field(default_factory=LLMConfig)
    memory: MemoryConfig = field(default_factory=MemoryConfig)
    crew: CrewConfig = field(default_factory=CrewConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    convex: ConvexConfig = field(default_factory=ConvexConfig)
    safety: SafetyConfig = field(default_factory=SafetyConfig)
    alerts: AlertConfig = field(default_factory=AlertConfig)
    
    # Agent behavior
    verbose_logging: bool = True
    enable_learning: bool = True
    max_concurrent_projects: int = 10
    auto_optimization: bool = True
    
    # Performance settings
    assessment_timeout: int = 300  # 5 minutes
    max_tool_iterations: int = 10
    
    @classmethod
    def from_env(cls, afiss_data_path: str) -> "AlexAgentConfig":
        """Create configuration from environment variables"""
        env = Environment(os.getenv("ALEX_ENVIRONMENT", "development"))
        
        config = cls(
            environment=env,
            afiss=AFISSConfig(data_path=afiss_data_path),
            verbose_logging=env == Environment.DEVELOPMENT
        )
        
        return config
    
    def validate(self) -> List[str]:
        """Validate configuration and return any errors"""
        errors = []
        
        # Check required paths
        if not os.path.exists(self.afiss.data_path):
            errors.append(f"AFISS data path does not exist: {self.afiss.data_path}")
            
        # Check API keys
        if not self.llm.api_key:
            errors.append("OpenAI API key not configured")
            
        # Check crew benchmarks
        for service, benchmarks in self.crew.pph_benchmarks.items():
            for level, (min_pph, max_pph) in benchmarks.items():
                if min_pph >= max_pph:
                    errors.append(f"Invalid PpH range for {service}/{level}: {min_pph}-{max_pph}")
                    
        return errors

# Pre-configured setups for different environments
def get_development_config(afiss_path: str) -> AlexAgentConfig:
    """Get configuration for development environment"""
    return AlexAgentConfig(
        environment=Environment.DEVELOPMENT,
        afiss=AFISSConfig(
            data_path=afiss_path,
            chunk_size=500,  # Smaller chunks for faster processing
            max_relevant_factors=25
        ),
        llm=LLMConfig(
            temperature=0.2,  # Slightly higher for development
            max_tokens=2000
        ),
        verbose_logging=True,
        enable_learning=True,
        max_concurrent_projects=3
    )

def get_production_config(afiss_path: str) -> AlexAgentConfig:
    """Get configuration for production environment"""
    return AlexAgentConfig(
        environment=Environment.PRODUCTION,
        afiss=AFISSConfig(
            data_path=afiss_path,
            chunk_size=1000,
            chunk_overlap=200,
            max_relevant_factors=50
        ),
        llm=LLMConfig(
            temperature=0.05,  # Very deterministic
            max_tokens=4000,
            timeout=120
        ),
        database=DatabaseConfig(
            postgres_pool_size=20,
            redis_ttl=7200  # 2 hours
        ),
        verbose_logging=False,
        enable_learning=True,
        max_concurrent_projects=50,
        assessment_timeout=600  # 10 minutes
    )

# Default configuration loader
def load_config(afiss_data_path: str, environment: Optional[str] = None) -> AlexAgentConfig:
    """Load configuration based on environment"""
    if not environment:
        environment = os.getenv("ALEX_ENVIRONMENT", "development")
        
    if environment == "production":
        config = get_production_config(afiss_data_path)
    else:
        config = get_development_config(afiss_data_path)
        
    # Validate configuration
    errors = config.validate()
    if errors:
        raise ValueError(f"Configuration validation failed:\n" + "\n".join(f"- {error}" for error in errors))
        
    return config