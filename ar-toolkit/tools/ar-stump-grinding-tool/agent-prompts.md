# AR Stump Grinding Tool Agent Prompts

## Phase 1 - Research & Business Analysis

### comprehensive-researcher
```
Research the stump grinding industry and competitive landscape. Focus on:
- Market size and growth trends for stump grinding services
- Current pricing models and cost factors in the industry
- Pain points in stump assessment and quoting processes
- Technology adoption in tree service businesses
- Customer expectations for stump grinding services
- Integration opportunities with existing tree service workflows

Reference our AlexTreeShopAi capabilities and workflow requirements.
Save findings to tools/ar-stump-grinding-tool/research/market-analysis.md
```

### business-analyst
```
Analyze business workflow integration for stump grinding AR tool. Focus on:
- Lead generation optimization from AR scans
- Pricing model development (StumpScore algorithm factors)
- Integration touchpoints with AlexTreeShopAi features
- ROI calculations for AR tool adoption
- Customer journey mapping from scan to payment
- Success metrics and KPIs for tool effectiveness

Reference the workflow analysis document in the same folder.
Save findings to tools/ar-stump-grinding-tool/documentation/business-integration.md
```

### data-analyst
```
Design analytics framework for stump grinding data intelligence. Focus on:
- Key metrics for stump characteristics (diameter, species, complexity)
- Profitability analysis by stump type and location
- Equipment utilization optimization data models
- Seasonal demand pattern analysis
- Pricing accuracy validation metrics
- Customer satisfaction correlation with scan accuracy

Create data model for business intelligence dashboard integration.
Save findings to tools/ar-stump-grinding-tool/technical-specs/analytics-framework.md
```

## Phase 2 - AI & Computer Vision

### ai-engineer
```
Design AI system for stump identification and analysis. Focus on:
- Computer vision models for stump detection and measurement
- Species identification from stump characteristics (bark, grain, color)
- Root system complexity assessment algorithms
- Obstacle and access difficulty detection
- Edge AI optimization for offline operation
- Model accuracy requirements and validation approaches

Plan for TensorFlow Lite deployment on mobile devices.
Save findings to tools/ar-stump-grinding-tool/technical-specs/ai-computer-vision.md
```

### data-scientist
```
Develop StumpScore algorithm and predictive models. Focus on:
- Stump complexity scoring factors and weightings
- Grinding time prediction based on stump characteristics
- Equipment requirement prediction models
- Pricing optimization algorithms
- Historical data analysis for accuracy improvement
- Machine learning model training requirements

Create algorithm specifications for real-time stump assessment.
Save findings to tools/ar-stump-grinding-tool/technical-specs/stump-score-algorithm.md
```

### ml-engineer
```
Plan machine learning pipeline for stump grinding intelligence. Focus on:
- Training data collection and annotation requirements
- Model deployment strategy for offline mobile use
- Continuous learning from field measurement validation
- A/B testing framework for algorithm improvements
- Model versioning and update mechanisms
- Performance monitoring and drift detection

Design MLOps workflow for production deployment.
Save findings to tools/ar-stump-grinding-tool/implementation/ml-pipeline.md
```

## Phase 3 - AR & Mobile Development

### ios-developer
```
Design iOS AR implementation for stump scanning. Focus on:
- ARKit optimization for stump detection and measurement
- LiDAR integration for enhanced accuracy
- Camera-based species identification
- Offline processing capabilities
- Battery life optimization for field use
- Integration with Core Location for GPS data

Plan SwiftUI interface for AR stump scanning workflow.
Save findings to tools/ar-stump-grinding-tool/implementation/ios-ar-implementation.md
```

### mobile-developer
```
Plan cross-platform AR stump scanning architecture. Focus on:
- React Native or Flutter AR framework selection
- Shared business logic between platforms
- Offline data synchronization strategies
- Cross-platform camera and sensor access
- Performance parity optimization
- Platform-specific AR feature handling

Design unified AR experience across iOS and Android.
Save findings to tools/ar-stump-grinding-tool/implementation/cross-platform-strategy.md
```

### ui-ux-designer
```
Design user experience for AR stump scanning workflow. Focus on:
- Intuitive AR scanning interface and visual feedback
- Workflow progression from scan to estimate
- Offline mode user experience design
- Error handling and measurement validation UX
- Professional field worker interface requirements
- Integration with existing AlexTreeShopAi UI patterns

Create wireframes for complete stump grinding workflow.
Save findings to tools/ar-stump-grinding-tool/ui-ux-design/user-experience-design.md
```

## Phase 4 - Technical Architecture

### backend-architect
```
Design backend architecture for stump grinding data management. Focus on:
- API design for stump data CRUD operations
- Integration with AlexTreeShopAi existing systems
- Offline sync mechanism architecture
- Real-time pricing calculation services
- Geospatial data handling for location-based features
- Scalability for multiple concurrent users

Plan microservices integration with existing tree service platform.
Save findings to tools/ar-stump-grinding-tool/technical-specs/backend-architecture.md
```

### database-optimizer
```
Design database schema for stump grinding operations. Focus on:
- Stump measurement and characteristic data models
- Customer and job integration with existing schemas
- Geospatial indexing for location-based queries
- Historical data storage for machine learning
- Offline data caching strategies
- Performance optimization for mobile queries

Create comprehensive data model with existing system integration.
Save findings to tools/ar-stump-grinding-tool/technical-specs/database-design.md
```

### performance-testing
```
Define performance requirements for AR stump scanning. Focus on:
- AR frame rate requirements for smooth scanning
- AI inference speed benchmarks for real-time analysis
- Battery consumption targets for 8-hour field use
- Offline storage and sync performance
- Network-independent operation requirements
- Device compatibility testing matrix

Create performance testing strategy and benchmarks.
Save findings to tools/ar-stump-grinding-tool/testing/performance-requirements.md
```

## Phase 5 - Integration & Security

### security-auditor
```
Analyze security requirements for stump grinding AR tool. Focus on:
- Camera and location permission handling
- Customer data privacy protection
- Offline data security and encryption
- Integration security with AlexTreeShopAi
- Business data protection requirements
- Compliance considerations for professional services

Design security framework for field data collection.
Save findings to tools/ar-stump-grinding-tool/documentation/security-privacy.md
```

### api-documenter
```
Create API documentation for stump grinding tool integration. Focus on:
- RESTful endpoints for stump data operations
- Integration APIs with AlexTreeShopAi workflows
- Real-time pricing calculation endpoints
- Offline sync API specifications
- Webhook integration for workflow automation
- SDK documentation for third-party integrations

Document complete API ecosystem for stump grinding workflow.
Save findings to tools/ar-stump-grinding-tool/documentation/api-documentation.md
```

## Phase 6 - Specialized Features

### architect-reviewer
```
Review overall system architecture for consistency and scalability. Focus on:
- Integration patterns with existing AlexTreeShopAi architecture
- Microservices communication design
- Data flow optimization from scan to invoice
- Scalability bottlenecks identification
- Code organization and maintainability
- Technology stack consistency validation

Provide architectural recommendations and improvements.
Save findings to tools/ar-stump-grinding-tool/technical-specs/architecture-review.md
```

### database-admin
```
Plan database operations for stump grinding production deployment. Focus on:
- Database backup and recovery strategies
- Performance monitoring and optimization
- Data migration from legacy systems
- User access control and permissions
- Maintenance procedures and automation
- Disaster recovery planning

Create operational runbook for database management.
Save findings to tools/ar-stump-grinding-tool/documentation/database-operations.md
```

## Execution Instructions

1. Run agents in the specified phase order
2. Each agent should reference the stump-grinding-workflow-analysis.md document
3. Ensure integration with AlexTreeShopAi capabilities throughout
4. Focus on offline-first, battery-optimized design
5. After all agents complete, use research-synthesizer for comprehensive roadmap