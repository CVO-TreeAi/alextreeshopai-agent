import { v } from "convex/values";
import { mutation, query } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Revenue Intelligence Agent (Core Sub-Level)
 * 
 * Domain: Complete revenue cycle optimization from lead to payment
 * Responsibilities:
 * - Lead generation and conversion optimization
 * - Dynamic pricing and profit maximization
 * - Customer lifetime value optimization
 * - Revenue forecasting and pipeline management
 * 
 * Specialist Agents Supervised:
 * - Lead Generation Specialist
 * - Email Marketing Specialist
 * - Pricing Optimization Specialist
 * - Customer Retention Specialist
 */

// Core Agent Configuration
export const REVENUE_AGENT_CONFIG = {
  agentId: "revenue-intelligence-core",
  domain: "Complete revenue cycle optimization",
  targetMetrics: {
    revenueGrowth: 0.25, // 25% annually
    conversionImprovement: 0.40, // 40% increase
    customerLifetimeValue: 0.30, // 30% increase
    leadCostReduction: 0.20 // 20% decrease
  },
  alertThresholds: {
    churnRate: 0.15, // Alert if >15%
    conversionDrop: 0.10, // Alert if conversion drops >10%
    competitivePricing: 0.05, // Alert if consistently undercut by >5%
    negativeRevenueTrend: 3 // Alert if 3+ days negative trend
  }
};

// Lead Scoring Algorithm
export const calculateLeadScore = mutation({
  args: {
    leadData: v.object({
      source: v.string(),
      propertyType: v.string(), // residential, commercial, municipal
      propertySize: v.number(), // acres
      urgency: v.string(), // immediate, scheduled, planning
      budget: v.optional(v.number()),
      previousCustomer: v.boolean(),
      referralSource: v.optional(v.string()),
      contactMethod: v.string(),
      responseTime: v.number(), // hours
      demographics: v.object({
        location: v.string(),
        propertyValue: v.optional(v.number()),
        seasonality: v.string()
      })
    })
  },
  handler: async (ctx, args) => {
    const { leadData } = args;
    
    let score = 0;
    const factors = [];
    
    // Source Quality (20 points max)
    const sourceScores = {
      'referral': 20,
      'repeat-customer': 18,
      'google-organic': 15,
      'google-ads': 12,
      'facebook': 10,
      'cold-call': 5
    };
    const sourceScore = sourceScores[leadData.source] || 5;
    score += sourceScore;
    factors.push({ factor: 'source', score: sourceScore, weight: 0.20 });
    
    // Property Type & Size (25 points max)
    const propertyMultipliers = {
      'commercial': 1.5,
      'municipal': 1.3,
      'residential': 1.0
    };
    const sizePoints = Math.min(25, leadData.propertySize * 5);
    const propertyScore = sizePoints * (propertyMultipliers[leadData.propertyType] || 1.0);
    score += propertyScore;
    factors.push({ factor: 'property', score: propertyScore, weight: 0.25 });
    
    // Urgency & Budget (20 points max)
    const urgencyScores = {
      'immediate': 20,
      'scheduled': 15,
      'planning': 10
    };
    let urgencyScore = urgencyScores[leadData.urgency] || 10;
    if (leadData.budget && leadData.budget > 5000) urgencyScore += 5;
    score += urgencyScore;
    factors.push({ factor: 'urgency', score: urgencyScore, weight: 0.20 });
    
    // Customer History (15 points max)
    let historyScore = 0;
    if (leadData.previousCustomer) historyScore += 15;
    if (leadData.referralSource) historyScore += 10;
    score += Math.min(15, historyScore);
    factors.push({ factor: 'history', score: Math.min(15, historyScore), weight: 0.15 });
    
    // Engagement Quality (20 points max)
    let engagementScore = 15; // base engagement
    if (leadData.responseTime < 4) engagementScore += 5; // quick response
    if (leadData.contactMethod === 'phone') engagementScore += 3; // phone preferred
    score += Math.min(20, engagementScore);
    factors.push({ factor: 'engagement', score: Math.min(20, engagementScore), weight: 0.20 });
    
    // Calculate conversion probability
    const conversionProbability = Math.min(0.95, score / 100);
    
    // Store lead score
    const leadScoreId = await ctx.db.insert("leadScores", {
      leadData,
      score,
      conversionProbability,
      factors,
      calculatedAt: Date.now(),
      agentVersion: "revenue-intelligence-v1.0"
    });
    
    return {
      leadScoreId,
      score,
      conversionProbability,
      factors,
      recommendation: score > 70 ? "high-priority" : score > 40 ? "medium-priority" : "low-priority"
    };
  }
});

// Dynamic Pricing Optimization
export const optimizePricing = mutation({
  args: {
    jobData: v.object({
      serviceType: v.string(),
      treeScore: v.number(),
      complexity: v.string(),
      location: v.string(),
      customerSegment: v.string(),
      seasonality: v.string(),
      competitorPricing: v.optional(v.array(v.number())),
      customerPriceHistory: v.optional(v.array(v.number())),
      urgency: v.string()
    })
  },
  handler: async (ctx, args) => {
    const { jobData } = args;
    
    // Base pricing from TreeScore
    let basePrice = jobData.treeScore * 2.5; // Base multiplier
    
    // Complexity adjustments
    const complexityMultipliers = {
      'simple': 1.0,
      'moderate': 1.25,
      'complex': 1.60,
      'extreme': 2.0
    };
    basePrice *= complexityMultipliers[jobData.complexity] || 1.25;
    
    // Market demand adjustments
    const seasonalMultipliers = {
      'peak': 1.20,
      'high': 1.10,
      'normal': 1.0,
      'low': 0.95
    };
    basePrice *= seasonalMultipliers[jobData.seasonality] || 1.0;
    
    // Customer segment pricing
    const segmentMultipliers = {
      'premium': 1.30,
      'standard': 1.0,
      'budget': 0.90,
      'municipal': 0.95,
      'commercial': 1.15
    };
    basePrice *= segmentMultipliers[jobData.customerSegment] || 1.0;
    
    // Urgency premium
    const urgencyMultipliers = {
      'emergency': 1.50,
      'urgent': 1.25,
      'scheduled': 1.0,
      'flexible': 0.95
    };
    basePrice *= urgencyMultipliers[jobData.urgency] || 1.0;
    
    // Competitive positioning
    let competitiveAdjustment = 1.0;
    if (jobData.competitorPricing?.length) {
      const avgCompetitorPrice = jobData.competitorPricing.reduce((a, b) => a + b, 0) / jobData.competitorPricing.length;
      const competitiveRatio = basePrice / avgCompetitorPrice;
      
      if (competitiveRatio > 1.15) {
        competitiveAdjustment = 0.95; // Slightly reduce if significantly higher
      } else if (competitiveRatio < 0.85) {
        competitiveAdjustment = 1.05; // Increase if too low
      }
    }
    basePrice *= competitiveAdjustment;
    
    // Customer history adjustment
    let customerHistoryAdjustment = 1.0;
    if (jobData.customerPriceHistory?.length) {
      const avgHistoricalPrice = jobData.customerPriceHistory.reduce((a, b) => a + b, 0) / jobData.customerPriceHistory.length;
      const historyRatio = basePrice / avgHistoricalPrice;
      
      if (historyRatio > 1.25) {
        customerHistoryAdjustment = 0.92; // Ease price increases for loyal customers
      }
    }
    basePrice *= customerHistoryAdjustment;
    
    // Calculate profit margin
    const estimatedCosts = basePrice * 0.65; // Assume 65% cost ratio
    const profitMargin = (basePrice - estimatedCosts) / basePrice;
    
    // Store pricing decision
    const pricingId = await ctx.db.insert("pricingDecisions", {
      jobData,
      basePrice: jobData.treeScore * 2.5,
      finalPrice: Math.round(basePrice),
      adjustments: {
        complexity: complexityMultipliers[jobData.complexity] || 1.25,
        seasonality: seasonalMultipliers[jobData.seasonality] || 1.0,
        customerSegment: segmentMultipliers[jobData.customerSegment] || 1.0,
        urgency: urgencyMultipliers[jobData.urgency] || 1.0,
        competitive: competitiveAdjustment,
        customerHistory: customerHistoryAdjustment
      },
      profitMargin,
      calculatedAt: Date.now(),
      agentVersion: "revenue-intelligence-v1.0"
    });
    
    return {
      pricingId,
      recommendedPrice: Math.round(basePrice),
      profitMargin,
      priceRange: {
        minimum: Math.round(basePrice * 0.90),
        maximum: Math.round(basePrice * 1.15)
      },
      adjustments: {
        complexity: complexityMultipliers[jobData.complexity] || 1.25,
        seasonality: seasonalMultipliers[jobData.seasonality] || 1.0,
        customerSegment: segmentMultipliers[jobData.customerSegment] || 1.0,
        urgency: urgencyMultipliers[jobData.urgency] || 1.0,
        competitive: competitiveAdjustment,
        customerHistory: customerHistoryAdjustment
      },
      competitivePosition: jobData.competitorPricing?.length ? 
        basePrice > (jobData.competitorPricing.reduce((a, b) => a + b, 0) / jobData.competitorPricing.length) ? "above-market" : "competitive" 
        : "no-data"
    };
  }
});

// Customer Lifetime Value Calculation
export const calculateCustomerLTV = query({
  args: {
    customerId: v.id("customers")
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found");
    
    // Get customer's job history
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
    
    if (jobs.length === 0) {
      return {
        lifetimeValue: 0,
        averageJobValue: 0,
        jobFrequency: 0,
        predictedAnnualValue: 0,
        retentionProbability: 0.5,
        recommendation: "new-customer"
      };
    }
    
    // Calculate metrics
    const totalRevenue = jobs.reduce((sum, job) => sum + (job.finance?.actualCostTotal || job.finance?.estimatedCostTotal || 0), 0);
    const averageJobValue = totalRevenue / jobs.length;
    
    // Calculate job frequency (jobs per year)
    const firstJob = jobs.reduce((earliest, job) => 
      job.identity.actualStartDate < earliest.identity.actualStartDate ? job : earliest
    );
    const daysSinceFirst = (Date.now() - firstJob.identity.actualStartDate) / (1000 * 60 * 60 * 24);
    const jobFrequency = jobs.length / (daysSinceFirst / 365);
    
    // Calculate retention probability based on recency and satisfaction
    const lastJob = jobs.reduce((latest, job) => 
      job.identity.actualStartDate > latest.identity.actualStartDate ? job : latest
    );
    const daysSinceLastJob = (Date.now() - lastJob.identity.actualStartDate) / (1000 * 60 * 60 * 24);
    
    let retentionProbability = 0.9;
    if (daysSinceLastJob > 730) retentionProbability = 0.3; // 2+ years
    else if (daysSinceLastJob > 365) retentionProbability = 0.6; // 1+ years
    else if (daysSinceLastJob > 180) retentionProbability = 0.8; // 6+ months
    
    // Adjust for customer satisfaction (if available)
    const avgSatisfaction = customer.finance?.paymentHistoryScore || 0.85;
    retentionProbability *= avgSatisfaction;
    
    // Predict annual value
    const predictedAnnualValue = averageJobValue * jobFrequency * retentionProbability;
    
    // 5-year LTV projection
    const lifetimeValue = predictedAnnualValue * 5 * Math.pow(retentionProbability, 5);
    
    return {
      lifetimeValue: Math.round(lifetimeValue),
      averageJobValue: Math.round(averageJobValue),
      jobFrequency: Math.round(jobFrequency * 100) / 100,
      predictedAnnualValue: Math.round(predictedAnnualValue),
      retentionProbability: Math.round(retentionProbability * 100) / 100,
      totalJobs: jobs.length,
      daysSinceLastJob: Math.round(daysSinceLastJob),
      recommendation: lifetimeValue > 10000 ? "high-value" : 
                     lifetimeValue > 5000 ? "medium-value" : "standard-value"
    };
  }
});

// Revenue Forecasting
export const forecastRevenue = query({
  args: {
    timeframe: v.string(), // "monthly", "quarterly", "annual"
    includePipeline: v.boolean()
  },
  handler: async (ctx, args) => {
    const { timeframe, includePipeline } = args;
    
    // Get historical revenue data
    const jobs = await ctx.db
      .query("jobs")
      .filter((q) => q.neq(q.field("identity.jobStatus"), "cancelled"))
      .collect();
    
    // Group by time period
    const revenueByPeriod = new Map();
    const now = Date.now();
    const periodLength = timeframe === "monthly" ? 30 * 24 * 60 * 60 * 1000 :
                       timeframe === "quarterly" ? 90 * 24 * 60 * 60 * 1000 :
                       365 * 24 * 60 * 60 * 1000;
    
    jobs.forEach(job => {
      const completedDate = job.identity.actualStartDate || job.identity.scheduledStartDate;
      const period = Math.floor((now - completedDate) / periodLength);
      const revenue = job.finance?.actualCostTotal || job.finance?.estimatedCostTotal || 0;
      
      if (!revenueByPeriod.has(period)) {
        revenueByPeriod.set(period, 0);
      }
      revenueByPeriod.set(period, revenueByPeriod.get(period) + revenue);
    });
    
    // Calculate trend
    const periods = Array.from(revenueByPeriod.keys()).sort();
    const revenues = periods.map(p => revenueByPeriod.get(p));
    
    // Simple linear trend calculation
    const n = revenues.length;
    const sumX = periods.reduce((a, b) => a + b, 0);
    const sumY = revenues.reduce((a, b) => a + b, 0);
    const sumXY = periods.reduce((sum, x, i) => sum + x * revenues[i], 0);
    const sumXX = periods.reduce((sum, x) => sum + x * x, 0);
    
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
    const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;
    
    // Forecast next period
    const nextPeriod = periods.length > 0 ? Math.max(...periods) + 1 : 0;
    const forecastRevenue = intercept + slope * nextPeriod;
    
    // Add pipeline if requested
    let pipelineValue = 0;
    if (includePipeline) {
      const pipelineJobs = await ctx.db
        .query("jobs")
        .filter((q) => q.eq(q.field("identity.jobStatus"), "proposed"))
        .collect();
      
      pipelineValue = pipelineJobs.reduce((sum, job) => 
        sum + (job.finance?.estimatedCostTotal || 0), 0
      );
    }
    
    return {
      forecast: Math.round(forecastRevenue + pipelineValue),
      trend: slope > 0 ? "growing" : slope < 0 ? "declining" : "stable",
      growthRate: slope,
      confidence: n > 3 ? "high" : n > 1 ? "medium" : "low",
      historicalAverage: Math.round(sumY / n),
      pipelineValue: Math.round(pipelineValue),
      periodType: timeframe,
      dataPoints: n
    };
  }
});

// Revenue Performance Monitor
export const monitorRevenuePerformance = query({
  args: {},
  handler: async (ctx) => {
    const alerts = [];
    const metrics = {
      conversionRate: 0,
      averageDealSize: 0,
      salesCycleLength: 0,
      customerChurnRate: 0,
      revenueGrowth: 0
    };
    
    // Calculate current metrics
    const leads = await ctx.db.query("leadScores").collect();
    const customers = await ctx.db.query("customers").collect();
    const jobs = await ctx.db.query("jobs").collect();
    
    // Conversion rate calculation
    const convertedLeads = leads.filter(lead => lead.conversionProbability > 0.7).length;
    metrics.conversionRate = leads.length > 0 ? convertedLeads / leads.length : 0;
    
    // Check against targets
    if (metrics.conversionRate < REVENUE_AGENT_CONFIG.targetMetrics.revenueGrowth * 0.8) {
      alerts.push({
        type: "conversion-rate-low",
        severity: "warning",
        message: `Conversion rate ${Math.round(metrics.conversionRate * 100)}% below target`,
        actionRequired: "Review lead qualification and nurturing processes"
      });
    }
    
    // Average deal size
    const completedJobs = jobs.filter(job => job.identity.jobStatus === "completed");
    metrics.averageDealSize = completedJobs.length > 0 ? 
      completedJobs.reduce((sum, job) => sum + (job.finance?.actualCostTotal || 0), 0) / completedJobs.length : 0;
    
    // Customer churn rate (customers with no jobs in last 365 days)
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
    const activeCustomers = customers.filter(customer => {
      const customerJobs = jobs.filter(job => 
        job.identity.customerId === customer._id && 
        job.identity.actualStartDate > oneYearAgo
      );
      return customerJobs.length > 0;
    });
    metrics.customerChurnRate = customers.length > 0 ? 
      1 - (activeCustomers.length / customers.length) : 0;
    
    // Check churn threshold
    if (metrics.customerChurnRate > REVENUE_AGENT_CONFIG.alertThresholds.churnRate) {
      alerts.push({
        type: "high-churn-rate",
        severity: "critical",
        message: `Customer churn rate ${Math.round(metrics.customerChurnRate * 100)}% exceeds threshold`,
        actionRequired: "Implement customer retention strategies immediately"
      });
    }
    
    return {
      metrics,
      alerts,
      lastUpdated: Date.now(),
      agentStatus: "active",
      recommendations: alerts.length > 0 ? 
        ["Review pricing strategy", "Enhance customer communication", "Improve lead qualification"] :
        ["Performance within targets", "Continue current strategies"]
    };
  }
});

// Revenue Intelligence Agent Main Interface
export const processRevenueIntelligence = mutation({
  args: {
    message: v.string(),
    context: v.object({
      customerId: v.optional(v.id("customers")),
      jobId: v.optional(v.id("jobs")),
      leadData: v.optional(v.any()),
      requestType: v.string() // "lead-scoring", "pricing", "forecast", "ltv"
    })
  },
  handler: async (ctx, args) => {
    const { message, context } = args;
    
    let response = "";
    let data = null;
    
    switch (context.requestType) {
      case "lead-scoring":
        if (context.leadData) {
          data = await calculateLeadScore(ctx, { leadData: context.leadData });
          response = `Lead scored at ${data.score}/100 with ${Math.round(data.conversionProbability * 100)}% conversion probability. Priority: ${data.recommendation}`;
        }
        break;
        
      case "pricing":
        if (context.jobData) {
          data = await optimizePricing(ctx, { jobData: context.jobData });
          response = `Recommended pricing: $${data.recommendedPrice} (${Math.round(data.profitMargin * 100)}% margin). Position: ${data.competitivePosition}`;
        }
        break;
        
      case "ltv":
        if (context.customerId) {
          data = await calculateCustomerLTV(ctx, { customerId: context.customerId });
          response = `Customer LTV: $${data.lifetimeValue} (${data.recommendation}). Predicted annual value: $${data.predictedAnnualValue}`;
        }
        break;
        
      case "forecast":
        data = await forecastRevenue(ctx, { timeframe: "monthly", includePipeline: true });
        response = `Revenue forecast: $${data.forecast} (${data.trend} trend, ${data.confidence} confidence)`;
        break;
        
      default:
        const performance = await monitorRevenuePerformance(ctx, {});
        response = `Revenue Intelligence Status: ${performance.alerts.length} active alerts. Conversion rate: ${Math.round(performance.metrics.conversionRate * 100)}%`;
        data = performance;
    }
    
    return {
      agentId: REVENUE_AGENT_CONFIG.agentId,
      response,
      data,
      timestamp: Date.now(),
      confidence: 0.95
    };
  }
});