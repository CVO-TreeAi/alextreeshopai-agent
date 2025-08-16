import SwiftUI
import Combine

/// Agent-driven assessment workflow that dynamically adapts based on specialist agent recommendations
class AgentDrivenWorkflowManager: ObservableObject {
    
    // MARK: - Published Properties
    @Published var currentStep: AssessmentStep = .initialization
    @Published var formData: AssessmentFormData = AssessmentFormData()
    @Published var isComplete: Bool = false
    @Published var progress: Float = 0.0
    @Published var isLoading: Bool = false
    @Published var currentInstructions: String = ""
    @Published var validationErrors: [String] = []
    @Published var agentRecommendations: [AgentRecommendation] = []
    @Published var dynamicFormFields: [DynamicFormField] = []
    @Published var safetyProtocols: [SafetyProtocol] = []
    @Published var realTimeGuidance: String = ""
    
    // MARK: - Agent Services
    private let assessmentService: AssessmentAgentService
    private let treeScoreService: TreeScoreAgentService
    private let safetyService: SafetyAgentService
    private let arService: ARAgentService
    private let operationsService: OperationsAgentService
    
    // MARK: - Dependencies
    @Published var arSessionManager: ARSessionManager
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - State Management
    private var assessmentContext: AssessmentContext
    private var agentDecisionHistory: [AgentDecision] = []
    
    init(arSessionManager: ARSessionManager = ARSessionManager()) {
        self.arSessionManager = arSessionManager
        
        // Initialize agent services
        let factory = AgentServiceFactory.shared
        self.assessmentService = factory.createAssessmentService()
        self.treeScoreService = factory.createTreeScoreService()
        self.safetyService = factory.createSafetyService()
        self.arService = factory.createARService()
        self.operationsService = factory.createOperationsService()
        
        // Initialize assessment context
        self.assessmentContext = AssessmentContext(
            currentStep: AssessmentStep.initialization.rawValue,
            previousData: [:],
            customerType: "residential", // Will be determined by agent
            jobType: "tree-removal", // Will be determined by agent
            timeConstraints: TimeConstraints(urgent: false, scheduledDate: nil)
        )
        
        setupAgentWorkflow()
    }
    
    // MARK: - Agent-Driven Workflow Control
    
    func startAgentDrivenAssessment() async {
        print("🤖 Starting agent-driven assessment workflow")
        
        currentStep = .initialization
        progress = 0.0
        isComplete = false
        formData = AssessmentFormData()
        validationErrors = []
        agentRecommendations = []
        
        await requestNextStepFromAgent()
    }
    
    func proceedToNextStep() async {
        guard !isComplete else { return }
        
        // Validate current step with agent
        let isValid = await validateCurrentStepWithAgent()
        
        if isValid {
            await requestNextStepFromAgent()
        }
    }
    
    func goToPreviousStep() async {
        // Agent determines if going back is allowed and beneficial
        let canGoBack = await requestStepBackPermissionFromAgent()
        
        if canGoBack {
            await requestPreviousStepFromAgent()
        }
    }
    
    // MARK: - Agent Communication
    
    private func requestNextStepFromAgent() async {
        isLoading = true
        
        do {
            let assessmentData = createCurrentAssessmentData()
            let response = try await assessmentService.getNextAssessmentStep(assessmentData)
            
            await MainActor.run {
                self.handleNextStepResponse(response)
            }
            
        } catch {
            await MainActor.run {
                self.handleAgentError(error)
            }
        }
        
        isLoading = false
    }
    
    private func validateCurrentStepWithAgent() async -> Bool {
        do {
            let completeAssessment = createCompleteAssessment()
            let response = try await assessmentService.validateAssessmentCompletion(completeAssessment)
            
            await MainActor.run {
                self.validationErrors = response.missingData
                self.agentRecommendations = response.nextActions.map { action in
                    AgentRecommendation(
                        type: .improvement,
                        message: action,
                        priority: .medium,
                        agentSource: "field-assessor"
                    )
                }
            }
            
            return response.isComplete
            
        } catch {
            await MainActor.run {
                self.handleAgentError(error)
            }
            return false
        }
    }
    
    private func requestStepBackPermissionFromAgent() async -> Bool {
        // In a real implementation, this would check with the agent
        // For now, we'll allow going back if not on the first step
        return currentStep != .initialization
    }
    
    private func requestPreviousStepFromAgent() async {
        // Agent would determine the optimal previous step
        // For now, we'll use a simple linear approach
        let steps: [AssessmentStep] = [.initialization, .basicMeasurement, .riskAssessment, .treeScoreCalculation, .completion]
        
        if let currentIndex = steps.firstIndex(of: currentStep), currentIndex > 0 {
            await MainActor.run {
                self.currentStep = steps[currentIndex - 1]
                self.updateProgress()
            }
            
            await requestDynamicFormFromAgent()
        }
    }
    
    private func requestDynamicFormFromAgent() async {
        do {
            let response = try await assessmentService.generateDynamicForm(assessmentContext)
            
            await MainActor.run {
                self.dynamicFormFields = response.formFields
                self.currentInstructions = "Complete the form below based on your assessment."
            }
            
        } catch {
            await MainActor.run {
                self.handleAgentError(error)
            }
        }
    }
    
    private func requestSafetyAnalysis() async {
        guard !formData.propertyAddress.isEmpty else { return }
        
        do {
            let safetyData = createSafetyAssessmentData()
            let response = try await safetyService.assessSafetyRisks(safetyData)
            
            await MainActor.run {
                self.safetyProtocols = response.requiredProtocols
                self.agentRecommendations.append(contentsOf: response.recommendations.map { rec in
                    AgentRecommendation(
                        type: .safety,
                        message: rec,
                        priority: response.riskLevel == .critical ? .critical : .high,
                        agentSource: "safety-manager"
                    )
                })
            }
            
        } catch {
            await MainActor.run {
                self.handleAgentError(error)
            }
        }
    }
    
    private func calculateTreeScoreWithAgent() async {
        guard formData.height > 0 && formData.dbh > 0 else { return }
        
        do {
            let measurements = createTreeMeasurements()
            let response = try await treeScoreService.calculateTreeScore(measurements)
            
            await MainActor.run {
                self.formData.treeScore = response.treeScore
                self.agentRecommendations.append(contentsOf: response.recommendations.map { rec in
                    AgentRecommendation(
                        type: .calculation,
                        message: rec,
                        priority: .medium,
                        agentSource: "treescore-calculator"
                    )
                })
            }
            
        } catch {
            await MainActor.run {
                self.handleAgentError(error)
            }
        }
    }
    
    private func requestARGuidanceFromAgent() async {
        guard arSessionManager.isARActive else { return }
        
        do {
            let context = createARMeasurementContext()
            let response = try await arService.getMeasurementGuidance(context)
            
            await MainActor.run {
                self.realTimeGuidance = response.instructions.primaryInstruction
                // Handle visual guides and tips
            }
            
        } catch {
            await MainActor.run {
                self.handleAgentError(error)
            }
        }
    }
    
    // MARK: - Response Handlers
    
    private func handleNextStepResponse(_ response: NextStepResponse) {
        currentStep = response.nextStep
        dynamicFormFields = response.formConfiguration.fields
        currentInstructions = response.instructions
        
        updateProgress()
        
        // Record agent decision
        let decision = AgentDecision(
            timestamp: Date(),
            agentType: "field-assessor",
            decision: "next-step",
            reasoning: response.instructions,
            confidence: response.confidence
        )
        agentDecisionHistory.append(decision)
        
        // Trigger additional agent analyses based on the step
        Task {
            switch currentStep {
            case .riskAssessment:
                await requestSafetyAnalysis()
            case .treeScoreCalculation:
                await calculateTreeScoreWithAgent()
            case .basicMeasurement:
                if arSessionManager.isARActive {
                    await requestARGuidanceFromAgent()
                }
            default:
                break
            }
        }
    }
    
    private func handleAgentError(_ error: Error) {
        let errorMessage = error.localizedDescription
        validationErrors.append(errorMessage)
        
        agentRecommendations.append(AgentRecommendation(
            type: .error,
            message: "Agent communication error: \(errorMessage)",
            priority: .high,
            agentSource: "system"
        ))
    }
    
    // MARK: - Data Creation Helpers
    
    private func createCurrentAssessmentData() -> AssessmentData {
        return AssessmentData(
            customerInfo: CustomerInfo(
                name: formData.customerName,
                email: "",
                phone: "",
                address: formData.propertyAddress
            ),
            property: PropertyInfo(
                address: formData.propertyAddress,
                type: assessmentContext.customerType,
                accessibility: AccessibilityRating(
                    vehicleAccess: 8,
                    equipmentAccess: 7,
                    workSpace: 6,
                    fallZone: 5
                )
            ),
            trees: [createTreeData()],
            currentStep: currentStep.rawValue,
            completedSteps: getCompletedSteps()
        )
    }
    
    private func createCompleteAssessment() -> CompleteAssessment {
        return CompleteAssessment(
            assessmentData: createCurrentAssessmentData(),
            measurements: createTreeMeasurements(),
            safetyAssessment: createSafetyAssessmentData(),
            calculatedScores: CalculatedScores(
                treeScore: formData.treeScore,
                riskScore: calculateCurrentRiskScore()
            )
        )
    }
    
    private func createTreeMeasurements() -> TreeMeasurements {
        return TreeMeasurements(
            height: formData.height,
            dbh: formData.dbh,
            crownRadius: formData.crownRadius,
            species: formData.treeSpecies,
            condition: .healthy, // Would be determined by agent
            location: LocationData(
                latitude: 0.0, // Would come from GPS
                longitude: 0.0,
                address: formData.propertyAddress,
                accessibility: AccessibilityRating(
                    vehicleAccess: 8,
                    equipmentAccess: 7,
                    workSpace: 6,
                    fallZone: 5
                )
            )
        )
    }
    
    private func createSafetyAssessmentData() -> SafetyAssessmentData {
        return SafetyAssessmentData(
            location: LocationData(
                latitude: 0.0,
                longitude: 0.0,
                address: formData.propertyAddress,
                accessibility: AccessibilityRating(
                    vehicleAccess: 8,
                    equipmentAccess: 7,
                    workSpace: 6,
                    fallZone: 5
                )
            ),
            powerLines: PowerLineProximity(
                present: formData.riskFactors.contains { $0.type == "Power Lines" },
                distance: 10.0,
                voltage: .residential
            ),
            structures: [],
            groundConditions: GroundConditions(
                slope: .level,
                surface: .grass,
                stability: .stable
            ),
            weather: WeatherConditions(
                windSpeed: 5.0,
                precipitation: 0.0,
                visibility: 10.0,
                temperature: 70.0
            ),
            traffic: TrafficConditions(
                volume: .low,
                speed: 25,
                proximityToRoad: 50.0
            )
        )
    }
    
    private func createARMeasurementContext() -> ARMeasurementContext {
        return ARMeasurementContext(
            measurementType: .height, // Would be determined by current need
            treeSpecies: formData.treeSpecies,
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
    
    private func createTreeData() -> TreeData {
        return TreeData(
            id: UUID().uuidString,
            species: formData.treeSpecies,
            measurements: formData.height > 0 ? createTreeMeasurements() : nil,
            condition: .healthy,
            riskFactors: formData.riskFactors
        )
    }
    
    // MARK: - Utility Methods
    
    private func getCompletedSteps() -> [String] {
        let allSteps: [AssessmentStep] = [.initialization, .basicMeasurement, .riskAssessment, .treeScoreCalculation, .completion]
        guard let currentIndex = allSteps.firstIndex(of: currentStep) else { return [] }
        return Array(allSteps[0..<currentIndex]).map { $0.rawValue }
    }
    
    private func updateProgress() {
        let allSteps: [AssessmentStep] = [.initialization, .basicMeasurement, .riskAssessment, .treeScoreCalculation, .completion]
        guard let currentIndex = allSteps.firstIndex(of: currentStep) else { return }
        progress = Float(currentIndex) / Float(allSteps.count - 1)
    }
    
    private func calculateCurrentRiskScore() -> Int {
        return formData.riskFactors.reduce(0) { sum, factor in
            switch factor.severity {
            case .low: return sum + 1
            case .medium: return sum + 3
            case .high: return sum + 5
            case .critical: return sum + 10
            }
        }
    }
    
    private func setupAgentWorkflow() {
        // Setup reactive agent communications
        // This would include real-time updates from agents
    }
    
    // MARK: - AR Integration with Agents
    
    func performAgentGuidedMeasurement(type: ARSessionManager.ARMode) async {
        // Get guidance from AR specialist agent first
        await requestARGuidanceFromAgent()
        
        // Perform the measurement with agent guidance
        arSessionManager.performQuickMeasurement(type: type) { [weak self] result in
            guard let self = self, let result = result else { return }
            
            Task {
                // Validate measurement with agent
                let validation = try? await self.arService.validateARMeasurement(
                    ARMeasurement(
                        type: type.rawValue,
                        value: result.value,
                        confidence: result.confidence,
                        timestamp: Date(),
                        metadata: result.metadata ?? [:]
                    )
                )
                
                await MainActor.run {
                    self.applyMeasurementResult(result)
                    
                    if let validation = validation {
                        if !validation.isValid {
                            self.agentRecommendations.append(AgentRecommendation(
                                type: .improvement,
                                message: "Measurement accuracy: \(Int(validation.accuracy * 100))%. Consider retaking.",
                                priority: validation.accuracy < 0.8 ? .high : .medium,
                                agentSource: "ar-specialist"
                            ))
                        }
                    }
                }
            }
        }
    }
    
    private func applyMeasurementResult(_ result: MeasurementResult) {
        switch result.type {
        case .height:
            formData.height = result.value
            formData.measurements["height"] = result
        case .dbh:
            formData.dbh = result.value
            formData.measurements["dbh"] = result
        case .crownRadius:
            formData.crownRadius = result.value
            formData.measurements["crownRadius"] = result
        default:
            break
        }
        
        // Trigger agent-driven validation and next step determination
        Task {
            await proceedToNextStep()
        }
    }
    
    // MARK: - Agent-Driven Completion
    
    func completeAgentDrivenAssessment() async {
        do {
            let completeAssessment = createCompleteAssessment()
            let report = try await assessmentService.generateAssessmentReport(completeAssessment)
            
            await MainActor.run {
                self.formData.assessmentReport = self.convertToAssessmentReport(report.report)
                self.isComplete = true
                self.progress = 1.0
                self.currentStep = .completion
                
                // Add final agent recommendations
                self.agentRecommendations.append(contentsOf: report.recommendations.map { rec in
                    AgentRecommendation(
                        type: .recommendation,
                        message: rec.description,
                        priority: rec.priority == "high" ? .high : .medium,
                        agentSource: "certified-arborist"
                    )
                })
            }
            
        } catch {
            await MainActor.run {
                self.handleAgentError(error)
            }
        }
    }
    
    private func convertToAssessmentReport(_ report: GeneratedReport) -> AssessmentReport {
        return AssessmentReport(
            id: UUID().uuidString,
            timestamp: Date(),
            customerName: formData.customerName,
            propertyAddress: formData.propertyAddress,
            treeScore: formData.treeScore,
            measurements: formData.measurements,
            riskFactors: formData.riskFactors,
            recommendations: report.recommendations,
            completedBy: "TreeAI Agent System"
        )
    }
}

// MARK: - Supporting Types

struct AgentRecommendation: Identifiable {
    let id = UUID()
    let type: RecommendationType
    let message: String
    let priority: Priority
    let agentSource: String
    let timestamp: Date = Date()
    
    enum RecommendationType {
        case safety, calculation, improvement, error, recommendation
    }
    
    enum Priority {
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
}

struct AgentDecision {
    let timestamp: Date
    let agentType: String
    let decision: String
    let reasoning: String
    let confidence: Double
}

struct DynamicFormField: Identifiable {
    let id: String
    let label: String
    let type: FieldType
    let required: Bool
    let options: [String]?
    let validationRules: [ValidationRule]
    let helpText: String?
    
    enum FieldType {
        case text, number, boolean, select, multiSelect, slider, measurement
    }
}

struct ValidationRule {
    let type: RuleType
    let value: Any
    let message: String
    
    enum RuleType {
        case required, min, max, pattern, custom
    }
}

// Additional supporting types for agent communication...
struct CustomerInfo: Codable {
    let name: String
    let email: String
    let phone: String
    let address: String
}

struct PropertyInfo: Codable {
    let address: String
    let type: String
    let accessibility: AccessibilityRating
}

struct TreeData: Codable {
    let id: String
    let species: String
    let measurements: TreeMeasurements?
    let condition: TreeCondition
    let riskFactors: [RiskFactor]
}

struct CompleteAssessment: Codable {
    let assessmentData: AssessmentData
    let measurements: TreeMeasurements
    let safetyAssessment: SafetyAssessmentData
    let calculatedScores: CalculatedScores
}

struct CalculatedScores: Codable {
    let treeScore: Int
    let riskScore: Int
}

struct TimeConstraints: Codable {
    let urgent: Bool
    let scheduledDate: Date?
}