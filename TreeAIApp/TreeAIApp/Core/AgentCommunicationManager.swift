import Foundation
import Combine

/// Central communication manager for interacting with TreeAI specialist agents
class AgentCommunicationManager: ObservableObject {
    
    // MARK: - Properties
    @Published var isConnected: Bool = false
    @Published var lastError: AgentError?
    @Published var activeRequests: Set<UUID> = []
    
    private let baseURL: String
    private let session: URLSession
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Configuration
    struct Configuration {
        let baseURL: String
        let timeout: TimeInterval
        let maxRetries: Int
        
        static let `default` = Configuration(
            baseURL: "https://tremendous-whale-894.convex.site",
            timeout: 30.0,
            maxRetries: 3
        )
    }
    
    // MARK: - Initialization
    init(configuration: Configuration = .default) {
        self.baseURL = configuration.baseURL
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = configuration.timeout
        config.timeoutIntervalForResource = configuration.timeout * 2
        self.session = URLSession(configuration: config)
        
        setupConnectivityMonitoring()
    }
    
    // MARK: - Agent Communication
    
    /// Send a request to a specialist agent
    func sendToAgent<Request: AgentRequest, Response: AgentResponse>(
        _ request: Request,
        to agent: AgentType
    ) async throws -> Response {
        let requestId = UUID()
        
        await MainActor.run {
            activeRequests.insert(requestId)
        }
        
        defer {
            Task { @MainActor in
                activeRequests.remove(requestId)
            }
        }
        
        do {
            let response: Response = try await performRequest(request, to: agent)
            return response
        } catch {
            let agentError = AgentError.communicationFailed(agent.rawValue, error)
            await MainActor.run {
                self.lastError = agentError
            }
            throw agentError
        }
    }
    
    /// Send request with real-time updates
    func sendWithUpdates<Request: AgentRequest, Response: AgentResponse>(
        _ request: Request,
        to agent: AgentType,
        updateHandler: @escaping (AgentUpdate) -> Void
    ) async throws -> Response {
        // For future streaming implementation
        return try await sendToAgent(request, to: agent)
    }
    
    // MARK: - Private Implementation
    
    private func performRequest<Request: AgentRequest, Response: AgentResponse>(
        _ request: Request,
        to agent: AgentType
    ) async throws -> Response {
        let url = buildURL(for: agent, request: request)
        var urlRequest = URLRequest(url: url)
        
        // Configure request
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("TreeAI-iOS/1.0", forHTTPHeaderField: "User-Agent")
        
        // Encode request body
        let requestBody = AgentRequestWrapper(
            agentType: agent.rawValue,
            requestId: UUID().uuidString,
            timestamp: Date().timeIntervalSince1970,
            data: request
        )
        
        urlRequest.httpBody = try JSONEncoder().encode(requestBody)
        
        // Perform request
        let (data, response) = try await session.data(for: urlRequest)
        
        // Validate response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AgentError.invalidResponse
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw AgentError.httpError(httpResponse.statusCode)
        }
        
        // Decode response
        let agentResponse = try JSONDecoder().decode(AgentResponseWrapper<Response>.self, from: data)
        
        // Handle agent-level errors
        if let error = agentResponse.error {
            throw AgentError.agentError(error.code, error.message)
        }
        
        guard let responseData = agentResponse.data else {
            throw AgentError.missingResponseData
        }
        
        return responseData
    }
    
    private func buildURL(for agent: AgentType, request: any AgentRequest) -> URL {
        let endpoint = agent.endpoint
        return URL(string: "\(baseURL)/\(endpoint)")!
    }
    
    private func setupConnectivityMonitoring() {
        // Monitor network connectivity
        // Implementation would use Network framework
        isConnected = true // Placeholder
    }
}

// MARK: - Agent Types

enum AgentType: String, CaseIterable {
    case treeScoreCalculator = "treescore-calculator"
    case certifiedArborist = "certified-arborist"
    case safetyManager = "safety-manager"
    case fieldAssessor = "field-assessor"
    case arSpecialist = "ar-realitykit-specialist"
    case operationsManager = "operations-manager"
    case equipmentManager = "equipment-manager"
    case crewSupervisor = "crew-supervisor"
    case businessCycleOrchestrator = "business-cycle-orchestrator"
    case loadoutEconomicsManager = "loadout-economics-manager"
    case pphPerformanceTracker = "pph-performance-tracker"
    case predictiveOperationsOptimizer = "predictive-operations-optimizer"
    
    var endpoint: String {
        switch self {
        case .treeScoreCalculator:
            return "agents/treeai-operations/calculate-treescore"
        case .certifiedArborist:
            return "agents/treeai-operations/arborist-assessment"
        case .safetyManager:
            return "agents/treeai-operations/safety-analysis"
        case .fieldAssessor:
            return "agents/treeai-operations/field-assessment"
        case .arSpecialist:
            return "agents/development-team/ar-guidance"
        case .operationsManager:
            return "agents/core/operations-intelligence"
        case .equipmentManager:
            return "agents/treeai-operations/equipment-optimization"
        case .crewSupervisor:
            return "agents/treeai-operations/crew-management"
        case .businessCycleOrchestrator:
            return "agents/treeai-operations/business-orchestration"
        case .loadoutEconomicsManager:
            return "agents/treeai-operations/loadout-economics"
        case .pphPerformanceTracker:
            return "agents/treeai-operations/performance-tracking"
        case .predictiveOperationsOptimizer:
            return "agents/treeai-operations/predictive-optimization"
        }
    }
    
    var displayName: String {
        switch self {
        case .treeScoreCalculator:
            return "TreeScore Calculator"
        case .certifiedArborist:
            return "Certified Arborist"
        case .safetyManager:
            return "Safety Manager"
        case .fieldAssessor:
            return "Field Assessor"
        case .arSpecialist:
            return "AR Specialist"
        case .operationsManager:
            return "Operations Manager"
        case .equipmentManager:
            return "Equipment Manager"
        case .crewSupervisor:
            return "Crew Supervisor"
        case .businessCycleOrchestrator:
            return "Business Orchestrator"
        case .loadoutEconomicsManager:
            return "Economics Manager"
        case .pphPerformanceTracker:
            return "Performance Tracker"
        case .predictiveOperationsOptimizer:
            return "Operations Optimizer"
        }
    }
}

// MARK: - Request/Response Protocols

protocol AgentRequest: Codable {
    var requestType: String { get }
}

protocol AgentResponse: Codable {
    var success: Bool { get }
    var timestamp: TimeInterval { get }
    var confidence: Double { get }
}

// MARK: - Wrapper Types

struct AgentRequestWrapper<T: AgentRequest>: Codable {
    let agentType: String
    let requestId: String
    let timestamp: TimeInterval
    let data: T
}

struct AgentResponseWrapper<T: AgentResponse>: Codable {
    let success: Bool
    let data: T?
    let error: AgentErrorResponse?
    let metadata: AgentResponseMetadata
}

struct AgentErrorResponse: Codable {
    let code: String
    let message: String
    let details: [String: String]?
}

struct AgentResponseMetadata: Codable {
    let agentId: String
    let agentVersion: String
    let processingTime: TimeInterval
    let requestId: String
}

// MARK: - Agent Updates

struct AgentUpdate {
    let type: UpdateType
    let message: String
    let progress: Double?
    let data: [String: Any]?
    
    enum UpdateType {
        case progress
        case status
        case warning
        case error
        case completed
    }
}

// MARK: - Error Types

enum AgentError: Error, LocalizedError {
    case communicationFailed(String, Error)
    case agentError(String, String)
    case invalidResponse
    case httpError(Int)
    case missingResponseData
    case timeout
    case networkUnavailable
    
    var errorDescription: String? {
        switch self {
        case .communicationFailed(let agent, let error):
            return "Failed to communicate with \(agent): \(error.localizedDescription)"
        case .agentError(let code, let message):
            return "Agent error (\(code)): \(message)"
        case .invalidResponse:
            return "Invalid response from agent"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .missingResponseData:
            return "No response data received"
        case .timeout:
            return "Request timed out"
        case .networkUnavailable:
            return "Network unavailable"
        }
    }
}

// MARK: - Agent Service Factory

class AgentServiceFactory {
    static let shared = AgentServiceFactory()
    private let communicationManager = AgentCommunicationManager()
    
    private init() {}
    
    func createTreeScoreService() -> TreeScoreAgentService {
        return TreeScoreAgentService(communicationManager: communicationManager)
    }
    
    func createSafetyService() -> SafetyAgentService {
        return SafetyAgentService(communicationManager: communicationManager)
    }
    
    func createAssessmentService() -> AssessmentAgentService {
        return AssessmentAgentService(communicationManager: communicationManager)
    }
    
    func createARService() -> ARAgentService {
        return ARAgentService(communicationManager: communicationManager)
    }
    
    func createOperationsService() -> OperationsAgentService {
        return OperationsAgentService(communicationManager: communicationManager)
    }
}