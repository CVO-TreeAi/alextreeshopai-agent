# TreeAI iOS App

A comprehensive iOS application for AR-powered tree assessment and forestry operations, built with SwiftUI and powered by an intelligent agent-driven architecture.

## Features

- **AR Tree Measurement**: Using ARKit and RealityKit for precise tree measurements
- **Agent-Driven Architecture**: 30+ specialized AI agents for intelligent decision making
- **Real-Time Safety Monitoring**: Continuous safety assessment and alerts
- **Dynamic Workflows**: Adaptive workflow management based on field conditions
- **Alex AI Integration**: Natural language interface for complex forestry operations

## Requirements

- iOS 15.0+
- Xcode 15.0+
- iPhone/iPad with ARKit support
- Camera permissions for AR functionality

## Project Structure

```
TreeAIApp/
├── TreeAIApp.xcodeproj/          # Xcode project file
├── TreeAIApp/
│   ├── TreeAIAppApp.swift        # Main app entry point
│   ├── ContentView.swift         # Root content view
│   ├── Core/                     # Core business logic
│   │   ├── ARSessionManager.swift
│   │   ├── AgentCommunicationManager.swift
│   │   ├── AgentDrivenARManager.swift
│   │   ├── AgentDrivenSafety.swift
│   │   ├── AgentDrivenTreeScore.swift
│   │   ├── AgentIntegrationTests.swift
│   │   ├── AgentServices.swift
│   │   └── RealTimeAgentCoordinator.swift
│   ├── UI/                       # User interface components
│   │   ├── Components/           # Reusable UI components
│   │   └── Views/               # Screen views
│   ├── Workflows/               # Agent-driven workflows
│   ├── Supporting Files/        # Assets and configuration
│   └── Preview Content/         # SwiftUI preview assets
└── README.md
```

## Getting Started

### 1. Open Project
```bash
open TreeAIApp.xcodeproj
```

### 2. Configure Team and Signing
1. Select the TreeAIApp target
2. Go to "Signing & Capabilities"
3. Select your Apple Developer Team
4. Ensure automatic signing is enabled

### 3. Build and Run
1. Select your target device (iPhone 16 Pro Max simulator or physical device)
2. Press ⌘+R to build and run

### 4. Testing on Device
For AR functionality, deploy to a physical device:
1. Connect your iPhone/iPad
2. Select it as the target device
3. Build and run (⌘+R)

## Architecture

### Agent-Driven System
The app uses a sophisticated agent-based architecture with:
- **AgentCommunicationManager**: Handles all agent communications
- **RealTimeAgentCoordinator**: Orchestrates multiple agents in real-time
- **Specialized Agents**: 30+ agents for different aspects of forestry operations

### Core Components
- **AR Management**: ARKit/RealityKit integration for 3D measurements
- **Safety System**: Real-time risk assessment and alerts
- **TreeScore Calculator**: Intelligent tree valuation algorithms
- **Workflow Engine**: Dynamic, adaptive workflow management

### UI Framework
- **SwiftUI**: Modern declarative UI framework
- **Combine**: Reactive programming for data flow
- **Environment Objects**: Shared state management across views

## Key Features

### AR Tree Assessment
- Point-and-measure tree dimensions
- 3D visualization of measurements
- Real-time accuracy validation
- Environmental context analysis

### Agent Integration
- Natural language processing via Alex AI
- Automated workflow suggestions
- Real-time decision support
- Multi-agent coordination

### Safety Monitoring
- Continuous risk assessment
- Emergency alert system
- Compliance checking
- Environmental hazard detection

## Development

### Building
```bash
xcodebuild -project TreeAIApp.xcodeproj -scheme TreeAIApp -configuration Debug
```

### Testing
The app includes comprehensive integration tests accessible via:
1. Run the app
2. Navigate to Settings tab
3. Tap "Run Integration Tests"

### Debugging
- Use Xcode's built-in debugger
- Enable AR debugging in scheme settings
- Check agent communication logs in console

## Deployment

### App Store Preparation
1. Update version numbers in project settings
2. Configure release signing
3. Archive for distribution
4. Upload via Xcode or Application Loader

### TestFlight Distribution
1. Archive the app
2. Upload to App Store Connect
3. Configure TestFlight settings
4. Invite internal/external testers

## Permissions

The app requires the following permissions:
- **Camera**: For AR tree measurements
- **Location**: For geotagging assessments
- **Photo Library**: For saving assessment images
- **Microphone**: For voice commands (optional)

## Troubleshooting

### Common Issues
1. **AR not working**: Ensure device supports ARKit and camera permissions are granted
2. **Agent communication errors**: Check network connectivity and agent service status
3. **Build errors**: Verify Xcode version and iOS deployment target

### Performance Optimization
- AR sessions are optimized for battery life
- Agent communications use efficient protocols
- UI updates are minimized during AR sessions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on device
5. Submit a pull request

## License

Proprietary - TreeAI Technologies

## Support

For technical support or questions, contact the development team.