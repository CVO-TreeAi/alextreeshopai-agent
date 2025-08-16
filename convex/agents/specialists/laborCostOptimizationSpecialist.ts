import { v } from "convex/values";
import { mutation, query } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Labor Cost Optimization Specialist (Spec-Level Agent)
 * 
 * Narrow Focus: True labor cost calculation and optimization
 * Supervised by: Financial Intelligence Agent
 * 
 * ROI Promise: 10-20% labor cost optimization while maintaining quality
 * 
 * Key Functions:
 * - Real-time true labor cost calculations using the TreeAI formula
 * - Productivity-based cost adjustments
 * - Crew optimization recommendations
 * - Overtime minimization strategies
 * - Performance-based compensation modeling
 */

// Specialist Configuration
export const LABOR_COST_CONFIG = {
  agentId: "labor-cost-optimization-specialist",
  domain: "True labor cost calculation and optimization",
  targetMetrics: {
    laborCostOptimization: 0.15, // 15% cost optimization
    productivityImprovement: 0.20, // 20% productivity increase
    overtimeReduction: 0.30, // 30% overtime reduction
    accuracyImprovement: 0.95 // 95% cost prediction accuracy
  },
  // TreeAI True Labor Cost Formula Components
  laborCostFormula: {
    baseMultiplier: 2080, // Annual hours
    floridaFactors: {
      workersCompRate: 0.12, // 12% for tree care in Florida
      hurricaneSeasonAdjustment: 0.05, // 5% June-November
      temperatureProductivityAdjustment: {
        under70: 1.0,
        between70and85: 1.05, // Optimal
        between85and95: 0.95, // Heat reduction
        over95: 0.85 // Significant heat impact
      }
    },
    burdenRateComponents: {
      federalTaxes: 0.0765, // FICA
      stateUnemployment: 0.027, // Florida SUTA average
      workersComp: 0.12, // Tree care rate
      healthInsurance: 0.15, // Typical percentage
      benefits: 0.08 // Other benefits
    }
  }
};

// Real-time True Labor Cost Calculation
export const calculateTrueLaborCost = mutation({
  args: {
    employeeData: v.object({
      employeeId: v.id("employees"),
      baseHourlyRate: v.number(),
      yearsExperience: v.number(),
      certifications: v.array(v.string()),
      performanceRating: v.number(), // 0-100
      safetyRecord: v.number(), // 0-100
      position: v.string() // "crew-leader", "climber", "ground-crew"
    }),
    projectContext: v.object({
      treeScore: v.number(),
      complexity: v.string(),
      location: v.object({
        state: v.string(),
        weatherConditions: v.object({
          temperature: v.number(),
          season: v.string()
        })
      }),
      urgency: v.string(),
      estimatedHours: v.number()
    }),
    timeData: v.object({
      regularHours: v.number(),
      overtimeHours: v.number(),
      holidayHours: v.number(),
      weatherDelayHours: v.number(),
      travelHours: v.number()
    })
  },
  handler: async (ctx, args) => {
    const { employeeData, projectContext, timeData } = args;
    
    // Step 1: Calculate annual base wages
    const annualBaseWages = employeeData.baseHourlyRate * LABOR_COST_CONFIG.laborCostFormula.baseMultiplier;
    
    // Step 2: Calculate burden rate
    const burdenRate = calculateTotalBurdenRate(
      employeeData.position,
      projectContext.location.state,
      projectContext.location.weatherConditions.season
    );
    
    // Step 3: Calculate productive hours
    const productiveHours = await calculateAnnualProductiveHours(
      ctx,
      employeeData,
      projectContext.location
    );
    
    // Step 4: Apply TreeAI True Labor Cost Formula
    const trueLaborCost = (annualBaseWages * (1 + burdenRate)) / productiveHours;
    
    // Step 5: Apply real-time adjustments
    const adjustedLaborCost = applyRealTimeAdjustments(
      trueLaborCost,
      employeeData,
      projectContext,
      timeData
    );
    
    // Step 6: Calculate project-specific costs
    const projectCosts = calculateProjectSpecificCosts(
      adjustedLaborCost,
      timeData,
      projectContext
    );
    
    // Step 7: Performance-based adjustments
    const performanceAdjustment = calculatePerformanceAdjustment(
      employeeData.performanceRating,
      employeeData.safetyRecord,
      employeeData.yearsExperience
    );
    
    // Final optimized cost
    const optimizedLaborCost = projectCosts.totalCost * performanceAdjustment.multiplier;
    
    // Store calculation
    const calculationId = await ctx.db.insert("laborCostCalculations", {
      employeeId: employeeData.employeeId,
      projectContext,
      baseCalculation: {
        annualBaseWages,
        burdenRate,
        productiveHours,
        trueLaborCost
      },
      adjustments: {
        realTime: adjustedLaborCost / trueLaborCost,
        performance: performanceAdjustment.multiplier,
        projectSpecific: projectCosts.adjustmentFactor
      },
      finalCosts: {
        trueLaborCostPerHour: adjustedLaborCost,
        optimizedCostPerHour: optimizedLaborCost,
        totalProjectCost: optimizedLaborCost * timeData.regularHours + 
                         (optimizedLaborCost * 1.5 * timeData.overtimeHours) +
                         (optimizedLaborCost * 2.0 * timeData.holidayHours)
      },
      calculatedAt: Date.now(),
      agentVersion: "labor-cost-optimization-v1.0"
    });
    
    return {
      calculationId,
      trueLaborCostPerHour: Math.round(adjustedLaborCost * 100) / 100,
      optimizedLaborCostPerHour: Math.round(optimizedLaborCost * 100) / 100,
      projectTotalCost: Math.round(projectCosts.totalCost * 100) / 100,
      burdenBreakdown: getBurdenBreakdown(burdenRate),
      optimizationOpportunities: identifyOptimizationOpportunities(
        adjustedLaborCost,
        optimizedLaborCost,
        performanceAdjustment,
        timeData
      ),
      costSavingsPotential: (adjustedLaborCost - optimizedLaborCost) * timeData.regularHours
    };
  }
});

// Crew Optimization Analysis
export const optimizeCrewComposition = mutation({
  args: {
    jobRequirements: v.object({
      jobId: v.id("jobs"),
      treeScore: v.number(),
      complexity: v.string(),
      estimatedHours: v.number(),
      requiredSkills: v.array(v.string()),
      safetyRequirements: v.string(),
      budget: v.number()
    }),
    availableCrew: v.array(v.object({
      employeeId: v.id("employees"),
      hourlyRate: v.number(),
      trueLaborCost: v.number(),
      skills: v.array(v.string()),
      experienceLevel: v.number(),
      efficiency: v.number(), // productivity multiplier
      availability: v.boolean()
    }))
  },
  handler: async (ctx, args) => {
    const { jobRequirements, availableCrew } = args;
    
    // Filter available crew
    const eligibleCrew = availableCrew.filter(member => member.availability);
    
    // Calculate crew combinations
    const crewCombinations = generateCrewCombinations(
      eligibleCrew,
      jobRequirements
    );
    
    // Evaluate each combination
    const evaluatedCombinations = [];
    
    for (const combination of crewCombinations) {
      const evaluation = evaluateCrewCombination(
        combination,
        jobRequirements
      );
      evaluatedCombinations.push(evaluation);
    }
    
    // Sort by cost-effectiveness
    evaluatedCombinations.sort((a, b) => b.costEffectiveness - a.costEffectiveness);
    
    // Select optimal crew
    const optimalCrew = evaluatedCombinations[0];
    
    // Calculate savings vs. standard approach
    const standardCost = calculateStandardCrewCost(jobRequirements, eligibleCrew);
    const savings = standardCost - optimalCrew.totalCost;
    
    // Store optimization
    const optimizationId = await ctx.db.insert("crewOptimizations", {
      jobId: jobRequirements.jobId,
      optimalCrew: optimalCrew.crew,
      totalCost: optimalCrew.totalCost,
      estimatedHours: optimalCrew.estimatedHours,
      efficiency: optimalCrew.efficiency,
      skillsCovered: optimalCrew.skillsCovered,
      costSavings: savings,
      alternatives: evaluatedCombinations.slice(1, 4), // Top 3 alternatives
      createdAt: Date.now(),
      agentVersion: "labor-cost-optimization-v1.0"
    });
    
    return {
      optimizationId,
      optimalCrew: optimalCrew.crew.map(member => ({
        employeeId: member.employeeId,
        role: member.role,
        hourlyRate: member.hourlyRate,
        trueLaborCost: member.trueLaborCost,
        efficiency: member.efficiency
      })),
      totalCost: Math.round(optimalCrew.totalCost * 100) / 100,
      estimatedDuration: Math.round(optimalCrew.estimatedHours * 10) / 10,
      costSavings: Math.round(savings * 100) / 100,
      savingsPercentage: Math.round((savings / standardCost) * 100),
      efficiency: Math.round(optimalCrew.efficiency * 100),
      recommendations: generateCrewRecommendations(optimalCrew, jobRequirements)
    };
  }
});

// Overtime Minimization Strategy
export const minimizeOvertimeCosts = mutation({
  args: {
    schedulingData: v.object({
      jobs: v.array(v.object({
        jobId: v.id("jobs"),
        estimatedHours: v.number(),
        priority: v.string(),
        deadline: v.number(),
        crewRequirement: v.number()
      })),
      crewAvailability: v.array(v.object({
        employeeId: v.id("employees"),
        regularHoursAvailable: v.number(),
        overtimeWillingness: v.boolean(),
        efficiency: v.number()
      })),
      timeframe: v.string() // "weekly", "monthly"
    })
  },
  handler: async (ctx, args) => {
    const { schedulingData } = args;
    
    // Analyze current overtime patterns
    const overtimeAnalysis = analyzeOvertimePatterns(schedulingData);
    
    // Generate optimization strategies
    const optimizationStrategies = [
      ...generateSchedulingOptimizations(schedulingData),
      ...generateCrewEfficiencyImprovements(schedulingData),
      ...generateWorkloadBalancing(schedulingData)
    ];
    
    // Calculate potential savings for each strategy
    const strategiesWithSavings = optimizationStrategies.map(strategy => ({
      ...strategy,
      potentialSavings: calculateOvertimeSavings(strategy, overtimeAnalysis),
      implementationDifficulty: assessImplementationDifficulty(strategy),
      roi: calculateStrategyROI(strategy, overtimeAnalysis)
    }));
    
    // Sort by ROI
    strategiesWithSavings.sort((a, b) => b.roi - a.roi);
    
    // Create implementation plan
    const implementationPlan = createOvertimeReductionPlan(strategiesWithSavings);
    
    // Store analysis
    const analysisId = await ctx.db.insert("overtimeOptimizations", {
      currentOvertimeHours: overtimeAnalysis.totalOvertimeHours,
      currentOvertimeCost: overtimeAnalysis.totalOvertimeCost,
      optimizationStrategies: strategiesWithSavings,
      implementationPlan,
      projectedSavings: implementationPlan.totalProjectedSavings,
      timeframe: schedulingData.timeframe,
      createdAt: Date.now(),
      agentVersion: "labor-cost-optimization-v1.0"
    });
    
    return {
      analysisId,
      currentOvertimeCost: Math.round(overtimeAnalysis.totalOvertimeCost * 100) / 100,
      projectedSavings: Math.round(implementationPlan.totalProjectedSavings * 100) / 100,
      savingsPercentage: Math.round((implementationPlan.totalProjectedSavings / overtimeAnalysis.totalOvertimeCost) * 100),
      topStrategies: strategiesWithSavings.slice(0, 5),
      implementationTimeline: implementationPlan.timeline,
      quickWins: strategiesWithSavings.filter(s => s.implementationDifficulty === "low").slice(0, 3)
    };
  }
});

// Performance-based Compensation Modeling
export const modelPerformanceCompensation = mutation({
  args: {
    employeeId: v.id("employees"),
    performanceData: v.object({
      productivity: v.number(), // vs baseline
      quality: v.number(), // quality score 0-100
      safety: v.number(), // safety score 0-100
      customerSatisfaction: v.number(), // 0-100
      teamwork: v.number(), // 0-100
      initiative: v.number() // 0-100
    }),
    currentCompensation: v.object({
      baseHourlyRate: v.number(),
      currentBonuses: v.number(),
      benefits: v.number()
    }),
    modelingParameters: v.object({
      performanceWeight: v.number(), // 0-1
      budgetConstraints: v.object({
        maxIncrease: v.number(),
        totalCompensationBudget: v.number()
      })
    })
  },
  handler: async (ctx, args) => {
    const { employeeId, performanceData, currentCompensation, modelingParameters } = args;
    
    // Calculate composite performance score
    const performanceScore = calculateCompositePerformanceScore(performanceData);
    
    // Model different compensation strategies
    const compensationModels = [
      modelHourlyRateIncrease(performanceScore, currentCompensation, modelingParameters),
      modelBonusStructure(performanceScore, currentCompensation, modelingParameters),
      modelMixedCompensation(performanceScore, currentCompensation, modelingParameters),
      modelEquityParticipation(performanceScore, currentCompensation, modelingParameters)
    ];
    
    // Calculate ROI for each model
    const modelsWithROI = compensationModels.map(model => ({
      ...model,
      roi: calculateCompensationROI(model, performanceData),
      retentionImpact: calculateRetentionImpact(model),
      motivationImpact: calculateMotivationImpact(model, performanceData)
    }));
    
    // Select optimal model
    const optimalModel = selectOptimalCompensationModel(modelsWithROI);
    
    // Store modeling results
    const modelingId = await ctx.db.insert("performanceCompensationModels", {
      employeeId,
      performanceData,
      performanceScore,
      currentCompensation,
      compensationModels: modelsWithROI,
      optimalModel,
      projectedImpact: {
        costIncrease: optimalModel.additionalCost,
        productivityGain: optimalModel.expectedProductivityGain,
        netBenefit: optimalModel.netBenefit
      },
      createdAt: Date.now(),
      agentVersion: "labor-cost-optimization-v1.0"
    });
    
    return {
      modelingId,
      performanceScore: Math.round(performanceScore * 100) / 100,
      recommendedModel: optimalModel.type,
      currentTotalCompensation: currentCompensation.baseHourlyRate + currentCompensation.currentBonuses,
      recommendedTotalCompensation: optimalModel.newTotalCompensation,
      compensationIncrease: Math.round(optimalModel.additionalCost * 100) / 100,
      expectedROI: Math.round(optimalModel.roi * 100) / 100,
      implementationRecommendations: optimalModel.implementationSteps
    };
  }
});

// Labor Cost Analytics and Reporting
export const analyzeLaborCostTrends = query({
  args: {
    timeframe: v.string(), // "monthly", "quarterly", "annual"
    analysisType: v.array(v.string()) // "cost-trends", "productivity", "optimization-opportunities"
  },
  handler: async (ctx, args) => {
    const { timeframe, analysisType } = args;
    
    const analytics = {
      costTrends: {},
      productivityTrends: {},
      optimizationOpportunities: []
    };
    
    // Cost trends analysis
    if (analysisType.includes("cost-trends")) {
      const costCalculations = await ctx.db.query("laborCostCalculations").collect();
      analytics.costTrends = analyzeCostTrends(costCalculations, timeframe);
    }
    
    // Productivity analysis
    if (analysisType.includes("productivity")) {
      const productivityData = await getProductivityData(ctx, timeframe);
      analytics.productivityTrends = analyzeProductivityTrends(productivityData);
    }
    
    // Optimization opportunities
    if (analysisType.includes("optimization-opportunities")) {
      analytics.optimizationOpportunities = await identifySystemwideOptimizations(ctx);
    }
    
    // Generate insights and recommendations
    const insights = generateLaborCostInsights(analytics);
    const recommendations = generateCostOptimizationRecommendations(analytics);
    
    return {
      analytics,
      insights,
      recommendations,
      summary: {
        averageLaborCost: analytics.costTrends.averageCost || 0,
        costTrend: analytics.costTrends.trendDirection || "stable",
        productivityTrend: analytics.productivityTrends.trendDirection || "stable",
        optimizationPotential: analytics.optimizationOpportunities.length || 0
      },
      timeframe,
      generatedAt: Date.now()
    };
  }
});

// Helper Functions

function calculateTotalBurdenRate(position: string, state: string, season: string): number {
  const base = LABOR_COST_CONFIG.laborCostFormula.burdenRateComponents;
  let totalRate = base.federalTaxes + base.stateUnemployment + base.workersComp + 
                  base.healthInsurance + base.benefits;
  
  // Florida-specific adjustments
  if (state === "FL") {
    totalRate += LABOR_COST_CONFIG.laborCostFormula.floridaFactors.workersCompRate;
    
    // Hurricane season adjustment (June-November)
    if (["summer", "fall"].includes(season)) {
      totalRate += LABOR_COST_CONFIG.laborCostFormula.floridaFactors.hurricaneSeasonAdjustment;
    }
  }
  
  // Position-specific adjustments
  const positionMultipliers = {
    "crew-leader": 1.10, // Higher liability
    "climber": 1.05, // Higher risk
    "ground-crew": 1.0
  };
  
  return totalRate * (positionMultipliers[position] || 1.0);
}

async function calculateAnnualProductiveHours(ctx: any, employeeData: any, location: any): Promise<number> {
  const baseHours = 2080; // 40 hours * 52 weeks
  
  // Standard deductions
  let deductions = 0;
  deductions += 80; // PTO (2 weeks)
  deductions += 40; // Sick days
  deductions += 40; // Training
  deductions += 80; // Administrative
  
  // Experience-based adjustments
  const experienceMultiplier = Math.min(1.1, 1.0 + (employeeData.yearsExperience * 0.01));
  
  // Weather adjustments for location
  if (location.state === "FL") {
    deductions += 60; // Hurricane season delays
    deductions += 40; // Heat delays
  }
  
  const productiveHours = (baseHours - deductions) * experienceMultiplier;
  return Math.max(1500, productiveHours); // Minimum threshold
}

function applyRealTimeAdjustments(baseCost: number, employeeData: any, projectContext: any, timeData: any): number {
  let adjustedCost = baseCost;
  
  // Temperature adjustment
  const temp = projectContext.location.weatherConditions.temperature;
  const tempFactors = LABOR_COST_CONFIG.laborCostFormula.floridaFactors.temperatureProductivityAdjustment;
  
  if (temp < 70) adjustedCost *= tempFactors.under70;
  else if (temp <= 85) adjustedCost *= tempFactors.between70and85;
  else if (temp <= 95) adjustedCost *= tempFactors.between85and95;
  else adjustedCost *= tempFactors.over95;
  
  // Complexity adjustment
  const complexityMultipliers = {
    "simple": 0.95,
    "moderate": 1.0,
    "complex": 1.10,
    "extreme": 1.25
  };
  adjustedCost *= complexityMultipliers[projectContext.complexity] || 1.0;
  
  // Urgency adjustment
  const urgencyMultipliers = {
    "routine": 1.0,
    "scheduled": 1.0,
    "urgent": 1.15,
    "emergency": 1.35
  };
  adjustedCost *= urgencyMultipliers[projectContext.urgency] || 1.0;
  
  return adjustedCost;
}

function calculateProjectSpecificCosts(laborCost: number, timeData: any, projectContext: any) {
  // Calculate different hour types
  const regularCost = laborCost * timeData.regularHours;
  const overtimeCost = laborCost * 1.5 * timeData.overtimeHours;
  const holidayCost = laborCost * 2.0 * timeData.holidayHours;
  const travelCost = laborCost * 0.75 * timeData.travelHours; // Reduced rate for travel
  
  const totalCost = regularCost + overtimeCost + holidayCost + travelCost;
  const totalHours = timeData.regularHours + timeData.overtimeHours + 
                    timeData.holidayHours + timeData.travelHours;
  
  return {
    regularCost,
    overtimeCost,
    holidayCost,
    travelCost,
    totalCost,
    adjustmentFactor: totalCost / (laborCost * totalHours)
  };
}

function calculatePerformanceAdjustment(performanceRating: number, safetyRecord: number, experience: number) {
  // Performance factor (0.9 to 1.2)
  const performanceFactor = 0.9 + (performanceRating / 100) * 0.3;
  
  // Safety factor (0.95 to 1.1)
  const safetyFactor = 0.95 + (safetyRecord / 100) * 0.15;
  
  // Experience factor (0.95 to 1.15)
  const experienceFactor = 0.95 + Math.min(0.2, experience * 0.02);
  
  const overallMultiplier = (performanceFactor + safetyFactor + experienceFactor) / 3;
  
  return {
    multiplier: Math.round(overallMultiplier * 1000) / 1000,
    factors: {
      performance: performanceFactor,
      safety: safetyFactor,
      experience: experienceFactor
    }
  };
}

function getBurdenBreakdown(totalBurdenRate: number) {
  const base = LABOR_COST_CONFIG.laborCostFormula.burdenRateComponents;
  return {
    federalTaxes: Math.round((base.federalTaxes / totalBurdenRate) * 100),
    stateUnemployment: Math.round((base.stateUnemployment / totalBurdenRate) * 100),
    workersComp: Math.round((base.workersComp / totalBurdenRate) * 100),
    healthInsurance: Math.round((base.healthInsurance / totalBurdenRate) * 100),
    benefits: Math.round((base.benefits / totalBurdenRate) * 100)
  };
}

function identifyOptimizationOpportunities(baseCost: number, optimizedCost: number, performanceAdj: any, timeData: any) {
  const opportunities = [];
  
  if (timeData.overtimeHours > timeData.regularHours * 0.1) {
    opportunities.push({
      type: "overtime-reduction",
      potential: timeData.overtimeHours * (baseCost * 0.5),
      description: "Reduce overtime through better scheduling"
    });
  }
  
  if (performanceAdj.factors.performance < 0.95) {
    opportunities.push({
      type: "performance-improvement",
      potential: baseCost * timeData.regularHours * 0.1,
      description: "Improve efficiency through training"
    });
  }
  
  if (timeData.travelHours > timeData.regularHours * 0.15) {
    opportunities.push({
      type: "travel-optimization",
      potential: timeData.travelHours * baseCost * 0.25,
      description: "Optimize routing and scheduling"
    });
  }
  
  return opportunities;
}

function generateCrewCombinations(eligibleCrew: any[], jobRequirements: any) {
  const combinations = [];
  const minCrewSize = Math.max(2, Math.ceil(jobRequirements.estimatedHours / 8));
  const maxCrewSize = Math.min(6, eligibleCrew.length);
  
  // Generate combinations of different crew sizes
  for (let size = minCrewSize; size <= maxCrewSize; size++) {
    const sizeCombinations = generateCombinationsOfSize(eligibleCrew, size);
    combinations.push(...sizeCombinations);
  }
  
  return combinations.slice(0, 20); // Limit to top 20 combinations
}

function generateCombinationsOfSize(crew: any[], size: number): any[] {
  if (size === 1) return crew.map(member => [member]);
  if (size > crew.length) return [];
  
  const combinations = [];
  for (let i = 0; i <= crew.length - size; i++) {
    const smallerCombinations = generateCombinationsOfSize(crew.slice(i + 1), size - 1);
    smallerCombinations.forEach(combination => {
      combinations.push([crew[i], ...combination]);
    });
  }
  
  return combinations;
}

function evaluateCrewCombination(crew: any[], jobRequirements: any) {
  const totalCost = crew.reduce((sum, member) => sum + member.trueLaborCost, 0);
  const avgEfficiency = crew.reduce((sum, member) => sum + member.efficiency, 0) / crew.length;
  const estimatedHours = jobRequirements.estimatedHours / avgEfficiency;
  const skillsCovered = new Set(crew.flatMap(member => member.skills));
  const requiredSkillsSet = new Set(jobRequirements.requiredSkills);
  const skillsCoverageRatio = Array.from(requiredSkillsSet).filter(skill => 
    skillsCovered.has(skill)
  ).length / jobRequirements.requiredSkills.length;
  
  const costEffectiveness = (skillsCoverageRatio * avgEfficiency) / (totalCost / 100);
  
  return {
    crew: crew.map(member => ({
      ...member,
      role: determineRole(member, jobRequirements)
    })),
    totalCost: totalCost * estimatedHours,
    estimatedHours,
    efficiency: avgEfficiency,
    skillsCovered: Array.from(skillsCovered),
    skillsCoverageRatio,
    costEffectiveness
  };
}

function determineRole(member: any, jobRequirements: any): string {
  if (member.skills.includes("isa-certified")) return "crew-leader";
  if (member.skills.includes("climbing-certified")) return "climber";
  if (member.skills.includes("equipment-operator")) return "equipment-operator";
  return "ground-crew";
}

function calculateStandardCrewCost(jobRequirements: any, eligibleCrew: any[]): number {
  // Standard approach: use most experienced but expensive crew
  const standardCrew = eligibleCrew
    .sort((a, b) => b.experienceLevel - a.experienceLevel)
    .slice(0, 3); // Standard 3-person crew
  
  const avgCost = standardCrew.reduce((sum, member) => sum + member.trueLaborCost, 0) / standardCrew.length;
  return avgCost * jobRequirements.estimatedHours * standardCrew.length;
}

function generateCrewRecommendations(optimalCrew: any, jobRequirements: any): string[] {
  const recommendations = [];
  
  if (optimalCrew.efficiency > 1.1) {
    recommendations.push("High-efficiency crew selected - monitor performance to maintain standards");
  }
  
  if (optimalCrew.skillsCoverageRatio < 1.0) {
    recommendations.push("Consider additional training for missing skills");
  }
  
  if (optimalCrew.crew.length < 3) {
    recommendations.push("Small crew selected - ensure adequate safety backup");
  }
  
  return recommendations;
}

function analyzeOvertimePatterns(schedulingData: any) {
  const totalOvertimeHours = schedulingData.jobs.reduce((sum: number, job: any) => {
    return sum + Math.max(0, job.estimatedHours - 8); // Hours over 8 per day
  }, 0);
  
  const avgHourlyRate = 35; // Placeholder
  const totalOvertimeCost = totalOvertimeHours * avgHourlyRate * 1.5;
  
  return {
    totalOvertimeHours,
    totalOvertimeCost,
    averageOvertimePerJob: totalOvertimeHours / schedulingData.jobs.length,
    overtimeJobs: schedulingData.jobs.filter((job: any) => job.estimatedHours > 8).length
  };
}

function generateSchedulingOptimizations(schedulingData: any) {
  return [
    {
      type: "job-splitting",
      description: "Split large jobs across multiple days",
      implementation: "redistribute-hours",
      estimatedSavings: 500
    },
    {
      type: "crew-balancing",
      description: "Balance workload across available crew",
      implementation: "reassign-crew",
      estimatedSavings: 300
    }
  ];
}

function generateCrewEfficiencyImprovements(schedulingData: any) {
  return [
    {
      type: "skill-training",
      description: "Cross-train crew members to increase flexibility",
      implementation: "training-program",
      estimatedSavings: 400
    }
  ];
}

function generateWorkloadBalancing(schedulingData: any) {
  return [
    {
      type: "workload-distribution",
      description: "Even distribution of work hours",
      implementation: "schedule-optimization",
      estimatedSavings: 200
    }
  ];
}

function calculateOvertimeSavings(strategy: any, overtimeAnalysis: any): number {
  return strategy.estimatedSavings || 0;
}

function assessImplementationDifficulty(strategy: any): string {
  const difficultyMap = {
    "job-splitting": "medium",
    "crew-balancing": "low",
    "skill-training": "high",
    "workload-distribution": "low"
  };
  return difficultyMap[strategy.type] || "medium";
}

function calculateStrategyROI(strategy: any, overtimeAnalysis: any): number {
  const implementationCost = strategy.type === "skill-training" ? 2000 : 500;
  return (strategy.estimatedSavings - implementationCost) / implementationCost;
}

function createOvertimeReductionPlan(strategies: any[]) {
  const totalProjectedSavings = strategies.reduce((sum, strategy) => sum + strategy.potentialSavings, 0);
  
  return {
    totalProjectedSavings,
    timeline: "3-6 months",
    quickWins: strategies.filter(s => s.implementationDifficulty === "low"),
    phaseImplementation: {
      phase1: strategies.filter(s => s.implementationDifficulty === "low"),
      phase2: strategies.filter(s => s.implementationDifficulty === "medium"),
      phase3: strategies.filter(s => s.implementationDifficulty === "high")
    }
  };
}

function calculateCompositePerformanceScore(performanceData: any): number {
  const weights = {
    productivity: 0.25,
    quality: 0.20,
    safety: 0.25,
    customerSatisfaction: 0.15,
    teamwork: 0.10,
    initiative: 0.05
  };
  
  return Object.entries(weights).reduce((score, [metric, weight]) => {
    return score + (performanceData[metric] * weight);
  }, 0);
}

function modelHourlyRateIncrease(performanceScore: number, currentComp: any, params: any) {
  const increasePercentage = Math.min(params.budgetConstraints.maxIncrease, performanceScore / 500);
  const newHourlyRate = currentComp.baseHourlyRate * (1 + increasePercentage);
  
  return {
    type: "hourly-rate-increase",
    newHourlyRate,
    additionalCost: (newHourlyRate - currentComp.baseHourlyRate) * 2080,
    newTotalCompensation: newHourlyRate + currentComp.currentBonuses,
    expectedProductivityGain: increasePercentage * 0.5
  };
}

function modelBonusStructure(performanceScore: number, currentComp: any, params: any) {
  const bonusAmount = Math.min(params.budgetConstraints.maxIncrease * currentComp.baseHourlyRate * 2080, 
                              performanceScore * 50);
  
  return {
    type: "performance-bonus",
    bonusAmount,
    additionalCost: bonusAmount,
    newTotalCompensation: currentComp.baseHourlyRate + currentComp.currentBonuses + bonusAmount,
    expectedProductivityGain: (bonusAmount / (currentComp.baseHourlyRate * 2080)) * 0.3
  };
}

function modelMixedCompensation(performanceScore: number, currentComp: any, params: any) {
  const rateIncrease = currentComp.baseHourlyRate * 0.05; // 5% rate increase
  const bonus = performanceScore * 25; // Performance bonus
  
  return {
    type: "mixed-compensation",
    newHourlyRate: currentComp.baseHourlyRate + rateIncrease,
    bonusAmount: bonus,
    additionalCost: (rateIncrease * 2080) + bonus,
    newTotalCompensation: currentComp.baseHourlyRate + rateIncrease + currentComp.currentBonuses + bonus,
    expectedProductivityGain: 0.15
  };
}

function modelEquityParticipation(performanceScore: number, currentComp: any, params: any) {
  return {
    type: "equity-participation",
    equityPercentage: performanceScore / 10000, // Small equity stake
    additionalCost: 0, // No immediate cost
    newTotalCompensation: currentComp.baseHourlyRate + currentComp.currentBonuses,
    expectedProductivityGain: 0.25, // High motivation from ownership
    longTermBenefit: true
  };
}

function calculateCompensationROI(model: any, performanceData: any): number {
  const productivityValue = model.expectedProductivityGain * 50000; // Estimated annual value
  return model.additionalCost > 0 ? (productivityValue - model.additionalCost) / model.additionalCost : 10;
}

function calculateRetentionImpact(model: any): number {
  const retentionImpactMap = {
    "hourly-rate-increase": 0.15,
    "performance-bonus": 0.10,
    "mixed-compensation": 0.20,
    "equity-participation": 0.30
  };
  return retentionImpactMap[model.type] || 0.10;
}

function calculateMotivationImpact(model: any, performanceData: any): number {
  const baseMotivation = performanceData.productivity / 100;
  const motivationBoost = {
    "hourly-rate-increase": 0.10,
    "performance-bonus": 0.15,
    "mixed-compensation": 0.12,
    "equity-participation": 0.25
  };
  return baseMotivation * (1 + (motivationBoost[model.type] || 0.10));
}

function selectOptimalCompensationModel(models: any[]) {
  // Select model with highest ROI that meets constraints
  return models.reduce((best, current) => {
    const currentScore = current.roi + current.retentionImpact + current.motivationImpact;
    const bestScore = best.roi + best.retentionImpact + best.motivationImpact;
    return currentScore > bestScore ? current : best;
  });
}

function analyzeCostTrends(calculations: any[], timeframe: string) {
  if (calculations.length === 0) return { averageCost: 0, trendDirection: "stable" };
  
  const avgCost = calculations.reduce((sum, calc) => sum + calc.finalCosts.trueLaborCostPerHour, 0) / calculations.length;
  
  // Simple trend analysis
  const recent = calculations.slice(-10);
  const older = calculations.slice(-20, -10);
  
  const recentAvg = recent.reduce((sum, calc) => sum + calc.finalCosts.trueLaborCostPerHour, 0) / recent.length;
  const olderAvg = older.reduce((sum, calc) => sum + calc.finalCosts.trueLaborCostPerHour, 0) / older.length;
  
  const trendDirection = recentAvg > olderAvg * 1.05 ? "increasing" : 
                        recentAvg < olderAvg * 0.95 ? "decreasing" : "stable";
  
  return { averageCost: avgCost, trendDirection };
}

async function getProductivityData(ctx: any, timeframe: string) {
  // Would fetch actual productivity data
  return [];
}

function analyzeProductivityTrends(productivityData: any[]) {
  return { trendDirection: "stable", averageProductivity: 100 };
}

async function identifySystemwideOptimizations(ctx: any) {
  // Would analyze system-wide optimization opportunities
  return [
    { type: "cross-training", potential: 5000, description: "Cross-train crew for flexibility" },
    { type: "equipment-optimization", potential: 3000, description: "Optimize equipment allocation" }
  ];
}

function generateLaborCostInsights(analytics: any) {
  return [
    "Labor costs trending stable with optimization opportunities identified",
    "Productivity improvements possible through strategic initiatives"
  ];
}

function generateCostOptimizationRecommendations(analytics: any) {
  return [
    "Implement cross-training program to reduce overtime",
    "Optimize crew allocation based on job complexity",
    "Consider performance-based compensation for top performers"
  ];
}

// Labor Cost Optimization Specialist Main Interface
export const processLaborCostOptimization = mutation({
  args: {
    message: v.string(),
    context: v.object({
      requestType: v.string(), // "calculate-cost", "optimize-crew", "minimize-overtime", "compensation-model"
      employeeId: v.optional(v.id("employees")),
      jobId: v.optional(v.id("jobs"))
    })
  },
  handler: async (ctx, args) => {
    const { message, context } = args;
    
    let response = "";
    let data = null;
    
    switch (context.requestType) {
      case "calculate-cost":
        if (context.employeeData && context.projectContext && context.timeData) {
          data = await calculateTrueLaborCost(ctx, {
            employeeData: context.employeeData,
            projectContext: context.projectContext,
            timeData: context.timeData
          });
          response = `True labor cost: $${data.trueLaborCostPerHour}/hour (optimized: $${data.optimizedLaborCostPerHour}/hour). Potential savings: $${Math.round(data.costSavingsPotential)}`;
        }
        break;
        
      case "optimize-crew":
        if (context.jobRequirements && context.availableCrew) {
          data = await optimizeCrewComposition(ctx, {
            jobRequirements: context.jobRequirements,
            availableCrew: context.availableCrew
          });
          response = `Optimal crew: ${data.optimalCrew.length} members, total cost: $${data.totalCost}, savings: ${data.savingsPercentage}%`;
        }
        break;
        
      case "analytics":
        data = await analyzeLaborCostTrends(ctx, {
          timeframe: "monthly",
          analysisType: ["cost-trends", "productivity", "optimization-opportunities"]
        });
        response = `Labor cost analysis: Average $${Math.round(data.summary.averageLaborCost)}/hour, ${data.summary.optimizationPotential} optimization opportunities identified`;
        break;
        
      default:
        response = "Labor Cost Optimization Specialist ready. I can calculate true labor costs, optimize crew composition, minimize overtime, and model performance-based compensation for 10-20% cost optimization.";
    }
    
    return {
      agentId: LABOR_COST_CONFIG.agentId,
      response,
      data,
      timestamp: Date.now(),
      confidence: 0.95
    };
  }
});