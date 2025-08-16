import { v } from "convex/values";
import { mutation, query } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Safety & Compliance Intelligence Agent (Core Sub-Level)
 * 
 * Domain: Comprehensive safety and regulatory compliance across all operations
 * Responsibilities:
 * - Enhanced AFISS risk assessment with predictive modeling
 * - Real-time safety compliance monitoring
 * - OSHA and regulatory compliance automation
 * - Insurance claims prevention and cost optimization
 * 
 * Specialist Agents Supervised:
 * - Enhanced AFISS Risk Assessment Specialist
 * - OSHA Compliance Specialist
 * - Environmental Impact Specialist
 * - Insurance Claims Specialist
 */

// Core Agent Configuration
export const SAFETY_COMPLIANCE_CONFIG = {
  agentId: "safety-compliance-intelligence-core",
  domain: "Comprehensive safety and regulatory compliance",
  targetMetrics: {
    safetyIncidentReduction: 0.60, // 60% decrease
    oshaComplianceScore: 1.0, // 100%
    insuranceCostReduction: 0.30, // 30% reduction
    environmentalViolations: 0 // Zero violations
  },
  alertThresholds: {
    highRiskJob: 7, // Alert if risk score >7
    complianceViolation: "immediate", // Immediate alert
    incidentProbability: 0.15, // Alert if >15% probability
    regulatoryDeadline: 7 // Alert 7 days before deadline
  },
  afissFactors: {
    // Enhanced AFISS factor database with ML scoring
    access: {
      "AF_ACCESS_001": { name: "Narrow street access", baseMultiplier: 0.12, riskWeight: 2 },
      "AF_ACCESS_002": { name: "Gated community restrictions", baseMultiplier: 0.06, riskWeight: 1 },
      "AF_ACCESS_003": { name: "Backyard access only", baseMultiplier: 0.22, riskWeight: 3 },
      "AF_ACCESS_004": { name: "Steep driveway/slope", baseMultiplier: 0.18, riskWeight: 3 },
      "AF_ACCESS_005": { name: "Limited equipment access", baseMultiplier: 0.15, riskWeight: 2 },
      "AF_ACCESS_006": { name: "No vehicle access", baseMultiplier: 0.35, riskWeight: 4 },
      "AF_ACCESS_007": { name: "Unstable ground conditions", baseMultiplier: 0.25, riskWeight: 4 }
    },
    fallZone: {
      "AF_FALL_001": { name: "House within fall radius", baseMultiplier: 0.20, riskWeight: 4 },
      "AF_FALL_002": { name: "Neighbor property at risk", baseMultiplier: 0.15, riskWeight: 3 },
      "AF_FALL_003": { name: "Public roadway", baseMultiplier: 0.25, riskWeight: 4 },
      "AF_FALL_004": { name: "Parked vehicles", baseMultiplier: 0.10, riskWeight: 2 },
      "AF_FALL_005": { name: "Swimming pool", baseMultiplier: 0.18, riskWeight: 3 },
      "AF_FALL_006": { name: "Power lines nearby", baseMultiplier: 0.40, riskWeight: 5 },
      "AF_FALL_007": { name: "Playground equipment", baseMultiplier: 0.30, riskWeight: 5 }
    },
    interference: {
      "AF_INTERFERENCE_001": { name: "Primary power lines", baseMultiplier: 0.45, riskWeight: 5 },
      "AF_INTERFERENCE_002": { name: "Secondary power lines", baseMultiplier: 0.25, riskWeight: 4 },
      "AF_INTERFERENCE_003": { name: "Cable/telecom lines", baseMultiplier: 0.08, riskWeight: 2 },
      "AF_INTERFERENCE_004": { name: "Structural interference", baseMultiplier: 0.15, riskWeight: 3 },
      "AF_INTERFERENCE_005": { name: "Overhead obstacles", baseMultiplier: 0.12, riskWeight: 2 },
      "AF_INTERFERENCE_006": { name: "Underground utilities", baseMultiplier: 0.10, riskWeight: 2 }
    },
    severity: {
      "AF_SEVERITY_001": { name: "Dead/dying tree", baseMultiplier: 0.30, riskWeight: 4 },
      "AF_SEVERITY_002": { name: "Storm damaged", baseMultiplier: 0.35, riskWeight: 4 },
      "AF_SEVERITY_003": { name: "Leaning tree", baseMultiplier: 0.25, riskWeight: 3 },
      "AF_SEVERITY_004": { name: "Large diameter (>24\")", baseMultiplier: 0.20, riskWeight: 3 },
      "AF_SEVERITY_005": { name: "Extreme height (>60ft)", baseMultiplier: 0.28, riskWeight: 4 },
      "AF_SEVERITY_006": { name: "Pest infestation", baseMultiplier: 0.15, riskWeight: 2 },
      "AF_SEVERITY_007": { name: "Root damage", baseMultiplier: 0.18, riskWeight: 3 }
    },
    siteConditions: {
      "AF_SITE_001": { name: "Wet/muddy conditions", baseMultiplier: 0.15, riskWeight: 3 },
      "AF_SITE_002": { name: "Frozen ground", baseMultiplier: 0.12, riskWeight: 2 },
      "AF_SITE_003": { name: "High wind conditions", baseMultiplier: 0.35, riskWeight: 4 },
      "AF_SITE_004": { name: "Limited visibility", baseMultiplier: 0.20, riskWeight: 3 },
      "AF_SITE_005": { name: "Uneven terrain", baseMultiplier: 0.18, riskWeight: 3 },
      "AF_SITE_006": { name: "Confined workspace", baseMultiplier: 0.22, riskWeight: 3 },
      "AF_SITE_007": { name: "Public foot traffic", baseMultiplier: 0.25, riskWeight: 4 }
    }
  }
};

// Enhanced AFISS Risk Assessment with Machine Learning
export const assessEnhancedAFISSRisk = mutation({
  args: {
    jobId: v.id("jobs"),
    siteData: v.object({
      location: v.object({
        latitude: v.number(),
        longitude: v.number(),
        address: v.string()
      }),
      treeData: v.object({
        species: v.string(),
        height: v.number(),
        dbh: v.number(),
        condition: v.string(),
        leanAngle: v.optional(v.number()),
        crownRadius: v.number()
      }),
      environmentalFactors: v.object({
        weather: v.object({
          windSpeed: v.number(),
          precipitation: v.number(),
          temperature: v.number(),
          visibility: v.number()
        }),
        groundConditions: v.string(),
        timeOfDay: v.string(),
        seasonality: v.string()
      }),
      proximityHazards: v.array(v.object({
        type: v.string(),
        distance: v.number(),
        severity: v.number()
      })),
      accessConstraints: v.array(v.string()),
      equipmentRequirements: v.array(v.string())
    }),
    crewData: v.object({
      crewSize: v.number(),
      experienceLevel: v.number(),
      certifications: v.array(v.string()),
      safetyRecord: v.number()
    })
  },
  handler: async (ctx, args) => {
    const { jobId, siteData, crewData } = args;
    
    // Step 1: Calculate traditional AFISS factors
    const afissFactors = calculateAFISSFactors(siteData);
    
    // Step 2: Apply machine learning risk prediction
    const mlRiskScore = calculateMLRiskPrediction(siteData, crewData, afissFactors);
    
    // Step 3: Environmental risk assessment
    const environmentalRisk = assessEnvironmentalRisk(siteData.environmentalFactors);
    
    // Step 4: Equipment-specific risk analysis
    const equipmentRisk = assessEquipmentRisk(siteData.equipmentRequirements, siteData);
    
    // Step 5: Crew competency analysis
    const crewRisk = assessCrewRisk(crewData, afissFactors.totalRiskScore);
    
    // Step 6: Historical incident pattern analysis
    const historicalRisk = await analyzeHistoricalIncidents(ctx, siteData);
    
    // Step 7: Calculate composite risk score
    const compositeRisk = calculateCompositeRiskScore({
      afissScore: afissFactors.totalRiskScore,
      mlScore: mlRiskScore,
      environmentalScore: environmentalRisk,
      equipmentScore: equipmentRisk,
      crewScore: crewRisk,
      historicalScore: historicalRisk
    });
    
    // Step 8: Generate risk mitigation recommendations
    const mitigationStrategies = generateRiskMitigationStrategies(compositeRisk, afissFactors);
    
    // Step 9: Determine approval requirements
    const approvalRequirements = determineApprovalRequirements(compositeRisk);
    
    // Store enhanced assessment
    const assessmentId = await ctx.db.insert("enhancedAfissAssessments", {
      jobId,
      siteData,
      crewData,
      afissFactors,
      mlRiskScore,
      environmentalRisk,
      equipmentRisk,
      crewRisk,
      historicalRisk,
      compositeRisk,
      mitigationStrategies,
      approvalRequirements,
      assessmentTime: Date.now(),
      agentVersion: "safety-compliance-v1.0"
    });
    
    // Generate alerts if necessary
    const alerts = generateSafetyAlerts(compositeRisk, approvalRequirements);
    
    return {
      assessmentId,
      riskScore: compositeRisk.totalScore,
      riskLevel: compositeRisk.riskLevel,
      afissBreakdown: afissFactors,
      mitigationStrategies,
      approvalRequirements,
      alerts,
      safetyRecommendations: generateSafetyRecommendations(compositeRisk),
      proceedAuthorization: compositeRisk.totalScore <= SAFETY_COMPLIANCE_CONFIG.alertThresholds.highRiskJob
    };
  }
});

// Real-time Safety Compliance Monitoring
export const monitorSafetyCompliance = mutation({
  args: {
    jobId: v.id("jobs"),
    complianceData: v.object({
      timestamp: v.number(),
      location: v.object({
        latitude: v.number(),
        longitude: v.number()
      }),
      crewOnSite: v.array(v.id("employees")),
      safetyChecks: v.object({
        ppeCompliance: v.boolean(),
        equipmentInspection: v.boolean(),
        siteSecuring: v.boolean(),
        emergencyPlanReview: v.boolean(),
        hazardIdentification: v.boolean()
      }),
      environmentalConditions: v.object({
        windSpeed: v.number(),
        precipitation: v.number(),
        visibility: v.number(),
        temperature: v.number()
      }),
      workActivities: v.array(v.object({
        activity: v.string(),
        riskLevel: v.number(),
        safetyMeasures: v.array(v.string())
      })),
      incidents: v.optional(v.array(v.object({
        type: v.string(),
        severity: v.string(),
        description: v.string(),
        actionTaken: v.string()
      })))
    })
  },
  handler: async (ctx, args) => {
    const { jobId, complianceData } = args;
    
    // Get original risk assessment
    const originalAssessment = await ctx.db
      .query("enhancedAfissAssessments")
      .filter(q => q.eq(q.field("jobId"), jobId))
      .first();
    
    // Calculate real-time compliance score
    const complianceScore = calculateComplianceScore(complianceData.safetyChecks);
    
    // Assess environmental condition changes
    const environmentalDelta = assessEnvironmentalChanges(
      originalAssessment?.environmentalRisk,
      complianceData.environmentalConditions
    );
    
    // Monitor crew safety behavior
    const crewSafetyScore = await assessCrewSafetyBehavior(ctx, complianceData.crewOnSite);
    
    // Identify compliance violations
    const violations = identifyComplianceViolations(complianceData);
    
    // Calculate dynamic risk adjustment
    const riskAdjustment = calculateDynamicRiskAdjustment(
      originalAssessment?.compositeRisk.totalScore || 5,
      environmentalDelta,
      complianceScore,
      crewSafetyScore
    );
    
    // Generate real-time alerts
    const alerts = generateRealTimeAlerts(violations, riskAdjustment, complianceData);
    
    // Store compliance monitoring
    const monitoringId = await ctx.db.insert("safetyComplianceMonitoring", {
      jobId,
      complianceData,
      complianceScore,
      environmentalDelta,
      crewSafetyScore,
      violations,
      riskAdjustment,
      alerts,
      timestamp: complianceData.timestamp,
      agentVersion: "safety-compliance-v1.0"
    });
    
    return {
      monitoringId,
      complianceScore,
      currentRiskLevel: riskAdjustment.adjustedRiskLevel,
      violations,
      alerts,
      recommendations: generateRealTimeRecommendations(riskAdjustment, violations),
      continueWork: violations.filter(v => v.severity === "critical").length === 0
    };
  }
});

// OSHA Compliance Automation
export const automateOSHACompliance = mutation({
  args: {
    complianceType: v.string(), // "training", "documentation", "inspection", "reporting"
    entityId: v.string(), // employee, job, or equipment ID
    complianceData: v.any()
  },
  handler: async (ctx, args) => {
    const { complianceType, entityId, complianceData } = args;
    
    let complianceResults = {};
    
    switch (complianceType) {
      case "training":
        complianceResults = await processTrainingCompliance(ctx, entityId, complianceData);
        break;
      
      case "documentation":
        complianceResults = await processDocumentationCompliance(ctx, entityId, complianceData);
        break;
      
      case "inspection":
        complianceResults = await processInspectionCompliance(ctx, entityId, complianceData);
        break;
      
      case "reporting":
        complianceResults = await processReportingCompliance(ctx, entityId, complianceData);
        break;
    }
    
    // Store compliance action
    const complianceId = await ctx.db.insert("oshaCompliance", {
      complianceType,
      entityId,
      complianceData,
      results: complianceResults,
      timestamp: Date.now(),
      agentVersion: "safety-compliance-v1.0"
    });
    
    return {
      complianceId,
      status: complianceResults.status,
      actions: complianceResults.actions,
      nextReview: complianceResults.nextReview,
      complianceScore: complianceResults.score
    };
  }
});

// Insurance Claims Prevention
export const preventInsuranceClaims = mutation({
  args: {
    jobId: v.id("jobs"),
    riskFactors: v.array(v.object({
      factor: v.string(),
      likelihood: v.number(),
      impact: v.number()
    }))
  },
  handler: async (ctx, args) => {
    const { jobId, riskFactors } = args;
    
    // Analyze claim probability
    const claimProbability = calculateClaimProbability(riskFactors);
    
    // Identify prevention measures
    const preventionMeasures = identifyPreventionMeasures(riskFactors);
    
    // Calculate cost-benefit of prevention
    const costBenefit = calculatePreventionCostBenefit(preventionMeasures, claimProbability);
    
    // Generate prevention plan
    const preventionPlan = generatePreventionPlan(preventionMeasures, costBenefit);
    
    // Store prevention analysis
    const preventionId = await ctx.db.insert("insuranceClaimsPrevention", {
      jobId,
      riskFactors,
      claimProbability,
      preventionMeasures,
      costBenefit,
      preventionPlan,
      timestamp: Date.now(),
      agentVersion: "safety-compliance-v1.0"
    });
    
    return {
      preventionId,
      claimProbability,
      preventionPlan,
      costSavings: costBenefit.estimatedSavings,
      implementationCost: costBenefit.implementationCost,
      roi: costBenefit.roi
    };
  }
});

// Environmental Compliance Monitoring
export const monitorEnvironmentalCompliance = mutation({
  args: {
    jobId: v.id("jobs"),
    environmentalData: v.object({
      treeSpecies: v.string(),
      protectedStatus: v.boolean(),
      habitatImpact: v.string(),
      wasteDisposal: v.object({
        debrisVolume: v.number(),
        disposalMethod: v.string(),
        recyclingRate: v.number()
      }),
      pesticideUse: v.optional(v.object({
        productName: v.string(),
        applicationRate: v.number(),
        targetPest: v.string(),
        bufferZones: v.array(v.string())
      })),
      soilImpact: v.object({
        compactionRisk: v.number(),
        erosionRisk: v.number(),
        contaminationRisk: v.number()
      })
    })
  },
  handler: async (ctx, args) => {
    const { jobId, environmentalData } = args;
    
    // Check protected species and habitats
    const protectionStatus = checkProtectedStatus(environmentalData);
    
    // Assess environmental impact
    const impactAssessment = assessEnvironmentalImpact(environmentalData);
    
    // Verify permit requirements
    const permitRequirements = checkPermitRequirements(environmentalData, protectionStatus);
    
    // Generate compliance recommendations
    const complianceRecommendations = generateEnvironmentalRecommendations(
      impactAssessment,
      permitRequirements
    );
    
    // Store environmental assessment
    const assessmentId = await ctx.db.insert("environmentalCompliance", {
      jobId,
      environmentalData,
      protectionStatus,
      impactAssessment,
      permitRequirements,
      complianceRecommendations,
      timestamp: Date.now(),
      agentVersion: "safety-compliance-v1.0"
    });
    
    return {
      assessmentId,
      complianceStatus: impactAssessment.complianceLevel,
      permitRequired: permitRequirements.required,
      recommendations: complianceRecommendations,
      approvedToProceed: impactAssessment.complianceLevel === "compliant"
    };
  }
});

// Safety Performance Analytics
export const analyzeSafetyPerformance = query({
  args: {
    timeframe: v.string(), // "daily", "weekly", "monthly", "quarterly"
    metrics: v.array(v.string()) // "incidents", "compliance", "training", "costs"
  },
  handler: async (ctx, args) => {
    const { timeframe, metrics } = args;
    
    const performance = {
      incidentRate: 0,
      complianceScore: 0,
      trainingCompletion: 0,
      safetyCosts: 0,
      trendDirection: "stable"
    };
    
    // Calculate safety incident rate
    if (metrics.includes("incidents")) {
      const incidents = await ctx.db.query("safetyIncidents").collect();
      performance.incidentRate = calculateIncidentRate(incidents, timeframe);
    }
    
    // Calculate compliance score
    if (metrics.includes("compliance")) {
      const complianceRecords = await ctx.db.query("oshaCompliance").collect();
      performance.complianceScore = calculateOverallComplianceScore(complianceRecords);
    }
    
    // Calculate training completion
    if (metrics.includes("training")) {
      const trainingRecords = await ctx.db.query("trainingRecords").collect();
      performance.trainingCompletion = calculateTrainingCompletion(trainingRecords);
    }
    
    // Compare to targets
    const targetComparison = compareToTargets(performance, SAFETY_COMPLIANCE_CONFIG.targetMetrics);
    
    // Generate improvement recommendations
    const improvements = generateSafetyImprovements(performance, targetComparison);
    
    return {
      performance,
      targetComparison,
      improvements,
      timeframe,
      lastUpdated: Date.now(),
      benchmarkStatus: targetComparison.overallStatus
    };
  }
});

// Helper Functions

function calculateAFISSFactors(siteData: any) {
  const factors = SAFETY_COMPLIANCE_CONFIG.afissFactors;
  const applicableFactors = [];
  let totalRiskScore = 0;
  let totalMultiplier = 1.0;
  
  // Analyze each AFISS domain
  ["access", "fallZone", "interference", "severity", "siteConditions"].forEach(domain => {
    const domainFactors = identifyDomainFactors(siteData, domain);
    domainFactors.forEach(factorCode => {
      if (factors[domain][factorCode]) {
        const factor = factors[domain][factorCode];
        applicableFactors.push({
          domain,
          code: factorCode,
          name: factor.name,
          multiplier: factor.baseMultiplier,
          riskWeight: factor.riskWeight
        });
        totalMultiplier += factor.baseMultiplier;
        totalRiskScore += factor.riskWeight;
      }
    });
  });
  
  return {
    applicableFactors,
    totalMultiplier,
    totalRiskScore: Math.min(10, totalRiskScore), // Cap at 10
    domainBreakdown: groupFactorsByDomain(applicableFactors)
  };
}

function calculateMLRiskPrediction(siteData: any, crewData: any, afissFactors: any): number {
  // Simplified ML model - in production would use trained model
  let mlScore = 5.0; // Base score
  
  // Tree condition factors
  if (siteData.treeData.condition === "dead") mlScore += 2.0;
  if (siteData.treeData.condition === "dying") mlScore += 1.5;
  if (siteData.treeData.leanAngle > 15) mlScore += 1.0;
  
  // Weather factors
  if (siteData.environmentalFactors.weather.windSpeed > 20) mlScore += 1.5;
  if (siteData.environmentalFactors.weather.precipitation > 0.1) mlScore += 1.0;
  if (siteData.environmentalFactors.weather.visibility < 5) mlScore += 0.5;
  
  // Crew experience adjustment
  const crewExperienceMultiplier = Math.max(0.7, 1.0 - (crewData.experienceLevel / 20));
  mlScore *= crewExperienceMultiplier;
  
  return Math.min(10, mlScore);
}

function assessEnvironmentalRisk(environmentalFactors: any): number {
  let envRisk = 0;
  
  // Weather conditions
  if (environmentalFactors.weather.windSpeed > 25) envRisk += 3;
  else if (environmentalFactors.weather.windSpeed > 15) envRisk += 1;
  
  if (environmentalFactors.weather.precipitation > 0.1) envRisk += 2;
  if (environmentalFactors.weather.temperature < 20) envRisk += 1;
  if (environmentalFactors.weather.visibility < 5) envRisk += 2;
  
  // Ground conditions
  if (environmentalFactors.groundConditions === "wet") envRisk += 2;
  if (environmentalFactors.groundConditions === "frozen") envRisk += 1;
  if (environmentalFactors.groundConditions === "unstable") envRisk += 3;
  
  return Math.min(10, envRisk);
}

function assessEquipmentRisk(equipmentRequirements: string[], siteData: any): number {
  let equipRisk = 0;
  
  // High-risk equipment
  if (equipmentRequirements.includes("crane")) equipRisk += 2;
  if (equipmentRequirements.includes("bucket-truck")) equipRisk += 1;
  if (equipmentRequirements.includes("chainsaw")) equipRisk += 1;
  
  // Site accessibility for equipment
  if (siteData.accessConstraints.includes("narrow-access")) equipRisk += 1;
  if (siteData.accessConstraints.includes("overhead-obstacles")) equipRisk += 1;
  
  return Math.min(10, equipRisk);
}

function assessCrewRisk(crewData: any, jobRiskScore: number): number {
  let crewRisk = 5; // Base risk
  
  // Experience factor
  crewRisk -= Math.min(2, crewData.experienceLevel / 5);
  
  // Safety record factor
  crewRisk -= Math.min(2, crewData.safetyRecord / 25);
  
  // Certification factor
  const certificationBonus = Math.min(1, crewData.certifications.length / 5);
  crewRisk -= certificationBonus;
  
  // Crew size vs job complexity
  const crewSizeAdequacy = crewData.crewSize >= Math.ceil(jobRiskScore / 3) ? 0 : 1;
  crewRisk += crewSizeAdequacy;
  
  return Math.max(1, Math.min(10, crewRisk));
}

async function analyzeHistoricalIncidents(ctx: any, siteData: any): Promise<number> {
  // Check for similar incidents in the area or with similar conditions
  // This would query historical incident data
  // For now, return base historical risk
  return 2; // Low historical risk baseline
}

function calculateCompositeRiskScore(riskComponents: any) {
  const weights = {
    afissScore: 0.30,
    mlScore: 0.25,
    environmentalScore: 0.20,
    equipmentScore: 0.15,
    crewScore: 0.10
  };
  
  const totalScore = 
    riskComponents.afissScore * weights.afissScore +
    riskComponents.mlScore * weights.mlScore +
    riskComponents.environmentalScore * weights.environmentalScore +
    riskComponents.equipmentScore * weights.equipmentScore +
    riskComponents.crewScore * weights.crewScore;
  
  let riskLevel = "low";
  if (totalScore >= 8) riskLevel = "extreme";
  else if (totalScore >= 6) riskLevel = "high";
  else if (totalScore >= 4) riskLevel = "moderate";
  
  return {
    totalScore: Math.round(totalScore * 10) / 10,
    riskLevel,
    components: riskComponents,
    confidence: 0.85
  };
}

function generateRiskMitigationStrategies(compositeRisk: any, afissFactors: any) {
  const strategies = [];
  
  if (compositeRisk.totalScore >= 7) {
    strategies.push({
      priority: "critical",
      strategy: "Require ISA certified arborist supervision",
      implementation: "immediate"
    });
  }
  
  if (compositeRisk.components.environmentalScore >= 3) {
    strategies.push({
      priority: "high",
      strategy: "Implement enhanced weather monitoring protocols",
      implementation: "before-work-starts"
    });
  }
  
  if (compositeRisk.components.equipmentScore >= 3) {
    strategies.push({
      priority: "high",
      strategy: "Conduct additional equipment safety inspection",
      implementation: "same-day"
    });
  }
  
  return strategies;
}

function determineApprovalRequirements(compositeRisk: any) {
  const requirements = {
    managerApproval: compositeRisk.totalScore >= 6,
    safetyOfficerApproval: compositeRisk.totalScore >= 7,
    clientNotification: compositeRisk.totalScore >= 8,
    additionalInsurance: compositeRisk.totalScore >= 8,
    delayRecommended: compositeRisk.totalScore >= 9
  };
  
  return requirements;
}

function generateSafetyAlerts(compositeRisk: any, approvalRequirements: any) {
  const alerts = [];
  
  if (compositeRisk.totalScore >= SAFETY_COMPLIANCE_CONFIG.alertThresholds.highRiskJob) {
    alerts.push({
      type: "high-risk-job",
      severity: "critical",
      message: `Job risk score ${compositeRisk.totalScore}/10 exceeds safety threshold`,
      actionRequired: "Manager approval required before proceeding"
    });
  }
  
  if (approvalRequirements.delayRecommended) {
    alerts.push({
      type: "delay-recommended",
      severity: "critical",
      message: "Extreme risk conditions detected - delay recommended",
      actionRequired: "Review conditions and implement additional safety measures"
    });
  }
  
  return alerts;
}

function generateSafetyRecommendations(compositeRisk: any): string[] {
  const recommendations = [];
  
  if (compositeRisk.totalScore >= 6) {
    recommendations.push("Implement enhanced safety protocols");
    recommendations.push("Increase crew supervision");
  }
  
  if (compositeRisk.components.environmentalScore >= 3) {
    recommendations.push("Monitor weather conditions continuously");
  }
  
  if (compositeRisk.components.crewScore >= 6) {
    recommendations.push("Provide additional safety training");
  }
  
  return recommendations.length > 0 ? recommendations : ["Standard safety protocols sufficient"];
}

// Additional helper functions would be implemented here...
function calculateComplianceScore(safetyChecks: any): number {
  const checks = Object.values(safetyChecks) as boolean[];
  const passedChecks = checks.filter(check => check).length;
  return (passedChecks / checks.length) * 100;
}

function assessEnvironmentalChanges(originalRisk: any, currentConditions: any) {
  // Compare current conditions to original assessment
  return {
    windSpeedDelta: currentConditions.windSpeed - (originalRisk?.windSpeed || 0),
    precipitationDelta: currentConditions.precipitation - (originalRisk?.precipitation || 0),
    riskIncrease: false // Would be calculated based on deltas
  };
}

async function assessCrewSafetyBehavior(ctx: any, crewIds: any[]): Promise<number> {
  // Would assess real-time crew safety behavior
  return 85; // Placeholder score
}

function identifyComplianceViolations(complianceData: any) {
  const violations = [];
  
  Object.entries(complianceData.safetyChecks).forEach(([check, passed]) => {
    if (!passed) {
      violations.push({
        type: check,
        severity: check === "ppeCompliance" ? "critical" : "warning",
        description: `${check} requirement not met`
      });
    }
  });
  
  return violations;
}

function calculateDynamicRiskAdjustment(originalRisk: number, envDelta: any, complianceScore: number, crewScore: number) {
  let adjustedRisk = originalRisk;
  
  // Adjust for environmental changes
  if (envDelta.riskIncrease) adjustedRisk += 1;
  
  // Adjust for compliance score
  adjustedRisk += (100 - complianceScore) / 20;
  
  // Adjust for crew performance
  adjustedRisk += (100 - crewScore) / 25;
  
  return {
    adjustedRiskScore: Math.min(10, adjustedRisk),
    adjustedRiskLevel: adjustedRisk >= 7 ? "high" : adjustedRisk >= 5 ? "moderate" : "low"
  };
}

function generateRealTimeAlerts(violations: any[], riskAdjustment: any, complianceData: any) {
  const alerts = [];
  
  violations.forEach(violation => {
    if (violation.severity === "critical") {
      alerts.push({
        type: "compliance-violation",
        severity: "immediate",
        message: `Critical safety violation: ${violation.description}`,
        actionRequired: "Stop work immediately and address violation"
      });
    }
  });
  
  if (riskAdjustment.adjustedRiskLevel === "high") {
    alerts.push({
      type: "elevated-risk",
      severity: "warning",
      message: "Risk level has increased due to changing conditions",
      actionRequired: "Implement additional safety measures"
    });
  }
  
  return alerts;
}

function generateRealTimeRecommendations(riskAdjustment: any, violations: any[]): string[] {
  const recommendations = [];
  
  if (violations.length > 0) {
    recommendations.push("Address all safety violations before continuing work");
  }
  
  if (riskAdjustment.adjustedRiskLevel === "high") {
    recommendations.push("Consider temporary work suspension");
    recommendations.push("Implement enhanced safety protocols");
  }
  
  return recommendations;
}

// Placeholder implementations for OSHA compliance functions
async function processTrainingCompliance(ctx: any, entityId: string, data: any) {
  return { status: "compliant", score: 95, actions: [], nextReview: Date.now() + 365 * 24 * 60 * 60 * 1000 };
}

async function processDocumentationCompliance(ctx: any, entityId: string, data: any) {
  return { status: "compliant", score: 92, actions: [], nextReview: Date.now() + 180 * 24 * 60 * 60 * 1000 };
}

async function processInspectionCompliance(ctx: any, entityId: string, data: any) {
  return { status: "compliant", score: 88, actions: [], nextReview: Date.now() + 90 * 24 * 60 * 60 * 1000 };
}

async function processReportingCompliance(ctx: any, entityId: string, data: any) {
  return { status: "compliant", score: 96, actions: [], nextReview: Date.now() + 30 * 24 * 60 * 60 * 1000 };
}

// Additional placeholder functions for insurance and environmental compliance...
function calculateClaimProbability(riskFactors: any[]): number {
  return riskFactors.reduce((sum, factor) => sum + (factor.likelihood * factor.impact), 0) / 100;
}

function identifyPreventionMeasures(riskFactors: any[]) {
  return riskFactors.map(factor => ({
    factor: factor.factor,
    measures: [`Implement ${factor.factor} prevention protocol`],
    cost: factor.impact * 100
  }));
}

function calculatePreventionCostBenefit(measures: any[], claimProbability: number) {
  const totalCost = measures.reduce((sum, measure) => sum + measure.cost, 0);
  const estimatedClaim = claimProbability * 50000; // Average claim cost
  return {
    implementationCost: totalCost,
    estimatedSavings: estimatedClaim * 0.8, // 80% prevention effectiveness
    roi: (estimatedClaim * 0.8 - totalCost) / totalCost
  };
}

function generatePreventionPlan(measures: any[], costBenefit: any) {
  return {
    measures: measures.filter(m => m.cost < costBenefit.estimatedSavings / measures.length),
    timeline: "immediate",
    priority: "high"
  };
}

function checkProtectedStatus(environmentalData: any) {
  return {
    isProtected: environmentalData.protectedStatus,
    protectionLevel: environmentalData.protectedStatus ? "state" : "none",
    restrictions: environmentalData.protectedStatus ? ["permit-required"] : []
  };
}

function assessEnvironmentalImpact(environmentalData: any) {
  let impactScore = 0;
  
  if (environmentalData.protectedStatus) impactScore += 5;
  if (environmentalData.soilImpact.compactionRisk > 5) impactScore += 2;
  if (environmentalData.soilImpact.erosionRisk > 5) impactScore += 2;
  
  return {
    impactScore,
    complianceLevel: impactScore > 7 ? "non-compliant" : impactScore > 3 ? "conditional" : "compliant",
    mitigationRequired: impactScore > 3
  };
}

function checkPermitRequirements(environmentalData: any, protectionStatus: any) {
  return {
    required: protectionStatus.isProtected || environmentalData.wasteDisposal.debrisVolume > 100,
    permits: protectionStatus.isProtected ? ["environmental-impact", "tree-removal"] : ["waste-disposal"],
    timeline: "2-4 weeks"
  };
}

function generateEnvironmentalRecommendations(impact: any, permits: any): string[] {
  const recommendations = [];
  
  if (impact.mitigationRequired) {
    recommendations.push("Implement soil protection measures");
  }
  
  if (permits.required) {
    recommendations.push("Obtain required permits before work begins");
  }
  
  return recommendations;
}

function identifyDomainFactors(siteData: any, domain: string): string[] {
  // Simplified implementation - would analyze siteData to identify applicable factors
  const factors = [];
  
  switch (domain) {
    case "access":
      if (siteData.accessConstraints.includes("narrow")) factors.push("AF_ACCESS_001");
      if (siteData.accessConstraints.includes("backyard")) factors.push("AF_ACCESS_003");
      break;
    case "fallZone":
      siteData.proximityHazards.forEach(hazard => {
        if (hazard.type === "house" && hazard.distance < 50) factors.push("AF_FALL_001");
        if (hazard.type === "power-line") factors.push("AF_FALL_006");
      });
      break;
    case "interference":
      siteData.proximityHazards.forEach(hazard => {
        if (hazard.type === "power-line") factors.push("AF_INTERFERENCE_001");
      });
      break;
    case "severity":
      if (siteData.treeData.condition === "dead") factors.push("AF_SEVERITY_001");
      if (siteData.treeData.height > 60) factors.push("AF_SEVERITY_005");
      break;
    case "siteConditions":
      if (siteData.environmentalFactors.groundConditions === "wet") factors.push("AF_SITE_001");
      if (siteData.environmentalFactors.weather.windSpeed > 20) factors.push("AF_SITE_003");
      break;
  }
  
  return factors;
}

function groupFactorsByDomain(factors: any[]) {
  return factors.reduce((groups, factor) => {
    if (!groups[factor.domain]) groups[factor.domain] = [];
    groups[factor.domain].push(factor);
    return groups;
  }, {});
}

function calculateIncidentRate(incidents: any[], timeframe: string): number {
  // Calculate incidents per time period
  return incidents.length / 1000; // incidents per 1000 hours worked (placeholder)
}

function calculateOverallComplianceScore(records: any[]): number {
  if (records.length === 0) return 100;
  const avgScore = records.reduce((sum, record) => sum + record.results.score, 0) / records.length;
  return avgScore;
}

function calculateTrainingCompletion(records: any[]): number {
  // Calculate percentage of required training completed
  return 95; // Placeholder
}

function compareToTargets(performance: any, targets: any) {
  return {
    incidentReduction: performance.incidentRate <= (1 - targets.safetyIncidentReduction),
    complianceScore: performance.complianceScore >= (targets.oshaComplianceScore * 100),
    overallStatus: "meeting-targets" // Would be calculated based on individual comparisons
  };
}

function generateSafetyImprovements(performance: any, comparison: any): string[] {
  const improvements = [];
  
  if (!comparison.incidentReduction) {
    improvements.push("Implement additional safety training programs");
  }
  
  if (!comparison.complianceScore) {
    improvements.push("Enhance compliance monitoring procedures");
  }
  
  return improvements.length > 0 ? improvements : ["Safety performance meeting all targets"];
}

// Safety & Compliance Intelligence Agent Main Interface
export const processSafetyCompliance = mutation({
  args: {
    message: v.string(),
    context: v.object({
      jobId: v.optional(v.id("jobs")),
      requestType: v.string() // "afiss-assessment", "compliance-monitoring", "osha-compliance", "environmental"
    })
  },
  handler: async (ctx, args) => {
    const { message, context } = args;
    
    let response = "";
    let data = null;
    
    switch (context.requestType) {
      case "afiss-assessment":
        if (context.siteData && context.crewData) {
          data = await assessEnhancedAFISSRisk(ctx, {
            jobId: context.jobId,
            siteData: context.siteData,
            crewData: context.crewData
          });
          response = `AFISS assessment complete: Risk level ${data.riskLevel} (${data.riskScore}/10). ${data.alerts.length} alerts generated.`;
        }
        break;
        
      case "compliance-monitoring":
        if (context.complianceData) {
          data = await monitorSafetyCompliance(ctx, {
            jobId: context.jobId,
            complianceData: context.complianceData
          });
          response = `Safety compliance: ${data.complianceScore}% score, ${data.violations.length} violations detected. Continue work: ${data.continueWork}`;
        }
        break;
        
      default:
        const performance = await analyzeSafetyPerformance(ctx, {
          timeframe: "monthly",
          metrics: ["incidents", "compliance", "training"]
        });
        response = `Safety Status: ${Math.round(performance.performance.complianceScore)}% compliance, incident rate: ${performance.performance.incidentRate}`;
        data = performance;
    }
    
    return {
      agentId: SAFETY_COMPLIANCE_CONFIG.agentId,
      response,
      data,
      timestamp: Date.now(),
      confidence: 0.95
    };
  }
});