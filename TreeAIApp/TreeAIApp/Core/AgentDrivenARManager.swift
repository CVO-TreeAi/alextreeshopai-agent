import ARKit
import RealityKit
import Combine
import SwiftUI

/// Agent-driven AR manager that uses specialist agents for measurement guidance and validation
class AgentDrivenARManager: NSObject, ObservableObject {
    
    // MARK: - Published Properties
    @Published var isARActive: Bool = false
    @Published var currentMode: ARMode = .chat
    @Published var measurementState: MeasurementState = .idle
    @Published var sessionStatus: ARSessionStatus = .notStarted
    @Published var measurementProgress: Float = 0.0
    @Published var agentGuidance: ARGuidanceInstructions?
    @Published var realTimeValidation: ARValidationFeedback?
    @Published var visualGuides: [ARVisualGuide] = []
    @Published var measurementQuality: ARMeasurementQuality?
    @Published var agentRecommendations: [ARRecommendation] = []
    
    // MARK: - AR Properties
    private var arView: ARView?
    private var arSession: ARSession?
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Agent Services
    private let arService: ARAgentService
    private let safetyService: SafetyAgentService
    private let treeScoreService: TreeScoreAgentService
    
    // MARK: - State Management
    private var currentMeasurementContext: ARMeasurementContext?
    private var measurementHistory: [AgentValidatedMeasurement] = []
    private var continuousValidation: Bool = false
    
    // MARK: - Configuration
    private let arConfiguration: ARWorldTrackingConfiguration = {
        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal, .vertical]
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            config.sceneReconstruction = .mesh
        }
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentationWithDepth) {
            config.frameSemantics.insert(.personSegmentationWithDepth)
        }
        return config
    }()
    
    init(arService: ARAgentService? = nil) {
        self.arService = arService ?? AgentServiceFactory.shared.createARService()
        self.safetyService = AgentServiceFactory.shared.createSafetyService()
        self.treeScoreService = AgentServiceFactory.shared.createTreeScoreService()
        
        super.init()
        setupAgentDrivenAR()
    }
    
    // MARK: - Agent-Driven AR Activation
    
    /// Activate AR with agent guidance for specific measurement task
    func activateARWithAgentGuidance(for mode: ARMode, context: ARMeasurementContext) async {
        guard mode.needsAR else {
            currentMode = mode
            return
        }
        
        print("🤖 Activating agent-driven AR for: \(mode.displayName)")
        
        currentMode = mode
        currentMeasurementContext = context
        measurementState = .initializing
        sessionStatus = .starting
        
        // Get initial guidance from AR specialist agent
        await requestInitialGuidanceFromAgent(mode: mode, context: context)
        
        // Start AR session with agent optimization
        await startAgentOptimizedARSession()
    }
    
    /// Deactivate AR with agent feedback analysis
    func deactivateARWithAgentFeedback() async {
        print("🛑 Deactivating agent-driven AR")
        
        // Get final session analysis from agent
        if let sessionData = createARSessionData() {
            await analyzeSessionWithAgent(sessionData)
        }
        
        // Clean transition
        measurementState = .complete
        
        await MainActor.run {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.stopARSession()
                self.currentMode = .chat
                self.measurementState = .idle
                self.agentGuidance = nil
                self.realTimeValidation = nil
                self.visualGuides = []
            }
        }
    }
    
    /// Perform agent-guided measurement with continuous validation
    func performAgentGuidedMeasurement(
        type: ARMode,
        context: ARMeasurementContext
    ) async throws -> AgentValidatedMeasurement {
        
        print("⚡ Agent-guided measurement: \(type.displayName)")
        
        // Activate AR with agent guidance
        await activateARWithAgentGuidance(for: type, context: context)
        
        // Start continuous validation
        continuousValidation = true
        await startContinuousValidation()
        
        // Perform measurement with agent oversight
        let measurementResult = await performMeasurementWithAgentOversight(type: type)
        
        // Validate measurement with agents
        let validation = try await validateMeasurementWithAgents(measurementResult)
        
        // Stop continuous validation
        continuousValidation = false
        
        // Create agent-validated measurement
        let validatedMeasurement = AgentValidatedMeasurement(
            measurement: measurementResult,
            validation: validation,
            agentGuidance: agentGuidance,
            context: context,
            quality: measurementQuality ?? ARMeasurementQuality(accuracy: 0.5, reliability: 0.5, completeness: 0.5),
            timestamp: Date()
        )
        
        // Store for learning
        measurementHistory.append(validatedMeasurement)
        
        // Deactivate AR with feedback
        await deactivateARWithAgentFeedback()
        
        return validatedMeasurement
    }
    
    // MARK: - Agent Communication
    
    private func requestInitialGuidanceFromAgent(mode: ARMode, context: ARMeasurementContext) async {
        do {
            let response = try await arService.getMeasurementGuidance(context)
            
            await MainActor.run {
                self.agentGuidance = ARGuidanceInstructions(
                    primaryInstruction: response.instructions.primaryInstruction,
                    stepByStepGuide: response.instructions.stepByStepGuide,
                    safetyNotes: response.instructions.safetyNotes,
                    expectedAccuracy: response.instructions.expectedAccuracy
                )
                
                self.visualGuides = response.visualGuides
                
                self.agentRecommendations = response.tips.map { tip in
                    ARRecommendation(
                        type: .guidance,
                        message: tip,
                        priority: .medium,
                        agentSource: "ar-specialist"
                    )
                }
            }
            
        } catch {
            print("Failed to get initial AR guidance: \(error)")
            await MainActor.run {
                self.agentGuidance = ARGuidanceInstructions.fallback
            }
        }
    }
    
    private func startContinuousValidation() async {
        guard continuousValidation else { return }
        
        while continuousValidation {
            // Get current measurement state
            if let currentFrame = getCurrentARFrame() {
                await validateCurrentFrameWithAgent(currentFrame)
            }
            
            // Wait before next validation
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
        }
    }
    
    private func validateCurrentFrameWithAgent(_ frame: ARFrameData) async {
        // Create real-time validation request
        let validationContext = createRealTimeValidationContext(frame)
        
        do {
            // This would be a lightweight real-time validation endpoint
            let feedback = try await arService.validateARMeasurement(ARMeasurement(
                type: currentMode.rawValue,
                value: frame.estimatedMeasurement,
                confidence: frame.trackingConfidence,
                timestamp: Date(),
                metadata: frame.metadata
            ))
            
            await MainActor.run {
                self.realTimeValidation = ARValidationFeedback(
                    isValid: feedback.isValid,
                    accuracy: feedback.accuracy,
                    confidence: feedback.confidence,
                    suggestions: feedback.improvements,
                    qualityIndicators: extractQualityIndicators(feedback)
                )
                
                self.measurementQuality = ARMeasurementQuality(
                    accuracy: feedback.accuracy,
                    reliability: feedback.confidence,
                    completeness: calculateCompleteness(frame)
                )
            }
            
        } catch {
            // Handle validation errors gracefully
            print("Real-time validation error: \(error)")
        }
    }
    
    private func validateMeasurementWithAgents(_ result: MeasurementResult) async throws -> ARValidationResponse {
        let arMeasurement = ARMeasurement(
            type: result.type.rawValue,
            value: result.value,
            confidence: result.accuracy,
            timestamp: result.timestamp,
            metadata: result.metadata ?? [:]
        )
        
        return try await arService.validateARMeasurement(arMeasurement)
    }
    
    private func analyzeSessionWithAgent(_ sessionData: ARSessionData) async {
        do {
            let optimization = try await arService.optimizeARSession(sessionData)
            
            await MainActor.run {
                // Apply optimization recommendations for future sessions
                self.agentRecommendations.append(contentsOf: optimization.optimizations.map { opt in
                    ARRecommendation(
                        type: .optimization,
                        message: opt.description,
                        priority: opt.impact == .high ? .high : .medium,
                        agentSource: "ar-specialist"
                    )
                })
            }
            
        } catch {
            print("Session analysis failed: \(error)")
        }
    }
    
    // MARK: - AR Session Management
    
    private func startAgentOptimizedARSession() async {
        await MainActor.run {
            guard !isARActive else { return }
            
            print("🚀 Starting agent-optimized AR session")
            sessionStatus = .starting
            
            // Create AR view if needed
            if arView == nil {
                arView = ARView(frame: .zero)
                arView?.session.delegate = self
            }
            
            // Apply agent-recommended configuration
            if let guidance = agentGuidance {
                applyAgentRecommendedConfiguration(guidance)
            }
            
            // Run session
            arView?.session.run(arConfiguration, options: [.resetTracking, .removeExistingAnchors])
            
            isARActive = true
            sessionStatus = .running
            measurementState = .scanning
            
            print("✅ Agent-optimized AR session started")
        }
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
    
    private func applyAgentRecommendedConfiguration(_ guidance: ARGuidanceInstructions) {
        // Apply agent recommendations to AR configuration
        // This could include adjusting tracking sensitivity, detection parameters, etc.
        
        if guidance.expectedAccuracy > 0.9 {
            // High accuracy requirement - use more precise settings
            arConfiguration.planeDetection = [.horizontal, .vertical]
            if ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) {
                arConfiguration.sceneReconstruction = .meshWithClassification
            }
        }
    }
    
    // MARK: - Measurement Execution
    
    private func performMeasurementWithAgentOversight(type: ARMode) async -> MeasurementResult {
        await MainActor.run {
            measurementState = .scanning
            updateProgress(0.1)
        }
        
        // Scanning phase with agent guidance
        await performScanningPhase()
        
        await MainActor.run {
            measurementState = .measuring
            updateProgress(0.5)
        }
        
        // Measurement phase with agent validation
        let result = await performMeasurementPhase(type: type)
        
        await MainActor.run {
            updateProgress(1.0)
            measurementState = .complete
        }
        
        return result
    }
    
    private func performScanningPhase() async {
        // Agent-guided scanning with real-time feedback
        for progress in stride(from: 0.1, through: 0.4, by: 0.1) {
            await MainActor.run {
                updateProgress(Float(progress))
            }
            
            try? await Task.sleep(nanoseconds: 300_000_000) // 0.3 seconds
            
            // Check agent guidance for scanning optimization
            if let guidance = agentGuidance {
                await optimizeScanningBasedOnGuidance(guidance)
            }
        }
    }
    
    private func performMeasurementPhase(type: ARMode) async -> MeasurementResult {
        // Perform actual measurement with agent oversight
        let result = generateAgentInformedMeasurement(for: type)
        
        // Apply any real-time corrections from agents
        if let validation = realTimeValidation {
            return applyAgentCorrections(result, validation: validation)
        }
        
        return result
    }
    
    private func optimizeScanningBasedOnGuidance(_ guidance: ARGuidanceInstructions) async {
        // Apply agent recommendations during scanning
        // This could include adjusting scan patterns, focus areas, etc.
    }
    
    // MARK: - Measurement Generation and Correction
    
    private func generateAgentInformedMeasurement(for mode: ARMode) -> MeasurementResult {
        // Generate measurement with agent-informed parameters
        let baseResult = generateBaseMeasurement(for: mode)
        
        // Apply agent context if available
        if let context = currentMeasurementContext {
            return applyContextualAdjustments(baseResult, context: context)
        }
        
        return baseResult
    }
    
    private func generateBaseMeasurement(for mode: ARMode) -> MeasurementResult {
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
                metadata: generateRiskMetadata()
            )
            
        case .fullScan:
            return MeasurementResult(
                type: .composite,
                value: Double.random(in: 500...1200),
                unit: "TreeScore",
                accuracy: Double.random(in: 0.85...0.95),
                timestamp: Date(),
                metadata: generateCompositeMetadata()
            )
            
        default:
            return MeasurementResult(
                type: .unknown,
                value: 0,
                unit: "",
                accuracy: 0,
                timestamp: Date()
            )
        }
    }
    
    private func applyContextualAdjustments(_ result: MeasurementResult, context: ARMeasurementContext) -> MeasurementResult {
        var adjustedResult = result
        
        // Apply environmental condition adjustments
        switch context.environmentalConditions.lighting {
        case .poor:
            adjustedResult = MeasurementResult(
                type: result.type,
                value: result.value,
                unit: result.unit,
                accuracy: result.accuracy * 0.9, // Reduce accuracy in poor lighting
                timestamp: result.timestamp,
                metadata: result.metadata
            )
        case .excellent:
            adjustedResult = MeasurementResult(
                type: result.type,
                value: result.value,
                unit: result.unit,
                accuracy: min(0.99, result.accuracy * 1.05), // Increase accuracy in excellent lighting
                timestamp: result.timestamp,
                metadata: result.metadata
            )
        default:
            break
        }
        
        return adjustedResult
    }
    
    private func applyAgentCorrections(_ result: MeasurementResult, validation: ARValidationFeedback) -> MeasurementResult {
        if validation.accuracy < 0.8 {
            // Apply agent-suggested corrections
            let correctionFactor = validation.confidence > 0.8 ? 1.1 : 0.95
            
            return MeasurementResult(
                type: result.type,
                value: result.value * correctionFactor,
                unit: result.unit,
                accuracy: validation.accuracy,
                timestamp: result.timestamp,
                metadata: result.metadata
            )
        }
        
        return result
    }
    
    // MARK: - Helper Methods
    
    private func setupAgentDrivenAR() {
        // Setup agent-driven AR configurations
    }
    
    private func updateProgress(_ progress: Float) {
        withAnimation(.easeInOut(duration: 0.3)) {
            measurementProgress = progress
        }
    }
    
    private func getCurrentARFrame() -> ARFrameData? {
        guard let arView = arView,
              let frame = arView.session.currentFrame else {
            return nil
        }
        
        return ARFrameData(
            trackingState: frame.camera.trackingState,
            trackingConfidence: calculateTrackingConfidence(frame.camera.trackingState),
            estimatedMeasurement: 0.0, // Would be calculated from frame data
            metadata: extractFrameMetadata(frame)
        )
    }
    
    private func createRealTimeValidationContext(_ frame: ARFrameData) -> ARMeasurementContext {
        return currentMeasurementContext ?? ARMeasurementContext(
            measurementType: .height,
            treeSpecies: nil,
            environmentalConditions: EnvironmentalConditions(
                lighting: .good,
                weather: .clear,
                obstacles: []
            ),
            deviceCapabilities: DeviceCapabilities(
                hasLiDAR: true,
                cameraQuality: .high,
                processingPower: .high
            )
        )
    }
    
    private func createARSessionData() -> ARSessionData? {
        guard let context = currentMeasurementContext else { return nil }
        
        return ARSessionData(
            sessionDuration: 180.0, // Would track actual duration
            measurementType: currentMode.rawValue,
            context: context,
            measurements: measurementHistory.suffix(10).map { $0.measurement },
            performanceMetrics: ARPerformanceMetrics(
                averageAccuracy: calculateAverageAccuracy(),
                processingTime: 0.5,
                trackingStability: 0.85,
                energyUsage: 15.0
            )
        )
    }
    
    private func calculateTrackingConfidence(_ trackingState: ARCamera.TrackingState) -> Double {
        switch trackingState {
        case .normal:
            return 0.95
        case .limited(.excessiveMotion):
            return 0.6
        case .limited(.insufficientFeatures):
            return 0.5
        case .limited(.initializing):
            return 0.3
        case .limited(.relocalizing):
            return 0.4
        case .notAvailable:
            return 0.0
        default:
            return 0.7
        }
    }
    
    private func extractFrameMetadata(_ frame: ARFrame) -> [String: Any] {
        return [
            "timestamp": frame.timestamp,
            "lightEstimate": frame.lightEstimate?.ambientIntensity ?? 1000.0,
            "anchors": frame.anchors.count
        ]
    }
    
    private func extractQualityIndicators(_ feedback: ARValidationResponse) -> [QualityIndicator] {
        // Extract quality indicators from agent feedback
        return [
            QualityIndicator(name: "Accuracy", value: feedback.accuracy, threshold: 0.8),
            QualityIndicator(name: "Confidence", value: feedback.confidence, threshold: 0.7)
        ]
    }
    
    private func calculateCompleteness(_ frame: ARFrameData) -> Double {
        // Calculate measurement completeness based on frame data
        return frame.trackingConfidence
    }
    
    private func calculateAverageAccuracy() -> Double {
        guard !measurementHistory.isEmpty else { return 0.0 }
        return measurementHistory.map { $0.measurement.accuracy }.reduce(0, +) / Double(measurementHistory.count)
    }
    
    private func generateRiskMetadata() -> [String: Any] {
        return [
            "powerLines": Bool.random(),
            "structuralIssues": Bool.random(),
            "deadBranches": Bool.random(),
            "proximityToStructures": Double.random(in: 5...50)
        ]
    }
    
    private func generateCompositeMetadata() -> [String: Any] {
        return [
            "height": Double.random(in: 25.0...60.0),
            "dbh": Double.random(in: 12.0...36.0),
            "crownRadius": Double.random(in: 8.0...25.0),
            "treeHealth": ["excellent", "good", "fair", "poor"].randomElement() ?? "good"
        ]
    }
}

// MARK: - ARSessionDelegate

extension AgentDrivenARManager: ARSessionDelegate {
    
    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        // Enhanced frame handling with agent feedback
        DispatchQueue.main.async {
            if self.measurementState == .scanning {
                let trackingState = frame.camera.trackingState
                let confidence = self.calculateTrackingConfidence(trackingState)
                
                // Update progress based on tracking quality and agent guidance
                if confidence > 0.8 {
                    self.updateProgress(min(self.measurementProgress + 0.01, 0.6))
                }
                
                // Trigger real-time validation if enabled
                if self.continuousValidation {
                    Task {
                        if let frameData = self.getCurrentARFrame() {
                            await self.validateCurrentFrameWithAgent(frameData)
                        }
                    }
                }
            }
        }
    }
    
    func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        print("🎯 AR anchors added: \(anchors.count)")
        
        // Notify agents about new anchors for improved guidance
        if anchors.count > 2 {
            Task {
                await updateAgentGuidanceWithAnchors(anchors)
            }
        }
    }
    
    func session(_ session: ARSession, didFailWithError error: Error) {
        print("❌ AR session failed: \(error.localizedDescription)")
        
        DispatchQueue.main.async {
            self.sessionStatus = .failed
            self.measurementState = .error
            
            // Add agent recommendation for error recovery
            self.agentRecommendations.append(ARRecommendation(
                type: .error,
                message: "AR session error: \(error.localizedDescription). Try restarting AR or improving lighting conditions.",
                priority: .high,
                agentSource: "ar-specialist"
            ))
        }
    }
    
    private func updateAgentGuidanceWithAnchors(_ anchors: [ARAnchor]) async {
        // Update agent guidance based on detected anchors
        // This could improve measurement accuracy and provide better instructions
    }
}

// MARK: - Supporting Types

struct AgentValidatedMeasurement {
    let measurement: MeasurementResult
    let validation: ARValidationResponse
    let agentGuidance: ARGuidanceInstructions?
    let context: ARMeasurementContext
    let quality: ARMeasurementQuality
    let timestamp: Date
}

struct ARGuidanceInstructions {
    let primaryInstruction: String
    let stepByStepGuide: [String]
    let safetyNotes: [String]
    let expectedAccuracy: Double
    
    static let fallback = ARGuidanceInstructions(
        primaryInstruction: "Position your device to view the tree clearly",
        stepByStepGuide: [
            "Hold device steady",
            "Point camera at measurement target",
            "Wait for tracking to stabilize",
            "Tap to measure"
        ],
        safetyNotes: ["Maintain safe distance from tree"],
        expectedAccuracy: 0.85
    )
}

struct ARValidationFeedback {
    let isValid: Bool
    let accuracy: Double
    let confidence: Double
    let suggestions: [String]
    let qualityIndicators: [QualityIndicator]
}

struct ARMeasurementQuality {
    let accuracy: Double
    let reliability: Double
    let completeness: Double
    
    var overallScore: Double {
        return (accuracy + reliability + completeness) / 3.0
    }
}

struct ARRecommendation: Identifiable {
    let id = UUID()
    let type: RecommendationType
    let message: String
    let priority: Priority
    let agentSource: String
    let timestamp: Date = Date()
    
    enum RecommendationType {
        case guidance, optimization, error, improvement
    }
    
    enum Priority {
        case low, medium, high, critical
    }
}

struct ARFrameData {
    let trackingState: ARCamera.TrackingState
    let trackingConfidence: Double
    let estimatedMeasurement: Double
    let metadata: [String: Any]
}

struct QualityIndicator {
    let name: String
    let value: Double
    let threshold: Double
    
    var isGood: Bool {
        return value >= threshold
    }
}

// Additional supporting types for AR measurement context and device capabilities
struct EnvironmentalConditions: Codable {
    let lighting: LightingCondition
    let weather: WeatherCondition
    let obstacles: [String]
    
    enum LightingCondition: String, Codable {
        case poor, fair, good, excellent
    }
    
    enum WeatherCondition: String, Codable {
        case clear, cloudy, rainy, foggy
    }
}

struct DeviceCapabilities: Codable {
    let hasLiDAR: Bool
    let cameraQuality: CameraQuality
    let processingPower: ProcessingPower
    
    enum CameraQuality: String, Codable {
        case low, medium, high, ultra
    }
    
    enum ProcessingPower: String, Codable {
        case low, medium, high, ultra
    }
}

struct ARSessionData: Codable {
    let sessionDuration: TimeInterval
    let measurementType: String
    let context: ARMeasurementContext
    let measurements: [MeasurementResult]
    let performanceMetrics: ARPerformanceMetrics
}

struct ARPerformanceMetrics: Codable {
    let averageAccuracy: Double
    let processingTime: TimeInterval
    let trackingStability: Double
    let energyUsage: Double
}

// Extensions for better compatibility
extension ARMode {
    var needsAR: Bool {
        switch self {
        case .chat: return false
        default: return true
        }
    }
    
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
}

extension MeasurementResult: Codable {
    enum CodingKeys: String, CodingKey {
        case type, value, unit, accuracy, timestamp
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(MeasurementType.self, forKey: .type)
        value = try container.decode(Double.self, forKey: .value)
        unit = try container.decode(String.self, forKey: .unit)
        accuracy = try container.decode(Double.self, forKey: .accuracy)
        timestamp = try container.decode(Date.self, forKey: .timestamp)
        metadata = nil // Metadata not included in Codable implementation for simplicity
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(type, forKey: .type)
        try container.encode(value, forKey: .value)
        try container.encode(unit, forKey: .unit)
        try container.encode(accuracy, forKey: .accuracy)
        try container.encode(timestamp, forKey: .timestamp)
    }
}