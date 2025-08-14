import { mutation, query, action, internalAction } from "../_generated/server";
import { v } from "convex/values";

// =============================================================================
// AGENT DECISION TRACKING & CONTINUOUS LEARNING PIPELINE
// =============================================================================

/**
 * Record agent decision for learning and improvement
 */
export const recordDecision = mutation({
  args: {
    sessionId: v.string(),
    conversationId: v.id("conversations"),
    projectId: v.optional(v.id("projects")),
    decisionType: v.string(),
    inputData: v.object({
      context: v.string(),
      parameters: v.any(),
      availableOptions: v.optional(v.array(v.string())),
      constraintsApplied: v.optional(v.array(v.string())),
    }),
    selectedOption: v.string(),
    reasoning: v.string(),
    confidence: v.number(),
    claudeModel: v.string(),
    responseTime: v.number(),
    tokensUsed: v.number(),
    alternativesConsidered: v.optional(v.array(v.object({
      option: v.string(),
      pros: v.array(v.string()),
      cons: v.array(v.string()),
      confidence: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const decisionId = await ctx.db.insert("agent_decisions", {
      sessionId: args.sessionId,
      conversationId: args.conversationId,
      projectId: args.projectId,
      decisionType: args.decisionType,
      inputData: args.inputData,
      selectedOption: args.selectedOption,
      reasoning: args.reasoning,
      confidence: args.confidence,
      alternativesConsidered: args.alternativesConsidered,
      wasCorrect: undefined,
      actualOutcome: undefined,
      outcomeConfidence: undefined,
      learningNote: undefined,
      improvementSuggestion: undefined,
      claudeModel: args.claudeModel,
      responseTime: args.responseTime,
      tokensUsed: args.tokensUsed,
      systemPromptVersion: undefined,
      createdAt: Date.now(),
      feedbackReceivedAt: undefined,
      learningAppliedAt: undefined,
    });

    return decisionId;
  },
});

/**
 * Record outcome feedback for a decision
 */
export const recordOutcome = mutation({
  args: {
    decisionId: v.id("agent_decisions"),
    wasCorrect: v.boolean(),
    actualOutcome: v.string(),
    outcomeConfidence: v.optional(v.number()),
    learningNote: v.optional(v.string()),
    improvementSuggestion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.decisionId, {
      wasCorrect: args.wasCorrect,
      actualOutcome: args.actualOutcome,
      outcomeConfidence: args.outcomeConfidence,
      learningNote: args.learningNote,
      improvementSuggestion: args.improvementSuggestion,
      feedbackReceivedAt: Date.now(),
    });

    // Trigger learning cycle if we have enough feedback
    const recentDecisions = await ctx.db
      .query("agent_decisions")
      .withIndex("by_wasCorrect", (q) => q.eq("wasCorrect", args.wasCorrect))
      .order("desc")
      .take(100);

    const feedbackCount = recentDecisions.filter(d => d.wasCorrect !== undefined).length;
    
    if (feedbackCount % 25 === 0) { // Trigger learning every 25 pieces of feedback
      await ctx.scheduler.runAfter(0, "learning:runLearningCycle", {
        triggerReason: "feedback_threshold",
        cycleType: "automated_feedback",
      });
    }
  },
});

/**
 * Run automated learning cycle to improve model performance
 */
export const runLearningCycle = internalAction({
  args: {
    triggerReason: v.string(),
    cycleType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    try {
      console.log(`Starting learning cycle: ${args.triggerReason}`);

      // Get recent decisions with feedback
      const recentDecisions = await ctx.runQuery("learning:getRecentDecisionsWithFeedback", {
        limit: 500,
      });

      if (recentDecisions.length < 10) {
        console.log("Not enough feedback data for learning cycle");
        return { success: false, reason: "insufficient_data" };
      }

      // Analyze decision patterns
      const analysis = await analyzeLearningPatterns(recentDecisions);
      
      // Calculate performance metrics by model
      const modelPerformance = calculateModelPerformance(recentDecisions);
      
      // Generate calibration recommendations
      const calibrationResults = generateCalibrationRecommendations(analysis);
      
      // Store learning cycle results
      const cycleNumber = await getNextCycleNumber(ctx);
      
      const learningCycleId = await ctx.runMutation("learning:storeLearningCycle", {
        cycleNumber,
        cycleType: args.cycleType || "automated_daily",
        projectsAnalyzed: analysis.projectsAnalyzed,
        decisionsEvaluated: recentDecisions.length,
        conversationsAnalyzed: analysis.conversationsAnalyzed,
        overallAccuracyRate: analysis.overallAccuracyRate,
        intentClassificationAccuracy: analysis.intentClassificationAccuracy,
        afissAssessmentAccuracy: analysis.afissAssessmentAccuracy,
        hoursPredictionMAE: analysis.hoursPredictionMAE || 0,
        costPredictionMAE: analysis.costPredictionMAE || 0,
        modelPerformance,
        factorsWeightAdjusted: calibrationResults.length,
        modelImprovementScore: analysis.improvementScore,
        calibrationResults,
        documentsAdded: 0,
        documentsUpdated: 0,
        embeddingsRefreshed: 0,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        successful: true,
        errorNotes: undefined,
      });

      // Apply calibration recommendations
      for (const calibration of calibrationResults) {
        await ctx.runMutation("learning:applyCalibration", {
          factorCode: calibration.factorCode,
          newWeight: calibration.newWeight,
          reason: calibration.reason,
          confidence: calibration.confidence,
        });
      }

      console.log(`Learning cycle completed: ${learningCycleId}`);
      
      return {
        success: true,
        cycleId: learningCycleId,
        decisionsAnalyzed: recentDecisions.length,
        improvementScore: analysis.improvementScore,
        calibrationsApplied: calibrationResults.length,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      console.error("Learning cycle failed:", error);
      
      // Store failed cycle
      const cycleNumber = await getNextCycleNumber(ctx);
      await ctx.runMutation("learning:storeLearningCycle", {
        cycleNumber,
        cycleType: args.cycleType || "automated_daily",
        projectsAnalyzed: 0,
        decisionsEvaluated: 0,
        conversationsAnalyzed: 0,
        overallAccuracyRate: 0,
        intentClassificationAccuracy: 0,
        afissAssessmentAccuracy: 0,
        hoursPredictionMAE: 0,
        costPredictionMAE: 0,
        modelPerformance: { haiku: undefined, sonnet: undefined, opus: undefined },
        factorsWeightAdjusted: 0,
        modelImprovementScore: 0,
        calibrationResults: [],
        documentsAdded: 0,
        documentsUpdated: 0,
        embeddingsRefreshed: 0,
        insights: [],
        recommendations: [],
        successful: false,
        errorNotes: String(error),
      });

      return { 
        success: false, 
        error: String(error), 
        duration: Date.now() - startTime 
      };
    }
  },
});

/**
 * Get recent decisions with feedback for learning
 */
export const getRecentDecisionsWithFeedback = query({
  args: {
    limit: v.optional(v.number()),
    decisionType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("agent_decisions");
    
    if (args.decisionType) {
      query = query.withIndex("by_decisionType", (q) => q.eq("decisionType", args.decisionType));
    }
    
    const decisions = await query
      .order("desc")
      .take(args.limit || 100);

    // Filter for decisions with feedback
    return decisions.filter(decision => decision.wasCorrect !== undefined);
  },
});

/**
 * Store learning cycle results
 */
export const storeLearningCycle = mutation({
  args: {
    cycleNumber: v.number(),
    cycleType: v.string(),
    projectsAnalyzed: v.number(),
    decisionsEvaluated: v.number(),
    conversationsAnalyzed: v.number(),
    overallAccuracyRate: v.number(),
    intentClassificationAccuracy: v.number(),
    afissAssessmentAccuracy: v.number(),
    hoursPredictionMAE: v.number(),
    costPredictionMAE: v.number(),
    modelPerformance: v.object({
      haiku: v.optional(v.object({
        accuracy: v.number(),
        averageResponseTime: v.number(),
        tokenEfficiency: v.number(),
        costPerRequest: v.number(),
      })),
      sonnet: v.optional(v.object({
        accuracy: v.number(),
        averageResponseTime: v.number(),
        tokenEfficiency: v.number(),
        costPerRequest: v.number(),
      })),
      opus: v.optional(v.object({
        accuracy: v.number(),
        averageResponseTime: v.number(),
        tokenEfficiency: v.number(),
        costPerRequest: v.number(),
      })),
    }),
    factorsWeightAdjusted: v.number(),
    modelImprovementScore: v.number(),
    calibrationResults: v.array(v.object({
      factorCode: v.string(),
      oldWeight: v.number(),
      newWeight: v.number(),
      confidence: v.number(),
      reason: v.string(),
    })),
    documentsAdded: v.number(),
    documentsUpdated: v.number(),
    embeddingsRefreshed: v.number(),
    insights: v.array(v.string()),
    recommendations: v.array(v.object({
      priority: v.string(),
      recommendation: v.string(),
      implementationNotes: v.optional(v.string()),
      estimatedImpact: v.optional(v.string()),
    })),
    successful: v.boolean(),
    errorNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const learningCycleId = await ctx.db.insert("learning_cycles", {
      ...args,
      startedAt: Date.now(),
      completedAt: Date.now(),
      nextCycleScheduled: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    return learningCycleId;
  },
});

/**
 * Apply calibration to AFISS factor weights
 */
export const applyCalibration = mutation({
  args: {
    factorCode: v.string(),
    newWeight: v.number(),
    reason: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    const factor = await ctx.db
      .query("afiss_factors")
      .withIndex("by_factorCode", (q) => q.eq("factorCode", args.factorCode))
      .first();

    if (!factor) {
      console.warn(`AFISS factor not found: ${args.factorCode}`);
      return false;
    }

    // Store calibration history
    const calibrationHistory = factor.calibrationHistory || [];
    calibrationHistory.push({
      timestamp: Date.now(),
      oldWeight: factor.currentWeight,
      newWeight: args.newWeight,
      reason: args.reason,
      confidence: args.confidence,
    });

    // Update factor
    await ctx.db.patch(factor._id, {
      currentWeight: args.newWeight,
      lastCalibrated: Date.now(),
      calibrationHistory: calibrationHistory.slice(-20), // Keep last 20 calibrations
    });

    return true;
  },
});

/**
 * Get learning performance metrics
 */
export const getLearningMetrics = query({
  args: {
    decisionType: v.optional(v.string()),
    timeRangeHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const timeFilter = args.timeRangeHours 
      ? Date.now() - (args.timeRangeHours * 60 * 60 * 1000)
      : Date.now() - (7 * 24 * 60 * 60 * 1000); // Default 7 days

    let query = ctx.db
      .query("agent_decisions")
      .withIndex("by_createdAt")
      .filter((q) => q.gte(q.field("createdAt"), timeFilter));

    if (args.decisionType) {
      // Filter by decision type if specified
      query = ctx.db
        .query("agent_decisions")
        .withIndex("by_decisionType", (q) => q.eq("decisionType", args.decisionType))
        .filter((q) => q.gte(q.field("createdAt"), timeFilter));
    }

    const decisions = await query.collect();
    
    const decisionsWithFeedback = decisions.filter(d => d.wasCorrect !== undefined);
    const correctDecisions = decisionsWithFeedback.filter(d => d.wasCorrect === true);
    
    const totalDecisions = decisions.length;
    const feedbackCount = decisionsWithFeedback.length;
    const successRate = feedbackCount > 0 ? correctDecisions.length / feedbackCount : 0;
    
    const avgConfidence = decisions.length > 0
      ? decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
      : 0;

    const avgResponseTime = decisions.length > 0
      ? decisions.reduce((sum, d) => sum + d.responseTime, 0) / decisions.length
      : 0;

    return {
      decisionType: args.decisionType || "all",
      timeRangeHours: args.timeRangeHours || 168,
      totalDecisions,
      decisionsWithFeedback: feedbackCount,
      successRate,
      averageConfidence: avgConfidence,
      averageResponseTime: avgResponseTime,
      totalTokensUsed: decisions.reduce((sum, d) => sum + d.tokensUsed, 0),
      modelBreakdown: {
        haiku: decisions.filter(d => d.claudeModel === "haiku").length,
        sonnet: decisions.filter(d => d.claudeModel === "sonnet").length,
        opus: decisions.filter(d => d.claudeModel === "opus").length,
      },
    };
  },
});

// =============================================================================
// HELPER FUNCTIONS FOR LEARNING ANALYSIS
// =============================================================================

async function analyzeLearningPatterns(decisions: any[]): Promise<{
  projectsAnalyzed: number;
  conversationsAnalyzed: number;
  overallAccuracyRate: number;
  intentClassificationAccuracy: number;
  afissAssessmentAccuracy: number;
  hoursPredictionMAE?: number;
  costPredictionMAE?: number;
  improvementScore: number;
  insights: string[];
  recommendations: Array<{
    priority: string;
    recommendation: string;
    implementationNotes?: string;
    estimatedImpact?: string;
  }>;
}> {
  const correctDecisions = decisions.filter(d => d.wasCorrect === true);
  const overallAccuracyRate = decisions.length > 0 ? correctDecisions.length / decisions.length : 0;

  const intentDecisions = decisions.filter(d => d.decisionType === "intent_classification");
  const intentAccuracy = intentDecisions.length > 0 
    ? intentDecisions.filter(d => d.wasCorrect === true).length / intentDecisions.length 
    : 0;

  const afissDecisions = decisions.filter(d => d.decisionType === "afiss_assessment");
  const afissAccuracy = afissDecisions.length > 0
    ? afissDecisions.filter(d => d.wasCorrect === true).length / afissDecisions.length
    : 0;

  const uniqueProjects = new Set(decisions.map(d => d.projectId).filter(Boolean)).size;
  const uniqueConversations = new Set(decisions.map(d => d.conversationId)).size;

  // Generate insights
  const insights = [];
  if (overallAccuracyRate > 0.9) {
    insights.push("High overall accuracy achieved - system performing well");
  } else if (overallAccuracyRate < 0.7) {
    insights.push("Overall accuracy below target - requires attention");
  }

  if (intentAccuracy < 0.85) {
    insights.push("Intent classification accuracy needs improvement");
  }

  if (afissAccuracy < 0.8) {
    insights.push("AFISS assessment accuracy requires calibration");
  }

  // Generate recommendations
  const recommendations = [];
  if (overallAccuracyRate < 0.8) {
    recommendations.push({
      priority: "high",
      recommendation: "Increase training data and improve prompt engineering",
      implementationNotes: "Focus on low-confidence decisions",
      estimatedImpact: "15-25% accuracy improvement",
    });
  }

  if (intentAccuracy < 0.9) {
    recommendations.push({
      priority: "medium",
      recommendation: "Enhance intent pattern matching and entity extraction",
      implementationNotes: "Add more business-specific patterns",
      estimatedImpact: "10-20% intent accuracy improvement",
    });
  }

  return {
    projectsAnalyzed: uniqueProjects,
    conversationsAnalyzed: uniqueConversations,
    overallAccuracyRate,
    intentClassificationAccuracy: intentAccuracy,
    afissAssessmentAccuracy: afissAccuracy,
    improvementScore: Math.min(overallAccuracyRate * 1.5, 1.0),
    insights,
    recommendations,
  };
}

function calculateModelPerformance(decisions: any[]) {
  const models = ["haiku", "sonnet", "opus"];
  const performance: any = {};

  for (const model of models) {
    const modelDecisions = decisions.filter(d => d.claudeModel === model);
    if (modelDecisions.length === 0) continue;

    const correctDecisions = modelDecisions.filter(d => d.wasCorrect === true);
    const accuracy = correctDecisions.length / modelDecisions.length;
    const avgResponseTime = modelDecisions.reduce((sum, d) => sum + d.responseTime, 0) / modelDecisions.length;
    const avgTokens = modelDecisions.reduce((sum, d) => sum + d.tokensUsed, 0) / modelDecisions.length;
    
    performance[model] = {
      accuracy,
      averageResponseTime: avgResponseTime,
      tokenEfficiency: avgTokens > 0 ? accuracy / (avgTokens / 1000) : 0,
      costPerRequest: avgTokens * 0.00001, // Rough estimate
    };
  }

  return performance;
}

function generateCalibrationRecommendations(analysis: any): Array<{
  factorCode: string;
  oldWeight: number;
  newWeight: number;
  confidence: number;
  reason: string;
}> {
  const calibrations = [];

  // Example calibration logic - would be more sophisticated in practice
  if (analysis.afissAssessmentAccuracy < 0.8) {
    calibrations.push({
      factorCode: "AF_ACCESS_001",
      oldWeight: 0.15,
      newWeight: 0.12,
      confidence: 0.8,
      reason: "AFISS accuracy below target - reducing access factor weight based on feedback",
    });
  }

  return calibrations;
}

async function getNextCycleNumber(ctx: any): Promise<number> {
  const lastCycle = await ctx.runQuery("learning:getLastLearningCycle", {});
  return lastCycle ? lastCycle.cycleNumber + 1 : 1;
}

/**
 * Get the last learning cycle
 */
export const getLastLearningCycle = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("learning_cycles")
      .withIndex("by_cycleNumber")
      .order("desc")
      .first();
  },
});