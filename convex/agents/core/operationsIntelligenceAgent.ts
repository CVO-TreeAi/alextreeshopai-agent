import { v } from "convex/values";
import { mutation, query } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Operations Intelligence Agent (Core Sub-Level)
 * 
 * Domain: Complete operational workflow optimization from job assignment to completion
 * Responsibilities:
 * - Real-time crew and equipment allocation optimization
 * - GPS tracking and productivity monitoring
 * - Weather-based scheduling adjustments
 * - Quality control and efficiency maximization
 * 
 * Specialist Agents Supervised:
 * - Scheduling Optimization Specialist
 * - Route Planning Specialist
 * - Quality Assurance Specialist
 * - Performance Analytics Specialist
 */

// Core Agent Configuration
export const OPERATIONS_AGENT_CONFIG = {
  agentId: "operations-intelligence-core",
  domain: "Complete operational workflow optimization",
  targetMetrics: {
    equipmentUtilization: 0.85, // 85%
    crewProductivity: 0.20, // 20% improvement
    onTimeCompletion: 0.95, // 95%
    travelTimeReduction: 0.25 // 25% reduction
  },
  alertThresholds: {
    safetyRisk: 7, // Alert if risk score >7
    equipmentDowntime: 0.15, // Alert if downtime >15%
    qualityDrop: 0.80, // Alert if quality <80%
    efficiencyDrop: 0.15 // Alert if efficiency drops >15%
  }
};

// Crew Allocation Optimization
export const optimizeCrewAllocation = mutation({
  args: {
    jobRequirements: v.object({
      jobId: v.id("jobs"),
      serviceType: v.string(),
      treeScore: v.number(),
      complexity: v.string(),
      requiredSkills: v.array(v.string()),
      estimatedHours: v.number(),
      safetyRiskLevel: v.number(),
      equipmentNeeded: v.array(v.string()),
      scheduledDate: v.number(),
      location: v.object({
        latitude: v.number(),
        longitude: v.number()
      })
    })
  },
  handler: async (ctx, args) => {
    const { jobRequirements } = args;
    
    // Get available crew members for the date
    const employees = await ctx.db
      .query("employees")
      .filter((q) => q.eq(q.field("identity.employmentStatus"), "active"))
      .collect();
    
    // Score each employee for this job
    const crewScores = [];
    
    for (const employee of employees) {
      let score = 0;
      const factors = [];
      
      // Skill matching (40 points max)
      const matchedSkills = jobRequirements.requiredSkills.filter(skill => 
        employee.skills?.[skill] === true
      );
      const skillScore = (matchedSkills.length / jobRequirements.requiredSkills.length) * 40;
      score += skillScore;
      factors.push({ factor: 'skills', score: skillScore, weight: 0.40 });
      
      // Experience level (25 points max)
      const experienceScore = Math.min(25, (employee.skills?.yearsExperience || 0) * 2.5);
      score += experienceScore;
      factors.push({ factor: 'experience', score: experienceScore, weight: 0.25 });
      
      // Safety record (20 points max)
      const safetyScore = (employee.skills?.safetyRecordScore || 80) / 5; // Scale 0-100 to 0-20
      score += safetyScore;
      factors.push({ factor: 'safety', score: safetyScore, weight: 0.20 });
      
      // Performance rating (15 points max)
      const performanceScore = (employee.performance?.efficiencyRating || 80) * 0.15;
      score += performanceScore;
      factors.push({ factor: 'performance', score: performanceScore, weight: 0.15 });
      
      crewScores.push({
        employeeId: employee._id,
        employee,
        score,
        factors,
        availability: "available" // TODO: Check actual availability
      });
    }
    
    // Sort by score and select optimal crew
    crewScores.sort((a, b) => b.score - a.score);
    
    // Determine crew size based on job complexity
    const crewSizeMap = {
      'simple': 2,
      'moderate': 3,
      'complex': 4,
      'extreme': 5
    };
    const optimalCrewSize = crewSizeMap[jobRequirements.complexity] || 3;
    
    // Select crew ensuring skill coverage
    const selectedCrew = [];
    const requiredSkillsCovered = new Set();
    
    // First pass: Select highest-scoring members with required skills
    for (const crewMember of crewScores) {
      if (selectedCrew.length >= optimalCrewSize) break;
      
      const memberSkills = jobRequirements.requiredSkills.filter(skill => 
        crewMember.employee.skills?.[skill] === true
      );
      
      if (memberSkills.length > 0) {
        selectedCrew.push(crewMember);
        memberSkills.forEach(skill => requiredSkillsCovered.add(skill));
      }
    }
    
    // Second pass: Fill remaining spots with best available
    for (const crewMember of crewScores) {
      if (selectedCrew.length >= optimalCrewSize) break;
      if (!selectedCrew.find(selected => selected.employeeId === crewMember.employeeId)) {
        selectedCrew.push(crewMember);
      }
    }
    
    // Calculate crew synergy (teamwork history)
    const crewSynergy = calculateCrewSynergy(selectedCrew.map(c => c.employeeId));
    
    // Store allocation decision
    const allocationId = await ctx.db.insert("crewAllocations", {
      jobId: jobRequirements.jobId,
      selectedCrew: selectedCrew.map(c => ({
        employeeId: c.employeeId,
        score: c.score,
        role: determineCrewRole(c.employee, jobRequirements)
      })),
      crewSynergy,
      skillsCovered: Array.from(requiredSkillsCovered),
      estimatedEfficiency: calculateEstimatedEfficiency(selectedCrew, crewSynergy),
      createdAt: Date.now(),
      agentVersion: "operations-intelligence-v1.0"
    });
    
    return {
      allocationId,
      selectedCrew: selectedCrew.map(c => ({
        employeeId: c.employeeId,
        name: `${c.employee.identity.firstName} ${c.employee.identity.lastName}`,
        score: Math.round(c.score),
        role: determineCrewRole(c.employee, jobRequirements),
        skills: Object.keys(c.employee.skills || {}).filter(key => c.employee.skills[key] === true)
      })),
      crewSynergy: Math.round(crewSynergy * 100) / 100,
      skillsCovered: Array.from(requiredSkillsCovered),
      missingSkills: jobRequirements.requiredSkills.filter(skill => !requiredSkillsCovered.has(skill)),
      estimatedEfficiency: Math.round(calculateEstimatedEfficiency(selectedCrew, crewSynergy) * 100),
      recommendation: requiredSkillsCovered.size === jobRequirements.requiredSkills.length ? 
        "optimal-crew" : "skill-gaps-identified"
    };
  }
});

// Real-time Job Progress Tracking
export const trackJobProgress = mutation({
  args: {
    jobId: v.id("jobs"),
    progressData: v.object({
      location: v.object({
        latitude: v.number(),
        longitude: v.number()
      }),
      timestamp: v.number(),
      crewOnSite: v.array(v.id("employees")),
      completedTasks: v.array(v.string()),
      currentTask: v.string(),
      qualityMetrics: v.object({
        workmanshipScore: v.number(),
        safetyComplianceScore: v.number(),
        customerSatisfactionIndicator: v.number()
      }),
      productivity: v.object({
        treesCompleted: v.number(),
        hoursWorked: v.number(),
        equipmentUtilization: v.number()
      }),
      issues: v.optional(v.array(v.object({
        type: v.string(),
        severity: v.string(),
        description: v.string()
      })))
    })
  },
  handler: async (ctx, args) => {
    const { jobId, progressData } = args;
    
    // Get job details
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    
    // Calculate real-time efficiency
    const expectedProgress = calculateExpectedProgress(job, progressData.timestamp);
    const actualProgress = progressData.completedTasks.length / (job.scope?.estimatedTaskCount || 10);
    const efficiencyRatio = actualProgress / expectedProgress;
    
    // Productivity calculation
    const productivityScore = calculateProductivityScore(progressData.productivity, job.scope);
    
    // Quality assessment
    const qualityScore = (
      progressData.qualityMetrics.workmanshipScore * 0.4 +
      progressData.qualityMetrics.safetyComplianceScore * 0.4 +
      progressData.qualityMetrics.customerSatisfactionIndicator * 0.2
    );
    
    // Identify alerts
    const alerts = [];
    
    if (efficiencyRatio < 0.85) {
      alerts.push({
        type: "efficiency-low",
        severity: "warning",
        message: `Job efficiency ${Math.round(efficiencyRatio * 100)}% below expected`,
        actionRequired: "Review crew allocation or task complexity"
      });
    }
    
    if (qualityScore < OPERATIONS_AGENT_CONFIG.alertThresholds.qualityDrop * 100) {
      alerts.push({
        type: "quality-concern",
        severity: "warning",
        message: `Quality score ${Math.round(qualityScore)}% below standards`,
        actionRequired: "Supervisor intervention required"
      });
    }
    
    if (progressData.issues?.length > 0) {
      const criticalIssues = progressData.issues.filter(issue => issue.severity === "critical");
      if (criticalIssues.length > 0) {
        alerts.push({
          type: "critical-issue",
          severity: "critical",
          message: `${criticalIssues.length} critical issues reported`,
          actionRequired: "Immediate supervisor response required"
        });
      }
    }
    
    // Store progress update
    const progressId = await ctx.db.insert("jobProgress", {
      jobId,
      progressData,
      calculatedMetrics: {
        efficiencyRatio,
        productivityScore,
        qualityScore,
        expectedProgress,
        actualProgress
      },
      alerts,
      timestamp: progressData.timestamp,
      agentVersion: "operations-intelligence-v1.0"
    });
    
    return {
      progressId,
      efficiencyRatio: Math.round(efficiencyRatio * 100) / 100,
      productivityScore: Math.round(productivityScore),
      qualityScore: Math.round(qualityScore),
      alerts,
      recommendations: generateProgressRecommendations(efficiencyRatio, qualityScore, progressData),
      nextCheckIn: progressData.timestamp + (30 * 60 * 1000) // 30 minutes
    };
  }
});

// Weather-Based Scheduling Adjustment
export const adjustScheduleForWeather = mutation({
  args: {
    date: v.number(),
    weatherConditions: v.object({
      temperature: v.number(),
      windSpeed: v.number(),
      precipitation: v.number(),
      visibility: v.number(),
      alerts: v.array(v.string())
    })
  },
  handler: async (ctx, args) => {
    const { date, weatherConditions } = args;
    
    // Get jobs scheduled for the date
    const scheduledJobs = await ctx.db
      .query("jobs")
      .filter((q) => {
        const jobDate = new Date(q.field("identity.scheduledStartDate")).getTime();
        const targetDate = new Date(date).getTime();
        return Math.abs(jobDate - targetDate) < 24 * 60 * 60 * 1000; // Same day
      })
      .collect();
    
    const adjustments = [];
    
    for (const job of scheduledJobs) {
      const adjustment = assessWeatherImpact(job, weatherConditions);
      
      if (adjustment.action !== "proceed") {
        adjustments.push({
          jobId: job._id,
          currentSchedule: job.identity.scheduledStartDate,
          recommendation: adjustment.action,
          reason: adjustment.reason,
          suggestedNewDate: adjustment.suggestedNewDate,
          impactScore: adjustment.impactScore
        });
        
        // Update job if postponement is required
        if (adjustment.action === "postpone" && adjustment.suggestedNewDate) {
          await ctx.db.patch(job._id, {
            "identity.scheduledStartDate": adjustment.suggestedNewDate,
            "weatherPostponement": {
              originalDate: job.identity.scheduledStartDate,
              reason: adjustment.reason,
              conditions: weatherConditions,
              adjustedAt: Date.now()
            }
          });
        }
      }
    }
    
    // Store weather adjustment decision
    const adjustmentId = await ctx.db.insert("weatherAdjustments", {
      date,
      weatherConditions,
      jobsAffected: adjustments.length,
      adjustments,
      createdAt: Date.now(),
      agentVersion: "operations-intelligence-v1.0"
    });
    
    return {
      adjustmentId,
      jobsAffected: adjustments.length,
      adjustments,
      weatherSummary: {
        condition: categorizeWeatherCondition(weatherConditions),
        workability: calculateWorkabilityScore(weatherConditions),
        recommendations: generateWeatherRecommendations(weatherConditions)
      }
    };
  }
});

// Equipment Utilization Optimization
export const optimizeEquipmentUtilization = query({
  args: {
    timeframe: v.string() // "daily", "weekly", "monthly"
  },
  handler: async (ctx, args) => {
    const { timeframe } = args;
    
    // Get equipment data
    const equipment = await ctx.db.query("equipment").collect();
    const utilizationData = [];
    
    for (const item of equipment) {
      const utilization = await calculateEquipmentUtilization(ctx, item._id, timeframe);
      
      utilizationData.push({
        equipmentId: item._id,
        type: item.identity.equipmentType,
        model: `${item.identity.make} ${item.identity.model}`,
        utilization: utilization.percentage,
        hoursUsed: utilization.hoursUsed,
        availableHours: utilization.availableHours,
        efficiency: utilization.efficiency,
        costPerHour: item.operations.costPerHour,
        recommendations: generateEquipmentRecommendations(utilization)
      });
    }
    
    // Sort by utilization (lowest first for optimization opportunities)
    utilizationData.sort((a, b) => a.utilization - b.utilization);
    
    // Identify optimization opportunities
    const optimizationOpportunities = utilizationData
      .filter(item => item.utilization < OPERATIONS_AGENT_CONFIG.targetMetrics.equipmentUtilization)
      .map(item => ({
        equipmentId: item.equipmentId,
        currentUtilization: item.utilization,
        potentialImprovement: OPERATIONS_AGENT_CONFIG.targetMetrics.equipmentUtilization - item.utilization,
        recommendedActions: item.recommendations
      }));
    
    return {
      totalEquipment: equipment.length,
      averageUtilization: utilizationData.reduce((sum, item) => sum + item.utilization, 0) / utilizationData.length,
      targetUtilization: OPERATIONS_AGENT_CONFIG.targetMetrics.equipmentUtilization,
      utilizationData,
      optimizationOpportunities,
      potentialSavings: calculatePotentialSavings(optimizationOpportunities),
      timeframe
    };
  }
});

// Operations Performance Monitor
export const monitorOperationsPerformance = query({
  args: {},
  handler: async (ctx) => {
    const alerts = [];
    const metrics = {
      equipmentUtilization: 0,
      averageJobCompletion: 0,
      qualityScore: 0,
      safetyScore: 0,
      productivityTrend: 0
    };
    
    // Calculate current metrics
    const jobs = await ctx.db.query("jobs").collect();
    const equipment = await ctx.db.query("equipment").collect();
    const progressReports = await ctx.db.query("jobProgress").collect();
    
    // Equipment utilization
    const utilizationSum = equipment.reduce((sum, item) => 
      sum + (item.operations.utilizationPercentage || 0), 0
    );
    metrics.equipmentUtilization = equipment.length > 0 ? utilizationSum / equipment.length : 0;
    
    // Job completion rate
    const completedJobs = jobs.filter(job => job.identity.jobStatus === "completed");
    const onTimeJobs = completedJobs.filter(job => 
      job.identity.actualStartDate <= job.identity.scheduledStartDate
    );
    metrics.averageJobCompletion = completedJobs.length > 0 ? 
      onTimeJobs.length / completedJobs.length : 0;
    
    // Quality score from recent progress reports
    const recentReports = progressReports.filter(report => 
      report.timestamp > Date.now() - (7 * 24 * 60 * 60 * 1000)
    );
    metrics.qualityScore = recentReports.length > 0 ?
      recentReports.reduce((sum, report) => sum + report.calculatedMetrics.qualityScore, 0) / recentReports.length : 0;
    
    // Check against targets and generate alerts
    if (metrics.equipmentUtilization < OPERATIONS_AGENT_CONFIG.targetMetrics.equipmentUtilization) {
      alerts.push({
        type: "low-equipment-utilization",
        severity: "warning",
        message: `Equipment utilization ${Math.round(metrics.equipmentUtilization * 100)}% below target`,
        actionRequired: "Review equipment allocation and scheduling"
      });
    }
    
    if (metrics.averageJobCompletion < OPERATIONS_AGENT_CONFIG.targetMetrics.onTimeCompletion) {
      alerts.push({
        type: "completion-rate-low",
        severity: "warning",
        message: `On-time completion ${Math.round(metrics.averageJobCompletion * 100)}% below target`,
        actionRequired: "Review scheduling and resource allocation"
      });
    }
    
    if (metrics.qualityScore < OPERATIONS_AGENT_CONFIG.alertThresholds.qualityDrop * 100) {
      alerts.push({
        type: "quality-decline",
        severity: "critical",
        message: `Quality score ${Math.round(metrics.qualityScore)}% below acceptable threshold`,
        actionRequired: "Immediate quality improvement measures required"
      });
    }
    
    return {
      metrics,
      alerts,
      lastUpdated: Date.now(),
      agentStatus: "active",
      recommendations: alerts.length > 0 ? 
        ["Optimize crew scheduling", "Review equipment allocation", "Enhance quality control"] :
        ["Performance within targets", "Continue current operations"]
    };
  }
});

// Helper Functions
function calculateCrewSynergy(employeeIds: Id<"employees">[]): number {
  // TODO: Implement based on historical collaboration data
  return 1.0 + (employeeIds.length > 2 ? 0.02 * (employeeIds.length - 2) : 0);
}

function determineCrewRole(employee: any, jobRequirements: any): string {
  if (employee.skills?.isaLicenseLevel === "certified") return "crew-leader";
  if (employee.skills?.climbingCertified) return "climber";
  if (employee.skills?.chainsawCertified) return "equipment-operator";
  return "ground-crew";
}

function calculateEstimatedEfficiency(crew: any[], synergy: number): number {
  const avgScore = crew.reduce((sum, member) => sum + member.score, 0) / crew.length;
  return (avgScore / 100) * synergy;
}

function calculateExpectedProgress(job: any, currentTime: number): number {
  const startTime = job.identity.scheduledStartDate;
  const estimatedDuration = (job.scope?.estimatedHours || 8) * 60 * 60 * 1000;
  const elapsed = currentTime - startTime;
  return Math.min(1.0, elapsed / estimatedDuration);
}

function calculateProductivityScore(productivity: any, jobScope: any): number {
  const expectedRate = (jobScope?.estimatedTaskCount || 10) / (jobScope?.estimatedHours || 8);
  const actualRate = productivity.treesCompleted / productivity.hoursWorked;
  return Math.min(100, (actualRate / expectedRate) * 100);
}

function generateProgressRecommendations(efficiency: number, quality: number, progressData: any): string[] {
  const recommendations = [];
  
  if (efficiency < 0.8) {
    recommendations.push("Consider additional crew support");
    recommendations.push("Review task complexity assessment");
  }
  
  if (quality < 80) {
    recommendations.push("Increase supervisor oversight");
    recommendations.push("Review safety protocols");
  }
  
  if (progressData.productivity.equipmentUtilization < 0.7) {
    recommendations.push("Optimize equipment usage");
  }
  
  return recommendations.length > 0 ? recommendations : ["Performance on track"];
}

function assessWeatherImpact(job: any, weather: any) {
  let impactScore = 0;
  
  // Wind impact
  if (weather.windSpeed > 25) impactScore += 3;
  else if (weather.windSpeed > 15) impactScore += 1;
  
  // Temperature impact
  if (weather.temperature < 20 || weather.temperature > 95) impactScore += 2;
  
  // Precipitation impact
  if (weather.precipitation > 0.1) impactScore += 2;
  
  // Visibility impact
  if (weather.visibility < 5) impactScore += 2;
  
  // Alerts
  if (weather.alerts.includes("high-wind")) impactScore += 3;
  if (weather.alerts.includes("severe-weather")) impactScore += 4;
  
  if (impactScore >= 4) {
    return {
      action: "postpone",
      reason: "Severe weather conditions pose safety risks",
      suggestedNewDate: Date.now() + (24 * 60 * 60 * 1000),
      impactScore
    };
  } else if (impactScore >= 2) {
    return {
      action: "modify",
      reason: "Weather conditions require safety precautions",
      suggestedModifications: ["Enhanced safety equipment", "Reduced crew size", "Limited scope"],
      impactScore
    };
  }
  
  return {
    action: "proceed",
    reason: "Weather conditions acceptable for tree work",
    impactScore
  };
}

function categorizeWeatherCondition(weather: any): string {
  if (weather.alerts.length > 0) return "severe";
  if (weather.windSpeed > 20 || weather.precipitation > 0.1) return "challenging";
  if (weather.temperature < 30 || weather.temperature > 90) return "uncomfortable";
  return "favorable";
}

function calculateWorkabilityScore(weather: any): number {
  let score = 100;
  
  if (weather.windSpeed > 25) score -= 40;
  else if (weather.windSpeed > 15) score -= 20;
  
  if (weather.precipitation > 0.1) score -= 30;
  if (weather.temperature < 20 || weather.temperature > 95) score -= 15;
  if (weather.visibility < 5) score -= 20;
  if (weather.alerts.length > 0) score -= 50;
  
  return Math.max(0, score);
}

function generateWeatherRecommendations(weather: any): string[] {
  const recommendations = [];
  
  if (weather.windSpeed > 15) {
    recommendations.push("Use enhanced safety protocols for high winds");
  }
  if (weather.precipitation > 0) {
    recommendations.push("Consider postponement for precipitation");
  }
  if (weather.temperature < 30) {
    recommendations.push("Ensure cold weather gear for crew");
  }
  if (weather.temperature > 90) {
    recommendations.push("Implement heat safety measures");
  }
  
  return recommendations;
}

async function calculateEquipmentUtilization(ctx: any, equipmentId: Id<"equipment">, timeframe: string) {
  // TODO: Implement based on actual usage tracking
  return {
    percentage: 0.75,
    hoursUsed: 30,
    availableHours: 40,
    efficiency: 0.85
  };
}

function generateEquipmentRecommendations(utilization: any): string[] {
  const recommendations = [];
  
  if (utilization.percentage < 0.6) {
    recommendations.push("Consider reallocation to higher-demand jobs");
    recommendations.push("Evaluate rental vs ownership cost-benefit");
  }
  
  if (utilization.efficiency < 0.8) {
    recommendations.push("Schedule maintenance review");
    recommendations.push("Provide operator training");
  }
  
  return recommendations;
}

function calculatePotentialSavings(opportunities: any[]): number {
  // TODO: Implement based on cost per hour and utilization improvements
  return opportunities.length * 1000; // Placeholder
}

// Operations Intelligence Agent Main Interface
export const processOperationsIntelligence = mutation({
  args: {
    message: v.string(),
    context: v.object({
      jobId: v.optional(v.id("jobs")),
      requestType: v.string() // "crew-allocation", "progress-tracking", "weather-adjustment", "utilization"
    })
  },
  handler: async (ctx, args) => {
    const { message, context } = args;
    
    let response = "";
    let data = null;
    
    switch (context.requestType) {
      case "crew-allocation":
        if (context.jobRequirements) {
          data = await optimizeCrewAllocation(ctx, { jobRequirements: context.jobRequirements });
          response = `Optimal crew allocated: ${data.selectedCrew.length} members, ${Math.round(data.crewSynergy * 100)}% synergy, ${data.estimatedEfficiency}% efficiency`;
        }
        break;
        
      case "utilization":
        data = await optimizeEquipmentUtilization(ctx, { timeframe: "weekly" });
        response = `Equipment utilization: ${Math.round(data.averageUtilization * 100)}%, ${data.optimizationOpportunities.length} optimization opportunities`;
        break;
        
      default:
        const performance = await monitorOperationsPerformance(ctx, {});
        response = `Operations Status: ${performance.alerts.length} active alerts. Equipment utilization: ${Math.round(performance.metrics.equipmentUtilization * 100)}%`;
        data = performance;
    }
    
    return {
      agentId: OPERATIONS_AGENT_CONFIG.agentId,
      response,
      data,
      timestamp: Date.now(),
      confidence: 0.95
    };
  }
});