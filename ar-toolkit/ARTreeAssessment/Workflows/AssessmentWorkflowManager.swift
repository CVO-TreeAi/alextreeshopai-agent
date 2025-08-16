import SwiftUI
import Combine

/// Workflow-driven assessment system that guides users through structured tree evaluation
class AssessmentWorkflowManager: ObservableObject {
    
    // MARK: - Published Properties
    @Published var currentStep: AssessmentStep = .initialization
    @Published var formData: AssessmentFormData = AssessmentFormData()
    @Published var isComplete: Bool = false
    @Published var progress: Float = 0.0
    @Published var isLoading: Bool = false
    @Published var currentQuestion: WorkflowQuestion?
    @Published var validationErrors: [String] = []
    
    // MARK: - Dependencies
    @Published var arSessionManager: ARSessionManager
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Workflow Configuration
    private let stepSequence: [AssessmentStep] = [
        .initialization,
        .basicMeasurement,
        .riskAssessment,
        .treeScoreCalculation,
        .completion
    ]
    
    init(arSessionManager: ARSessionManager = ARSessionManager()) {
        self.arSessionManager = arSessionManager
        setupWorkflow()
    }
    
    // MARK: - Workflow Control
    
    func startAssessment() {
        print("🚀 Starting tree assessment workflow")
        currentStep = .initialization
        progress = 0.0
        isComplete = false
        formData = AssessmentFormData()
        validationErrors = []
        
        moveToCurrentStep()
    }
    
    func nextStep() {
        guard !isComplete else { return }
        
        // Validate current step before proceeding
        if validateCurrentStep() {
            moveToNextStep()
        }
    }
    
    func previousStep() {
        guard currentStep != .initialization else { return }
        
        let currentIndex = stepSequence.firstIndex(of: currentStep) ?? 0
        if currentIndex > 0 {
            currentStep = stepSequence[currentIndex - 1]
            updateProgress()
            moveToCurrentStep()
        }
    }
    
    func skipStep() {
        // Allow skipping non-critical steps
        if currentStep.isSkippable {
            moveToNextStep()
        }
    }
    
    // MARK: - Step Management
    
    private func moveToNextStep() {
        let currentIndex = stepSequence.firstIndex(of: currentStep) ?? 0
        
        if currentIndex < stepSequence.count - 1 {
            currentStep = stepSequence[currentIndex + 1]
        } else {
            completeAssessment()
        }
        
        updateProgress()
        moveToCurrentStep()
    }
    
    private func moveToCurrentStep() {
        print("📍 Moving to step: \(currentStep.displayName)")
        
        // Clear previous errors
        validationErrors = []
        
        // Setup step-specific UI and AR requirements
        setupStepRequirements()
        
        // Load step questions
        loadQuestionsForCurrentStep()
        
        // Handle AR activation if needed
        handleARRequirements()
    }
    
    private func setupStepRequirements() {
        isLoading = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.isLoading = false
        }
    }
    
    private func loadQuestionsForCurrentStep() {
        currentQuestion = getQuestionForStep(currentStep)
    }
    
    private func handleARRequirements() {
        if arSessionManager.shouldActivateARForNextStep(currentStep) {
            let arMode = arSessionManager.getARModeForStep(currentStep)
            
            // Smooth transition to AR mode
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                self.arSessionManager.activateAR(for: arMode)
            }
        } else {
            // Return to chat mode if AR not needed
            arSessionManager.deactivateAR()
        }
    }
    
    // MARK: - Validation
    
    private func validateCurrentStep() -> Bool {
        validationErrors = []
        
        switch currentStep {
        case .initialization:
            if formData.propertyAddress.isEmpty {
                validationErrors.append("Property address is required")
            }
            if formData.customerName.isEmpty {
                validationErrors.append("Customer name is required")
            }
            
        case .basicMeasurement:
            if formData.height <= 0 {
                validationErrors.append("Tree height measurement is required")
            }
            if formData.dbh <= 0 {
                validationErrors.append("DBH measurement is required")
            }
            
        case .riskAssessment:
            if formData.riskFactors.isEmpty {
                validationErrors.append("At least one risk assessment is required")
            }
            
        case .treeScoreCalculation:
            // TreeScore is calculated automatically
            break
            
        case .completion:
            // Final validation
            break
        }
        
        return validationErrors.isEmpty
    }
    
    // MARK: - Progress Management
    
    private func updateProgress() {
        let currentIndex = stepSequence.firstIndex(of: currentStep) ?? 0
        progress = Float(currentIndex) / Float(stepSequence.count - 1)
    }
    
    private func completeAssessment() {
        print("✅ Assessment workflow completed")
        
        // Calculate final TreeScore
        formData.treeScore = calculateTreeScore()
        
        // Finalize assessment
        isComplete = true
        progress = 1.0
        currentStep = .completion
        
        // Ensure AR is deactivated
        arSessionManager.deactivateAR()
        
        // Generate assessment report
        generateAssessmentReport()
    }
    
    // MARK: - TreeScore Calculation
    
    func calculateTreeScore() -> Int {
        // TreeScore Formula: Height × (Crown Radius × 2) × (DBH ÷ 12)
        let score = formData.height * (formData.crownRadius * 2) * (formData.dbh / 12)
        
        // Apply risk factor adjustments
        var adjustedScore = score
        
        for riskFactor in formData.riskFactors {
            switch riskFactor.severity {
            case .low:
                adjustedScore *= 0.95
            case .medium:
                adjustedScore *= 0.85
            case .high:
                adjustedScore *= 0.70
            case .critical:
                adjustedScore *= 0.50
            }
        }
        
        return max(0, Int(adjustedScore))
    }
    
    // MARK: - AR Integration
    
    func performMeasurement(type: ARSessionManager.ARMode) {
        arSessionManager.performQuickMeasurement(type: type) { [weak self] result in
            guard let self = self, let result = result else { return }
            
            DispatchQueue.main.async {
                self.applyMeasurementResult(result)
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
            
        case .riskScore:
            if let metadata = result.metadata {
                updateRiskFactorsFromMetadata(metadata)
            }
            
        case .composite:
            if let metadata = result.metadata {
                formData.height = metadata["height"] as? Double ?? formData.height
                formData.dbh = metadata["dbh"] as? Double ?? formData.dbh
                formData.crownRadius = metadata["crownRadius"] as? Double ?? formData.crownRadius
            }
            
        case .unknown:
            break
        }
        
        // Auto-advance if measurement completes the step
        if isStepCompleteAfterMeasurement() {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.nextStep()
            }
        }
    }
    
    private func updateRiskFactorsFromMetadata(_ metadata: [String: Any]) {
        if let powerLines = metadata["powerLines"] as? Bool, powerLines {
            formData.riskFactors.append(RiskFactor(type: "Power Lines", severity: .high, description: "Power lines detected near tree"))
        }
        
        if let structuralIssues = metadata["structuralIssues"] as? Bool, structuralIssues {
            formData.riskFactors.append(RiskFactor(type: "Structural Issues", severity: .medium, description: "Structural defects detected"))
        }
        
        if let deadBranches = metadata["deadBranches"] as? Bool, deadBranches {
            formData.riskFactors.append(RiskFactor(type: "Dead Branches", severity: .medium, description: "Dead or dying branches present"))
        }
    }
    
    private func isStepCompleteAfterMeasurement() -> Bool {
        switch currentStep {
        case .basicMeasurement:
            return formData.height > 0 && formData.dbh > 0
        case .riskAssessment:
            return !formData.riskFactors.isEmpty
        default:
            return false
        }
    }
    
    // MARK: - Question Management
    
    private func getQuestionForStep(_ step: AssessmentStep) -> WorkflowQuestion? {
        switch step {
        case .initialization:
            return WorkflowQuestion(
                id: "init_property",
                text: "Let's start by getting some basic information about this property.",
                type: .info,
                fields: [
                    FormField(id: "customer_name", label: "Customer Name", type: .text, required: true),
                    FormField(id: "property_address", label: "Property Address", type: .text, required: true),
                    FormField(id: "tree_species", label: "Tree Species (if known)", type: .text, required: false)
                ]
            )
            
        case .basicMeasurement:
            return WorkflowQuestion(
                id: "basic_measurements",
                text: "Now I'll help you take some basic measurements of the tree.",
                type: .measurement,
                fields: [
                    FormField(id: "height", label: "Tree Height", type: .measurement, required: true, measurementType: .height),
                    FormField(id: "dbh", label: "Diameter at Breast Height (DBH)", type: .measurement, required: true, measurementType: .dbh),
                    FormField(id: "crown_radius", label: "Crown Radius", type: .measurement, required: false, measurementType: .crownRadius)
                ]
            )
            
        case .riskAssessment:
            return WorkflowQuestion(
                id: "risk_assessment",
                text: "Let's assess any potential risks or hazards associated with this tree.",
                type: .assessment,
                fields: [
                    FormField(id: "power_lines", label: "Power Lines Nearby", type: .boolean, required: true),
                    FormField(id: "structural_issues", label: "Structural Issues", type: .boolean, required: true),
                    FormField(id: "dead_branches", label: "Dead or Dying Branches", type: .boolean, required: true),
                    FormField(id: "property_damage_risk", label: "Property Damage Risk", type: .scale, required: true)
                ]
            )
            
        case .treeScoreCalculation:
            return WorkflowQuestion(
                id: "treescore_calculation",
                text: "Based on the measurements and risk assessment, I'll calculate the TreeScore.",
                type: .calculation,
                fields: []
            )
            
        case .completion:
            return WorkflowQuestion(
                id: "completion",
                text: "Assessment complete! Here's your comprehensive tree evaluation report.",
                type: .completion,
                fields: [
                    FormField(id: "additional_notes", label: "Additional Notes", type: .textarea, required: false)
                ]
            )
        }
    }
    
    // MARK: - Report Generation
    
    private func generateAssessmentReport() {
        print("📊 Generating assessment report")
        
        let report = AssessmentReport(
            id: UUID().uuidString,
            timestamp: Date(),
            customerName: formData.customerName,
            propertyAddress: formData.propertyAddress,
            treeScore: formData.treeScore,
            measurements: formData.measurements,
            riskFactors: formData.riskFactors,
            recommendations: generateRecommendations(),
            completedBy: "Alex AI Assistant"
        )
        
        formData.assessmentReport = report
    }
    
    private func generateRecommendations() -> [String] {
        var recommendations: [String] = []
        
        // TreeScore-based recommendations
        if formData.treeScore > 800 {
            recommendations.append("Excellent tree health. Routine maintenance recommended.")
        } else if formData.treeScore > 600 {
            recommendations.append("Good tree condition. Monitor for changes.")
        } else if formData.treeScore > 400 {
            recommendations.append("Tree requires attention. Professional assessment recommended.")
        } else {
            recommendations.append("Tree may pose risks. Immediate professional evaluation required.")
        }
        
        // Risk-based recommendations
        for riskFactor in formData.riskFactors {
            switch riskFactor.type {
            case "Power Lines":
                recommendations.append("Coordinate with utility company for power line clearance.")
            case "Structural Issues":
                recommendations.append("Structural assessment by certified arborist recommended.")
            case "Dead Branches":
                recommendations.append("Deadwood removal recommended for safety.")
            default:
                break
            }
        }
        
        return recommendations
    }
}

// MARK: - Supporting Types

struct AssessmentFormData {
    // Basic Information
    var customerName: String = ""
    var propertyAddress: String = ""
    var treeSpecies: String = ""
    
    // Measurements
    var height: Double = 0
    var dbh: Double = 0
    var crownRadius: Double = 0
    var measurements: [String: MeasurementResult] = [:]
    
    // Risk Assessment
    var riskFactors: [RiskFactor] = []
    
    // Calculated Values
    var treeScore: Int = 0
    
    // Additional Data
    var additionalNotes: String = ""
    var assessmentReport: AssessmentReport?
}

struct RiskFactor: Identifiable {
    let id = UUID()
    let type: String
    let severity: RiskSeverity
    let description: String
    
    enum RiskSeverity: String, CaseIterable {
        case low = "low"
        case medium = "medium"
        case high = "high"
        case critical = "critical"
        
        var color: Color {
            switch self {
            case .low: return .green
            case .medium: return .yellow
            case .high: return .orange
            case .critical: return .red
            }
        }
        
        var displayName: String {
            rawValue.capitalized
        }
    }
}

struct WorkflowQuestion: Identifiable {
    let id: String
    let text: String
    let type: QuestionType
    let fields: [FormField]
    
    enum QuestionType {
        case info, measurement, assessment, calculation, completion
    }
}

struct FormField: Identifiable {
    let id: String
    let label: String
    let type: FieldType
    let required: Bool
    let measurementType: MeasurementType?
    
    init(id: String, label: String, type: FieldType, required: Bool, measurementType: MeasurementType? = nil) {
        self.id = id
        self.label = label
        self.type = type
        self.required = required
        self.measurementType = measurementType
    }
    
    enum FieldType {
        case text, textarea, number, boolean, scale, measurement
    }
}

struct AssessmentReport: Identifiable {
    let id: String
    let timestamp: Date
    let customerName: String
    let propertyAddress: String
    let treeScore: Int
    let measurements: [String: MeasurementResult]
    let riskFactors: [RiskFactor]
    let recommendations: [String]
    let completedBy: String
}

// MARK: - Step Extensions

extension AssessmentStep {
    var isSkippable: Bool {
        switch self {
        case .initialization, .completion:
            return false
        case .basicMeasurement, .riskAssessment, .treeScoreCalculation:
            return true
        }
    }
    
    var estimatedDuration: TimeInterval {
        switch self {
        case .initialization: return 60    // 1 minute
        case .basicMeasurement: return 180 // 3 minutes
        case .riskAssessment: return 120   // 2 minutes
        case .treeScoreCalculation: return 30  // 30 seconds
        case .completion: return 60        // 1 minute
        }
    }
    
    var icon: String {
        switch self {
        case .initialization: return "info.circle.fill"
        case .basicMeasurement: return "ruler.fill"
        case .riskAssessment: return "exclamationmark.triangle.fill"
        case .treeScoreCalculation: return "function"
        case .completion: return "checkmark.circle.fill"
        }
    }
}