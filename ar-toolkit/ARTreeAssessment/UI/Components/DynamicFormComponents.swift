import SwiftUI

/// Dynamic form system that generates UI based on agent recommendations
struct DynamicFormView: View {
    @ObservedObject var workflowManager: AgentDrivenWorkflowManager
    @State private var formValues: [String: Any] = [:]
    @State private var validationErrors: [String: String] = [:]
    @State private var isSubmitting: Bool = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Instructions from agent
                if !workflowManager.currentInstructions.isEmpty {
                    AgentInstructionsCard(instructions: workflowManager.currentInstructions)
                }
                
                // Agent recommendations
                if !workflowManager.agentRecommendations.isEmpty {
                    AgentRecommendationsView(recommendations: workflowManager.agentRecommendations)
                }
                
                // Dynamic form fields
                LazyVStack(spacing: 16) {
                    ForEach(workflowManager.dynamicFormFields) { field in
                        DynamicFormFieldView(
                            field: field,
                            value: Binding(
                                get: { formValues[field.id] },
                                set: { formValues[field.id] = $0 }
                            ),
                            error: validationErrors[field.id]
                        )
                    }
                }
                
                // Safety protocols from agents
                if !workflowManager.safetyProtocols.isEmpty {
                    SafetyProtocolsView(protocols: workflowManager.safetyProtocols)
                }
                
                // Real-time guidance
                if !workflowManager.realTimeGuidance.isEmpty {
                    RealTimeGuidanceView(guidance: workflowManager.realTimeGuidance)
                }
                
                // Form actions
                HStack(spacing: 16) {
                    Button("Previous") {
                        Task {
                            await workflowManager.goToPreviousStep()
                        }
                    }
                    .buttonStyle(SecondaryButtonStyle())
                    .disabled(workflowManager.currentStep == .initialization)
                    
                    Spacer()
                    
                    Button("Continue") {
                        Task {
                            await submitForm()
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(isSubmitting || !isFormValid())
                }
                .padding(.top, 20)
            }
            .padding()
        }
        .overlay(
            Group {
                if workflowManager.isLoading || isSubmitting {
                    LoadingOverlay(message: isSubmitting ? "Processing with agents..." : "Loading next step...")
                }
            }
        )
    }
    
    private func submitForm() async {
        isSubmitting = true
        
        // Apply form values to workflow manager
        applyFormValuesToWorkflow()
        
        // Validate with agents
        let isValid = await validateWithAgents()
        
        if isValid {
            await workflowManager.proceedToNextStep()
        }
        
        isSubmitting = false
    }
    
    private func applyFormValuesToWorkflow() {
        for field in workflowManager.dynamicFormFields {
            if let value = formValues[field.id] {
                switch field.id {
                case "customer_name":
                    if let stringValue = value as? String {
                        workflowManager.formData.customerName = stringValue
                    }
                case "property_address":
                    if let stringValue = value as? String {
                        workflowManager.formData.propertyAddress = stringValue
                    }
                case "tree_species":
                    if let stringValue = value as? String {
                        workflowManager.formData.treeSpecies = stringValue
                    }
                case "height":
                    if let doubleValue = value as? Double {
                        workflowManager.formData.height = doubleValue
                    }
                case "dbh":
                    if let doubleValue = value as? Double {
                        workflowManager.formData.dbh = doubleValue
                    }
                case "crown_radius":
                    if let doubleValue = value as? Double {
                        workflowManager.formData.crownRadius = doubleValue
                    }
                default:
                    break
                }
            }
        }
    }
    
    private func validateWithAgents() async -> Bool {
        validationErrors.removeAll()
        
        // Client-side validation first
        for field in workflowManager.dynamicFormFields {
            if field.required && (formValues[field.id] == nil || isEmpty(formValues[field.id])) {
                validationErrors[field.id] = "\(field.label) is required"
            }
            
            // Apply field-specific validation rules
            if let value = formValues[field.id] {
                for rule in field.validationRules {
                    if let error = validateRule(rule, value: value) {
                        validationErrors[field.id] = error
                        break
                    }
                }
            }
        }
        
        return validationErrors.isEmpty
    }
    
    private func validateRule(_ rule: ValidationRule, value: Any) -> String? {
        switch rule.type {
        case .min:
            if let doubleValue = value as? Double, let minValue = rule.value as? Double {
                if doubleValue < minValue {
                    return rule.message
                }
            }
        case .max:
            if let doubleValue = value as? Double, let maxValue = rule.value as? Double {
                if doubleValue > maxValue {
                    return rule.message
                }
            }
        case .pattern:
            if let stringValue = value as? String, let pattern = rule.value as? String {
                let regex = try? NSRegularExpression(pattern: pattern)
                let range = NSRange(location: 0, length: stringValue.utf16.count)
                if regex?.firstMatch(in: stringValue, options: [], range: range) == nil {
                    return rule.message
                }
            }
        default:
            break
        }
        return nil
    }
    
    private func isEmpty(_ value: Any?) -> Bool {
        if let string = value as? String {
            return string.isEmpty
        }
        if let number = value as? Double {
            return number == 0
        }
        return value == nil
    }
    
    private func isFormValid() -> Bool {
        for field in workflowManager.dynamicFormFields {
            if field.required && (formValues[field.id] == nil || isEmpty(formValues[field.id])) {
                return false
            }
        }
        return validationErrors.isEmpty
    }
}

// MARK: - Dynamic Form Field View

struct DynamicFormFieldView: View {
    let field: DynamicFormField
    @Binding var value: Any?
    let error: String?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(field.label)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if field.required {
                    Text("*")
                        .foregroundColor(.red)
                }
                
                Spacer()
                
                if let helpText = field.helpText {
                    Button(action: {
                        // Show help popup
                    }) {
                        Image(systemName: "questionmark.circle")
                            .foregroundColor(.blue)
                    }
                }
            }
            
            // Dynamic field input based on type
            switch field.type {
            case .text:
                TextField("Enter \(field.label.lowercased())", text: Binding(
                    get: { (value as? String) ?? "" },
                    set: { value = $0 }
                ))
                .textFieldStyle(RoundedBorderTextFieldStyle())
                
            case .number:
                HStack {
                    TextField("0", text: Binding(
                        get: { 
                            if let doubleValue = value as? Double {
                                return doubleValue == 0 ? "" : String(doubleValue)
                            }
                            return ""
                        },
                        set: { 
                            value = Double($0) ?? 0
                        }
                    ))
                    .keyboardType(.decimalPad)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    if field.id.contains("height") {
                        Text("ft")
                            .foregroundColor(.secondary)
                    } else if field.id.contains("dbh") || field.id.contains("radius") {
                        Text("in")
                            .foregroundColor(.secondary)
                    }
                }
                
            case .boolean:
                Toggle("", isOn: Binding(
                    get: { (value as? Bool) ?? false },
                    set: { value = $0 }
                ))
                
            case .select:
                Picker("Select \(field.label)", selection: Binding(
                    get: { (value as? String) ?? "" },
                    set: { value = $0 }
                )) {
                    Text("Select...").tag("")
                    ForEach(field.options ?? [], id: \.self) { option in
                        Text(option).tag(option)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                
            case .multiSelect:
                // Implementation for multi-select
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(field.options ?? [], id: \.self) { option in
                        MultiSelectRow(
                            option: option,
                            isSelected: (value as? [String])?.contains(option) ?? false,
                            onToggle: { isSelected in
                                var selected = (value as? [String]) ?? []
                                if isSelected {
                                    selected.append(option)
                                } else {
                                    selected.removeAll { $0 == option }
                                }
                                value = selected
                            }
                        )
                    }
                }
                
            case .slider:
                VStack {
                    Slider(
                        value: Binding(
                            get: { (value as? Double) ?? 0 },
                            set: { value = $0 }
                        ),
                        in: 0...10,
                        step: 1
                    )
                    Text("Value: \(Int((value as? Double) ?? 0))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
            case .measurement:
                MeasurementFieldView(
                    field: field,
                    value: Binding(
                        get: { (value as? Double) ?? 0 },
                        set: { value = $0 }
                    )
                )
            }
            
            // Error message
            if let error = error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }
}

// MARK: - Measurement Field View

struct MeasurementFieldView: View {
    let field: DynamicFormField
    @Binding var value: Double
    @EnvironmentObject var workflowManager: AgentDrivenWorkflowManager
    
    var body: some View {
        HStack {
            TextField("0.0", text: Binding(
                get: { value == 0 ? "" : String(format: "%.1f", value) },
                set: { value = Double($0) ?? 0 }
            ))
            .keyboardType(.decimalPad)
            .textFieldStyle(RoundedBorderTextFieldStyle())
            
            Button("Measure with AR") {
                Task {
                    let measurementType = determineMeasurementType()
                    await workflowManager.performAgentGuidedMeasurement(type: measurementType)
                }
            }
            .buttonStyle(SecondaryButtonStyle())
            .disabled(!workflowManager.arSessionManager.isARSupported)
        }
    }
    
    private func determineMeasurementType() -> ARSessionManager.ARMode {
        if field.id.contains("height") {
            return .height
        } else if field.id.contains("dbh") {
            return .dbh
        } else if field.id.contains("radius") {
            return .crownRadius
        }
        return .height
    }
}

// MARK: - Supporting Views

struct MultiSelectRow: View {
    let option: String
    let isSelected: Bool
    let onToggle: (Bool) -> Void
    
    var body: some View {
        HStack {
            Button(action: {
                onToggle(!isSelected)
            }) {
                HStack {
                    Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                        .foregroundColor(isSelected ? .blue : .gray)
                    Text(option)
                        .foregroundColor(.primary)
                    Spacer()
                }
            }
        }
        .padding(.vertical, 2)
    }
}

struct AgentInstructionsCard: View {
    let instructions: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(.blue)
                Text("Agent Instructions")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            Text(instructions)
                .font(.body)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct AgentRecommendationsView: View {
    let recommendations: [AgentRecommendation]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "lightbulb")
                    .foregroundColor(.orange)
                Text("Agent Recommendations")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            ForEach(recommendations.prefix(3)) { recommendation in
                AgentRecommendationRow(recommendation: recommendation)
            }
            
            if recommendations.count > 3 {
                Button("View all \(recommendations.count) recommendations") {
                    // Show all recommendations
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct AgentRecommendationRow: View {
    let recommendation: AgentRecommendation
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle()
                .fill(recommendation.priority.color)
                .frame(width: 8, height: 8)
                .padding(.top, 6)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(recommendation.message)
                    .font(.subheadline)
                
                Text("from \(recommendation.agentSource)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
    }
}

struct SafetyProtocolsView: View {
    let protocols: [SafetyProtocol]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "shield.fill")
                    .foregroundColor(.red)
                Text("Required Safety Protocols")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            ForEach(protocols, id: \.id) { protocol in
                SafetyProtocolRow(protocol: protocol)
            }
        }
        .padding()
        .background(Color(.systemRed).opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.red.opacity(0.3), lineWidth: 1)
        )
    }
}

struct SafetyProtocolRow: View {
    let protocol: SafetyProtocol
    
    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(protocol.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let description = protocol.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
    }
}

struct RealTimeGuidanceView: View {
    let guidance: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "eye.circle.fill")
                    .foregroundColor(.green)
                Text("Real-time AR Guidance")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            Text(guidance)
                .font(.body)
                .foregroundColor(.primary)
        }
        .padding()
        .background(Color(.systemGreen).opacity(0.1))
        .cornerRadius(12)
    }
}

struct LoadingOverlay: View {
    let message: String
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
            
            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.2)
                
                Text(message)
                    .font(.subheadline)
                    .multilineTextAlignment(.center)
            }
            .padding(24)
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 10)
        }
    }
}

// MARK: - Button Styles

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(.white)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.blue)
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(.blue)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.blue.opacity(0.1))
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
    }
}

// MARK: - Supporting Data Types

struct SafetyProtocol: Identifiable {
    let id: String
    let name: String
    let description: String?
    let required: Bool
    let equipment: [String]
    let certifications: [String]
}

// Additional supporting types would be defined in AgentServices.swift