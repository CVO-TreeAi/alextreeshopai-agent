import SwiftUI

/// Real-time view that displays live agent updates and system status
struct RealTimeAgentView: View {
    @ObservedObject var coordinator: RealTimeAgentCoordinator
    @State private var showingUpdateDetails = false
    @State private var selectedUpdate: RealTimeUpdate?
    @State private var showingSystemDetails = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 16) {
                    // System Status Header
                    SystemStatusHeader(coordinator: coordinator)
                        .onTapGesture {
                            showingSystemDetails = true
                        }
                    
                    // Urgent Alerts
                    if !coordinator.urgentAlerts.isEmpty {
                        UrgentAlertsSection(coordinator: coordinator)
                    }
                    
                    // Active Agent Sessions
                    ActiveAgentSessionsSection(coordinator: coordinator)
                    
                    // Recent Updates Feed
                    RealTimeUpdatesFeed(
                        updates: coordinator.realtimeUpdates,
                        onUpdateTapped: { update in
                            selectedUpdate = update
                            showingUpdateDetails = true
                        }
                    )
                }
                .padding()
            }
            .navigationTitle("Live Agent Feed")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    ConnectionQualityIndicator(quality: coordinator.connectionQuality)
                    
                    Menu {
                        Button("Clear Updates") {
                            coordinator.clearAllUpdates()
                        }
                        
                        Button("Clear Alerts") {
                            coordinator.clearAllAlerts()
                        }
                        
                        Button("System Details") {
                            showingSystemDetails = true
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .refreshable {
                // Trigger refresh of agent data
            }
        }
        .sheet(isPresented: $showingUpdateDetails) {
            if let update = selectedUpdate {
                UpdateDetailsView(update: update)
            }
        }
        .sheet(isPresented: $showingSystemDetails) {
            SystemDetailsView(coordinator: coordinator)
        }
    }
}

// MARK: - System Status Header

struct SystemStatusHeader: View {
    @ObservedObject var coordinator: RealTimeAgentCoordinator
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("System Status")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("Last updated: \(timeAgoString(from: coordinator.lastUpdateTimestamp))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                SystemStatusIndicator(status: coordinator.systemStatus)
            }
            
            HStack(spacing: 16) {
                StatusMetric(
                    title: "Connection",
                    value: coordinator.connectionQuality.displayName,
                    color: coordinator.connectionQuality.color
                )
                
                StatusMetric(
                    title: "Active Agents",
                    value: "\(coordinator.activeAgentSessions.count)",
                    color: coordinator.activeAgentSessions.isEmpty ? .gray : .green
                )
                
                StatusMetric(
                    title: "Updates",
                    value: "\(coordinator.realtimeUpdates.count)",
                    color: .blue
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct SystemStatusIndicator: View {
    let status: SystemStatus
    @State private var isPulsing = false
    
    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(status.color)
                .frame(width: 12, height: 12)
                .scaleEffect(isPulsing ? 1.2 : 1.0)
                .animation(.easeInOut(duration: 1.0).repeatForever(), value: isPulsing)
            
            Text(status.displayName)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(status.color)
        }
        .onAppear {
            if status == .operational || status == .alert {
                isPulsing = true
            }
        }
        .onChange(of: status) { newStatus in
            isPulsing = newStatus == .operational || newStatus == .alert
        }
    }
}

struct StatusMetric: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Urgent Alerts Section

struct UrgentAlertsSection: View {
    @ObservedObject var coordinator: RealTimeAgentCoordinator
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)
                Text("Urgent Alerts")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                Badge(text: "\(coordinator.urgentAlerts.count)", color: .red)
            }
            
            ForEach(coordinator.urgentAlerts) { alert in
                UrgentAlertCard(alert: alert, coordinator: coordinator)
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

struct UrgentAlertCard: View {
    let alert: UrgentAlert
    @ObservedObject var coordinator: RealTimeAgentCoordinator
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: alertIcon)
                    .foregroundColor(alert.severity.color)
                    .frame(width: 20)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(alert.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    Text(alert.message)
                        .font(.subheadline)
                        .foregroundColor(.primary)
                        .lineLimit(isExpanded ? nil : 2)
                    
                    Text(timeAgoString(from: alert.timestamp))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(spacing: 8) {
                    if alert.requiresAction {
                        Button("Take Action") {
                            alert.actionHandler()
                            coordinator.dismissUrgentAlert(alert.id)
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        .font(.caption)
                    }
                    
                    Button("Dismiss") {
                        coordinator.dismissUrgentAlert(alert.id)
                    }
                    .buttonStyle(SecondaryButtonStyle())
                    .font(.caption)
                }
            }
            
            if alert.message.count > 100 {
                Button(isExpanded ? "Show Less" : "Show More") {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        isExpanded.toggle()
                    }
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
    
    private var alertIcon: String {
        switch alert.type {
        case .safety: return "shield.slash.fill"
        case .measurementQuality: return "exclamationmark.triangle.fill"
        case .connectionLoss: return "wifi.slash"
        case .agentRecommendation: return "brain.head.profile"
        case .systemError: return "xmark.circle.fill"
        }
    }
}

// MARK: - Active Agent Sessions

struct ActiveAgentSessionsSection: View {
    @ObservedObject var coordinator: RealTimeAgentCoordinator
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(.blue)
                Text("Active Agent Sessions")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                Badge(text: "\(coordinator.activeAgentSessions.count)", color: .blue)
            }
            
            if coordinator.activeAgentSessions.isEmpty {
                EmptyAgentSessionsView()
            } else {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 8) {
                    ForEach(Array(coordinator.activeAgentSessions), id: \.self) { agentId in
                        ActiveAgentSessionCard(agentId: agentId)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ActiveAgentSessionCard: View {
    let agentId: String
    @State private var isAnimating = false
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: agentIcon)
                .foregroundColor(.blue)
                .scaleEffect(isAnimating ? 1.1 : 1.0)
                .animation(.easeInOut(duration: 1.0).repeatForever(), value: isAnimating)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(agentDisplayName)
                    .font(.caption)
                    .fontWeight(.medium)
                
                Text("Active")
                    .font(.caption2)
                    .foregroundColor(.green)
            }
            
            Spacer()
        }
        .padding(8)
        .background(Color(.systemBackground))
        .cornerRadius(6)
        .onAppear {
            isAnimating = true
        }
    }
    
    private var agentDisplayName: String {
        switch agentId {
        case "workflow-manager": return "Workflow"
        case "safety-manager": return "Safety"
        case "treescore-calculator": return "TreeScore"
        case "ar-specialist": return "AR Guide"
        case "certified-arborist": return "Arborist"
        case "operations-manager": return "Operations"
        default: return agentId.capitalized
        }
    }
    
    private var agentIcon: String {
        switch agentId {
        case "workflow-manager": return "flowchart.fill"
        case "safety-manager": return "shield.fill"
        case "treescore-calculator": return "function"
        case "ar-specialist": return "arkit"
        case "certified-arborist": return "leaf.fill"
        case "operations-manager": return "gearshape.fill"
        default: return "brain.head.profile"
        }
    }
}

struct EmptyAgentSessionsView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "sleep")
                .font(.title2)
                .foregroundColor(.gray)
            
            Text("No active agent sessions")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Text("Agents will activate when needed for assessment steps")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

// MARK: - Real-Time Updates Feed

struct RealTimeUpdatesFeed: View {
    let updates: [RealTimeUpdate]
    let onUpdateTapped: (RealTimeUpdate) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "clock.arrow.circlepath")
                    .foregroundColor(.green)
                Text("Live Updates")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                Badge(text: "\(updates.count)", color: .green)
            }
            
            if updates.isEmpty {
                EmptyUpdatesView()
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(updates.prefix(20)) { update in
                        RealTimeUpdateCard(update: update) {
                            onUpdateTapped(update)
                        }
                    }
                    
                    if updates.count > 20 {
                        Button("Load More Updates") {
                            // Load more updates
                        }
                        .font(.subheadline)
                        .foregroundColor(.blue)
                        .padding()
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct RealTimeUpdateCard: View {
    let update: RealTimeUpdate
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(alignment: .top, spacing: 12) {
                // Update type icon
                Image(systemName: updateIcon)
                    .foregroundColor(update.priority.color)
                    .frame(width: 20)
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(update.title)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        UpdatePriorityBadge(priority: update.priority)
                    }
                    
                    Text(update.message)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    
                    HStack {
                        UpdateSourceBadge(source: update.source)
                        
                        Spacer()
                        
                        Text(timeAgoString(from: update.timestamp))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var updateIcon: String {
        switch update.type {
        case .workflowUpdate: return "flowchart.fill"
        case .stepTransition: return "arrow.right.circle.fill"
        case .safetyAlert: return "shield.slash.fill"
        case .riskLevelChange: return "exclamationmark.triangle.fill"
        case .scoreUpdate: return "function"
        case .scoreInsight: return "lightbulb.fill"
        case .arGuidance: return "arkit"
        case .arValidation: return "checkmark.circle.fill"
        case .systemStatus: return "gear.circle.fill"
        }
    }
}

struct UpdatePriorityBadge: View {
    let priority: UpdatePriority
    
    var body: some View {
        Text(priorityText)
            .font(.caption2)
            .fontWeight(.bold)
            .foregroundColor(.white)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(priority.color)
            .cornerRadius(4)
    }
    
    private var priorityText: String {
        switch priority {
        case .low: return "LOW"
        case .medium: return "MED"
        case .high: return "HIGH"
        case .critical: return "CRITICAL"
        }
    }
}

struct UpdateSourceBadge: View {
    let source: UpdateSource
    
    var body: some View {
        Text(sourceText)
            .font(.caption2)
            .foregroundColor(.blue)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(Color.blue.opacity(0.1))
            .cornerRadius(4)
    }
    
    private var sourceText: String {
        switch source {
        case .workflowManager: return "Workflow"
        case .safetyManager: return "Safety"
        case .treeScoreManager: return "TreeScore"
        case .arManager: return "AR"
        case .system: return "System"
        }
    }
}

struct EmptyUpdatesView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "clock")
                .font(.title2)
                .foregroundColor(.gray)
            
            Text("No recent updates")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Text("Agent updates will appear here in real-time")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

// MARK: - Connection Quality Indicator

struct ConnectionQualityIndicator: View {
    let quality: ConnectionQuality
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<4) { index in
                Rectangle()
                    .fill(barColor(for: index))
                    .frame(width: 3, height: CGFloat(6 + index * 2))
                    .cornerRadius(1)
            }
        }
    }
    
    private func barColor(for index: Int) -> Color {
        let qualityLevel = qualityToLevel(quality)
        return index < qualityLevel ? quality.color : Color.gray.opacity(0.3)
    }
    
    private func qualityToLevel(_ quality: ConnectionQuality) -> Int {
        switch quality {
        case .unknown, .disconnected: return 0
        case .poor: return 1
        case .fair: return 2
        case .good: return 3
        case .excellent: return 4
        }
    }
}

// MARK: - Detail Views

struct UpdateDetailsView: View {
    let update: RealTimeUpdate
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(update.title)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text(update.message)
                            .font(.body)
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        DetailRow(title: "Source", value: update.source.displayName)
                        DetailRow(title: "Priority", value: update.priority.displayName)
                        DetailRow(title: "Type", value: update.type.displayName)
                        DetailRow(title: "Timestamp", value: DateFormatter.detailed.string(from: update.timestamp))
                    }
                    
                    if !update.data.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Additional Data")
                                .font(.headline)
                            
                            ForEach(Array(update.data.keys), id: \.self) { key in
                                DetailRow(title: key.capitalized, value: "\(update.data[key] ?? "N/A")")
                            }
                        }
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Update Details")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct SystemDetailsView: View {
    @ObservedObject var coordinator: RealTimeAgentCoordinator
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("System Information")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        DetailRow(title: "System Status", value: coordinator.systemStatus.displayName)
                        DetailRow(title: "Connection Quality", value: coordinator.connectionQuality.displayName)
                        DetailRow(title: "Active Agents", value: "\(coordinator.activeAgentSessions.count)")
                        DetailRow(title: "Total Updates", value: "\(coordinator.realtimeUpdates.count)")
                        DetailRow(title: "Urgent Alerts", value: "\(coordinator.urgentAlerts.count)")
                        DetailRow(title: "Last Update", value: DateFormatter.detailed.string(from: coordinator.lastUpdateTimestamp))
                    }
                }
                .padding()
            }
            .navigationTitle("System Details")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct DetailRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Extensions

extension UpdateSource {
    var displayName: String {
        switch self {
        case .workflowManager: return "Workflow Manager"
        case .safetyManager: return "Safety Manager"
        case .treeScoreManager: return "TreeScore Manager"
        case .arManager: return "AR Manager"
        case .system: return "System"
        }
    }
}

extension UpdatePriority {
    var displayName: String {
        switch self {
        case .low: return "Low"
        case .medium: return "Medium"
        case .high: return "High"
        case .critical: return "Critical"
        }
    }
}

extension RealTimeUpdateType {
    var displayName: String {
        switch self {
        case .workflowUpdate: return "Workflow Update"
        case .stepTransition: return "Step Transition"
        case .safetyAlert: return "Safety Alert"
        case .riskLevelChange: return "Risk Level Change"
        case .scoreUpdate: return "Score Update"
        case .scoreInsight: return "Score Insight"
        case .arGuidance: return "AR Guidance"
        case .arValidation: return "AR Validation"
        case .systemStatus: return "System Status"
        }
    }
}

extension DateFormatter {
    static let detailed: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .medium
        return formatter
    }()
}