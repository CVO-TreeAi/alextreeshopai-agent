import SwiftUI

// MARK: - Agent Status Dashboard

struct AgentStatusDashboard: View {
    @ObservedObject var workflowManager: AgentDrivenWorkflowManager
    @ObservedObject var safetyManager: AgentDrivenSafety
    @ObservedObject var treeScoreManager: AgentDrivenTreeScore
    @ObservedObject var arManager: AgentDrivenARManager
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Active Agents Overview
                ActiveAgentsOverviewCard(
                    workflowManager: workflowManager,
                    safetyManager: safetyManager,
                    treeScoreManager: treeScoreManager,
                    arManager: arManager
                )
                
                // Real-time Agent Recommendations
                if !workflowManager.agentRecommendations.isEmpty {
                    AgentRecommendationsCard(recommendations: workflowManager.agentRecommendations)
                }
                
                // Safety Alerts
                if !safetyManager.realTimeSafetyAlerts.isEmpty {
                    SafetyAlertsCard(alerts: safetyManager.realTimeSafetyAlerts)
                }
                
                // TreeScore Analysis
                if treeScoreManager.currentScore > 0 {
                    TreeScoreAnalysisCard(
                        score: treeScoreManager.currentScore,
                        breakdown: treeScoreManager.scoreBreakdown,
                        recommendations: treeScoreManager.agentRecommendations
                    )
                }
                
                // AR Agent Guidance
                if let guidance = arManager.agentGuidance {
                    ARGuidanceCard(guidance: guidance, arManager: arManager)
                }
                
                // Agent Decision History
                AgentDecisionHistoryCard(workflowManager: workflowManager)
            }
            .padding()
        }
        .navigationTitle("Agent Dashboard")
        .refreshable {
            await refreshAgentData()
        }
    }
    
    private func refreshAgentData() async {
        // Refresh data from all agent managers
        // This would trigger re-evaluation from all agents
    }
}

// MARK: - Active Agents Overview

struct ActiveAgentsOverviewCard: View {
    @ObservedObject var workflowManager: AgentDrivenWorkflowManager
    @ObservedObject var safetyManager: AgentDrivenSafety
    @ObservedObject var treeScoreManager: AgentDrivenTreeScore
    @ObservedObject var arManager: AgentDrivenARManager
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(.blue)
                Text("Active Agents")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                
                if anyAgentIsLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                AgentStatusTile(
                    agentName: "Workflow Manager",
                    status: workflowManager.isLoading ? .processing : .active,
                    icon: "flowchart.fill",
                    lastUpdate: "Now"
                )
                
                AgentStatusTile(
                    agentName: "Safety Manager",
                    status: safetyManager.isAnalyzing ? .processing : .active,
                    icon: "shield.fill",
                    lastUpdate: safetyManager.currentRiskLevel == .critical ? "Alert" : "Normal"
                )
                
                AgentStatusTile(
                    agentName: "TreeScore Calculator",
                    status: treeScoreManager.isCalculating ? .processing : .active,
                    icon: "function",
                    lastUpdate: treeScoreManager.currentScore > 0 ? "\(treeScoreManager.currentScore) pts" : "Ready"
                )
                
                AgentStatusTile(
                    agentName: "AR Specialist",
                    status: arManager.isARActive ? .processing : .standby,
                    icon: "arkit",
                    lastUpdate: arManager.measurementState.description
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private var anyAgentIsLoading: Bool {
        workflowManager.isLoading || 
        safetyManager.isAnalyzing || 
        treeScoreManager.isCalculating || 
        arManager.measurementState == .measuring
    }
}

struct AgentStatusTile: View {
    let agentName: String
    let status: AgentStatus
    let icon: String
    let lastUpdate: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(status.color)
                    .frame(width: 20)
                Spacer()
                Circle()
                    .fill(status.color)
                    .frame(width: 8, height: 8)
            }
            
            Text(agentName)
                .font(.caption)
                .fontWeight(.medium)
                .multilineTextAlignment(.leading)
            
            Text(lastUpdate)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(status.color.opacity(0.3), lineWidth: 1)
        )
    }
}

enum AgentStatus {
    case active, processing, standby, error
    
    var color: Color {
        switch self {
        case .active: return .green
        case .processing: return .blue
        case .standby: return .gray
        case .error: return .red
        }
    }
}

// MARK: - Agent Recommendations Card

struct AgentRecommendationsCard: View {
    let recommendations: [AgentRecommendation]
    @State private var expandedRecommendations = Set<UUID>()
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(.orange)
                Text("Agent Recommendations")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                
                Badge(text: "\(recommendations.count)", color: .orange)
            }
            
            ForEach(recommendations.prefix(5)) { recommendation in
                AgentRecommendationRow(
                    recommendation: recommendation,
                    isExpanded: expandedRecommendations.contains(recommendation.id),
                    onToggle: {
                        if expandedRecommendations.contains(recommendation.id) {
                            expandedRecommendations.remove(recommendation.id)
                        } else {
                            expandedRecommendations.insert(recommendation.id)
                        }
                    }
                )
            }
            
            if recommendations.count > 5 {
                Button("View all \(recommendations.count) recommendations") {
                    // Show all recommendations modal
                }
                .font(.subheadline)
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
    let isExpanded: Bool
    let onToggle: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 12) {
                Circle()
                    .fill(recommendation.priority.color)
                    .frame(width: 8, height: 8)
                    .padding(.top, 6)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(recommendation.message)
                        .font(.subheadline)
                        .lineLimit(isExpanded ? nil : 2)
                    
                    HStack {
                        Text(recommendation.agentSource)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        Text(timeAgoString(from: recommendation.timestamp))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
                
                Button(action: onToggle) {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
            }
            
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    Divider()
                    
                    HStack {
                        PriorityBadge(priority: recommendation.priority)
                        TypeBadge(type: recommendation.type)
                        Spacer()
                    }
                    
                    if let actions = getRecommendationActions(recommendation) {
                        HStack(spacing: 8) {
                            ForEach(actions, id: \.title) { action in
                                Button(action.title) {
                                    action.handler()
                                }
                                .buttonStyle(SecondaryButtonStyle())
                                .font(.caption)
                            }
                        }
                    }
                }
                .padding(.leading, 20)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isExpanded)
    }
    
    private func getRecommendationActions(_ recommendation: AgentRecommendation) -> [RecommendationAction]? {
        switch recommendation.type {
        case .safety:
            return [
                RecommendationAction(title: "View Details", handler: {}),
                RecommendationAction(title: "Apply", handler: {})
            ]
        case .calculation:
            return [
                RecommendationAction(title: "Recalculate", handler: {}),
                RecommendationAction(title: "View Breakdown", handler: {})
            ]
        default:
            return [
                RecommendationAction(title: "Acknowledge", handler: {})
            ]
        }
    }
}

struct RecommendationAction {
    let title: String
    let handler: () -> Void
}

// MARK: - Safety Alerts Card

struct SafetyAlertsCard: View {
    let alerts: [SafetyAlert]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)
                Text("Safety Alerts")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                
                Badge(text: "\(alerts.count)", color: .red)
            }
            
            ForEach(alerts.prefix(3)) { alert in
                SafetyAlertRow(alert: alert)
            }
            
            if alerts.count > 3 {
                Button("View all \(alerts.count) alerts") {
                    // Show all alerts modal
                }
                .font(.subheadline)
                .foregroundColor(.red)
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

struct SafetyAlertRow: View {
    let alert: SafetyAlert
    @State private var isAcknowledged = false
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: alertIcon)
                .foregroundColor(alert.severity.color)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(alert.message)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text("Alert Type: \(alert.type.displayName)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(timeAgoString(from: alert.timestamp))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if alert.requiresAcknowledgment && !isAcknowledged {
                Button("Acknowledge") {
                    isAcknowledged = true
                }
                .buttonStyle(PrimaryButtonStyle())
                .font(.caption)
            }
        }
        .opacity(isAcknowledged ? 0.6 : 1.0)
    }
    
    private var alertIcon: String {
        switch alert.type {
        case .emergency: return "exclamationmark.triangle.fill"
        case .highRisk: return "exclamationmark.circle.fill"
        case .equipmentFailure: return "wrench.and.screwdriver.fill"
        case .weatherChange: return "cloud.fill"
        default: return "info.circle.fill"
        }
    }
}

// MARK: - TreeScore Analysis Card

struct TreeScoreAnalysisCard: View {
    let score: Int
    let breakdown: TreeScoreBreakdown?
    let recommendations: [TreeScoreRecommendation]
    @State private var showBreakdown = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "function")
                    .foregroundColor(.green)
                Text("TreeScore Analysis")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                
                Button("Details") {
                    showBreakdown.toggle()
                }
                .font(.subheadline)
                .foregroundColor(.blue)
            }
            
            // Score Display
            HStack {
                VStack(alignment: .leading) {
                    Text("Current Score")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(score)")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(scoreColor)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Score Category")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(scoreCategory)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(scoreColor)
                }
            }
            
            // Progress Bar
            ScoreProgressBar(score: score, maxScore: 1200)
            
            // Agent Recommendations
            if !recommendations.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Agent Insights")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    ForEach(recommendations.prefix(2)) { recommendation in
                        TreeScoreRecommendationRow(recommendation: recommendation)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .sheet(isPresented: $showBreakdown) {
            if let breakdown = breakdown {
                TreeScoreBreakdownView(breakdown: breakdown)
            }
        }
    }
    
    private var scoreColor: Color {
        switch score {
        case 0..<400: return .red
        case 400..<600: return .orange
        case 600..<800: return .yellow
        default: return .green
        }
    }
    
    private var scoreCategory: String {
        switch score {
        case 0..<400: return "Low"
        case 400..<600: return "Medium"
        case 600..<800: return "High"
        default: return "Excellent"
        }
    }
}

struct ScoreProgressBar: View {
    let score: Int
    let maxScore: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Score Progress")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(Int(progress * 100))%")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            ProgressView(value: progress)
                .progressViewStyle(LinearProgressViewStyle(tint: progressColor))
        }
    }
    
    private var progress: Double {
        Double(score) / Double(maxScore)
    }
    
    private var progressColor: Color {
        switch progress {
        case 0..<0.33: return .red
        case 0.33..<0.66: return .orange
        default: return .green
        }
    }
}

struct TreeScoreRecommendationRow: View {
    let recommendation: TreeScoreRecommendation
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: recommendation.impact == .positive ? "arrow.up.circle.fill" : "lightbulb.fill")
                .foregroundColor(recommendation.impact == .positive ? .green : .blue)
                .frame(width: 16)
            
            Text(recommendation.message)
                .font(.caption)
                .multilineTextAlignment(.leading)
            
            Spacer()
        }
    }
}

// MARK: - AR Guidance Card

struct ARGuidanceCard: View {
    let guidance: ARGuidanceInstructions
    @ObservedObject var arManager: AgentDrivenARManager
    @State private var showDetailedGuidance = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "arkit")
                    .foregroundColor(.purple)
                Text("AR Agent Guidance")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                
                if arManager.isARActive {
                    LiveIndicator()
                }
            }
            
            // Primary Instruction
            Text(guidance.primaryInstruction)
                .font(.subheadline)
                .padding(12)
                .background(Color(.systemBlue).opacity(0.1))
                .cornerRadius(8)
            
            // Real-time Validation
            if let validation = arManager.realTimeValidation {
                ARValidationDisplay(validation: validation)
            }
            
            // Measurement Quality
            if let quality = arManager.measurementQuality {
                ARQualityDisplay(quality: quality)
            }
            
            // Action Buttons
            HStack(spacing: 12) {
                Button("Detailed Guide") {
                    showDetailedGuidance = true
                }
                .buttonStyle(SecondaryButtonStyle())
                
                if arManager.isARActive {
                    Button("Stop AR") {
                        Task {
                            await arManager.deactivateARWithAgentFeedback()
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .sheet(isPresented: $showDetailedGuidance) {
            DetailedARGuidanceView(guidance: guidance)
        }
    }
}

struct LiveIndicator: View {
    @State private var isAnimating = false
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(Color.red)
                .frame(width: 8, height: 8)
                .scaleEffect(isAnimating ? 1.2 : 1.0)
                .animation(.easeInOut(duration: 1.0).repeatForever(), value: isAnimating)
            
            Text("LIVE")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(.red)
        }
        .onAppear {
            isAnimating = true
        }
    }
}

struct ARValidationDisplay: View {
    let validation: ARValidationFeedback
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Real-time Validation")
                    .font(.caption)
                    .fontWeight(.medium)
                Spacer()
                Image(systemName: validation.isValid ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                    .foregroundColor(validation.isValid ? .green : .orange)
            }
            
            HStack {
                VStack(alignment: .leading) {
                    Text("Accuracy")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text("\(Int(validation.accuracy * 100))%")
                        .font(.caption)
                        .fontWeight(.medium)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Confidence")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text("\(Int(validation.confidence * 100))%")
                        .font(.caption)
                        .fontWeight(.medium)
                }
            }
        }
        .padding(8)
        .background(Color(.systemBackground))
        .cornerRadius(6)
    }
}

struct ARQualityDisplay: View {
    let quality: ARMeasurementQuality
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Measurement Quality")
                .font(.caption)
                .fontWeight(.medium)
            
            HStack(spacing: 8) {
                QualityMeter(title: "Accuracy", value: quality.accuracy)
                QualityMeter(title: "Reliability", value: quality.reliability)
                QualityMeter(title: "Complete", value: quality.completeness)
            }
        }
        .padding(8)
        .background(Color(.systemBackground))
        .cornerRadius(6)
    }
}

struct QualityMeter: View {
    let title: String
    let value: Double
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
            
            ProgressView(value: value)
                .progressViewStyle(LinearProgressViewStyle(tint: meterColor))
                .frame(height: 4)
            
            Text("\(Int(value * 100))%")
                .font(.caption2)
                .fontWeight(.medium)
        }
    }
    
    private var meterColor: Color {
        switch value {
        case 0..<0.5: return .red
        case 0.5..<0.8: return .orange
        default: return .green
        }
    }
}

// MARK: - Supporting Components

struct Badge: View {
    let text: String
    let color: Color
    
    var body: some View {
        Text(text)
            .font(.caption2)
            .fontWeight(.bold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color)
            .cornerRadius(10)
    }
}

struct PriorityBadge: View {
    let priority: AgentRecommendation.Priority
    
    var body: some View {
        Badge(text: priority.displayName, color: priority.color)
    }
}

struct TypeBadge: View {
    let type: AgentRecommendation.RecommendationType
    
    var body: some View {
        Badge(text: type.displayName, color: .gray)
    }
}

// MARK: - Helper Functions

func timeAgoString(from date: Date) -> String {
    let interval = Date().timeIntervalSince(date)
    
    if interval < 60 {
        return "Just now"
    } else if interval < 3600 {
        return "\(Int(interval / 60))m ago"
    } else if interval < 86400 {
        return "\(Int(interval / 3600))h ago"
    } else {
        return "\(Int(interval / 86400))d ago"
    }
}

// MARK: - Extensions

extension AgentRecommendation.Priority {
    var displayName: String {
        switch self {
        case .low: return "Low"
        case .medium: return "Medium"
        case .high: return "High"
        case .critical: return "Critical"
        }
    }
    
    var color: Color {
        switch self {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .orange
        case .critical: return .red
        }
    }
}

extension AgentRecommendation.RecommendationType {
    var displayName: String {
        switch self {
        case .safety: return "Safety"
        case .calculation: return "Calculation"
        case .improvement: return "Improvement"
        case .error: return "Error"
        case .recommendation: return "Recommendation"
        }
    }
}

extension SafetyAlertType {
    var displayName: String {
        switch self {
        case .highRisk: return "High Risk"
        case .riskLevelIncrease: return "Risk Increase"
        case .protocolViolation: return "Protocol Violation"
        case .equipmentFailure: return "Equipment Failure"
        case .weatherChange: return "Weather Change"
        case .emergency: return "Emergency"
        case .monitoringError: return "Monitoring Error"
        }
    }
}

// MARK: - Additional Views

struct AgentDecisionHistoryCard: View {
    @ObservedObject var workflowManager: AgentDrivenWorkflowManager
    @State private var showFullHistory = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "clock.arrow.circlepath")
                    .foregroundColor(.blue)
                Text("Recent Agent Decisions")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                
                Button("View All") {
                    showFullHistory = true
                }
                .font(.subheadline)
                .foregroundColor(.blue)
            }
            
            // This would show recent agent decisions from the workflow manager
            VStack(alignment: .leading, spacing: 8) {
                DecisionRow(
                    agent: "Field Assessor",
                    decision: "Proceed to next step",
                    timestamp: Date().addingTimeInterval(-300),
                    confidence: 0.95
                )
                
                DecisionRow(
                    agent: "Safety Manager",
                    decision: "No safety concerns identified",
                    timestamp: Date().addingTimeInterval(-600),
                    confidence: 0.88
                )
                
                DecisionRow(
                    agent: "TreeScore Calculator",
                    decision: "Score calculation complete",
                    timestamp: Date().addingTimeInterval(-900),
                    confidence: 0.92
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .sheet(isPresented: $showFullHistory) {
            AgentDecisionHistoryView(workflowManager: workflowManager)
        }
    }
}

struct DecisionRow: View {
    let agent: String
    let decision: String
    let timestamp: Date
    let confidence: Double
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(agent)
                    .font(.caption)
                    .fontWeight(.medium)
                Text(decision)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(Int(confidence * 100))%")
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundColor(confidence > 0.8 ? .green : .orange)
                Text(timeAgoString(from: timestamp))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Modal Views

struct TreeScoreBreakdownView: View {
    let breakdown: TreeScoreBreakdown
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Implementation for detailed breakdown view
                    Text("TreeScore Breakdown")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    // Detailed breakdown components would go here
                }
                .padding()
            }
            .navigationTitle("Score Details")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct DetailedARGuidanceView: View {
    let guidance: ARGuidanceInstructions
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("AR Measurement Guide")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    // Step-by-step guide implementation
                    ForEach(Array(guidance.stepByStepGuide.enumerated()), id: \.offset) { index, step in
                        HStack(alignment: .top, spacing: 12) {
                            Text("\(index + 1)")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .frame(width: 20, height: 20)
                                .background(Color.blue)
                                .clipShape(Circle())
                            
                            Text(step)
                                .font(.subheadline)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("AR Guidance")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct AgentDecisionHistoryView: View {
    @ObservedObject var workflowManager: AgentDrivenWorkflowManager
    
    var body: some View {
        NavigationView {
            List {
                // Implementation for full decision history
                Text("Full Agent Decision History")
            }
            .navigationTitle("Decision History")
        }
    }
}