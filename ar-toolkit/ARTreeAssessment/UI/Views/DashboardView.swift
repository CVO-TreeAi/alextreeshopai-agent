import SwiftUI
import MapKit

/// Professional dashboard for tree service field crews
struct DashboardView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    @EnvironmentObject var arSessionManager: ARSessionManager
    @State private var showingQuickAssessment = false
    @State private var todaysAssessments = 0
    @State private var weeklyProgress: Float = 0.73
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header with quick stats
                    DashboardHeaderView(
                        todaysAssessments: todaysAssessments,
                        weeklyProgress: weeklyProgress
                    )
                    
                    // Quick action buttons
                    QuickActionsGrid()
                    
                    // Current assessment status
                    if !workflowManager.isComplete {
                        CurrentAssessmentCard()
                    }
                    
                    // Recent assessments preview
                    RecentAssessmentsSection()
                    
                    // Weather and conditions
                    WeatherConditionsCard()
                    
                    // Safety reminders
                    SafetyRemindersCard()
                }
                .padding(.horizontal)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("TreeAI Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        appState.showingEmergencyAlert = true
                    }) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                    }
                }
            }
        }
        .navigationViewStyle(.stack)
        .onAppear {
            loadDashboardData()
        }
    }
    
    private func loadDashboardData() {
        // Simulate loading today's data
        todaysAssessments = Int.random(in: 3...8)
        weeklyProgress = Float.random(in: 0.6...0.9)
    }
}

/// Dashboard header with daily stats
struct DashboardHeaderView: View {
    let todaysAssessments: Int
    let weeklyProgress: Float
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Today's Progress")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    
                    Text("\(todaysAssessments) Assessments")
                        .font(.largeTitle.bold())
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Weekly Goal")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    
                    CircularProgressView(
                        progress: weeklyProgress,
                        size: 60
                    )
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 2)
        }
    }
}

/// Grid of quick action buttons
struct QuickActionsGrid: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    
    let quickActions: [QuickAction] = [
        QuickAction(
            title: "New Assessment",
            subtitle: "Start tree evaluation",
            icon: "plus.circle.fill",
            color: .blue,
            action: .newAssessment
        ),
        QuickAction(
            title: "Quick Measure",
            subtitle: "Height & DBH only",
            icon: "ruler.fill",
            color: .green,
            action: .quickMeasure
        ),
        QuickAction(
            title: "Risk Assessment",
            subtitle: "Safety evaluation",
            icon: "exclamationmark.triangle.fill",
            color: .orange,
            action: .riskAssessment
        ),
        QuickAction(
            title: "Ask Alex",
            subtitle: "AI assistance",
            icon: "brain.head.profile",
            color: .purple,
            action: .askAlex
        )
    ]
    
    let columns = Array(repeating: GridItem(.flexible(), spacing: 12), count: 2)
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("Quick Actions")
                .font(.headline)
                .padding(.horizontal)
            
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(quickActions) { action in
                    QuickActionButton(action: action) {
                        handleQuickAction(action.action)
                    }
                }
            }
            .padding(.horizontal)
        }
    }
    
    private func handleQuickAction(_ actionType: QuickActionType) {
        switch actionType {
        case .newAssessment:
            workflowManager.startAssessment()
            appState.selectedTab = .assessment
            
        case .quickMeasure:
            appState.selectedTab = .assessment
            // Pre-configure for quick measurements
            
        case .riskAssessment:
            appState.selectedTab = .assessment
            // Jump to risk assessment step
            
        case .askAlex:
            appState.selectedTab = .alex
        }
    }
}

/// Individual quick action button
struct QuickActionButton: View {
    let action: QuickAction
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 12) {
                Image(systemName: action.icon)
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundColor(action.color)
                
                VStack(spacing: 4) {
                    Text(action.title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(action.subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 120)
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 2)
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

/// Current assessment progress card
struct CurrentAssessmentCard: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Current Assessment")
                    .font(.headline)
                
                Spacer()
                
                Button("Continue") {
                    appState.selectedTab = .assessment
                }
                .font(.subheadline.weight(.semibold))
                .foregroundColor(.blue)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text(workflowManager.currentStep.displayName)
                    .font(.subheadline.weight(.semibold))
                
                Text(workflowManager.currentStep.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                ProgressView(value: workflowManager.progress)
                    .tint(.blue)
            }
            
            if !workflowManager.formData.customerName.isEmpty {
                Text("Customer: \(workflowManager.formData.customerName)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

/// Recent assessments preview
struct RecentAssessmentsSection: View {
    @State private var recentAssessments: [AssessmentPreview] = []
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Assessments")
                    .font(.headline)
                
                Spacer()
                
                NavigationLink("View All") {
                    // Navigate to reports view
                }
                .font(.subheadline.weight(.semibold))
                .foregroundColor(.blue)
            }
            .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(recentAssessments) { assessment in
                        AssessmentPreviewCard(assessment: assessment)
                    }
                }
                .padding(.horizontal)
            }
        }
        .onAppear {
            loadRecentAssessments()
        }
    }
    
    private func loadRecentAssessments() {
        recentAssessments = [
            AssessmentPreview(
                id: "1",
                customerName: "Johnson Property",
                treeScore: 750,
                date: Date().addingTimeInterval(-86400),
                status: .completed
            ),
            AssessmentPreview(
                id: "2",
                customerName: "Maple St Residence",
                treeScore: 620,
                date: Date().addingTimeInterval(-172800),
                status: .completed
            ),
            AssessmentPreview(
                id: "3",
                customerName: "Oak Grove Park",
                treeScore: 850,
                date: Date().addingTimeInterval(-259200),
                status: .completed
            )
        ]
    }
}

/// Individual assessment preview card
struct AssessmentPreviewCard: View {
    let assessment: AssessmentPreview
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(assessment.customerName)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                
                Spacer()
                
                TreeScoreBadge(score: assessment.treeScore, compact: true)
            }
            
            Text(assessment.date, style: .date)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Text(assessment.status.displayName)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(assessment.status.color.opacity(0.2))
                .foregroundColor(assessment.status.color)
                .cornerRadius(6)
        }
        .padding()
        .frame(width: 200)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

/// Weather conditions card
struct WeatherConditionsCard: View {
    @State private var weatherCondition = "Partly Cloudy"
    @State private var temperature = 72
    @State private var windSpeed = 8
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Field Conditions")
                .font(.headline)
            
            HStack {
                VStack(alignment: .leading) {
                    Text("\(temperature)°F")
                        .font(.title.bold())
                    
                    Text(weatherCondition)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    HStack {
                        Image(systemName: "wind")
                            .foregroundColor(.blue)
                        Text("\(windSpeed) mph")
                            .font(.subheadline)
                    }
                    
                    Text("Good for AR")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

/// Safety reminders card
struct SafetyRemindersCard: View {
    let safetyReminders = [
        "Hard hat and safety glasses required",
        "Check for power lines before measuring",
        "Maintain situational awareness in AR mode"
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "shield.checkerboard")
                    .foregroundColor(.orange)
                
                Text("Safety Reminders")
                    .font(.headline)
            }
            
            VStack(alignment: .leading, spacing: 6) {
                ForEach(safetyReminders, id: \.self) { reminder in
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                        
                        Text(reminder)
                            .font(.caption)
                            .foregroundColor(.secondary)
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

struct QuickAction: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    let action: QuickActionType
}

enum QuickActionType {
    case newAssessment
    case quickMeasure
    case riskAssessment
    case askAlex
}

struct AssessmentPreview: Identifiable {
    let id: String
    let customerName: String
    let treeScore: Int
    let date: Date
    let status: AssessmentStatus
    
    enum AssessmentStatus {
        case inProgress
        case completed
        case needsReview
        
        var displayName: String {
            switch self {
            case .inProgress: return "In Progress"
            case .completed: return "Completed"
            case .needsReview: return "Needs Review"
            }
        }
        
        var color: Color {
            switch self {
            case .inProgress: return .blue
            case .completed: return .green
            case .needsReview: return .orange
            }
        }
    }
}

/// Custom button style with scale animation
struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

#Preview {
    DashboardView()
        .environmentObject(AppState())
        .environmentObject(AssessmentWorkflowManager())
        .environmentObject(ARSessionManager())
}