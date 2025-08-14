import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // =============================================================================
  // CORE BUSINESS ENTITIES
  // =============================================================================
  
  customers: defineTable({
    // QuickBooks Integration
    customerNumber: v.string(),
    displayName: v.string(),
    companyName: v.optional(v.string()),
    isCompany: v.boolean(),
    
    // Contact Information
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    primaryPhone: v.optional(v.string()),
    email: v.optional(v.string()),
    
    // Address Information
    billingAddressLine1: v.optional(v.string()),
    billingCity: v.optional(v.string()),
    billingState: v.optional(v.string()),
    billingZipCode: v.optional(v.string()),
    
    // Financial Data
    accountBalance: v.number(),
    totalLifetimeValue: v.number(),
    averageJobValue: v.number(),
    jobCount: v.number(),
    
    // Business Intelligence
    customerType: v.optional(v.string()),
    businessType: v.optional(v.string()),
    leadSource: v.optional(v.string()),
    lastContactDate: v.optional(v.number()),
    
    // Status & Metadata
    isActive: v.boolean(),
    isBlocked: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customerNumber", ["customerNumber"])
    .index("by_email", ["email"])
    .index("by_businessType", ["businessType"])
    .index("by_isActive", ["isActive"])
    .index("by_displayName", ["displayName"])
    .index("by_totalLifetimeValue", ["totalLifetimeValue"]),

  // Tree Inventory with TreeScore Calculations
  trees: defineTable({
    customerId: v.id("customers"),
    
    // Tree Identification & Measurements
    species: v.string(),
    height: v.number(), // feet
    dbh: v.number(), // inches (Diameter at Breast Height)
    crownRadius: v.number(), // feet
    
    // TreeScore Calculation: Height × (Crown Radius × 2) × (DBH ÷ 12)
    baseTreeScore: v.number(),
    
    // Tree Health & Risk Assessment
    healthStatus: v.string(), // "excellent", "good", "fair", "poor", "dead"
    condition: v.optional(v.string()),
    riskAssessment: v.optional(v.string()),
    
    // Location & Context
    locationNotes: v.optional(v.string()),
    gpsCoordinates: v.optional(v.array(v.number())), // [latitude, longitude]
    propertyZone: v.optional(v.string()), // "front", "back", "side"
    
    // Service History
    lastServiceDate: v.optional(v.number()),
    serviceHistory: v.optional(v.array(v.string())),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_species", ["species"])
    .index("by_healthStatus", ["healthStatus"])
    .index("by_baseTreeScore", ["baseTreeScore"])
    .index("by_gpsCoordinates", ["gpsCoordinates"]),

  // Project Management with AFISS Integration
  projects: defineTable({
    customerId: v.id("customers"),
    projectNumber: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    
    // TreeScore Analysis
    totalTreeScore: v.number(),
    treeCount: v.number(),
    averageTreeScore: v.number(),
    
    // AFISS Composite Assessment
    afissCompositeScore: v.number(),
    accessScore: v.number(),
    fallZoneScore: v.number(),
    interferenceScore: v.number(),
    severityScore: v.number(),
    siteConditionsScore: v.number(),
    complexityLevel: v.string(), // "simple", "moderate", "complex", "extreme"
    complexityMultiplier: v.number(),
    
    // Financial Estimates (USACE EP-1110-1-8 methodology)
    estimatedHours: v.number(),
    estimatedCost: v.number(),
    contractAmount: v.number(),
    bidAmount: v.number(),
    targetProfitMargin: v.number(),
    burdenMultiplier: v.number(), // 1.75x standard
    
    // Equipment & Crew Planning
    crewTypeRecommended: v.string(),
    equipmentRequired: v.array(v.string()),
    safetyProtocols: v.array(v.string()),
    isaCertifiedRequired: v.boolean(),
    
    // Project Status & Timeline
    status: v.string(), // "planning", "quoted", "approved", "in_progress", "completed", "cancelled"
    isActive: v.boolean(),
    isCompleted: v.boolean(),
    scheduledStartDate: v.optional(v.number()),
    actualStartDate: v.optional(v.number()),
    estimatedCompletionDate: v.optional(v.number()),
    actualCompletionDate: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_projectNumber", ["projectNumber"])
    .index("by_status", ["status"])
    .index("by_complexityLevel", ["complexityLevel"])
    .index("by_totalTreeScore", ["totalTreeScore"])
    .index("by_afissCompositeScore", ["afissCompositeScore"])
    .index("by_scheduledStartDate", ["scheduledStartDate"]),

  // =============================================================================
  // VECTOR EMBEDDINGS & RAG SYSTEM
  // =============================================================================
  
  embeddings: defineTable({
    // Document Identification
    documentId: v.string(),
    documentType: v.string(), // "afiss_factor", "tree_knowledge", "business_rule", "conversation", "project_data"
    
    // Vector Data (Claude AI Semantic Analysis: 100 dimensions)
    embedding: v.array(v.number()),
    embeddingModel: v.string(), // "claude-3-haiku-semantic"
    
    // Content & Context
    content: v.string(),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    
    // Metadata for Business Context
    metadata: v.object({
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      projectId: v.optional(v.id("projects")),
      customerId: v.optional(v.id("customers")),
      businessDomain: v.optional(v.string()), // "treescore", "afiss", "usace", "safety"
      importance: v.optional(v.string()), // "critical", "high", "medium", "low"
    }),
    
    // Usage & Performance Tracking
    accessCount: v.number(),
    lastAccessed: v.optional(v.number()),
    averageRelevanceScore: v.number(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_documentType", ["documentType"])
    .index("by_documentId", ["documentId"])
    .index("by_accessCount", ["accessCount"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 100,
    }),

  // AFISS Factor Database for Risk Assessment
  afiss_factors: defineTable({
    // Factor Identification
    factorCode: v.string(), // "AF_ACCESS_001", "FF_OVERHEAD_002", etc.
    domain: v.string(), // "access", "fall_zone", "interference", "severity", "site_conditions"
    
    // Factor Details
    name: v.string(),
    description: v.string(),
    category: v.string(),
    detailedGuidance: v.optional(v.string()),
    
    // Scoring Parameters
    basePercentage: v.number(), // Original difficulty percentage
    currentWeight: v.number(), // Learning-adjusted weight
    originalWeight: v.number(), // Original weight for comparison
    confidenceRange: v.array(v.number()), // [min, max] confidence bounds
    
    // Learning & Performance Data
    usageCount: v.number(),
    accuracyRate: v.number(), // 0-1 scale based on post-project feedback
    averageImpact: v.number(),
    confidenceScore: v.number(),
    
    // Calibration History
    lastCalibrated: v.optional(v.number()),
    calibrationHistory: v.optional(v.array(v.object({
      timestamp: v.number(),
      oldWeight: v.number(),
      newWeight: v.number(),
      reason: v.string(),
      confidence: v.number(),
    }))),
    
    // Related Factors & Dependencies
    relatedFactors: v.optional(v.array(v.string())), // Related factor codes
    exclusiveWith: v.optional(v.array(v.string())), // Mutually exclusive factors
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_factorCode", ["factorCode"])
    .index("by_domain", ["domain"])
    .index("by_category", ["category"])
    .index("by_usageCount", ["usageCount"])
    .index("by_accuracyRate", ["accuracyRate"])
    .index("by_currentWeight", ["currentWeight"]),

  // Project AFISS Assessment Results
  project_afiss_factors: defineTable({
    projectId: v.id("projects"),
    factorId: v.id("afiss_factors"),
    
    // Assessment Results
    triggered: v.boolean(),
    confidence: v.number(), // 0-1 scale
    impactScore: v.number(),
    reasoningText: v.string(),
    alternativesConsidered: v.optional(v.array(v.string())),
    
    // Alex AI Assessment Metadata
    claudeModel: v.string(), // "sonnet", "haiku", "opus"
    assessmentTime: v.number(), // milliseconds taken
    alexConfidence: v.optional(v.number()),
    tokenUsage: v.optional(v.number()),
    
    // Post-Completion Feedback & Learning
    wasAccurate: v.optional(v.boolean()), // Post-project validation
    actualImpact: v.optional(v.number()),
    feedbackNotes: v.optional(v.string()),
    learningApplied: v.optional(v.boolean()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_factor", ["factorId"])
    .index("by_triggered", ["triggered"])
    .index("by_confidence", ["confidence"])
    .index("by_project_triggered", ["projectId", "triggered"])
    .index("by_wasAccurate", ["wasAccurate"]),

  // =============================================================================
  // CONVERSATION MEMORY & NLP SYSTEM
  // =============================================================================
  
  conversations: defineTable({
    // Session Identification
    sessionId: v.string(),
    userId: v.optional(v.string()),
    deviceId: v.optional(v.string()),
    
    // Business Context
    projectId: v.optional(v.id("projects")),
    customerId: v.optional(v.id("customers")),
    conversationType: v.string(), // "assessment", "follow_up", "learning", "support", "general"
    
    // Session Metadata
    totalMessages: v.number(),
    totalTokensUsed: v.number(),
    averageResponseTime: v.number(),
    primaryClaudeModel: v.string(),
    
    // Context Window Management
    activeContextWindow: v.array(v.string()), // Message IDs in current context
    contextSummary: v.optional(v.string()),
    maxContextLength: v.number(),
    
    // Conversation Quality Metrics
    userSatisfaction: v.optional(v.number()), // 1-5 rating
    goalAchieved: v.optional(v.boolean()),
    intentAccuracy: v.number(), // Tracking AI intent classification accuracy
    
    // Session Status
    isActive: v.boolean(),
    lastActivity: v.number(),
    endedAt: v.optional(v.number()),
    endReason: v.optional(v.string()), // "user_ended", "timeout", "error"
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_userId", ["userId"])
    .index("by_projectId", ["projectId"])
    .index("by_customerId", ["customerId"])
    .index("by_isActive", ["isActive"])
    .index("by_lastActivity", ["lastActivity"])
    .index("by_conversationType", ["conversationType"]),

  // Individual Conversation Messages
  conversation_messages: defineTable({
    conversationId: v.id("conversations"),
    
    // Message Content
    role: v.string(), // "user", "assistant", "system", "function"
    content: v.string(),
    messageIndex: v.number(),
    
    // AI Processing Metadata
    claudeModel: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    responseTime: v.optional(v.number()), // milliseconds
    confidence: v.optional(v.number()),
    
    // Intent & Entity Recognition
    intent: v.optional(v.string()),
    intentConfidence: v.optional(v.number()),
    extractedEntities: v.optional(v.object({
      customerName: v.optional(v.string()),
      treeData: v.optional(v.array(v.any())),
      locations: v.optional(v.array(v.string())),
      services: v.optional(v.array(v.string())),
      amounts: v.optional(v.array(v.number())),
      dates: v.optional(v.array(v.string())),
    })),
    
    // Context & Retrieval
    contextUsed: v.optional(v.array(v.string())), // Document IDs used for context
    relevantDocuments: v.optional(v.array(v.object({
      documentId: v.string(),
      relevanceScore: v.number(),
      usedInResponse: v.boolean(),
    }))),
    
    // Quality & Feedback
    wasHelpful: v.optional(v.boolean()),
    userFeedback: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_messageIndex", ["conversationId", "messageIndex"])
    .index("by_role", ["role"])
    .index("by_intent", ["intent"])
    .index("by_createdAt", ["createdAt"]),

  // =============================================================================
  // AGENT DECISION TRACKING & LEARNING
  // =============================================================================
  
  agent_decisions: defineTable({
    // Decision Context
    sessionId: v.string(),
    conversationId: v.id("conversations"),
    projectId: v.optional(v.id("projects")),
    decisionType: v.string(), // "afiss_assessment", "factor_selection", "pricing_calculation", "recommendation"
    
    // Decision Input Data
    inputData: v.object({
      context: v.string(),
      parameters: v.any(),
      availableOptions: v.optional(v.array(v.string())),
      constraintsApplied: v.optional(v.array(v.string())),
    }),
    
    // Alex's Decision Process
    selectedOption: v.string(),
    reasoning: v.string(),
    confidence: v.number(),
    alternativesConsidered: v.optional(v.array(v.object({
      option: v.string(),
      pros: v.array(v.string()),
      cons: v.array(v.string()),
      confidence: v.number(),
    }))),
    
    // Decision Outcome Tracking
    wasCorrect: v.optional(v.boolean()),
    actualOutcome: v.optional(v.string()),
    outcomeConfidence: v.optional(v.number()),
    learningNote: v.optional(v.string()),
    improvementSuggestion: v.optional(v.string()),
    
    // AI Model Performance
    claudeModel: v.string(),
    responseTime: v.number(),
    tokensUsed: v.number(),
    systemPromptVersion: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    feedbackReceivedAt: v.optional(v.number()),
    learningAppliedAt: v.optional(v.number()),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_conversationId", ["conversationId"])
    .index("by_decisionType", ["decisionType"])
    .index("by_confidence", ["confidence"])
    .index("by_wasCorrect", ["wasCorrect"])
    .index("by_claudeModel", ["claudeModel"])
    .index("by_createdAt", ["createdAt"]),

  // Learning Cycles & Model Improvement
  learning_cycles: defineTable({
    // Cycle Identification
    cycleNumber: v.number(),
    cycleType: v.string(), // "automated_daily", "manual_triggered", "performance_review"
    
    // Analysis Scope & Results
    projectsAnalyzed: v.number(),
    decisionsEvaluated: v.number(),
    conversationsAnalyzed: v.number(),
    
    // Performance Metrics
    overallAccuracyRate: v.number(),
    intentClassificationAccuracy: v.number(),
    afissAssessmentAccuracy: v.number(),
    hoursPredictionMAE: v.number(), // Mean Absolute Error
    costPredictionMAE: v.number(),
    
    // Model Performance Comparison
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
    
    // Improvements Made
    factorsWeightAdjusted: v.number(),
    modelImprovementScore: v.number(),
    calibrationResults: v.array(v.object({
      factorCode: v.string(),
      oldWeight: v.number(),
      newWeight: v.number(),
      confidence: v.number(),
      reason: v.string(),
    })),
    
    // Knowledge Base Updates
    documentsAdded: v.number(),
    documentsUpdated: v.number(),
    embeddingsRefreshed: v.number(),
    
    // Generated Insights & Recommendations
    insights: v.array(v.string()),
    recommendations: v.array(v.object({
      priority: v.string(),
      recommendation: v.string(),
      implementationNotes: v.optional(v.string()),
      estimatedImpact: v.optional(v.string()),
    })),
    
    // Cycle Completion
    successful: v.boolean(),
    errorNotes: v.optional(v.string()),
    
    // Timestamps
    startedAt: v.number(),
    completedAt: v.number(),
    nextCycleScheduled: v.optional(v.number()),
  })
    .index("by_cycleNumber", ["cycleNumber"])
    .index("by_cycleType", ["cycleType"])
    .index("by_modelImprovementScore", ["modelImprovementScore"])
    .index("by_completedAt", ["completedAt"])
    .index("by_successful", ["successful"]),

  // =============================================================================
  // EQUIPMENT & USACE COSTING
  // =============================================================================
  
  equipment: defineTable({
    // Equipment Identification
    equipmentCode: v.string(),
    name: v.string(),
    category: v.string(), // "bucket_truck", "chipper", "stump_grinder", "chainsaw", "safety"
    subcategory: v.optional(v.string()),
    
    // USACE EP-1110-1-8 Costing Parameters
    msrp: v.number(),
    usefulLife: v.number(), // years
    annualOperatingHours: v.number(),
    fuelType: v.string(), // "diesel", "gasoline", "electric", "hybrid"
    fuelConsumptionRate: v.number(), // gallons/hour or kWh/hour
    maintenanceFactor: v.number(), // percentage of MSRP annually
    
    // Calculated Hourly Rates
    ownershipCostPerHour: v.number(),
    operatingCostPerHour: v.number(),
    fuelCostPerHour: v.number(),
    maintenanceCostPerHour: v.number(),
    totalCostPerHour: v.number(),
    
    // Learning-Based Adjustments
    usageTracking: v.object({
      totalHoursLogged: v.number(),
      averageUtilizationRate: v.number(),
      actualMaintenanceCost: v.number(),
      actualFuelEfficiency: v.number(),
      downtime: v.number(), // hours
    }),
    
    // Performance & Reliability
    reliabilityScore: v.number(), // 0-1 scale
    safetyRating: v.string(),
    requiredCertifications: v.optional(v.array(v.string())),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_equipmentCode", ["equipmentCode"])
    .index("by_category", ["category"])
    .index("by_totalCostPerHour", ["totalCostPerHour"])
    .index("by_reliabilityScore", ["reliabilityScore"]),

  // Employee & Crew Management
  employees: defineTable({
    // Employee Identification
    employeeNumber: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    displayName: v.string(),
    
    // Role & Qualifications
    position: v.string(),
    department: v.string(),
    certifications: v.array(v.string()),
    isaCertified: v.boolean(),
    specialSkills: v.optional(v.array(v.string())),
    
    // Compensation (with USACE 1.75x burden multiplier)
    hourlyRate: v.number(),
    burdenedRate: v.number(), // hourlyRate * 1.75
    overtimeRate: v.number(),
    
    // Performance & Productivity Tracking
    hoursWorked: v.number(),
    projectsCompleted: v.number(),
    averageProductivityScore: v.number(),
    
    // Safety Record
    safetyRecord: v.object({
      incidentCount: v.number(),
      lastIncident: v.optional(v.number()),
      safetyTrainingCurrent: v.boolean(),
      safetyRating: v.string(),
    }),
    
    // Availability & Scheduling
    isActive: v.boolean(),
    availabilityStatus: v.string(), // "available", "assigned", "unavailable", "training"
    currentProjectId: v.optional(v.id("projects")),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employeeNumber", ["employeeNumber"])
    .index("by_position", ["position"])
    .index("by_isaCertified", ["isaCertified"])
    .index("by_availabilityStatus", ["availabilityStatus"])
    .index("by_averageProductivityScore", ["averageProductivityScore"]),

  // =============================================================================
  // SYSTEM PERFORMANCE & SYNC
  // =============================================================================
  
  sync_status: defineTable({
    deviceId: v.string(),
    userId: v.string(),
    platform: v.string(), // "ios", "web", "api"
    
    // Sync Metadata
    lastSyncTimestamp: v.number(),
    syncVersion: v.string(),
    pendingChanges: v.number(),
    conflictCount: v.number(),
    
    // Device Information
    deviceType: v.string(),
    appVersion: v.string(),
    osVersion: v.optional(v.string()),
    
    // Sync Health & Performance
    isHealthy: v.boolean(),
    averageSyncTime: v.number(), // milliseconds
    lastError: v.optional(v.string()),
    errorCount: v.number(),
    
    // Network & Connectivity
    connectionType: v.optional(v.string()),
    latency: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_deviceId", ["deviceId"])
    .index("by_userId", ["userId"])
    .index("by_platform", ["platform"])
    .index("by_lastSyncTimestamp", ["lastSyncTimestamp"])
    .index("by_isHealthy", ["isHealthy"]),

  // System Performance Monitoring
  performance_metrics: defineTable({
    // Metric Identification
    metricType: v.string(), // "response_time", "accuracy_rate", "token_usage", "cost_tracking"
    source: v.string(), // "nlp_engine", "vector_search", "database", "api"
    
    // Metric Data
    value: v.number(),
    unit: v.string(), // "milliseconds", "percentage", "tokens", "dollars"
    threshold: v.optional(v.number()),
    isWithinThreshold: v.boolean(),
    
    // Context & Metadata
    contextData: v.optional(v.object({
      userId: v.optional(v.string()),
      sessionId: v.optional(v.string()),
      projectId: v.optional(v.id("projects")),
      operation: v.optional(v.string()),
    })),
    
    // Aggregation Support
    aggregationPeriod: v.string(), // "minute", "hour", "day", "week"
    periodStart: v.number(),
    periodEnd: v.number(),
    
    // Timestamps
    recordedAt: v.number(),
  })
    .index("by_metricType", ["metricType"])
    .index("by_source", ["source"])
    .index("by_aggregationPeriod", ["aggregationPeriod"])
    .index("by_recordedAt", ["recordedAt"])
    .index("by_isWithinThreshold", ["isWithinThreshold"]),
});