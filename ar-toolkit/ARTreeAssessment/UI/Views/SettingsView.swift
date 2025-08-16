import SwiftUI

/// Professional settings screen for tree service operations
struct SettingsView: View {
    @State private var userProfile = UserProfile.defaultProfile()
    @State private var appSettings = AppSettings.defaultSettings()
    @State private var showingProfileEdit = false
    @State private var showingAbout = false
    
    var body: some View {
        NavigationView {
            List {
                // User Profile Section
                Section {
                    ProfileHeaderView(profile: userProfile) {
                        showingProfileEdit = true
                    }
                } header: {
                    Text("Profile")
                }
                
                // Assessment Settings
                Section {
                    MeasurementUnitsRow(settings: $appSettings)
                    AccuracySettingsRow(settings: $appSettings)
                    AutoSaveRow(settings: $appSettings)
                    DefaultTreeSpeciesRow(settings: $appSettings)
                } header: {
                    Text("Assessment Settings")
                }
                
                // AR & Camera Settings
                Section {
                    ARSettingsRow(settings: $appSettings)
                    CameraQualityRow(settings: $appSettings)
                    ARGuidanceRow(settings: $appSettings)
                } header: {
                    Text("AR & Camera")
                }
                
                // Safety Settings
                Section {
                    SafetyRemindersRow(settings: $appSettings)
                    EmergencyContactsRow()
                    WeatherIntegrationRow(settings: $appSettings)
                } header: {
                    Text("Safety")
                }
                
                // Data & Storage
                Section {
                    DataSyncRow(settings: $appSettings)
                    StorageManagementRow()
                    ExportDataRow()
                } header: {
                    Text("Data & Storage")
                }
                
                // App Information
                Section {
                    AboutRow { showingAbout = true }
                    VersionInfoRow()
                    SupportRow()
                    PrivacyPolicyRow()
                } header: {
                    Text("About")
                }
                
                // Advanced Settings
                Section {
                    DiagnosticsRow()
                    DebugModeRow(settings: $appSettings)
                    ResetAppRow()
                } header: {
                    Text("Advanced")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
        }
        .navigationViewStyle(.stack)
        .sheet(isPresented: $showingProfileEdit) {
            ProfileEditView(profile: $userProfile)
        }
        .sheet(isPresented: $showingAbout) {
            AboutView()
        }
    }
}

/// User profile header with avatar and basic info
struct ProfileHeaderView: View {
    let profile: UserProfile
    let onEdit: () -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            // Profile avatar
            AsyncImage(url: URL(string: profile.avatarURL)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.blue)
            }
            .frame(width: 60, height: 60)
            .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(profile.fullName)
                    .font(.headline.weight(.semibold))
                    .foregroundColor(.primary)
                
                Text(profile.title)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text(profile.company)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button("Edit") {
                onEdit()
            }
            .font(.subheadline.weight(.semibold))
            .foregroundColor(.blue)
        }
        .padding(.vertical, 8)
    }
}

/// Measurement units selection
struct MeasurementUnitsRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        HStack {
            Image(systemName: "ruler.fill")
                .foregroundColor(.blue)
                .frame(width: 24)
            
            Text("Measurement Units")
            
            Spacer()
            
            Picker("Units", selection: $settings.measurementUnits) {
                Text("Imperial (ft/in)").tag(MeasurementUnits.imperial)
                Text("Metric (m/cm)").tag(MeasurementUnits.metric)
            }
            .pickerStyle(.menu)
        }
    }
}

/// AR accuracy settings
struct AccuracySettingsRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        NavigationLink(destination: AccuracySettingsView(settings: $settings)) {
            HStack {
                Image(systemName: "target")
                    .foregroundColor(.green)
                    .frame(width: 24)
                
                VStack(alignment: .leading) {
                    Text("Measurement Accuracy")
                    Text("Current: \(settings.accuracyLevel.displayName)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

/// Auto-save toggle
struct AutoSaveRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        HStack {
            Image(systemName: "square.and.arrow.down.fill")
                .foregroundColor(.orange)
                .frame(width: 24)
            
            Text("Auto-save Assessments")
            
            Spacer()
            
            Toggle("", isOn: $settings.autoSaveEnabled)
        }
    }
}

/// Default tree species setting
struct DefaultTreeSpeciesRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        NavigationLink(destination: TreeSpeciesSelectionView(selectedSpecies: $settings.defaultTreeSpecies)) {
            HStack {
                Image(systemName: "tree.fill")
                    .foregroundColor(.green)
                    .frame(width: 24)
                
                VStack(alignment: .leading) {
                    Text("Default Tree Species")
                    Text(settings.defaultTreeSpecies.isEmpty ? "None selected" : settings.defaultTreeSpecies)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

/// AR settings row
struct ARSettingsRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        NavigationLink(destination: ARSettingsDetailView(settings: $settings)) {
            HStack {
                Image(systemName: "viewfinder.rectangular")
                    .foregroundColor(.purple)
                    .frame(width: 24)
                
                VStack(alignment: .leading) {
                    Text("AR Configuration")
                    Text("Optimize AR performance")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

/// Camera quality settings
struct CameraQualityRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        HStack {
            Image(systemName: "camera.fill")
                .foregroundColor(.blue)
                .frame(width: 24)
            
            Text("Camera Quality")
            
            Spacer()
            
            Picker("Quality", selection: $settings.cameraQuality) {
                Text("High").tag(CameraQuality.high)
                Text("Medium").tag(CameraQuality.medium)
                Text("Low").tag(CameraQuality.low)
            }
            .pickerStyle(.menu)
        }
    }
}

/// AR guidance toggle
struct ARGuidanceRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        HStack {
            Image(systemName: "lightbulb.fill")
                .foregroundColor(.yellow)
                .frame(width: 24)
            
            Text("AR Guidance")
            
            Spacer()
            
            Toggle("", isOn: $settings.arGuidanceEnabled)
        }
    }
}

/// Safety reminders toggle
struct SafetyRemindersRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        HStack {
            Image(systemName: "shield.checkerboard")
                .foregroundColor(.orange)
                .frame(width: 24)
            
            Text("Safety Reminders")
            
            Spacer()
            
            Toggle("", isOn: $settings.safetyRemindersEnabled)
        }
    }
}

/// Emergency contacts management
struct EmergencyContactsRow: View {
    var body: some View {
        NavigationLink(destination: EmergencyContactsView()) {
            HStack {
                Image(systemName: "phone.fill")
                    .foregroundColor(.red)
                    .frame(width: 24)
                
                VStack(alignment: .leading) {
                    Text("Emergency Contacts")
                    Text("Manage emergency contact list")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

/// Weather integration toggle
struct WeatherIntegrationRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        HStack {
            Image(systemName: "cloud.sun.fill")
                .foregroundColor(.blue)
                .frame(width: 24)
            
            Text("Weather Integration")
            
            Spacer()
            
            Toggle("", isOn: $settings.weatherIntegrationEnabled)
        }
    }
}

/// Data sync settings
struct DataSyncRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        NavigationLink(destination: DataSyncSettingsView(settings: $settings)) {
            HStack {
                Image(systemName: "icloud.fill")
                    .foregroundColor(.blue)
                    .frame(width: 24)
                
                VStack(alignment: .leading) {
                    Text("Data Sync")
                    Text(settings.dataSyncEnabled ? "Enabled" : "Disabled")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

/// Storage management
struct StorageManagementRow: View {
    @State private var storageUsed = "245 MB"
    
    var body: some View {
        NavigationLink(destination: StorageManagementView()) {
            HStack {
                Image(systemName: "internaldrive.fill")
                    .foregroundColor(.gray)
                    .frame(width: 24)
                
                VStack(alignment: .leading) {
                    Text("Storage Management")
                    Text("Used: \(storageUsed)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

/// Export data row
struct ExportDataRow: View {
    var body: some View {
        Button(action: exportData) {
            HStack {
                Image(systemName: "square.and.arrow.up.fill")
                    .foregroundColor(.green)
                    .frame(width: 24)
                
                Text("Export Data")
                    .foregroundColor(.primary)
                
                Spacer()
            }
        }
    }
    
    private func exportData() {
        // Implementation for data export
    }
}

/// About app row
struct AboutRow: View {
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundColor(.blue)
                    .frame(width: 24)
                
                Text("About TreeAI")
                    .foregroundColor(.primary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
        }
    }
}

/// Version information
struct VersionInfoRow: View {
    var body: some View {
        HStack {
            Image(systemName: "gear.circle.fill")
                .foregroundColor(.gray)
                .frame(width: 24)
            
            Text("Version")
            
            Spacer()
            
            Text("1.0.0 (Build 100)")
                .foregroundColor(.secondary)
        }
    }
}

/// Support row
struct SupportRow: View {
    var body: some View {
        Button(action: contactSupport) {
            HStack {
                Image(systemName: "questionmark.circle.fill")
                    .foregroundColor(.purple)
                    .frame(width: 24)
                
                Text("Contact Support")
                    .foregroundColor(.primary)
                
                Spacer()
            }
        }
    }
    
    private func contactSupport() {
        if let url = URL(string: "mailto:support@treeai.com") {
            UIApplication.shared.open(url)
        }
    }
}

/// Privacy policy row
struct PrivacyPolicyRow: View {
    var body: some View {
        Button(action: showPrivacyPolicy) {
            HStack {
                Image(systemName: "hand.raised.fill")
                    .foregroundColor(.blue)
                    .frame(width: 24)
                
                Text("Privacy Policy")
                    .foregroundColor(.primary)
                
                Spacer()
            }
        }
    }
    
    private func showPrivacyPolicy() {
        if let url = URL(string: "https://treeai.com/privacy") {
            UIApplication.shared.open(url)
        }
    }
}

/// Diagnostics row
struct DiagnosticsRow: View {
    var body: some View {
        NavigationLink(destination: DiagnosticsView()) {
            HStack {
                Image(systemName: "stethoscope")
                    .foregroundColor(.red)
                    .frame(width: 24)
                
                VStack(alignment: .leading) {
                    Text("Diagnostics")
                    Text("System performance and logs")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

/// Debug mode toggle
struct DebugModeRow: View {
    @Binding var settings: AppSettings
    
    var body: some View {
        HStack {
            Image(systemName: "ladybug.fill")
                .foregroundColor(.red)
                .frame(width: 24)
            
            Text("Debug Mode")
            
            Spacer()
            
            Toggle("", isOn: $settings.debugModeEnabled)
        }
    }
}

/// Reset app data
struct ResetAppRow: View {
    @State private var showingResetAlert = false
    
    var body: some View {
        Button(action: {
            showingResetAlert = true
        }) {
            HStack {
                Image(systemName: "trash.fill")
                    .foregroundColor(.red)
                    .frame(width: 24)
                
                Text("Reset App Data")
                    .foregroundColor(.red)
                
                Spacer()
            }
        }
        .alert("Reset App Data", isPresented: $showingResetAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Reset", role: .destructive) {
                resetAppData()
            }
        } message: {
            Text("This will permanently delete all app data including assessments, settings, and user profile. This action cannot be undone.")
        }
    }
    
    private func resetAppData() {
        // Implementation for resetting app data
    }
}

// MARK: - Supporting Types

struct UserProfile {
    var fullName: String
    var title: String
    var company: String
    var email: String
    var phone: String
    var certifications: [String]
    var avatarURL: String
    
    static func defaultProfile() -> UserProfile {
        return UserProfile(
            fullName: "John Smith",
            title: "Certified Arborist",
            company: "TreeCare Professional Services",
            email: "john.smith@treecare.com",
            phone: "(555) 123-4567",
            certifications: ["ISA Certified Arborist", "Tree Risk Assessment Qualified"],
            avatarURL: ""
        )
    }
}

struct AppSettings {
    var measurementUnits: MeasurementUnits = .imperial
    var accuracyLevel: AccuracyLevel = .high
    var autoSaveEnabled: Bool = true
    var defaultTreeSpecies: String = ""
    var cameraQuality: CameraQuality = .high
    var arGuidanceEnabled: Bool = true
    var safetyRemindersEnabled: Bool = true
    var weatherIntegrationEnabled: Bool = true
    var dataSyncEnabled: Bool = true
    var debugModeEnabled: Bool = false
    
    static func defaultSettings() -> AppSettings {
        return AppSettings()
    }
}

enum MeasurementUnits: String, CaseIterable {
    case imperial = "imperial"
    case metric = "metric"
    
    var displayName: String {
        switch self {
        case .imperial: return "Imperial (ft/in)"
        case .metric: return "Metric (m/cm)"
        }
    }
}

enum AccuracyLevel: String, CaseIterable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case precision = "precision"
    
    var displayName: String {
        switch self {
        case .low: return "Standard"
        case .medium: return "Enhanced"
        case .high: return "High Precision"
        case .precision: return "Survey Grade"
        }
    }
}

enum CameraQuality: String, CaseIterable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    
    var displayName: String {
        switch self {
        case .low: return "720p"
        case .medium: return "1080p"
        case .high: return "4K"
        }
    }
}

#Preview {
    SettingsView()
}