import SwiftUI

// MARK: - Form Components

/// Reusable form field component with validation
struct FormField: View {
    let title: String
    @Binding var text: String
    let placeholder: String
    let isRequired: Bool
    let keyboardType: UIKeyboardType
    let validation: ((String) -> String?)?
    
    @State private var isEditing = false
    @State private var validationError: String?
    
    init(
        title: String,
        text: Binding<String>,
        placeholder: String,
        isRequired: Bool = false,
        keyboardType: UIKeyboardType = .default,
        validation: ((String) -> String?)? = nil
    ) {
        self.title = title
        self._text = text
        self.placeholder = placeholder
        self.isRequired = isRequired
        self.keyboardType = keyboardType
        self.validation = validation
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Field label
            HStack {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                if isRequired {
                    Text("*")
                        .foregroundColor(.red)
                }
            }
            
            // Text field
            TextField(placeholder, text: $text, onEditingChanged: { editing in
                isEditing = editing
                if !editing {
                    validateField()
                }
            })
            .textFieldStyle(CustomTextFieldStyle(
                isError: validationError != nil,
                isFocused: isEditing
            ))
            .keyboardType(keyboardType)
            
            // Validation error
            if let error = validationError {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
        .onChange(of: text) { _ in
            if !isEditing {
                validateField()
            }
        }
    }
    
    private func validateField() {
        if let validation = validation {
            validationError = validation(text)
        } else if isRequired && text.isEmpty {
            validationError = "\(title) is required"
        } else {
            validationError = nil
        }
    }
}

/// Custom text field style
struct CustomTextFieldStyle: TextFieldStyle {
    let isError: Bool
    let isFocused: Bool
    
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(
                        isError ? Color.red :
                        isFocused ? Color.blue :
                        Color.clear,
                        lineWidth: 2
                    )
            )
    }
}

/// Measurement input card with AR integration
struct MeasurementInputCard: View {
    let title: String
    let value: Double
    let unit: String
    let icon: String
    let measurementType: MeasurementType
    let onMeasure: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.blue)
                
                Text(title)
                    .font(.headline.weight(.semibold))
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            // Value display
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(value > 0 ? String(format: "%.1f %@", value, unit) : "Not measured")
                        .font(.title2.weight(.bold))
                        .foregroundColor(value > 0 ? .primary : .secondary)
                    
                    if value > 0 {
                        Text("Measured")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
                
                Spacer()
                
                // AR measure button
                Button(action: onMeasure) {
                    HStack {
                        Image(systemName: "viewfinder.rectangular")
                        Text("Measure")
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.blue)
                    .cornerRadius(20)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

/// Risk factor toggle component
struct RiskFactorToggle: View {
    let title: String
    let subtitle: String
    let isChecked: Bool
    let onToggle: (Bool) -> Void
    
    var body: some View {
        Button(action: {
            onToggle(!isChecked)
        }) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: isChecked ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundColor(isChecked ? .orange : .gray)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isChecked ? Color.orange.opacity(0.3) : Color.gray.opacity(0.2), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

/// Location picker button
struct LocationPickerButton: View {
    @State private var showingLocationPicker = false
    @State private var selectedLocation = "Current Location"
    
    var body: some View {
        Button(action: {
            showingLocationPicker = true
        }) {
            HStack {
                Image(systemName: "location.fill")
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Location")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(selectedLocation)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 2)
        }
        .sheet(isPresented: $showingLocationPicker) {
            LocationPickerView(selectedLocation: $selectedLocation)
        }
    }
}

/// AR status indicator
struct ARStatusIndicator: View {
    @EnvironmentObject var arSessionManager: ARSessionManager
    
    var body: some View {
        HStack {
            // Status circle
            Circle()
                .fill(arSessionManager.sessionStatus.isActive ? Color.green : Color.red)
                .frame(width: 12, height: 12)
            
            VStack(alignment: .leading, spacing: 2) {
                Text("AR Session")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.primary)
                
                Text(arSessionManager.sessionStatus.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if arSessionManager.measurementState != .idle {
                Text(arSessionManager.measurementState.description)
                    .font(.caption)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Report Components

/// Reports view placeholder
struct ReportsView: View {
    @State private var assessmentReports: [AssessmentReport] = []
    
    var body: some View {
        NavigationView {
            VStack {
                if assessmentReports.isEmpty {
                    EmptyReportsView()
                } else {
                    ReportsListView(reports: assessmentReports)
                }
            }
            .navigationTitle("Reports")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Filter") {
                        // Show filter options
                    }
                }
            }
        }
        .navigationViewStyle(.stack)
        .onAppear {
            loadReports()
        }
    }
    
    private func loadReports() {
        // Load assessment reports
    }
}

/// Empty reports state view
struct EmptyReportsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "doc.text")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Reports Yet")
                .font(.title2.weight(.semibold))
                .foregroundColor(.primary)
            
            Text("Complete your first tree assessment to see reports here")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Start Assessment") {
                // Navigate to assessment
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

/// Reports list view
struct ReportsListView: View {
    let reports: [AssessmentReport]
    
    var body: some View {
        List(reports) { report in
            NavigationLink(destination: ReportDetailView(report: report)) {
                ReportRowView(report: report)
            }
        }
    }
}

/// Individual report row
struct ReportRowView: View {
    let report: AssessmentReport
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(report.customerName)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(report.propertyAddress)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text(report.timestamp, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                TreeScoreBadge(score: report.treeScore, compact: true)
                
                Text(report.completedBy)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

/// Report detail view
struct ReportDetailView: View {
    let report: AssessmentReport
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Report header
                ReportHeaderView(report: report)
                
                // TreeScore display
                TreeScoreDisplayCard(
                    score: report.treeScore,
                    measurements: [
                        ("Height", report.measurements["height"]?.value ?? 0, "ft"),
                        ("DBH", report.measurements["dbh"]?.value ?? 0, "in"),
                        ("Crown", report.measurements["crownRadius"]?.value ?? 0, "ft")
                    ],
                    riskFactors: report.riskFactors
                )
                
                // Recommendations
                RecommendationsSection(recommendations: report.recommendations)
            }
            .padding()
        }
        .navigationTitle("Assessment Report")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                ShareLink(item: generateReportURL(report)) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
    }
    
    private func generateReportURL(_ report: AssessmentReport) -> URL {
        // Generate shareable report URL
        return URL(string: "https://treeai.com/reports/\(report.id)")!
    }
}

/// Report header view
struct ReportHeaderView: View {
    let report: AssessmentReport
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(report.customerName)
                        .font(.title2.weight(.bold))
                        .foregroundColor(.primary)
                    
                    Text(report.propertyAddress)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            HStack {
                Text("Assessed by: \(report.completedBy)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(report.timestamp, style: .date)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

/// Recommendations section
struct RecommendationsSection: View {
    let recommendations: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommendations")
                .font(.headline.weight(.semibold))
                .foregroundColor(.primary)
            
            VStack(spacing: 8) {
                ForEach(Array(recommendations.enumerated()), id: \.offset) { index, recommendation in
                    HStack(alignment: .top) {
                        Text("\(index + 1).")
                            .font(.subheadline.weight(.semibold))
                            .foregroundColor(.blue)
                            .frame(width: 20, alignment: .leading)
                        
                        Text(recommendation)
                            .font(.subheadline)
                            .foregroundColor(.primary)
                        
                        Spacer()
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

// MARK: - Placeholder Views

/// Location picker view
struct LocationPickerView: View {
    @Binding var selectedLocation: String
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Location Picker")
                    .font(.title)
                
                Text("Map integration would go here")
                    .foregroundColor(.secondary)
                
                Button("Use Current Location") {
                    selectedLocation = "Current Location"
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
            }
            .navigationTitle("Select Location")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

/// Accuracy settings detail view
struct AccuracySettingsView: View {
    @Binding var settings: AppSettings
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        List {
            ForEach(AccuracyLevel.allCases, id: \.self) { level in
                HStack {
                    VStack(alignment: .leading) {
                        Text(level.displayName)
                            .font(.headline)
                        
                        Text(getAccuracyDescription(level))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    if settings.accuracyLevel == level {
                        Image(systemName: "checkmark")
                            .foregroundColor(.blue)
                    }
                }
                .contentShape(Rectangle())
                .onTapGesture {
                    settings.accuracyLevel = level
                    dismiss()
                }
            }
        }
        .navigationTitle("Accuracy Level")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func getAccuracyDescription(_ level: AccuracyLevel) -> String {
        switch level {
        case .low: return "±6 inches - Fast measurements"
        case .medium: return "±3 inches - Balanced speed and accuracy"
        case .high: return "±1 inch - High precision measurements"
        case .precision: return "±0.5 inches - Survey-grade accuracy"
        }
    }
}

/// Tree species selection view
struct TreeSpeciesSelectionView: View {
    @Binding var selectedSpecies: String
    @Environment(\.dismiss) private var dismiss
    
    let commonSpecies = [
        "Oak", "Maple", "Pine", "Elm", "Birch", "Cedar", "Willow", "Poplar", "Ash", "Cherry"
    ]
    
    var body: some View {
        List {
            Section("Common Species") {
                ForEach(commonSpecies, id: \.self) { species in
                    HStack {
                        Text(species)
                        Spacer()
                        if selectedSpecies == species {
                            Image(systemName: "checkmark")
                                .foregroundColor(.blue)
                        }
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedSpecies = species
                        dismiss()
                    }
                }
            }
            
            Section {
                HStack {
                    Text("None")
                    Spacer()
                    if selectedSpecies.isEmpty {
                        Image(systemName: "checkmark")
                            .foregroundColor(.blue)
                    }
                }
                .contentShape(Rectangle())
                .onTapGesture {
                    selectedSpecies = ""
                    dismiss()
                }
            }
        }
        .navigationTitle("Tree Species")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Additional Placeholder Views

/// AR settings detail view
struct ARSettingsDetailView: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        Form {
            Section("Performance") {
                Toggle("High Precision Mode", isOn: .constant(true))
                Toggle("Auto-calibration", isOn: .constant(true))
            }
            
            Section("Visual Settings") {
                Toggle("Show Grid Overlay", isOn: .constant(false))
                Toggle("Measurement History", isOn: .constant(true))
            }
        }
        .navigationTitle("AR Settings")
    }
}

/// Emergency contacts view
struct EmergencyContactsView: View {
    var body: some View {
        Text("Emergency Contacts Management")
            .navigationTitle("Emergency Contacts")
    }
}

/// Data sync settings view
struct DataSyncSettingsView: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        Form {
            Toggle("Automatic Sync", isOn: $settings.dataSyncEnabled)
            
            if settings.dataSyncEnabled {
                Section("Sync Options") {
                    Toggle("Sync on WiFi Only", isOn: .constant(true))
                    Toggle("Background Sync", isOn: .constant(false))
                }
            }
        }
        .navigationTitle("Data Sync")
    }
}

/// Storage management view
struct StorageManagementView: View {
    var body: some View {
        Text("Storage Management")
            .navigationTitle("Storage")
    }
}

/// Diagnostics view
struct DiagnosticsView: View {
    var body: some View {
        Text("System Diagnostics")
            .navigationTitle("Diagnostics")
    }
}

/// About view
struct AboutView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Image(systemName: "tree.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.green)
                
                Text("TreeAI")
                    .font(.largeTitle.weight(.bold))
                
                Text("Professional Tree Assessment")
                    .font(.headline)
                    .foregroundColor(.secondary)
                
                Text("Version 1.0.0")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Profile edit view
struct ProfileEditView: View {
    @Binding var profile: UserProfile
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section("Basic Information") {
                    TextField("Full Name", text: $profile.fullName)
                    TextField("Title", text: $profile.title)
                    TextField("Company", text: $profile.company)
                }
                
                Section("Contact") {
                    TextField("Email", text: $profile.email)
                    TextField("Phone", text: $profile.phone)
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        FormField(
            title: "Customer Name",
            text: .constant(""),
            placeholder: "Enter name",
            isRequired: true
        )
        
        MeasurementInputCard(
            title: "Tree Height",
            value: 45.5,
            unit: "ft",
            icon: "ruler.fill",
            measurementType: .height,
            onMeasure: {}
        )
        
        RiskFactorToggle(
            title: "Power Lines",
            subtitle: "Within 25 feet of power lines",
            isChecked: true,
            onToggle: { _ in }
        )
    }
    .padding()
}