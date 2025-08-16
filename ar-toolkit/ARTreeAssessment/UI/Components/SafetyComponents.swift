import SwiftUI

/// Emergency alert overlay for critical situations
struct EmergencyAlertOverlay: View {
    @EnvironmentObject var appState: AppState
    @State private var isFlashing = false
    
    var body: some View {
        ZStack {
            // Semi-transparent background
            Color.black.opacity(0.8)
                .ignoresSafeArea()
            
            VStack(spacing: 24) {
                // Flashing warning icon
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.red)
                    .scaleEffect(isFlashing ? 1.2 : 1.0)
                    .animation(
                        .easeInOut(duration: 0.5).repeatForever(autoreverses: true),
                        value: isFlashing
                    )
                
                VStack(spacing: 16) {
                    Text("EMERGENCY ALERT")
                        .font(.title.weight(.heavy))
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                    
                    Text("If this is a life-threatening emergency, call 911 immediately")
                        .font(.headline)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                }
                
                VStack(spacing: 12) {
                    // Emergency action buttons
                    Button("Call 911") {
                        if let url = URL(string: "tel://911") {
                            UIApplication.shared.open(url)
                        }
                    }
                    .font(.headline.weight(.bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red)
                    .cornerRadius(12)
                    
                    Button("Contact Supervisor") {
                        // Call supervisor
                        contactSupervisor()
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .cornerRadius(12)
                    
                    Button("Safety Protocols") {
                        // Show safety protocols
                        showSafetyProtocols()
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
                }
                
                Button("Cancel Alert") {
                    appState.showingEmergencyAlert = false
                }
                .font(.subheadline)
                .foregroundColor(.gray)
            }
            .padding(24)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(radius: 8)
            .padding(.horizontal, 32)
        }
        .onAppear {
            isFlashing = true
        }
    }
    
    private func contactSupervisor() {
        // Implementation for contacting supervisor
        if let url = URL(string: "tel://+1234567890") { // Replace with actual supervisor number
            UIApplication.shared.open(url)
        }
        appState.showingEmergencyAlert = false
    }
    
    private func showSafetyProtocols() {
        // Implementation for showing safety protocols
        appState.showingEmergencyAlert = false
    }
}

/// Safety banner shown during AR operations
struct SafetyBannerView: View {
    @EnvironmentObject var arSessionManager: ARSessionManager
    @State private var showingDetails = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Main banner
            HStack {
                Image(systemName: "shield.checkerboard")
                    .foregroundColor(.orange)
                    .font(.headline)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("AR Mode Active")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.primary)
                    
                    Text("Stay aware of surroundings")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: {
                    showingDetails.toggle()
                }) {
                    Image(systemName: showingDetails ? "chevron.up" : "info.circle")
                        .foregroundColor(.orange)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(.systemBackground).opacity(0.9))
            .overlay(
                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(.orange.opacity(0.3)),
                alignment: .bottom
            )
            
            // Expandable safety details
            if showingDetails {
                SafetyDetailsPanel()
                    .transition(.slide)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: showingDetails)
    }
}

/// Expandable safety details panel
struct SafetyDetailsPanel: View {
    let safetyItems = [
        SafetyItem(icon: "eye.fill", title: "Visual Awareness", description: "Look up from device regularly"),
        SafetyItem(icon: "bolt.fill", title: "Power Lines", description: "Maintain 25ft minimum distance"),
        SafetyItem(icon: "figure.walk", title: "Stable Footing", description: "Watch for holes, roots, obstacles"),
        SafetyItem(icon: "exclamationmark.triangle.fill", title: "Weather", description: "Avoid AR in high winds or storms")
    ]
    
    var body: some View {
        VStack(spacing: 8) {
            ForEach(safetyItems) { item in
                HStack {
                    Image(systemName: item.icon)
                        .foregroundColor(.orange)
                        .font(.caption)
                        .frame(width: 20)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.title)
                            .font(.caption.weight(.semibold))
                            .foregroundColor(.primary)
                        
                        Text(item.description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color(.systemBackground).opacity(0.9))
    }
}

/// Contextual safety alert for specific situations
struct ContextualSafetyAlert: View {
    let alertType: SafetyAlertType
    let onDismiss: () -> Void
    let onAction: (() -> Void)?
    
    var body: some View {
        HStack {
            Image(systemName: alertType.icon)
                .foregroundColor(alertType.color)
                .font(.title2)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(alertType.title)
                    .font(.headline.weight(.semibold))
                    .foregroundColor(.primary)
                
                Text(alertType.message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack {
                if let action = onAction {
                    Button(alertType.actionTitle ?? "Action") {
                        action()
                    }
                    .font(.caption.weight(.semibold))
                    .foregroundColor(alertType.color)
                }
                
                Button("Dismiss") {
                    onDismiss()
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(alertType.color.opacity(0.1))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(alertType.color.opacity(0.3), lineWidth: 1)
        )
        .cornerRadius(12)
    }
}

/// Safety checklist before starting assessment
struct SafetyChecklistView: View {
    @State private var checklistItems = SafetyChecklistItem.allItems()
    @State private var allItemsChecked = false
    let onComplete: () -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "shield.checkerboard")
                        .font(.system(size: 60))
                        .foregroundColor(.orange)
                    
                    Text("Safety Checklist")
                        .font(.title.weight(.bold))
                    
                    Text("Complete all safety checks before beginning assessment")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                
                // Checklist items
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach($checklistItems) { $item in
                            SafetyChecklistRow(item: $item) {
                                updateChecklistStatus()
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Continue button
                Button("Begin Assessment") {
                    onComplete()
                }
                .font(.headline.weight(.semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(allItemsChecked ? Color.green : Color.gray)
                .cornerRadius(12)
                .disabled(!allItemsChecked)
                .padding(.horizontal)
            }
            .navigationTitle("Safety Check")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            updateChecklistStatus()
        }
    }
    
    private func updateChecklistStatus() {
        allItemsChecked = checklistItems.allSatisfy { $0.isChecked }
    }
}

/// Individual safety checklist row
struct SafetyChecklistRow: View {
    @Binding var item: SafetyChecklistItem
    let onChange: () -> Void
    
    var body: some View {
        HStack {
            Button(action: {
                item.isChecked.toggle()
                onChange()
            }) {
                Image(systemName: item.isChecked ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(item.isChecked ? .green : .gray)
                    .font(.title2)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.primary)
                
                Text(item.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if item.severity == .critical {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)
                    .font(.caption)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(item.isChecked ? Color.green.opacity(0.3) : Color.gray.opacity(0.2), lineWidth: 1)
        )
    }
}

/// Weather safety indicator
struct WeatherSafetyIndicator: View {
    @State private var weatherCondition: WeatherSafetyLevel = .good
    @State private var windSpeed: Int = 5
    @State private var visibility: String = "Clear"
    
    var body: some View {
        HStack {
            Image(systemName: weatherCondition.icon)
                .foregroundColor(weatherCondition.color)
                .font(.title2)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Field Conditions")
                    .font(.headline.weight(.semibold))
                
                HStack {
                    Text(weatherCondition.displayName)
                        .font(.subheadline)
                        .foregroundColor(weatherCondition.color)
                    
                    Text("• \(windSpeed) mph wind")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            if weatherCondition != .good {
                Button("Details") {
                    // Show weather details
                }
                .font(.caption.weight(.semibold))
                .foregroundColor(weatherCondition.color)
            }
        }
        .padding()
        .background(weatherCondition.color.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(weatherCondition.color.opacity(0.3), lineWidth: 1)
        )
    }
}

/// PPE (Personal Protective Equipment) reminder
struct PPEReminderCard: View {
    let requiredPPE = [
        PPEItem(name: "Hard Hat", icon: "helmet.fill", isRequired: true),
        PPEItem(name: "Safety Glasses", icon: "eyeglasses", isRequired: true),
        PPEItem(name: "Work Gloves", icon: "hand.raised.fill", isRequired: true),
        PPEItem(name: "Steel-toed Boots", icon: "boot.fill", isRequired: true),
        PPEItem(name: "High-vis Vest", icon: "person.fill", isRequired: false)
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "shield.fill")
                    .foregroundColor(.blue)
                
                Text("PPE Requirements")
                    .font(.headline.weight(.semibold))
            }
            
            VStack(spacing: 8) {
                ForEach(requiredPPE, id: \.name) { item in
                    HStack {
                        Image(systemName: item.icon)
                            .foregroundColor(item.isRequired ? .orange : .gray)
                            .frame(width: 20)
                        
                        Text(item.name)
                            .font(.subheadline)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        Text(item.isRequired ? "Required" : "Recommended")
                            .font(.caption)
                            .foregroundColor(item.isRequired ? .orange : .gray)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

// MARK: - Supporting Types

struct SafetyItem: Identifiable {
    let id = UUID()
    let icon: String
    let title: String
    let description: String
}

enum SafetyAlertType {
    case powerLines
    case unstableGround
    case badWeather
    case equipmentIssue
    case lowBattery
    
    var icon: String {
        switch self {
        case .powerLines: return "bolt.fill"
        case .unstableGround: return "exclamationmark.triangle.fill"
        case .badWeather: return "cloud.rain.fill"
        case .equipmentIssue: return "wrench.and.screwdriver.fill"
        case .lowBattery: return "battery.25"
        }
    }
    
    var color: Color {
        switch self {
        case .powerLines: return .red
        case .unstableGround: return .orange
        case .badWeather: return .blue
        case .equipmentIssue: return .yellow
        case .lowBattery: return .orange
        }
    }
    
    var title: String {
        switch self {
        case .powerLines: return "Power Lines Detected"
        case .unstableGround: return "Unstable Ground"
        case .badWeather: return "Weather Warning"
        case .equipmentIssue: return "Equipment Issue"
        case .lowBattery: return "Low Battery"
        }
    }
    
    var message: String {
        switch self {
        case .powerLines: return "Maintain minimum 25-foot distance from power lines"
        case .unstableGround: return "Watch footing, uneven terrain detected"
        case .badWeather: return "Consider postponing AR measurement"
        case .equipmentIssue: return "Check equipment before proceeding"
        case .lowBattery: return "Device battery low, consider charging"
        }
    }
    
    var actionTitle: String? {
        switch self {
        case .powerLines: return "Safety Guide"
        case .unstableGround: return "Proceed Carefully"
        case .badWeather: return "Check Weather"
        case .equipmentIssue: return "Diagnostics"
        case .lowBattery: return "Power Save"
        }
    }
}

struct SafetyChecklistItem: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let severity: SafetySeverity
    var isChecked: Bool = false
    
    enum SafetySeverity {
        case standard, important, critical
    }
    
    static func allItems() -> [SafetyChecklistItem] {
        return [
            SafetyChecklistItem(
                title: "PPE Verification",
                description: "Hard hat, safety glasses, gloves, and appropriate footwear",
                severity: .critical
            ),
            SafetyChecklistItem(
                title: "Power Line Check",
                description: "Verify no overhead power lines within 25 feet",
                severity: .critical
            ),
            SafetyChecklistItem(
                title: "Ground Conditions",
                description: "Check for holes, roots, unstable surfaces",
                severity: .important
            ),
            SafetyChecklistItem(
                title: "Weather Assessment",
                description: "Confirm safe weather conditions for outdoor work",
                severity: .important
            ),
            SafetyChecklistItem(
                title: "Device Battery",
                description: "Ensure device has sufficient battery (>50%)",
                severity: .standard
            ),
            SafetyChecklistItem(
                title: "Emergency Contacts",
                description: "Supervisor and emergency contacts are accessible",
                severity: .important
            ),
            SafetyChecklistItem(
                title: "First Aid Kit",
                description: "First aid kit location is known and accessible",
                severity: .standard
            )
        ]
    }
}

enum WeatherSafetyLevel {
    case good, caution, unsafe
    
    var displayName: String {
        switch self {
        case .good: return "Safe for AR"
        case .caution: return "Use Caution"
        case .unsafe: return "Unsafe Conditions"
        }
    }
    
    var color: Color {
        switch self {
        case .good: return .green
        case .caution: return .orange
        case .unsafe: return .red
        }
    }
    
    var icon: String {
        switch self {
        case .good: return "sun.max.fill"
        case .caution: return "cloud.fill"
        case .unsafe: return "cloud.rain.fill"
        }
    }
}

struct PPEItem {
    let name: String
    let icon: String
    let isRequired: Bool
}

#Preview {
    VStack(spacing: 20) {
        SafetyBannerView()
        
        ContextualSafetyAlert(
            alertType: .powerLines,
            onDismiss: {},
            onAction: {}
        )
        
        WeatherSafetyIndicator()
        
        PPEReminderCard()
    }
    .padding()
    .environmentObject(ARSessionManager())
}