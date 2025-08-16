import Foundation
import Combine

// MARK: - TreeScore Agent Service

class TreeScoreAgentService: ObservableObject {
    private let communicationManager: AgentCommunicationManager
    
    init(communicationManager: AgentCommunicationManager) {
        self.communicationManager = communicationManager
    }
    
    func calculateTreeScore(_ measurements: TreeMeasurements) async throws -> TreeScoreResponse {
        let request = TreeScoreRequest(
            requestType: "calculate-treescore",
            measurements: measurements
        )
        
        return try await communicationManager.sendToAgent(request, to: .treeScoreCalculator)
    }
    
    func calculateStumpScore(_ stumpData: StumpMeasurements) async throws -> StumpScoreResponse {
        let request = StumpScoreRequest(
            requestType: "calculate-stump-score",
            stumpData: stumpData
        )
        
        return try await communicationManager.sendToAgent(request, to: .treeScoreCalculator)
    }
    
    func validateMeasurements(_ measurements: TreeMeasurements) async throws -> ValidationResponse {
        let request = ValidationRequest(
            requestType: "validate-measurements",
            measurements: measurements
        )
        
        return try await communicationManager.sendToAgent(request, to: .treeScoreCalculator)
    }
}

// MARK: - Safety Agent Service

class SafetyAgentService: ObservableObject {
    private let communicationManager: AgentCommunicationManager
    
    init(communicationManager: AgentCommunicationManager) {
        self.communicationManager = communicationManager
    }
    
    func assessSafetyRisks(_ assessment: SafetyAssessmentData) async throws -> SafetyAnalysisResponse {
        let request = SafetyAnalysisRequest(
            requestType: "safety-risk-assessment",
            assessmentData: assessment
        )
        
        return try await communicationManager.sendToAgent(request, to: .safetyManager)
    }
    
    func getRequiredProtocols(_ riskFactors: [RiskFactor]) async throws -> SafetyProtocolResponse {
        let request = SafetyProtocolRequest(
            requestType: "required-safety-protocols",
            riskFactors: riskFactors
        )
        
        return try await communicationManager.sendToAgent(request, to: .safetyManager)
    }
    
    func validateOSHACompliance(_ jobData: JobData) async throws -> OSHAComplianceResponse {
        let request = OSHAComplianceRequest(
            requestType: "osha-compliance-check",
            jobData: jobData
        )
        
        return try await communicationManager.sendToAgent(request, to: .safetyManager)
    }
}

// MARK: - Assessment Agent Service

class AssessmentAgentService: ObservableObject {
    private let communicationManager: AgentCommunicationManager
    
    init(communicationManager: AgentCommunicationManager) {
        self.communicationManager = communicationManager
    }
    
    func getNextAssessmentStep(_ currentData: AssessmentData) async throws -> NextStepResponse {
        let request = NextStepRequest(
            requestType: "next-assessment-step",
            currentData: currentData
        )
        
        return try await communicationManager.sendToAgent(request, to: .fieldAssessor)
    }
    
    func generateDynamicForm(_ context: AssessmentContext) async throws -> DynamicFormResponse {
        let request = DynamicFormRequest(
            requestType: "generate-dynamic-form",
            context: context
        )
        
        return try await communicationManager.sendToAgent(request, to: .fieldAssessor)
    }
    
    func validateAssessmentCompletion(_ assessment: CompleteAssessment) async throws -> CompletionValidationResponse {
        let request = CompletionValidationRequest(
            requestType: "validate-assessment-completion",
            assessment: assessment
        )
        
        return try await communicationManager.sendToAgent(request, to: .fieldAssessor)
    }
    
    func generateAssessmentReport(_ assessment: CompleteAssessment) async throws -> AssessmentReportResponse {
        let request = AssessmentReportRequest(
            requestType: "generate-assessment-report",
            assessment: assessment
        )
        
        return try await communicationManager.sendToAgent(request, to: .certifiedArborist)
    }
}

// MARK: - AR Agent Service

class ARAgentService: ObservableObject {
    private let communicationManager: AgentCommunicationManager
    
    init(communicationManager: AgentCommunicationManager) {
        self.communicationManager = communicationManager
    }
    
    func getMeasurementGuidance(_ context: ARMeasurementContext) async throws -> ARGuidanceResponse {
        let request = ARGuidanceRequest(
            requestType: "ar-measurement-guidance",
            context: context
        )
        
        return try await communicationManager.sendToAgent(request, to: .arSpecialist)
    }
    
    func validateARMeasurement(_ measurement: ARMeasurement) async throws -> ARValidationResponse {
        let request = ARValidationRequest(
            requestType: "validate-ar-measurement",
            measurement: measurement
        )
        
        return try await communicationManager.sendToAgent(request, to: .arSpecialist)
    }
    
    func optimizeARSession(_ sessionData: ARSessionData) async throws -> AROptimizationResponse {
        let request = AROptimizationRequest(
            requestType: "optimize-ar-session",
            sessionData: sessionData
        )
        
        return try await communicationManager.sendToAgent(request, to: .arSpecialist)
    }
}

// MARK: - Operations Agent Service

class OperationsAgentService: ObservableObject {
    private let communicationManager: AgentCommunicationManager
    
    init(communicationManager: AgentCommunicationManager) {
        self.communicationManager = communicationManager
    }
    
    func optimizeJobScheduling(_ requirements: JobRequirements) async throws -> SchedulingResponse {
        let request = SchedulingRequest(
            requestType: "optimize-job-scheduling",
            requirements: requirements
        )
        
        return try await communicationManager.sendToAgent(request, to: .operationsManager)
    }
    
    func allocateCrew(_ jobData: JobData) async throws -> CrewAllocationResponse {
        let request = CrewAllocationRequest(
            requestType: "optimize-crew-allocation",
            jobData: jobData
        )
        
        return try await communicationManager.sendToAgent(request, to: .operationsManager)
    }
    
    func calculatePricing(_ jobDetails: JobDetails) async throws -> PricingResponse {
        let request = PricingRequest(
            requestType: "calculate-job-pricing",
            jobDetails: jobDetails
        )
        
        return try await communicationManager.sendToAgent(request, to: .loadoutEconomicsManager)
    }
}

// MARK: - Request Types

struct TreeScoreRequest: AgentRequest {
    let requestType: String
    let measurements: TreeMeasurements
}

struct StumpScoreRequest: AgentRequest {
    let requestType: String
    let stumpData: StumpMeasurements
}

struct ValidationRequest: AgentRequest {
    let requestType: String
    let measurements: TreeMeasurements
}

struct SafetyAnalysisRequest: AgentRequest {
    let requestType: String
    let assessmentData: SafetyAssessmentData
}

struct SafetyProtocolRequest: AgentRequest {
    let requestType: String
    let riskFactors: [RiskFactor]
}

struct OSHAComplianceRequest: AgentRequest {
    let requestType: String
    let jobData: JobData
}

struct NextStepRequest: AgentRequest {
    let requestType: String
    let currentData: AssessmentData
}

struct DynamicFormRequest: AgentRequest {
    let requestType: String
    let context: AssessmentContext
}

struct CompletionValidationRequest: AgentRequest {
    let requestType: String
    let assessment: CompleteAssessment
}

struct AssessmentReportRequest: AgentRequest {
    let requestType: String
    let assessment: CompleteAssessment
}

struct ARGuidanceRequest: AgentRequest {
    let requestType: String
    let context: ARMeasurementContext
}

struct ARValidationRequest: AgentRequest {
    let requestType: String
    let measurement: ARMeasurement
}

struct AROptimizationRequest: AgentRequest {
    let requestType: String
    let sessionData: ARSessionData
}

struct SchedulingRequest: AgentRequest {
    let requestType: String
    let requirements: JobRequirements
}

struct CrewAllocationRequest: AgentRequest {
    let requestType: String
    let jobData: JobData
}

struct PricingRequest: AgentRequest {
    let requestType: String
    let jobDetails: JobDetails
}

// MARK: - Response Types

struct TreeScoreResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let treeScore: Int
    let breakdown: TreeScoreBreakdown
    let recommendations: [String]
    let afissScore: AFISSScore
}

struct StumpScoreResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let stumpScore: Int
    let breakdown: StumpScoreBreakdown
    let recommendations: [String]
}

struct ValidationResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let isValid: Bool
    let errors: [ValidationError]
    let warnings: [ValidationWarning]
    let suggestions: [String]
}

struct SafetyAnalysisResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let riskLevel: RiskLevel
    let identifiedRisks: [IdentifiedRisk]
    let requiredProtocols: [SafetyProtocol]
    let recommendations: [String]
}

struct SafetyProtocolResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let protocols: [SafetyProtocol]
    let equipmentRequired: [SafetyEquipment]
    let certificationRequired: [String]
}

struct OSHAComplianceResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let isCompliant: Bool
    let violations: [OSHAViolation]
    let requiredActions: [String]
}

struct NextStepResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let nextStep: AssessmentStep
    let formConfiguration: FormConfiguration
    let instructions: String
    let estimatedDuration: TimeInterval
}

struct DynamicFormResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let formFields: [DynamicFormField]
    let validation: FormValidationRules
    let layout: FormLayout
}

struct CompletionValidationResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let isComplete: Bool
    let missingData: [String]
    let nextActions: [String]
}

struct AssessmentReportResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let report: GeneratedReport
    let recommendations: [ProfessionalRecommendation]
    let followUpActions: [String]
}

struct ARGuidanceResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let instructions: ARInstructions
    let visualGuides: [ARVisualGuide]
    let tips: [String]
}

struct ARValidationResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let isValid: Bool
    let accuracy: Double
    let improvements: [String]
}

struct AROptimizationResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let optimizations: [AROptimization]
    let performanceMetrics: ARPerformanceMetrics
}

struct SchedulingResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let scheduledDate: Date
    let alternatives: [ScheduleOption]
    let reasoning: String
}

struct CrewAllocationResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let crew: [CrewMember]
    let equipment: [Equipment]
    let estimatedDuration: TimeInterval
}

struct PricingResponse: AgentResponse {
    let success: Bool
    let timestamp: TimeInterval
    let confidence: Double
    let totalPrice: Double
    let breakdown: PricingBreakdown
    let alternatives: [PricingOption]
}

// MARK: - Data Types

struct TreeMeasurements: Codable {
    let height: Double
    let dbh: Double
    let crownRadius: Double
    let species: String?
    let condition: TreeCondition
    let location: LocationData
}

struct StumpMeasurements: Codable {
    let diameter: Double
    let heightAboveGrade: Double
    let depthOfGrind: Double
    let rootSystem: RootSystemData
}

struct SafetyAssessmentData: Codable {
    let location: LocationData
    let powerLines: PowerLineProximity
    let structures: [NearbyStructure]
    let groundConditions: GroundConditions
    let weather: WeatherConditions
    let traffic: TrafficConditions
}

struct AssessmentData: Codable {
    let customerInfo: CustomerInfo
    let property: PropertyInfo
    let trees: [TreeData]
    let currentStep: String
    let completedSteps: [String]
}

struct AssessmentContext: Codable {
    let currentStep: String
    let previousData: [String: Any]
    let customerType: String
    let jobType: String
    let timeConstraints: TimeConstraints
}

// Additional supporting types would be defined here...

enum TreeCondition: String, Codable {
    case healthy
    case declining
    case dead
    case hazardous
}

enum RiskLevel: String, Codable {
    case low
    case medium
    case high
    case critical
}

struct LocationData: Codable {
    let latitude: Double
    let longitude: Double
    let address: String
    let accessibility: AccessibilityRating
}

struct AccessibilityRating: Codable {
    let vehicleAccess: Int // 1-10 scale
    let equipmentAccess: Int
    let workSpace: Int
    let fallZone: Int
}