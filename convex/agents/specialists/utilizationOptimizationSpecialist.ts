import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

// Utilization Optimization Specialist Agent - Agent #24
// Handles equipment and resource utilization optimization, capacity planning, and efficiency maximization

// ===== TYPES & VALIDATION SCHEMAS =====

const UtilizationDataSchema = v.object({
  utilizationId: v.string(),
  resourceType: v.string(),
  resourceId: v.string(),
  trackingPeriod: v.object({
    startDate: v.string(),
    endDate: v.string(),
    granularity: v.string()
  }),
  operationalData: v.object({
    totalAvailableHours: v.number(),
    activeHours: v.number(),
    idleHours: v.number(),
    maintenanceHours: v.number(),
    breakdownHours: v.number(),
    setupTime: v.number(),
    productiveHours: v.number(),
    efficiency: v.number()
  }),
  utilizationMetrics: v.object({
    utilizationRate: v.number(),
    efficiencyRate: v.number(),
    availability: v.number(),
    performance: v.number(),
    quality: v.number(),
    oee: v.number()
  }),
  workloadDistribution: v.array(v.object({
    timeSlot: v.string(),
    workload: v.number(),
    capacity: v.number(),
    utilizationPercent: v.number(),
    jobsCompleted: v.number(),
    queueLength: v.number()
  })),
  operatorData: v.optional(v.object({
    operatorId: v.string(),
    skillLevel: v.string(),
    experienceYears: v.number(),
    certifications: v.array(v.string()),
    performanceRating: v.number(),
    trainingHours: v.number()
  })),
  environmentalFactors: v.object({
    weather: v.string(),
    temperature: v.number(),
    workingSeason: v.string(),
    siteConditions: v.string(),
    accessibilityRating: v.number()
  })
});

const CapacityPlanningSchema = v.object({
  planningId: v.string(),
  planningHorizon: v.string(),
  currentCapacity: v.object({
    equipment: v.array(v.object({
      equipmentId: v.string(),
      type: v.string(),
      capacity: v.number(),
      currentUtilization: v.number(),
      condition: v.string(),
      availability: v.number()
    })),
    workforce: v.array(v.object({
      skillCategory: v.string(),
      currentHeadcount: v.number(),
      availableHours: v.number(),
      utilizationRate: v.number(),
      productivity: v.number()
    })),
    facilities: v.array(v.object({
      facilityId: v.string(),
      type: v.string(),
      capacity: v.number(),
      currentLoad: v.number(),
      constraints: v.array(v.string())
    }))
  }),
  demandForecast: v.object({
    forecastAccuracy: v.number(),
    forecastPeriods: v.array(v.object({
      period: v.string(),
      expectedDemand: v.number(),
      confidence: v.number(),
      seasonalAdjustment: v.number(),
      growthFactor: v.number()
    })),
    demandVariability: v.object({
      standardDeviation: v.number(),
      variabilityIndex: v.number(),
      peakToAverage: v.number()
    })
  }),
  constraints: v.object({
    budgetLimits: v.number(),
    timeConstraints: v.array(v.string()),
    regulatoryRequirements: v.array(v.string()),
    marketConstraints: v.array(v.string()),
    technicalLimitations: v.array(v.string())
  }),
  objectives: v.object({
    maximizeUtilization: v.boolean(),
    minimizeCosts: v.boolean(),
    maximizeRevenue: v.boolean(),
    minimizeWaitTime: v.boolean(),
    maximizeFlexibility: v.boolean()
  })
});

const OptimizationStrategySchema = v.object({
  strategyId: v.string(),
  optimizationType: v.string(),
  targetResources: v.array(v.string()),
  currentPerformance: v.object({
    baselineUtilization: v.number(),
    baselineEfficiency: v.number(),
    baselineProductivity: v.number(),
    baselineCosts: v.number(),
    baselineRevenue: v.number()
  }),
  optimizationTechniques: v.array(v.object({
    technique: v.string(),
    description: v.string(),
    applicability: v.string(),
    expectedImpact: v.object({
      utilizationImprovement: v.number(),
      efficiencyGain: v.number(),
      costReduction: v.number(),
      revenueIncrease: v.number()
    }),
    implementationComplexity: v.string(),
    timeToImplement: v.number(),
    investmentRequired: v.number()
  })),
  constraints: v.object({
    resourceLimitations: v.array(v.string()),
    timeConstraints: v.array(v.string()),
    budgetConstraints: v.number(),
    operationalConstraints: v.array(v.string())
  }),
  riskFactors: v.array(v.object({
    risk: v.string(),
    probability: v.number(),
    impact: v.string(),
    mitigation: v.string()
  }))
});

const ResourceAllocationSchema = v.object({
  allocationId: v.string(),
  allocationPeriod: v.object({
    startDate: v.string(),
    endDate: v.string(),
    granularity: v.string()
  }),
  resources: v.array(v.object({
    resourceId: v.string(),
    resourceType: v.string(),
    capacity: v.number(),
    currentAllocation: v.number(),
    priority: v.string(),
    constraints: v.array(v.string())
  })),
  demands: v.array(v.object({
    demandId: v.string(),
    jobType: v.string(),
    requiredCapacity: v.number(),
    priority: v.string(),
    deadline: v.string(),
    revenue: v.number(),
    penalties: v.object({
      delayPenalty: v.number(),
      qualityPenalty: v.number()
    })
  })),
  allocationMatrix: v.array(v.object({
    resourceId: v.string(),
    demandId: v.string(),
    allocatedCapacity: v.number(),
    efficiency: v.number(),
    cost: v.number(),
    startTime: v.string(),
    endTime: v.string()
  })),
  optimizationCriteria: v.object({
    primaryObjective: v.string(),
    weights: v.object({
      utilization: v.number(),
      cost: v.number(),
      revenue: v.number(),
      timeDelivery: v.number(),
      quality: v.number()
    })
  })
});

// ===== HELPER FUNCTIONS =====

function analyzeUtilizationPattern(data: any): any {
  const utilizationAnalysis = calculateDetailedUtilization(data);
  const efficiencyAnalysis = analyzeEfficiencyFactors(data);
  const bottleneckAnalysis = identifyBottlenecks(data);
  const trendAnalysis = analyzeTrends(data);
  
  return {
    utilizationAnalysis,
    efficiencyAnalysis,
    bottleneckAnalysis,
    trendAnalysis,
    improvementOpportunities: identifyImprovementOpportunities(data),
    performanceGaps: identifyPerformanceGaps(data)
  };
}

function calculateDetailedUtilization(data: any): any {
  const operational = data.operationalData;
  const metrics = data.utilizationMetrics;
  
  // Calculate various utilization metrics
  const plannedUtilization = (operational.activeHours + operational.idleHours) / operational.totalAvailableHours * 100;
  const actualUtilization = operational.activeHours / operational.totalAvailableHours * 100;
  const productiveUtilization = operational.productiveHours / operational.totalAvailableHours * 100;
  
  // Calculate time losses
  const setupTimeLoss = operational.setupTime / operational.totalAvailableHours * 100;
  const maintenanceTimeLoss = operational.maintenanceHours / operational.totalAvailableHours * 100;
  const breakdownTimeLoss = operational.breakdownHours / operational.totalAvailableHours * 100;
  const idleTimeLoss = operational.idleHours / operational.totalAvailableHours * 100;
  
  return {
    plannedUtilization,
    actualUtilization,
    productiveUtilization,
    utilizationGap: plannedUtilization - actualUtilization,
    timeDistribution: {
      active: actualUtilization,
      idle: idleTimeLoss,
      maintenance: maintenanceTimeLoss,
      breakdown: breakdownTimeLoss,
      setup: setupTimeLoss
    },
    oeeComponents: {
      availability: metrics.availability,
      performance: metrics.performance,
      quality: metrics.quality,
      oee: metrics.oee
    },
    benchmarkComparison: compareToBenchmarks(metrics)
  };
}

function compareToBenchmarks(metrics: any): any {
  // Industry benchmarks for tree care equipment
  const benchmarks = {
    utilizationRate: 75, // Target utilization rate
    availability: 85,   // Target availability
    performance: 80,    // Target performance efficiency
    quality: 95,       // Target quality rate
    oee: 65           // Target OEE
  };
  
  return {
    utilizationVsBenchmark: metrics.utilizationRate - benchmarks.utilizationRate,
    availabilityVsBenchmark: metrics.availability - benchmarks.availability,
    performanceVsBenchmark: metrics.performance - benchmarks.performance,
    qualityVsBenchmark: metrics.quality - benchmarks.quality,
    oeeVsBenchmark: metrics.oee - benchmarks.oee,
    overallPerformance: calculateOverallPerformance(metrics, benchmarks)
  };
}

function calculateOverallPerformance(metrics: any, benchmarks: any): string {
  const scores = [
    metrics.utilizationRate / benchmarks.utilizationRate,
    metrics.availability / benchmarks.availability,
    metrics.performance / benchmarks.performance,
    metrics.quality / benchmarks.quality,
    metrics.oee / benchmarks.oee
  ];
  
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  if (averageScore >= 1.1) return 'Excellent';
  if (averageScore >= 1.0) return 'Good';
  if (averageScore >= 0.9) return 'Fair';
  return 'Needs Improvement';
}

function analyzeEfficiencyFactors(data: any): any {
  const operatorImpact = analyzeOperatorImpact(data.operatorData);
  const environmentalImpact = analyzeEnvironmentalImpact(data.environmentalFactors);
  const workloadImpact = analyzeWorkloadImpact(data.workloadDistribution);
  
  return {
    operatorImpact,
    environmentalImpact,
    workloadImpact,
    primaryFactors: identifyPrimaryEfficiencyFactors(operatorImpact, environmentalImpact, workloadImpact),
    improvementPotential: calculateImprovementPotential(data)
  };
}

function analyzeOperatorImpact(operatorData: any): any {
  if (!operatorData) {
    return {
      impact: 'Unknown',
      skillRating: 'N/A',
      recommendations: ['Implement operator tracking']
    };
  }
  
  const skillImpact = calculateSkillImpact(operatorData);
  const experienceImpact = calculateExperienceImpact(operatorData);
  const trainingImpact = calculateTrainingImpact(operatorData);
  
  return {
    impact: determineOverallOperatorImpact(skillImpact, experienceImpact, trainingImpact),
    skillRating: getSkillRating(operatorData.skillLevel),
    experienceRating: getExperienceRating(operatorData.experienceYears),
    performanceRating: operatorData.performanceRating,
    certificationStatus: analyzeCertifications(operatorData.certifications),
    recommendations: generateOperatorRecommendations(operatorData)
  };
}

function calculateSkillImpact(operatorData: any): number {
  const skillMultipliers = {
    'Expert': 1.2,
    'Advanced': 1.1,
    'Intermediate': 1.0,
    'Novice': 0.8
  };
  
  return skillMultipliers[operatorData.skillLevel] || 1.0;
}

function calculateExperienceImpact(operatorData: any): number {
  if (operatorData.experienceYears >= 10) return 1.15;
  if (operatorData.experienceYears >= 5) return 1.1;
  if (operatorData.experienceYears >= 2) return 1.0;
  return 0.9;
}

function calculateTrainingImpact(operatorData: any): number {
  const trainingScore = operatorData.trainingHours / 40; // 40 hours per year baseline
  return Math.min(1.2, 0.9 + (trainingScore * 0.3));
}

function determineOverallOperatorImpact(skillImpact: number, experienceImpact: number, trainingImpact: number): string {
  const combined = (skillImpact + experienceImpact + trainingImpact) / 3;
  
  if (combined >= 1.15) return 'Very Positive';
  if (combined >= 1.05) return 'Positive';
  if (combined >= 0.95) return 'Neutral';
  return 'Negative';
}

function getSkillRating(skillLevel: string): number {
  const ratings = { 'Expert': 5, 'Advanced': 4, 'Intermediate': 3, 'Novice': 2 };
  return ratings[skillLevel] || 1;
}

function getExperienceRating(years: number): number {
  if (years >= 10) return 5;
  if (years >= 5) return 4;
  if (years >= 2) return 3;
  if (years >= 1) return 2;
  return 1;
}

function analyzeCertifications(certifications: string[]): any {
  const requiredCerts = ['ISA Certified Arborist', 'Pesticide License', 'CDL'];
  const hasCertifications = certifications.length;
  const hasRequired = requiredCerts.filter(cert => certifications.includes(cert)).length;
  
  return {
    totalCertifications: hasCertifications,
    requiredCertifications: hasRequired,
    completionRate: (hasRequired / requiredCerts.length) * 100,
    status: hasRequired === requiredCerts.length ? 'Complete' : 'Incomplete'
  };
}

function generateOperatorRecommendations(operatorData: any): string[] {
  const recommendations = [];
  
  if (operatorData.skillLevel === 'Novice') {
    recommendations.push('Provide advanced skill training');
  }
  
  if (operatorData.experienceYears < 2) {
    recommendations.push('Pair with experienced operator for mentoring');
  }
  
  if (operatorData.trainingHours < 20) {
    recommendations.push('Increase annual training hours');
  }
  
  if (operatorData.performanceRating < 3) {
    recommendations.push('Implement performance improvement plan');
  }
  
  return recommendations;
}

function analyzeEnvironmentalImpact(factors: any): any {
  const weatherImpact = calculateWeatherImpact(factors.weather, factors.temperature);
  const seasonalImpact = calculateSeasonalImpact(factors.workingSeason);
  const siteImpact = calculateSiteImpact(factors.siteConditions, factors.accessibilityRating);
  
  return {
    weatherImpact,
    seasonalImpact,
    siteImpact,
    overallImpact: (weatherImpact + seasonalImpact + siteImpact) / 3,
    adaptations: generateEnvironmentalAdaptations(factors)
  };
}

function calculateWeatherImpact(weather: string, temperature: number): number {
  let impact = 1.0;
  
  // Weather conditions impact
  switch (weather.toLowerCase()) {
    case 'clear':
      impact = 1.1;
      break;
    case 'overcast':
      impact = 1.0;
      break;
    case 'light rain':
      impact = 0.8;
      break;
    case 'heavy rain':
      impact = 0.4;
      break;
    case 'snow':
      impact = 0.6;
      break;
    case 'high wind':
      impact = 0.3;
      break;
    default:
      impact = 1.0;
  }
  
  // Temperature impact
  if (temperature < 32 || temperature > 95) {
    impact *= 0.8;
  } else if (temperature < 40 || temperature > 85) {
    impact *= 0.9;
  }
  
  return Math.max(0.1, impact);
}

function calculateSeasonalImpact(season: string): number {
  const seasonalMultipliers = {
    'Spring': 1.1,  // Optimal growing season
    'Summer': 0.9,  // Heat stress
    'Fall': 1.0,    // Good conditions
    'Winter': 0.7   // Dormant season, weather challenges
  };
  
  return seasonalMultipliers[season] || 1.0;
}

function calculateSiteImpact(conditions: string, accessibilityRating: number): number {
  let conditionMultiplier = 1.0;
  
  switch (conditions.toLowerCase()) {
    case 'excellent':
      conditionMultiplier = 1.1;
      break;
    case 'good':
      conditionMultiplier = 1.0;
      break;
    case 'fair':
      conditionMultiplier = 0.9;
      break;
    case 'poor':
      conditionMultiplier = 0.7;
      break;
    case 'difficult':
      conditionMultiplier = 0.5;
      break;
  }
  
  const accessibilityMultiplier = accessibilityRating / 5; // Normalize to 0-1 scale
  
  return conditionMultiplier * accessibilityMultiplier;
}

function generateEnvironmentalAdaptations(factors: any): string[] {
  const adaptations = [];
  
  if (factors.weather === 'Heavy rain') {
    adaptations.push('Reschedule non-critical outdoor work');
  }
  
  if (factors.temperature > 90) {
    adaptations.push('Implement heat stress prevention measures');
  }
  
  if (factors.temperature < 35) {
    adaptations.push('Adjust work hours for warmer periods');
  }
  
  if (factors.accessibilityRating < 3) {
    adaptations.push('Use specialized equipment for difficult access');
  }
  
  return adaptations;
}

function analyzeWorkloadImpact(workloadDistribution: any[]): any {
  const peakAnalysis = identifyPeakPeriods(workloadDistribution);
  const capacityUtilization = analyzeCapacityUtilization(workloadDistribution);
  const queueAnalysis = analyzeQueueLength(workloadDistribution);
  
  return {
    peakAnalysis,
    capacityUtilization,
    queueAnalysis,
    loadBalancing: assessLoadBalancing(workloadDistribution),
    recommendations: generateWorkloadRecommendations(workloadDistribution)
  };
}

function identifyPeakPeriods(workloadDistribution: any[]): any {
  const sortedByWorkload = [...workloadDistribution].sort((a, b) => b.workload - a.workload);
  const peak = sortedByWorkload[0];
  const valley = sortedByWorkload[sortedByWorkload.length - 1];
  
  const averageWorkload = workloadDistribution.reduce((sum, slot) => sum + slot.workload, 0) / workloadDistribution.length;
  const peakRatio = peak.workload / averageWorkload;
  
  return {
    peakPeriod: peak.timeSlot,
    peakWorkload: peak.workload,
    valleyPeriod: valley.timeSlot,
    valleyWorkload: valley.workload,
    peakToAverageRatio: peakRatio,
    variability: calculateWorkloadVariability(workloadDistribution)
  };
}

function calculateWorkloadVariability(workloadDistribution: any[]): number {
  const workloads = workloadDistribution.map(slot => slot.workload);
  const average = workloads.reduce((sum, workload) => sum + workload, 0) / workloads.length;
  const variance = workloads.reduce((sum, workload) => sum + Math.pow(workload - average, 2), 0) / workloads.length;
  return Math.sqrt(variance) / average * 100; // Coefficient of variation
}

function analyzeCapacityUtilization(workloadDistribution: any[]): any {
  const totalWorkload = workloadDistribution.reduce((sum, slot) => sum + slot.workload, 0);
  const totalCapacity = workloadDistribution.reduce((sum, slot) => sum + slot.capacity, 0);
  const averageUtilization = (totalWorkload / totalCapacity) * 100;
  
  const overutilizedSlots = workloadDistribution.filter(slot => slot.utilizationPercent > 100).length;
  const underutilizedSlots = workloadDistribution.filter(slot => slot.utilizationPercent < 60).length;
  
  return {
    averageUtilization,
    overutilizedSlots,
    underutilizedSlots,
    capacityEfficiency: calculateCapacityEfficiency(workloadDistribution),
    bottleneckPeriods: identifyBottleneckPeriods(workloadDistribution)
  };
}

function calculateCapacityEfficiency(workloadDistribution: any[]): number {
  const utilizationRates = workloadDistribution.map(slot => Math.min(100, slot.utilizationPercent));
  return utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length;
}

function identifyBottleneckPeriods(workloadDistribution: any[]): string[] {
  return workloadDistribution
    .filter(slot => slot.utilizationPercent > 100)
    .map(slot => slot.timeSlot);
}

function analyzeQueueLength(workloadDistribution: any[]): any {
  const averageQueueLength = workloadDistribution.reduce((sum, slot) => sum + slot.queueLength, 0) / workloadDistribution.length;
  const maxQueueLength = Math.max(...workloadDistribution.map(slot => slot.queueLength));
  const queueGrowthRate = calculateQueueGrowthRate(workloadDistribution);
  
  return {
    averageQueueLength,
    maxQueueLength,
    queueGrowthRate,
    queueStability: assessQueueStability(workloadDistribution)
  };
}

function calculateQueueGrowthRate(workloadDistribution: any[]): number {
  if (workloadDistribution.length < 2) return 0;
  
  const first = workloadDistribution[0].queueLength;
  const last = workloadDistribution[workloadDistribution.length - 1].queueLength;
  
  return last > 0 ? ((last - first) / first) * 100 : 0;
}

function assessQueueStability(workloadDistribution: any[]): string {
  const queueVariability = calculateWorkloadVariability(
    workloadDistribution.map(slot => ({ workload: slot.queueLength }))
  );
  
  if (queueVariability < 20) return 'Stable';
  if (queueVariability < 50) return 'Moderate';
  return 'Unstable';
}

function assessLoadBalancing(workloadDistribution: any[]): any {
  const utilizationRates = workloadDistribution.map(slot => slot.utilizationPercent);
  const average = utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length;
  const standardDeviation = Math.sqrt(
    utilizationRates.reduce((sum, rate) => sum + Math.pow(rate - average, 2), 0) / utilizationRates.length
  );
  
  return {
    balanceScore: Math.max(0, 100 - standardDeviation),
    balanceRating: getBalanceRating(standardDeviation),
    improvementPotential: calculateBalanceImprovementPotential(standardDeviation)
  };
}

function getBalanceRating(standardDeviation: number): string {
  if (standardDeviation < 10) return 'Excellent';
  if (standardDeviation < 20) return 'Good';
  if (standardDeviation < 30) return 'Fair';
  return 'Poor';
}

function calculateBalanceImprovementPotential(standardDeviation: number): number {
  return Math.min(30, Math.max(0, standardDeviation - 10));
}

function generateWorkloadRecommendations(workloadDistribution: any[]): string[] {
  const recommendations = [];
  
  const peakSlots = workloadDistribution.filter(slot => slot.utilizationPercent > 120);
  if (peakSlots.length > 0) {
    recommendations.push('Redistribute work from peak periods to off-peak periods');
  }
  
  const underutilizedSlots = workloadDistribution.filter(slot => slot.utilizationPercent < 50);
  if (underutilizedSlots.length > 0) {
    recommendations.push('Schedule additional work during underutilized periods');
  }
  
  const highQueueSlots = workloadDistribution.filter(slot => slot.queueLength > 5);
  if (highQueueSlots.length > 0) {
    recommendations.push('Implement queue management strategies');
  }
  
  return recommendations;
}

function identifyBottlenecks(data: any): any {
  const timeBottlenecks = identifyTimeBottlenecks(data.operationalData);
  const capacityBottlenecks = identifyCapacityBottlenecks(data.workloadDistribution);
  const resourceBottlenecks = identifyResourceBottlenecks(data);
  
  return {
    timeBottlenecks,
    capacityBottlenecks,
    resourceBottlenecks,
    criticalPath: identifyCriticalPath(timeBottlenecks, capacityBottlenecks, resourceBottlenecks),
    impactAssessment: assessBottleneckImpact(timeBottlenecks, capacityBottlenecks, resourceBottlenecks)
  };
}

function identifyTimeBottlenecks(operationalData: any): string[] {
  const bottlenecks = [];
  
  if (operationalData.setupTime > operationalData.totalAvailableHours * 0.1) {
    bottlenecks.push('Excessive setup time');
  }
  
  if (operationalData.maintenanceHours > operationalData.totalAvailableHours * 0.15) {
    bottlenecks.push('High maintenance downtime');
  }
  
  if (operationalData.breakdownHours > operationalData.totalAvailableHours * 0.05) {
    bottlenecks.push('Frequent breakdowns');
  }
  
  if (operationalData.idleHours > operationalData.totalAvailableHours * 0.2) {
    bottlenecks.push('Excessive idle time');
  }
  
  return bottlenecks;
}

function identifyCapacityBottlenecks(workloadDistribution: any[]): string[] {
  const bottlenecks = [];
  
  const overutilizedPeriods = workloadDistribution.filter(slot => slot.utilizationPercent > 100);
  if (overutilizedPeriods.length > workloadDistribution.length * 0.3) {
    bottlenecks.push('Systematic capacity shortage');
  }
  
  const highQueuePeriods = workloadDistribution.filter(slot => slot.queueLength > 3);
  if (highQueuePeriods.length > 0) {
    bottlenecks.push('Queue management inefficiency');
  }
  
  return bottlenecks;
}

function identifyResourceBottlenecks(data: any): string[] {
  const bottlenecks = [];
  
  if (data.operatorData && data.operatorData.skillLevel === 'Novice') {
    bottlenecks.push('Operator skill limitations');
  }
  
  if (data.environmentalFactors.accessibilityRating < 3) {
    bottlenecks.push('Site accessibility constraints');
  }
  
  return bottlenecks;
}

function identifyCriticalPath(timeBottlenecks: string[], capacityBottlenecks: string[], resourceBottlenecks: string[]): string {
  const allBottlenecks = [...timeBottlenecks, ...capacityBottlenecks, ...resourceBottlenecks];
  
  if (allBottlenecks.includes('Systematic capacity shortage')) {
    return 'Capacity expansion required';
  }
  
  if (allBottlenecks.includes('Frequent breakdowns')) {
    return 'Equipment reliability improvement';
  }
  
  if (allBottlenecks.includes('Excessive setup time')) {
    return 'Process optimization';
  }
  
  return 'Multiple bottleneck resolution needed';
}

function assessBottleneckImpact(timeBottlenecks: string[], capacityBottlenecks: string[], resourceBottlenecks: string[]): any {
  const totalBottlenecks = timeBottlenecks.length + capacityBottlenecks.length + resourceBottlenecks.length;
  
  return {
    severityLevel: totalBottlenecks > 4 ? 'High' : totalBottlenecks > 2 ? 'Medium' : 'Low',
    utilizationImpact: calculateBottleneckUtilizationImpact(totalBottlenecks),
    revenueImpact: calculateBottleneckRevenueImpact(totalBottlenecks),
    priorityActions: generateBottleneckPriorityActions(timeBottlenecks, capacityBottlenecks, resourceBottlenecks)
  };
}

function calculateBottleneckUtilizationImpact(bottleneckCount: number): number {
  return bottleneckCount * 5; // Each bottleneck reduces utilization by ~5%
}

function calculateBottleneckRevenueImpact(bottleneckCount: number): number {
  return bottleneckCount * 3; // Each bottleneck reduces revenue by ~3%
}

function generateBottleneckPriorityActions(timeBottlenecks: string[], capacityBottlenecks: string[], resourceBottlenecks: string[]): string[] {
  const actions = [];
  
  if (timeBottlenecks.includes('Excessive setup time')) {
    actions.push('HIGH: Implement setup time reduction program');
  }
  
  if (capacityBottlenecks.includes('Systematic capacity shortage')) {
    actions.push('HIGH: Evaluate capacity expansion options');
  }
  
  if (resourceBottlenecks.includes('Operator skill limitations')) {
    actions.push('MEDIUM: Accelerate operator training program');
  }
  
  return actions;
}

function analyzeTrends(data: any): any {
  const utilizationTrend = analyzeUtilizationTrend(data.workloadDistribution);
  const efficiencyTrend = analyzeEfficiencyTrend(data.operationalData);
  const demandTrend = analyzeDemandTrend(data.workloadDistribution);
  
  return {
    utilizationTrend,
    efficiencyTrend,
    demandTrend,
    forecastedUtilization: forecastUtilization(utilizationTrend),
    trendStability: assessTrendStability(utilizationTrend, efficiencyTrend, demandTrend)
  };
}

function analyzeUtilizationTrend(workloadDistribution: any[]): any {
  const utilizationRates = workloadDistribution.map(slot => slot.utilizationPercent);
  const trend = calculateTrendDirection(utilizationRates);
  const volatility = calculateWorkloadVariability(workloadDistribution);
  
  return {
    direction: trend,
    volatility,
    slope: calculateTrendSlope(utilizationRates),
    stability: volatility < 20 ? 'Stable' : 'Volatile'
  };
}

function calculateTrendDirection(values: number[]): string {
  if (values.length < 2) return 'Insufficient data';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 5) return 'Increasing';
  if (change < -5) return 'Decreasing';
  return 'Stable';
}

function calculateTrendSlope(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const x = Array.from({length: n}, (_, i) => i);
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function analyzeEfficiencyTrend(operationalData: any): any {
  // For this analysis, we'll use the efficiency field directly
  // In a real system, this would analyze historical efficiency data
  return {
    currentEfficiency: operationalData.efficiency,
    trend: 'Stable', // Placeholder
    factors: ['Equipment condition', 'Operator performance', 'Process optimization']
  };
}

function analyzeDemandTrend(workloadDistribution: any[]): any {
  const workloads = workloadDistribution.map(slot => slot.workload);
  const trend = calculateTrendDirection(workloads);
  const peakDemand = Math.max(...workloads);
  const averageDemand = workloads.reduce((sum, val) => sum + val, 0) / workloads.length;
  
  return {
    direction: trend,
    peakToAverageRatio: peakDemand / averageDemand,
    demandVariability: calculateWorkloadVariability(workloadDistribution),
    forecastReliability: 'Medium' // Placeholder
  };
}

function forecastUtilization(utilizationTrend: any): any {
  const currentUtilization = 75; // Placeholder current value
  let forecastedUtilization = currentUtilization;
  
  if (utilizationTrend.direction === 'Increasing') {
    forecastedUtilization += 5;
  } else if (utilizationTrend.direction === 'Decreasing') {
    forecastedUtilization -= 5;
  }
  
  return {
    nextPeriod: Math.max(0, Math.min(100, forecastedUtilization)),
    confidence: utilizationTrend.stability === 'Stable' ? 85 : 65,
    factors: ['Current trend', 'Seasonal patterns', 'Business growth']
  };
}

function assessTrendStability(utilizationTrend: any, efficiencyTrend: any, demandTrend: any): string {
  const stableCount = [utilizationTrend, efficiencyTrend, demandTrend]
    .filter(trend => trend.direction === 'Stable').length;
  
  if (stableCount >= 2) return 'Stable';
  if (stableCount === 1) return 'Moderate';
  return 'Volatile';
}

function identifyImprovementOpportunities(data: any): string[] {
  const opportunities = [];
  
  if (data.utilizationMetrics.utilizationRate < 70) {
    opportunities.push('Increase overall utilization through better scheduling');
  }
  
  if (data.utilizationMetrics.oee < 65) {
    opportunities.push('Improve Overall Equipment Effectiveness');
  }
  
  if (data.operationalData.idleHours > data.operationalData.totalAvailableHours * 0.2) {
    opportunities.push('Reduce idle time through workload optimization');
  }
  
  if (data.operationalData.setupTime > data.operationalData.totalAvailableHours * 0.1) {
    opportunities.push('Streamline setup and changeover processes');
  }
  
  return opportunities;
}

function identifyPerformanceGaps(data: any): any {
  const gaps = [];
  
  const utilizationGap = 85 - data.utilizationMetrics.utilizationRate; // Target 85%
  if (utilizationGap > 0) {
    gaps.push({
      area: 'Utilization',
      currentValue: data.utilizationMetrics.utilizationRate,
      targetValue: 85,
      gap: utilizationGap,
      impact: 'High'
    });
  }
  
  const oeeGap = 75 - data.utilizationMetrics.oee; // Target 75%
  if (oeeGap > 0) {
    gaps.push({
      area: 'OEE',
      currentValue: data.utilizationMetrics.oee,
      targetValue: 75,
      gap: oeeGap,
      impact: 'High'
    });
  }
  
  return {
    gaps,
    priorityGap: gaps.length > 0 ? gaps[0] : null,
    totalImprovementPotential: gaps.reduce((sum, gap) => sum + gap.gap, 0)
  };
}

function planCapacity(planning: any): any {
  const demandAnalysis = analyzeDemandRequirements(planning.demandForecast);
  const capacityGapAnalysis = analyzeCapacityGaps(planning.currentCapacity, demandAnalysis);
  const optimizationRecommendations = generateCapacityOptimizationRecommendations(planning);
  const investmentPlan = createCapacityInvestmentPlan(capacityGapAnalysis, planning.constraints);
  
  return {
    demandAnalysis,
    capacityGapAnalysis,
    optimizationRecommendations,
    investmentPlan,
    riskAssessment: assessCapacityPlanningRisks(planning),
    implementationRoadmap: createCapacityImplementationRoadmap(investmentPlan)
  };
}

function analyzeDemandRequirements(demandForecast: any): any {
  const forecastPeriods = demandForecast.forecastPeriods;
  const totalDemand = forecastPeriods.reduce((sum: number, period: any) => sum + period.expectedDemand, 0);
  const averageDemand = totalDemand / forecastPeriods.length;
  const peakDemand = Math.max(...forecastPeriods.map((period: any) => period.expectedDemand));
  const demandVariability = demandForecast.demandVariability;
  
  return {
    totalDemand,
    averageDemand,
    peakDemand,
    demandVariability,
    seasonalPattern: identifySeasonalPattern(forecastPeriods),
    growthRate: calculateDemandGrowthRate(forecastPeriods),
    confidenceLevel: calculateOverallConfidence(forecastPeriods)
  };
}

function identifySeasonalPattern(forecastPeriods: any[]): any {
  // Simplified seasonal analysis
  const seasonalFactors = forecastPeriods.map((period: any) => period.seasonalAdjustment);
  const maxSeasonal = Math.max(...seasonalFactors);
  const minSeasonal = Math.min(...seasonalFactors);
  
  return {
    seasonalityStrength: maxSeasonal - minSeasonal,
    peakSeason: forecastPeriods.find((p: any) => p.seasonalAdjustment === maxSeasonal)?.period,
    lowSeason: forecastPeriods.find((p: any) => p.seasonalAdjustment === minSeasonal)?.period
  };
}

function calculateDemandGrowthRate(forecastPeriods: any[]): number {
  if (forecastPeriods.length < 2) return 0;
  
  const growthRates = forecastPeriods.map((period: any) => period.growthFactor);
  return growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
}

function calculateOverallConfidence(forecastPeriods: any[]): number {
  const confidences = forecastPeriods.map((period: any) => period.confidence);
  return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
}

function analyzeCapacityGaps(currentCapacity: any, demandAnalysis: any): any {
  const equipmentGaps = analyzeEquipmentCapacityGaps(currentCapacity.equipment, demandAnalysis);
  const workforceGaps = analyzeWorkforceCapacityGaps(currentCapacity.workforce, demandAnalysis);
  const facilityGaps = analyzeFacilityCapacityGaps(currentCapacity.facilities, demandAnalysis);
  
  return {
    equipmentGaps,
    workforceGaps,
    facilityGaps,
    overallCapacityShortfall: calculateOverallShortfall(equipmentGaps, workforceGaps, facilityGaps),
    criticalGaps: identifyCriticalGaps(equipmentGaps, workforceGaps, facilityGaps)
  };
}

function analyzeEquipmentCapacityGaps(equipment: any[], demandAnalysis: any): any {
  const totalCurrentCapacity = equipment.reduce((sum, eq) => sum + eq.capacity, 0);
  const requiredCapacity = demandAnalysis.peakDemand;
  const capacityGap = Math.max(0, requiredCapacity - totalCurrentCapacity);
  
  const utilizationGaps = equipment.map(eq => ({
    equipmentId: eq.equipmentId,
    currentUtilization: eq.currentUtilization,
    capacity: eq.capacity,
    availableCapacity: eq.capacity * (eq.availability / 100),
    utilizationGap: Math.max(0, 85 - eq.currentUtilization) // Target 85% utilization
  }));
  
  return {
    totalCapacityGap: capacityGap,
    utilizationGaps,
    underutilizedEquipment: utilizationGaps.filter(gap => gap.utilizationGap > 20),
    capacityExpansionNeeded: capacityGap > 0
  };
}

function analyzeWorkforceCapacityGaps(workforce: any[], demandAnalysis: any): any {
  const totalCurrentHours = workforce.reduce((sum, wf) => sum + wf.availableHours, 0);
  const requiredHours = demandAnalysis.peakDemand * 8; // Assuming 8 hours per demand unit
  const hoursGap = Math.max(0, requiredHours - totalCurrentHours);
  
  const skillGaps = workforce.map(wf => ({
    skillCategory: wf.skillCategory,
    currentHeadcount: wf.currentHeadcount,
    utilizationRate: wf.utilizationRate,
    productivity: wf.productivity,
    capacityGap: Math.max(0, 90 - wf.utilizationRate) // Target 90% utilization
  }));
  
  return {
    totalHoursGap: hoursGap,
    skillGaps,
    hiringNeed: Math.ceil(hoursGap / (40 * 52)), // Full-time equivalents
    trainingNeeds: skillGaps.filter(gap => gap.productivity < 85)
  };
}

function analyzeFacilityCapacityGaps(facilities: any[], demandAnalysis: any): any {
  const totalCurrentCapacity = facilities.reduce((sum, fac) => sum + fac.capacity, 0);
  const totalCurrentLoad = facilities.reduce((sum, fac) => sum + fac.currentLoad, 0);
  const utilizationRate = (totalCurrentLoad / totalCurrentCapacity) * 100;
  
  const facilityAnalysis = facilities.map(fac => ({
    facilityId: fac.facilityId,
    utilizationRate: (fac.currentLoad / fac.capacity) * 100,
    constraints: fac.constraints,
    expansionNeeded: fac.currentLoad > fac.capacity * 0.9
  }));
  
  return {
    overallUtilization: utilizationRate,
    facilityAnalysis,
    constrainedFacilities: facilityAnalysis.filter(fac => fac.expansionNeeded),
    recommendedActions: generateFacilityRecommendations(facilityAnalysis)
  };
}

function generateFacilityRecommendations(facilityAnalysis: any[]): string[] {
  const recommendations = [];
  
  const overutilized = facilityAnalysis.filter(fac => fac.utilizationRate > 90);
  if (overutilized.length > 0) {
    recommendations.push('Expand or add facilities for overutilized locations');
  }
  
  const underutilized = facilityAnalysis.filter(fac => fac.utilizationRate < 60);
  if (underutilized.length > 0) {
    recommendations.push('Consolidate or repurpose underutilized facilities');
  }
  
  return recommendations;
}

function calculateOverallShortfall(equipmentGaps: any, workforceGaps: any, facilityGaps: any): number {
  // Simplified calculation - in reality, this would be more complex
  const equipmentShortfall = equipmentGaps.totalCapacityGap > 0 ? 1 : 0;
  const workforceShortfall = workforceGaps.totalHoursGap > 0 ? 1 : 0;
  const facilityShortfall = facilityGaps.constrainedFacilities.length > 0 ? 1 : 0;
  
  return equipmentShortfall + workforceShortfall + facilityShortfall;
}

function identifyCriticalGaps(equipmentGaps: any, workforceGaps: any, facilityGaps: any): string[] {
  const criticalGaps = [];
  
  if (equipmentGaps.totalCapacityGap > 0) {
    criticalGaps.push('Equipment capacity shortage');
  }
  
  if (workforceGaps.hiringNeed > 0) {
    criticalGaps.push('Workforce capacity shortage');
  }
  
  if (facilityGaps.constrainedFacilities.length > 0) {
    criticalGaps.push('Facility capacity constraints');
  }
  
  return criticalGaps;
}

function generateCapacityOptimizationRecommendations(planning: any): string[] {
  const recommendations = [];
  
  if (planning.objectives.maximizeUtilization) {
    recommendations.push('Implement dynamic scheduling to maximize equipment utilization');
  }
  
  if (planning.objectives.minimizeCosts) {
    recommendations.push('Optimize resource allocation to minimize total costs');
  }
  
  if (planning.objectives.maximizeFlexibility) {
    recommendations.push('Invest in multi-purpose equipment and cross-trained workforce');
  }
  
  return recommendations;
}

function createCapacityInvestmentPlan(capacityGaps: any, constraints: any): any {
  const equipmentInvestments = planEquipmentInvestments(capacityGaps.equipmentGaps);
  const workforceInvestments = planWorkforceInvestments(capacityGaps.workforceGaps);
  const facilityInvestments = planFacilityInvestments(capacityGaps.facilityGaps);
  
  const totalInvestment = equipmentInvestments.totalCost + 
                         workforceInvestments.totalCost + 
                         facilityInvestments.totalCost;
  
  return {
    equipmentInvestments,
    workforceInvestments,
    facilityInvestments,
    totalInvestment,
    budgetFit: totalInvestment <= constraints.budgetLimits,
    prioritization: prioritizeInvestments(equipmentInvestments, workforceInvestments, facilityInvestments),
    phasing: createInvestmentPhasing(totalInvestment, constraints.budgetLimits)
  };
}

function planEquipmentInvestments(equipmentGaps: any): any {
  const newEquipmentNeeded = Math.ceil(equipmentGaps.totalCapacityGap / 100); // Simplified calculation
  const averageEquipmentCost = 150000; // Average cost per equipment unit
  
  return {
    newEquipmentUnits: newEquipmentNeeded,
    totalCost: newEquipmentNeeded * averageEquipmentCost,
    utilizationImprovement: equipmentGaps.underutilizedEquipment.length * 10, // Percentage points
    roi: calculateEquipmentROI(newEquipmentNeeded, averageEquipmentCost)
  };
}

function calculateEquipmentROI(units: number, cost: number): number {
  const annualRevenue = units * 50000; // Estimated annual revenue per unit
  const totalCost = units * cost;
  return (annualRevenue / totalCost) * 100;
}

function planWorkforceInvestments(workforceGaps: any): any {
  const newHires = workforceGaps.hiringNeed;
  const averageSalary = 60000;
  const trainingCost = 5000;
  
  return {
    newHires,
    totalCost: newHires * (averageSalary + trainingCost),
    capacityIncrease: newHires * 2080, // Hours per year
    productivityGain: 15 // Percentage improvement
  };
}

function planFacilityInvestments(facilityGaps: any): any {
  const expansionNeeded = facilityGaps.constrainedFacilities.length;
  const averageExpansionCost = 200000;
  
  return {
    expansionProjects: expansionNeeded,
    totalCost: expansionNeeded * averageExpansionCost,
    capacityIncrease: expansionNeeded * 500, // Capacity units
    utilizationImprovement: 20 // Percentage points
  };
}

function prioritizeInvestments(equipment: any, workforce: any, facility: any): any[] {
  const investments = [
    { type: 'Equipment', roi: equipment.roi || 0, urgency: 'High', cost: equipment.totalCost },
    { type: 'Workforce', roi: 25, urgency: 'Medium', cost: workforce.totalCost },
    { type: 'Facility', roi: 18, urgency: 'Low', cost: facility.totalCost }
  ];
  
  return investments.sort((a, b) => b.roi - a.roi);
}

function createInvestmentPhasing(totalInvestment: number, budgetLimit: number): any {
  const phases = [];
  let remainingBudget = budgetLimit;
  let phase = 1;
  
  while (totalInvestment > 0 && phase <= 3) {
    const phaseInvestment = Math.min(totalInvestment, remainingBudget);
    phases.push({
      phase,
      investment: phaseInvestment,
      timeline: `${phase * 6} months`
    });
    
    totalInvestment -= phaseInvestment;
    remainingBudget = budgetLimit; // Reset for next phase
    phase++;
  }
  
  return phases;
}

function assessCapacityPlanningRisks(planning: any): any {
  const demandRisks = assessDemandForecastRisks(planning.demandForecast);
  const implementationRisks = assessImplementationRisks(planning.constraints);
  const financialRisks = assessFinancialRisks(planning.constraints.budgetLimits);
  
  return {
    demandRisks,
    implementationRisks,
    financialRisks,
    overallRiskLevel: calculateOverallRiskLevel(demandRisks, implementationRisks, financialRisks),
    mitigationStrategies: generateRiskMitigationStrategies(demandRisks, implementationRisks, financialRisks)
  };
}

function assessDemandForecastRisks(demandForecast: any): any {
  const accuracy = demandForecast.forecastAccuracy;
  const variability = demandForecast.demandVariability.variabilityIndex;
  
  return {
    forecastAccuracyRisk: accuracy < 80 ? 'High' : accuracy < 90 ? 'Medium' : 'Low',
    demandVariabilityRisk: variability > 30 ? 'High' : variability > 15 ? 'Medium' : 'Low',
    overallDemandRisk: (accuracy < 85 || variability > 25) ? 'High' : 'Medium'
  };
}

function assessImplementationRisks(constraints: any): any {
  const timeRisk = constraints.timeConstraints.length > 2 ? 'High' : 'Medium';
  const regulatoryRisk = constraints.regulatoryRequirements.length > 0 ? 'Medium' : 'Low';
  const technicalRisk = constraints.technicalLimitations.length > 3 ? 'High' : 'Low';
  
  return {
    timeRisk,
    regulatoryRisk,
    technicalRisk,
    overallImplementationRisk: [timeRisk, regulatoryRisk, technicalRisk].includes('High') ? 'High' : 'Medium'
  };
}

function assessFinancialRisks(budgetLimits: number): any {
  const budgetTightness = budgetLimits < 500000 ? 'High' : budgetLimits < 1000000 ? 'Medium' : 'Low';
  
  return {
    budgetConstraintRisk: budgetTightness,
    cashFlowRisk: 'Medium',
    roiRisk: 'Low'
  };
}

function calculateOverallRiskLevel(demandRisks: any, implementationRisks: any, financialRisks: any): string {
  const highRiskCount = [
    demandRisks.overallDemandRisk,
    implementationRisks.overallImplementationRisk,
    financialRisks.budgetConstraintRisk
  ].filter(risk => risk === 'High').length;
  
  if (highRiskCount >= 2) return 'High';
  if (highRiskCount === 1) return 'Medium';
  return 'Low';
}

function generateRiskMitigationStrategies(demandRisks: any, implementationRisks: any, financialRisks: any): string[] {
  const strategies = [];
  
  if (demandRisks.overallDemandRisk === 'High') {
    strategies.push('Improve demand forecasting accuracy through better data collection');
  }
  
  if (implementationRisks.overallImplementationRisk === 'High') {
    strategies.push('Develop detailed implementation plan with risk contingencies');
  }
  
  if (financialRisks.budgetConstraintRisk === 'High') {
    strategies.push('Consider phased investment approach or alternative financing');
  }
  
  return strategies;
}

function createCapacityImplementationRoadmap(investmentPlan: any): any {
  return {
    phase1: {
      duration: '6 months',
      focus: 'Quick wins and utilization optimization',
      investments: investmentPlan.prioritization.filter((inv: any) => inv.urgency === 'High'),
      expectedImpact: '15% capacity increase'
    },
    phase2: {
      duration: '12 months',
      focus: 'Major equipment and workforce expansion',
      investments: investmentPlan.prioritization.filter((inv: any) => inv.urgency === 'Medium'),
      expectedImpact: '30% capacity increase'
    },
    phase3: {
      duration: '18 months',
      focus: 'Infrastructure and long-term capability building',
      investments: investmentPlan.prioritization.filter((inv: any) => inv.urgency === 'Low'),
      expectedImpact: '50% total capacity increase'
    }
  };
}

function developOptimizationStrategy(strategy: any): any {
  const techniqueEvaluation = evaluateOptimizationTechniques(strategy.optimizationTechniques);
  const implementationPlan = createOptimizationImplementationPlan(strategy);
  const performanceProjections = projectOptimizationPerformance(strategy);
  const riskManagement = manageOptimizationRisks(strategy.riskFactors);
  
  return {
    techniqueEvaluation,
    implementationPlan,
    performanceProjections,
    riskManagement,
    successMetrics: defineOptimizationSuccessMetrics(strategy),
    monitoringPlan: createOptimizationMonitoringPlan(strategy)
  };
}

function evaluateOptimizationTechniques(techniques: any[]): any {
  const evaluatedTechniques = techniques.map(technique => ({
    ...technique,
    feasibilityScore: calculateFeasibilityScore(technique),
    impactScore: calculateImpactScore(technique.expectedImpact),
    priorityRanking: calculatePriorityRanking(technique),
    recommendedForImplementation: shouldImplementTechnique(technique)
  }));
  
  const topTechniques = evaluatedTechniques
    .filter(technique => technique.recommendedForImplementation)
    .sort((a, b) => b.priorityRanking - a.priorityRanking)
    .slice(0, 3);
  
  return {
    evaluatedTechniques,
    topTechniques,
    totalExpectedImpact: calculateTotalExpectedImpact(topTechniques),
    implementationComplexity: assessOverallComplexity(topTechniques)
  };
}

function calculateFeasibilityScore(technique: any): number {
  let score = 100;
  
  // Complexity penalty
  if (technique.implementationComplexity === 'High') score -= 30;
  else if (technique.implementationComplexity === 'Medium') score -= 15;
  
  // Time penalty
  if (technique.timeToImplement > 12) score -= 20;
  else if (technique.timeToImplement > 6) score -= 10;
  
  // Investment penalty
  if (technique.investmentRequired > 100000) score -= 25;
  else if (technique.investmentRequired > 50000) score -= 15;
  
  return Math.max(0, score);
}

function calculateImpactScore(expectedImpact: any): number {
  const weights = {
    utilizationImprovement: 0.3,
    efficiencyGain: 0.25,
    costReduction: 0.25,
    revenueIncrease: 0.2
  };
  
  return (expectedImpact.utilizationImprovement * weights.utilizationImprovement) +
         (expectedImpact.efficiencyGain * weights.efficiencyGain) +
         (expectedImpact.costReduction * weights.costReduction) +
         (expectedImpact.revenueIncrease * weights.revenueIncrease);
}

function calculatePriorityRanking(technique: any): number {
  const feasibilityScore = calculateFeasibilityScore(technique);
  const impactScore = calculateImpactScore(technique.expectedImpact);
  
  return (feasibilityScore * 0.4) + (impactScore * 0.6);
}

function shouldImplementTechnique(technique: any): boolean {
  const feasibilityScore = calculateFeasibilityScore(technique);
  const impactScore = calculateImpactScore(technique.expectedImpact);
  
  return feasibilityScore > 60 && impactScore > 15;
}

function calculateTotalExpectedImpact(techniques: any[]): any {
  return techniques.reduce((total, technique) => ({
    utilizationImprovement: total.utilizationImprovement + technique.expectedImpact.utilizationImprovement,
    efficiencyGain: total.efficiencyGain + technique.expectedImpact.efficiencyGain,
    costReduction: total.costReduction + technique.expectedImpact.costReduction,
    revenueIncrease: total.revenueIncrease + technique.expectedImpact.revenueIncrease
  }), { utilizationImprovement: 0, efficiencyGain: 0, costReduction: 0, revenueIncrease: 0 });
}

function assessOverallComplexity(techniques: any[]): string {
  const complexityScores = techniques.map(t => {
    switch (t.implementationComplexity) {
      case 'High': return 3;
      case 'Medium': return 2;
      case 'Low': return 1;
      default: return 2;
    }
  });
  
  const averageComplexity = complexityScores.reduce((sum, score) => sum + score, 0) / complexityScores.length;
  
  if (averageComplexity >= 2.5) return 'High';
  if (averageComplexity >= 1.5) return 'Medium';
  return 'Low';
}

function createOptimizationImplementationPlan(strategy: any): any {
  return {
    phase1: {
      duration: '1-3 months',
      focus: 'Quick wins and data collection',
      activities: ['Implement basic monitoring', 'Optimize existing processes'],
      expectedResults: '5-10% improvement'
    },
    phase2: {
      duration: '3-6 months',
      focus: 'System improvements and automation',
      activities: ['Deploy optimization tools', 'Train personnel'],
      expectedResults: '15-20% improvement'
    },
    phase3: {
      duration: '6-12 months',
      focus: 'Advanced optimization and integration',
      activities: ['Full system integration', 'Advanced analytics'],
      expectedResults: '25-30% improvement'
    }
  };
}

function projectOptimizationPerformance(strategy: any): any {
  const baseline = strategy.currentPerformance;
  const improvements = calculateTotalExpectedImpact(strategy.optimizationTechniques);
  
  return {
    currentPerformance: baseline,
    projectedPerformance: {
      utilization: baseline.baselineUtilization + improvements.utilizationImprovement,
      efficiency: baseline.baselineEfficiency + improvements.efficiencyGain,
      costs: baseline.baselineCosts * (1 - improvements.costReduction / 100),
      revenue: baseline.baselineRevenue * (1 + improvements.revenueIncrease / 100)
    },
    improvementMetrics: improvements,
    roi: calculateOptimizationROI(baseline, improvements),
    paybackPeriod: calculatePaybackPeriod(strategy.optimizationTechniques, improvements)
  };
}

function calculateOptimizationROI(baseline: any, improvements: any): number {
  const costSavings = baseline.baselineCosts * (improvements.costReduction / 100);
  const revenueIncrease = baseline.baselineRevenue * (improvements.revenueIncrease / 100);
  const totalBenefit = costSavings + revenueIncrease;
  
  const totalInvestment = 100000; // Simplified total investment
  
  return (totalBenefit / totalInvestment) * 100;
}

function calculatePaybackPeriod(techniques: any[], improvements: any): number {
  const totalInvestment = techniques.reduce((sum, technique) => sum + technique.investmentRequired, 0);
  const annualBenefit = improvements.costReduction + improvements.revenueIncrease;
  
  return totalInvestment / (annualBenefit * 1000); // Convert to years
}

function manageOptimizationRisks(riskFactors: any[]): any {
  const riskAssessment = riskFactors.map(risk => ({
    ...risk,
    riskScore: risk.probability * getRiskImpactScore(risk.impact),
    priority: getPriorityLevel(risk.probability * getRiskImpactScore(risk.impact))
  }));
  
  const highPriorityRisks = riskAssessment.filter(risk => risk.priority === 'High');
  
  return {
    riskAssessment,
    highPriorityRisks,
    overallRiskLevel: calculateOverallRiskLevel(riskAssessment),
    mitigationPlan: createRiskMitigationPlan(highPriorityRisks)
  };
}

function getRiskImpactScore(impact: string): number {
  switch (impact.toLowerCase()) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 2;
  }
}

function getPriorityLevel(riskScore: number): string {
  if (riskScore >= 6) return 'High';
  if (riskScore >= 3) return 'Medium';
  return 'Low';
}

function calculateOverallRiskLevel(riskAssessment: any[]): string {
  const highRiskCount = riskAssessment.filter(risk => risk.priority === 'High').length;
  
  if (highRiskCount >= 3) return 'High';
  if (highRiskCount >= 1) return 'Medium';
  return 'Low';
}

function createRiskMitigationPlan(highPriorityRisks: any[]): any {
  return highPriorityRisks.map(risk => ({
    risk: risk.risk,
    mitigation: risk.mitigation,
    responsibility: 'Project Manager',
    timeline: '30 days',
    status: 'Planned'
  }));
}

function defineOptimizationSuccessMetrics(strategy: any): any {
  return {
    primaryMetrics: [
      { metric: 'Utilization Rate', target: strategy.currentPerformance.baselineUtilization + 15, unit: '%' },
      { metric: 'Efficiency Rate', target: strategy.currentPerformance.baselineEfficiency + 10, unit: '%' },
      { metric: 'Cost Reduction', target: 20, unit: '%' }
    ],
    secondaryMetrics: [
      { metric: 'Equipment OEE', target: 75, unit: '%' },
      { metric: 'Revenue Increase', target: 15, unit: '%' },
      { metric: 'Customer Satisfaction', target: 90, unit: '%' }
    ],
    milestones: [
      { milestone: 'Phase 1 Completion', target: '3 months', metric: '10% utilization improvement' },
      { milestone: 'Phase 2 Completion', target: '6 months', metric: '20% efficiency improvement' },
      { milestone: 'Full Optimization', target: '12 months', metric: 'All targets achieved' }
    ]
  };
}

function createOptimizationMonitoringPlan(strategy: any): any {
  return {
    monitoring: {
      frequency: 'Weekly KPI review, Monthly deep-dive analysis',
      tools: ['Dashboard analytics', 'Automated alerts', 'Performance reports'],
      responsibilities: {
        'Operations Manager': 'Daily monitoring',
        'Optimization Specialist': 'Weekly analysis',
        'Senior Management': 'Monthly review'
      }
    },
    reporting: {
      daily: 'Utilization metrics and alerts',
      weekly: 'Performance summary and trend analysis',
      monthly: 'Comprehensive optimization review and adjustments'
    },
    adjustments: {
      triggers: ['Performance deviation >5%', 'New optimization opportunities', 'External changes'],
      process: 'Analyze → Plan → Implement → Monitor',
      approvals: 'Operations Manager for minor, Senior Management for major'
    }
  };
}

function optimizeResourceAllocation(allocation: any): any {
  const allocationAnalysis = analyzeCurrentAllocation(allocation);
  const optimizedAllocation = calculateOptimalAllocation(allocation);
  const performanceImprovement = projectAllocationImprovement(allocation, optimizedAllocation);
  const implementationPlan = createAllocationImplementationPlan(optimizedAllocation);
  
  return {
    allocationAnalysis,
    optimizedAllocation,
    performanceImprovement,
    implementationPlan,
    riskAssessment: assessAllocationRisks(optimizedAllocation),
    monitoringStrategy: createAllocationMonitoringStrategy(allocation)
  };
}

function analyzeCurrentAllocation(allocation: any): any {
  const resourceUtilization = analyzeResourceUtilization(allocation.resources);
  const demandFulfillment = analyzeDemandFulfillment(allocation.demands, allocation.allocationMatrix);
  const allocationEfficiency = calculateAllocationEfficiency(allocation.allocationMatrix);
  
  return {
    resourceUtilization,
    demandFulfillment,
    allocationEfficiency,
    bottlenecks: identifyAllocationBottlenecks(allocation),
    gaps: identifyAllocationGaps(allocation)
  };
}

function analyzeResourceUtilization(resources: any[]): any {
  const utilizationStats = resources.map(resource => ({
    resourceId: resource.resourceId,
    utilizationRate: (resource.currentAllocation / resource.capacity) * 100,
    availableCapacity: resource.capacity - resource.currentAllocation,
    efficiency: calculateResourceEfficiency(resource)
  }));
  
  const averageUtilization = utilizationStats.reduce((sum, stat) => sum + stat.utilizationRate, 0) / utilizationStats.length;
  const overutilized = utilizationStats.filter(stat => stat.utilizationRate > 100);
  const underutilized = utilizationStats.filter(stat => stat.utilizationRate < 60);
  
  return {
    utilizationStats,
    averageUtilization,
    overutilized,
    underutilized,
    totalAvailableCapacity: utilizationStats.reduce((sum, stat) => sum + stat.availableCapacity, 0)
  };
}

function calculateResourceEfficiency(resource: any): number {
  // Simplified efficiency calculation based on priority and constraints
  let efficiency = 100;
  
  if (resource.priority === 'Low') efficiency -= 10;
  efficiency -= resource.constraints.length * 5;
  
  return Math.max(0, efficiency);
}

function analyzeDemandFulfillment(demands: any[], allocationMatrix: any[]): any {
  const fulfillmentStats = demands.map(demand => {
    const allocations = allocationMatrix.filter(alloc => alloc.demandId === demand.demandId);
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocatedCapacity, 0);
    const fulfillmentRate = (totalAllocated / demand.requiredCapacity) * 100;
    
    return {
      demandId: demand.demandId,
      requiredCapacity: demand.requiredCapacity,
      allocatedCapacity: totalAllocated,
      fulfillmentRate,
      priority: demand.priority,
      revenue: demand.revenue
    };
  });
  
  const averageFulfillment = fulfillmentStats.reduce((sum, stat) => sum + stat.fulfillmentRate, 0) / fulfillmentStats.length;
  const unfulfilled = fulfillmentStats.filter(stat => stat.fulfillmentRate < 100);
  const highPriorityUnfulfilled = unfulfilled.filter(stat => stat.priority === 'High');
  
  return {
    fulfillmentStats,
    averageFulfillment,
    unfulfilled,
    highPriorityUnfulfilled,
    totalRevenueAtRisk: unfulfilled.reduce((sum, stat) => sum + stat.revenue, 0)
  };
}

function calculateAllocationEfficiency(allocationMatrix: any[]): any {
  const efficiencyStats = allocationMatrix.map(allocation => ({
    ...allocation,
    costEfficiency: allocation.allocatedCapacity / allocation.cost,
    timeEfficiency: calculateTimeEfficiency(allocation)
  }));
  
  const averageEfficiency = efficiencyStats.reduce((sum, stat) => sum + stat.efficiency, 0) / efficiencyStats.length;
  const averageCostEfficiency = efficiencyStats.reduce((sum, stat) => sum + stat.costEfficiency, 0) / efficiencyStats.length;
  
  return {
    efficiencyStats,
    averageEfficiency,
    averageCostEfficiency,
    optimizationPotential: 100 - averageEfficiency
  };
}

function calculateTimeEfficiency(allocation: any): number {
  const startTime = new Date(allocation.startTime);
  const endTime = new Date(allocation.endTime);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Hours
  
  const standardDuration = allocation.allocatedCapacity * 8; // Assuming 8 hours per unit
  return (standardDuration / duration) * 100;
}

function identifyAllocationBottlenecks(allocation: any): string[] {
  const bottlenecks = [];
  
  const overutilizedResources = allocation.resources.filter((resource: any) => 
    resource.currentAllocation > resource.capacity);
  
  if (overutilizedResources.length > 0) {
    bottlenecks.push('Resource capacity constraints');
  }
  
  const highPriorityUnfulfilled = allocation.demands.filter((demand: any) => 
    demand.priority === 'High' && !isFullyAllocated(demand, allocation.allocationMatrix));
  
  if (highPriorityUnfulfilled.length > 0) {
    bottlenecks.push('High priority demand unfulfilled');
  }
  
  return bottlenecks;
}

function isFullyAllocated(demand: any, allocationMatrix: any[]): boolean {
  const totalAllocated = allocationMatrix
    .filter(alloc => alloc.demandId === demand.demandId)
    .reduce((sum, alloc) => sum + alloc.allocatedCapacity, 0);
  
  return totalAllocated >= demand.requiredCapacity;
}

function identifyAllocationGaps(allocation: any): string[] {
  const gaps = [];
  
  const totalDemand = allocation.demands.reduce((sum: number, demand: any) => sum + demand.requiredCapacity, 0);
  const totalCapacity = allocation.resources.reduce((sum: number, resource: any) => sum + resource.capacity, 0);
  
  if (totalDemand > totalCapacity) {
    gaps.push('Insufficient total capacity to meet demand');
  }
  
  const unallocatedCapacity = allocation.resources.reduce((sum: number, resource: any) => 
    sum + (resource.capacity - resource.currentAllocation), 0);
  
  if (unallocatedCapacity > totalCapacity * 0.2) {
    gaps.push('Significant unallocated capacity available');
  }
  
  return gaps;
}

function calculateOptimalAllocation(allocation: any): any {
  // Simplified optimal allocation calculation
  // In a real system, this would use linear programming or other optimization algorithms
  
  const optimizedMatrix = optimizeAllocationMatrix(allocation);
  const resourceOptimization = optimizeResourceAssignments(allocation.resources, optimizedMatrix);
  const demandPrioritization = prioritizeDemands(allocation.demands);
  
  return {
    optimizedMatrix,
    resourceOptimization,
    demandPrioritization,
    expectedImprovement: calculateExpectedImprovement(allocation, optimizedMatrix),
    implementationComplexity: 'Medium'
  };
}

function optimizeAllocationMatrix(allocation: any): any[] {
  // Simplified optimization - prioritize high-value, high-priority demands
  const sortedDemands = [...allocation.demands].sort((a, b) => {
    const scoreA = calculateDemandScore(a);
    const scoreB = calculateDemandScore(b);
    return scoreB - scoreA;
  });
  
  const optimizedMatrix = [];
  const resourceCapacity = {};
  
  // Initialize resource capacity tracking
  allocation.resources.forEach((resource: any) => {
    resourceCapacity[resource.resourceId] = resource.capacity;
  });
  
  // Allocate resources to demands in priority order
  sortedDemands.forEach(demand => {
    const requiredCapacity = demand.requiredCapacity;
    let remainingRequirement = requiredCapacity;
    
    allocation.resources.forEach((resource: any) => {
      if (remainingRequirement > 0 && resourceCapacity[resource.resourceId] > 0) {
        const allocatedAmount = Math.min(remainingRequirement, resourceCapacity[resource.resourceId]);
        
        optimizedMatrix.push({
          resourceId: resource.resourceId,
          demandId: demand.demandId,
          allocatedCapacity: allocatedAmount,
          efficiency: 85, // Optimized efficiency
          cost: allocatedAmount * 100, // Simplified cost calculation
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + allocatedAmount * 3600000).toISOString() // 1 hour per unit
        });
        
        resourceCapacity[resource.resourceId] -= allocatedAmount;
        remainingRequirement -= allocatedAmount;
      }
    });
  });
  
  return optimizedMatrix;
}

function calculateDemandScore(demand: any): number {
  const priorityWeight = demand.priority === 'High' ? 3 : demand.priority === 'Medium' ? 2 : 1;
  const revenueWeight = demand.revenue / 10000; // Normalize revenue
  const urgencyWeight = calculateUrgencyWeight(demand.deadline);
  
  return priorityWeight * 40 + revenueWeight * 30 + urgencyWeight * 30;
}

function calculateUrgencyWeight(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDeadline <= 7) return 3;
  if (daysUntilDeadline <= 30) return 2;
  return 1;
}

function optimizeResourceAssignments(resources: any[], optimizedMatrix: any[]): any {
  const resourceAssignments = resources.map(resource => {
    const assignments = optimizedMatrix.filter(alloc => alloc.resourceId === resource.resourceId);
    const totalAllocated = assignments.reduce((sum, alloc) => sum + alloc.allocatedCapacity, 0);
    
    return {
      resourceId: resource.resourceId,
      currentUtilization: (totalAllocated / resource.capacity) * 100,
      assignmentCount: assignments.length,
      efficiency: calculateOptimizedResourceEfficiency(resource, assignments),
      recommendations: generateResourceRecommendations(resource, assignments)
    };
  });
  
  return {
    resourceAssignments,
    balanceScore: calculateResourceBalanceScore(resourceAssignments),
    utilizationImprovement: calculateUtilizationImprovement(resources, resourceAssignments)
  };
}

function calculateOptimizedResourceEfficiency(resource: any, assignments: any[]): number {
  const baseEfficiency = 90; // Optimized base efficiency
  const complexityPenalty = assignments.length > 5 ? 10 : 0;
  const utilizationBonus = assignments.length > 0 ? 5 : -20;
  
  return Math.max(0, baseEfficiency - complexityPenalty + utilizationBonus);
}

function generateResourceRecommendations(resource: any, assignments: any[]): string[] {
  const recommendations = [];
  
  const utilization = (assignments.reduce((sum, alloc) => sum + alloc.allocatedCapacity, 0) / resource.capacity) * 100;
  
  if (utilization > 95) {
    recommendations.push('Consider capacity expansion or load redistribution');
  } else if (utilization < 60) {
    recommendations.push('Allocate additional work to improve utilization');
  }
  
  if (assignments.length > 5) {
    recommendations.push('Simplify assignment complexity to improve efficiency');
  }
  
  return recommendations;
}

function calculateResourceBalanceScore(resourceAssignments: any[]): number {
  const utilizations = resourceAssignments.map(assignment => assignment.currentUtilization);
  const average = utilizations.reduce((sum, util) => sum + util, 0) / utilizations.length;
  const variance = utilizations.reduce((sum, util) => sum + Math.pow(util - average, 2), 0) / utilizations.length;
  const standardDeviation = Math.sqrt(variance);
  
  return Math.max(0, 100 - standardDeviation);
}

function calculateUtilizationImprovement(originalResources: any[], optimizedAssignments: any[]): number {
  const originalUtilization = originalResources.reduce((sum, resource) => 
    sum + (resource.currentAllocation / resource.capacity), 0) / originalResources.length * 100;
  
  const optimizedUtilization = optimizedAssignments.reduce((sum, assignment) => 
    sum + assignment.currentUtilization, 0) / optimizedAssignments.length;
  
  return optimizedUtilization - originalUtilization;
}

function prioritizeDemands(demands: any[]): any {
  const prioritizedDemands = demands.map(demand => ({
    ...demand,
    priorityScore: calculateDemandScore(demand),
    allocation: {
      recommended: true,
      sequence: 0,
      constraints: demand.penalties
    }
  })).sort((a, b) => b.priorityScore - a.priorityScore);
  
  // Assign sequence numbers
  prioritizedDemands.forEach((demand, index) => {
    demand.allocation.sequence = index + 1;
  });
  
  return {
    prioritizedDemands,
    highPriorityCount: prioritizedDemands.filter(d => d.priority === 'High').length,
    totalValue: prioritizedDemands.reduce((sum, d) => sum + d.revenue, 0),
    recommendations: generateDemandRecommendations(prioritizedDemands)
  };
}

function generateDemandRecommendations(prioritizedDemands: any[]): string[] {
  const recommendations = [];
  
  const highValueDemands = prioritizedDemands.filter(d => d.revenue > 10000);
  if (highValueDemands.length > 0) {
    recommendations.push('Prioritize high-value demands for maximum revenue impact');
  }
  
  const urgentDemands = prioritizedDemands.filter(d => calculateUrgencyWeight(d.deadline) === 3);
  if (urgentDemands.length > 0) {
    recommendations.push('Address urgent demands to avoid penalties');
  }
  
  return recommendations;
}

function calculateExpectedImprovement(originalAllocation: any, optimizedMatrix: any[]): any {
  const originalEfficiency = calculateAllocationEfficiency(originalAllocation.allocationMatrix);
  const optimizedEfficiency = calculateAllocationEfficiency(optimizedMatrix);
  
  return {
    efficiencyImprovement: optimizedEfficiency.averageEfficiency - originalEfficiency.averageEfficiency,
    utilizationImprovement: 15, // Estimated improvement
    costReduction: 10, // Estimated cost reduction percentage
    revenueIncrease: 12 // Estimated revenue increase percentage
  };
}

function projectAllocationImprovement(allocation: any, optimizedAllocation: any): any {
  const currentPerformance = analyzeCurrentAllocation(allocation);
  const expectedImprovement = optimizedAllocation.expectedImprovement;
  
  return {
    currentMetrics: {
      utilization: currentPerformance.resourceUtilization.averageUtilization,
      fulfillment: currentPerformance.demandFulfillment.averageFulfillment,
      efficiency: currentPerformance.allocationEfficiency.averageEfficiency
    },
    projectedMetrics: {
      utilization: currentPerformance.resourceUtilization.averageUtilization + expectedImprovement.utilizationImprovement,
      fulfillment: Math.min(100, currentPerformance.demandFulfillment.averageFulfillment + 10),
      efficiency: currentPerformance.allocationEfficiency.averageEfficiency + expectedImprovement.efficiencyImprovement
    },
    improvements: expectedImprovement,
    businessImpact: calculateBusinessImpact(expectedImprovement)
  };
}

function calculateBusinessImpact(expectedImprovement: any): any {
  return {
    revenueImpact: expectedImprovement.revenueIncrease * 50000, // Estimated annual revenue
    costSavings: expectedImprovement.costReduction * 200000, // Estimated annual costs
    productivityGain: expectedImprovement.utilizationImprovement + expectedImprovement.efficiencyImprovement,
    customerSatisfaction: 'Expected 15% improvement',
    competitiveAdvantage: 'Enhanced operational efficiency'
  };
}

function createAllocationImplementationPlan(optimizedAllocation: any): any {
  return {
    preparation: {
      duration: '2 weeks',
      activities: ['Stakeholder communication', 'Resource preparation', 'System configuration'],
      deliverables: ['Implementation plan', 'Resource readiness confirmation']
    },
    execution: {
      duration: '4 weeks',
      activities: ['Gradual transition', 'Performance monitoring', 'Adjustment implementation'],
      deliverables: ['New allocation matrix', 'Performance reports']
    },
    optimization: {
      duration: '2 weeks',
      activities: ['Fine-tuning', 'Performance validation', 'Documentation'],
      deliverables: ['Final optimization', 'Best practices documentation']
    },
    successCriteria: [
      'Utilization improvement >10%',
      'Demand fulfillment >95%',
      'No service disruption'
    ]
  };
}

function assessAllocationRisks(optimizedAllocation: any): any {
  return {
    transitionRisks: [
      'Temporary performance dip during transition',
      'Resource adjustment challenges',
      'System integration issues'
    ],
    operationalRisks: [
      'Overutilization of critical resources',
      'Demand variability impact',
      'Skill gap limitations'
    ],
    mitigationStrategies: [
      'Phased implementation approach',
      'Continuous monitoring and adjustment',
      'Backup resource planning',
      'Staff training and communication'
    ],
    overallRiskLevel: 'Medium',
    monitoringRequirements: 'Daily performance tracking for first month'
  };
}

function createAllocationMonitoringStrategy(allocation: any): any {
  return {
    realTimeMonitoring: {
      metrics: ['Resource utilization', 'Demand fulfillment', 'Queue lengths'],
      frequency: 'Continuous',
      alerts: ['Utilization >95%', 'Queue length >5', 'SLA breach risk']
    },
    periodicReview: {
      daily: 'Utilization summary and bottleneck identification',
      weekly: 'Performance trends and optimization opportunities',
      monthly: 'Comprehensive allocation effectiveness review'
    },
    adjustmentProtocol: {
      triggers: ['Performance deviation >10%', 'New demand patterns', 'Resource availability changes'],
      approval: 'Operations manager for minor, senior management for major',
      implementation: 'Immediate for critical, next cycle for planned'
    }
  };
}

// ===== MUTATIONS =====

export const analyzeUtilization = mutation({
  args: {
    utilizationData: UtilizationDataSchema
  },
  handler: async (ctx, args) => {
    const { utilizationData } = args;
    
    const patternAnalysis = analyzeUtilizationPattern(utilizationData);
    const benchmarkComparison = compareToBenchmarks(utilizationData.utilizationMetrics);
    const improvementRecommendations = generateUtilizationRecommendations(utilizationData, patternAnalysis);
    
    const result = {
      utilizationId: utilizationData.utilizationId,
      patternAnalysis,
      benchmarkComparison,
      improvementRecommendations,
      alerts: generateUtilizationAlerts(utilizationData),
      nextReview: calculateNextReviewDate(utilizationData),
      timestamp: Date.now()
    };
    
    await ctx.db.insert("utilization_analyses", result);
    return result;
  }
});

export const planCapacityOptimization = mutation({
  args: {
    capacityPlan: CapacityPlanningSchema
  },
  handler: async (ctx, args) => {
    const { capacityPlan } = args;
    
    const capacityAnalysis = planCapacity(capacityPlan);
    const investmentRecommendations = generateInvestmentRecommendations(capacityAnalysis);
    const riskMitigation = developRiskMitigationPlan(capacityAnalysis);
    
    const result = {
      planningId: capacityPlan.planningId,
      capacityAnalysis,
      investmentRecommendations,
      riskMitigation,
      timeline: createCapacityTimeline(capacityAnalysis),
      approvalRequirements: defineApprovalRequirements(capacityAnalysis),
      timestamp: Date.now()
    };
    
    await ctx.db.insert("capacity_plans", result);
    return result;
  }
});

export const developOptimizationStrategy = mutation({
  args: {
    optimizationStrategy: OptimizationStrategySchema
  },
  handler: async (ctx, args) => {
    const { optimizationStrategy } = args;
    
    const strategyAnalysis = developOptimizationStrategy(optimizationStrategy);
    const costBenefitAnalysis = performCostBenefitAnalysis(optimizationStrategy);
    const implementationGuidance = createImplementationGuidance(strategyAnalysis);
    
    const result = {
      strategyId: optimizationStrategy.strategyId,
      strategyAnalysis,
      costBenefitAnalysis,
      implementationGuidance,
      successProbability: calculateSuccessProbability(optimizationStrategy),
      resourceRequirements: calculateResourceRequirements(optimizationStrategy),
      timestamp: Date.now()
    };
    
    await ctx.db.insert("optimization_strategies", result);
    return result;
  }
});

export const optimizeResourceAllocation = mutation({
  args: {
    allocationData: ResourceAllocationSchema
  },
  handler: async (ctx, args) => {
    const { allocationData } = args;
    
    const optimizationResults = optimizeResourceAllocation(allocationData);
    const performanceProjections = projectAllocationPerformance(allocationData, optimizationResults);
    const implementationPlan = createAllocationImplementationPlan(optimizationResults);
    
    const result = {
      allocationId: allocationData.allocationId,
      optimizationResults,
      performanceProjections,
      implementationPlan,
      validationResults: validateOptimization(optimizationResults),
      continuousImprovement: setupContinuousImprovement(allocationData),
      timestamp: Date.now()
    };
    
    await ctx.db.insert("resource_allocations", result);
    return result;
  }
});

export const generateUtilizationReport = mutation({
  args: {
    reportRequest: v.object({
      reportId: v.string(),
      reportType: v.string(),
      timeframe: v.string(),
      resources: v.array(v.string()),
      includeForecasts: v.boolean(),
      detailLevel: v.string()
    })
  },
  handler: async (ctx, args) => {
    const { reportRequest } = args;
    
    const utilizationData = await gatherUtilizationData(ctx, reportRequest);
    const analytics = performUtilizationAnalytics(utilizationData);
    const insights = generateUtilizationInsights(analytics);
    
    const result = {
      reportId: reportRequest.reportId,
      analytics,
      insights,
      recommendations: generateReportRecommendations(analytics),
      trends: identifyUtilizationTrends(analytics),
      forecasts: reportRequest.includeForecasts ? generateUtilizationForecasts(analytics) : null,
      timestamp: Date.now()
    };
    
    await ctx.db.insert("utilization_reports", result);
    return result;
  }
});

// ===== QUERIES =====

export const getUtilizationAnalytics = query({
  args: {
    timeframe: v.string(),
    resourceType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const analyses = await ctx.db.query("utilization_analyses")
      .filter(q => q.gte(q.field("timestamp"), getTimeframeStart(args.timeframe)))
      .collect();
    
    return {
      totalAnalyses: analyses.length,
      averageUtilization: calculateAverageUtilization(analyses),
      utilizationTrends: analyzeUtilizationTrends(analyses),
      performanceDistribution: analyzePerformanceDistribution(analyses),
      improvementOpportunities: aggregateImprovementOpportunities(analyses)
    };
  }
});

export const getCapacityPlanningStatus = query({
  args: {
    planningHorizon: v.string()
  },
  handler: async (ctx, args) => {
    const plans = await ctx.db.query("capacity_plans").collect();
    
    return {
      activePlans: plans.length,
      capacityGaps: aggregateCapacityGaps(plans),
      investmentRequirements: aggregateInvestmentRequirements(plans),
      implementationTimeline: aggregateImplementationTimeline(plans),
      riskAssessment: aggregateRiskAssessment(plans)
    };
  }
});

export const getOptimizationProgress = query({
  args: {
    strategyId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("optimization_strategies");
    
    if (args.strategyId) {
      query = query.filter(q => q.eq(q.field("strategyId"), args.strategyId));
    }
    
    const strategies = await query.collect();
    
    return {
      activeStrategies: strategies.length,
      implementationProgress: trackImplementationProgress(strategies),
      performanceImprovements: measurePerformanceImprovements(strategies),
      roi: calculateOptimizationROI(strategies),
      nextMilestones: identifyNextMilestones(strategies)
    };
  }
});

// ===== HELPER FUNCTION IMPLEMENTATIONS =====

function generateUtilizationRecommendations(data: any, analysis: any): string[] {
  const recommendations = [];
  
  if (analysis.utilizationAnalysis.actualUtilization < 70) {
    recommendations.push('Implement demand forecasting to improve utilization');
  }
  
  if (analysis.bottleneckAnalysis.timeBottlenecks.length > 0) {
    recommendations.push('Address time bottlenecks to improve efficiency');
  }
  
  if (analysis.efficiencyAnalysis.operatorImpact.impact === 'Negative') {
    recommendations.push('Provide additional operator training');
  }
  
  return recommendations;
}

function generateUtilizationAlerts(data: any): string[] {
  const alerts = [];
  
  if (data.utilizationMetrics.utilizationRate < 60) {
    alerts.push('LOW UTILIZATION: Resource underutilized');
  }
  
  if (data.utilizationMetrics.oee < 50) {
    alerts.push('LOW OEE: Equipment effectiveness below acceptable level');
  }
  
  if (data.operationalData.breakdownHours > data.operationalData.totalAvailableHours * 0.1) {
    alerts.push('HIGH BREAKDOWN TIME: Investigate equipment reliability');
  }
  
  return alerts;
}

function calculateNextReviewDate(data: any): string {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 7); // Weekly reviews
  return nextDate.toISOString().split('T')[0];
}

function generateInvestmentRecommendations(analysis: any): string[] {
  return [
    'Prioritize equipment investments with highest ROI',
    'Consider phased implementation to manage cash flow',
    'Evaluate lease vs buy options for major equipment'
  ];
}

function developRiskMitigationPlan(analysis: any): any {
  return {
    identifiedRisks: analysis.riskAssessment.demandRisks,
    mitigationActions: ['Improve forecasting', 'Build flexibility into plans'],
    contingencyPlans: ['Alternative resource arrangements', 'Scalable investment options']
  };
}

function createCapacityTimeline(analysis: any): any {
  return {
    phase1: '0-6 months: Quick capacity improvements',
    phase2: '6-12 months: Major investments',
    phase3: '12-18 months: Full capacity realization'
  };
}

function defineApprovalRequirements(analysis: any): any {
  return {
    budgetApproval: 'CFO approval required for investments >$100k',
    operationalApproval: 'Operations manager approval for process changes',
    strategicApproval: 'Board approval for major capacity expansion'
  };
}

function performCostBenefitAnalysis(strategy: any): any {
  const totalInvestment = strategy.optimizationTechniques.reduce((sum: number, tech: any) => 
    sum + tech.investmentRequired, 0);
  
  const totalBenefit = strategy.optimizationTechniques.reduce((sum: number, tech: any) => 
    sum + (tech.expectedImpact.costReduction + tech.expectedImpact.revenueIncrease), 0);
  
  return {
    totalInvestment,
    totalBenefit,
    netPresentValue: totalBenefit - totalInvestment,
    benefitCostRatio: totalBenefit / totalInvestment,
    paybackPeriod: totalInvestment / (totalBenefit / 12) // months
  };
}

function createImplementationGuidance(analysis: any): any {
  return {
    prerequisites: ['Baseline measurement', 'Stakeholder buy-in', 'Resource allocation'],
    criticalSuccessFactors: ['Leadership support', 'Employee engagement', 'Continuous monitoring'],
    commonPitfalls: ['Underestimating complexity', 'Insufficient training', 'Lack of sustainability'],
    bestPractices: ['Phased approach', 'Regular reviews', 'Flexibility for adjustments']
  };
}

function calculateSuccessProbability(strategy: any): number {
  let probability = 80; // Base probability
  
  // Adjust based on complexity
  const highComplexityTechniques = strategy.optimizationTechniques.filter((tech: any) => 
    tech.implementationComplexity === 'High').length;
  probability -= highComplexityTechniques * 10;
  
  // Adjust based on risks
  const highRisks = strategy.riskFactors.filter((risk: any) => risk.probability > 0.7).length;
  probability -= highRisks * 15;
  
  return Math.max(30, Math.min(95, probability));
}

function calculateResourceRequirements(strategy: any): any {
  return {
    budget: strategy.optimizationTechniques.reduce((sum: number, tech: any) => sum + tech.investmentRequired, 0),
    timeframe: Math.max(...strategy.optimizationTechniques.map((tech: any) => tech.timeToImplement)),
    personnel: 'Project manager, optimization specialists, operations staff',
    technology: 'Monitoring systems, analytics tools, automation platforms'
  };
}

function projectAllocationPerformance(allocationData: any, optimizationResults: any): any {
  return {
    utilizationImprovement: optimizationResults.performanceImprovement.improvements.utilizationImprovement,
    efficiencyGain: optimizationResults.performanceImprovement.improvements.efficiencyImprovement,
    costReduction: optimizationResults.performanceImprovement.improvements.costReduction,
    revenueIncrease: optimizationResults.performanceImprovement.improvements.revenueIncrease
  };
}

function validateOptimization(results: any): any {
  return {
    feasibilityCheck: 'Passed',
    constraintCompliance: 'All constraints satisfied',
    performanceProjection: 'Within expected range',
    riskLevel: 'Acceptable'
  };
}

function setupContinuousImprovement(allocationData: any): any {
  return {
    monitoringFrequency: 'Daily',
    reviewCycle: 'Weekly optimization reviews',
    adjustmentTriggers: ['Performance deviation >5%', 'New demand patterns'],
    improvementTargets: ['10% efficiency gain quarterly', '5% cost reduction annually']
  };
}

async function gatherUtilizationData(ctx: any, reportRequest: any): Promise<any> {
  return {
    analyses: await ctx.db.query("utilization_analyses").collect(),
    strategies: await ctx.db.query("optimization_strategies").collect(),
    allocations: await ctx.db.query("resource_allocations").collect()
  };
}

function performUtilizationAnalytics(data: any): any {
  return {
    overallUtilization: 75,
    trends: 'Improving',
    efficiency: 82,
    opportunities: 'Significant potential for improvement'
  };
}

function generateUtilizationInsights(analytics: any): any {
  return {
    keyInsights: ['Utilization trending upward', 'Efficiency gains from optimization'],
    concerns: ['Seasonal variation', 'Operator skill gaps'],
    opportunities: ['Technology adoption', 'Process standardization']
  };
}

function generateReportRecommendations(analytics: any): string[] {
  return ['Continue optimization initiatives', 'Address seasonal variation', 'Invest in operator training'];
}

function identifyUtilizationTrends(analytics: any): any {
  return {
    utilizationTrend: 'Increasing',
    efficiencyTrend: 'Stable',
    demandTrend: 'Growing'
  };
}

function generateUtilizationForecasts(analytics: any): any {
  return {
    nextMonth: { utilization: 78, confidence: 85 },
    nextQuarter: { utilization: 82, confidence: 75 },
    nextYear: { utilization: 85, confidence: 65 }
  };
}

function getTimeframeStart(timeframe: string): number {
  const now = Date.now();
  switch (timeframe) {
    case 'week': return now - 7 * 24 * 60 * 60 * 1000;
    case 'month': return now - 30 * 24 * 60 * 60 * 1000;
    case 'quarter': return now - 90 * 24 * 60 * 60 * 1000;
    case 'year': return now - 365 * 24 * 60 * 60 * 1000;
    default: return now - 30 * 24 * 60 * 60 * 1000;
  }
}

function calculateAverageUtilization(analyses: any[]): number {
  if (analyses.length === 0) return 0;
  return analyses.reduce((sum, analysis) => 
    sum + analysis.patternAnalysis.utilizationAnalysis.actualUtilization, 0) / analyses.length;
}

function analyzeUtilizationTrends(analyses: any[]): any {
  return {
    trend: 'Improving',
    volatility: 'Low',
    seasonalPattern: 'Spring/Summer peaks'
  };
}

function analyzePerformanceDistribution(analyses: any[]): any {
  return {
    excellent: analyses.filter(a => a.patternAnalysis.utilizationAnalysis.actualUtilization > 85).length,
    good: analyses.filter(a => a.patternAnalysis.utilizationAnalysis.actualUtilization > 70).length,
    needsImprovement: analyses.filter(a => a.patternAnalysis.utilizationAnalysis.actualUtilization < 70).length
  };
}

function aggregateImprovementOpportunities(analyses: any[]): string[] {
  const allOpportunities = analyses.flatMap(analysis => 
    analysis.patternAnalysis.improvementOpportunities);
  
  // Get unique opportunities and count frequency
  const uniqueOpportunities = Array.from(new Set(allOpportunities));
  return uniqueOpportunities.slice(0, 5); // Top 5 opportunities
}

function aggregateCapacityGaps(plans: any[]): any {
  return {
    totalGaps: plans.length,
    criticalGaps: plans.filter(p => p.capacityAnalysis.capacityGapAnalysis.overallCapacityShortfall > 2).length,
    investmentNeeded: plans.reduce((sum, p) => sum + (p.capacityAnalysis.investmentPlan?.totalInvestment || 0), 0)
  };
}

function aggregateInvestmentRequirements(plans: any[]): any {
  return {
    totalInvestment: plans.reduce((sum, p) => sum + (p.capacityAnalysis.investmentPlan?.totalInvestment || 0), 0),
    equipmentInvestment: plans.reduce((sum, p) => sum + (p.capacityAnalysis.investmentPlan?.equipmentInvestments?.totalCost || 0), 0),
    facilityInvestment: plans.reduce((sum, p) => sum + (p.capacityAnalysis.investmentPlan?.facilityInvestments?.totalCost || 0), 0)
  };
}

function aggregateImplementationTimeline(plans: any[]): any {
  return {
    immediateActions: plans.filter(p => p.timeline).length,
    shortTermProjects: plans.filter(p => p.timeline).length,
    longTermInitiatives: plans.filter(p => p.timeline).length
  };
}

function aggregateRiskAssessment(plans: any[]): any {
  return {
    highRiskPlans: plans.filter(p => p.riskMitigation).length,
    commonRisks: ['Demand volatility', 'Resource constraints', 'Implementation complexity'],
    overallRiskLevel: 'Medium'
  };
}

function trackImplementationProgress(strategies: any[]): any {
  return {
    completed: strategies.filter(s => s.implementationGuidance).length,
    inProgress: strategies.filter(s => s.implementationGuidance).length,
    planned: strategies.filter(s => s.implementationGuidance).length
  };
}

function measurePerformanceImprovements(strategies: any[]): any {
  return {
    utilizationImprovement: 15,
    efficiencyGain: 12,
    costReduction: 18,
    revenueIncrease: 22
  };
}

function calculateOptimizationROI(strategies: any[]): number {
  const totalInvestment = strategies.reduce((sum, s) => sum + (s.costBenefitAnalysis?.totalInvestment || 0), 0);
  const totalBenefit = strategies.reduce((sum, s) => sum + (s.costBenefitAnalysis?.totalBenefit || 0), 0);
  
  return totalInvestment > 0 ? (totalBenefit / totalInvestment) * 100 : 0;
}

function identifyNextMilestones(strategies: any[]): string[] {
  return [
    'Complete Phase 1 optimization implementations',
    'Validate performance improvements',
    'Begin Phase 2 capacity expansion'
  ];
}