import SwiftUI

/// Professional Alex AI chat interface for tree service operations
struct AlexChatView: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    @EnvironmentObject var arSessionManager: ARSessionManager
    @State private var chatManager = AlexChatManager()
    @State private var messageText = ""
    @State private var showingQuickActions = false
    @State private var isListening = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Chat messages area
                ChatMessagesView(messages: chatManager.messages)
                
                // Quick actions panel
                if showingQuickActions {
                    QuickActionsPanel()
                        .transition(.move(edge: .bottom))
                }
                
                // Input area
                ChatInputView(
                    messageText: $messageText,
                    isListening: $isListening,
                    showingQuickActions: $showingQuickActions,
                    onSend: sendMessage,
                    onVoiceToggle: toggleVoiceInput
                )
            }
            .navigationTitle("Alex AI Assistant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("Clear Chat") {
                            chatManager.clearMessages()
                        }
                        
                        Button("Export Conversation") {
                            // Export chat history
                        }
                        
                        Button("Alex Settings") {
                            // Navigate to Alex settings
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
        .navigationViewStyle(.stack)
        .onAppear {
            initializeChatSession()
        }
    }
    
    private func sendMessage() {
        guard !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        let userMessage = ChatMessage(
            content: messageText,
            sender: .user,
            timestamp: Date()
        )
        
        chatManager.addMessage(userMessage)
        
        let messageToSend = messageText
        messageText = ""
        
        // Process message with Alex
        chatManager.processMessage(messageToSend) { response in
            DispatchQueue.main.async {
                if let action = response.suggestedAction {
                    handleSuggestedAction(action)
                }
            }
        }
    }
    
    private func toggleVoiceInput() {
        isListening.toggle()
        
        if isListening {
            // Start voice recording
            startVoiceRecording()
        } else {
            // Stop and process voice
            stopVoiceRecording()
        }
    }
    
    private func handleSuggestedAction(_ action: AlexAction) {
        switch action {
        case .startAssessment:
            workflowManager.startAssessment()
        case .takeHeight:
            arSessionManager.activateAR(for: .heightMeasurement)
        case .takeDBH:
            arSessionManager.activateAR(for: .dbhMeasurement)
        case .riskAssessment:
            arSessionManager.activateAR(for: .riskAssessment)
        case .showDashboard:
            // Navigate to dashboard
            break
        }
    }
    
    private func initializeChatSession() {
        if chatManager.messages.isEmpty {
            let welcomeMessage = ChatMessage(
                content: "Hello! I'm Alex, your AI assistant for tree assessments. I can help you measure trees, assess risks, calculate TreeScores, and answer any questions about tree care. How can I help you today?",
                sender: .alex,
                timestamp: Date()
            )
            chatManager.addMessage(welcomeMessage)
        }
    }
    
    private func startVoiceRecording() {
        // Implement voice recording
    }
    
    private func stopVoiceRecording() {
        // Process voice input
        isListening = false
    }
}

/// Chat messages display area
struct ChatMessagesView: View {
    let messages: [ChatMessage]
    
    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(messages) { message in
                        ChatMessageBubble(message: message)
                            .id(message.id)
                    }
                }
                .padding()
            }
            .onChange(of: messages.count) { _ in
                if let lastMessage = messages.last {
                    withAnimation(.easeOut(duration: 0.3)) {
                        proxy.scrollTo(lastMessage.id, anchor: .bottom)
                    }
                }
            }
        }
        .background(Color(.systemGroupedBackground))
    }
}

/// Individual chat message bubble
struct ChatMessageBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.sender == .user {
                Spacer(minLength: 40)
            }
            
            VStack(alignment: message.sender == .user ? .trailing : .leading, spacing: 4) {
                // Message content
                Text(message.content)
                    .font(.body)
                    .foregroundColor(message.sender == .user ? .white : .primary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 18)
                            .fill(message.sender == .user ? Color.blue : Color(.systemBackground))
                    )
                    .shadow(radius: 1)
                
                // Timestamp
                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                
                // Action buttons for Alex messages
                if message.sender == .alex && !message.actionButtons.isEmpty {
                    MessageActionButtons(actions: message.actionButtons)
                }
            }
            
            if message.sender == .alex {
                Spacer(minLength: 40)
            }
        }
    }
}

/// Action buttons for Alex messages
struct MessageActionButtons: View {
    let actions: [MessageAction]
    
    var body: some View {
        VStack(spacing: 8) {
            ForEach(actions) { action in
                Button(action.title) {
                    action.handler()
                }
                .font(.subheadline.weight(.semibold))
                .foregroundColor(.blue)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(20)
            }
        }
        .padding(.top, 4)
    }
}

/// Quick actions panel
struct QuickActionsPanel: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    @EnvironmentObject var arSessionManager: ARSessionManager
    
    let quickActions: [QuickChatAction] = [
        QuickChatAction(
            title: "Start Assessment",
            icon: "plus.circle.fill",
            message: "Start a new tree assessment"
        ),
        QuickChatAction(
            title: "Measure Height",
            icon: "ruler.fill",
            message: "How do I measure tree height?"
        ),
        QuickChatAction(
            title: "Safety Check",
            icon: "shield.checkerboard",
            message: "Perform safety assessment"
        ),
        QuickChatAction(
            title: "Calculate TreeScore",
            icon: "function",
            message: "How is TreeScore calculated?"
        ),
        QuickChatAction(
            title: "Equipment Help",
            icon: "wrench.and.screwdriver.fill",
            message: "What equipment do I need?"
        ),
        QuickChatAction(
            title: "Emergency",
            icon: "exclamationmark.triangle.fill",
            message: "Emergency situation help"
        )
    ]
    
    let columns = Array(repeating: GridItem(.flexible()), count: 3)
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Quick Actions")
                    .font(.headline.weight(.semibold))
                    .foregroundColor(.primary)
                
                Spacer()
            }
            .padding(.horizontal)
            
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(quickActions) { action in
                    QuickActionButton(action: action)
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
        .cornerRadius(16, corners: [.topLeft, .topRight])
        .shadow(radius: 4)
    }
}

/// Quick action button for chat
struct QuickActionButton: View {
    let action: QuickChatAction
    @EnvironmentObject var chatManager: AlexChatManager
    
    var body: some View {
        Button(action: {
            // Send predefined message
            let message = ChatMessage(
                content: action.message,
                sender: .user,
                timestamp: Date()
            )
            chatManager.addMessage(message)
            chatManager.processMessage(action.message) { _ in }
        }) {
            VStack(spacing: 8) {
                Image(systemName: action.icon)
                    .font(.title2)
                    .foregroundColor(.blue)
                
                Text(action.title)
                    .font(.caption.weight(.semibold))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 80)
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }
}

/// Chat input area with voice support
struct ChatInputView: View {
    @Binding var messageText: String
    @Binding var isListening: Bool
    @Binding var showingQuickActions: Bool
    let onSend: () -> Void
    let onVoiceToggle: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Divider()
            
            HStack(spacing: 12) {
                // Quick actions button
                Button(action: {
                    showingQuickActions.toggle()
                }) {
                    Image(systemName: showingQuickActions ? "chevron.down" : "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
                
                // Text input field
                HStack {
                    TextField("Ask Alex anything...", text: $messageText, axis: .vertical)
                        .textFieldStyle(.plain)
                        .lineLimit(1...4)
                    
                    // Voice input button
                    Button(action: onVoiceToggle) {
                        Image(systemName: isListening ? "mic.fill" : "mic")
                            .font(.title2)
                            .foregroundColor(isListening ? .red : .blue)
                            .scaleEffect(isListening ? 1.2 : 1.0)
                            .animation(.easeInOut(duration: 0.1), value: isListening)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.systemGray6))
                .cornerRadius(20)
                
                // Send button
                Button(action: onSend) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundColor(messageText.isEmpty ? .gray : .blue)
                }
                .disabled(messageText.isEmpty)
            }
            .padding()
        }
        .background(Color(.systemBackground))
    }
}

/// Alex AI Chat Manager
class AlexChatManager: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var isTyping = false
    
    func addMessage(_ message: ChatMessage) {
        messages.append(message)
    }
    
    func clearMessages() {
        messages.removeAll()
    }
    
    func processMessage(_ content: String, completion: @escaping (AlexResponse) -> Void) {
        isTyping = true
        
        // Simulate processing delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            let response = self.generateAlexResponse(to: content)
            
            let alexMessage = ChatMessage(
                content: response.message,
                sender: .alex,
                timestamp: Date(),
                actionButtons: response.actionButtons
            )
            
            self.addMessage(alexMessage)
            self.isTyping = false
            
            completion(response)
        }
    }
    
    private func generateAlexResponse(to message: String) -> AlexResponse {
        let lowercasedMessage = message.lowercased()
        
        // Tree measurement responses
        if lowercasedMessage.contains("height") || lowercasedMessage.contains("measure") {
            return AlexResponse(
                message: "I can help you measure tree height using AR! Just point your device at the base of the tree, then slowly move to the top. The AR system will calculate the height automatically.",
                suggestedAction: .takeHeight,
                actionButtons: [
                    MessageAction(title: "Start Height Measurement") {
                        // Trigger height measurement
                    }
                ]
            )
        }
        
        // Assessment responses
        if lowercasedMessage.contains("assessment") || lowercasedMessage.contains("start") {
            return AlexResponse(
                message: "Great! Let's start a comprehensive tree assessment. I'll guide you through each step: basic measurements, risk evaluation, and TreeScore calculation.",
                suggestedAction: .startAssessment,
                actionButtons: [
                    MessageAction(title: "Begin Assessment") {
                        // Start assessment workflow
                    }
                ]
            )
        }
        
        // Safety responses
        if lowercasedMessage.contains("safety") || lowercasedMessage.contains("risk") {
            return AlexResponse(
                message: "Safety is paramount! Always wear proper PPE, check for power lines, and assess environmental conditions before starting. I can perform an AI-powered risk scan to identify potential hazards.",
                actionButtons: [
                    MessageAction(title: "Risk Assessment") {
                        // Start risk assessment
                    }
                ]
            )
        }
        
        // TreeScore responses
        if lowercasedMessage.contains("treescore") || lowercasedMessage.contains("calculate") {
            return AlexResponse(
                message: "TreeScore is calculated using the formula: Height × (Crown Radius × 2) × (DBH ÷ 12), then adjusted for risk factors. Higher scores indicate healthier, more valuable trees.",
                actionButtons: [
                    MessageAction(title: "Calculate TreeScore") {
                        // Calculate TreeScore
                    }
                ]
            )
        }
        
        // Emergency responses
        if lowercasedMessage.contains("emergency") || lowercasedMessage.contains("help") {
            return AlexResponse(
                message: "If this is an emergency, stop work immediately and call 911. For tree-related emergencies: secure the area, contact your supervisor, and document the situation with photos if safe to do so.",
                actionButtons: [
                    MessageAction(title: "Emergency Contacts") {
                        // Show emergency contacts
                    }
                ]
            )
        }
        
        // Default response
        return AlexResponse(
            message: "I'm here to help with tree assessments, measurements, safety questions, and TreeScore calculations. What specific assistance do you need?",
            actionButtons: [
                MessageAction(title: "Start Assessment") {
                    // Start assessment
                },
                MessageAction(title: "Ask About Safety") {
                    // Safety info
                }
            ]
        )
    }
}

// MARK: - Supporting Types

struct ChatMessage: Identifiable {
    let id = UUID()
    let content: String
    let sender: MessageSender
    let timestamp: Date
    let actionButtons: [MessageAction]
    
    init(content: String, sender: MessageSender, timestamp: Date, actionButtons: [MessageAction] = []) {
        self.content = content
        self.sender = sender
        self.timestamp = timestamp
        self.actionButtons = actionButtons
    }
}

enum MessageSender {
    case user
    case alex
}

struct MessageAction: Identifiable {
    let id = UUID()
    let title: String
    let handler: () -> Void
}

struct QuickChatAction: Identifiable {
    let id = UUID()
    let title: String
    let icon: String
    let message: String
}

struct AlexResponse {
    let message: String
    let suggestedAction: AlexAction?
    let actionButtons: [MessageAction]
    
    init(message: String, suggestedAction: AlexAction? = nil, actionButtons: [MessageAction] = []) {
        self.message = message
        self.suggestedAction = suggestedAction
        self.actionButtons = actionButtons
    }
}

enum AlexAction {
    case startAssessment
    case takeHeight
    case takeDBH
    case riskAssessment
    case showDashboard
}

#Preview {
    AlexChatView()
        .environmentObject(AssessmentWorkflowManager())
        .environmentObject(ARSessionManager())
}