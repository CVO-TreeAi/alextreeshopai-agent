import { mutation, query, internalQuery } from "../_generated/server";
import { v } from "convex/values";

// =============================================================================
// CONVERSATION MEMORY & CONTEXT MANAGEMENT
// =============================================================================

/**
 * Get or create a conversation session for persistent memory
 */
export const getOrCreateConversation = mutation({
  args: {
    sessionId: v.string(),
    userId: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    customerId: v.optional(v.id("customers")),
  },
  handler: async (ctx, args) => {
    // Try to find existing conversation
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!conversation) {
      // Create new conversation
      const conversationId = await ctx.db.insert("conversations", {
        sessionId: args.sessionId,
        userId: args.userId,
        deviceId: undefined,
        projectId: args.projectId,
        customerId: args.customerId,
        conversationType: "general",
        totalMessages: 0,
        totalTokensUsed: 0,
        averageResponseTime: 0,
        primaryClaudeModel: "sonnet",
        activeContextWindow: [],
        contextSummary: undefined,
        maxContextLength: 10,
        userSatisfaction: undefined,
        goalAchieved: undefined,
        intentAccuracy: 0.5,
        isActive: true,
        lastActivity: Date.now(),
        endedAt: undefined,
        endReason: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      return conversationId;
    }

    // Update existing conversation activity
    await ctx.db.patch(conversation._id, {
      lastActivity: Date.now(),
      isActive: true,
      updatedAt: Date.now(),
      // Update context if provided
      projectId: args.projectId || conversation.projectId,
      customerId: args.customerId || conversation.customerId,
    });

    return conversation._id;
  },
});

/**
 * Get conversation history for context
 */
export const getConversationHistory = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    includeSystem: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("conversation_messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(args.limit || 10);

    // Filter out system messages unless specifically requested
    const filteredMessages = args.includeSystem 
      ? messages 
      : messages.filter(msg => msg.role !== "system");

    // Return in chronological order (oldest first)
    return filteredMessages
      .reverse()
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        messageIndex: msg.messageIndex,
        intent: msg.intent,
        confidence: msg.confidence,
        createdAt: msg.createdAt,
        tokensUsed: msg.tokensUsed,
        responseTime: msg.responseTime,
      }));
  },
});

/**
 * Store conversation message with metadata
 */
export const storeMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.string(),
    content: v.string(),
    intent: v.optional(v.string()),
    intentConfidence: v.optional(v.number()),
    extractedEntities: v.optional(v.object({
      customerName: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
      serviceType: v.optional(v.string()),
      amount: v.optional(v.string()),
      treeHeight: v.optional(v.string()),
      treeDbh: v.optional(v.string()),
      treeSpecies: v.optional(v.string()),
      date: v.optional(v.string()),
    })),
    claudeModel: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    responseTime: v.optional(v.number()),
    contextUsed: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get conversation to determine next message index
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const messageIndex = conversation.totalMessages;

    // Store the message
    const messageId = await ctx.db.insert("conversation_messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      messageIndex: messageIndex,
      claudeModel: args.claudeModel,
      tokensUsed: args.tokensUsed,
      responseTime: args.responseTime,
      confidence: args.intentConfidence,
      intent: args.intent,
      extractedEntities: args.extractedEntities,
      contextUsed: args.contextUsed,
      relevantDocuments: undefined,
      wasHelpful: undefined,
      userFeedback: undefined,
      createdAt: Date.now(),
    });

    // Update conversation statistics
    const newTotalMessages = conversation.totalMessages + 1;
    const newTotalTokens = conversation.totalTokensUsed + (args.tokensUsed || 0);
    
    let newAverageResponseTime = conversation.averageResponseTime;
    if (args.responseTime && args.role === "assistant") {
      // Calculate running average for assistant response times only
      const assistantMessages = newTotalMessages / 2; // Rough estimate
      newAverageResponseTime = (conversation.averageResponseTime * (assistantMessages - 1) + args.responseTime) / assistantMessages;
    }

    let newIntentAccuracy = conversation.intentAccuracy;
    if (args.intentConfidence && args.role === "user") {
      // Update running average of intent classification accuracy
      const userMessages = Math.ceil(newTotalMessages / 2);
      newIntentAccuracy = (conversation.intentAccuracy * (userMessages - 1) + args.intentConfidence) / userMessages;
    }

    await ctx.db.patch(args.conversationId, {
      totalMessages: newTotalMessages,
      totalTokensUsed: newTotalTokens,
      averageResponseTime: newAverageResponseTime,
      intentAccuracy: newIntentAccuracy,
      primaryClaudeModel: args.claudeModel || conversation.primaryClaudeModel,
      lastActivity: Date.now(),
      updatedAt: Date.now(),
      // Update active context window (keep last N message IDs)
      activeContextWindow: [
        ...conversation.activeContextWindow.slice(-9), // Keep last 9
        messageId.toString() // Add new message ID
      ].slice(-10), // Ensure max 10 messages
    });

    return messageId;
  },
});

/**
 * Update conversation context summary
 */
export const updateContextSummary = mutation({
  args: {
    conversationId: v.id("conversations"),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      contextSummary: args.summary,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get conversation analytics
 */
export const getConversationAnalytics = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      return null;
    }

    // Get recent messages for detailed analysis
    const recentMessages = await ctx.db
      .query("conversation_messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(20);

    // Calculate metrics
    const userMessages = recentMessages.filter(m => m.role === "user");
    const assistantMessages = recentMessages.filter(m => m.role === "assistant");
    
    const avgResponseTime = assistantMessages.length > 0 
      ? assistantMessages.reduce((sum, m) => sum + (m.responseTime || 0), 0) / assistantMessages.length
      : 0;

    const avgConfidence = userMessages.length > 0
      ? userMessages.reduce((sum, m) => sum + (m.confidence || 0.5), 0) / userMessages.length
      : 0.5;

    const totalTokens = recentMessages.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);

    return {
      conversationId: args.conversationId,
      sessionId: conversation.sessionId,
      totalMessages: conversation.totalMessages,
      averageResponseTime: avgResponseTime,
      averageConfidence: avgConfidence,
      totalTokensUsed: totalTokens,
      intentAccuracy: conversation.intentAccuracy,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt,
      lastActivity: conversation.lastActivity,
      conversationType: conversation.conversationType,
      userSatisfaction: conversation.userSatisfaction,
      goalAchieved: conversation.goalAchieved,
    };
  },
});

/**
 * End conversation with feedback
 */
export const endConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    endReason: v.string(),
    userSatisfaction: v.optional(v.number()),
    goalAchieved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      isActive: false,
      endedAt: Date.now(),
      endReason: args.endReason,
      userSatisfaction: args.userSatisfaction,
      goalAchieved: args.goalAchieved,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get active conversations for monitoring
 */
export const getActiveConversations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .take(args.limit || 50);

    return conversations.map(conv => ({
      _id: conv._id,
      sessionId: conv.sessionId,
      userId: conv.userId,
      totalMessages: conv.totalMessages,
      lastActivity: conv.lastActivity,
      conversationType: conv.conversationType,
      averageResponseTime: conv.averageResponseTime,
      intentAccuracy: conv.intentAccuracy,
    }));
  },
});

/**
 * Clean up old inactive conversations
 */
export const cleanupOldConversations = mutation({
  args: {
    olderThanDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.olderThanDays || 30) * 24 * 60 * 60 * 1000;
    
    const oldConversations = await ctx.db
      .query("conversations")
      .withIndex("by_lastActivity", (q) => q.lt("lastActivity", cutoffTime))
      .filter((q) => q.eq(q.field("isActive"), false))
      .collect();

    let cleaned = 0;
    for (const conv of oldConversations) {
      // Archive conversation (mark as archived rather than delete)
      await ctx.db.patch(conv._id, {
        endReason: "archived_old",
        updatedAt: Date.now(),
      });
      cleaned++;
    }

    return { conversationsCleaned: cleaned };
  },
});