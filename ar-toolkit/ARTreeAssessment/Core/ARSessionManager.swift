import ARKit
import RealityKit
import Combine
import SwiftUI

/// Smart AR session manager that activates AR only when measurement is needed
class ARSessionManager: NSObject, ObservableObject {
    
    // MARK: - Published Properties
    @Published var isARActive: Bool = false
    @Published var currentMode: ARMode = .chat
    @Published var measurementState: MeasurementState = .idle
    @Published var sessionStatus: ARSessionStatus = .notStarted
    @Published var measurementProgress: Float = 0.0
    
    // MARK: - AR Properties
    private var arView: ARView?
    private var arSession: ARSession?
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Configuration
    private let arConfiguration: ARWorldTrackingConfiguration = {
        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal, .vertical]
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            config.sceneReconstruction = .mesh
        }
        return config
    }()
    
    // MARK: - AR Modes
    enum ARMode: String, CaseIterable {
        case chat = "chat"
        case heightMeasurement = "height_measurement"
        case dbhMeasurement = "dbh_measurement"
        case crownMeasurement = "crown_measurement"
        case riskAssessment = "risk_assessment"
        case fullScan = "full_scan"
        
        var displayName: String {
            switch self {
            case .chat: return "Alex Chat"
            case .heightMeasurement: return "Height Measurement"
            case .dbhMeasurement: return "DBH Measurement"
            case .crownMeasurement: return "Crown Measurement"
            case .riskAssessment: return "Risk Assessment"
            case .fullScan: return "Full Tree Scan"
            }
        }
        
        var needsAR: Bool {
            switch self {
            case .chat: return false
            default: return true
            }
        }
    }
    
    // MARK: - Measurement States
    enum MeasurementState: String {
        case idle = "idle"
        case initializing = "initializing"
        case scanning = "scanning"
        case measuring = "measuring"
        case complete = "complete"
        case error = "error"
        
        var description: String {
            switch self {
            case .idle: return "Ready to measure"
            case .initializing: return "Starting AR session..."
            case .scanning: return "Scanning environment..."
            case .measuring: return "Taking measurement..."
            case .complete: return "Measurement complete"
            case .error: return "Measurement failed"
            }
        }
    }
    
    // MARK: - Session Status
    enum ARSessionStatus: String {
        case notStarted = "not_started"
        case starting = "starting"
        case running = "running"
        case paused = "paused"
        case interrupted = "interrupted"
        case failed = "failed"
        
        var isActive: Bool {
            return self == .running
        }
    }
    
    // MARK: - Public Methods
    
    /// Activate AR for specific measurement task
    func activateAR(for mode: ARMode) {
        guard mode.needsAR else {
            // Mode doesn't need AR, just switch to chat
            currentMode = mode
            return
        }
        
        print("🎯 Activating AR for: \(mode.displayName)")
        
        currentMode = mode
        measurementState = .initializing
        sessionStatus = .starting
        
        // Start AR session with slight delay for smooth UX
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            self.startARSession()
        }
    }
    
    /// Deactivate AR and return to chat mode
    func deactivateAR(completion: @escaping () -> Void = {}) {
        print("🛑 Deactivating AR, returning to chat mode")
        
        measurementState = .complete
        
        // Smooth transition with delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.stopARSession()
            self.currentMode = .chat
            self.measurementState = .idle
            completion()
        }
    }
    
    /// Quick measurement cycle: activate AR → measure → deactivate
    func performQuickMeasurement(type: ARMode, completion: @escaping (MeasurementResult?) -> Void) {
        print("⚡ Quick measurement: \(type.displayName)")
        
        activateAR(for: type)
        
        // Simulate measurement process
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.measurementState = .scanning
            self.updateProgress(0.3)
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.measurementState = .measuring
            self.updateProgress(0.7)
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
            let result = self.generateMockMeasurement(for: type)
            self.updateProgress(1.0)
            
            // Deactivate AR after successful measurement
            self.deactivateAR {
                completion(result)
            }
        }
    }
    
    // MARK: - Private AR Methods
    
    private func startARSession() {
        guard !isARActive else { return }
        
        print("🚀 Starting AR session")
        sessionStatus = .starting
        
        // Create AR view if needed
        if arView == nil {
            arView = ARView(frame: .zero)
            arView?.session.delegate = self
        }
        
        // Configure and run session
        arView?.session.run(arConfiguration, options: [.resetTracking, .removeExistingAnchors])
        
        isARActive = true
        sessionStatus = .running
        measurementState = .scanning
        
        print("✅ AR session started successfully")
    }
    
    private func stopARSession() {
        guard isARActive else { return }
        
        print("⏹️ Stopping AR session")
        
        arView?.session.pause()
        isARActive = false
        sessionStatus = .paused
        measurementProgress = 0.0
        
        print("✅ AR session stopped")
    }
    
    private func updateProgress(_ progress: Float) {
        withAnimation(.easeInOut(duration: 0.3)) {
            measurementProgress = progress
        }
    }
    
    // MARK: - Mock Measurement Generation
    
    private func generateMockMeasurement(for mode: ARMode) -> MeasurementResult {
        switch mode {
        case .heightMeasurement:
            return MeasurementResult(
                type: .height,
                value: Double.random(in: 25.0...60.0),
                unit: "ft",
                accuracy: Double.random(in: 0.85...0.98),
                timestamp: Date()
            )
            
        case .dbhMeasurement:
            return MeasurementResult(
                type: .dbh,
                value: Double.random(in: 12.0...36.0),
                unit: "in",
                accuracy: Double.random(in: 0.90...0.99),
                timestamp: Date()
            )
            
        case .crownMeasurement:
            return MeasurementResult(
                type: .crownRadius,
                value: Double.random(in: 8.0...25.0),
                unit: "ft",
                accuracy: Double.random(in: 0.80...0.95),
                timestamp: Date()
            )
            
        case .riskAssessment:
            return MeasurementResult(
                type: .riskScore,
                value: Double.random(in: 1.0...10.0),
                unit: "score",
                accuracy: Double.random(in: 0.75...0.90),
                timestamp: Date(),
                metadata: [
                    "powerLines": Bool.random(),
                    "structuralIssues": Bool.random(),
                    "deadBranches": Bool.random()
                ]
            )
            
        case .fullScan:
            return MeasurementResult(
                type: .composite,
                value: Double.random(in: 500...1200),
                unit: "TreeScore",
                accuracy: Double.random(in: 0.85...0.95),
                timestamp: Date(),
                metadata: [
                    "height": Double.random(in: 25.0...60.0),
                    "dbh": Double.random(in: 12.0...36.0),
                    "crownRadius": Double.random(in: 8.0...25.0)
                ]
            )
            
        case .chat:
            return MeasurementResult(type: .unknown, value: 0, unit: "", accuracy: 0, timestamp: Date())
        }
    }
    
    // MARK: - Workflow Integration
    
    /// Check if AR is needed for next step in workflow
    func shouldActivateARForNextStep(_ step: AssessmentStep) -> Bool {
        switch step {
        case .initialization, .completion:
            return false
        case .basicMeasurement, .riskAssessment, .treeScoreCalculation:
            return true
        }
    }
    
    /// Get optimal AR mode for assessment step
    func getARModeForStep(_ step: AssessmentStep) -> ARMode {
        switch step {
        case .basicMeasurement:
            return .heightMeasurement
        case .riskAssessment:
            return .riskAssessment
        case .treeScoreCalculation:
            return .fullScan
        default:
            return .chat
        }
    }
}

// MARK: - ARSessionDelegate

extension ARSessionManager: ARSessionDelegate {
    
    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        // Handle AR frame updates
        DispatchQueue.main.async {
            if self.measurementState == .scanning {
                // Update scanning progress based on tracking quality
                let trackingState = frame.camera.trackingState
                switch trackingState {
                case .normal:
                    self.updateProgress(min(self.measurementProgress + 0.01, 0.6))
                case .limited:
                    // Slow down progress if tracking is limited
                    break
                case .notAvailable:
                    self.measurementState = .error
                }
            }
        }
    }
    
    func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        print("🎯 AR anchors added: \(anchors.count)")
    }
    
    func session(_ session: ARSession, didFailWithError error: Error) {
        print("❌ AR session failed: \(error.localizedDescription)")
        DispatchQueue.main.async {
            self.sessionStatus = .failed
            self.measurementState = .error
        }
    }
    
    func sessionWasInterrupted(_ session: ARSession) {
        print("⚠️ AR session interrupted")
        DispatchQueue.main.async {
            self.sessionStatus = .interrupted
        }
    }
    
    func sessionInterruptionEnded(_ session: ARSession) {
        print("✅ AR session interruption ended")
        DispatchQueue.main.async {
            self.sessionStatus = .running
        }
    }
}

// MARK: - Supporting Types

struct MeasurementResult {
    let type: MeasurementType
    let value: Double
    let unit: String
    let accuracy: Double
    let timestamp: Date
    let metadata: [String: Any]?
    
    init(type: MeasurementType, value: Double, unit: String, accuracy: Double, timestamp: Date, metadata: [String: Any]? = nil) {
        self.type = type
        self.value = value
        self.unit = unit
        self.accuracy = accuracy
        self.timestamp = timestamp
        self.metadata = metadata
    }
    
    var formattedValue: String {
        return String(format: "%.1f %@", value, unit)
    }
    
    var accuracyPercentage: String {
        return String(format: "%.0f%%", accuracy * 100)
    }
}

enum MeasurementType: String, CaseIterable {
    case height = "height"
    case dbh = "dbh"
    case crownRadius = "crown_radius"
    case riskScore = "risk_score"
    case composite = "composite"
    case unknown = "unknown"
    
    var displayName: String {
        switch self {
        case .height: return "Tree Height"
        case .dbh: return "DBH"
        case .crownRadius: return "Crown Radius"
        case .riskScore: return "Risk Score"
        case .composite: return "TreeScore"
        case .unknown: return "Unknown"
        }
    }
    
    var icon: String {
        switch self {
        case .height: return "ruler.fill"
        case .dbh: return "circle.dashed"
        case .crownRadius: return "circle.dotted"
        case .riskScore: return "exclamationmark.triangle.fill"
        case .composite: return "tree.fill"
        case .unknown: return "questionmark.circle"
        }
    }
}

enum AssessmentStep: String, CaseIterable {
    case initialization = "initialization"
    case basicMeasurement = "basic_measurement"
    case riskAssessment = "risk_assessment"
    case treeScoreCalculation = "treescore_calculation"
    case completion = "completion"
    
    var displayName: String {
        switch self {
        case .initialization: return "Initialize Assessment"
        case .basicMeasurement: return "Basic Measurements"
        case .riskAssessment: return "Risk Assessment"
        case .treeScoreCalculation: return "TreeScore Calculation"
        case .completion: return "Complete Assessment"
        }
    }
    
    var description: String {
        switch self {
        case .initialization: return "Setting up assessment parameters"
        case .basicMeasurement: return "Measuring height, DBH, and crown"
        case .riskAssessment: return "Evaluating safety risks and hazards"
        case .treeScoreCalculation: return "Calculating final TreeScore"
        case .completion: return "Finalizing assessment report"
        }
    }
}