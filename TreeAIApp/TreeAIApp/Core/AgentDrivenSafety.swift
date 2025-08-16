import Foundation
import Combine

/// Agent-driven safety management system that replaces hardcoded safety logic with intelligent agent decisions
class AgentDrivenSafety: ObservableObject {
    
    // MARK: - Published Properties
    @Published var currentRiskLevel: RiskLevel = .low
    @Published var identifiedRisks: [IdentifiedRisk] = []
    @Published var requiredProtocols: [SafetyProtocol] = []
    @Published var requiredEquipment: [SafetyEquipment] = []
    @Published var oshaCompliance: OSHAComplianceStatus = .unknown
    @Published var safetyRecommendations: [SafetyRecommendation] = []
    @Published var realTimeSafetyAlerts: [SafetyAlert] = []
    @Published var isAnalyzing: Bool = false
    @Published var safetyScore: Double = 0.0
    
    // MARK: - Agent Services
    private let safetyService: SafetyAgentService
    private let operationsService: OperationsAgentService
    private let assessmentService: AssessmentAgentService
    
    // MARK: - Configuration
    private let safetyConfig: SafetyConfiguration
    private var continuousMonitoring: Bool = false
    
    // MARK: - State Management
    private var safetyAssessmentHistory: [SafetyAssessmentRecord] = []
    private var cancellables = Set<AnyCancellable>()
    
    init(safetyService: SafetyAgentService? = nil) {
        self.safetyService = safetyService ?? AgentServiceFactory.shared.createSafetyService()
        self.operationsService = AgentServiceFactory.shared.createOperationsService()
        self.assessmentService = AgentServiceFactory.shared.createAssessmentService()
        self.safetyConfig = SafetyConfiguration.default
        
        setupContinuousMonitoring()
    }
    
    // MARK: - Agent-Driven Safety Assessment
    
    /// Comprehensive safety assessment using specialist agents
    func performSafetyAssessment(
        location: LocationData,
        treeData: TreeData,
        jobContext: JobContext
    ) async throws -> ComprehensiveSafetyAssessment {
        
        isAnalyzing = true
        defer { isAnalyzing = false }
        
        // Step 1: Create comprehensive assessment data
        let assessmentData = createSafetyAssessmentData(
            location: location,
            treeData: treeData,
            jobContext: jobContext
        )
        
        // Step 2: Get primary safety analysis from safety manager agent
        let safetyAnalysis = try await safetyService.assessSafetyRisks(assessmentData)
        
        // Step 3: Get required protocols from safety agent
        let protocolResponse = try await safetyService.getRequiredProtocols(safetyAnalysis.identifiedRisks)
        
        // Step 4: Validate OSHA compliance
        let jobData = createJobData(location: location, treeData: treeData, jobContext: jobContext)
        let oshaCompliance = try await safetyService.validateOSHACompliance(jobData)
        
        // Step 5: Get operational safety recommendations
        let operationalGuidance = await getOperationalSafetyGuidance(
            riskLevel: safetyAnalysis.riskLevel,
            identifiedRisks: safetyAnalysis.identifiedRisks
        )
        
        // Step 6: Compile comprehensive assessment
        let assessment = ComprehensiveSafetyAssessment(
            riskLevel: safetyAnalysis.riskLevel,
            safetyScore: calculateSafetyScore(safetyAnalysis),
            identifiedRisks: safetyAnalysis.identifiedRisks,
            requiredProtocols: protocolResponse.protocols,
            requiredEquipment: protocolResponse.equipmentRequired,
            oshaCompliance: oshaCompliance,
            operationalGuidance: operationalGuidance,
            recommendations: createSafetyRecommendations(safetyAnalysis, protocolResponse),
            confidence: safetyAnalysis.confidence
        )
        
        // Step 7: Update published properties
        await MainActor.run {
            self.updateSafetyState(assessment)
        }
        
        // Step 8: Store assessment for learning
        let record = SafetyAssessmentRecord(
            id: UUID().uuidString,
            timestamp: Date(),
            assessment: assessment,
            location: location,
            jobContext: jobContext
        )
        safetyAssessmentHistory.append(record)
        
        return assessment
    }
    
    /// Real-time safety monitoring during job execution
    func startRealTimeSafetyMonitoring(
        jobId: String,
        initialAssessment: ComprehensiveSafetyAssessment
    ) async {
        continuousMonitoring = true
        
        // Set up real-time monitoring loop
        while continuousMonitoring {
            do {
                // Get current conditions
                let currentConditions = await getCurrentJobConditions(jobId: jobId)
                
                // Reassess safety if conditions changed
                if hasSignificantChange(currentConditions) {
                    let updatedAssessment = try await reassessSafetyConditions(
                        jobId: jobId,
                        currentConditions: currentConditions,
                        baselineAssessment: initialAssessment
                    )
                    
                    await MainActor.run {
                        self.updateSafetyState(updatedAssessment)
                        
                        // Generate alerts for significant changes
                        if updatedAssessment.riskLevel.rawValue > initialAssessment.riskLevel.rawValue {
                            self.generateSafetyAlert(
                                type: .riskLevelIncrease,
                                message: "Risk level increased to \(updatedAssessment.riskLevel.displayName)",
                                severity: updatedAssessment.riskLevel
                            )
                        }
                    }
                }
                
                // Wait before next check
                try await Task.sleep(nanoseconds: UInt64(safetyConfig.monitoringInterval * 1_000_000_000))
                
            } catch {
                print("Real-time safety monitoring error: \(error)")
                
                await MainActor.run {
                    self.generateSafetyAlert(
                        type: .monitoringError,
                        message: "Safety monitoring error: \(error.localizedDescription)",
                        severity: .medium
                    )
                }
            }
        }
    }
    
    /// Stop real-time safety monitoring
    func stopRealTimeSafetyMonitoring() {
        continuousMonitoring = false
    }
    
    /// Emergency safety assessment for critical situations
    func performEmergencySafetyAssessment(
        situation: EmergencySituation
    ) async throws -> EmergencySafetyResponse {
        
        // Create emergency assessment data
        let emergencyData = createEmergencyAssessmentData(situation)
        
        // Get immediate safety response from agent
        let response = try await safetyService.assessSafetyRisks(emergencyData)
        
        // Generate immediate actions
        let immediateActions = generateImmediateActions(response)
        
        // Update state for emergency
        await MainActor.run {
            self.currentRiskLevel = .critical
            self.generateSafetyAlert(
                type: .emergency,
                message: "EMERGENCY: \(situation.description)",
                severity: .critical
            )
        }
        
        return EmergencySafetyResponse(
            immediateActions: immediateActions,
            evacuationRequired: response.riskLevel == .critical,
            emergencyContacts: getEmergencyContacts(),
            followUpAssessment: response
        )
    }
    
    // MARK: - Agent Communication Helpers
    
    private func createSafetyAssessmentData(
        location: LocationData,
        treeData: TreeData,
        jobContext: JobContext
    ) -> SafetyAssessmentData {
        
        return SafetyAssessmentData(
            location: location,
            powerLines: assessPowerLineProximity(location, jobContext),
            structures: identifyNearbyStructures(location, jobContext),
            groundConditions: assessGroundConditions(location),
            weather: getCurrentWeatherConditions(location),
            traffic: assessTrafficConditions(location, jobContext)
        )
    }
    
    private func createJobData(
        location: LocationData,
        treeData: TreeData,
        jobContext: JobContext
    ) -> JobData {
        
        return JobData(
            id: jobContext.jobId,
            type: jobContext.jobType,
            location: location,
            treeInformation: treeData,
            crewSize: jobContext.crewSize,
            estimatedDuration: jobContext.estimatedDuration,
            equipmentRequired: jobContext.equipmentRequired,
            specialRequirements: jobContext.specialRequirements
        )
    }
    
    private func getOperationalSafetyGuidance(
        riskLevel: RiskLevel,
        identifiedRisks: [IdentifiedRisk]
    ) async -> OperationalSafetyGuidance {
        
        // In a real implementation, this would call the operations agent
        return OperationalSafetyGuidance(
            recommendedCrewSize: calculateRecommendedCrewSize(riskLevel),
            equipmentRecommendations: generateEquipmentRecommendations(identifiedRisks),
            workflowModifications: generateWorkflowModifications(riskLevel),
            supervisorRequirements: determineSupervisorRequirements(riskLevel),
            timeConstraints: calculateTimeConstraints(riskLevel)
        )
    }
    
    private func createSafetyRecommendations(
        _ safetyAnalysis: SafetyAnalysisResponse,
        _ protocolResponse: SafetyProtocolResponse
    ) -> [SafetyRecommendation] {
        
        var recommendations: [SafetyRecommendation] = []
        
        // Add risk-specific recommendations
        for risk in safetyAnalysis.identifiedRisks {
            recommendations.append(SafetyRecommendation(
                type: .riskMitigation,
                title: "Mitigate \(risk.type.displayName)",
                description: risk.mitigationStrategy,
                priority: risk.severity,
                estimatedTime: risk.mitigationTime,
                requiredResources: risk.requiredResources,
                agentSource: "safety-manager"
            ))
        }
        
        // Add protocol recommendations
        for protocol in protocolResponse.protocols {
            if protocol.required {
                recommendations.append(SafetyRecommendation(
                    type: .protocolCompliance,
                    title: "Implement \(protocol.name)",
                    description: protocol.description ?? "Required safety protocol",
                    priority: .high,
                    estimatedTime: 15.0, // Default 15 minutes
                    requiredResources: protocol.equipment,
                    agentSource: "safety-manager"
                ))
            }
        }
        
        // Add general safety recommendations
        recommendations.append(contentsOf: safetyAnalysis.recommendations.map { rec in
            SafetyRecommendation(
                type: .general,
                title: "Safety Guidance",
                description: rec,
                priority: .medium,
                estimatedTime: 5.0,
                requiredResources: [],
                agentSource: "safety-manager"
            )
        })
        
        return recommendations.sorted { $0.priority.sortOrder < $1.priority.sortOrder }
    }
    
    // MARK: - Safety State Management
    
    private func updateSafetyState(_ assessment: ComprehensiveSafetyAssessment) {
        currentRiskLevel = assessment.riskLevel
        safetyScore = assessment.safetyScore
        identifiedRisks = assessment.identifiedRisks
        requiredProtocols = assessment.requiredProtocols
        requiredEquipment = assessment.requiredEquipment
        oshaCompliance = assessment.oshaCompliance.isCompliant ? .compliant : .nonCompliant
        safetyRecommendations = assessment.recommendations
        
        // Generate alerts for high-risk situations
        if assessment.riskLevel == .critical || assessment.riskLevel == .high {
            generateSafetyAlert(
                type: .highRisk,
                message: "High risk level detected: \(assessment.riskLevel.displayName)",
                severity: assessment.riskLevel
            )
        }
    }
    
    private func generateSafetyAlert(
        type: SafetyAlertType,
        message: String,
        severity: RiskLevel
    ) {
        let alert = SafetyAlert(
            type: type,
            message: message,
            severity: severity,
            timestamp: Date(),
            requiresAcknowledgment: severity == .critical || severity == .high
        )
        
        realTimeSafetyAlerts.append(alert)
        
        // Keep only recent alerts
        let cutoffTime = Date().addingTimeInterval(-3600) // 1 hour
        realTimeSafetyAlerts = realTimeSafetyAlerts.filter { $0.timestamp > cutoffTime }
    }
    
    // MARK: - Continuous Monitoring
    
    private func setupContinuousMonitoring() {
        // Set up monitoring for environmental changes, weather updates, etc.
        // This would include integration with weather services, IoT sensors, etc.
    }
    
    private func getCurrentJobConditions(jobId: String) async -> CurrentJobConditions {
        // In real implementation, this would fetch current conditions from various sources
        return CurrentJobConditions(
            weather: WeatherConditions(windSpeed: 10, precipitation: 0, visibility: 10, temperature: 75),
            crewStatus: .onSite,
            equipmentStatus: .operational,
            workProgress: 0.5,
            incidentReports: []
        )
    }
    
    private func hasSignificantChange(_ conditions: CurrentJobConditions) -> Bool {
        // Determine if conditions have changed significantly enough to warrant reassessment
        return conditions.weather.windSpeed > 20 || 
               conditions.weather.precipitation > 0.1 ||
               !conditions.incidentReports.isEmpty
    }
    
    private func reassessSafetyConditions(
        jobId: String,
        currentConditions: CurrentJobConditions,
        baselineAssessment: ComprehensiveSafetyAssessment
    ) async throws -> ComprehensiveSafetyAssessment {
        
        // Create updated assessment data based on current conditions
        let updatedData = createUpdatedAssessmentData(currentConditions, baselineAssessment)
        
        // Get updated analysis from safety agent
        let updatedAnalysis = try await safetyService.assessSafetyRisks(updatedData)
        
        // Create updated comprehensive assessment
        return ComprehensiveSafetyAssessment(
            riskLevel: updatedAnalysis.riskLevel,
            safetyScore: calculateSafetyScore(updatedAnalysis),
            identifiedRisks: updatedAnalysis.identifiedRisks,
            requiredProtocols: baselineAssessment.requiredProtocols, // Protocols don't typically change
            requiredEquipment: baselineAssessment.requiredEquipment,
            oshaCompliance: baselineAssessment.oshaCompliance,
            operationalGuidance: await getOperationalSafetyGuidance(
                riskLevel: updatedAnalysis.riskLevel,
                identifiedRisks: updatedAnalysis.identifiedRisks
            ),
            recommendations: createSafetyRecommendations(
                updatedAnalysis,
                SafetyProtocolResponse(
                    success: true,
                    timestamp: Date().timeIntervalSince1970,
                    confidence: 0.9,
                    protocols: baselineAssessment.requiredProtocols,
                    equipmentRequired: baselineAssessment.requiredEquipment,
                    certificationRequired: []
                )
            ),
            confidence: updatedAnalysis.confidence
        )
    }
    
    // MARK: - Helper Methods
    
    private func calculateSafetyScore(_ analysis: SafetyAnalysisResponse) -> Double {
        let baseScore = 100.0
        var deductions = 0.0
        
        for risk in analysis.identifiedRisks {
            switch risk.severity {
            case .low: deductions += 5
            case .medium: deductions += 15
            case .high: deductions += 30
            case .critical: deductions += 50
            }
        }
        
        return max(0, baseScore - deductions)
    }
    
    private func assessPowerLineProximity(_ location: LocationData, _ jobContext: JobContext) -> PowerLineProximity {
        // In real implementation, this would check utility databases or use computer vision
        return PowerLineProximity(
            present: false,
            distance: 100.0,
            voltage: .residential
        )
    }
    
    private func identifyNearbyStructures(_ location: LocationData, _ jobContext: JobContext) -> [NearbyStructure] {
        // In real implementation, this would use mapping APIs or computer vision
        return []
    }
    
    private func assessGroundConditions(_ location: LocationData) -> GroundConditions {
        return GroundConditions(
            slope: .level,
            surface: .grass,
            stability: .stable
        )
    }
    
    private func getCurrentWeatherConditions(_ location: LocationData) -> WeatherConditions {
        // In real implementation, this would fetch from weather APIs
        return WeatherConditions(
            windSpeed: 8.0,
            precipitation: 0.0,
            visibility: 10.0,
            temperature: 72.0
        )
    }
    
    private func assessTrafficConditions(_ location: LocationData, _ jobContext: JobContext) -> TrafficConditions {
        return TrafficConditions(
            volume: .low,
            speed: 25,
            proximityToRoad: 30.0
        )
    }
    
    private func calculateRecommendedCrewSize(_ riskLevel: RiskLevel) -> Int {
        switch riskLevel {
        case .low: return 2
        case .medium: return 3
        case .high: return 4
        case .critical: return 5
        }
    }
    
    private func generateEquipmentRecommendations(_ risks: [IdentifiedRisk]) -> [String] {
        var equipment = Set<String>()
        
        for risk in risks {
            switch risk.type {
            case .powerLines:
                equipment.insert("Insulated tools")
                equipment.insert("Non-conductive ladders")
            case .structuralIssues:
                equipment.insert("Crane/lifting equipment")
                equipment.insert("Rigging equipment")
            case .accessRestriction:
                equipment.insert("Compact equipment")
                equipment.insert("Hand tools")
            default:
                equipment.insert("Standard safety equipment")
            }
        }
        
        return Array(equipment)
    }
    
    private func generateWorkflowModifications(_ riskLevel: RiskLevel) -> [String] {
        switch riskLevel {
        case .low:
            return []
        case .medium:
            return ["Increased supervisor oversight", "Extended safety briefings"]
        case .high:
            return ["Mandatory safety officer on-site", "Piece-by-piece removal", "Hourly safety checks"]
        case .critical:
            return ["Stop work until conditions improve", "Emergency protocols active", "Expert consultation required"]
        }
    }
    
    private func determineSupervisorRequirements(_ riskLevel: RiskLevel) -> SupervisorRequirements {
        switch riskLevel {
        case .low:
            return SupervisorRequirements(required: false, certification: [], onSiteTime: 0)
        case .medium:
            return SupervisorRequirements(required: true, certification: ["Basic supervision"], onSiteTime: 0.5)
        case .high:
            return SupervisorRequirements(required: true, certification: ["ISA Certified Arborist"], onSiteTime: 1.0)
        case .critical:
            return SupervisorRequirements(required: true, certification: ["ISA Board Certified Master Arborist"], onSiteTime: 1.0)
        }
    }
    
    private func calculateTimeConstraints(_ riskLevel: RiskLevel) -> TimeConstraints {
        switch riskLevel {
        case .low:
            return TimeConstraints(urgent: false, scheduledDate: nil)
        case .medium:
            return TimeConstraints(urgent: false, scheduledDate: nil)
        case .high:
            return TimeConstraints(urgent: true, scheduledDate: Date().addingTimeInterval(86400)) // Within 24 hours
        case .critical:
            return TimeConstraints(urgent: true, scheduledDate: Date().addingTimeInterval(7200)) // Within 2 hours
        }
    }
    
    private func createEmergencyAssessmentData(_ situation: EmergencySituation) -> SafetyAssessmentData {
        // Create emergency-specific assessment data
        return SafetyAssessmentData(
            location: situation.location,
            powerLines: PowerLineProximity(present: true, distance: 0, voltage: .high),
            structures: situation.threatenedStructures,
            groundConditions: GroundConditions(slope: .steep, surface: .uneven, stability: .unstable),
            weather: situation.currentWeather,
            traffic: TrafficConditions(volume: .high, speed: 35, proximityToRoad: 0)
        )
    }
    
    private func generateImmediateActions(_ response: SafetyAnalysisResponse) -> [ImmediateAction] {
        return response.identifiedRisks.map { risk in
            ImmediateAction(
                action: "Address \(risk.type.displayName)",
                priority: risk.severity,
                timeframe: risk.severity == .critical ? .immediate : .urgent,
                description: risk.mitigationStrategy
            )
        }
    }
    
    private func getEmergencyContacts() -> [EmergencyContact] {
        return [
            EmergencyContact(name: "911", phone: "911", type: .emergency),
            EmergencyContact(name: "Utility Company", phone: "1-800-UTILITY", type: .utility),
            EmergencyContact(name: "TreeAI Safety Hotline", phone: "1-800-TREEAI", type: .company)
        ]
    }
    
    private func createUpdatedAssessmentData(
        _ conditions: CurrentJobConditions,
        _ baseline: ComprehensiveSafetyAssessment
    ) -> SafetyAssessmentData {
        // Create new assessment data incorporating current conditions
        return SafetyAssessmentData(
            location: LocationData(latitude: 0, longitude: 0, address: "", accessibility: AccessibilityRating(vehicleAccess: 5, equipmentAccess: 5, workSpace: 5, fallZone: 5)),
            powerLines: PowerLineProximity(present: false, distance: 100, voltage: .residential),
            structures: [],
            groundConditions: GroundConditions(slope: .level, surface: .grass, stability: .stable),
            weather: conditions.weather,
            traffic: TrafficConditions(volume: .low, speed: 25, proximityToRoad: 50)
        )
    }
}

// MARK: - Supporting Data Types

struct ComprehensiveSafetyAssessment {
    let riskLevel: RiskLevel
    let safetyScore: Double
    let identifiedRisks: [IdentifiedRisk]
    let requiredProtocols: [SafetyProtocol]
    let requiredEquipment: [SafetyEquipment]
    let oshaCompliance: OSHAComplianceResponse
    let operationalGuidance: OperationalSafetyGuidance
    let recommendations: [SafetyRecommendation]
    let confidence: Double
}

struct SafetyAssessmentRecord {
    let id: String
    let timestamp: Date
    let assessment: ComprehensiveSafetyAssessment
    let location: LocationData
    let jobContext: JobContext
}

struct OperationalSafetyGuidance {
    let recommendedCrewSize: Int
    let equipmentRecommendations: [String]
    let workflowModifications: [String]
    let supervisorRequirements: SupervisorRequirements
    let timeConstraints: TimeConstraints
}

struct SupervisorRequirements {
    let required: Bool
    let certification: [String]
    let onSiteTime: Double // Percentage of time on-site
}

struct SafetyRecommendation: Identifiable {
    let id = UUID()
    let type: RecommendationType
    let title: String
    let description: String
    let priority: RiskSeverity
    let estimatedTime: TimeInterval
    let requiredResources: [String]
    let agentSource: String
    let timestamp: Date = Date()
    
    enum RecommendationType {
        case riskMitigation, protocolCompliance, equipmentUpgrade, training, general
    }
}

struct SafetyAlert: Identifiable {
    let id = UUID()
    let type: SafetyAlertType
    let message: String
    let severity: RiskLevel
    let timestamp: Date
    let requiresAcknowledgment: Bool
    var acknowledged: Bool = false
}

enum SafetyAlertType {
    case highRisk, riskLevelIncrease, protocolViolation, equipmentFailure, weatherChange, emergency, monitoringError
}

enum OSHAComplianceStatus {
    case compliant, nonCompliant, unknown, pendingReview
}

struct EmergencySituation {
    let type: EmergencyType
    let description: String
    let location: LocationData
    let threatenedStructures: [NearbyStructure]
    let currentWeather: WeatherConditions
    let immediateDanger: Bool
    
    enum EmergencyType {
        case treeFalling, powerLineContact, equipmentFailure, personnelInjury, propertyDamage
    }
}

struct EmergencySafetyResponse {
    let immediateActions: [ImmediateAction]
    let evacuationRequired: Bool
    let emergencyContacts: [EmergencyContact]
    let followUpAssessment: SafetyAnalysisResponse
}

struct ImmediateAction {
    let action: String
    let priority: RiskSeverity
    let timeframe: ActionTimeframe
    let description: String
    
    enum ActionTimeframe {
        case immediate, urgent, soon, planned
    }
}

struct EmergencyContact {
    let name: String
    let phone: String
    let type: ContactType
    
    enum ContactType {
        case emergency, utility, company, medical
    }
}

struct CurrentJobConditions {
    let weather: WeatherConditions
    let crewStatus: CrewStatus
    let equipmentStatus: EquipmentStatus
    let workProgress: Double
    let incidentReports: [IncidentReport]
    
    enum CrewStatus {
        case notStarted, onSite, working, break, complete
    }
    
    enum EquipmentStatus {
        case operational, maintenance, malfunction, unavailable
    }
}

struct IncidentReport {
    let type: IncidentType
    let description: String
    let severity: RiskSeverity
    let timestamp: Date
    
    enum IncidentType {
        case nearMiss, minorInjury, equipmentDamage, propertyDamage, safety
    }
}

struct JobContext {
    let jobId: String
    let jobType: JobType
    let crewSize: Int
    let estimatedDuration: TimeInterval
    let equipmentRequired: [String]
    let specialRequirements: [String]
    
    enum JobType {
        case treeRemoval, pruning, stumpGrinding, emergencyResponse
    }
}

struct SafetyConfiguration {
    let monitoringInterval: TimeInterval
    let alertThresholds: AlertThresholds
    let autoEscalation: Bool
    let emergencyProtocols: Bool
    
    static let `default` = SafetyConfiguration(
        monitoringInterval: 300, // 5 minutes
        alertThresholds: AlertThresholds(
            riskLevelChange: .medium,
            weatherChange: 10.0,
            equipmentFailure: .immediate
        ),
        autoEscalation: true,
        emergencyProtocols: true
    )
}

struct AlertThresholds {
    let riskLevelChange: RiskSeverity
    let weatherChange: Double
    let equipmentFailure: ImmediateAction.ActionTimeframe
}

// Extensions for better UX
extension RiskLevel {
    var displayName: String {
        switch self {
        case .low: return "Low Risk"
        case .medium: return "Medium Risk"
        case .high: return "High Risk"
        case .critical: return "Critical Risk"
        }
    }
    
    var color: Color {
        switch self {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .orange
        case .critical: return .red
        }
    }
}

extension RiskSeverity {
    var sortOrder: Int {
        switch self {
        case .critical: return 0
        case .high: return 1
        case .medium: return 2
        case .low: return 3
        }
    }
}

extension RiskType {
    var displayName: String {
        switch self {
        case .powerLines: return "Power Lines"
        case .structuralIssues: return "Structural Issues"
        case .accessRestriction: return "Access Restrictions"
        case .propertyDamageRisk: return "Property Damage Risk"
        case .environmentalConcern: return "Environmental Concerns"
        default: return "Other Risk"
        }
    }
}

// Additional supporting types would be defined here or imported from other files...