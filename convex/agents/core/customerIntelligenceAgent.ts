import { v } from "convex/values";
import { mutation, query } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Customer Intelligence Agent (Core Sub-Level)
 * 
 * Domain: Complete customer lifecycle management and experience optimization
 * Responsibilities:
 * - Customer satisfaction prediction and intervention
 * - Lifecycle value optimization and retention strategies
 * - Communication preference analysis and personalization
 * - Referral generation and loyalty program management
 * - Customer segmentation and targeting
 * 
 * Specialist Agents Supervised:
 * - Satisfaction Prediction Specialist
 * - Communication Optimization Specialist
 * - Retention Strategy Specialist
 * - Referral Generation Specialist
 */

// Core Agent Configuration
export const CUSTOMER_AGENT_CONFIG = {
  agentId: "customer-intelligence-core",
  domain: "Complete customer lifecycle management and experience optimization",
  targetMetrics: {
    customerSatisfactionScore: 0.90, // 90% satisfaction target
    retentionRateImprovement: 0.25, // 25% improvement
    referralRateIncrease: 0.40, // 40% increase
    communicationEffectiveness: 0.35 // 35% improvement
  },
  alertThresholds: {
    satisfactionDrop: 0.80, // Alert if satisfaction <80%
    churnRisk: 0.30, // Alert if churn probability >30%
    communicationFailure: 0.15, // Alert if communication failure >15%
    referralDecline: 0.20 // Alert if referral rate drops >20%
  }
};

// Customer Satisfaction Prediction
export const predictCustomerSatisfaction = mutation({
  args: {
    customerId: v.id("customers"),
    includeRecentInteractions: v.boolean()
  },
  handler: async (ctx, args) => {
    const { customerId, includeRecentInteractions } = args;
    
    // Get customer details
    const customer = await ctx.db.get(customerId);
    if (!customer) throw new Error("Customer not found");
    
    // Get customer's job history
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .collect();
    
    // Calculate satisfaction factors
    const satisfactionFactors = calculateSatisfactionFactors(customer, jobs);
    
    // Get recent interactions if requested
    let interactionFactors = {};
    if (includeRecentInteractions) {
      interactionFactors = await analyzeRecentInteractions(ctx, customerId);
    }
    
    // Calculate satisfaction score using multiple factors
    const satisfactionScore = calculateOverallSatisfactionScore(
      satisfactionFactors,
      interactionFactors
    );
    
    // Predict satisfaction trend
    const satisfactionTrend = predictSatisfactionTrend(jobs, satisfactionScore);
    
    // Identify risk factors
    const riskFactors = identifySatisfactionRisks(
      satisfactionFactors,
      interactionFactors,
      satisfactionTrend
    );
    
    // Generate intervention recommendations
    const interventions = generateSatisfactionInterventions(
      satisfactionScore,
      riskFactors,
      customer
    );
    
    // Store satisfaction prediction
    const predictionId = await ctx.db.insert("satisfactionPredictions", {
      customerId,
      satisfactionScore: satisfactionScore.overall,
      factors: satisfactionFactors,
      interactionFactors,
      trend: satisfactionTrend,
      riskFactors,
      interventions,
      confidence: satisfactionScore.confidence,
      createdAt: Date.now(),
      agentVersion: "customer-intelligence-v1.0"
    });
    
    return {
      predictionId,
      customer: {
        id: customer._id,
        name: `${customer.identity.firstName} ${customer.identity.lastName}`,
        type: customer.identity.customerType,
        relationshipDuration: calculateRelationshipDuration(customer)
      },
      satisfaction: {
        currentScore: Math.round(satisfactionScore.overall * 100),
        trend: satisfactionTrend.direction,
        trendStrength: satisfactionTrend.strength,
        confidence: Math.round(satisfactionScore.confidence * 100)
      },
      keyFactors: Object.entries(satisfactionFactors)
        .sort(([,a], [,b]) => Math.abs(b.impact) - Math.abs(a.impact))
        .slice(0, 3)
        .map(([factor, data]) => ({
          factor,
          score: Math.round(data.score * 100),
          impact: data.impact > 0 ? "positive" : "negative"
        })),
      riskFactors,
      interventions: interventions.slice(0, 3),
      nextReviewDate: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }
});

// Customer Lifecycle Value Analysis
export const analyzeCustomerLifecycleValue = query({
  args: {
    customerId: v.id("customers"),
    projectionYears: v.number()
  },
  handler: async (ctx, args) => {
    const { customerId, projectionYears } = args;
    
    // Get customer and job data
    const customer = await ctx.db.get(customerId);
    if (!customer) throw new Error("Customer not found");
    
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .collect();
    
    // Calculate historical metrics
    const historicalMetrics = calculateHistoricalCustomerMetrics(customer, jobs);
    
    // Calculate lifecycle stages
    const lifecycleStage = determineCustomerLifecycleStage(customer, jobs);
    
    // Predict future value
    const futureValueProjection = projectFutureCustomerValue(
      historicalMetrics,
      lifecycleStage,
      projectionYears
    );
    
    // Calculate retention probability
    const retentionProbability = calculateRetentionProbability(
      customer,
      jobs,
      lifecycleStage
    );
    
    // Identify value optimization opportunities
    const optimizationOpportunities = identifyValueOptimizations(
      historicalMetrics,
      futureValueProjection,
      retentionProbability
    );
    
    // Calculate segmentation data
    const segmentationData = analyzeCustomerSegmentation(
      customer,
      historicalMetrics,
      lifecycleStage
    );
    
    return {
      customer: {
        id: customer._id,
        name: `${customer.identity.firstName} ${customer.identity.lastName}`,
        type: customer.identity.customerType,
        acquisitionDate: customer.identity.acquisitionDate,
        relationshipDuration: calculateRelationshipDuration(customer)
      },
      historical: {
        totalRevenue: Math.round(historicalMetrics.totalRevenue),
        averageJobValue: Math.round(historicalMetrics.averageJobValue),
        jobFrequency: Math.round(historicalMetrics.jobFrequency * 100) / 100,
        totalJobs: historicalMetrics.totalJobs,
        lastJobDate: historicalMetrics.lastJobDate
      },
      lifecycle: {
        currentStage: lifecycleStage.stage,
        stageConfidence: Math.round(lifecycleStage.confidence * 100),
        stageProgression: lifecycleStage.progression,
        timeInStage: lifecycleStage.timeInStage
      },
      futureValue: {
        projectedLTV: Math.round(futureValueProjection.lifetimeValue),
        annualValue: Math.round(futureValueProjection.annualValue),
        retentionProbability: Math.round(retentionProbability * 100),
        riskLevel: retentionProbability > 0.8 ? "low" : 
                  retentionProbability > 0.6 ? "medium" : "high"
      },
      segmentation: {
        valueSegment: segmentationData.valueSegment,
        behaviorSegment: segmentationData.behaviorSegment,
        needsSegment: segmentationData.needsSegment
      },
      optimization: optimizationOpportunities.slice(0, 5),
      recommendations: generateLifecycleRecommendations(
        lifecycleStage,
        retentionProbability,
        optimizationOpportunities
      )
    };
  }
});

// Communication Preference Analysis
export const analyzeCommuncationPreferences = mutation({
  args: {
    customerId: v.id("customers"),
    analyzeChannelEffectiveness: v.boolean()
  },
  handler: async (ctx, args) => {
    const { customerId, analyzeChannelEffectiveness } = args;
    
    // Get customer data
    const customer = await ctx.db.get(customerId);
    if (!customer) throw new Error("Customer not found");
    
    // Get communication history
    const communications = await getCommunicationHistory(ctx, customerId);
    
    // Analyze channel preferences
    const channelAnalysis = analyzeChannelPreferences(communications, customer);
    
    // Analyze timing preferences
    const timingAnalysis = analyzeTimingPreferences(communications);
    
    // Analyze content preferences
    const contentAnalysis = analyzeContentPreferences(communications, customer);
    
    // Calculate effectiveness metrics if requested
    let effectivenessMetrics = {};
    if (analyzeChannelEffectiveness) {
      effectivenessMetrics = calculateChannelEffectiveness(communications);
    }
    
    // Generate personalized communication strategy
    const communicationStrategy = generatePersonalizedCommunicationStrategy(
      channelAnalysis,
      timingAnalysis,
      contentAnalysis,
      customer
    );
    
    // Store communication analysis
    const analysisId = await ctx.db.insert("communicationAnalyses", {
      customerId,
      channelAnalysis,
      timingAnalysis,
      contentAnalysis,
      effectivenessMetrics,
      communicationStrategy,
      createdAt: Date.now(),
      agentVersion: "customer-intelligence-v1.0"
    });
    
    return {
      analysisId,
      customer: {
        id: customer._id,
        name: `${customer.identity.firstName} ${customer.identity.lastName}`,
        preferredContact: customer.contact?.preferredMethod
      },
      preferences: {
        preferredChannels: channelAnalysis.preferredChannels,
        optimalTiming: {
          dayOfWeek: timingAnalysis.preferredDay,
          timeOfDay: timingAnalysis.preferredTime,
          frequency: timingAnalysis.optimalFrequency
        },
        contentPreferences: {
          style: contentAnalysis.preferredStyle,
          topics: contentAnalysis.preferredTopics,
          format: contentAnalysis.preferredFormat
        }
      },
      effectiveness: analyzeChannelEffectiveness ? {
        emailOpenRate: Math.round((effectivenessMetrics.email?.openRate || 0) * 100),
        phoneAnswerRate: Math.round((effectivenessMetrics.phone?.answerRate || 0) * 100),
        textResponseRate: Math.round((effectivenessMetrics.text?.responseRate || 0) * 100),
        overallEngagement: Math.round((effectivenessMetrics.overall?.engagement || 0) * 100)
      } : null,
      strategy: {
        primaryChannel: communicationStrategy.primaryChannel,
        backupChannel: communicationStrategy.backupChannel,
        recommendedFrequency: communicationStrategy.frequency,
        nextContactDate: communicationStrategy.nextContactDate,
        personalizedApproach: communicationStrategy.approach
      },
      optimizations: generateCommunicationOptimizations(channelAnalysis, effectivenessMetrics)
    };
  }
});

// Referral Generation Analysis
export const analyzeReferralPotential = mutation({
  args: {
    customerId: v.id("customers"),
    includeNetworkAnalysis: v.boolean()
  },
  handler: async (ctx, args) => {
    const { customerId, includeNetworkAnalysis } = args;
    
    // Get customer data
    const customer = await ctx.db.get(customerId);
    if (!customer) throw new Error("Customer not found");
    
    // Calculate referral propensity score
    const referralPropensity = calculateReferralPropensity(customer);
    
    // Get customer's referral history
    const referralHistory = await getReferralHistory(ctx, customerId);
    
    // Analyze network potential
    let networkAnalysis = {};
    if (includeNetworkAnalysis) {
      networkAnalysis = analyzeCustomerNetwork(customer, referralHistory);
    }
    
    // Calculate referral value potential
    const referralValue = calculateReferralValuePotential(customer, referralHistory);
    
    // Generate referral strategy
    const referralStrategy = generateReferralStrategy(
      customer,
      referralPropensity,
      referralHistory,
      networkAnalysis
    );
    
    // Identify optimal timing for referral requests
    const optimalTiming = identifyOptimalReferralTiming(customer, referralHistory);
    
    // Store referral analysis
    const analysisId = await ctx.db.insert("referralAnalyses", {
      customerId,
      referralPropensity,
      referralHistory,
      networkAnalysis,
      referralValue,
      referralStrategy,
      optimalTiming,
      createdAt: Date.now(),
      agentVersion: "customer-intelligence-v1.0"
    });
    
    return {
      analysisId,
      customer: {
        id: customer._id,
        name: `${customer.identity.firstName} ${customer.identity.lastName}`,
        type: customer.identity.customerType,
        satisfactionLevel: referralPropensity.satisfactionLevel
      },
      referralPotential: {
        propensityScore: Math.round(referralPropensity.score * 100),
        likelyReferrals: referralPropensity.estimatedReferrals,
        valuePerReferral: Math.round(referralValue.averageReferralValue),
        totalPotentialValue: Math.round(referralValue.totalPotentialValue)
      },
      history: {
        totalReferrals: referralHistory.totalReferrals,
        successfulReferrals: referralHistory.successfulReferrals,
        conversionRate: Math.round(referralHistory.conversionRate * 100),
        lastReferralDate: referralHistory.lastReferralDate
      },
      network: includeNetworkAnalysis ? {
        networkSize: networkAnalysis.estimatedNetworkSize,
        targetSegments: networkAnalysis.targetSegments,
        influence: networkAnalysis.influenceLevel
      } : null,
      strategy: {
        approach: referralStrategy.approach,
        incentiveType: referralStrategy.incentive,
        targetReferrals: referralStrategy.targetCount,
        campaignType: referralStrategy.campaignType
      },
      timing: {
        nextOptimalRequest: optimalTiming.nextOptimalDate,
        bestSeason: optimalTiming.bestSeason,
        triggerEvents: optimalTiming.triggerEvents
      },
      recommendations: generateReferralRecommendations(referralPropensity, referralStrategy)
    };
  }
});

// Customer Segmentation Analysis
export const performCustomerSegmentation = query({
  args: {
    segmentationType: v.string(), // "value", "behavior", "lifecycle", "needs"
    includeAllCustomers: v.boolean()
  },
  handler: async (ctx, args) => {
    const { segmentationType, includeAllCustomers } = args;
    
    // Get customer data
    const customers = await ctx.db.query("customers").collect();
    const allJobs = await ctx.db.query("jobs").collect();
    
    // Perform segmentation analysis
    const segmentationResults = performSegmentationAnalysis(
      customers,
      allJobs,
      segmentationType
    );
    
    // Calculate segment characteristics
    const segmentCharacteristics = calculateSegmentCharacteristics(
      segmentationResults,
      customers,
      allJobs
    );
    
    // Generate segment strategies
    const segmentStrategies = generateSegmentStrategies(
      segmentCharacteristics,
      segmentationType
    );
    
    // Identify migration opportunities
    const migrationOpportunities = identifySegmentMigrationOpportunities(
      segmentCharacteristics
    );
    
    return {
      segmentationType,
      totalCustomers: customers.length,
      segments: segmentCharacteristics.map(segment => ({
        name: segment.name,
        size: segment.customerCount,
        percentage: Math.round((segment.customerCount / customers.length) * 100),
        characteristics: segment.characteristics,
        averageValue: Math.round(segment.metrics.averageValue),
        retentionRate: Math.round(segment.metrics.retentionRate * 100),
        strategy: segmentStrategies.find(s => s.segment === segment.name)
      })),
      insights: {
        highestValueSegment: segmentCharacteristics.reduce((highest, segment) => 
          segment.metrics.averageValue > (highest?.metrics.averageValue || 0) ? segment : highest
        ),
        fastestGrowingSegment: identifyFastestGrowingSegment(segmentCharacteristics),
        atRiskSegment: identifyAtRiskSegment(segmentCharacteristics)
      },
      opportunities: migrationOpportunities,
      recommendations: generateSegmentationRecommendations(
        segmentCharacteristics,
        migrationOpportunities
      )
    };
  }
});

// Customer Performance Monitor
export const monitorCustomerPerformance = query({
  args: {},
  handler: async (ctx) => {
    const alerts = [];
    const metrics = {
      averageSatisfaction: 0,
      retentionRate: 0,
      referralRate: 0,
      communicationEffectiveness: 0,
      churnRisk: 0
    };
    
    // Get customer data
    const customers = await ctx.db.query("customers").collect();
    const jobs = await ctx.db.query("jobs").collect();
    const satisfactionPredictions = await ctx.db.query("satisfactionPredictions").collect();
    
    if (customers.length === 0) {
      return {
        metrics,
        alerts: [{ type: "no-customers", severity: "warning", message: "No customers in system" }],
        lastUpdated: Date.now(),
        agentStatus: "active"
      };
    }
    
    // Calculate satisfaction metrics
    if (satisfactionPredictions.length > 0) {
      metrics.averageSatisfaction = satisfactionPredictions.reduce((sum, pred) => 
        sum + pred.satisfactionScore, 0) / satisfactionPredictions.length;
    }
    
    // Calculate retention rate
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
    const activeCustomers = customers.filter(customer => {
      const customerJobs = jobs.filter(job => 
        job.identity.customerId === customer._id && 
        job.identity.actualStartDate > oneYearAgo
      );
      return customerJobs.length > 0;
    });
    metrics.retentionRate = customers.length > 0 ? activeCustomers.length / customers.length : 0;
    
    // Calculate referral rate (placeholder)
    metrics.referralRate = 0.15; // 15% - would calculate from actual referral data
    
    // Check against targets and generate alerts
    if (metrics.averageSatisfaction < CUSTOMER_AGENT_CONFIG.alertThresholds.satisfactionDrop) {
      alerts.push({
        type: "satisfaction-decline",
        severity: "warning",
        message: `Average customer satisfaction ${Math.round(metrics.averageSatisfaction * 100)}% below target`,
        actionRequired: "Review customer experience processes"
      });
    }
    
    if (metrics.retentionRate < 0.75) { // 75% retention target
      alerts.push({
        type: "retention-concern",
        severity: "critical",
        message: `Customer retention rate ${Math.round(metrics.retentionRate * 100)}% below acceptable level`,
        actionRequired: "Implement retention improvement strategies"
      });
    }
    
    // Identify high churn risk customers
    const highRiskCustomers = satisfactionPredictions.filter(pred => 
      pred.satisfactionScore < CUSTOMER_AGENT_CONFIG.alertThresholds.churnRisk
    );
    metrics.churnRisk = satisfactionPredictions.length > 0 ? 
      highRiskCustomers.length / satisfactionPredictions.length : 0;
    
    if (metrics.churnRisk > 0.15) { // >15% high risk customers
      alerts.push({
        type: "high-churn-risk",
        severity: "critical",
        message: `${Math.round(metrics.churnRisk * 100)}% of customers at high churn risk`,
        actionRequired: "Deploy immediate retention interventions"
      });
    }
    
    return {
      metrics: {
        averageSatisfaction: Math.round(metrics.averageSatisfaction * 100),
        retentionRate: Math.round(metrics.retentionRate * 100),
        referralRate: Math.round(metrics.referralRate * 100),
        totalCustomers: customers.length,
        highRiskCustomers: highRiskCustomers.length
      },
      alerts,
      lastUpdated: Date.now(),
      agentStatus: "active",
      recommendations: alerts.length > 0 ? 
        ["Improve customer satisfaction processes", "Enhance retention strategies", "Optimize communication"] :
        ["Customer metrics within targets", "Continue current strategies"]
    };
  }
});

// Helper Functions
function calculateSatisfactionFactors(customer: any, jobs: any[]) {
  const factors = {
    serviceQuality: calculateServiceQualityFactor(jobs),
    responseTime: calculateResponseTimeFactor(jobs),
    pricing: calculatePricingFactor(jobs, customer),
    communication: calculateCommunicationFactor(customer),
    reliability: calculateReliabilityFactor(jobs),
    problemResolution: calculateProblemResolutionFactor(jobs)
  };
  
  return factors;
}

function calculateServiceQualityFactor(jobs: any[]) {
  if (jobs.length === 0) return { score: 0.8, impact: 0 };
  
  const qualityScores = jobs.map(job => job.quality?.customerRating || 4.0);
  const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  
  return {
    score: Math.min(1.0, avgQuality / 5.0),
    impact: 0.3, // High impact factor
    details: `Average quality rating: ${avgQuality.toFixed(1)}/5.0`
  };
}

function calculateResponseTimeFactor(jobs: any[]) {
  if (jobs.length === 0) return { score: 0.8, impact: 0 };
  
  // Calculate average response time from inquiry to scheduling
  const responseTimes = jobs.map(job => {
    const inquiryDate = job.identity.inquiryDate || job.identity.scheduledStartDate;
    const scheduleDate = job.identity.scheduledStartDate;
    return (scheduleDate - inquiryDate) / (1000 * 60 * 60 * 24); // days
  });
  
  const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const score = Math.max(0, 1 - (avgResponseTime / 7)); // 7 days = 0 score
  
  return {
    score,
    impact: 0.2,
    details: `Average response time: ${avgResponseTime.toFixed(1)} days`
  };
}

function calculatePricingFactor(jobs: any[], customer: any) {
  if (jobs.length === 0) return { score: 0.8, impact: 0 };
  
  // Analyze pricing satisfaction based on customer feedback or payment behavior
  const paymentHistory = customer.finance?.paymentHistoryScore || 0.85;
  const priceObjections = jobs.filter(job => job.notes?.includes("price") || job.notes?.includes("expensive")).length;
  
  const objectionRate = jobs.length > 0 ? priceObjections / jobs.length : 0;
  const score = paymentHistory * (1 - objectionRate);
  
  return {
    score,
    impact: 0.25,
    details: `Payment history: ${Math.round(paymentHistory * 100)}%, price objections: ${Math.round(objectionRate * 100)}%`
  };
}

function calculateCommunicationFactor(customer: any) {
  // Analyze communication satisfaction based on customer preferences and responsiveness
  const preferredMethodUsed = customer.communication?.preferredMethodUsedRate || 0.8;
  const responseRate = customer.communication?.responseRate || 0.85;
  
  const score = (preferredMethodUsed + responseRate) / 2;
  
  return {
    score,
    impact: 0.15,
    details: `Preferred method usage: ${Math.round(preferredMethodUsed * 100)}%, response rate: ${Math.round(responseRate * 100)}%`
  };
}

function calculateReliabilityFactor(jobs: any[]) {
  if (jobs.length === 0) return { score: 0.8, impact: 0 };
  
  const onTimeJobs = jobs.filter(job => 
    job.identity.actualStartDate <= job.identity.scheduledStartDate + (24 * 60 * 60 * 1000) // Within 1 day
  );
  
  const reliabilityScore = onTimeJobs.length / jobs.length;
  
  return {
    score: reliabilityScore,
    impact: 0.2,
    details: `On-time completion: ${Math.round(reliabilityScore * 100)}%`
  };
}

function calculateProblemResolutionFactor(jobs: any[]) {
  if (jobs.length === 0) return { score: 0.8, impact: 0 };
  
  const jobsWithIssues = jobs.filter(job => job.issues?.length > 0);
  const resolvedIssues = jobsWithIssues.filter(job => 
    job.issues?.every(issue => issue.status === "resolved")
  );
  
  const resolutionRate = jobsWithIssues.length > 0 ? resolvedIssues.length / jobsWithIssues.length : 1.0;
  
  return {
    score: resolutionRate,
    impact: 0.1,
    details: `Issue resolution rate: ${Math.round(resolutionRate * 100)}%`
  };
}

function calculateOverallSatisfactionScore(factors: any, interactionFactors: any) {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [factorName, factorData] of Object.entries(factors)) {
    totalScore += factorData.score * factorData.impact;
    totalWeight += factorData.impact;
  }
  
  // Add interaction factors if available
  if (Object.keys(interactionFactors).length > 0) {
    // TODO: Add interaction factor calculations
  }
  
  const overall = totalWeight > 0 ? totalScore / totalWeight : 0.8;
  const confidence = Math.min(1.0, totalWeight / 1.0); // Full confidence at 100% weight coverage
  
  return { overall, confidence };
}

async function analyzeRecentInteractions(ctx: any, customerId: Id<"customers">) {
  // TODO: Implement interaction analysis from communication logs
  return {
    recentCommunications: 5,
    positiveInteractions: 4,
    negativeInteractions: 1,
    responsiveness: 0.8
  };
}

function predictSatisfactionTrend(jobs: any[], currentScore: any) {
  if (jobs.length < 2) {
    return { direction: "stable", strength: "weak", confidence: 0.3 };
  }
  
  // Analyze trend in recent jobs
  const recentJobs = jobs.slice(-3);
  const qualityTrend = recentJobs.map(job => job.quality?.customerRating || 4.0);
  
  const trendDirection = qualityTrend[qualityTrend.length - 1] > qualityTrend[0] ? "improving" : 
                        qualityTrend[qualityTrend.length - 1] < qualityTrend[0] ? "declining" : "stable";
  
  return {
    direction: trendDirection,
    strength: "moderate",
    confidence: 0.7
  };
}

function identifySatisfactionRisks(factors: any, interactions: any, trend: any) {
  const risks = [];
  
  for (const [factorName, factorData] of Object.entries(factors)) {
    if (factorData.score < 0.7) {
      risks.push({
        factor: factorName,
        severity: factorData.score < 0.5 ? "high" : "medium",
        description: `${factorName} score below acceptable threshold`,
        impact: factorData.impact
      });
    }
  }
  
  if (trend.direction === "declining") {
    risks.push({
      factor: "trend",
      severity: "medium",
      description: "Satisfaction trending downward",
      impact: 0.2
    });
  }
  
  return risks;
}

function generateSatisfactionInterventions(score: any, risks: any[], customer: any) {
  const interventions = [];
  
  if (score.overall < 0.7) {
    interventions.push({
      type: "immediate",
      action: "Personal call from manager",
      priority: "high",
      timeline: "24 hours",
      description: "Address satisfaction concerns directly"
    });
  }
  
  risks.forEach(risk => {
    if (risk.factor === "serviceQuality") {
      interventions.push({
        type: "process-improvement",
        action: "Quality assurance follow-up",
        priority: "medium",
        timeline: "7 days",
        description: "Review and improve service delivery processes"
      });
    }
    
    if (risk.factor === "communication") {
      interventions.push({
        type: "communication",
        action: "Update communication preferences",
        priority: "low",
        timeline: "14 days",
        description: "Optimize communication methods and frequency"
      });
    }
  });
  
  return interventions;
}

function calculateRelationshipDuration(customer: any): number {
  const acquisitionDate = customer.identity.acquisitionDate || Date.now();
  return Math.floor((Date.now() - acquisitionDate) / (365 * 24 * 60 * 60 * 1000));
}

function calculateHistoricalCustomerMetrics(customer: any, jobs: any[]) {
  const totalRevenue = jobs.reduce((sum, job) => 
    sum + (job.finance?.actualCostTotal || job.finance?.estimatedCostTotal || 0), 0
  );
  
  const averageJobValue = jobs.length > 0 ? totalRevenue / jobs.length : 0;
  
  // Calculate job frequency (jobs per year)
  const relationshipDuration = calculateRelationshipDuration(customer);
  const jobFrequency = relationshipDuration > 0 ? jobs.length / relationshipDuration : 0;
  
  const lastJobDate = jobs.length > 0 ? 
    Math.max(...jobs.map(job => job.identity.actualStartDate || job.identity.scheduledStartDate)) : 0;
  
  return {
    totalRevenue,
    averageJobValue,
    jobFrequency,
    totalJobs: jobs.length,
    lastJobDate,
    relationshipDuration
  };
}

function determineCustomerLifecycleStage(customer: any, jobs: any[]) {
  const relationshipDuration = calculateRelationshipDuration(customer);
  const jobCount = jobs.length;
  const daysSinceLastJob = jobs.length > 0 ? 
    (Date.now() - Math.max(...jobs.map(job => job.identity.actualStartDate || job.identity.scheduledStartDate))) / (1000 * 60 * 60 * 24) : 
    Infinity;
  
  let stage = "new";
  let confidence = 0.8;
  let progression = "normal";
  
  if (relationshipDuration < 1 && jobCount <= 2) {
    stage = "new";
  } else if (relationshipDuration >= 1 && jobCount >= 2 && daysSinceLastJob < 365) {
    stage = "active";
  } else if (relationshipDuration >= 2 && jobCount >= 5) {
    stage = "loyal";
  } else if (daysSinceLastJob > 365) {
    stage = "at-risk";
  } else if (daysSinceLastJob > 730) {
    stage = "dormant";
  }
  
  return {
    stage,
    confidence,
    progression,
    timeInStage: relationshipDuration
  };
}

function projectFutureCustomerValue(metrics: any, lifecycle: any, years: number) {
  const baseAnnualValue = metrics.averageJobValue * metrics.jobFrequency;
  
  // Adjust based on lifecycle stage
  const stageMultipliers = {
    new: 1.2, // Growth potential
    active: 1.1,
    loyal: 1.0,
    "at-risk": 0.7,
    dormant: 0.3
  };
  
  const adjustedAnnualValue = baseAnnualValue * (stageMultipliers[lifecycle.stage] || 1.0);
  const lifetimeValue = adjustedAnnualValue * years;
  
  return {
    annualValue: adjustedAnnualValue,
    lifetimeValue
  };
}

function calculateRetentionProbability(customer: any, jobs: any[], lifecycle: any) {
  const baseRetention = {
    new: 0.7,
    active: 0.9,
    loyal: 0.95,
    "at-risk": 0.4,
    dormant: 0.1
  };
  
  let probability = baseRetention[lifecycle.stage] || 0.7;
  
  // Adjust based on recent job satisfaction
  const recentJobs = jobs.slice(-3);
  if (recentJobs.length > 0) {
    const avgSatisfaction = recentJobs.reduce((sum, job) => 
      sum + (job.quality?.customerRating || 4.0), 0) / (recentJobs.length * 5.0);
    probability *= (0.5 + 0.5 * avgSatisfaction); // Scale satisfaction impact
  }
  
  return Math.min(0.98, Math.max(0.05, probability));
}

function identifyValueOptimizations(metrics: any, projection: any, retention: any) {
  const opportunities = [];
  
  if (metrics.jobFrequency < 2) {
    opportunities.push({
      type: "frequency",
      description: "Increase service frequency through maintenance programs",
      potentialValue: metrics.averageJobValue * 1.5,
      effort: "medium"
    });
  }
  
  if (metrics.averageJobValue < 2000) {
    opportunities.push({
      type: "upselling",
      description: "Introduce additional services and premium options",
      potentialValue: metrics.averageJobValue * 0.3,
      effort: "low"
    });
  }
  
  if (retention < 0.8) {
    opportunities.push({
      type: "retention",
      description: "Implement retention program to reduce churn",
      potentialValue: projection.lifetimeValue * (0.9 - retention),
      effort: "high"
    });
  }
  
  return opportunities;
}

function analyzeCustomerSegmentation(customer: any, metrics: any, lifecycle: any) {
  // Value segmentation
  let valueSegment = "standard";
  if (metrics.totalRevenue > 10000) valueSegment = "high-value";
  else if (metrics.totalRevenue > 5000) valueSegment = "medium-value";
  else if (metrics.totalRevenue < 1000) valueSegment = "low-value";
  
  // Behavior segmentation
  let behaviorSegment = "occasional";
  if (metrics.jobFrequency >= 3) behaviorSegment = "frequent";
  else if (metrics.jobFrequency >= 1.5) behaviorSegment = "regular";
  
  // Needs segmentation based on service types
  const needsSegment = "maintenance"; // TODO: Analyze actual service types
  
  return {
    valueSegment,
    behaviorSegment,
    needsSegment
  };
}

function generateLifecycleRecommendations(lifecycle: any, retention: any, opportunities: any[]) {
  const recommendations = [];
  
  switch (lifecycle.stage) {
    case "new":
      recommendations.push("Focus on onboarding experience and first impression");
      break;
    case "active":
      recommendations.push("Maintain engagement through regular communication");
      break;
    case "loyal":
      recommendations.push("Leverage for referrals and premium services");
      break;
    case "at-risk":
      recommendations.push("Implement retention campaign immediately");
      break;
    case "dormant":
      recommendations.push("Win-back campaign with special offers");
      break;
  }
  
  if (retention < 0.7) {
    recommendations.push("Priority customer for retention efforts");
  }
  
  return recommendations;
}

async function getCommunicationHistory(ctx: any, customerId: Id<"customers">) {
  // TODO: Implement actual communication history retrieval
  return [
    { channel: "email", date: Date.now() - (7 * 24 * 60 * 60 * 1000), response: true },
    { channel: "phone", date: Date.now() - (14 * 24 * 60 * 60 * 1000), response: true },
    { channel: "text", date: Date.now() - (21 * 24 * 60 * 60 * 1000), response: false }
  ];
}

function analyzeChannelPreferences(communications: any[], customer: any) {
  const channelStats = new Map();
  
  communications.forEach(comm => {
    if (!channelStats.has(comm.channel)) {
      channelStats.set(comm.channel, { total: 0, responses: 0 });
    }
    const stats = channelStats.get(comm.channel);
    stats.total++;
    if (comm.response) stats.responses++;
  });
  
  const preferredChannels = Array.from(channelStats.entries())
    .map(([channel, stats]) => ({
      channel,
      responseRate: stats.total > 0 ? stats.responses / stats.total : 0,
      usage: stats.total
    }))
    .sort((a, b) => b.responseRate - a.responseRate);
  
  return { preferredChannels };
}

function analyzeTimingPreferences(communications: any[]) {
  // Analyze timing patterns from communication history
  const hours = communications.map(comm => new Date(comm.date).getHours());
  const days = communications.map(comm => new Date(comm.date).getDay());
  
  const preferredTime = hours.length > 0 ? 
    hours.reduce((sum, hour) => sum + hour, 0) / hours.length : 10; // Default 10 AM
  
  const preferredDay = days.length > 0 ? 
    Math.round(days.reduce((sum, day) => sum + day, 0) / days.length) : 2; // Default Tuesday
  
  return {
    preferredTime: Math.round(preferredTime),
    preferredDay,
    optimalFrequency: "bi-weekly"
  };
}

function analyzeContentPreferences(communications: any[], customer: any) {
  // TODO: Analyze content preferences from communication history
  return {
    preferredStyle: "professional",
    preferredTopics: ["maintenance", "seasonal"],
    preferredFormat: "concise"
  };
}

function calculateChannelEffectiveness(communications: any[]) {
  const effectiveness = {
    email: { openRate: 0.65, responseRate: 0.25 },
    phone: { answerRate: 0.75, responseRate: 0.80 },
    text: { deliveryRate: 0.98, responseRate: 0.45 },
    overall: { engagement: 0.60 }
  };
  
  return effectiveness;
}

function generatePersonalizedCommunicationStrategy(channel: any, timing: any, content: any, customer: any) {
  const strategy = {
    primaryChannel: channel.preferredChannels[0]?.channel || "email",
    backupChannel: channel.preferredChannels[1]?.channel || "phone",
    frequency: timing.optimalFrequency,
    nextContactDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // 2 weeks
    approach: content.preferredStyle
  };
  
  return strategy;
}

function generateCommunicationOptimizations(channelAnalysis: any, effectiveness: any) {
  const optimizations = [];
  
  if (effectiveness.email?.openRate < 0.5) {
    optimizations.push({
      type: "email-optimization",
      description: "Improve email subject lines and send timing",
      impact: "medium"
    });
  }
  
  if (channelAnalysis.preferredChannels[0]?.responseRate < 0.6) {
    optimizations.push({
      type: "channel-mix",
      description: "Diversify communication channels",
      impact: "high"
    });
  }
  
  return optimizations;
}

function calculateReferralPropensity(customer: any) {
  // Calculate likelihood of customer making referrals
  const satisfactionLevel = customer.satisfaction?.score || 0.8;
  const loyaltyLevel = customer.loyalty?.score || 0.7;
  const networkPotential = customer.network?.size || 5;
  
  const score = (satisfactionLevel * 0.4 + loyaltyLevel * 0.4 + Math.min(networkPotential / 10, 1) * 0.2);
  const estimatedReferrals = Math.round(score * networkPotential * 0.3);
  
  return {
    score,
    satisfactionLevel,
    loyaltyLevel,
    estimatedReferrals
  };
}

async function getReferralHistory(ctx: any, customerId: Id<"customers">) {
  // TODO: Implement actual referral history retrieval
  return {
    totalReferrals: 3,
    successfulReferrals: 2,
    conversionRate: 0.67,
    lastReferralDate: Date.now() - (120 * 24 * 60 * 60 * 1000) // 4 months ago
  };
}

function analyzeCustomerNetwork(customer: any, referralHistory: any) {
  // Estimate network analysis based on customer profile
  const estimatedNetworkSize = customer.identity.customerType === "commercial" ? 20 : 10;
  
  return {
    estimatedNetworkSize,
    targetSegments: ["residential", "small-business"],
    influenceLevel: referralHistory.successfulReferrals > 2 ? "high" : "medium"
  };
}

function calculateReferralValuePotential(customer: any, referralHistory: any) {
  const averageCustomerValue = 3000; // TODO: Calculate from actual data
  const referralConversionRate = referralHistory.conversionRate || 0.5;
  
  const averageReferralValue = averageCustomerValue * referralConversionRate;
  const estimatedReferrals = 2; // TODO: Calculate based on propensity
  const totalPotentialValue = averageReferralValue * estimatedReferrals;
  
  return {
    averageReferralValue,
    totalPotentialValue,
    conversionRate: referralConversionRate
  };
}

function generateReferralStrategy(customer: any, propensity: any, history: any, network: any) {
  let approach = "standard";
  let incentive = "service-discount";
  let targetCount = 1;
  let campaignType = "personal-request";
  
  if (propensity.score > 0.8) {
    approach = "ambassador-program";
    incentive = "cash-reward";
    targetCount = 3;
    campaignType = "structured-program";
  } else if (propensity.score > 0.6) {
    approach = "satisfaction-based";
    incentive = "service-credit";
    targetCount = 2;
    campaignType = "post-service-request";
  }
  
  return {
    approach,
    incentive,
    targetCount,
    campaignType
  };
}

function identifyOptimalReferralTiming(customer: any, history: any) {
  return {
    nextOptimalDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    bestSeason: "spring", // Tree work peak season
    triggerEvents: ["job-completion", "positive-feedback", "anniversary"]
  };
}

function generateReferralRecommendations(propensity: any, strategy: any) {
  const recommendations = [];
  
  if (propensity.score > 0.7) {
    recommendations.push("High referral potential - implement ambassador program");
  }
  
  if (strategy.approach === "satisfaction-based") {
    recommendations.push("Time referral requests after positive service experiences");
  }
  
  return recommendations.length > 0 ? recommendations : ["Standard referral approach recommended"];
}

// Placeholder implementations for complex segmentation functions
function performSegmentationAnalysis(customers: any[], jobs: any[], type: string) {
  // TODO: Implement actual segmentation algorithms
  return customers.map(customer => ({
    customerId: customer._id,
    segment: "active" // Placeholder
  }));
}

function calculateSegmentCharacteristics(segmentation: any[], customers: any[], jobs: any[]) {
  // TODO: Implement segment characteristic analysis
  return [
    {
      name: "high-value",
      customerCount: Math.floor(customers.length * 0.2),
      characteristics: ["high-spend", "frequent-service"],
      metrics: { averageValue: 8000, retentionRate: 0.9 }
    },
    {
      name: "regular",
      customerCount: Math.floor(customers.length * 0.6),
      characteristics: ["moderate-spend", "seasonal-service"],
      metrics: { averageValue: 3000, retentionRate: 0.8 }
    },
    {
      name: "occasional",
      customerCount: Math.floor(customers.length * 0.2),
      characteristics: ["low-spend", "infrequent-service"],
      metrics: { averageValue: 1200, retentionRate: 0.6 }
    }
  ];
}

function generateSegmentStrategies(segments: any[], type: string) {
  return segments.map(segment => ({
    segment: segment.name,
    strategy: `Optimize ${segment.name} segment through targeted campaigns`,
    tactics: ["personalized-communication", "segment-specific-offers"]
  }));
}

function identifySegmentMigrationOpportunities(segments: any[]) {
  return [
    {
      from: "occasional",
      to: "regular",
      potential: 15,
      strategy: "Maintenance program enrollment"
    }
  ];
}

function identifyFastestGrowingSegment(segments: any[]) {
  return segments[1]; // Placeholder
}

function identifyAtRiskSegment(segments: any[]) {
  return segments.find(segment => segment.metrics.retentionRate < 0.7) || segments[2];
}

function generateSegmentationRecommendations(segments: any[], opportunities: any[]) {
  return [
    "Focus retention efforts on at-risk segments",
    "Develop upselling strategies for high-potential customers",
    "Create segment-specific communication strategies"
  ];
}

// Customer Intelligence Agent Main Interface
export const processCustomerIntelligence = mutation({
  args: {
    message: v.string(),
    context: v.object({
      requestType: v.string(), // "satisfaction", "lifecycle", "communication", "referral", "segmentation"
      customerId: v.optional(v.id("customers")),
      analysisType: v.optional(v.string())
    })
  },
  handler: async (ctx, args) => {
    const { message, context } = args;
    
    let response = "";
    let data = null;
    
    switch (context.requestType) {
      case "satisfaction":
        if (context.customerId) {
          data = await predictCustomerSatisfaction(ctx, { 
            customerId: context.customerId, 
            includeRecentInteractions: true 
          });
          response = `Satisfaction prediction: ${data.satisfaction.currentScore}% satisfaction, ${data.riskFactors.length} risk factors identified`;
        }
        break;
        
      case "lifecycle":
        if (context.customerId) {
          data = await analyzeCustomerLifecycleValue(ctx, { 
            customerId: context.customerId, 
            projectionYears: 5 
          });
          response = `Lifecycle analysis: ${data.lifecycle.currentStage} stage, $${data.futureValue.projectedLTV} projected LTV`;
        }
        break;
        
      case "referral":
        if (context.customerId) {
          data = await analyzeReferralPotential(ctx, { 
            customerId: context.customerId, 
            includeNetworkAnalysis: true 
          });
          response = `Referral analysis: ${data.referralPotential.propensityScore}% propensity, ${data.referralPotential.likelyReferrals} potential referrals`;
        }
        break;
        
      case "segmentation":
        data = await performCustomerSegmentation(ctx, { 
          segmentationType: context.analysisType || "value", 
          includeAllCustomers: true 
        });
        response = `Segmentation analysis: ${data.segments.length} segments identified, ${data.insights.highestValueSegment.name} is highest value`;
        break;
        
      default:
        const performance = await monitorCustomerPerformance(ctx, {});
        response = `Customer Intelligence Status: ${performance.alerts.length} active alerts. Satisfaction: ${performance.metrics.averageSatisfaction}%, Retention: ${performance.metrics.retentionRate}%`;
        data = performance;
    }
    
    return {
      agentId: CUSTOMER_AGENT_CONFIG.agentId,
      response,
      data,
      timestamp: Date.now(),
      confidence: 0.95
    };
  }
});