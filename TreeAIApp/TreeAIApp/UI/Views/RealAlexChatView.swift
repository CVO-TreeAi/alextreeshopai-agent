import SwiftUI

/// Real Alex AI chat interface with agent coordination
struct RealAlexChatView: View {
    @StateObject private var agentServices = RealTreeAIAgentServices()
    @StateObject private var locationManager = LocationManager()
    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    @State private var isLoading = false
    @State private var sessionId = UUID().uuidString
    
    var body: some View {
        NavigationView {
            VStack {
                // Messages List
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            // Welcome message
                            if messages.isEmpty {
                                WelcomeMessage()
                            }
                            
                            ForEach(messages) { message in
                                ChatMessageView(message: message)
                                    .id(message.id)
                            }
                            
                            if isLoading {
                                TypingIndicator()
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _ in
                        if let lastMessage = messages.last {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
                
                // Input Area
                ChatInputView(
                    text: $inputText,
                    isLoading: isLoading,
                    onSend: sendMessage
                )
            }
            .navigationTitle("Alex AI")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("Clear Chat") { clearChat() }
                        Button("New Session") { startNewSession() }
                        Button("Export Chat") { exportChat() }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
        .onAppear {
            setupInitialMessage()
        }
    }
    
    private func setupInitialMessage() {
        let welcomeMessage = ChatMessage(
            id: UUID(),
            content: "Hi! I'm Alex, your TreeAI assistant. I'm connected to 30 specialist agents and can help you with tree assessment, safety monitoring, cost calculations, crew optimization, and much more. What would you like to work on today?",
            sender: .alex,
            timestamp: Date(),
            messageType: .text
        )
        messages.append(welcomeMessage)
    }
    
    private func sendMessage() {
        guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        let userMessage = ChatMessage(
            id: UUID(),
            content: inputText,
            sender: .user,
            timestamp: Date(),
            messageType: .text
        )
        
        messages.append(userMessage)
        let messageText = inputText
        inputText = ""
        isLoading = true
        
        Task {
            await processMessage(messageText)
        }
    }
    
    private func processMessage(_ text: String) async {
        do {
            // Create conversation context
            let context = ConversationContext(
                sessionId: sessionId,
                previousMessages: messages.suffix(5).map { $0.content },
                currentProject: nil,
                userRole: "Field Operator",
                intent: classifyIntent(text)
            )
            
            // Send to Alex AI with agent coordination
            let response = try await agentServices.queryAlexAI(
                message: text,
                context: context
            )
            
            await MainActor.run {
                let alexMessage = ChatMessage(
                    id: UUID(),
                    content: response.message,
                    sender: .alex,
                    timestamp: Date(),
                    messageType: .text,
                    agentActions: response.actions,
                    confidence: response.confidence
                )
                
                messages.append(alexMessage)
                isLoading = false
                
                // Process any agent actions
                processAgentActions(response.actions)
            }
            
        } catch {
            await MainActor.run {
                let errorMessage = ChatMessage(
                    id: UUID(),
                    content: "I apologize, but I'm having trouble connecting to my specialist agents right now. Please try again in a moment.",
                    sender: .alex,
                    timestamp: Date(),
                    messageType: .error
                )
                
                messages.append(errorMessage)
                isLoading = false
            }
        }
    }
    
    private func classifyIntent(_ text: String) -> String {
        let lowercased = text.lowercased()
        
        if lowercased.contains("treescore") || lowercased.contains("calculate") || lowercased.contains("cost") {
            return "calculate_treescore"
        } else if lowercased.contains("safety") || lowercased.contains("risk") || lowercased.contains("hazard") {
            return "safety_assessment"
        } else if lowercased.contains("crew") || lowercased.contains("team") || lowercased.contains("worker") {
            return "crew_optimization"
        } else if lowercased.contains("equipment") || lowercased.contains("tools") || lowercased.contains("machinery") {
            return "equipment_optimization"
        } else if lowercased.contains("weather") || lowercased.contains("rain") || lowercased.contains("wind") {
            return "weather_analysis"
        } else if lowercased.contains("measure") || lowercased.contains("height") || lowercased.contains("dbh") {
            return "measurement_guidance"
        } else {
            return "general_inquiry"
        }
    }
    
    private func processAgentActions(_ actions: [AgentAction]) {
        for action in actions {
            // Process each agent action
            switch action.type {
            case "measurement":
                // Trigger AR measurement
                break
            case "safety_check":
                // Trigger safety assessment
                break
            case "cost_calculation":
                // Trigger cost calculation
                break
            default:
                break
            }
        }
    }
    
    private func clearChat() {
        messages.removeAll()
        setupInitialMessage()
    }
    
    private func startNewSession() {
        sessionId = UUID().uuidString
        clearChat()
    }
    
    private func exportChat() {
        // Export chat functionality
    }
}

struct ChatMessageView: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.sender == .user {
                Spacer()
            }
            
            VStack(alignment: message.sender == .user ? .trailing : .leading, spacing: 4) {
                // Message bubble
                Text(message.content)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(
                        message.sender == .user 
                        ? Color.blue 
                        : Color(.systemGray5)
                    )
                    .foregroundColor(
                        message.sender == .user 
                        ? .white 
                        : .primary
                    )
                    .cornerRadius(16)
                
                // Metadata
                HStack(spacing: 8) {
                    if message.sender == .alex && message.messageType != .error {
                        Image(systemName: "brain.head.profile")
                            .font(.caption2)
                            .foregroundColor(.blue)
                    }
                    
                    Text(message.timestamp, style: .time)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    if let confidence = message.confidence, message.sender == .alex {
                        Text("\(Int(confidence * 100))% confident")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .frame(maxWidth: 280, alignment: message.sender == .user ? .trailing : .leading)
            
            if message.sender == .alex {
                Spacer()
            }
        }
    }
}

struct ChatInputView: View {
    @Binding var text: String
    let isLoading: Bool
    let onSend: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            TextField("Ask Alex anything about tree care...", text: $text, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .disabled(isLoading)
                .onSubmit {
                    onSend()
                }
            
            Button(action: onSend) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
            .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isLoading)
        }
        .padding()
        .background(Color(.systemGray6))
    }
}

struct WelcomeMessage: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .font(.title)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading) {
                    Text("Alex AI")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("Your TreeAI Assistant")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            Text("I'm connected to 30 specialist agents and can help you with:")
                .font(.subheadline)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                CapabilityTag(text: "TreeScore Calculations", icon: "tree.fill")
                CapabilityTag(text: "Safety Assessments", icon: "shield.fill")
                CapabilityTag(text: "Crew Optimization", icon: "person.3.fill")
                CapabilityTag(text: "Equipment Planning", icon: "gear.circle.fill")
                CapabilityTag(text: "Weather Analysis", icon: "cloud.fill")
                CapabilityTag(text: "AR Measurements", icon: "arkit")
            }
            
            Text("Try asking me something like:")
                .font(.subheadline)
                .padding(.top)
            
            VStack(alignment: .leading, spacing: 4) {
                ExampleQuery(text: "\"Calculate TreeScore for a 45-foot oak tree\"")
                ExampleQuery(text: "\"What's the current safety risk level?\"")
                ExampleQuery(text: "\"Optimize my crew for today's projects\"")
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct CapabilityTag: View {
    let text: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.blue)
            
            Text(text)
                .font(.caption)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.blue.opacity(0.1))
        .cornerRadius(6)
    }
}

struct ExampleQuery: View {
    let text: String
    
    var body: some View {
        Text(text)
            .font(.caption)
            .foregroundColor(.secondary)
            .italic()
            .padding(.leading, 8)
    }
}

struct TypingIndicator: View {
    @State private var animating = false
    
    var body: some View {
        HStack {
            HStack(spacing: 4) {
                ForEach(0..<3) { index in
                    Circle()
                        .fill(Color.secondary)
                        .frame(width: 8, height: 8)
                        .opacity(animating ? 0.3 : 1.0)
                        .animation(
                            Animation.easeInOut(duration: 0.6)
                                .repeatForever()
                                .delay(Double(index) * 0.2),
                            value: animating
                        )
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color(.systemGray5))
            .cornerRadius(16)
            
            Spacer()
        }
        .onAppear {
            animating = true
        }
    }
}

// MARK: - Data Types

struct ChatMessage: Identifiable {
    let id: UUID
    let content: String
    let sender: MessageSender
    let timestamp: Date
    let messageType: MessageType
    var agentActions: [AgentAction] = []
    var confidence: Double?
    
    enum MessageSender {
        case user, alex
    }
    
    enum MessageType {
        case text, error, system
    }
}

#Preview {
    RealAlexChatView()
}