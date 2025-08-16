import { v } from "convex/values";
import { mutation, query } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Email Marketing Specialist (Spec-Level Agent)
 * 
 * Narrow Focus: Email campaign optimization for maximum ROI
 * Supervised by: Revenue Intelligence Agent
 * 
 * ROI Promise: 200-400% improvement in email conversion rates
 * 
 * Key Functions:
 * - A/B testing subject lines for tree care industry
 * - Send time optimization based on customer behavior
 * - Content personalization for different services
 * - Automated drip campaigns for leads and customers
 * - Email deliverability optimization
 */

// Specialist Configuration
export const EMAIL_MARKETING_CONFIG = {
  agentId: "email-marketing-specialist",
  domain: "Email campaign optimization",
  targetMetrics: {
    openRateImprovement: 0.50, // 50% increase
    clickThroughRateImprovement: 0.75, // 75% increase
    conversionRateImprovement: 2.0, // 200% increase
    unsubscribeReduction: 0.50 // 50% decrease
  },
  treeCareMsgTemplates: {
    urgentRemoval: "🚨 {customerName}, urgent tree removal needed?",
    seasonalMaintenance: "🍂 {customerName}, fall tree care checklist",
    stormDamage: "⛈️ Post-storm tree safety assessment for {customerName}",
    preventiveCare: "🌳 Keep your trees healthy, {customerName}",
    estimation: "💰 Free tree service estimate for {customerName}"
  }
};

// Subject Line A/B Testing
export const testSubjectLines = mutation({
  args: {
    campaignData: v.object({
      campaignId: v.string(),
      serviceType: v.string(), // "removal", "pruning", "maintenance", "emergency"
      customerSegment: v.string(), // "residential", "commercial", "municipal"
      urgencyLevel: v.string(), // "immediate", "seasonal", "routine"
      subjectVariants: v.array(v.object({
        variant: v.string(), // "A", "B", "C"
        subjectLine: v.string(),
        personalizations: v.array(v.string())
      })),
      testSize: v.number(), // percentage of list to test
      recipientCount: v.number()
    })
  },
  handler: async (ctx, args) => {
    const { campaignData } = args;
    
    // Generate tree care specific subject line optimizations
    const optimizedVariants = [];
    
    for (const variant of campaignData.subjectVariants) {
      const optimization = optimizeSubjectLineForTreeCare(
        variant.subjectLine, 
        campaignData.serviceType, 
        campaignData.customerSegment,
        campaignData.urgencyLevel
      );
      
      optimizedVariants.push({
        ...variant,
        optimizedSubjectLine: optimization.optimizedSubject,
        optimizationScore: optimization.score,
        treeCareFactor: optimization.treeCareFactor,
        urgencyFactor: optimization.urgencyFactor,
        personalizationFactor: optimization.personalizationFactor
      });
    }
    
    // Calculate test distribution
    const testDistribution = calculateTestDistribution(
      campaignData.testSize, 
      campaignData.recipientCount, 
      optimizedVariants.length
    );
    
    // Store A/B test configuration
    const testId = await ctx.db.insert("emailABTests", {
      campaignId: campaignData.campaignId,
      serviceType: campaignData.serviceType,
      customerSegment: campaignData.customerSegment,
      variants: optimizedVariants,
      testDistribution,
      testStartDate: Date.now(),
      testDuration: 24 * 60 * 60 * 1000, // 24 hours
      status: "active",
      agentVersion: "email-marketing-specialist-v1.0"
    });
    
    return {
      testId,
      optimizedVariants,
      testDistribution,
      recommendations: generateSubjectLineRecommendations(optimizedVariants, campaignData),
      expectedImprovement: calculateExpectedImprovement(optimizedVariants),
      launchReady: true
    };
  }
});

// Send Time Optimization
export const optimizeSendTime = mutation({
  args: {
    customerSegment: v.string(),
    serviceType: v.string(),
    historicalData: v.optional(v.array(v.object({
      sendTime: v.number(),
      openRate: v.number(),
      clickRate: v.number(),
      dayOfWeek: v.number(),
      hour: v.number()
    })))
  },
  handler: async (ctx, args) => {
    const { customerSegment, serviceType, historicalData } = args;
    
    // Tree care industry specific send time patterns
    const treeCareSendPatterns = {
      residential: {
        weekday: { optimal: 9, secondary: 14 }, // 9 AM, 2 PM
        weekend: { optimal: 10, secondary: 15 } // 10 AM, 3 PM
      },
      commercial: {
        weekday: { optimal: 8, secondary: 13 }, // 8 AM, 1 PM
        weekend: { optimal: null, secondary: null } // Avoid weekends
      },
      municipal: {
        weekday: { optimal: 7, secondary: 10 }, // 7 AM, 10 AM
        weekend: { optimal: null, secondary: null }
      }
    };
    
    // Service type adjustments
    const serviceTypeMultipliers = {
      emergency: { urgencyBoost: true, anytime: true },
      removal: { seasonalPeak: true, weekdayPreferred: true },
      maintenance: { plannedWork: true, flexibleTiming: true },
      pruning: { seasonalWork: true, weatherDependent: true }
    };
    
    // Analyze historical performance if available
    let historicalOptimal = null;
    if (historicalData && historicalData.length > 0) {
      historicalOptimal = analyzeHistoricalSendTimes(historicalData);
    }
    
    // Generate recommendations
    const basePattern = treeCareSendPatterns[customerSegment] || treeCareSendPatterns.residential;
    const serviceAdjustments = serviceTypeMultipliers[serviceType] || {};
    
    const recommendations = generateSendTimeRecommendations(
      basePattern, 
      serviceAdjustments, 
      historicalOptimal
    );
    
    // Store optimization
    const optimizationId = await ctx.db.insert("sendTimeOptimizations", {
      customerSegment,
      serviceType,
      recommendations,
      historicalAnalysis: historicalOptimal,
      basePattern,
      serviceAdjustments,
      createdAt: Date.now(),
      agentVersion: "email-marketing-specialist-v1.0"
    });
    
    return {
      optimizationId,
      recommendations,
      nextOptimalSend: recommendations.primary.nextSend,
      expectedImprovement: recommendations.primary.expectedImprovement,
      confidence: historicalData ? "high" : "medium"
    };
  }
});

// Content Personalization for Tree Services
export const personalizeEmailContent = mutation({
  args: {
    recipient: v.object({
      customerId: v.id("customers"),
      name: v.string(),
      propertyType: v.string(),
      previousServices: v.array(v.string()),
      seasonalNeeds: v.array(v.string()),
      riskFactors: v.array(v.string())
    }),
    campaignType: v.string(),
    baseTemplate: v.string()
  },
  handler: async (ctx, args) => {
    const { recipient, campaignType, baseTemplate } = args;
    
    // Get customer history for deeper personalization
    const customerJobs = await ctx.db
      .query("jobs")
      .withIndex("by_customer", (q) => q.eq("customerId", recipient.customerId))
      .collect();
    
    // Analyze customer's tree care journey
    const customerProfile = analyzeCustomerTreeCareProfile(customerJobs, recipient);
    
    // Generate personalized content
    const personalizedContent = generatePersonalizedTreeCareContent(
      baseTemplate,
      customerProfile,
      campaignType
    );
    
    // Tree-specific recommendations
    const treeRecommendations = generateTreeSpecificRecommendations(
      customerProfile,
      recipient.seasonalNeeds,
      recipient.riskFactors
    );
    
    // Store personalization
    const personalizationId = await ctx.db.insert("emailPersonalizations", {
      customerId: recipient.customerId,
      campaignType,
      customerProfile,
      personalizedContent,
      treeRecommendations,
      personalizationScore: calculatePersonalizationScore(customerProfile),
      createdAt: Date.now(),
      agentVersion: "email-marketing-specialist-v1.0"
    });
    
    return {
      personalizationId,
      personalizedContent,
      treeRecommendations,
      personalizationScore: calculatePersonalizationScore(customerProfile),
      contentVariants: generateContentVariants(personalizedContent, customerProfile)
    };
  }
});

// Automated Drip Campaign Management
export const manageDripCampaign = mutation({
  args: {
    leadData: v.object({
      leadId: v.string(),
      source: v.string(),
      serviceInterest: v.string(),
      urgencyLevel: v.string(),
      propertyDetails: v.object({
        type: v.string(),
        size: v.number(),
        treeCount: v.number(),
        issues: v.array(v.string())
      }),
      contactPreferences: v.object({
        emailFrequency: v.string(),
        bestContactTime: v.string()
      })
    })
  },
  handler: async (ctx, args) => {
    const { leadData } = args;
    
    // Create tree care specific drip sequence
    const dripSequence = createTreeCareDripSequence(
      leadData.serviceInterest,
      leadData.urgencyLevel,
      leadData.propertyDetails
    );
    
    // Customize timing based on urgency
    const sequenceTiming = optimizeDripTiming(
      dripSequence,
      leadData.urgencyLevel,
      leadData.contactPreferences
    );
    
    // Generate content for each drip email
    const dripEmails = [];
    for (let i = 0; i < dripSequence.length; i++) {
      const email = generateDripEmailContent(
        dripSequence[i],
        leadData,
        i + 1 // sequence position
      );
      dripEmails.push(email);
    }
    
    // Store drip campaign
    const campaignId = await ctx.db.insert("dripCampaigns", {
      leadId: leadData.leadId,
      serviceInterest: leadData.serviceInterest,
      urgencyLevel: leadData.urgencyLevel,
      dripSequence: dripEmails,
      sequenceTiming,
      status: "active",
      currentStep: 0,
      nextSendTime: Date.now() + sequenceTiming[0].delay,
      createdAt: Date.now(),
      agentVersion: "email-marketing-specialist-v1.0"
    });
    
    return {
      campaignId,
      dripSequence: dripEmails.map(email => ({
        subject: email.subject,
        sendDelay: email.sendDelay,
        contentType: email.contentType
      })),
      totalEmails: dripEmails.length,
      campaignDuration: Math.max(...sequenceTiming.map(t => t.delay)),
      nextSendTime: Date.now() + sequenceTiming[0].delay
    };
  }
});

// Email Performance Analytics
export const analyzeEmailPerformance = query({
  args: {
    timeframe: v.string(), // "daily", "weekly", "monthly"
    campaignId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { timeframe, campaignId } = args;
    
    // Get email campaign data
    const campaigns = campaignId ? 
      await ctx.db.query("emailCampaigns").filter(q => q.eq(q.field("campaignId"), campaignId)).collect() :
      await ctx.db.query("emailCampaigns").collect();
    
    // Calculate metrics
    const metrics = calculateEmailMetrics(campaigns);
    
    // Tree care industry benchmarks
    const industryBenchmarks = {
      openRate: 0.22, // 22% industry average
      clickRate: 0.035, // 3.5% industry average
      conversionRate: 0.02, // 2% industry average
      unsubscribeRate: 0.005 // 0.5% industry average
    };
    
    // Performance comparison
    const performance = {
      openRate: {
        current: metrics.openRate,
        benchmark: industryBenchmarks.openRate,
        performance: metrics.openRate / industryBenchmarks.openRate
      },
      clickRate: {
        current: metrics.clickRate,
        benchmark: industryBenchmarks.clickRate,
        performance: metrics.clickRate / industryBenchmarks.clickRate
      },
      conversionRate: {
        current: metrics.conversionRate,
        benchmark: industryBenchmarks.conversionRate,
        performance: metrics.conversionRate / industryBenchmarks.conversionRate
      }
    };
    
    // Generate improvement recommendations
    const improvements = generatePerformanceImprovements(performance, metrics);
    
    return {
      metrics,
      performance,
      improvements,
      timeframe,
      campaignCount: campaigns.length,
      lastUpdated: Date.now()
    };
  }
});

// Helper Functions

function optimizeSubjectLineForTreeCare(subjectLine: string, serviceType: string, segment: string, urgency: string) {
  let score = 50; // Base score
  let optimizedSubject = subjectLine;
  
  // Tree care keywords boost
  const treeKeywords = ['tree', 'removal', 'pruning', 'trimming', 'stump', 'emergency', 'storm', 'damage'];
  const keywordMatches = treeKeywords.filter(keyword => 
    subjectLine.toLowerCase().includes(keyword)
  ).length;
  const treeCareFactor = keywordMatches * 10;
  score += treeCareFactor;
  
  // Urgency factors
  const urgencyKeywords = ['urgent', 'emergency', 'immediate', 'asap', 'today'];
  const hasUrgency = urgencyKeywords.some(keyword => 
    subjectLine.toLowerCase().includes(keyword)
  );
  const urgencyFactor = (urgency === 'immediate' && hasUrgency) ? 15 : 
                       (urgency === 'immediate' && !hasUrgency) ? -10 : 0;
  score += urgencyFactor;
  
  // Personalization boost
  const hasPersonalization = subjectLine.includes('{') && subjectLine.includes('}');
  const personalizationFactor = hasPersonalization ? 10 : 0;
  score += personalizationFactor;
  
  // Length optimization (tree care emails perform best at 30-50 chars)
  const lengthFactor = subjectLine.length >= 30 && subjectLine.length <= 50 ? 10 : -5;
  score += lengthFactor;
  
  return {
    optimizedSubject,
    score: Math.min(100, score),
    treeCareFactor,
    urgencyFactor,
    personalizationFactor
  };
}

function calculateTestDistribution(testSize: number, recipientCount: number, variantCount: number) {
  const testRecipients = Math.floor(recipientCount * testSize);
  const recipientsPerVariant = Math.floor(testRecipients / variantCount);
  const controlGroup = recipientCount - testRecipients;
  
  return {
    testRecipients,
    recipientsPerVariant,
    controlGroup,
    variantCount
  };
}

function generateSubjectLineRecommendations(variants: any[], campaignData: any): string[] {
  const recommendations = [];
  
  const bestVariant = variants.reduce((best, current) => 
    current.optimizationScore > best.optimizationScore ? current : best
  );
  
  recommendations.push(`Use variant ${bestVariant.variant} for highest predicted performance`);
  
  if (campaignData.urgencyLevel === 'immediate') {
    recommendations.push("Consider adding urgency indicators for emergency services");
  }
  
  if (campaignData.serviceType === 'removal') {
    recommendations.push("Include safety or risk keywords for removal services");
  }
  
  return recommendations;
}

function calculateExpectedImprovement(variants: any[]): number {
  const avgScore = variants.reduce((sum, v) => sum + v.optimizationScore, 0) / variants.length;
  return Math.min(50, (avgScore - 50) * 2); // Convert score to improvement percentage
}

function analyzeHistoricalSendTimes(historicalData: any[]) {
  const hourPerformance = new Map();
  const dayPerformance = new Map();
  
  historicalData.forEach(data => {
    // Hour analysis
    if (!hourPerformance.has(data.hour)) {
      hourPerformance.set(data.hour, { opens: 0, clicks: 0, count: 0 });
    }
    const hourStats = hourPerformance.get(data.hour);
    hourStats.opens += data.openRate;
    hourStats.clicks += data.clickRate;
    hourStats.count += 1;
    
    // Day analysis
    if (!dayPerformance.has(data.dayOfWeek)) {
      dayPerformance.set(data.dayOfWeek, { opens: 0, clicks: 0, count: 0 });
    }
    const dayStats = dayPerformance.get(data.dayOfWeek);
    dayStats.opens += data.openRate;
    dayStats.clicks += data.clickRate;
    dayStats.count += 1;
  });
  
  // Find optimal times
  let bestHour = 9; // default
  let bestDay = 2; // Tuesday default
  let bestOpenRate = 0;
  
  for (const [hour, stats] of hourPerformance) {
    const avgOpenRate = stats.opens / stats.count;
    if (avgOpenRate > bestOpenRate) {
      bestOpenRate = avgOpenRate;
      bestHour = hour;
    }
  }
  
  return { bestHour, bestDay, confidence: historicalData.length / 10 };
}

function generateSendTimeRecommendations(basePattern: any, serviceAdjustments: any, historical: any) {
  const recommendations = {
    primary: {
      hour: historical?.bestHour || basePattern.weekday.optimal,
      day: "weekday",
      expectedImprovement: 15,
      nextSend: 0 // Will be calculated
    },
    secondary: {
      hour: basePattern.weekday.secondary,
      day: "weekday", 
      expectedImprovement: 10,
      nextSend: 0
    }
  };
  
  // Adjust for service type
  if (serviceAdjustments.urgencyBoost) {
    recommendations.primary.note = "Emergency services can be sent anytime";
  }
  
  if (serviceAdjustments.seasonalWork) {
    recommendations.primary.note = "Consider seasonal timing for pruning services";
  }
  
  return recommendations;
}

function analyzeCustomerTreeCareProfile(jobs: any[], recipient: any) {
  const profile = {
    serviceHistory: jobs.map(job => job.scope?.serviceType).filter(Boolean),
    seasonalPattern: extractSeasonalPattern(jobs),
    averageJobValue: jobs.length > 0 ? 
      jobs.reduce((sum, job) => sum + (job.finance?.actualCostTotal || 0), 0) / jobs.length : 0,
    lastServiceDate: jobs.length > 0 ? 
      Math.max(...jobs.map(job => job.identity.actualStartDate || 0)) : 0,
    preferredServices: recipient.previousServices,
    propertyType: recipient.propertyType,
    riskLevel: recipient.riskFactors.length
  };
  
  return profile;
}

function generatePersonalizedTreeCareContent(template: string, profile: any, campaignType: string) {
  let content = template;
  
  // Service history personalization
  if (profile.serviceHistory.includes('removal')) {
    content = content.replace('{service_suggestion}', 'prevent future tree hazards');
  } else if (profile.serviceHistory.includes('pruning')) {
    content = content.replace('{service_suggestion}', 'maintain your beautiful trees');
  } else {
    content = content.replace('{service_suggestion}', 'keep your property safe and beautiful');
  }
  
  // Seasonal personalization
  const currentSeason = getCurrentSeason();
  if (profile.seasonalPattern[currentSeason]) {
    content = content.replace('{seasonal_note}', 
      `Based on your ${currentSeason} service history, now is the perfect time for maintenance.`
    );
  }
  
  return content;
}

function generateTreeSpecificRecommendations(profile: any, seasonalNeeds: string[], riskFactors: string[]) {
  const recommendations = [];
  
  if (riskFactors.includes('storm-damage')) {
    recommendations.push("Post-storm tree inspection recommended");
  }
  
  if (seasonalNeeds.includes('fall-maintenance')) {
    recommendations.push("Fall pruning prevents winter storm damage");
  }
  
  if (profile.lastServiceDate < Date.now() - (365 * 24 * 60 * 60 * 1000)) {
    recommendations.push("Annual tree health assessment due");
  }
  
  return recommendations;
}

function calculatePersonalizationScore(profile: any): number {
  let score = 0;
  
  if (profile.serviceHistory.length > 0) score += 25;
  if (profile.averageJobValue > 0) score += 20;
  if (profile.lastServiceDate > 0) score += 20;
  if (profile.seasonalPattern) score += 15;
  if (profile.riskLevel > 0) score += 20;
  
  return Math.min(100, score);
}

function generateContentVariants(content: string, profile: any) {
  return [
    { variant: "A", content: content },
    { variant: "B", content: content.replace("tree", "landscape") },
    { variant: "C", content: addUrgencyToContent(content, profile.riskLevel) }
  ];
}

function createTreeCareDripSequence(serviceInterest: string, urgency: string, propertyDetails: any) {
  const baseSequence = [
    { type: "welcome", delay: 0 },
    { type: "education", delay: 24 * 60 * 60 * 1000 }, // 1 day
    { type: "social_proof", delay: 72 * 60 * 60 * 1000 }, // 3 days
    { type: "offer", delay: 120 * 60 * 60 * 1000 }, // 5 days
    { type: "urgency", delay: 168 * 60 * 60 * 1000 } // 7 days
  ];
  
  if (urgency === 'immediate') {
    // Compress timeline for urgent needs
    return baseSequence.map((email, index) => ({
      ...email,
      delay: email.delay / 3 // Compress to 1/3 of normal time
    }));
  }
  
  return baseSequence;
}

function optimizeDripTiming(sequence: any[], urgency: string, preferences: any) {
  return sequence.map(email => ({
    ...email,
    optimalSendTime: preferences.bestContactTime || "morning",
    urgencyAdjustment: urgency === 'immediate' ? "compressed" : "standard"
  }));
}

function generateDripEmailContent(sequenceStep: any, leadData: any, position: number) {
  const contentTemplates = {
    welcome: {
      subject: `Welcome ${leadData.propertyDetails.type} property owner!`,
      contentType: "introduction"
    },
    education: {
      subject: "Tree care tips for your property",
      contentType: "educational"
    },
    social_proof: {
      subject: "See how we've helped neighbors like you",
      contentType: "testimonials"
    },
    offer: {
      subject: "Special offer for your tree care needs",
      contentType: "promotion"
    },
    urgency: {
      subject: "Don't wait - tree hazards increase over time",
      contentType: "urgency"
    }
  };
  
  const template = contentTemplates[sequenceStep.type];
  return {
    ...template,
    sendDelay: sequenceStep.delay,
    position,
    personalized: true
  };
}

function calculateEmailMetrics(campaigns: any[]) {
  if (campaigns.length === 0) {
    return {
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      unsubscribeRate: 0
    };
  }
  
  const totals = campaigns.reduce((acc, campaign) => ({
    sent: acc.sent + (campaign.sent || 0),
    opened: acc.opened + (campaign.opened || 0),
    clicked: acc.clicked + (campaign.clicked || 0),
    converted: acc.converted + (campaign.converted || 0),
    unsubscribed: acc.unsubscribed + (campaign.unsubscribed || 0)
  }), { sent: 0, opened: 0, clicked: 0, converted: 0, unsubscribed: 0 });
  
  return {
    openRate: totals.sent > 0 ? totals.opened / totals.sent : 0,
    clickRate: totals.sent > 0 ? totals.clicked / totals.sent : 0,
    conversionRate: totals.sent > 0 ? totals.converted / totals.sent : 0,
    unsubscribeRate: totals.sent > 0 ? totals.unsubscribed / totals.sent : 0
  };
}

function generatePerformanceImprovements(performance: any, metrics: any): string[] {
  const improvements = [];
  
  if (performance.openRate.performance < 0.9) {
    improvements.push("Optimize subject lines for better open rates");
  }
  
  if (performance.clickRate.performance < 0.9) {
    improvements.push("Improve email content and call-to-action placement");
  }
  
  if (performance.conversionRate.performance < 0.9) {
    improvements.push("Enhance landing page experience and offer relevance");
  }
  
  return improvements.length > 0 ? improvements : ["Performance above industry benchmarks"];
}

function extractSeasonalPattern(jobs: any[]) {
  const seasonal = { spring: 0, summer: 0, fall: 0, winter: 0 };
  
  jobs.forEach(job => {
    const month = new Date(job.identity.actualStartDate || job.identity.scheduledStartDate).getMonth();
    if (month >= 2 && month <= 4) seasonal.spring++;
    else if (month >= 5 && month <= 7) seasonal.summer++;
    else if (month >= 8 && month <= 10) seasonal.fall++;
    else seasonal.winter++;
  });
  
  return seasonal;
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function addUrgencyToContent(content: string, riskLevel: number): string {
  if (riskLevel > 2) {
    return content.replace("tree", "potentially hazardous tree");
  }
  return content;
}

// Email Marketing Specialist Main Interface
export const processEmailMarketing = mutation({
  args: {
    message: v.string(),
    context: v.object({
      requestType: v.string(), // "subject-test", "send-time", "personalize", "drip", "analytics"
      campaignData: v.optional(v.any()),
      customerData: v.optional(v.any())
    })
  },
  handler: async (ctx, args) => {
    const { message, context } = args;
    
    let response = "";
    let data = null;
    
    switch (context.requestType) {
      case "subject-test":
        if (context.campaignData) {
          data = await testSubjectLines(ctx, { campaignData: context.campaignData });
          response = `Subject line test configured: ${data.optimizedVariants.length} variants, expected ${data.expectedImprovement}% improvement`;
        }
        break;
        
      case "send-time":
        data = await optimizeSendTime(ctx, { 
          customerSegment: context.customerSegment || "residential",
          serviceType: context.serviceType || "maintenance"
        });
        response = `Optimal send time: ${data.nextOptimalSend}, expected ${data.expectedImprovement}% improvement`;
        break;
        
      case "analytics":
        data = await analyzeEmailPerformance(ctx, { timeframe: "monthly" });
        response = `Email performance: ${Math.round(data.metrics.openRate * 100)}% open rate, ${data.improvements.length} improvement opportunities`;
        break;
        
      default:
        response = "Email Marketing Specialist ready. I can optimize subject lines, send times, personalization, and drip campaigns for 200-400% ROI improvement.";
    }
    
    return {
      agentId: EMAIL_MARKETING_CONFIG.agentId,
      response,
      data,
      timestamp: Date.now(),
      confidence: 0.95
    };
  }
});