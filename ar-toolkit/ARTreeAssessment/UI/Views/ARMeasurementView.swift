import SwiftUI
import ARKit
import RealityKit

/// AR measurement interface with professional overlays and controls
struct ARMeasurementView: View {
    @EnvironmentObject var arSessionManager: ARSessionManager
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    @State private var showingMeasurementPicker = false
    @State private var selectedMeasurement: MeasurementType = .height
    @State private var lastMeasurement: MeasurementResult?
    
    var body: some View {
        ZStack {
            // AR View background
            ARViewContainer()
                .ignoresSafeArea()
            
            // AR Overlays
            VStack {
                // Top overlay with session info
                ARTopOverlay()
                
                Spacer()
                
                // Center crosshair and measurement display
                ARCenterOverlay()
                
                Spacer()
                
                // Bottom controls
                ARBottomControls(
                    showingMeasurementPicker: $showingMeasurementPicker,
                    selectedMeasurement: $selectedMeasurement,
                    onMeasure: performMeasurement,
                    onCancel: exitARMode
                )
            }
            
            // Measurement result overlay
            if let measurement = lastMeasurement {
                MeasurementResultOverlay(measurement: measurement) {
                    lastMeasurement = nil
                }
                .transition(.scale.combined(with: .opacity))
            }
            
            // Measurement type picker
            if showingMeasurementPicker {
                MeasurementTypePicker(
                    selectedType: $selectedMeasurement,
                    isShowing: $showingMeasurementPicker
                )
                .transition(.move(edge: .bottom))
            }
        }
        .animation(.easeInOut(duration: 0.3), value: showingMeasurementPicker)
        .animation(.easeInOut(duration: 0.3), value: lastMeasurement != nil)
        .onAppear {
            setupARMeasurement()
        }
    }
    
    private func setupARMeasurement() {
        // Activate AR for current measurement mode
        let arMode = getARModeForMeasurement(selectedMeasurement)
        arSessionManager.activateAR(for: arMode)
    }
    
    private func performMeasurement() {
        let arMode = getARModeForMeasurement(selectedMeasurement)
        arSessionManager.performQuickMeasurement(type: arMode) { result in
            DispatchQueue.main.async {
                self.lastMeasurement = result
            }
        }
    }
    
    private func exitARMode() {
        arSessionManager.deactivateAR()
    }
    
    private func getARModeForMeasurement(_ type: MeasurementType) -> ARSessionManager.ARMode {
        switch type {
        case .height: return .heightMeasurement
        case .dbh: return .dbhMeasurement
        case .crownRadius: return .crownMeasurement
        case .riskScore: return .riskAssessment
        case .composite: return .fullScan
        case .unknown: return .chat
        }
    }
}

/// AR view container for RealityKit integration
struct ARViewContainer: UIViewRepresentable {
    @EnvironmentObject var arSessionManager: ARSessionManager
    
    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)
        
        // Configure AR view for tree measurement
        arView.session.delegate = context.coordinator
        arView.automaticallyConfigureSession = false
        
        // Add lighting for better visualization
        arView.environment.lighting.intensityExponent = 1.0
        
        return arView
    }
    
    func updateUIView(_ uiView: ARView, context: Context) {
        // Update AR view based on session state
        if arSessionManager.isARActive {
            let configuration = ARWorldTrackingConfiguration()
            configuration.planeDetection = [.horizontal, .vertical]
            
            if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
                configuration.sceneReconstruction = .mesh
            }
            
            uiView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
        } else {
            uiView.session.pause()
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, ARSessionDelegate {
        let parent: ARViewContainer
        
        init(_ parent: ARViewContainer) {
            self.parent = parent
        }
        
        func session(_ session: ARSession, didUpdate frame: ARFrame) {
            // Handle frame updates for measurement calculations
        }
        
        func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
            // Handle anchor placement for measurements
        }
    }
}

/// Top overlay with AR session information
struct ARTopOverlay: View {
    @EnvironmentObject var arSessionManager: ARSessionManager
    
    var body: some View {
        VStack(spacing: 8) {
            // Session status indicator
            HStack {
                Circle()
                    .fill(arSessionManager.sessionStatus.isActive ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
                
                Text(arSessionManager.sessionStatus.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                    .font(.caption.weight(.semibold))
                    .foregroundColor(.white)
                
                Spacer()
                
                // AR mode indicator
                Text(arSessionManager.currentMode.displayName)
                    .font(.caption.weight(.semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.black.opacity(0.5))
                    .cornerRadius(6)
            }
            
            // Measurement progress
            if arSessionManager.measurementState != .idle {
                VStack(spacing: 4) {
                    Text(arSessionManager.measurementState.description)
                        .font(.caption)
                        .foregroundColor(.white)
                    
                    ProgressView(value: arSessionManager.measurementProgress)
                        .progressViewStyle(LinearProgressViewStyle(tint: .white))
                        .frame(width: 200)
                }
            }
        }
        .padding()
        .background(Color.black.opacity(0.3))
        .cornerRadius(12)
        .padding(.top, 8)
    }
}

/// Center crosshair and measurement overlay
struct ARCenterOverlay: View {
    @EnvironmentObject var arSessionManager: ARSessionManager
    @State private var pulseScale: CGFloat = 1.0
    
    var body: some View {
        VStack {
            // Crosshair for measurement targeting
            ZStack {
                // Outer ring
                Circle()
                    .stroke(Color.white, lineWidth: 2)
                    .frame(width: 60, height: 60)
                    .scaleEffect(pulseScale)
                    .animation(
                        .easeInOut(duration: 1.0).repeatForever(autoreverses: true),
                        value: pulseScale
                    )
                
                // Inner crosshair
                Image(systemName: "plus")
                    .font(.title2.weight(.bold))
                    .foregroundColor(.white)
                    .shadow(color: .black, radius: 2)
                
                // Measurement dot
                if arSessionManager.measurementState == .measuring {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 8, height: 8)
                }
            }
            
            // Measurement guidance text
            Text(getMeasurementGuidance())
                .font(.caption.weight(.semibold))
                .foregroundColor(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.black.opacity(0.5))
                .cornerRadius(8)
                .multilineTextAlignment(.center)
                .padding(.top, 8)
        }
        .onAppear {
            pulseScale = 1.2
        }
    }
    
    private func getMeasurementGuidance() -> String {
        switch arSessionManager.currentMode {
        case .heightMeasurement:
            return "Point at the base of the tree, then the top"
        case .dbhMeasurement:
            return "Point at the trunk at breast height (4.5 ft)"
        case .crownMeasurement:
            return "Trace the outer edge of the tree canopy"
        case .riskAssessment:
            return "Scan the tree for potential hazards"
        case .fullScan:
            return "Slowly move around the entire tree"
        case .chat:
            return "AR mode not active"
        }
    }
}

/// Bottom control panel
struct ARBottomControls: View {
    @Binding var showingMeasurementPicker: Bool
    @Binding var selectedMeasurement: MeasurementType
    let onMeasure: () -> Void
    let onCancel: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // Measurement type selector
            Button(action: {
                showingMeasurementPicker.toggle()
            }) {
                HStack {
                    Image(systemName: selectedMeasurement.icon)
                        .font(.headline)
                    
                    Text(selectedMeasurement.displayName)
                        .font(.headline.weight(.semibold))
                    
                    Image(systemName: "chevron.up")
                        .font(.caption)
                        .rotationEffect(.degrees(showingMeasurementPicker ? 0 : 180))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.black.opacity(0.5))
                .cornerRadius(12)
            }
            
            // Action buttons
            HStack(spacing: 24) {
                // Cancel button
                Button(action: onCancel) {
                    Image(systemName: "xmark")
                        .font(.title2.weight(.bold))
                        .foregroundColor(.white)
                        .frame(width: 60, height: 60)
                        .background(Color.red.opacity(0.8))
                        .clipShape(Circle())
                }
                
                // Measure button
                Button(action: onMeasure) {
                    ZStack {
                        Circle()
                            .fill(Color.white)
                            .frame(width: 80, height: 80)
                        
                        Circle()
                            .stroke(Color.blue, lineWidth: 4)
                            .frame(width: 80, height: 80)
                        
                        Image(systemName: "camera.fill")
                            .font(.title.weight(.bold))
                            .foregroundColor(.blue)
                    }
                }
                
                // Settings button
                Button(action: {
                    // Show measurement settings
                }) {
                    Image(systemName: "gear")
                        .font(.title2.weight(.bold))
                        .foregroundColor(.white)
                        .frame(width: 60, height: 60)
                        .background(Color.gray.opacity(0.8))
                        .clipShape(Circle())
                }
            }
        }
        .padding(.bottom, 32)
    }
}

/// Measurement type picker modal
struct MeasurementTypePicker: View {
    @Binding var selectedType: MeasurementType
    @Binding var isShowing: Bool
    
    let measurementTypes: [MeasurementType] = [.height, .dbh, .crownRadius, .riskScore, .composite]
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            
            VStack(spacing: 16) {
                // Handle bar
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color.secondary)
                    .frame(width: 40, height: 6)
                    .padding(.top, 8)
                
                Text("Select Measurement Type")
                    .font(.headline.weight(.semibold))
                    .padding(.horizontal)
                
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                    ForEach(measurementTypes, id: \.self) { type in
                        MeasurementTypeButton(
                            type: type,
                            isSelected: selectedType == type
                        ) {
                            selectedType = type
                            isShowing = false
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 32)
            }
            .background(Color(.systemBackground))
            .cornerRadius(16, corners: [.topLeft, .topRight])
        }
        .background(Color.black.opacity(0.3))
        .onTapGesture {
            isShowing = false
        }
    }
}

/// Individual measurement type button
struct MeasurementTypeButton: View {
    let type: MeasurementType
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: type.icon)
                    .font(.title2.weight(.semibold))
                    .foregroundColor(isSelected ? .white : .primary)
                
                Text(type.displayName)
                    .font(.caption.weight(.semibold))
                    .foregroundColor(isSelected ? .white : .primary)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 80)
            .background(isSelected ? Color.blue : Color(.systemGray6))
            .cornerRadius(12)
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

/// Measurement result overlay
struct MeasurementResultOverlay: View {
    let measurement: MeasurementResult
    let onDismiss: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // Success checkmark
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)
            
            VStack(spacing: 8) {
                Text("Measurement Complete")
                    .font(.headline.weight(.semibold))
                
                Text(measurement.formattedValue)
                    .font(.title.bold())
                    .foregroundColor(.primary)
                
                Text("Accuracy: \(measurement.accuracyPercentage)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            HStack(spacing: 16) {
                Button("Retake") {
                    onDismiss()
                    // Trigger new measurement
                }
                .buttonStyle(.bordered)
                
                Button("Accept") {
                    onDismiss()
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(24)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 8)
        .padding()
        .transition(.scale.combined(with: .opacity))
    }
}

/// Corner radius extension for specific corners
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

#Preview {
    ARMeasurementView()
        .environmentObject(ARSessionManager())
        .environmentObject(AssessmentWorkflowManager())
}