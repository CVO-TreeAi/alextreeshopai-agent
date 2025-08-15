# Alex TreeAI Operations Agent

**Autonomous Tree Service Operations Commander powered by Anthropic Claude**

Alex is a sophisticated AI agent that orchestrates complete tree service business operations from lead assessment through payment completion. Built using Anthropic's Claude models (Opus, Sonnet, Haiku) strategically for optimal performance and cost efficiency.

## 🌳 Core Capabilities

### AFISS Risk Assessment System
- **340+ Assessment Factors** across 5 domains
- **Vector database** with intelligent factor matching
- **Real-time complexity scoring** from 8-85%
- **Dynamic multipliers** (1.12x to 3.5x base cost)

### TreeScore Calculations
- **Tree Removal**: `Height × (Canopy × 2) × (DBH/12) + AFISS`
- **Stump Grinding**: `((Height + Depth) × Diameter) + AFISS`
- **Trimming**: Custom formulas with complexity factors

### Crew Optimization
- **PpH Performance Tracking**: Points per Hour by skill level
- **Crew Assignment**: Beginner (250-350), Experienced (350-450), Expert (450+)
- **Resource Allocation**: Equipment, timeline, and cost optimization

### Safety Management
- **OSHA Compliance**: 1910.269 electrical safety standards
- **ISA Certification**: Required for high-complexity projects
- **Emergency Protocols**: Automated safety escalation

## 🚀 Quick Start

### Installation

```bash
# Clone or download Alex agent
cd /Users/ain/TreeAI-Agent-Kit/agents/treeai-operations/alex-standalone

# Install dependencies
pip install -r requirements_anthropic.txt

# Set up environment
export ANTHROPIC_API_KEY="your-claude-api-key"
```

### Basic Usage

```python
import asyncio
from alex_anthropic import create_alex_agent

async def main():
    # Initialize Alex
    alex = await create_alex_agent("/path/to/AFISS/data")
    
    # Assess a project
    project = """
    80ft oak tree removal in residential area. 
    Power lines overhead, 20 feet from house.
    Steep driveway access.
    """
    
    assessment = await alex.assess_complete_project(project)
    print(assessment)

asyncio.run(main())
```

### CLI Interface

```bash
# Initialize Alex
python alex_cli.py init --afiss-path /Users/ain/TreeAI-Agent-Kit/AFISS

# Assess a project
python alex_cli.py assess "Large oak removal near power lines" --afiss-path /Users/ain/TreeAI-Agent-Kit/AFISS

# Interactive mode
python alex_cli.py interactive --afiss-path /Users/ain/TreeAI-Agent-Kit/AFISS
```

## 🧠 Claude Model Strategy

Alex uses Anthropic's Claude models strategically for optimal performance:

### **Claude Haiku** - Fast Operations
- TreeScore calculations
- Simple crew assignments  
- Routine status updates
- Quick safety checks

### **Claude Sonnet** - Main Workhorse
- AFISS assessments
- Project planning
- Crew optimization
- Cost calculations
- Most business operations

### **Claude Opus** - Complex Reasoning
- Extreme complexity projects (>58% AFISS)
- Multi-factor risk analysis
- Learning and adaptation
- High-stakes safety decisions

## 📊 AFISS Assessment Framework

### Domain Structure (340+ Factors)

| Domain | Weight | Factors | Focus |
|--------|---------|---------|-------|
| **ACCESS** | 20% | 75 | Equipment/crew access challenges |
| **FALL ZONE** | 25% | 85 | Areas where tree parts may fall |
| **INTERFERENCE** | 20% | 95 | Obstacles complicating operations |
| **SEVERITY** | 30% | 120 | Urgency and immediate risk factors |  
| **SITE CONDITIONS** | 5% | 65 | Environmental conditions |

### Complexity Scoring

- **Low (8-28%)**: Simple operations → 1.12-1.28x multiplier
- **Moderate (30-46%)**: Standard complexity → 1.45-1.85x multiplier
- **High (47-58%)**: Complex operations → 2.1-2.8x multiplier
- **Extreme (78-85%)**: Maximum complexity → 2.5-3.5x multiplier

## 🛠 Architecture

```
Alex TreeAI Agent
├── claude_model_manager.py    # Strategic model selection
├── afiss_knowledge_base.py    # Vector database for risk factors
├── alex_anthropic.py          # Main agent implementation
├── alex_config.py            # Configuration management
├── alex_cli.py               # Command-line interface
└── requirements_anthropic.txt # Dependencies
```

### Key Components

- **ClaudeModelManager**: Optimizes model selection based on task complexity
- **AFISSKnowledgeBase**: Vector database with 340+ risk factors
- **AlexTreeAIAgent**: Main orchestration agent
- **Configuration System**: Environment-aware settings management

## 💡 Example Assessments

### Simple Backyard Tree
```
Input: "Small maple tree trimming in fenced backyard"
AFISS Score: 12%
Complexity: LOW
Multiplier: 1.15x
Crew: Standard (3-person)
Timeline: 4 hours
```

### Complex Urban Removal
```
Input: "80ft oak near power lines, commercial building, crane required"
AFISS Score: 67%
Complexity: HIGH  
Multiplier: 2.4x
Crew: Expert + ISA Arborist
Timeline: 2-3 days
```

### Emergency Storm Response
```
Input: "Multiple trees down, power lines involved, road blocked"
AFISS Score: 78%
Complexity: EXTREME
Multiplier: 3.1x
Crew: Specialized emergency response
Timeline: Immediate dispatch required
```

## 🔧 Configuration

Alex supports environment-specific configurations:

```python
# Development
config = get_development_config(afiss_path)
config.llm.temperature = 0.2  # More creative
config.verbose_logging = True

# Production  
config = get_production_config(afiss_path)
config.llm.temperature = 0.05  # Very deterministic
config.max_concurrent_projects = 50
```

## 📈 Performance Monitoring

Alex tracks model usage and performance:

```python
# Model usage statistics
alex.model_manager.usage_stats
# {
#   ClaudeModel.HAIKU: {"requests": 45, "tokens": 12500},
#   ClaudeModel.SONNET: {"requests": 23, "tokens": 34200}, 
#   ClaudeModel.OPUS: {"requests": 3, "tokens": 8900}
# }
```

## 🔒 Security & Compliance

- **API Key Management**: Environment variable security
- **Data Privacy**: Local embeddings, no data sent to third parties
- **OSHA Compliance**: Built-in safety protocol enforcement  
- **Audit Trail**: Complete decision logging

## 🚧 Development

### Running Tests
```bash
pip install -e .[dev]
pytest tests/
```

### Contributing
1. Fork the repository
2. Create feature branch
3. Add comprehensive tests
4. Submit pull request

## 📞 Support

- **Documentation**: Full API docs in `/docs`
- **Issues**: Report bugs via GitHub issues
- **Community**: Join the TreeAI community forum

## 📄 License

MIT License - see LICENSE file for details.

---

**Alex TreeAI Operations Agent** - Orchestrating tree service excellence through AI-powered operational intelligence.

*Built with ❤️ for the tree service industry*