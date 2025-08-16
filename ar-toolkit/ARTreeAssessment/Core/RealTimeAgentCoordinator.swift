import Foundation
import Combine
import SwiftUI

/// Coordinates real-time updates from all agent systems and manages UI state
class RealTimeAgentCoordinator: ObservableObject {
    
    // MARK: - Published Properties
    @Published var isConnected: Bool = false
    @Published var activeAgentSessions: Set<String> = []
    @Published var realtimeUpdates: [RealTimeUpdate] = []
    @Published var urgentAlerts: [UrgentAlert] = []
    @Published var systemStatus: SystemStatus = .initializing
    @Published var connectionQuality: ConnectionQuality = .unknown
    @Published var lastUpdateTimestamp: Date = Date()
    
    // MARK: - Agent Managers
    private let workflowManager: AgentDrivenWorkflowManager
    private let safetyManager: AgentDrivenSafety
    private let treeScoreManager: AgentDrivenTreeScore
    private let arManager: AgentDrivenARManager
    private let communicationManager: AgentCommunicationManager
    
    // MARK: - Real-time State
    private var cancellables = Set<AnyCancellable>()
    private var updateQueue = DispatchQueue(label: "com.treeai.realtime", qos: .userInteractive)
    private var isMonitoring = false
    
    // MARK: - Configuration
    private let config = RealTimeConfiguration.default
    
    init(
        workflowManager: AgentDrivenWorkflowManager,
        safetyManager: AgentDrivenSafety,
        treeScoreManager: AgentDrivenTreeScore,
        arManager: AgentDrivenARManager,
        communicationManager: AgentCommunicationManager
    ) {
        self.workflowManager = workflowManager
        self.safetyManager = safetyManager
        self.treeScoreManager = treeScoreManager
        self.arManager = arManager
        self.communicationManager = communicationManager
        
        setupRealTimeCoordination()
    }
    
    // MARK: - Real-Time Coordination Setup
    
    private func setupRealTimeCoordination() {
        // Monitor workflow manager changes
        workflowManager.$agentRecommendations
            .receive(on: DispatchQueue.main)
            .sink { [weak self] recommendations in
                self?.handleWorkflowRecommendations(recommendations)
            }
            .store(in: &cancellables)
        
        workflowManager.$currentStep
            .receive(on: DispatchQueue.main)
            .sink { [weak self] step in
                self?.handleStepChange(step)
            }
            .store(in: &cancellables)
        
        // Monitor safety manager changes
        safetyManager.$realTimeSafetyAlerts
            .receive(on: DispatchQueue.main)
            .sink { [weak self] alerts in
                self?.handleSafetyAlerts(alerts)
            }
            .store(in: &cancellables)
        
        safetyManager.$currentRiskLevel
            .receive(on: DispatchQueue.main)
            .sink { [weak self] riskLevel in
                self?.handleRiskLevelChange(riskLevel)
            }
            .store(in: &cancellables)
        
        // Monitor TreeScore manager changes
        treeScoreManager.$currentScore
            .receive(on: DispatchQueue.main)
            .sink { [weak self] score in
                self?.handleTreeScoreUpdate(score)
            }
            .store(in: &cancellables)
        
        treeScoreManager.$agentRecommendations
            .receive(on: DispatchQueue.main)
            .sink { [weak self] recommendations in
                self?.handleTreeScoreRecommendations(recommendations)
            }
            .store(in: &cancellables)
        
        // Monitor AR manager changes
        arManager.$agentGuidance
            .receive(on: DispatchQueue.main)
            .sink { [weak self] guidance in
                self?.handleARGuidanceUpdate(guidance)
            }
            .store(in: &cancellables)
        
        arManager.$realTimeValidation
            .receive(on: DispatchQueue.main)
            .sink { [weak self] validation in
                self?.handleARValidationUpdate(validation)
            }
            .store(in: &cancellables)
        
        // Monitor communication manager connection
        communicationManager.$isConnected
            .receive(on: DispatchQueue.main)
            .sink { [weak self] connected in
                self?.handleConnectionChange(connected)
            }
            .store(in: &cancellables)
        
        // Start real-time monitoring
        startRealTimeMonitoring()
    }
    
    // MARK: - Real-Time Event Handlers
    
    private func handleWorkflowRecommendations(_ recommendations: [AgentRecommendation]) {
        for recommendation in recommendations {
            let update = RealTimeUpdate(
                id: UUID().uuidString,
                type: .workflowUpdate,
                source: .workflowManager,
                title: "New Workflow Recommendation",
                message: recommendation.message,
                priority: mapPriority(recommendation.priority),
                timestamp: Date(),
                data: ["recommendation": recommendation]
            )
            
            addRealTimeUpdate(update)
            
            // Check for urgent recommendations
            if recommendation.priority == .critical || recommendation.priority == .high {
                createUrgentAlert(from: recommendation)
            }
        }
    }
    
    private func handleStepChange(_ step: AssessmentStep) {
        let update = RealTimeUpdate(
            id: UUID().uuidString,
            type: .stepTransition,
            source: .workflowManager,
            title: "Assessment Step Changed",
            message: "Now on: \(step.displayName)",
            priority: .medium,
            timestamp: Date(),
            data: ["step": step.rawValue]
        )
        
        addRealTimeUpdate(update)
        updateActiveAgentSessions(for: step)
    }
    
    private func handleSafetyAlerts(_ alerts: [SafetyAlert]) {
        for alert in alerts.filter({ !$0.acknowledged }) {
            let update = RealTimeUpdate(
                id: UUID().uuidString,
                type: .safetyAlert,
                source: .safetyManager,
                title: "Safety Alert",
                message: alert.message,
                priority: mapRiskLevel(alert.severity),
                timestamp: alert.timestamp,
                data: ["alert": alert]
            )
            
            addRealTimeUpdate(update)
            
            // Create urgent alert for critical safety issues
            if alert.severity == .critical || alert.requiresAcknowledgment {
                let urgentAlert = UrgentAlert(
                    id: UUID().uuidString,
                    type: .safety,
                    title: "URGENT: Safety Alert",
                    message: alert.message,
                    severity: .critical,
                    requiresAction: alert.requiresAcknowledgment,
                    timestamp: alert.timestamp,
                    actionHandler: { [weak self] in
                        self?.acknowledgeSafetyAlert(alert)
                    }
                )
                
                addUrgentAlert(urgentAlert)
            }
        }
    }
    
    private func handleRiskLevelChange(_ riskLevel: RiskLevel) {
        let update = RealTimeUpdate(
            id: UUID().uuidString,
            type: .riskLevelChange,
            source: .safetyManager,
            title: "Risk Level Updated",
            message: "Current risk level: \(riskLevel.displayName)",
            priority: mapRiskLevel(riskLevel),
            timestamp: Date(),
            data: ["riskLevel": riskLevel.rawValue]
        )
        
        addRealTimeUpdate(update)
        
        // Update system status based on risk level
        updateSystemStatusForRiskLevel(riskLevel)
    }
    
    private func handleTreeScoreUpdate(_ score: Int) {
        let update = RealTimeUpdate(
            id: UUID().uuidString,
            type: .scoreUpdate,
            source: .treeScoreManager,
            title: "TreeScore Updated",
            message: "New score: \(score) points",
            priority: .medium,
            timestamp: Date(),
            data: ["score": score]
        )
        
        addRealTimeUpdate(update)
    }
    
    private func handleTreeScoreRecommendations(_ recommendations: [TreeScoreRecommendation]) {
        for recommendation in recommendations {
            let update = RealTimeUpdate(
                id: UUID().uuidString,
                type: .scoreInsight,
                source: .treeScoreManager,
                title: "TreeScore Insight",
                message: recommendation.message,
                priority: mapTreeScoreImpact(recommendation.impact),
                timestamp: recommendation.timestamp,
                data: ["recommendation": recommendation]
            )
            
            addRealTimeUpdate(update)
        }
    }
    
    private func handleARGuidanceUpdate(_ guidance: ARGuidanceInstructions?) {
        guard let guidance = guidance else { return }
        
        let update = RealTimeUpdate(
            id: UUID().uuidString,
            type: .arGuidance,
            source: .arManager,
            title: "AR Guidance Updated",
            message: guidance.primaryInstruction,
            priority: .medium,
            timestamp: Date(),
            data: ["guidance": guidance]
        )
        
        addRealTimeUpdate(update)
    }
    
    private func handleARValidationUpdate(_ validation: ARValidationFeedback?) {
        guard let validation = validation else { return }
        
        let update = RealTimeUpdate(
            id: UUID().uuidString,
            type: .arValidation,
            source: .arManager,
            title: "AR Measurement Validation",
            message: validation.isValid ? "Measurement looks good" : "Measurement needs improvement",
            priority: validation.isValid ? .low : .medium,
            timestamp: Date(),
            data: ["validation": validation]
        )
        
        addRealTimeUpdate(update)
        
        // Create urgent alert for poor measurement quality
        if validation.accuracy < 0.6 {
            let urgentAlert = UrgentAlert(
                id: UUID().uuidString,
                type: .measurementQuality,
                title: "Low Measurement Quality",
                message: "Current accuracy: \(Int(validation.accuracy * 100))%. Consider retaking measurement.",
                severity: .warning,
                requiresAction: false,
                timestamp: Date(),
                actionHandler: { [weak self] in
                    self?.retakeMeasurement()
                }
            )
            
            addUrgentAlert(urgentAlert)
        }
    }
    
    private func handleConnectionChange(_ connected: Bool) {
        isConnected = connected
        connectionQuality = connected ? .excellent : .disconnected
        
        let update = RealTimeUpdate(
            id: UUID().uuidString,
            type: .systemStatus,
            source: .system,
            title: connected ? "Connected to Agents" : "Agent Connection Lost",
            message: connected ? "All agents are online" : "Unable to reach agent services",
            priority: connected ? .low : .high,
            timestamp: Date(),
            data: ["connected": connected]
        )
        
        addRealTimeUpdate(update)
        
        // Update system status
        systemStatus = connected ? .operational : .degraded
        
        // Create urgent alert for connection loss
        if !connected {
            let urgentAlert = UrgentAlert(
                id: UUID().uuidString,
                type: .connectionLoss,
                title: "Agent Connection Lost",
                message: "Unable to reach TreeAI agents. Some features may be limited.",
                severity: .warning,
                requiresAction: false,
                timestamp: Date(),
                actionHandler: { [weak self] in
                    self?.attemptReconnection()
                }
            )
            
            addUrgentAlert(urgentAlert)
        }
    }
    
    // MARK: - Real-Time Monitoring
    
    private func startRealTimeMonitoring() {
        guard !isMonitoring else { return }
        isMonitoring = true
        
        // Start periodic health checks
        Timer.publish(every: config.healthCheckInterval, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.performHealthCheck()
            }
            .store(in: &cancellables)
        
        // Start update cleanup
        Timer.publish(every: config.cleanupInterval, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.cleanupOldUpdates()
            }
            .store(in: &cancellables)
        
        systemStatus = .operational
    }
    
    private func performHealthCheck() {
        updateQueue.async { [weak self] in
            guard let self = self else { return }
            
            // Check agent connectivity
            let agentHealth = self.checkAgentHealth()
            
            // Update connection quality
            let quality = self.calculateConnectionQuality(agentHealth)
            
            DispatchQueue.main.async {
                self.connectionQuality = quality
                self.lastUpdateTimestamp = Date()
                
                // Update system status if needed
                if quality == .disconnected && self.systemStatus == .operational {
                    self.systemStatus = .degraded
                } else if quality != .disconnected && self.systemStatus == .degraded {
                    self.systemStatus = .operational
                }
            }
        }
    }
    
    private func checkAgentHealth() -> AgentHealthStatus {
        return AgentHealthStatus(
            workflowManagerOnline: !workflowManager.isLoading,
            safetyManagerOnline: !safetyManager.isAnalyzing,
            treeScoreManagerOnline: !treeScoreManager.isCalculating,
            arManagerOnline: arManager.sessionStatus != .failed,
            communicationManagerOnline: communicationManager.isConnected
        )
    }
    
    private func calculateConnectionQuality(_ health: AgentHealthStatus) -> ConnectionQuality {
        let onlineCount = health.onlineAgentCount
        let totalAgents = health.totalAgents
        
        let ratio = Double(onlineCount) / Double(totalAgents)
        
        switch ratio {
        case 1.0:
            return .excellent
        case 0.8..<1.0:
            return .good
        case 0.6..<0.8:
            return .fair
        case 0.4..<0.6:
            return .poor
        default:
            return .disconnected
        }
    }
    
    // MARK: - Update Management
    
    private func addRealTimeUpdate(_ update: RealTimeUpdate) {
        updateQueue.async { [weak self] in
            DispatchQueue.main.async {
                self?.realtimeUpdates.insert(update, at: 0)
                
                // Limit number of updates
                if let updates = self?.realtimeUpdates, updates.count > self?.config.maxUpdates ?? 100 {
                    self?.realtimeUpdates = Array(updates.prefix(self?.config.maxUpdates ?? 100))
                }
                
                self?.lastUpdateTimestamp = Date()
            }
        }
    }
    
    private func addUrgentAlert(_ alert: UrgentAlert) {
        updateQueue.async { [weak self] in
            DispatchQueue.main.async {
                self?.urgentAlerts.insert(alert, at: 0)
                
                // Trigger haptic feedback for urgent alerts
                if alert.severity == .critical {
                    self?.triggerHapticFeedback(.error)
                } else if alert.severity == .warning {
                    self?.triggerHapticFeedback(.warning)
                }
                
                // Auto-dismiss non-critical alerts after timeout
                if alert.severity != .critical {
                    DispatchQueue.main.asyncAfter(deadline: .now() + self?.config.alertTimeout ?? 30) {
                        self?.dismissUrgentAlert(alert.id)
                    }
                }
            }
        }
    }
    
    private func cleanupOldUpdates() {
        let cutoffTime = Date().addingTimeInterval(-config.updateRetentionTime)
        
        realtimeUpdates = realtimeUpdates.filter { $0.timestamp > cutoffTime }
        urgentAlerts = urgentAlerts.filter { $0.timestamp > cutoffTime }
    }
    
    // MARK: - Public Methods
    
    func dismissUrgentAlert(_ alertId: String) {
        urgentAlerts.removeAll { $0.id == alertId }
    }
    
    func clearAllUpdates() {
        realtimeUpdates.removeAll()
    }
    
    func clearAllAlerts() {
        urgentAlerts.removeAll()
    }
    
    func getUpdatesByType(_ type: RealTimeUpdateType) -> [RealTimeUpdate] {
        return realtimeUpdates.filter { $0.type == type }
    }
    
    func getUpdatesBySource(_ source: UpdateSource) -> [RealTimeUpdate] {
        return realtimeUpdates.filter { $0.source == source }
    }
    
    // MARK: - Private Helpers
    
    private func updateActiveAgentSessions(for step: AssessmentStep) {
        activeAgentSessions.removeAll()
        
        switch step {
        case .initialization:
            activeAgentSessions.insert("workflow-manager")
        case .basicMeasurement:
            activeAgentSessions.insert("workflow-manager")
            activeAgentSessions.insert("ar-specialist")
        case .riskAssessment:
            activeAgentSessions.insert("workflow-manager")
            activeAgentSessions.insert("safety-manager")
        case .treeScoreCalculation:
            activeAgentSessions.insert("treescore-calculator")
            activeAgentSessions.insert("certified-arborist")
        case .completion:
            activeAgentSessions.insert("workflow-manager")
            activeAgentSessions.insert("operations-manager")
        }
    }
    
    private func updateSystemStatusForRiskLevel(_ riskLevel: RiskLevel) {
        switch riskLevel {
        case .low, .medium:
            if systemStatus == .alert {
                systemStatus = .operational
            }
        case .high:
            systemStatus = .caution
        case .critical:
            systemStatus = .alert
        }
    }
    
    private func createUrgentAlert(from recommendation: AgentRecommendation) {
        let alert = UrgentAlert(
            id: UUID().uuidString,
            type: .agentRecommendation,
            title: "Urgent Agent Recommendation",
            message: recommendation.message,
            severity: recommendation.priority == .critical ? .critical : .warning,
            requiresAction: recommendation.priority == .critical,
            timestamp: recommendation.timestamp,
            actionHandler: { [weak self] in
                self?.handleRecommendationAction(recommendation)
            }
        )
        
        addUrgentAlert(alert)
    }
    
    private func acknowledgeSafetyAlert(_ alert: SafetyAlert) {
        // Handle safety alert acknowledgment
    }
    
    private func retakeMeasurement() {
        // Trigger measurement retake
    }
    
    private func attemptReconnection() {
        // Attempt to reconnect to agents
    }
    
    private func handleRecommendationAction(_ recommendation: AgentRecommendation) {
        // Handle specific recommendation actions
    }
    
    private func triggerHapticFeedback(_ type: HapticFeedbackType) {
        let generator = UINotificationFeedbackGenerator()
        
        switch type {
        case .error:
            generator.notificationOccurred(.error)
        case .warning:
            generator.notificationOccurred(.warning)
        case .success:
            generator.notificationOccurred(.success)
        }
    }
    
    // MARK: - Mapping Functions
    
    private func mapPriority(_ priority: AgentRecommendation.Priority) -> UpdatePriority {
        switch priority {
        case .low: return .low
        case .medium: return .medium
        case .high: return .high
        case .critical: return .critical
        }
    }
    
    private func mapRiskLevel(_ riskLevel: RiskLevel) -> UpdatePriority {
        switch riskLevel {
        case .low: return .low
        case .medium: return .medium
        case .high: return .high
        case .critical: return .critical
        }
    }
    
    private func mapTreeScoreImpact(_ impact: TreeScoreRecommendation.Impact) -> UpdatePriority {
        switch impact {
        case .positive: return .low
        case .neutral: return .low
        case .medium: return .medium
        case .negative: return .medium
        }
    }
}

// MARK: - Supporting Data Types

struct RealTimeUpdate: Identifiable {
    let id: String
    let type: RealTimeUpdateType
    let source: UpdateSource
    let title: String
    let message: String
    let priority: UpdatePriority
    let timestamp: Date
    let data: [String: Any]
}

struct UrgentAlert: Identifiable {
    let id: String
    let type: UrgentAlertType
    let title: String
    let message: String
    let severity: AlertSeverity
    let requiresAction: Bool
    let timestamp: Date
    let actionHandler: () -> Void
}

enum RealTimeUpdateType {
    case workflowUpdate
    case stepTransition
    case safetyAlert
    case riskLevelChange
    case scoreUpdate
    case scoreInsight
    case arGuidance
    case arValidation
    case systemStatus
}

enum UpdateSource {
    case workflowManager
    case safetyManager
    case treeScoreManager
    case arManager
    case system
}

enum UpdatePriority {
    case low, medium, high, critical
    
    var color: Color {
        switch self {
        case .low: return .green
        case .medium: return .blue
        case .high: return .orange
        case .critical: return .red
        }
    }
}

enum UrgentAlertType {
    case safety
    case measurementQuality
    case connectionLoss
    case agentRecommendation
    case systemError
}

enum AlertSeverity {
    case info, warning, critical
    
    var color: Color {
        switch self {
        case .info: return .blue
        case .warning: return .orange
        case .critical: return .red
        }
    }
}

enum SystemStatus {
    case initializing
    case operational
    case caution
    case degraded
    case alert
    case offline
    
    var color: Color {
        switch self {
        case .initializing: return .gray
        case .operational: return .green
        case .caution: return .yellow
        case .degraded: return .orange
        case .alert: return .red
        case .offline: return .gray
        }
    }
    
    var displayName: String {
        switch self {
        case .initializing: return "Initializing"
        case .operational: return "Operational"
        case .caution: return "Caution"
        case .degraded: return "Degraded"
        case .alert: return "Alert"
        case .offline: return "Offline"
        }
    }
}

enum ConnectionQuality {
    case unknown, disconnected, poor, fair, good, excellent
    
    var color: Color {
        switch self {
        case .unknown: return .gray
        case .disconnected: return .red
        case .poor: return .red
        case .fair: return .orange
        case .good: return .yellow
        case .excellent: return .green
        }
    }
    
    var displayName: String {
        switch self {
        case .unknown: return "Unknown"
        case .disconnected: return "Disconnected"
        case .poor: return "Poor"
        case .fair: return "Fair"
        case .good: return "Good"
        case .excellent: return "Excellent"
        }
    }
}

struct AgentHealthStatus {
    let workflowManagerOnline: Bool
    let safetyManagerOnline: Bool
    let treeScoreManagerOnline: Bool
    let arManagerOnline: Bool
    let communicationManagerOnline: Bool
    
    var onlineAgentCount: Int {
        var count = 0
        if workflowManagerOnline { count += 1 }
        if safetyManagerOnline { count += 1 }
        if treeScoreManagerOnline { count += 1 }
        if arManagerOnline { count += 1 }
        if communicationManagerOnline { count += 1 }
        return count
    }
    
    var totalAgents: Int { return 5 }
}

enum HapticFeedbackType {
    case error, warning, success
}

struct RealTimeConfiguration {
    let healthCheckInterval: TimeInterval
    let cleanupInterval: TimeInterval
    let updateRetentionTime: TimeInterval
    let alertTimeout: TimeInterval
    let maxUpdates: Int
    
    static let `default` = RealTimeConfiguration(
        healthCheckInterval: 5.0,     // Check every 5 seconds
        cleanupInterval: 60.0,        // Cleanup every minute
        updateRetentionTime: 3600.0,  // Keep updates for 1 hour
        alertTimeout: 30.0,           // Auto-dismiss alerts after 30 seconds
        maxUpdates: 100               // Keep max 100 updates in memory
    )
}