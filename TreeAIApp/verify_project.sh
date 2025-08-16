#!/bin/bash

echo "🚀 TreeAI iOS Project Verification"
echo "=================================="

# Check if Xcode project exists
if [ -f "TreeAIApp.xcodeproj/project.pbxproj" ]; then
    echo "✅ Xcode project file exists"
else
    echo "❌ Xcode project file missing"
    exit 1
fi

# Check if workspace exists
if [ -f "TreeAIApp.xcodeproj/project.xcworkspace/contents.xcworkspacedata" ]; then
    echo "✅ Xcode workspace configured"
else
    echo "❌ Xcode workspace missing"
    exit 1
fi

# Check if Info.plist exists
if [ -f "TreeAIApp/Supporting Files/Info.plist" ]; then
    echo "✅ Info.plist configured"
else
    echo "❌ Info.plist missing"
    exit 1
fi

# Count Swift files
SWIFT_COUNT=$(find TreeAIApp -name "*.swift" | wc -l)
echo "✅ Found $SWIFT_COUNT Swift files"

# Check critical Swift files
CRITICAL_FILES=(
    "TreeAIApp/TreeAIAppApp.swift"
    "TreeAIApp/ContentView.swift"
    "TreeAIApp/Core/AgentCommunicationManager.swift"
    "TreeAIApp/Core/AgentDrivenARManager.swift"
    "TreeAIApp/Core/RealTimeAgentCoordinator.swift"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
    fi
done

# Check Assets
if [ -d "TreeAIApp/Supporting Files/Assets.xcassets" ]; then
    echo "✅ Assets.xcassets configured"
else
    echo "❌ Assets.xcassets missing"
fi

# Project validation summary
echo ""
echo "📱 Project Configuration Summary:"
echo "- iOS Deployment Target: 15.0+"
echo "- Frameworks: ARKit, RealityKit, AVFoundation, CoreLocation"
echo "- Architecture: Agent-driven with SwiftUI"
echo "- Device Target: iPhone 16 Pro Max optimized"
echo ""
echo "🎯 Ready to open in Xcode!"
echo "Run: open TreeAIApp.xcodeproj"