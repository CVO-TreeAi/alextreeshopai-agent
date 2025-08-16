import { v } from "convex/values";
import { mutation, query } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Equipment Intelligence Agent (Core Sub-Level)
 * 
 * Domain: Complete equipment lifecycle management and optimization
 * Responsibilities:
 * - Equipment utilization tracking and optimization
 * - Predictive maintenance scheduling
 * - ROI analysis and replacement recommendations
 * - Operational efficiency monitoring
 * - Cost per hour optimization
 * 
 * Specialist Agents Supervised:
 * - Maintenance Prediction Specialist
 * - Utilization Optimization Specialist
 * - Depreciation Analysis Specialist
 * - Vendor Management Specialist
 */

// Core Agent Configuration
export const EQUIPMENT_AGENT_CONFIG = {
  agentId: "equipment-intelligence-core",
  domain: "Complete equipment lifecycle management and optimization",
  targetMetrics: {
    utilizationRate: 0.85, // 85% target utilization
    maintenanceCostReduction: 0.20, // 20% reduction
    downtimeReduction: 0.30, // 30% reduction
    fuelEfficiencyImprovement: 0.15 // 15% improvement
  },
  alertThresholds: {
    criticalUtilization: 0.60, // Alert if utilization <60%
    highMaintenanceCost: 0.25, // Alert if maintenance >25% of operating cost
    excessiveDowntime: 0.15, // Alert if downtime >15%
    maintenanceOverdue: 7 // Alert if maintenance overdue >7 days
  }
};

// Equipment Utilization Analysis
export const analyzeEquipmentUtilization = mutation({
  args: {
    analysisScope: v.object({
      equipmentId: v.optional(v.id("equipment")),
      equipmentType: v.optional(v.string()),
      timeframe: v.string(), // "daily", "weekly", "monthly", "quarterly"
      includeDowntime: v.boolean()
    })
  },
  handler: async (ctx, args) => {
    const { analysisScope } = args;
    
    // Get equipment data
    let equipment;
    if (analysisScope.equipmentId) {
      const item = await ctx.db.get(analysisScope.equipmentId);
      equipment = item ? [item] : [];
    } else {
      equipment = await ctx.db.query("equipment").collect();
      if (analysisScope.equipmentType) {
        equipment = equipment.filter(item => 
          item.identity.equipmentType === analysisScope.equipmentType
        );
      }
    }
    
    if (equipment.length === 0) {
      return {
        message: "No equipment found for the specified criteria",
        utilizationData: null
      };
    }
    
    // Calculate timeframe parameters
    const now = Date.now();
    const timeframeDays = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      quarterly: 90
    };
    const daysBack = timeframeDays[analysisScope.timeframe] || 30;
    const startDate = now - (daysBack * 24 * 60 * 60 * 1000);
    
    // Analyze each piece of equipment
    const utilizationAnalysis = [];
    
    for (const item of equipment) {
      // Get job assignments for this equipment
      const jobs = await ctx.db
        .query("jobs")
        .filter((q) => {
          // TODO: Add equipment assignment tracking
          return q.gte(q.field("identity.actualStartDate"), startDate) ||
                 q.gte(q.field("identity.scheduledStartDate"), startDate);
        })
        .collect();
      
      // Calculate utilization metrics
      const utilizationData = calculateEquipmentUtilizationMetrics(
        item, 
        jobs, 
        startDate, 
        now, 
        analysisScope.includeDowntime
      );
      
      // Get maintenance records
      const maintenanceRecords = await getMaintenanceRecords(ctx, item._id, startDate);
      
      // Calculate efficiency metrics
      const efficiencyMetrics = calculateEfficiencyMetrics(item, utilizationData, maintenanceRecords);
      
      // Identify optimization opportunities
      const optimizations = identifyUtilizationOptimizations(utilizationData, efficiencyMetrics);
      
      utilizationAnalysis.push({
        equipmentId: item._id,
        identity: {
          type: item.identity.equipmentType,
          make: item.identity.make,
          model: item.identity.model,
          year: item.identity.year,
          serialNumber: item.identity.serialNumber
        },
        utilization: {
          hoursUsed: utilizationData.hoursUsed,
          availableHours: utilizationData.availableHours,
          utilizationRate: utilizationData.utilizationRate,
          downtimeHours: utilizationData.downtimeHours,
          downtimeRate: utilizationData.downtimeRate
        },
        efficiency: efficiencyMetrics,
        maintenance: {
          recordCount: maintenanceRecords.length,
          totalCost: maintenanceRecords.reduce((sum, record) => sum + record.cost, 0),
          averageCost: maintenanceRecords.length > 0 ? 
            maintenanceRecords.reduce((sum, record) => sum + record.cost, 0) / maintenanceRecords.length : 0,
          lastMaintenance: maintenanceRecords.length > 0 ? 
            Math.max(...maintenanceRecords.map(record => record.date)) : 0
        },
        optimizations,
        alerts: generateEquipmentAlerts(item, utilizationData, efficiencyMetrics)
      });
    }
    
    // Calculate aggregate metrics
    const aggregateMetrics = calculateAggregateUtilization(utilizationAnalysis);
    
    // Store analysis
    const analysisId = await ctx.db.insert("equipmentUtilizationAnalyses", {
      analysisScope,
      equipmentCount: equipment.length,
      aggregateMetrics,
      equipmentAnalysis: utilizationAnalysis,
      createdAt: Date.now(),
      agentVersion: "equipment-intelligence-v1.0"
    });
    
    return {
      analysisId,
      summary: {
        equipmentCount: equipment.length,
        averageUtilization: Math.round(aggregateMetrics.averageUtilization * 100),
        totalDowntime: Math.round(aggregateMetrics.totalDowntimeHours),
        utilizationTarget: Math.round(EQUIPMENT_AGENT_CONFIG.targetMetrics.utilizationRate * 100),
        performanceStatus: aggregateMetrics.averageUtilization >= EQUIPMENT_AGENT_CONFIG.targetMetrics.utilizationRate ? 
          "meeting-target" : "below-target"
      },
      equipmentAnalysis: utilizationAnalysis.map(analysis => ({
        equipmentId: analysis.equipmentId,
        type: analysis.identity.type,
        make: analysis.identity.make,
        model: analysis.identity.model,
        utilizationRate: Math.round(analysis.utilization.utilizationRate * 100),
        status: analysis.utilization.utilizationRate >= EQUIPMENT_AGENT_CONFIG.targetMetrics.utilizationRate ? 
          "optimal" : "underutilized",
        recommendations: analysis.optimizations.slice(0, 3)
      })),
      topOptimizations: aggregateMetrics.topOptimizations,
      alerts: utilizationAnalysis.flatMap(analysis => analysis.alerts)
    };
  }
});

// Predictive Maintenance Scheduling
export const schedulePredictiveMaintenance = mutation({
  args: {
    equipmentId: v.id("equipment"),
    predictionHorizon: v.number() // days to look ahead
  },
  handler: async (ctx, args) => {
    const { equipmentId, predictionHorizon } = args;
    
    // Get equipment details
    const equipment = await ctx.db.get(equipmentId);
    if (!equipment) throw new Error("Equipment not found");
    
    // Get maintenance history
    const maintenanceHistory = await getMaintenanceRecords(ctx, equipmentId, 0);
    
    // Get usage data
    const usageData = await getEquipmentUsageData(ctx, equipmentId);
    
    // Calculate maintenance predictions
    const predictions = calculateMaintenancePredictions(
      equipment,
      maintenanceHistory,
      usageData,
      predictionHorizon
    );
    
    // Generate maintenance schedule
    const maintenanceSchedule = generateOptimalMaintenanceSchedule(
      equipment,
      predictions,
      predictionHorizon
    );
    
    // Calculate cost-benefit analysis
    const costBenefit = calculateMaintenanceCostBenefit(
      equipment,
      maintenanceSchedule,
      predictions
    );
    
    // Store maintenance prediction
    const predictionId = await ctx.db.insert("maintenancePredictions", {
      equipmentId,
      predictionHorizon,
      predictions,
      maintenanceSchedule,
      costBenefit,
      confidence: predictions.confidence,
      createdAt: Date.now(),
      agentVersion: "equipment-intelligence-v1.0"
    });
    
    return {
      predictionId,
      equipment: {
        id: equipment._id,
        type: equipment.identity.equipmentType,
        make: equipment.identity.make,
        model: equipment.identity.model
      },
      predictions: {
        nextMaintenanceDate: predictions.nextMaintenanceDate,
        maintenanceType: predictions.maintenanceType,
        confidence: Math.round(predictions.confidence * 100),
        riskLevel: predictions.riskLevel
      },
      schedule: maintenanceSchedule.map(item => ({
        date: item.date,
        type: item.type,
        estimatedCost: Math.round(item.estimatedCost),
        priority: item.priority,
        description: item.description
      })),
      costBenefit: {
        preventiveCost: Math.round(costBenefit.preventiveCost),
        reactiveRisk: Math.round(costBenefit.reactiveRisk),
        savings: Math.round(costBenefit.savings),
        roi: Math.round(costBenefit.roi * 100)
      },
      recommendations: generateMaintenanceRecommendations(predictions, costBenefit)
    };
  }
});

// Equipment ROI Analysis
export const analyzeEquipmentROI = query({
  args: {
    equipmentId: v.id("equipment"),
    analysisTimeframe: v.string() // "annual", "lifetime", "custom"
  },
  handler: async (ctx, args) => {
    const { equipmentId, analysisTimeframe } = args;
    
    // Get equipment details
    const equipment = await ctx.db.get(equipmentId);
    if (!equipment) throw new Error("Equipment not found");
    
    // Calculate acquisition cost
    const acquisitionCost = equipment.finance?.acquisitionCost || 0;
    const acquisitionDate = equipment.identity.acquisitionDate || Date.now();
    
    // Get operating data
    const operatingData = await getEquipmentOperatingData(ctx, equipmentId, analysisTimeframe);
    
    // Calculate revenue attribution
    const revenueAttribution = calculateEquipmentRevenueAttribution(
      equipment,
      operatingData.jobAssignments,
      operatingData.utilizationHours
    );
    
    // Calculate total costs
    const totalCosts = calculateEquipmentTotalCosts(
      equipment,
      operatingData.maintenanceRecords,
      operatingData.operatingHours,
      analysisTimeframe
    );
    
    // Calculate depreciation
    const depreciation = calculateEquipmentDepreciation(
      equipment,
      acquisitionDate,
      analysisTimeframe
    );
    
    // Calculate ROI metrics
    const roiMetrics = {
      totalRevenue: revenueAttribution.totalRevenue,
      totalCosts: totalCosts.total,
      grossProfit: revenueAttribution.totalRevenue - totalCosts.total,
      netProfit: revenueAttribution.totalRevenue - totalCosts.total - depreciation.annualDepreciation,
      roi: acquisitionCost > 0 ? 
        ((revenueAttribution.totalRevenue - totalCosts.total) / acquisitionCost) : 0,
      paybackPeriod: calculatePaybackPeriod(acquisitionCost, revenueAttribution.annualRevenue - totalCosts.annual),
      currentValue: acquisitionCost - depreciation.accumulatedDepreciation
    };
    
    // Calculate performance benchmarks
    const benchmarks = getEquipmentBenchmarks(equipment.identity.equipmentType);
    
    // Generate recommendations
    const recommendations = generateROIRecommendations(
      equipment,
      roiMetrics,
      benchmarks,
      operatingData
    );
    
    return {
      equipment: {
        id: equipment._id,
        type: equipment.identity.equipmentType,
        make: equipment.identity.make,
        model: equipment.identity.model,
        age: Math.floor((Date.now() - acquisitionDate) / (365 * 24 * 60 * 60 * 1000))
      },
      financial: {
        acquisitionCost: Math.round(acquisitionCost),
        currentValue: Math.round(roiMetrics.currentValue),
        totalRevenue: Math.round(roiMetrics.totalRevenue),
        totalCosts: Math.round(roiMetrics.totalCosts),
        netProfit: Math.round(roiMetrics.netProfit),
        roi: Math.round(roiMetrics.roi * 100),
        paybackPeriod: roiMetrics.paybackPeriod
      },
      performance: {
        utilizationRate: operatingData.utilizationRate,
        hoursPerYear: operatingData.annualHours,
        revenuePerHour: operatingData.utilizationHours > 0 ? 
          Math.round(revenueAttribution.totalRevenue / operatingData.utilizationHours) : 0,
        costPerHour: operatingData.operatingHours > 0 ? 
          Math.round(totalCosts.total / operatingData.operatingHours) : 0
      },
      benchmarks: {
        industryROI: benchmarks.averageROI,
        industryUtilization: benchmarks.averageUtilization,
        performanceRating: roiMetrics.roi > benchmarks.averageROI ? "above-average" : "below-average"
      },
      recommendations,
      analysisTimeframe
    };
  }
});

// Equipment Replacement Analysis
export const analyzeEquipmentReplacement = mutation({
  args: {
    equipmentId: v.id("equipment"),
    replacementOptions: v.array(v.object({
      make: v.string(),
      model: v.string(),
      cost: v.number(),
      specifications: v.any()
    }))
  },
  handler: async (ctx, args) => {
    const { equipmentId, replacementOptions } = args;
    
    // Get current equipment details
    const currentEquipment = await ctx.db.get(equipmentId);
    if (!currentEquipment) throw new Error("Equipment not found");
    
    // Analyze current equipment performance
    const currentPerformance = await analyzeEquipmentROI(ctx, {
      equipmentId,
      analysisTimeframe: "annual"
    });
    
    // Calculate remaining value and useful life
    const remainingAnalysis = calculateRemainingValue(currentEquipment);
    
    // Analyze each replacement option
    const replacementAnalyses = [];
    
    for (const option of replacementOptions) {
      const projectedPerformance = projectNewEquipmentPerformance(
        option,
        currentPerformance,
        currentEquipment
      );
      
      const costComparison = calculateReplacementCosts(
        currentEquipment,
        option,
        remainingAnalysis
      );
      
      const netBenefit = calculateReplacementNetBenefit(
        currentPerformance,
        projectedPerformance,
        costComparison
      );
      
      replacementAnalyses.push({
        option,
        projectedPerformance,
        costComparison,
        netBenefit,
        recommendation: netBenefit.npv > 0 ? "recommended" : "not-recommended",
        confidence: projectedPerformance.confidence
      });
    }
    
    // Sort by net present value
    replacementAnalyses.sort((a, b) => b.netBenefit.npv - a.netBenefit.npv);
    
    // Generate timing recommendation
    const timingRecommendation = generateReplacementTiming(
      currentEquipment,
      remainingAnalysis,
      replacementAnalyses
    );
    
    // Store replacement analysis
    const analysisId = await ctx.db.insert("equipmentReplacementAnalyses", {
      equipmentId,
      currentPerformance,
      remainingAnalysis,
      replacementOptions: replacementAnalyses,
      timingRecommendation,
      createdAt: Date.now(),
      agentVersion: "equipment-intelligence-v1.0"
    });
    
    return {
      analysisId,
      currentEquipment: {
        id: currentEquipment._id,
        type: currentEquipment.identity.equipmentType,
        age: Math.floor((Date.now() - currentEquipment.identity.acquisitionDate) / (365 * 24 * 60 * 60 * 1000)),
        currentROI: currentPerformance.financial.roi,
        remainingValue: Math.round(remainingAnalysis.remainingValue),
        remainingLife: remainingAnalysis.remainingLifeYears
      },
      bestOption: replacementAnalyses[0] ? {
        make: replacementAnalyses[0].option.make,
        model: replacementAnalyses[0].option.model,
        cost: replacementAnalyses[0].option.cost,
        projectedROI: Math.round(replacementAnalyses[0].projectedPerformance.projectedROI * 100),
        netPresentValue: Math.round(replacementAnalyses[0].netBenefit.npv),
        paybackPeriod: replacementAnalyses[0].netBenefit.paybackPeriod
      } : null,
      timing: {
        recommendation: timingRecommendation.recommendation,
        optimalDate: timingRecommendation.optimalDate,
        reasoning: timingRecommendation.reasoning
      },
      allOptions: replacementAnalyses.map(analysis => ({
        make: analysis.option.make,
        model: analysis.option.model,
        cost: analysis.option.cost,
        npv: Math.round(analysis.netBenefit.npv),
        recommendation: analysis.recommendation
      }))
    };
  }
});

// Equipment Performance Monitor
export const monitorEquipmentPerformance = query({
  args: {},
  handler: async (ctx) => {
    const alerts = [];
    const metrics = {
      averageUtilization: 0,
      totalDowntime: 0,
      maintenanceCosts: 0,
      equipmentROI: 0,
      criticalAlerts: 0
    };
    
    // Get all equipment
    const equipment = await ctx.db.query("equipment").collect();
    
    if (equipment.length === 0) {
      return {
        metrics,
        alerts: [{ type: "no-equipment", severity: "warning", message: "No equipment registered in system" }],
        lastUpdated: Date.now(),
        agentStatus: "active"
      };
    }
    
    // Calculate aggregate metrics
    let totalUtilization = 0;
    let totalDowntime = 0;
    let totalMaintenanceCosts = 0;
    let totalROI = 0;
    
    for (const item of equipment) {
      // Calculate utilization (placeholder - would need actual tracking)
      const utilization = item.operations?.utilizationPercentage || 0.75;
      totalUtilization += utilization;
      
      // Check utilization threshold
      if (utilization < EQUIPMENT_AGENT_CONFIG.alertThresholds.criticalUtilization) {
        alerts.push({
          type: "low-utilization",
          severity: "warning",
          message: `${item.identity.make} ${item.identity.model} utilization ${Math.round(utilization * 100)}% below target`,
          actionRequired: "Review equipment allocation and scheduling"
        });
      }
      
      // Check maintenance status
      const lastMaintenance = item.maintenance?.lastMaintenanceDate || 0;
      const daysSinceMaintenance = (Date.now() - lastMaintenance) / (1000 * 60 * 60 * 24);
      const maintenanceInterval = item.maintenance?.maintenanceIntervalDays || 90;
      
      if (daysSinceMaintenance > maintenanceInterval + EQUIPMENT_AGENT_CONFIG.alertThresholds.maintenanceOverdue) {
        alerts.push({
          type: "maintenance-overdue",
          severity: "critical",
          message: `${item.identity.make} ${item.identity.model} maintenance overdue by ${Math.round(daysSinceMaintenance - maintenanceInterval)} days`,
          actionRequired: "Schedule maintenance immediately"
        });
        metrics.criticalAlerts++;
      }
      
      // Calculate costs and ROI (placeholder calculations)
      const annualMaintenanceCost = item.finance?.annualMaintenanceCost || 5000;
      totalMaintenanceCosts += annualMaintenanceCost;
      
      const equipmentROI = item.finance?.currentROI || 0.15;
      totalROI += equipmentROI;
    }
    
    // Calculate averages
    metrics.averageUtilization = totalUtilization / equipment.length;
    metrics.maintenanceCosts = totalMaintenanceCosts;
    metrics.equipmentROI = totalROI / equipment.length;
    
    // Check against targets
    if (metrics.averageUtilization < EQUIPMENT_AGENT_CONFIG.targetMetrics.utilizationRate) {
      alerts.push({
        type: "fleet-utilization-low",
        severity: "warning",
        message: `Fleet utilization ${Math.round(metrics.averageUtilization * 100)}% below target ${Math.round(EQUIPMENT_AGENT_CONFIG.targetMetrics.utilizationRate * 100)}%`,
        actionRequired: "Optimize equipment allocation across jobs"
      });
    }
    
    return {
      metrics: {
        averageUtilization: Math.round(metrics.averageUtilization * 100),
        totalEquipment: equipment.length,
        maintenanceCosts: Math.round(metrics.maintenanceCosts),
        equipmentROI: Math.round(metrics.equipmentROI * 100),
        criticalAlerts: metrics.criticalAlerts
      },
      alerts,
      lastUpdated: Date.now(),
      agentStatus: "active",
      recommendations: alerts.length > 0 ? 
        ["Optimize equipment utilization", "Schedule overdue maintenance", "Review equipment allocation"] :
        ["Equipment performance within targets", "Continue current operations"]
    };
  }
});

// Helper Functions
function calculateEquipmentUtilizationMetrics(equipment: any, jobs: any[], startDate: number, endDate: number, includeDowntime: boolean) {
  // Calculate total available hours in period
  const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const workingHoursPerDay = 8; // Standard working day
  const availableHours = totalDays * workingHoursPerDay;
  
  // Calculate actual usage (placeholder - would need real tracking)
  const estimatedUsageHours = jobs.length * 6; // Rough estimate
  const hoursUsed = Math.min(estimatedUsageHours, availableHours);
  
  // Calculate downtime
  const maintenanceHours = includeDowntime ? availableHours * 0.05 : 0; // 5% for maintenance
  const downtimeHours = maintenanceHours;
  
  const utilizationRate = (availableHours - downtimeHours) > 0 ? 
    hoursUsed / (availableHours - downtimeHours) : 0;
  const downtimeRate = availableHours > 0 ? downtimeHours / availableHours : 0;
  
  return {
    hoursUsed,
    availableHours,
    utilizationRate,
    downtimeHours,
    downtimeRate
  };
}

async function getMaintenanceRecords(ctx: any, equipmentId: Id<"equipment">, startDate: number) {
  // TODO: Implement actual maintenance record queries
  return [
    { date: Date.now() - (30 * 24 * 60 * 60 * 1000), cost: 1500, type: "routine" },
    { date: Date.now() - (90 * 24 * 60 * 60 * 1000), cost: 800, type: "preventive" }
  ];
}

function calculateEfficiencyMetrics(equipment: any, utilizationData: any, maintenanceRecords: any[]) {
  const fuelEfficiency = equipment.operations?.fuelEfficiencyMPG || 8; // Miles per gallon
  const hoursPerGallon = equipment.operations?.hoursPerGallon || 3; // Operating hours per gallon
  
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);
  const costPerHour = utilizationData.hoursUsed > 0 ? 
    (totalMaintenanceCost / utilizationData.hoursUsed) : 0;
  
  return {
    fuelEfficiency,
    hoursPerGallon,
    maintenanceCostPerHour: costPerHour,
    utilizationEfficiency: utilizationData.utilizationRate,
    downtimeImpact: utilizationData.downtimeRate
  };
}

function identifyUtilizationOptimizations(utilizationData: any, efficiencyMetrics: any) {
  const optimizations = [];
  
  if (utilizationData.utilizationRate < 0.7) {
    optimizations.push({
      type: "scheduling",
      description: "Optimize job scheduling to increase utilization",
      potentialImprovement: (0.85 - utilizationData.utilizationRate) * 100,
      effort: "medium",
      timeline: "30 days"
    });
  }
  
  if (utilizationData.downtimeRate > 0.1) {
    optimizations.push({
      type: "maintenance",
      description: "Reduce downtime through predictive maintenance",
      potentialImprovement: (utilizationData.downtimeRate - 0.05) * 100,
      effort: "high",
      timeline: "60 days"
    });
  }
  
  if (efficiencyMetrics.fuelEfficiency < 10) {
    optimizations.push({
      type: "fuel-efficiency",
      description: "Improve fuel efficiency through operator training",
      potentialImprovement: 15,
      effort: "low",
      timeline: "14 days"
    });
  }
  
  return optimizations;
}

function generateEquipmentAlerts(equipment: any, utilizationData: any, efficiencyMetrics: any) {
  const alerts = [];
  
  if (utilizationData.utilizationRate < EQUIPMENT_AGENT_CONFIG.alertThresholds.criticalUtilization) {
    alerts.push({
      type: "critical-underutilization",
      severity: "warning",
      message: `Equipment utilization ${Math.round(utilizationData.utilizationRate * 100)}% critically low`,
      actionRequired: "Review job assignments and scheduling"
    });
  }
  
  if (efficiencyMetrics.maintenanceCostPerHour > 50) {
    alerts.push({
      type: "high-maintenance-cost",
      severity: "warning",
      message: `Maintenance cost per hour $${Math.round(efficiencyMetrics.maintenanceCostPerHour)} exceeds threshold`,
      actionRequired: "Review maintenance strategy and vendor contracts"
    });
  }
  
  return alerts;
}

function calculateAggregateUtilization(analyses: any[]) {
  const totalHoursUsed = analyses.reduce((sum, analysis) => sum + analysis.utilization.hoursUsed, 0);
  const totalAvailableHours = analyses.reduce((sum, analysis) => sum + analysis.utilization.availableHours, 0);
  const totalDowntimeHours = analyses.reduce((sum, analysis) => sum + analysis.utilization.downtimeHours, 0);
  
  const averageUtilization = totalAvailableHours > 0 ? totalHoursUsed / totalAvailableHours : 0;
  
  // Collect top optimizations across all equipment
  const allOptimizations = analyses.flatMap(analysis => analysis.optimizations);
  const topOptimizations = allOptimizations
    .sort((a, b) => b.potentialImprovement - a.potentialImprovement)
    .slice(0, 5);
  
  return {
    averageUtilization,
    totalHoursUsed,
    totalAvailableHours,
    totalDowntimeHours,
    topOptimizations
  };
}

function calculateMaintenancePredictions(equipment: any, history: any[], usageData: any, horizon: number) {
  // Simple predictive model based on historical patterns
  const avgInterval = history.length > 1 ? 
    (Date.now() - history[history.length - 1].date) / (1000 * 60 * 60 * 24) : 90;
  
  const lastMaintenance = history.length > 0 ? history[0].date : Date.now() - (90 * 24 * 60 * 60 * 1000);
  const daysSinceLastMaintenance = (Date.now() - lastMaintenance) / (1000 * 60 * 60 * 24);
  
  // Calculate next maintenance date
  const nextMaintenanceDate = lastMaintenance + (avgInterval * 24 * 60 * 60 * 1000);
  
  // Determine maintenance type and risk level
  const maintenanceType = daysSinceLastMaintenance > avgInterval * 0.8 ? "preventive" : "routine";
  const riskLevel = daysSinceLastMaintenance > avgInterval ? "high" : 
                   daysSinceLastMaintenance > avgInterval * 0.8 ? "medium" : "low";
  
  return {
    nextMaintenanceDate,
    maintenanceType,
    riskLevel,
    confidence: history.length > 3 ? 0.8 : 0.6
  };
}

function generateOptimalMaintenanceSchedule(equipment: any, predictions: any, horizon: number) {
  const schedule = [];
  const startDate = Date.now();
  
  // Add predicted maintenance
  if (predictions.nextMaintenanceDate <= startDate + (horizon * 24 * 60 * 60 * 1000)) {
    schedule.push({
      date: predictions.nextMaintenanceDate,
      type: predictions.maintenanceType,
      estimatedCost: predictions.maintenanceType === "routine" ? 800 : 1500,
      priority: predictions.riskLevel === "high" ? "critical" : "normal",
      description: `${predictions.maintenanceType} maintenance for ${equipment.identity.make} ${equipment.identity.model}`
    });
  }
  
  // Add recurring maintenance
  let nextRoutine = predictions.nextMaintenanceDate + (90 * 24 * 60 * 60 * 1000);
  while (nextRoutine <= startDate + (horizon * 24 * 60 * 60 * 1000)) {
    schedule.push({
      date: nextRoutine,
      type: "routine",
      estimatedCost: 800,
      priority: "normal",
      description: `Routine maintenance for ${equipment.identity.make} ${equipment.identity.model}`
    });
    nextRoutine += (90 * 24 * 60 * 60 * 1000);
  }
  
  return schedule;
}

function calculateMaintenanceCostBenefit(equipment: any, schedule: any[], predictions: any) {
  const preventiveCost = schedule.reduce((sum, item) => sum + item.estimatedCost, 0);
  
  // Estimate reactive maintenance cost if preventive is skipped
  const reactiveCost = preventiveCost * 3; // Reactive typically 3x more expensive
  const failureRisk = predictions.riskLevel === "high" ? 0.7 : 
                     predictions.riskLevel === "medium" ? 0.3 : 0.1;
  const reactiveRisk = reactiveCost * failureRisk;
  
  const savings = reactiveRisk - preventiveCost;
  const roi = preventiveCost > 0 ? savings / preventiveCost : 0;
  
  return {
    preventiveCost,
    reactiveRisk,
    savings,
    roi
  };
}

function generateMaintenanceRecommendations(predictions: any, costBenefit: any): string[] {
  const recommendations = [];
  
  if (predictions.riskLevel === "high") {
    recommendations.push("Schedule immediate maintenance to prevent equipment failure");
  }
  
  if (costBenefit.roi > 1.0) {
    recommendations.push("Preventive maintenance strongly recommended - positive ROI");
  }
  
  if (predictions.confidence < 0.7) {
    recommendations.push("Increase maintenance data collection for better predictions");
  }
  
  return recommendations.length > 0 ? recommendations : ["Continue current maintenance schedule"];
}

async function getEquipmentUsageData(ctx: any, equipmentId: Id<"equipment">) {
  // TODO: Implement actual usage data collection
  return {
    totalHours: 2000,
    averageHoursPerDay: 7,
    utilizationTrend: "stable"
  };
}

async function getEquipmentOperatingData(ctx: any, equipmentId: Id<"equipment">, timeframe: string) {
  // TODO: Implement actual operating data collection
  return {
    jobAssignments: [],
    utilizationHours: 1800,
    operatingHours: 2000,
    annualHours: 2000,
    utilizationRate: 0.75,
    maintenanceRecords: [
      { date: Date.now() - (30 * 24 * 60 * 60 * 1000), cost: 1500 }
    ]
  };
}

function calculateEquipmentRevenueAttribution(equipment: any, jobAssignments: any[], utilizationHours: number) {
  // Estimate revenue based on utilization and average rates
  const hourlyRate = equipment.operations?.hourlyRate || 75;
  const totalRevenue = utilizationHours * hourlyRate;
  const annualRevenue = totalRevenue; // Assuming annual analysis
  
  return {
    totalRevenue,
    annualRevenue,
    revenuePerHour: hourlyRate
  };
}

function calculateEquipmentTotalCosts(equipment: any, maintenanceRecords: any[], operatingHours: number, timeframe: string) {
  const maintenanceCost = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);
  const fuelCost = operatingHours * (equipment.operations?.fuelCostPerHour || 12);
  const operatorCost = operatingHours * (equipment.operations?.operatorCostPerHour || 25);
  const insuranceCost = equipment.finance?.annualInsuranceCost || 3000;
  
  const total = maintenanceCost + fuelCost + operatorCost + insuranceCost;
  const annual = total; // Assuming annual analysis
  
  return {
    maintenance: maintenanceCost,
    fuel: fuelCost,
    operator: operatorCost,
    insurance: insuranceCost,
    total,
    annual
  };
}

function calculateEquipmentDepreciation(equipment: any, acquisitionDate: number, timeframe: string) {
  const acquisitionCost = equipment.finance?.acquisitionCost || 100000;
  const usefulLife = equipment.finance?.usefulLifeYears || 10;
  const currentAge = (Date.now() - acquisitionDate) / (365 * 24 * 60 * 60 * 1000);
  
  const annualDepreciation = acquisitionCost / usefulLife;
  const accumulatedDepreciation = Math.min(acquisitionCost, annualDepreciation * currentAge);
  
  return {
    annualDepreciation,
    accumulatedDepreciation,
    remainingValue: acquisitionCost - accumulatedDepreciation
  };
}

function calculatePaybackPeriod(investment: number, annualCashFlow: number): number {
  if (annualCashFlow <= 0) return Infinity;
  return investment / annualCashFlow;
}

function getEquipmentBenchmarks(equipmentType: string) {
  const benchmarks = {
    "crane": { averageROI: 0.20, averageUtilization: 0.75 },
    "chipper": { averageROI: 0.25, averageUtilization: 0.80 },
    "stump-grinder": { averageROI: 0.30, averageUtilization: 0.70 },
    "bucket-truck": { averageROI: 0.22, averageUtilization: 0.85 }
  };
  
  return benchmarks[equipmentType] || { averageROI: 0.20, averageUtilization: 0.75 };
}

function generateROIRecommendations(equipment: any, roiMetrics: any, benchmarks: any, operatingData: any): string[] {
  const recommendations = [];
  
  if (roiMetrics.roi < benchmarks.averageROI) {
    recommendations.push("ROI below industry average - review utilization and pricing");
  }
  
  if (operatingData.utilizationRate < benchmarks.averageUtilization) {
    recommendations.push("Increase equipment utilization through better scheduling");
  }
  
  if (roiMetrics.paybackPeriod > 5) {
    recommendations.push("Long payback period - consider operational improvements");
  }
  
  return recommendations.length > 0 ? recommendations : ["Equipment performing above benchmarks"];
}

function calculateRemainingValue(equipment: any) {
  const acquisitionCost = equipment.finance?.acquisitionCost || 100000;
  const acquisitionDate = equipment.identity.acquisitionDate || Date.now();
  const usefulLife = equipment.finance?.usefulLifeYears || 10;
  
  const currentAge = (Date.now() - acquisitionDate) / (365 * 24 * 60 * 60 * 1000);
  const remainingLifeYears = Math.max(0, usefulLife - currentAge);
  const depreciationRate = 1 / usefulLife;
  const currentValue = acquisitionCost * (1 - (depreciationRate * currentAge));
  
  return {
    remainingValue: Math.max(0, currentValue),
    remainingLifeYears,
    currentAge
  };
}

function projectNewEquipmentPerformance(option: any, currentPerformance: any, currentEquipment: any) {
  // Project performance improvements based on new equipment specifications
  const efficiencyImprovement = 1.15; // Assume 15% improvement for new equipment
  const maintenanceReduction = 0.8; // 20% reduction in maintenance costs
  
  const projectedROI = currentPerformance.financial.roi * efficiencyImprovement;
  const projectedUtilization = Math.min(0.95, currentPerformance.performance.utilizationRate * 1.1);
  
  return {
    projectedROI,
    projectedUtilization,
    projectedMaintenanceSavings: currentPerformance.financial.totalCosts * (1 - maintenanceReduction),
    confidence: 0.7
  };
}

function calculateReplacementCosts(currentEquipment: any, newOption: any, remainingAnalysis: any) {
  const newEquipmentCost = newOption.cost;
  const tradeInValue = remainingAnalysis.remainingValue * 0.6; // Assume 60% of remaining value
  const netReplacementCost = newEquipmentCost - tradeInValue;
  
  const disposalCosts = 2000; // Estimated disposal/transport costs
  const installationCosts = newEquipmentCost * 0.05; // 5% of equipment cost
  
  return {
    newEquipmentCost,
    tradeInValue,
    netReplacementCost,
    disposalCosts,
    installationCosts,
    totalReplacementCost: netReplacementCost + disposalCosts + installationCosts
  };
}

function calculateReplacementNetBenefit(currentPerformance: any, projectedPerformance: any, costs: any) {
  const annualBenefit = (projectedPerformance.projectedROI - currentPerformance.financial.roi) * 
                       currentPerformance.financial.acquisitionCost;
  const totalCost = costs.totalReplacementCost;
  
  const paybackPeriod = annualBenefit > 0 ? totalCost / annualBenefit : Infinity;
  const npv = (annualBenefit * 5) - totalCost; // 5-year NPV simplified
  
  return {
    annualBenefit,
    paybackPeriod,
    npv
  };
}

function generateReplacementTiming(currentEquipment: any, remainingAnalysis: any, replacementAnalyses: any[]) {
  const bestOption = replacementAnalyses[0];
  
  if (!bestOption || bestOption.netBenefit.npv <= 0) {
    return {
      recommendation: "continue-current",
      optimalDate: null,
      reasoning: "No replacement option shows positive net benefit"
    };
  }
  
  if (remainingAnalysis.remainingLifeYears < 2) {
    return {
      recommendation: "replace-soon",
      optimalDate: Date.now() + (6 * 30 * 24 * 60 * 60 * 1000), // 6 months
      reasoning: "Current equipment approaching end of useful life"
    };
  }
  
  return {
    recommendation: "plan-replacement",
    optimalDate: Date.now() + (remainingAnalysis.remainingLifeYears * 0.8 * 365 * 24 * 60 * 60 * 1000),
    reasoning: "Optimal replacement timing balances remaining value with new equipment benefits"
  };
}

// Equipment Intelligence Agent Main Interface
export const processEquipmentIntelligence = mutation({
  args: {
    message: v.string(),
    context: v.object({
      requestType: v.string(), // "utilization", "maintenance", "roi", "replacement"
      equipmentId: v.optional(v.id("equipment")),
      timeframe: v.optional(v.string())
    })
  },
  handler: async (ctx, args) => {
    const { message, context } = args;
    
    let response = "";
    let data = null;
    
    switch (context.requestType) {
      case "utilization":
        data = await analyzeEquipmentUtilization(ctx, { 
          analysisScope: { 
            equipmentId: context.equipmentId,
            timeframe: context.timeframe || "monthly",
            includeDowntime: true 
          } 
        });
        response = `Utilization analysis: ${data.summary.equipmentCount} equipment, ${data.summary.averageUtilization}% average utilization (target: ${data.summary.utilizationTarget}%)`;
        break;
        
      case "maintenance":
        if (context.equipmentId) {
          data = await schedulePredictiveMaintenance(ctx, { 
            equipmentId: context.equipmentId, 
            predictionHorizon: 90 
          });
          response = `Maintenance prediction: Next maintenance ${new Date(data.predictions.nextMaintenanceDate).toLocaleDateString()}, ${data.predictions.confidence}% confidence, ${data.costBenefit.roi}% ROI`;
        }
        break;
        
      case "roi":
        if (context.equipmentId) {
          data = await analyzeEquipmentROI(ctx, { 
            equipmentId: context.equipmentId, 
            analysisTimeframe: "annual" 
          });
          response = `ROI analysis: ${data.financial.roi}% ROI, $${data.performance.revenuePerHour}/hour, ${data.benchmarks.performanceRating} vs industry`;
        }
        break;
        
      default:
        const performance = await monitorEquipmentPerformance(ctx, {});
        response = `Equipment Intelligence Status: ${performance.alerts.length} active alerts. Fleet utilization: ${performance.metrics.averageUtilization}%`;
        data = performance;
    }
    
    return {
      agentId: EQUIPMENT_AGENT_CONFIG.agentId,
      response,
      data,
      timestamp: Date.now(),
      confidence: 0.95
    };
  }
});