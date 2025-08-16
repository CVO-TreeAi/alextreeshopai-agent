import SwiftUI
import ARKit
import RealityKit

struct ContentView: View {
    // MARK: - Agent-Driven App State
    @StateObject private var communicationManager = AgentCommunicationManager()
    @StateObject private var agentDrivenWorkflowManager: AgentDrivenWorkflowManager
    @StateObject private var safetyManager: AgentDrivenSafety
    @StateObject private var treeScoreManager: AgentDrivenTreeScore
    @StateObject private var arManager: AgentDrivenARManager
    @StateObject private var realTimeCoordinator: RealTimeAgentCoordinator
    @StateObject private var integrationTests: AgentIntegrationTests
    @StateObject private var appState = AppState()
    
    init() {
        // Initialize agent-driven system
        let factory = AgentServiceFactory.shared
        
        let workflowMgr = AgentDrivenWorkflowManager()
        let safetyMgr = AgentDrivenSafety()
        let treeScoreMgr = AgentDrivenTreeScore()
        let arMgr = AgentDrivenARManager()
        let commManager = AgentCommunicationManager()
        
        let coordinator = RealTimeAgentCoordinator(
            workflowManager: workflowMgr,
            safetyManager: safetyMgr,
            treeScoreManager: treeScoreMgr,
            arManager: arMgr,
            communicationManager: commManager
        )
        
        let tests = AgentIntegrationTests()
        
        _agentDrivenWorkflowManager = StateObject(wrappedValue: workflowMgr)
        _safetyManager = StateObject(wrappedValue: safetyMgr)
        _treeScoreManager = StateObject(wrappedValue: treeScoreMgr)
        _arManager = StateObject(wrappedValue: arMgr)
        _communicationManager = StateObject(wrappedValue: commManager)
        _realTimeCoordinator = StateObject(wrappedValue: coordinator)
        _integrationTests = StateObject(wrappedValue: tests)
    }
    
    var body: some View {
        AgentDrivenContentView()
            .environmentObject(communicationManager)
            .environmentObject(agentDrivenWorkflowManager)
            .environmentObject(safetyManager)
            .environmentObject(treeScoreManager)
            .environmentObject(arManager)
            .environmentObject(realTimeCoordinator)
            .environmentObject(integrationTests)
            .environmentObject(appState)
            .preferredColorScheme(.light) // Professional appearance
    }
}

/// Global app state management
class AppState: ObservableObject {
    @Published var selectedTab: MainTab = .dashboard
    @Published var isOnboardingComplete: Bool = true // Set to false for first-time users
    @Published var showingAssessment: Bool = false
    @Published var showingEmergencyAlert: Bool = false
    
    enum MainTab: String, CaseIterable {
        case dashboard = "dashboard"
        case assessment = "assessment"
        case alex = "alex"
        case reports = "reports"
        case settings = "settings"
        
        var title: String {
            switch self {
            case .dashboard: return "Dashboard"
            case .assessment: return "Assessment"
            case .alex: return "Alex AI"
            case .reports: return "Reports"
            case .settings: return "Settings"
            }
        }
        
        var icon: String {
            switch self {
            case .dashboard: return "house.fill"
            case .assessment: return "viewfinder.rectangular"
            case .alex: return "bubble.left.and.bubble.right.fill"
            case .reports: return "doc.text.fill"
            case .settings: return "gear.circle.fill"
            }
        }
        
        var inactiveIcon: String {
            switch self {
            case .dashboard: return "house"
            case .assessment: return "viewfinder.rectangular"
            case .alex: return "bubble.left.and.bubble.right"
            case .reports: return "doc.text"
            case .settings: return "gear.circle"
            }
        }
    }
}

/// Agent-driven content view with enhanced tab navigation
struct AgentDrivenContentView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var communicationManager: AgentCommunicationManager
    @EnvironmentObject var workflowManager: AgentDrivenWorkflowManager
    @EnvironmentObject var safetyManager: AgentDrivenSafety
    @EnvironmentObject var treeScoreManager: AgentDrivenTreeScore
    @EnvironmentObject var arManager: AgentDrivenARManager
    @EnvironmentObject var realTimeCoordinator: RealTimeAgentCoordinator
    @EnvironmentObject var integrationTests: AgentIntegrationTests
    
    var body: some View {
        ZStack {
            // Agent-driven tab view
            TabView(selection: $appState.selectedTab) {
                RealDashboardView()
                .tabItem {
                    Image(systemName: appState.selectedTab == .dashboard ? 
                          AppState.MainTab.dashboard.icon : AppState.MainTab.dashboard.inactiveIcon)
                    Text(AppState.MainTab.dashboard.title)
                }
                .tag(AppState.MainTab.dashboard)
                
                ARMeasurementInterfaceView(arManager: RealARKitManager())
                    .tabItem {
                        Image(systemName: appState.selectedTab == .assessment ? 
                              AppState.MainTab.assessment.icon : AppState.MainTab.assessment.inactiveIcon)
                        Text(AppState.MainTab.assessment.title)
                    }
                    .tag(AppState.MainTab.assessment)
                
                RealAlexChatView()
                    .tabItem {
                        Image(systemName: appState.selectedTab == .alex ? 
                              AppState.MainTab.alex.icon : AppState.MainTab.alex.inactiveIcon)
                        Text(AppState.MainTab.alex.title)
                    }
                    .tag(AppState.MainTab.alex)
                
                RealTimeAgentView(coordinator: realTimeCoordinator)
                    .tabItem {
                        Image(systemName: appState.selectedTab == .reports ? 
                              AppState.MainTab.reports.icon : AppState.MainTab.reports.inactiveIcon)
                        Text("Live Feed")
                    }
                    .tag(AppState.MainTab.reports)
                
                AgentSystemSettingsView()
                    .tabItem {
                        Image(systemName: appState.selectedTab == .settings ? 
                              AppState.MainTab.settings.icon : AppState.MainTab.settings.inactiveIcon)
                        Text(AppState.MainTab.settings.title)
                    }
                    .tag(AppState.MainTab.settings)
            }
            .accentColor(.primary)
            
            // Emergency alert overlay
            if appState.showingEmergencyAlert || !safetyManager.realTimeSafetyAlerts.filter({ $0.severity == .critical }).isEmpty {
                AgentEmergencyAlertOverlay(safetyManager: safetyManager)
                    .transition(.scale.combined(with: .opacity))
            }
            
            // Urgent alerts overlay
            if !realTimeCoordinator.urgentAlerts.isEmpty {
                VStack {
                    UrgentAlertsBanner(coordinator: realTimeCoordinator)
                    Spacer()
                }
                .allowsHitTesting(false)
            }
            
            // AR guidance overlay when AR is active
            if arManager.isARActive {
                VStack {
                    ARGuidanceOverlay(arManager: arManager)
                    Spacer()
                }
                .allowsHitTesting(false)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: appState.showingEmergencyAlert)
    }
}

// MARK: - Placeholder Views (to be implemented)

struct AgentDrivenAssessmentView: View {
    @EnvironmentObject var workflowManager: AgentDrivenWorkflowManager
    
    var body: some View {
        DynamicFormView(workflowManager: workflowManager)
            .navigationTitle("Agent Assessment")
    }
}

struct AlexAgentChatView: View {
    @EnvironmentObject var coordinator: RealTimeAgentCoordinator
    
    var body: some View {
        VStack {
            Text("Alex AI Agent Chat")
                .font(.title)
            Text("Enhanced with 30 specialist agents")
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
        }
        .padding()
        .navigationTitle("Alex AI")
    }
}

struct AgentSystemSettingsView: View {
    @EnvironmentObject var integrationTests: AgentIntegrationTests
    @EnvironmentObject var communicationManager: AgentCommunicationManager
    
    var body: some View {
        NavigationView {
            List {
                Section("Agent System") {
                    HStack {
                        Text("Connection Status")
                        Spacer()
                        Text(communicationManager.isConnected ? "Connected" : "Disconnected")
                            .foregroundColor(communicationManager.isConnected ? .green : .red)
                    }
                    
                    Button("Run Integration Tests") {
                        Task {
                            await integrationTests.runQuickTests()
                        }
                    }
                    
                    if integrationTests.isRunning {
                        HStack {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("Running tests...")
                        }
                    }
                }
                
                if !integrationTests.testResults.isEmpty {
                    Section("Test Results") {
                        ForEach(integrationTests.testResults) { result in
                            HStack {
                                Image(systemName: result.status.icon)
                                    .foregroundColor(result.status.color)
                                Text(result.testName)
                                Spacer()
                                Text(String(format: "%.1fs", result.duration))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Agent Settings")
        }
    }
}

struct AgentEmergencyAlertOverlay: View {
    @ObservedObject var safetyManager: AgentDrivenSafety
    
    var body: some View {
        VStack {
            Text("EMERGENCY ALERT")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            if let criticalAlert = safetyManager.realTimeSafetyAlerts.first(where: { $0.severity == .critical }) {
                Text(criticalAlert.message)
                    .font(.body)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
        .background(Color.red)
        .cornerRadius(12)
        .shadow(radius: 10)
        .padding()
    }
}

struct UrgentAlertsBanner: View {
    @ObservedObject var coordinator: RealTimeAgentCoordinator
    
    var body: some View {
        if let urgentAlert = coordinator.urgentAlerts.first {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                Text(urgentAlert.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Button("Dismiss") {
                    coordinator.dismissUrgentAlert(urgentAlert.id)
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
            .padding()
            .background(Color.orange.opacity(0.2))
            .cornerRadius(8)
            .padding(.horizontal)
        }
    }
}

struct ARGuidanceOverlay: View {
    @ObservedObject var arManager: AgentDrivenARManager
    
    var body: some View {
        if let guidance = arManager.agentGuidance {
            VStack {
                HStack {
                    Image(systemName: "arkit")
                        .foregroundColor(.blue)
                    Text("AR Agent Guidance")
                        .font(.headline)
                        .fontWeight(.semibold)
                    Spacer()
                }
                
                Text(guidance.primaryInstruction)
                    .font(.subheadline)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .background(Color.blue.opacity(0.2))
            .cornerRadius(8)
            .padding(.horizontal)
        }
    }
}

#Preview {
    ContentView()
}