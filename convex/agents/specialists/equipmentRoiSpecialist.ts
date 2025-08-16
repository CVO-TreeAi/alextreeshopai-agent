import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

export const calculateEquipmentROI = mutation({
  args: {
    roiAnalysis: v.object({
      equipmentId: v.string(),
      equipmentDetails: v.object({
        type: v.string(),
        model: v.string(),
        manufacturer: v.string(),
        purchaseDate: v.string(),
        purchasePrice: v.number(),
        warrantyDetails: v.object({
          duration: v.number(),
          coverage: v.array(v.string()),
          expirationDate: v.string()
        }),
        specifications: v.object({
          capacity: v.string(),
          powerRating: v.string(),
          operatingWeight: v.number(),
          fuelType: v.string()
        })
      }),
      financialData: v.object({
        revenue: v.object({
          directRevenue: v.number(),
          revenuePerHour: v.number(),
          billableHours: v.number(),
          utilizationRate: v.number(),
          monthlyRevenue: v.array(v.object({
            month: v.string(),
            amount: v.number(),
            hours: v.number()
          }))
        }),
        costs: v.object({
          operatingCosts: v.object({
            fuel: v.number(),
            maintenance: v.number(),
            insurance: v.number(),
            storage: v.number(),
            operator: v.number()
          }),
          capitalCosts: v.object({
            depreciation: v.number(),
            financing: v.number(),
            taxes: v.number(),
            permits: v.number()
          }),
          totalAnnualCosts: v.number()
        }),
        financing: v.object({
          downPayment: v.number(),
          loanAmount: v.number(),
          interestRate: v.number(),
          loanTerm: v.number(),
          monthlyPayment: v.number()
        })
      }),
      operationalMetrics: v.object({
        productivity: v.object({
          jobsCompleted: v.number(),
          averageJobValue: v.number(),
          completionRate: v.number(),
          qualityScore: v.number(),
          customerSatisfaction: v.number()
        }),
        efficiency: v.object({
          fuelEfficiency: v.number(),
          operatingSpeed: v.number(),
          downtimePercentage: v.number(),
          maintenanceFrequency: v.number(),
          operatorEfficiency: v.number()
        }),
        reliability: v.object({
          uptimePercentage: v.number(),
          breakdownFrequency: v.number(),
          meanTimeBetweenFailures: v.number(),
          emergencyRepairs: v.number(),
          scheduledMaintenanceCompliance: v.number()
        })
      }),
      marketConditions: v.object({
        demandForecast: v.object({
          currentDemand: v.string(),
          projectedGrowth: v.number(),
          seasonalVariation: v.number(),
          marketTrends: v.array(v.string())
        }),
        competitiveAnalysis: v.object({
          competitorEquipment: v.array(v.string()),
          pricingPressure: v.string(),
          serviceGaps: v.array(v.string()),
          marketPosition: v.string()
        }),
        replacement: v.object({
          currentMarketValue: v.number(),
          tradeInValue: v.number(),
          replacementCost: v.number(),
          newModelAvailability: v.boolean(),
          technologyAdvancement: v.string()
        })
      })
    })
  },
  handler: async (ctx, args) => {
    const { roiAnalysis } = args;
    
    const roiCalculations = performROICalculations(roiAnalysis);
    const profitabilityAnalysis = analyzeProfitability(roiAnalysis);
    const lifecycleAnalysis = performLifecycleAnalysis(roiAnalysis);
    const benchmarkComparison = compareToBenchmarks(roiAnalysis);
    const optimizationRecommendations = generateOptimizationRecommendations(roiAnalysis, roiCalculations);
    
    await ctx.db.insert("equipmentROIAnalyses", {
      equipmentId: roiAnalysis.equipmentId,
      analysis: roiAnalysis,
      roiCalculations,
      profitabilityAnalysis,
      lifecycleAnalysis,
      benchmarkComparison,
      recommendations: optimizationRecommendations,
      timestamp: new Date().toISOString(),
      agentId: "equipment-roi-specialist"
    });
    
    return {
      success: true,
      roiCalculations,
      profitabilityAnalysis,
      lifecycleAnalysis,
      benchmarkComparison,
      recommendations: optimizationRecommendations,
      investmentRating: categorizeInvestmentRating(roiCalculations),
      actionPlan: generateActionPlan(roiAnalysis, roiCalculations)
    };
  }
});

export const analyzeReplacementTiming = mutation({
  args: {
    replacementAnalysis: v.object({
      equipmentId: v.string(),
      currentEquipment: v.object({
        age: v.number(),
        condition: v.string(),
        currentValue: v.number(),
        annualMaintenanceCosts: v.number(),
        productivityTrend: v.string(),
        reliabilityScore: v.number(),
        operatingCosts: v.number()
      }),
      replacementOptions: v.array(v.object({
        optionId: v.string(),
        equipmentType: v.string(),
        newPrice: v.number(),
        tradeInCredit: v.number(),
        netCost: v.number(),
        projectedROI: v.number(),
        paybackPeriod: v.number(),
        features: v.array(v.string()),
        efficiencyGains: v.number(),
        maintenanceSavings: v.number()
      })),
      operationalImpact: v.object({
        currentCapacity: v.number(),
        projectedCapacity: v.number(),
        downtimeRisk: v.string(),
        trainingRequirements: v.object({
          hoursRequired: v.number(),
          cost: v.number(),
          timeline: v.string()
        }),
        integrationComplexity: v.string()
      }),
      financialConstraints: v.object({
        availableBudget: v.number(),
        cashFlowProjection: v.array(v.object({
          month: v.string(),
          netCashFlow: v.number(),
          cumulativeCashFlow: v.number()
        })),
        financingOptions: v.array(v.object({
          type: v.string(),
          rate: v.number(),
          terms: v.string(),
          downPaymentRequired: v.number()
        }))
      }),
      strategicConsiderations: v.object({
        businessGrowthPlans: v.string(),
        serviceExpansion: v.array(v.string()),
        competitivePositioning: v.string(),
        technologyRoadmap: v.string(),
        regulatoryChanges: v.array(v.string())
      })
    })
  },
  handler: async (ctx, args) => {
    const { replacementAnalysis } = args;
    
    const timingAnalysis = analyzeOptimalTiming(replacementAnalysis);
    const optionComparison = compareReplacementOptions(replacementAnalysis);
    const riskAssessment = assessReplacementRisks(replacementAnalysis);
    const financialProjections = projectFinancialImpact(replacementAnalysis);
    const strategicAlignment = evaluateStrategicAlignment(replacementAnalysis);
    
    await ctx.db.insert("replacementAnalyses", {
      equipmentId: replacementAnalysis.equipmentId,
      analysis: replacementAnalysis,
      timingAnalysis,
      optionComparison,
      riskAssessment,
      financialProjections,
      strategicAlignment,
      timestamp: new Date().toISOString(),
      agentId: "equipment-roi-specialist"
    });
    
    return {
      success: true,
      timingAnalysis,
      optionComparison,
      riskAssessment,
      financialProjections,
      strategicAlignment,
      recommendedTiming: determineRecommendedTiming(timingAnalysis, riskAssessment),
      preferredOption: identifyPreferredOption(optionComparison, strategicAlignment)
    };
  }
});

export const optimizeUtilization = mutation({
  args: {
    utilizationOptimization: v.object({
      equipmentId: v.string(),
      currentUtilization: v.object({
        actualHours: v.number(),
        availableHours: v.number(),
        utilizationRate: v.number(),
        idleTime: v.number(),
        productiveTime: v.number(),
        maintenanceTime: v.number(),
        utilizationTrend: v.string()
      }),
      utilizationFactors: v.object({
        demand: v.object({
          jobAvailability: v.string(),
          seasonalPatterns: v.array(v.object({
            season: v.string(),
            demandLevel: v.string(),
            utilizationRate: v.number()
          })),
          marketSaturation: v.string(),
          competitivePosition: v.string()
        }),
        operational: v.object({
          crewAvailability: v.string(),
          transportationTime: v.number(),
          setupTime: v.number(),
          operatorSkillLevel: v.string(),
          maintenanceScheduling: v.string()
        }),
        external: v.object({
          weatherDependency: v.string(),
          permitRequirements: v.array(v.string()),
          clientSchedulingFlexibility: v.string(),
          regulatoryRestrictions: v.array(v.string())
        })
      }),
      improvementOpportunities: v.object({
        schedulingOptimization: v.object({
          routeOptimization: v.boolean(),
          jobBatching: v.boolean(),
          predictiveMaintenance: v.boolean(),
          demandForecasting: v.boolean()
        }),
        operationalEfficiency: v.object({
          operatorTraining: v.boolean(),
          processImprovement: v.boolean(),
          technologyUpgrades: v.boolean(),
          partnershipOpportunities: v.boolean()
        }),
        marketExpansion: v.object({
          newServiceLines: v.array(v.string()),
          geographicExpansion: v.array(v.string()),
          contractorPartnerships: v.boolean(),
          rentalOpportunities: v.boolean()
        })
      }),
      performanceTargets: v.object({
        targetUtilizationRate: v.number(),
        targetRevenue: v.number(),
        targetEfficiency: v.number(),
        timeline: v.string()
      })
    })
  },
  handler: async (ctx, args) => {
    const { utilizationOptimization } = args;
    
    const utilizationAnalysis = analyzeUtilizationGaps(utilizationOptimization);
    const optimizationPlan = createUtilizationOptimizationPlan(utilizationOptimization);
    const implementationRoadmap = developImplementationRoadmap(utilizationOptimization, optimizationPlan);
    const impactProjections = projectUtilizationImpact(utilizationOptimization, optimizationPlan);
    const monitoringStrategy = createMonitoringStrategy(utilizationOptimization);
    
    await ctx.db.insert("utilizationOptimizations", {
      equipmentId: utilizationOptimization.equipmentId,
      optimization: utilizationOptimization,
      analysis: utilizationAnalysis,
      plan: optimizationPlan,
      roadmap: implementationRoadmap,
      projections: impactProjections,
      monitoring: monitoringStrategy,
      timestamp: new Date().toISOString(),
      agentId: "equipment-roi-specialist"
    });
    
    return {
      success: true,
      analysis: utilizationAnalysis,
      plan: optimizationPlan,
      roadmap: implementationRoadmap,
      projections: impactProjections,
      monitoring: monitoringStrategy,
      priorityActions: identifyPriorityActions(optimizationPlan),
      expectedROI: calculateOptimizationROI(utilizationOptimization, impactProjections)
    };
  }
});

export const assessFleetOptimization = mutation({
  args: {
    fleetOptimization: v.object({
      organizationId: v.string(),
      currentFleet: v.array(v.object({
        equipmentId: v.string(),
        type: v.string(),
        age: v.number(),
        utilization: v.number(),
        roi: v.number(),
        condition: v.string(),
        annualCosts: v.number(),
        annualRevenue: v.number()
      })),
      fleetMetrics: v.object({
        totalAssetValue: v.number(),
        averageUtilization: v.number(),
        averageROI: v.number(),
        maintenanceCostRatio: v.number(),
        capacityUtilization: v.number(),
        fleetAge: v.number()
      }),
      businessRequirements: v.object({
        serviceCapabilities: v.array(v.string()),
        geographicCoverage: v.array(v.string()),
        capacityNeeds: v.object({
          currentCapacity: v.number(),
          projectedCapacity: v.number(),
          peakDemandCapacity: v.number(),
          emergencyCapacity: v.number()
        }),
        serviceLevel: v.object({
          responseTime: v.number(),
          reliability: v.number(),
          qualityStandards: v.number(),
          customerSatisfaction: v.number()
        })
      }),
      constraints: v.object({
        budgetLimitations: v.object({
          annualBudget: v.number(),
          capitalBudget: v.number(),
          operatingBudget: v.number(),
          financingAvailability: v.string()
        }),
        operational: v.object({
          storageCapacity: v.number(),
          crewCapacity: v.number(),
          maintenanceFacilities: v.string(),
          regulatoryCompliance: v.array(v.string())
        }),
        strategic: v.object({
          riskTolerance: v.string(),
          growthPlans: v.string(),
          technologyPreference: v.string(),
          partnershipStrategy: v.string()
        })
      })
    })
  },
  handler: async (ctx, args) => {
    const { fleetOptimization } = args;
    
    const fleetAnalysis = analyzeCurrentFleet(fleetOptimization);
    const optimizationStrategy = developFleetOptimizationStrategy(fleetOptimization, fleetAnalysis);
    const portfolioRecommendations = generatePortfolioRecommendations(fleetOptimization, fleetAnalysis);
    const implementationPlan = createFleetImplementationPlan(fleetOptimization, optimizationStrategy);
    const performanceProjections = projectFleetPerformance(fleetOptimization, optimizationStrategy);
    
    await ctx.db.insert("fleetOptimizations", {
      organizationId: fleetOptimization.organizationId,
      optimization: fleetOptimization,
      analysis: fleetAnalysis,
      strategy: optimizationStrategy,
      recommendations: portfolioRecommendations,
      implementationPlan,
      projections: performanceProjections,
      timestamp: new Date().toISOString(),
      agentId: "equipment-roi-specialist"
    });
    
    return {
      success: true,
      analysis: fleetAnalysis,
      strategy: optimizationStrategy,
      recommendations: portfolioRecommendations,
      implementationPlan,
      projections: performanceProjections,
      fleetScore: calculateFleetOptimizationScore(fleetAnalysis),
      priorityActions: identifyFleetPriorityActions(optimizationStrategy)
    };
  }
});

export const analyzeLeaseVsBuy = mutation({
  args: {
    leaseVsBuyAnalysis: v.object({
      equipmentSpecification: v.object({
        type: v.string(),
        model: v.string(),
        newPrice: v.number(),
        expectedLife: v.number(),
        estimatedUsage: v.number(),
        residualValue: v.number()
      }),
      purchaseOption: v.object({
        purchasePrice: v.number(),
        downPayment: v.number(),
        financing: v.object({
          loanAmount: v.number(),
          interestRate: v.number(),
          loanTerm: v.number(),
          monthlyPayment: v.number()
        }),
        ownership: v.object({
          depreciation: v.number(),
          taxBenefits: v.number(),
          maintenanceResponsibility: v.boolean(),
          insuranceResponsibility: v.boolean(),
          resaleFlexibility: v.boolean()
        })
      }),
      leaseOption: v.object({
        monthlyPayment: v.number(),
        leaseTerm: v.number(),
        mileageLimit: v.number(),
        excessMileageRate: v.number(),
        leaseEnd: v.object({
          buyoutOption: v.number(),
          returnOption: v.boolean(),
          renewalOption: v.boolean(),
          wearTearCharges: v.number()
        }),
        included: v.object({
          maintenance: v.boolean(),
          insurance: v.boolean(),
          warranty: v.boolean(),
          roadAssistance: v.boolean()
        })
      }),
      businessFactors: v.object({
        cashFlowConstraints: v.object({
          availableCash: v.number(),
          creditCapacity: v.number(),
          seasonalCashFlow: v.string(),
          workingCapitalNeeds: v.number()
        }),
        usage: v.object({
          projectedHours: v.number(),
          intensityLevel: v.string(),
          seasonal: v.boolean(),
          growth: v.string()
        }),
        strategic: v.object({
          assetOwnershipPreference: v.string(),
          technologyUpgradeFrequency: v.string(),
          balanceSheetImpact: v.string(),
          riskProfile: v.string()
        })
      })
    })
  },
  handler: async (ctx, args) => {
    const { leaseVsBuyAnalysis } = args;
    
    const costComparison = performCostComparison(leaseVsBuyAnalysis);
    const cashFlowAnalysis = analyzeCashFlowImpact(leaseVsBuyAnalysis);
    const riskAnalysis = compareRiskProfiles(leaseVsBuyAnalysis);
    const taxImplications = analyzeTaxImplications(leaseVsBuyAnalysis);
    const strategicFit = evaluateStrategicFit(leaseVsBuyAnalysis);
    
    await ctx.db.insert("leaseVsBuyAnalyses", {
      analysis: leaseVsBuyAnalysis,
      costComparison,
      cashFlowAnalysis,
      riskAnalysis,
      taxImplications,
      strategicFit,
      timestamp: new Date().toISOString(),
      agentId: "equipment-roi-specialist"
    });
    
    return {
      success: true,
      costComparison,
      cashFlowAnalysis,
      riskAnalysis,
      taxImplications,
      strategicFit,
      recommendation: generateLeaseVsBuyRecommendation(costComparison, cashFlowAnalysis, strategicFit),
      decisionFactors: identifyKeyDecisionFactors(leaseVsBuyAnalysis)
    };
  }
});

function performROICalculations(analysis: any) {
  const equipment = analysis.equipmentDetails;
  const financial = analysis.financialData;
  const operational = analysis.operationalMetrics;
  
  // Basic ROI calculations
  const annualRevenue = financial.revenue.directRevenue;
  const annualCosts = financial.costs.totalAnnualCosts;
  const netIncome = annualRevenue - annualCosts;
  const totalInvestment = equipment.purchasePrice + financial.financing.downPayment;
  
  const basicROI = (netIncome / totalInvestment) * 100;
  
  // Cash-on-cash return
  const cashInvested = financial.financing.downPayment;
  const annualCashFlow = netIncome - financial.financing.monthlyPayment * 12;
  const cashOnCashReturn = (annualCashFlow / cashInvested) * 100;
  
  // Payback period
  const paybackPeriod = totalInvestment / netIncome;
  
  // Internal Rate of Return (simplified)
  const irr = calculateIRR(analysis);
  
  // Net Present Value
  const npv = calculateNPV(analysis, 0.08, equipment.purchaseDate);
  
  return {
    basicROI,
    cashOnCashReturn,
    paybackPeriod,
    irr,
    npv,
    annualRevenue,
    annualCosts,
    netIncome,
    totalInvestment,
    profitMargin: (netIncome / annualRevenue) * 100,
    assetTurnover: annualRevenue / totalInvestment,
    returnOnAssets: (netIncome / totalInvestment) * 100
  };
}

function analyzeProfitability(analysis: any) {
  const revenue = analysis.financialData.revenue;
  const costs = analysis.financialData.costs;
  const operational = analysis.operationalMetrics;
  
  // Revenue analysis
  const revenuePerHour = revenue.revenuePerHour;
  const utilizationRate = revenue.utilizationRate;
  const effectiveRevenuePerHour = revenuePerHour * (utilizationRate / 100);
  
  // Cost structure analysis
  const variableCostPerHour = (costs.operatingCosts.fuel + costs.operatingCosts.maintenance + costs.operatingCosts.operator) / revenue.billableHours;
  const fixedCostPerHour = (costs.capitalCosts.depreciation + costs.capitalCosts.financing + costs.operatingCosts.insurance + costs.operatingCosts.storage) / 2080; // Assuming 2080 available hours
  
  const totalCostPerHour = variableCostPerHour + fixedCostPerHour;
  const profitPerHour = effectiveRevenuePerHour - totalCostPerHour;
  
  // Break-even analysis
  const breakEvenHours = costs.capitalCosts.depreciation / profitPerHour;
  const breakEvenUtilization = (breakEvenHours / 2080) * 100;
  
  return {
    revenueAnalysis: {
      effectiveRevenuePerHour,
      utilizationImpact: (utilizationRate / 100) * revenuePerHour,
      potentialRevenue: revenuePerHour * 2080,
      actualRevenue: effectiveRevenuePerHour * revenue.billableHours
    },
    costStructure: {
      variableCostPerHour,
      fixedCostPerHour,
      totalCostPerHour,
      variableCostRatio: (variableCostPerHour / totalCostPerHour) * 100,
      fixedCostRatio: (fixedCostPerHour / totalCostPerHour) * 100
    },
    profitability: {
      profitPerHour,
      profitMargin: (profitPerHour / effectiveRevenuePerHour) * 100,
      contributionMargin: ((effectiveRevenuePerHour - variableCostPerHour) / effectiveRevenuePerHour) * 100
    },
    breakEvenAnalysis: {
      breakEvenHours,
      breakEvenUtilization,
      safetyMargin: utilizationRate - breakEvenUtilization
    }
  };
}

function performLifecycleAnalysis(analysis: any) {
  const equipment = analysis.equipmentDetails;
  const purchaseDate = new Date(equipment.purchaseDate);
  const currentDate = new Date();
  const age = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24 * 365);
  
  // Depreciation analysis
  const purchasePrice = equipment.purchasePrice;
  const currentMarketValue = analysis.marketConditions.replacement.currentMarketValue;
  const accumulatedDepreciation = purchasePrice - currentMarketValue;
  const annualDepreciation = accumulatedDepreciation / age;
  
  // Remaining life estimation
  const estimatedTotalLife = 10; // Default 10 years for tree service equipment
  const remainingLife = Math.max(0, estimatedTotalLife - age);
  const remainingValue = Math.max(0, currentMarketValue - (annualDepreciation * remainingLife));
  
  // Lifecycle cost analysis
  const totalCostOfOwnership = calculateTotalCostOfOwnership(analysis, estimatedTotalLife);
  const annualizedCost = totalCostOfOwnership / estimatedTotalLife;
  
  return {
    age,
    remainingLife,
    depreciationAnalysis: {
      purchasePrice,
      currentMarketValue,
      accumulatedDepreciation,
      annualDepreciation,
      depreciationRate: (annualDepreciation / purchasePrice) * 100,
      remainingValue
    },
    lifecycleCosts: {
      totalCostOfOwnership,
      annualizedCost,
      costPerHour: annualizedCost / 2080
    },
    lifecycleStage: categorizeLifecycleStage(age, estimatedTotalLife),
    recommendations: generateLifecycleRecommendations(age, remainingLife, analysis)
  };
}

function compareToBenchmarks(analysis: any) {
  // Industry benchmarks (these would be sourced from industry data)
  const industryBenchmarks = {
    utilizationRate: 75,
    revenuePerHour: 150,
    roi: 15,
    paybackPeriod: 4,
    operatingCostRatio: 65,
    maintenanceCostRatio: 12,
    profitMargin: 20
  };
  
  const currentMetrics = {
    utilizationRate: analysis.financialData.revenue.utilizationRate,
    revenuePerHour: analysis.financialData.revenue.revenuePerHour,
    roi: performROICalculations(analysis).basicROI,
    paybackPeriod: performROICalculations(analysis).paybackPeriod,
    operatingCostRatio: (analysis.financialData.costs.operatingCosts.fuel + analysis.financialData.costs.operatingCosts.maintenance) / analysis.financialData.revenue.directRevenue * 100,
    maintenanceCostRatio: (analysis.financialData.costs.operatingCosts.maintenance / analysis.financialData.revenue.directRevenue) * 100,
    profitMargin: analyzeProfitability(analysis).profitability.profitMargin
  };
  
  const comparison = {};
  Object.keys(industryBenchmarks).forEach(metric => {
    const benchmark = industryBenchmarks[metric as keyof typeof industryBenchmarks];
    const actual = currentMetrics[metric as keyof typeof currentMetrics];
    comparison[metric as keyof typeof comparison] = {
      actual,
      benchmark,
      variance: actual - benchmark,
      variancePercentage: ((actual - benchmark) / benchmark) * 100,
      performance: actual >= benchmark ? "ABOVE_BENCHMARK" : "BELOW_BENCHMARK"
    };
  });
  
  return {
    comparison,
    overallPerformance: calculateOverallBenchmarkPerformance(comparison),
    strengths: identifyBenchmarkStrengths(comparison),
    improvementAreas: identifyBenchmarkImprovementAreas(comparison)
  };
}

function generateOptimizationRecommendations(analysis: any, roiCalculations: any) {
  const recommendations = [];
  
  // Revenue optimization
  if (analysis.financialData.revenue.utilizationRate < 70) {
    recommendations.push({
      category: "UTILIZATION",
      priority: "HIGH",
      recommendation: "Increase equipment utilization through better scheduling and demand management",
      potentialImpact: "15-25% revenue increase",
      implementation: "Implement route optimization and demand forecasting",
      timeline: "3-6 months",
      investment: 5000
    });
  }
  
  // Cost optimization
  if (analysis.financialData.costs.operatingCosts.maintenance > 50000) {
    recommendations.push({
      category: "MAINTENANCE",
      priority: "MEDIUM",
      recommendation: "Implement predictive maintenance program to reduce costs",
      potentialImpact: "10-20% maintenance cost reduction",
      implementation: "Install telematics and maintenance management system",
      timeline: "2-4 months",
      investment: 8000
    });
  }
  
  // Replacement timing
  const lifecycleAnalysis = performLifecycleAnalysis(analysis);
  if (lifecycleAnalysis.lifecycleStage === "DECLINING") {
    recommendations.push({
      category: "REPLACEMENT",
      priority: "HIGH",
      recommendation: "Consider equipment replacement due to declining performance",
      potentialImpact: "20-30% efficiency improvement",
      implementation: "Evaluate replacement options and financing",
      timeline: "6-12 months",
      investment: analysis.marketConditions.replacement.replacementCost
    });
  }
  
  // Technology upgrades
  if (analysis.marketConditions.replacement.technologyAdvancement === "significant") {
    recommendations.push({
      category: "TECHNOLOGY",
      priority: "MEDIUM",
      recommendation: "Evaluate technology upgrade opportunities",
      potentialImpact: "10-15% productivity improvement",
      implementation: "Assess retrofit options or new equipment features",
      timeline: "3-9 months",
      investment: 15000
    });
  }
  
  return recommendations;
}

function categorizeInvestmentRating(roiCalculations: any): string {
  const roi = roiCalculations.basicROI;
  const payback = roiCalculations.paybackPeriod;
  
  if (roi > 20 && payback < 3) return "EXCELLENT";
  if (roi > 15 && payback < 4) return "GOOD";
  if (roi > 10 && payback < 5) return "FAIR";
  if (roi > 5 && payback < 7) return "POOR";
  return "UNACCEPTABLE";
}

function generateActionPlan(analysis: any, roiCalculations: any) {
  const actionPlan = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };
  
  // Immediate actions (0-30 days)
  if (roiCalculations.basicROI < 10) {
    actionPlan.immediate.push("Conduct detailed cost analysis to identify immediate savings");
    actionPlan.immediate.push("Review pricing strategy and utilization scheduling");
  }
  
  // Short-term actions (1-6 months)
  if (analysis.financialData.revenue.utilizationRate < 70) {
    actionPlan.shortTerm.push("Implement utilization optimization program");
    actionPlan.shortTerm.push("Develop demand forecasting capabilities");
  }
  
  // Long-term actions (6+ months)
  const lifecycleStage = performLifecycleAnalysis(analysis).lifecycleStage;
  if (lifecycleStage === "DECLINING" || lifecycleStage === "END_OF_LIFE") {
    actionPlan.longTerm.push("Develop equipment replacement strategy");
    actionPlan.longTerm.push("Evaluate fleet optimization opportunities");
  }
  
  return actionPlan;
}

function analyzeOptimalTiming(analysis: any) {
  const current = analysis.currentEquipment;
  const constraints = analysis.financialConstraints;
  const strategic = analysis.strategicConsiderations;
  
  // Economic timing factors
  const maintenanceCostTrend = current.annualMaintenanceCosts > 20000 ? "INCREASING" : "STABLE";
  const productivityTrend = current.productivityTrend;
  const reliabilityScore = current.reliabilityScore;
  
  // Financial readiness
  const budgetAdequacy = constraints.availableBudget > Math.min(...analysis.replacementOptions.map((o: any) => o.netCost));
  const cashFlowSupport = constraints.cashFlowProjection.every((cf: any) => cf.netCashFlow > 0);
  
  // Strategic timing
  const businessGrowthPhase = strategic.businessGrowthPlans;
  const technologyCycle = strategic.technologyRoadmap;
  
  let timingScore = 0;
  
  // Add points for replacement urgency
  if (current.condition === "poor") timingScore += 30;
  if (current.reliabilityScore < 70) timingScore += 25;
  if (maintenanceCostTrend === "INCREASING") timingScore += 20;
  if (productivityTrend === "declining") timingScore += 15;
  
  // Add points for financial readiness
  if (budgetAdequacy) timingScore += 20;
  if (cashFlowSupport) timingScore += 15;
  
  // Add points for strategic alignment
  if (businessGrowthPhase === "expansion") timingScore += 10;
  
  return {
    timingScore,
    timingRecommendation: categorizeTimingRecommendation(timingScore),
    urgencyFactors: identifyUrgencyFactors(current, timingScore),
    optimalWindow: calculateOptimalWindow(timingScore, constraints),
    riskFactors: identifyTimingRisks(analysis, timingScore)
  };
}

function compareReplacementOptions(analysis: any) {
  const options = analysis.replacementOptions;
  const current = analysis.currentEquipment;
  
  const comparison = options.map((option: any) => {
    const totalCostOfOwnership = calculateOptionTCO(option, 7); // 7-year analysis
    const netPresentValue = calculateOptionNPV(option, 0.08, 7);
    const paybackPeriod = option.netCost / (option.maintenanceSavings + (option.efficiencyGains * 2000)); // Assume $2000 per efficiency point
    
    return {
      ...option,
      analysis: {
        totalCostOfOwnership,
        netPresentValue,
        paybackPeriod,
        riskAdjustedReturn: calculateRiskAdjustedReturn(option),
        strategicValue: calculateStrategicValue(option, analysis.strategicConsiderations)
      }
    };
  });
  
  // Rank options
  const rankedOptions = comparison.sort((a, b) => {
    // Sort by NPV primarily, then by strategic value
    const npvDiff = b.analysis.netPresentValue - a.analysis.netPresentValue;
    if (Math.abs(npvDiff) > 10000) return npvDiff > 0 ? 1 : -1;
    return b.analysis.strategicValue - a.analysis.strategicValue;
  });
  
  return {
    options: rankedOptions,
    recommendedOption: rankedOptions[0],
    comparisonCriteria: [
      "Net Present Value",
      "Payback Period",
      "Total Cost of Ownership",
      "Strategic Alignment",
      "Risk Profile"
    ]
  };
}

function assessReplacementRisks(analysis: any) {
  const risks = [];
  
  // Financial risks
  if (analysis.financialConstraints.availableBudget < Math.min(...analysis.replacementOptions.map((o: any) => o.netCost))) {
    risks.push({
      category: "FINANCIAL",
      risk: "Insufficient budget for optimal replacement option",
      impact: "HIGH",
      mitigation: "Explore financing options or phased replacement"
    });
  }
  
  // Operational risks
  if (analysis.operationalImpact.integrationComplexity === "high") {
    risks.push({
      category: "OPERATIONAL",
      risk: "Complex integration may cause service disruption",
      impact: "MEDIUM",
      mitigation: "Develop comprehensive integration plan with backup procedures"
    });
  }
  
  // Market risks
  if (analysis.strategicConsiderations.competitivePositioning === "weak") {
    risks.push({
      category: "MARKET",
      risk: "Delayed replacement may weaken competitive position",
      impact: "HIGH",
      mitigation: "Prioritize replacement to maintain service capabilities"
    });
  }
  
  // Technology risks
  if (analysis.strategicConsiderations.technologyRoadmap === "rapidly_evolving") {
    risks.push({
      category: "TECHNOLOGY",
      risk: "New technology may quickly obsolete replacement",
      impact: "MEDIUM",
      mitigation: "Consider lease options or technology upgrade provisions"
    });
  }
  
  return {
    risks,
    overallRiskLevel: calculateOverallRiskLevel(risks),
    mitigationStrategy: developRiskMitigationStrategy(risks)
  };
}

function projectFinancialImpact(analysis: any) {
  const bestOption = compareReplacementOptions(analysis).recommendedOption;
  const current = analysis.currentEquipment;
  
  // Calculate financial impact over 5 years
  const projectionYears = 5;
  const projections = [];
  
  for (let year = 1; year <= projectionYears; year++) {
    const currentScenario = {
      revenue: current.annualRevenue || 0,
      costs: current.operatingCosts + current.annualMaintenanceCosts * (1 + 0.05) ** year, // 5% annual increase
      netIncome: 0
    };
    currentScenario.netIncome = currentScenario.revenue - currentScenario.costs;
    
    const replacementScenario = {
      revenue: (current.annualRevenue || 0) * (1 + bestOption.efficiencyGains / 100),
      costs: current.operatingCosts * 0.9 + bestOption.maintenanceSavings, // 10% operating cost reduction
      netIncome: 0
    };
    replacementScenario.netIncome = replacementScenario.revenue - replacementScenario.costs;
    
    projections.push({
      year,
      currentScenario,
      replacementScenario,
      netBenefit: replacementScenario.netIncome - currentScenario.netIncome,
      cumulativeBenefit: year === 1 ? 
        replacementScenario.netIncome - currentScenario.netIncome :
        projections[year - 2].cumulativeBenefit + (replacementScenario.netIncome - currentScenario.netIncome)
    });
  }
  
  return {
    projections,
    totalBenefit: projections.reduce((sum, p) => sum + p.netBenefit, 0),
    netPresentValue: projections.reduce((npv, p) => npv + (p.netBenefit / Math.pow(1.08, p.year)), 0),
    breakEvenYear: projections.find(p => p.cumulativeBenefit > bestOption.netCost)?.year || null
  };
}

function evaluateStrategicAlignment(analysis: any) {
  const strategic = analysis.strategicConsiderations;
  const alignment = {};
  
  // Business growth alignment
  if (strategic.businessGrowthPlans === "expansion") {
    alignment.growthAlignment = "HIGH";
  } else if (strategic.businessGrowthPlans === "maintenance") {
    alignment.growthAlignment = "MEDIUM";
  } else {
    alignment.growthAlignment = "LOW";
  }
  
  // Service expansion alignment
  const serviceExpansionScore = strategic.serviceExpansion.length * 20;
  alignment.serviceAlignment = serviceExpansionScore > 60 ? "HIGH" : serviceExpansionScore > 30 ? "MEDIUM" : "LOW";
  
  // Technology roadmap alignment
  if (strategic.technologyRoadmap === "leading_edge") {
    alignment.technologyAlignment = "HIGH";
  } else if (strategic.technologyRoadmap === "current_generation") {
    alignment.technologyAlignment = "MEDIUM";
  } else {
    alignment.technologyAlignment = "LOW";
  }
  
  // Competitive positioning alignment
  alignment.competitiveAlignment = strategic.competitivePositioning === "strong" ? "HIGH" : 
                                  strategic.competitivePositioning === "moderate" ? "MEDIUM" : "LOW";
  
  return {
    alignmentScores: alignment,
    overallAlignment: calculateOverallAlignment(alignment),
    strategicPriorities: identifyStrategicPriorities(strategic),
    recommendedFocus: generateStrategicFocus(alignment, strategic)
  };
}

function determineRecommendedTiming(timingAnalysis: any, riskAssessment: any): string {
  const timingScore = timingAnalysis.timingScore;
  const riskLevel = riskAssessment.overallRiskLevel;
  
  if (timingScore > 80 && riskLevel !== "HIGH") return "IMMEDIATE";
  if (timingScore > 60) return "WITHIN_6_MONTHS";
  if (timingScore > 40) return "WITHIN_12_MONTHS";
  if (timingScore > 20) return "WITHIN_24_MONTHS";
  return "DEFER";
}

function identifyPreferredOption(optionComparison: any, strategicAlignment: any) {
  const recommendedOption = optionComparison.recommendedOption;
  const alignment = strategicAlignment.overallAlignment;
  
  return {
    optionId: recommendedOption.optionId,
    rationale: generateOptionRationale(recommendedOption, alignment),
    keyBenefits: identifyKeyBenefits(recommendedOption),
    implementation: generateImplementationGuidance(recommendedOption),
    successFactors: identifySuccessFactors(recommendedOption)
  };
}

// Helper functions for calculations and analysis
function calculateIRR(analysis: any): number {
  // Simplified IRR calculation
  const roi = performROICalculations(analysis).basicROI;
  return roi * 0.8; // Conservative estimate
}

function calculateNPV(analysis: any, discountRate: number, purchaseDate: string): number {
  const netIncome = analysis.financialData.revenue.directRevenue - analysis.financialData.costs.totalAnnualCosts;
  const years = 7; // Assume 7-year analysis period
  let npv = -analysis.equipmentDetails.purchasePrice;
  
  for (let year = 1; year <= years; year++) {
    npv += netIncome / Math.pow(1 + discountRate, year);
  }
  
  // Add terminal value (residual value)
  npv += analysis.marketConditions.replacement.currentMarketValue / Math.pow(1 + discountRate, years);
  
  return npv;
}

function calculateTotalCostOfOwnership(analysis: any, years: number): number {
  const purchasePrice = analysis.equipmentDetails.purchasePrice;
  const annualCosts = analysis.financialData.costs.totalAnnualCosts;
  const residualValue = analysis.marketConditions.replacement.currentMarketValue;
  
  return purchasePrice + (annualCosts * years) - residualValue;
}

function categorizeLifecycleStage(age: number, totalLife: number): string {
  const lifePercentage = (age / totalLife) * 100;
  
  if (lifePercentage < 20) return "NEW";
  if (lifePercentage < 40) return "GROWTH";
  if (lifePercentage < 60) return "MATURE";
  if (lifePercentage < 80) return "DECLINING";
  return "END_OF_LIFE";
}

function generateLifecycleRecommendations(age: number, remainingLife: number, analysis: any): string[] {
  const recommendations = [];
  
  if (remainingLife < 2) {
    recommendations.push("Begin replacement planning immediately");
    recommendations.push("Evaluate current market values for trade-in");
  } else if (remainingLife < 5) {
    recommendations.push("Start monitoring replacement options");
    recommendations.push("Budget for replacement in capital planning");
  }
  
  if (age > 5) {
    recommendations.push("Implement preventive maintenance program");
    recommendations.push("Monitor performance trends closely");
  }
  
  return recommendations;
}

function calculateOverallBenchmarkPerformance(comparison: any): string {
  const metrics = Object.values(comparison);
  const aboveBenchmark = metrics.filter((m: any) => m.performance === "ABOVE_BENCHMARK").length;
  const totalMetrics = metrics.length;
  const percentage = (aboveBenchmark / totalMetrics) * 100;
  
  if (percentage >= 80) return "EXCELLENT";
  if (percentage >= 60) return "GOOD";
  if (percentage >= 40) return "FAIR";
  return "POOR";
}

function identifyBenchmarkStrengths(comparison: any): string[] {
  return Object.entries(comparison)
    .filter(([_, value]: [string, any]) => value.performance === "ABOVE_BENCHMARK")
    .map(([key, _]) => key);
}

function identifyBenchmarkImprovementAreas(comparison: any): string[] {
  return Object.entries(comparison)
    .filter(([_, value]: [string, any]) => value.performance === "BELOW_BENCHMARK")
    .map(([key, _]) => key);
}

// Additional helper functions would continue for remaining calculations...

function analyzeUtilizationGaps(optimization: any): any {
  return {
    currentGap: optimization.performanceTargets.targetUtilizationRate - optimization.currentUtilization.utilizationRate,
    revenueImpact: calculateRevenueImpact(optimization),
    rootCauses: identifyUtilizationRootCauses(optimization),
    improvementPotential: calculateImprovementPotential(optimization)
  };
}

function createUtilizationOptimizationPlan(optimization: any): any {
  return {
    schedulingImprovements: developSchedulingImprovements(optimization),
    operationalEnhancements: developOperationalEnhancements(optimization),
    marketExpansionPlan: developMarketExpansionPlan(optimization),
    technologyInvestments: identifyTechnologyInvestments(optimization)
  };
}

function developImplementationRoadmap(optimization: any, plan: any): any {
  return {
    phase1: { name: "Quick Wins", duration: "30 days", actions: ["Route optimization", "Basic training"] },
    phase2: { name: "Process Improvements", duration: "90 days", actions: ["System upgrades", "Advanced training"] },
    phase3: { name: "Strategic Initiatives", duration: "180 days", actions: ["Market expansion", "Technology adoption"] }
  };
}

function projectUtilizationImpact(optimization: any, plan: any): any {
  return {
    utilizationIncrease: 15,
    revenueIncrease: 25000,
    profitabilityImprovement: 18,
    timeline: "6 months"
  };
}

function createMonitoringStrategy(optimization: any): any {
  return {
    kpis: ["Utilization rate", "Revenue per hour", "Idle time percentage"],
    frequency: "Weekly",
    reportingStructure: "Dashboard with alerts",
    reviewCycle: "Monthly performance reviews"
  };
}

function identifyPriorityActions(plan: any): string[] {
  return [
    "Implement route optimization software",
    "Conduct operator efficiency training",
    "Establish predictive maintenance schedule"
  ];
}

function calculateOptimizationROI(optimization: any, projections: any): number {
  const investment = 25000; // Estimated optimization investment
  const annualBenefit = projections.revenueIncrease;
  return ((annualBenefit - investment) / investment) * 100;
}

// Fleet optimization helper functions
function analyzeCurrentFleet(fleetOptimization: any): any {
  return {
    performanceDistribution: analyzePerformanceDistribution(fleetOptimization.currentFleet),
    utilizationAnalysis: analyzeFleetUtilization(fleetOptimization.currentFleet),
    costEfficiencyAnalysis: analyzeFleetCostEfficiency(fleetOptimization.currentFleet),
    capacityAssessment: assessFleetCapacity(fleetOptimization)
  };
}

function developFleetOptimizationStrategy(fleetOptimization: any, analysis: any): any {
  return {
    rightsizing: developRightsizingStrategy(fleetOptimization, analysis),
    modernization: developModernizationStrategy(fleetOptimization, analysis),
    diversification: developDiversificationStrategy(fleetOptimization, analysis),
    rationalization: developRationalizationStrategy(fleetOptimization, analysis)
  };
}

function generatePortfolioRecommendations(fleetOptimization: any, analysis: any): any[] {
  return [
    {
      action: "REPLACE",
      equipmentIds: ["EQ001", "EQ003"],
      rationale: "Low ROI and high maintenance costs",
      priority: "HIGH",
      investment: 150000,
      expectedROI: 18
    },
    {
      action: "RETAIN",
      equipmentIds: ["EQ002", "EQ004"],
      rationale: "Strong performance and utilization",
      priority: "LOW",
      investment: 5000,
      expectedROI: 12
    }
  ];
}

function createFleetImplementationPlan(fleetOptimization: any, strategy: any): any {
  return {
    timeline: "18 months",
    phases: [
      { phase: "Assessment", duration: "2 months", activities: ["Detailed equipment evaluation", "Market analysis"] },
      { phase: "Optimization", duration: "6 months", activities: ["Replace underperforming units", "Implement efficiency measures"] },
      { phase: "Integration", duration: "10 months", activities: ["Staff training", "Process optimization", "Performance monitoring"] }
    ],
    budgetRequirement: 250000,
    resourceAllocation: "2 FTE project team"
  };
}

function projectFleetPerformance(fleetOptimization: any, strategy: any): any {
  return {
    utilizationImprovement: 12,
    roiImprovement: 8,
    costReduction: 15,
    revenueIncrease: 20,
    paybackPeriod: 3.2
  };
}

function calculateFleetOptimizationScore(analysis: any): number {
  return 78; // Placeholder calculation
}

function identifyFleetPriorityActions(strategy: any): string[] {
  return [
    "Replace equipment with ROI below 10%",
    "Implement fleet management system",
    "Develop preventive maintenance program"
  ];
}

// Lease vs Buy helper functions
function performCostComparison(analysis: any): any {
  const purchase = analysis.purchaseOption;
  const lease = analysis.leaseOption;
  const years = lease.leaseTerm;
  
  const purchaseTotalCost = purchase.purchasePrice + (purchase.financing.monthlyPayment * 12 * years) - analysis.equipmentSpecification.residualValue;
  const leaseTotalCost = lease.monthlyPayment * 12 * years;
  
  return {
    purchaseTotal: purchaseTotalCost,
    leaseTotal: leaseTotalCost,
    difference: purchaseTotalCost - leaseTotalCost,
    recommendation: purchaseTotalCost < leaseTotalCost ? "BUY" : "LEASE",
    sensitivity: calculateCostSensitivity(analysis)
  };
}

function analyzeCashFlowImpact(analysis: any): any {
  return {
    purchaseCashFlow: analyzePurchaseCashFlow(analysis),
    leaseCashFlow: analyzeLeaseCashFlow(analysis),
    workingCapitalImpact: calculateWorkingCapitalImpact(analysis),
    creditImpact: assessCreditImpact(analysis)
  };
}

function compareRiskProfiles(analysis: any): any {
  return {
    purchaseRisks: ["Obsolescence risk", "Maintenance cost risk", "Residual value risk"],
    leaseRisks: ["Mileage overage risk", "Wear and tear charges", "Early termination penalties"],
    riskAssessment: "Purchase carries higher long-term risk but better control"
  };
}

function analyzeTaxImplications(analysis: any): any {
  return {
    purchaseBenefits: ["Depreciation deduction", "Interest deduction", "Section 179 deduction"],
    leaseBenefits: ["Full payment deductibility", "No asset on balance sheet"],
    netTaxImpact: calculateNetTaxImpact(analysis),
    recommendation: "Consult tax advisor for specific situation"
  };
}

function evaluateStrategicFit(analysis: any): any {
  const business = analysis.businessFactors;
  
  return {
    assetStrategy: business.strategic.assetOwnershipPreference === "own" ? "FAVOR_PURCHASE" : "FAVOR_LEASE",
    cashFlowFit: business.cashFlowConstraints.availableCash > 50000 ? "PURCHASE_VIABLE" : "LEASE_PREFERRED",
    flexibilityNeeds: business.strategic.technologyUpgradeFrequency === "frequent" ? "FAVOR_LEASE" : "FAVOR_PURCHASE",
    overallFit: calculateOverallStrategicFit(analysis)
  };
}

function generateLeaseVsBuyRecommendation(cost: any, cashFlow: any, strategic: any): any {
  let score = 0;
  
  if (cost.recommendation === "BUY") score += 2;
  if (cashFlow.workingCapitalImpact < 0) score += 1; // Purchase preserves working capital
  if (strategic.overallFit === "PURCHASE") score += 2;
  
  return {
    recommendation: score >= 3 ? "PURCHASE" : "LEASE",
    confidence: calculateRecommendationConfidence(score),
    rationale: generateRecommendationRationale(cost, cashFlow, strategic),
    conditions: identifyDecisionConditions(cost, cashFlow, strategic)
  };
}

function identifyKeyDecisionFactors(analysis: any): string[] {
  return [
    "Total cost of ownership",
    "Cash flow requirements",
    "Technology upgrade frequency",
    "Usage intensity",
    "Tax implications",
    "Asset ownership preference"
  ];
}

// Placeholder implementations for complex calculations
function calculateRevenueImpact(optimization: any): number { return 25000; }
function identifyUtilizationRootCauses(optimization: any): string[] { return ["Poor scheduling", "Equipment downtime"]; }
function calculateImprovementPotential(optimization: any): number { return 20; }
function developSchedulingImprovements(optimization: any): any { return { improvements: "Route optimization" }; }
function developOperationalEnhancements(optimization: any): any { return { enhancements: "Training programs" }; }
function developMarketExpansionPlan(optimization: any): any { return { plan: "Geographic expansion" }; }
function identifyTechnologyInvestments(optimization: any): string[] { return ["Telematics", "GPS tracking"]; }

function analyzePerformanceDistribution(fleet: any[]): any { return { distribution: "Normal" }; }
function analyzeFleetUtilization(fleet: any[]): any { return { average: 75 }; }
function analyzeFleetCostEfficiency(fleet: any[]): any { return { efficiency: "Good" }; }
function assessFleetCapacity(fleetOptimization: any): any { return { adequacy: "Sufficient" }; }

function developRightsizingStrategy(fleetOptimization: any, analysis: any): any { return { strategy: "Reduce by 2 units" }; }
function developModernizationStrategy(fleetOptimization: any, analysis: any): any { return { strategy: "Upgrade 3 units" }; }
function developDiversificationStrategy(fleetOptimization: any, analysis: any): any { return { strategy: "Add specialized equipment" }; }
function developRationalizationStrategy(fleetOptimization: any, analysis: any): any { return { strategy: "Standardize models" }; }

function calculateCostSensitivity(analysis: any): any { return { sensitivity: "Low" }; }
function analyzePurchaseCashFlow(analysis: any): any { return { cashFlow: "Stable" }; }
function analyzeLeaseCashFlow(analysis: any): any { return { cashFlow: "Predictable" }; }
function calculateWorkingCapitalImpact(analysis: any): number { return -10000; }
function assessCreditImpact(analysis: any): string { return "Minimal" }; }
function calculateNetTaxImpact(analysis: any): number { return 5000; }
function calculateOverallStrategicFit(analysis: any): string { return "PURCHASE"; }
function calculateRecommendationConfidence(score: number): string { return score >= 4 ? "HIGH" : "MEDIUM"; }
function generateRecommendationRationale(cost: any, cashFlow: any, strategic: any): string { return "Based on total cost and strategic fit"; }
function identifyDecisionConditions(cost: any, cashFlow: any, strategic: any): string[] { return ["Adequate financing available"]; }

function categorizeTimingRecommendation(score: number): string {
  if (score > 80) return "IMMEDIATE";
  if (score > 60) return "WITHIN_6_MONTHS";
  return "DEFER";
}

function identifyUrgencyFactors(current: any, score: number): string[] {
  const factors = [];
  if (current.condition === "poor") factors.push("Poor equipment condition");
  if (current.reliabilityScore < 70) factors.push("Low reliability score");
  return factors;
}

function calculateOptimalWindow(score: number, constraints: any): string {
  return score > 70 ? "Q1-Q2" : "Q3-Q4";
}

function identifyTimingRisks(analysis: any, score: number): string[] {
  return ["Market volatility", "Technology changes"];
}

function calculateOptionTCO(option: any, years: number): number {
  return option.netCost + (option.maintenanceSavings * years);
}

function calculateOptionNPV(option: any, rate: number, years: number): number {
  return option.projectedROI * 1000; // Simplified
}

function calculateRiskAdjustedReturn(option: any): number {
  return option.projectedROI * 0.9; // 10% risk adjustment
}

function calculateStrategicValue(option: any, strategic: any): number {
  return option.features.length * 10; // Simplified
}

function calculateOverallRiskLevel(risks: any[]): string {
  const highRisks = risks.filter(r => r.impact === "HIGH").length;
  return highRisks > 1 ? "HIGH" : "MEDIUM";
}

function developRiskMitigationStrategy(risks: any[]): string {
  return "Comprehensive risk management plan";
}

function calculateOverallAlignment(alignment: any): string {
  const scores = Object.values(alignment);
  const highCount = scores.filter(s => s === "HIGH").length;
  return highCount >= 2 ? "HIGH" : "MEDIUM";
}

function identifyStrategicPriorities(strategic: any): string[] {
  return ["Growth", "Technology", "Efficiency"];
}

function generateStrategicFocus(alignment: any, strategic: any): string {
  return "Focus on growth-enabling investments";
}

function generateOptionRationale(option: any, alignment: string): string {
  return `Best NPV with ${alignment} strategic alignment`;
}

function identifyKeyBenefits(option: any): string[] {
  return ["Higher ROI", "Better efficiency", "Modern features"];
}

function generateImplementationGuidance(option: any): string {
  return "Phased implementation with training program";
}

function identifySuccessFactors(option: any): string[] {
  return ["Proper training", "Adequate support", "Performance monitoring"];
}

export const getEquipmentROIAnalytics = query({
  args: {
    timeframe: v.object({
      startDate: v.string(),
      endDate: v.string()
    })
  },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("equipmentROIAnalyses")
      .filter(q => 
        q.gte(q.field("timestamp"), args.timeframe.startDate) &&
        q.lte(q.field("timestamp"), args.timeframe.endDate)
      )
      .collect();
    
    const analytics = {
      totalAnalyses: analyses.length,
      averageROI: calculateAverageROI(analyses),
      utilizationTrends: analyzeUtilizationTrends(analyses),
      profitabilityAnalysis: analyzeProfitabilityTrends(analyses),
      replacementRecommendations: compileReplacementRecommendations(analyses),
      fleetOptimizationOpportunities: identifyFleetOpportunities(analyses)
    };
    
    return analytics;
  }
});

function calculateAverageROI(analyses: any[]): number {
  if (analyses.length === 0) return 0;
  
  const totalROI = analyses.reduce((sum, analysis) => 
    sum + (analysis.roiCalculations?.basicROI || 0), 0
  );
  
  return totalROI / analyses.length;
}

function analyzeUtilizationTrends(analyses: any[]): any {
  return {
    averageUtilization: 73.2,
    trend: "IMPROVING",
    topPerformers: 15.8,
    improvementOpportunity: 22.5
  };
}

function analyzeProfitabilityTrends(analyses: any[]): any {
  return {
    averageProfitMargin: 18.7,
    profitabilityTrend: "STABLE",
    costOptimizationPotential: 12.3,
    revenueGrowthOpportunity: 16.8
  };
}

function compileReplacementRecommendations(analyses: any[]): any {
  return {
    immediateReplacements: 3,
    plannedReplacements: 7,
    deferredReplacements: 2,
    totalInvestmentRequired: 450000
  };
}

function identifyFleetOpportunities(analyses: any[]): any[] {
  return [
    {
      opportunity: "Fleet modernization",
      impact: "15-20% efficiency improvement",
      investment: 200000,
      payback: "3.5 years"
    },
    {
      opportunity: "Utilization optimization",
      impact: "10-15% revenue increase",
      investment: 25000,
      payback: "1.2 years"
    }
  ];
}