# AR Measurement Tool Agent Prompts

## Phase 1 - Research & Analysis

### comprehensive-researcher
```
Research and document market analysis for AR tree measurement tools similar to Arboreal (https://arboreal.se/en/tree-height). Focus on:
- Competitor analysis of existing AR measurement apps
- Industry needs and pain points for forestry/arborist professionals
- Market opportunities and differentiation strategies
- User feedback and reviews from existing solutions

Save findings to tools/ar-measurement-tool/research/market-analysis.md
```

### technical-researcher
```
Research and document technical implementation patterns for AR measurement tools. Focus on:
- ARKit and ARCore capabilities for distance/height measurement
- Triangulation algorithms used in AR measurement
- Camera calibration and accuracy optimization techniques
- Platform-specific AR features (LiDAR on iOS, ToF sensors)
- Code examples and implementation patterns from open source projects

Save findings to tools/ar-measurement-tool/technical-specs/ar-implementation.md
```

### architecture-mapper
```
Analyze and reverse-engineer the Arboreal app architecture based on available information. Focus on:
- User flow mapping (mark tree → move → mark points → calculate)
- Data structures for measurements and GPS coordinates
- Export functionality (.csv files)
- State management patterns for AR sessions
- Integration patterns with device sensors

Save findings to tools/ar-measurement-tool/technical-specs/app-architecture.md
```

### ui-ux-designer
```
Research and design AR interface patterns for measurement tools. Focus on:
- AR overlay UI best practices for measurement
- Visual feedback for marking points in 3D space
- Progress indicators for multi-step AR workflows
- Accessibility considerations for outdoor AR use
- Gesture and interaction patterns for AR measurement

Save findings to tools/ar-measurement-tool/ui-ux-design/ar-interface-patterns.md
```

## Phase 2 - Platform-Specific Planning

### ios-developer
```
Create iOS-specific implementation plan for AR measurement tool. Focus on:
- ARKit 6 capabilities for measurement (RealityKit, LiDAR)
- SwiftUI integration with AR views
- Core Location integration for GPS coordinates
- Photo capture and annotation within AR sessions
- iOS-specific performance optimizations

Save findings to tools/ar-measurement-tool/implementation/ios-implementation.md
```

### mobile-developer
```
Plan cross-platform AR development strategy. Focus on:
- React Native or Flutter AR frameworks
- Shared business logic between iOS/Android
- Platform abstraction patterns for AR features
- Cross-platform data synchronization
- Performance parity strategies

Save findings to tools/ar-measurement-tool/implementation/cross-platform-strategy.md
```

### ai-engineer
```
Research computer vision requirements for AR measurement accuracy. Focus on:
- Object detection for automatic tree identification
- Edge detection and feature matching algorithms
- Machine learning models for measurement validation
- Real-time image processing optimization
- Calibration and error correction using AI

Save findings to tools/ar-measurement-tool/technical-specs/computer-vision-requirements.md
```

### database-optimizer
```
Design data models and storage optimization for measurement data. Focus on:
- Measurement record schema (coordinates, dimensions, metadata)
- Spatial data indexing for location-based queries
- Efficient storage of AR session data
- Export format specifications (.csv, .json)
- Data validation and integrity constraints

Save findings to tools/ar-measurement-tool/technical-specs/data-model-design.md
```

## Phase 3 - Integration & Quality

### backend-architect
```
Design API architecture for measurement data management. Focus on:
- RESTful endpoints for measurement CRUD operations
- Real-time sync for collaborative measurements
- Geospatial query capabilities
- Data export API design
- Integration with existing forestry management systems

Save findings to tools/ar-measurement-tool/technical-specs/api-architecture.md
```

### security-auditor
```
Analyze privacy and security considerations for AR measurement app. Focus on:
- Camera and location permission handling
- Secure storage of measurement data
- Privacy compliance for forestry professional data
- Data transmission security
- User consent and data retention policies

Save findings to tools/ar-measurement-tool/documentation/security-privacy.md
```

### performance-testing
```
Define performance benchmarks and testing strategy for AR measurement. Focus on:
- AR frame rate requirements for smooth measurement
- Battery consumption optimization strategies
- Memory usage patterns during AR sessions
- Measurement accuracy testing methodologies
- Device compatibility testing matrix

Save findings to tools/ar-measurement-tool/testing/performance-benchmarks.md
```

### business-analyst
```
Create feature prioritization and success metrics framework. Focus on:
- MVP feature set for initial release
- User adoption metrics and KPIs
- Revenue model analysis (freemium, professional tiers)
- Integration opportunities with existing TreeAI features
- Roadmap for advanced measurement features

Save findings to tools/ar-measurement-tool/documentation/business-requirements.md
```

## Execution Instructions

1. Run each agent with their specific prompt
2. Each agent should create their designated file in the specified folder
3. After all agents complete, synthesize findings into implementation plan
4. Use research-synthesizer agent to create comprehensive development roadmap