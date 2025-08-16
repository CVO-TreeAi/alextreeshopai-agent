import SwiftUI

/// Container view that manages the assessment workflow and AR integration
struct AssessmentContainerView: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    @EnvironmentObject var arSessionManager: ARSessionManager
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ZStack {
            if arSessionManager.isARActive {
                // AR measurement interface
                ARMeasurementView()
                    .transition(.opacity)
            } else {
                // Form-based assessment interface
                AssessmentWorkflowView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: arSessionManager.isARActive)
        .onAppear {
            // Initialize assessment if needed
            if workflowManager.currentStep == .initialization && !workflowManager.isComplete {
                // Already in workflow
            }
        }
    }
}

/// Main assessment workflow view with step navigation
struct AssessmentWorkflowView: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    @EnvironmentObject var arSessionManager: ARSessionManager
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Progress indicator
                AssessmentProgressBar()
                
                // Main content area
                ScrollView {
                    VStack(spacing: 20) {
                        // Step header
                        AssessmentStepHeader()
                        
                        // Dynamic content based on current step
                        currentStepView
                            .padding(.horizontal)
                    }
                }
                .background(Color(.systemGroupedBackground))
                
                // Bottom action bar
                AssessmentActionBar()
            }
            .navigationTitle("Tree Assessment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if workflowManager.currentStep != .initialization {
                        Button("Back") {
                            workflowManager.previousStep()
                        }
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        // Show confirmation dialog
                    }
                    .foregroundColor(.red)
                }
            }
        }
        .navigationViewStyle(.stack)
    }
    
    @ViewBuilder
    private var currentStepView: some View {
        switch workflowManager.currentStep {
        case .initialization:
            InitializationFormView()
        case .basicMeasurement:
            BasicMeasurementFormView()
        case .riskAssessment:
            RiskAssessmentFormView()
        case .treeScoreCalculation:
            TreeScoreCalculationView()
        case .completion:
            AssessmentCompletionView()
        }
    }
}

/// Progress bar showing assessment completion
struct AssessmentProgressBar: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    
    private let steps: [AssessmentStep] = [
        .initialization, .basicMeasurement, .riskAssessment, .treeScoreCalculation, .completion
    ]
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                ForEach(Array(steps.enumerated()), id: \.element) { index, step in
                    // Step circle
                    ZStack {
                        Circle()
                            .fill(stepColor(for: step))
                            .frame(width: 24, height: 24)
                        
                        if isStepCompleted(step) {
                            Image(systemName: "checkmark")
                                .font(.caption.weight(.bold))
                                .foregroundColor(.white)
                        } else if step == workflowManager.currentStep {
                            Circle()
                                .fill(Color.white)
                                .frame(width: 8, height: 8)
                        }
                    }
                    
                    // Connecting line
                    if index < steps.count - 1 {
                        Rectangle()
                            .fill(isStepCompleted(step) ? Color.blue : Color.gray.opacity(0.3))
                            .frame(height: 2)
                            .frame(maxWidth: .infinity)
                    }
                }
            }
            .padding(.horizontal)
            
            // Progress percentage
            Text("\(Int(workflowManager.progress * 100))% Complete")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
    }
    
    private func stepColor(for step: AssessmentStep) -> Color {
        if isStepCompleted(step) {
            return .blue
        } else if step == workflowManager.currentStep {
            return .blue
        } else {
            return .gray.opacity(0.3)
        }
    }
    
    private func isStepCompleted(_ step: AssessmentStep) -> Bool {
        let stepIndex = steps.firstIndex(of: step) ?? 0
        let currentIndex = steps.firstIndex(of: workflowManager.currentStep) ?? 0
        return stepIndex < currentIndex
    }
}

/// Header for current assessment step
struct AssessmentStepHeader: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    
    var body: some View {
        VStack(spacing: 12) {
            // Step icon and title
            HStack {
                Image(systemName: workflowManager.currentStep.icon)
                    .font(.title2.weight(.semibold))
                    .foregroundColor(.blue)
                    .frame(width: 32)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(workflowManager.currentStep.displayName)
                        .font(.title2.weight(.semibold))
                        .foregroundColor(.primary)
                    
                    Text(workflowManager.currentStep.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            // Current question
            if let question = workflowManager.currentQuestion {
                Text(question.text)
                    .font(.body)
                    .foregroundColor(.primary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
            }
            
            // Validation errors
            if !workflowManager.validationErrors.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(workflowManager.validationErrors, id: \.self) { error in
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.red)
                                .font(.caption)
                            
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                }
                .padding()
                .background(Color.red.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding(.horizontal)
    }
}

/// Initialization form for basic property information
struct InitializationFormView: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    
    var body: some View {
        VStack(spacing: 20) {
            FormField(
                title: "Customer Name",
                text: $workflowManager.formData.customerName,
                placeholder: "Enter customer name",
                isRequired: true
            )
            
            FormField(
                title: "Property Address",
                text: $workflowManager.formData.propertyAddress,
                placeholder: "Enter property address",
                isRequired: true
            )
            
            FormField(
                title: "Tree Species",
                text: $workflowManager.formData.treeSpecies,
                placeholder: "Enter species if known (optional)",
                isRequired: false
            )
            
            // Quick location picker
            LocationPickerButton()
        }
    }
}

/// Basic measurement form with AR integration
struct BasicMeasurementFormView: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    @EnvironmentObject var arSessionManager: ARSessionManager
    
    var body: some View {
        VStack(spacing: 20) {
            // Height measurement
            MeasurementInputCard(
                title: "Tree Height",
                value: workflowManager.formData.height,
                unit: "ft",
                icon: "ruler.fill",
                measurementType: .height,
                onMeasure: {
                    workflowManager.performMeasurement(type: .heightMeasurement)
                }
            )
            
            // DBH measurement
            MeasurementInputCard(
                title: "Diameter at Breast Height",
                value: workflowManager.formData.dbh,
                unit: "in",
                icon: "circle.dashed",
                measurementType: .dbh,
                onMeasure: {
                    workflowManager.performMeasurement(type: .dbhMeasurement)
                }
            )
            
            // Crown radius measurement
            MeasurementInputCard(
                title: "Crown Radius",
                value: workflowManager.formData.crownRadius,
                unit: "ft",
                icon: "circle.dotted",
                measurementType: .crownRadius,
                onMeasure: {
                    workflowManager.performMeasurement(type: .crownMeasurement)
                }
            )
            
            // AR session indicator
            if arSessionManager.isARActive {
                ARStatusIndicator()
            }
        }
    }
}

/// Risk assessment form
struct RiskAssessmentFormView: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    
    var body: some View {
        VStack(spacing: 20) {
            // Risk factor toggles
            RiskFactorToggle(
                title: "Power Lines Nearby",
                subtitle: "Tree is within 25 feet of power lines",
                isChecked: hasRiskFactor("Power Lines")
            ) { isChecked in
                toggleRiskFactor("Power Lines", severity: .high, isChecked: isChecked)
            }
            
            RiskFactorToggle(
                title: "Structural Issues",
                subtitle: "Visible cracks, cavities, or weak branches",
                isChecked: hasRiskFactor("Structural Issues")
            ) { isChecked in
                toggleRiskFactor("Structural Issues", severity: .medium, isChecked: isChecked)
            }
            
            RiskFactorToggle(
                title: "Dead or Dying Branches",
                subtitle: "Significant deadwood present",
                isChecked: hasRiskFactor("Dead Branches")
            ) { isChecked in
                toggleRiskFactor("Dead Branches", severity: .medium, isChecked: isChecked)
            }
            
            RiskFactorToggle(
                title: "Property Damage Risk",
                subtitle: "Tree could damage buildings or vehicles",
                isChecked: hasRiskFactor("Property Damage Risk")
            ) { isChecked in
                toggleRiskFactor("Property Damage Risk", severity: .high, isChecked: isChecked)
            }
            
            // AR-based risk assessment button
            Button(action: {
                workflowManager.performMeasurement(type: .riskAssessment)
            }) {
                HStack {
                    Image(systemName: "viewfinder.rectangular")
                        .font(.headline)
                    
                    Text("AI Risk Scan")
                        .font(.headline.weight(.semibold))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.orange)
                .cornerRadius(12)
            }
        }
    }
    
    private func hasRiskFactor(_ type: String) -> Bool {
        workflowManager.formData.riskFactors.contains { $0.type == type }
    }
    
    private func toggleRiskFactor(_ type: String, severity: RiskFactor.RiskSeverity, isChecked: Bool) {
        if isChecked {
            let riskFactor = RiskFactor(
                type: type,
                severity: severity,
                description: "\(type) identified during assessment"
            )
            workflowManager.formData.riskFactors.append(riskFactor)
        } else {
            workflowManager.formData.riskFactors.removeAll { $0.type == type }
        }
    }
}

/// TreeScore calculation and display
struct TreeScoreCalculationView: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    @State private var isCalculating = false
    
    var body: some View {
        VStack(spacing: 24) {
            if isCalculating {
                VStack(spacing: 16) {
                    ProgressView()
                        .scaleEffect(1.5)
                    
                    Text("Calculating TreeScore...")
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
                .frame(height: 200)
            } else {
                TreeScoreDisplayCard(
                    score: workflowManager.formData.treeScore,
                    measurements: [
                        ("Height", workflowManager.formData.height, "ft"),
                        ("DBH", workflowManager.formData.dbh, "in"),
                        ("Crown", workflowManager.formData.crownRadius, "ft")
                    ],
                    riskFactors: workflowManager.formData.riskFactors
                )
            }
            
            Button("Recalculate") {
                recalculateScore()
            }
            .buttonStyle(.bordered)
        }
        .onAppear {
            calculateScore()
        }
    }
    
    private func calculateScore() {
        isCalculating = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            workflowManager.formData.treeScore = workflowManager.calculateTreeScore()
            isCalculating = false
        }
    }
    
    private func recalculateScore() {
        calculateScore()
    }
}

/// Assessment completion view
struct AssessmentCompletionView: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    
    var body: some View {
        VStack(spacing: 24) {
            // Success indicator
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)
            
            Text("Assessment Complete!")
                .font(.title.weight(.bold))
            
            // Summary card
            AssessmentSummaryCard()
            
            // Additional notes
            VStack(alignment: .leading, spacing: 8) {
                Text("Additional Notes (Optional)")
                    .font(.headline)
                
                TextEditor(text: $workflowManager.formData.additionalNotes)
                    .frame(height: 100)
                    .padding(8)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
            
            // Action buttons
            VStack(spacing: 12) {
                Button("Generate Report") {
                    // Generate and share report
                }
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)
                
                Button("Start New Assessment") {
                    workflowManager.startAssessment()
                }
                .buttonStyle(.bordered)
                .frame(maxWidth: .infinity)
            }
        }
    }
}

/// Bottom action bar for workflow navigation
struct AssessmentActionBar: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    
    var body: some View {
        VStack(spacing: 0) {
            Divider()
            
            HStack(spacing: 16) {
                if workflowManager.currentStep != .initialization {
                    Button("Previous") {
                        workflowManager.previousStep()
                    }
                    .buttonStyle(.bordered)
                }
                
                Spacer()
                
                if workflowManager.currentStep.isSkippable {
                    Button("Skip") {
                        workflowManager.skipStep()
                    }
                    .buttonStyle(.bordered)
                }
                
                Button(workflowManager.currentStep == .completion ? "Finish" : "Next") {
                    workflowManager.nextStep()
                }
                .buttonStyle(.borderedProminent)
                .disabled(workflowManager.isLoading)
            }
            .padding()
        }
        .background(Color(.systemBackground))
    }
}

#Preview {
    AssessmentContainerView()
        .environmentObject(AssessmentWorkflowManager())
        .environmentObject(ARSessionManager())
        .environmentObject(AppState())
}