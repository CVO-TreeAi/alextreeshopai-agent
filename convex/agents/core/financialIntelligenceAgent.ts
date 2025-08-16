import { v } from "convex/values";
import { mutation, query } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Financial Intelligence Agent (Core Sub-Level)
 * 
 * Domain: Complete financial optimization and analysis across all business operations
 * Responsibilities:
 * - Cash flow optimization and forecasting
 * - Expense tracking and cost reduction identification
 * - Profitability analysis by job, customer, and service type
 * - Tax optimization and compliance monitoring
 * - Budget management and variance analysis
 * 
 * Specialist Agents Supervised:
 * - Labor Cost Optimization Specialist
 * - Equipment ROI Specialist
 * - Tax Optimization Specialist
 * - Payment Processing Specialist
 */

// Core Agent Configuration
export const FINANCIAL_AGENT_CONFIG = {
  agentId: "financial-intelligence-core",
  domain: "Complete financial optimization and analysis",
  targetMetrics: {
    profitMarginImprovement: 0.15, // 15% improvement
    cashFlowOptimization: 0.20, // 20% improvement
    expenseReduction: 0.12, // 12% reduction
    paymentCycleReduction: 0.25 // 25% faster payments
  },
  alertThresholds: {
    lowCashFlow: 0.15, // Alert if cash flow below 15% of monthly expenses
    highExpenseVariance: 0.20, // Alert if expenses >20% over budget
    latePenalties: 0.05, // Alert if late fees >5% of revenue
    profitMarginDrop: 0.10 // Alert if profit margin drops >10%
  }
};

// Profitability Analysis by Job/Service
export const analyzeProfitability = mutation({
  args: {
    analysisScope: v.object({
      timeframe: v.string(), // "job", "monthly", "quarterly", "annual"
      jobId: v.optional(v.id("jobs")),
      serviceType: v.optional(v.string()),
      customerId: v.optional(v.id("customers")),
      includeOverhead: v.boolean()
    })
  },
  handler: async (ctx, args) => {
    const { analysisScope } = args;
    
    // Get relevant jobs based on scope
    let jobs;
    if (analysisScope.jobId) {
      const job = await ctx.db.get(analysisScope.jobId);
      jobs = job ? [job] : [];
    } else {
      jobs = await ctx.db.query("jobs").collect();
      
      // Filter by service type if specified
      if (analysisScope.serviceType) {
        jobs = jobs.filter(job => job.scope?.serviceType === analysisScope.serviceType);
      }
      
      // Filter by customer if specified
      if (analysisScope.customerId) {
        jobs = jobs.filter(job => job.identity.customerId === analysisScope.customerId);
      }
      
      // Filter by timeframe
      const now = Date.now();
      const timeframeDays = {
        monthly: 30,
        quarterly: 90,
        annual: 365
      };
      const daysBack = timeframeDays[analysisScope.timeframe] || 30;
      const cutoffDate = now - (daysBack * 24 * 60 * 60 * 1000);
      
      jobs = jobs.filter(job => 
        job.identity.actualStartDate > cutoffDate ||
        job.identity.scheduledStartDate > cutoffDate
      );
    }
    
    if (jobs.length === 0) {
      return {
        message: "No jobs found for the specified criteria",
        profitabilityData: null
      };
    }
    
    // Calculate detailed profitability for each job
    const jobProfitability = [];
    let totalRevenue = 0;
    let totalDirectCosts = 0;
    let totalOverheadCosts = 0;
    
    for (const job of jobs) {
      const revenue = job.finance?.actualCostTotal || job.finance?.estimatedCostTotal || 0;
      
      // Calculate direct costs
      const laborCosts = calculateJobLaborCosts(job);
      const equipmentCosts = calculateJobEquipmentCosts(job);
      const materialCosts = job.finance?.materialCosts || 0;
      const directCosts = laborCosts + equipmentCosts + materialCosts;
      
      // Calculate overhead allocation
      const overhead = analysisScope.includeOverhead ? 
        calculateOverheadAllocation(job, revenue) : 0;
      
      const grossProfit = revenue - directCosts;
      const netProfit = grossProfit - overhead;
      const grossMargin = revenue > 0 ? (grossProfit / revenue) : 0;
      const netMargin = revenue > 0 ? (netProfit / revenue) : 0;
      
      jobProfitability.push({
        jobId: job._id,
        serviceType: job.scope?.serviceType,
        customerId: job.identity.customerId,
        revenue,
        costs: {
          labor: laborCosts,
          equipment: equipmentCosts,
          materials: materialCosts,
          overhead,
          total: directCosts + overhead
        },
        profit: {
          gross: grossProfit,
          net: netProfit,
          grossMargin,
          netMargin
        },
        treeScore: job.scope?.treeScore,
        complexity: job.scope?.complexity,
        efficiency: calculateJobEfficiency(job)
      });
      
      totalRevenue += revenue;
      totalDirectCosts += directCosts;
      totalOverheadCosts += overhead;
    }
    
    // Calculate aggregate metrics
    const totalProfit = totalRevenue - totalDirectCosts - totalOverheadCosts;
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) : 0;
    
    // Identify top performers and underperformers
    jobProfitability.sort((a, b) => b.profit.netMargin - a.profit.netMargin);
    const topPerformers = jobProfitability.slice(0, Math.ceil(jobs.length * 0.2));
    const underperformers = jobProfitability.slice(-Math.ceil(jobs.length * 0.2));
    
    // Generate insights and recommendations
    const insights = generateProfitabilityInsights(jobProfitability, analysisScope);
    
    // Store analysis
    const analysisId = await ctx.db.insert("profitabilityAnalyses", {
      analysisScope,
      totalJobs: jobs.length,
      totalRevenue,
      totalCosts: totalDirectCosts + totalOverheadCosts,
      totalProfit,
      averageMargin,
      jobProfitability,
      insights,
      createdAt: Date.now(),
      agentVersion: "financial-intelligence-v1.0"
    });
    
    return {
      analysisId,
      summary: {
        totalJobs: jobs.length,
        totalRevenue: Math.round(totalRevenue),
        totalProfit: Math.round(totalProfit),
        averageMargin: Math.round(averageMargin * 100) / 100,
        topPerformingMargin: topPerformers[0]?.profit.netMargin || 0,
        worstPerformingMargin: underperformers[0]?.profit.netMargin || 0
      },
      topPerformers: topPerformers.slice(0, 3),
      underperformers: underperformers.slice(0, 3),
      insights,
      recommendations: generateFinancialRecommendations(insights, analysisScope)
    };
  }
});

// Cash Flow Optimization
export const optimizeCashFlow = mutation({
  args: {
    forecastPeriod: v.number(), // days
    includeScheduledJobs: v.boolean()
  },
  handler: async (ctx, args) => {
    const { forecastPeriod, includeScheduledJobs } = args;
    
    // Get all jobs and financial transactions
    const jobs = await ctx.db.query("jobs").collect();
    const payments = await ctx.db.query("payments").collect();
    
    const now = Date.now();
    const forecastEnd = now + (forecastPeriod * 24 * 60 * 60 * 1000);
    
    // Calculate current cash position
    const completedRevenue = jobs
      .filter(job => job.identity.jobStatus === "completed")
      .reduce((sum, job) => sum + (job.finance?.actualCostTotal || 0), 0);
    
    const receivedPayments = payments
      .filter(payment => payment.status === "completed")
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const currentCashPosition = receivedPayments;
    const outstandingReceivables = completedRevenue - receivedPayments;
    
    // Forecast incoming cash flow
    const scheduledJobs = includeScheduledJobs ? 
      jobs.filter(job => 
        job.identity.jobStatus === "scheduled" &&
        job.identity.scheduledStartDate <= forecastEnd
      ) : [];
    
    const forecastRevenue = scheduledJobs.reduce((sum, job) => 
      sum + (job.finance?.estimatedCostTotal || 0), 0
    );
    
    // Calculate payment cycle analysis
    const paymentCycles = calculatePaymentCycles(jobs, payments);
    const averagePaymentCycle = paymentCycles.length > 0 ?
      paymentCycles.reduce((sum, cycle) => sum + cycle, 0) / paymentCycles.length : 30;
    
    // Forecast cash flow by week
    const weeklyForecast = [];
    for (let week = 0; week < Math.ceil(forecastPeriod / 7); week++) {
      const weekStart = now + (week * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
      
      // Jobs completing this week
      const weeklyCompletions = scheduledJobs.filter(job => 
        job.identity.scheduledStartDate >= weekStart &&
        job.identity.scheduledStartDate <= weekEnd
      );
      
      const weeklyRevenue = weeklyCompletions.reduce((sum, job) => 
        sum + (job.finance?.estimatedCostTotal || 0), 0
      );
      
      // Expected payments (based on payment cycle)
      const expectedPayments = weeklyRevenue * 0.8; // 80% collection rate
      const paymentDate = weekEnd + (averagePaymentCycle * 24 * 60 * 60 * 1000);
      
      weeklyForecast.push({
        week: week + 1,
        weekStart,
        weekEnd,
        jobsCompleting: weeklyCompletions.length,
        revenue: Math.round(weeklyRevenue),
        expectedPayments: Math.round(expectedPayments),
        paymentDate
      });
    }
    
    // Identify cash flow optimization opportunities
    const optimizations = identifyCashFlowOptimizations(
      outstandingReceivables,
      averagePaymentCycle,
      weeklyForecast
    );
    
    // Store cash flow analysis
    const analysisId = await ctx.db.insert("cashFlowAnalyses", {
      forecastPeriod,
      currentCashPosition: Math.round(currentCashPosition),
      outstandingReceivables: Math.round(outstandingReceivables),
      forecastRevenue: Math.round(forecastRevenue),
      averagePaymentCycle,
      weeklyForecast,
      optimizations,
      createdAt: Date.now(),
      agentVersion: "financial-intelligence-v1.0"
    });
    
    return {
      analysisId,
      cashFlow: {
        current: Math.round(currentCashPosition),
        outstandingReceivables: Math.round(outstandingReceivables),
        forecastRevenue: Math.round(forecastRevenue),
        projectedCash: Math.round(currentCashPosition + outstandingReceivables + forecastRevenue)
      },
      paymentMetrics: {
        averageCycle: Math.round(averagePaymentCycle),
        collectionRate: 0.8, // TODO: Calculate actual rate
        totalOverdue: Math.round(outstandingReceivables * 0.3) // TODO: Calculate actual overdue
      },
      weeklyForecast,
      optimizations,
      alerts: generateCashFlowAlerts(currentCashPosition, outstandingReceivables, optimizations)
    };
  }
});

// Expense Tracking and Variance Analysis
export const analyzeExpenseVariance = query({
  args: {
    timeframe: v.string(), // "monthly", "quarterly", "annual"
    categoryFilter: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { timeframe, categoryFilter } = args;
    
    // Get expense data
    const expenses = await ctx.db.query("expenses").collect();
    const budgets = await ctx.db.query("budgets").collect();
    
    // Filter by timeframe
    const now = Date.now();
    const timeframeDays = {
      monthly: 30,
      quarterly: 90,
      annual: 365
    };
    const daysBack = timeframeDays[timeframe] || 30;
    const cutoffDate = now - (daysBack * 24 * 60 * 60 * 1000);
    
    const filteredExpenses = expenses.filter(expense => 
      expense.date >= cutoffDate &&
      (!categoryFilter || expense.category === categoryFilter)
    );
    
    // Group expenses by category
    const expensesByCategory = new Map();
    filteredExpenses.forEach(expense => {
      const category = expense.category;
      if (!expensesByCategory.has(category)) {
        expensesByCategory.set(category, []);
      }
      expensesByCategory.get(category).push(expense);
    });
    
    // Calculate variance against budget
    const varianceAnalysis = [];
    for (const [category, categoryExpenses] of expensesByCategory) {
      const actualAmount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      // Find matching budget
      const budget = budgets.find(b => 
        b.category === category && 
        b.period === timeframe
      );
      const budgetAmount = budget?.amount || 0;
      
      const variance = actualAmount - budgetAmount;
      const variancePercentage = budgetAmount > 0 ? (variance / budgetAmount) : 0;
      
      varianceAnalysis.push({
        category,
        actual: Math.round(actualAmount),
        budgeted: Math.round(budgetAmount),
        variance: Math.round(variance),
        variancePercentage: Math.round(variancePercentage * 100) / 100,
        expenseCount: categoryExpenses.length,
        averageExpense: Math.round(actualAmount / categoryExpenses.length),
        trend: calculateExpenseTrend(categoryExpenses)
      });
    }
    
    // Sort by variance percentage (highest first)
    varianceAnalysis.sort((a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage));
    
    // Calculate totals
    const totalActual = varianceAnalysis.reduce((sum, item) => sum + item.actual, 0);
    const totalBudgeted = varianceAnalysis.reduce((sum, item) => sum + item.budgeted, 0);
    const totalVariance = totalActual - totalBudgeted;
    
    // Identify cost reduction opportunities
    const costReductionOpportunities = identifyCostReductions(varianceAnalysis, filteredExpenses);
    
    return {
      timeframe,
      totalActual: Math.round(totalActual),
      totalBudgeted: Math.round(totalBudgeted),
      totalVariance: Math.round(totalVariance),
      totalVariancePercentage: totalBudgeted > 0 ? Math.round((totalVariance / totalBudgeted) * 100) / 100 : 0,
      varianceAnalysis,
      costReductionOpportunities,
      alerts: generateExpenseAlerts(varianceAnalysis),
      lastUpdated: Date.now()
    };
  }
});

// Budget Planning and Optimization
export const optimizeBudget = mutation({
  args: {
    budgetPeriod: v.string(), // "monthly", "quarterly", "annual"
    adjustmentFactors: v.object({
      inflationRate: v.number(),
      growthProjection: v.number(),
      seasonalAdjustment: v.number()
    })
  },
  handler: async (ctx, args) => {
    const { budgetPeriod, adjustmentFactors } = args;
    
    // Get historical expense data
    const expenses = await ctx.db.query("expenses").collect();
    const jobs = await ctx.db.query("jobs").collect();
    
    // Analyze historical spending patterns
    const historicalAnalysis = analyzeHistoricalSpending(expenses, jobs, budgetPeriod);
    
    // Create optimized budget recommendations
    const budgetRecommendations = [];
    
    for (const [category, analysis] of historicalAnalysis.categoryAnalysis.entries()) {
      let baseAmount = analysis.averageMonthly;
      
      // Apply adjustment factors
      baseAmount *= (1 + adjustmentFactors.inflationRate);
      baseAmount *= (1 + adjustmentFactors.growthProjection);
      baseAmount *= (1 + adjustmentFactors.seasonalAdjustment);
      
      // Apply category-specific optimizations
      const optimization = getCategoryOptimization(category, analysis);
      baseAmount *= optimization.multiplier;
      
      budgetRecommendations.push({
        category,
        recommendedAmount: Math.round(baseAmount),
        historical: {
          average: Math.round(analysis.averageMonthly),
          trend: analysis.trend,
          variance: analysis.variance
        },
        optimization: {
          type: optimization.type,
          potentialSavings: Math.round(optimization.savings),
          confidence: optimization.confidence
        }
      });
    }
    
    // Calculate total budget
    const totalBudget = budgetRecommendations.reduce((sum, item) => sum + item.recommendedAmount, 0);
    
    // Store budget optimization
    const optimizationId = await ctx.db.insert("budgetOptimizations", {
      budgetPeriod,
      adjustmentFactors,
      totalBudget: Math.round(totalBudget),
      categoryBudgets: budgetRecommendations,
      historicalAnalysis,
      createdAt: Date.now(),
      agentVersion: "financial-intelligence-v1.0"
    });
    
    return {
      optimizationId,
      totalBudget: Math.round(totalBudget),
      budgetRecommendations,
      potentialSavings: budgetRecommendations.reduce((sum, item) => 
        sum + item.optimization.potentialSavings, 0
      ),
      implementation: generateBudgetImplementationPlan(budgetRecommendations),
      monitoringKPIs: generateBudgetKPIs(budgetRecommendations)
    };
  }
});

// Financial Performance Monitor
export const monitorFinancialPerformance = query({
  args: {},
  handler: async (ctx) => {
    const alerts = [];
    const metrics = {
      profitMargin: 0,
      cashFlowRatio: 0,
      expenseVariance: 0,
      paymentCycleTime: 0,
      costPerJob: 0
    };
    
    // Calculate current metrics
    const jobs = await ctx.db.query("jobs").collect();
    const expenses = await ctx.db.query("expenses").collect();
    const payments = await ctx.db.query("payments").collect();
    
    // Profit margin calculation
    const completedJobs = jobs.filter(job => job.identity.jobStatus === "completed");
    const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.finance?.actualCostTotal || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    metrics.profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) : 0;
    
    // Check against targets
    if (metrics.profitMargin < 0.15) { // Target 15% profit margin
      alerts.push({
        type: "low-profit-margin",
        severity: "warning",
        message: `Profit margin ${Math.round(metrics.profitMargin * 100)}% below target`,
        actionRequired: "Review pricing strategy and cost management"
      });
    }
    
    // Cash flow ratio
    const receivedPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const monthlyExpenses = totalExpenses / 12; // Rough monthly estimate
    metrics.cashFlowRatio = monthlyExpenses > 0 ? (receivedPayments / monthlyExpenses) : 0;
    
    if (metrics.cashFlowRatio < FINANCIAL_AGENT_CONFIG.alertThresholds.lowCashFlow) {
      alerts.push({
        type: "low-cash-flow",
        severity: "critical",
        message: `Cash flow ratio ${Math.round(metrics.cashFlowRatio * 100)}% below safe threshold`,
        actionRequired: "Accelerate collections and defer non-essential expenses"
      });
    }
    
    // Payment cycle analysis
    const paymentCycles = calculatePaymentCycles(jobs, payments);
    metrics.paymentCycleTime = paymentCycles.length > 0 ?
      paymentCycles.reduce((sum, cycle) => sum + cycle, 0) / paymentCycles.length : 0;
    
    if (metrics.paymentCycleTime > 45) { // Target 30-day payment cycle
      alerts.push({
        type: "slow-payment-cycle",
        severity: "warning",
        message: `Average payment cycle ${Math.round(metrics.paymentCycleTime)} days exceeds target`,
        actionRequired: "Implement faster payment collection strategies"
      });
    }
    
    return {
      metrics,
      alerts,
      lastUpdated: Date.now(),
      agentStatus: "active",
      recommendations: alerts.length > 0 ? 
        ["Optimize cash flow management", "Review expense controls", "Accelerate payment collections"] :
        ["Financial performance within targets", "Continue current strategies"]
    };
  }
});

// Helper Functions
function calculateJobLaborCosts(job: any): number {
  // TODO: Implement based on actual labor tracking data
  const estimatedHours = job.scope?.estimatedHours || 8;
  const avgHourlyRate = 25; // TODO: Get from employee data
  return estimatedHours * avgHourlyRate;
}

function calculateJobEquipmentCosts(job: any): number {
  // TODO: Implement based on actual equipment usage
  const estimatedHours = job.scope?.estimatedHours || 8;
  const avgEquipmentRate = 15; // TODO: Get from equipment data
  return estimatedHours * avgEquipmentRate;
}

function calculateOverheadAllocation(job: any, revenue: number): number {
  // Allocate overhead as percentage of revenue
  const overheadRate = 0.25; // 25% overhead allocation
  return revenue * overheadRate;
}

function calculateJobEfficiency(job: any): number {
  const estimated = job.scope?.estimatedHours || 8;
  const actual = job.operations?.actualHoursWorked || estimated;
  return estimated > 0 ? (estimated / actual) : 1.0;
}

function generateProfitabilityInsights(jobData: any[], scope: any): string[] {
  const insights = [];
  
  const avgMargin = jobData.reduce((sum, job) => sum + job.profit.netMargin, 0) / jobData.length;
  if (avgMargin < 0.15) {
    insights.push("Overall profit margins below industry standard (15%)");
  }
  
  // Service type analysis
  const serviceTypes = new Map();
  jobData.forEach(job => {
    const type = job.serviceType;
    if (!serviceTypes.has(type)) {
      serviceTypes.set(type, []);
    }
    serviceTypes.get(type).push(job.profit.netMargin);
  });
  
  for (const [type, margins] of serviceTypes) {
    const avgServiceMargin = margins.reduce((a, b) => a + b, 0) / margins.length;
    if (avgServiceMargin > avgMargin * 1.2) {
      insights.push(`${type} services significantly more profitable than average`);
    } else if (avgServiceMargin < avgMargin * 0.8) {
      insights.push(`${type} services underperforming profitability targets`);
    }
  }
  
  return insights;
}

function generateFinancialRecommendations(insights: string[], scope: any): string[] {
  const recommendations = [];
  
  insights.forEach(insight => {
    if (insight.includes("below industry standard")) {
      recommendations.push("Review pricing strategy and cost structure");
    }
    if (insight.includes("underperforming")) {
      recommendations.push("Analyze cost drivers for underperforming services");
    }
    if (insight.includes("more profitable")) {
      recommendations.push("Focus marketing on high-margin services");
    }
  });
  
  return recommendations.length > 0 ? recommendations : ["Financial performance within targets"];
}

function calculatePaymentCycles(jobs: any[], payments: any[]): number[] {
  const cycles = [];
  
  jobs.forEach(job => {
    if (job.identity.jobStatus === "completed") {
      const completionDate = job.identity.actualStartDate;
      const jobPayments = payments.filter(payment => 
        payment.jobId === job._id && payment.status === "completed"
      );
      
      if (jobPayments.length > 0) {
        const firstPayment = jobPayments.reduce((earliest, payment) => 
          payment.date < earliest.date ? payment : earliest
        );
        const cycleDays = (firstPayment.date - completionDate) / (1000 * 60 * 60 * 24);
        cycles.push(Math.max(0, cycleDays));
      }
    }
  });
  
  return cycles;
}

function identifyCashFlowOptimizations(receivables: number, avgCycle: number, forecast: any[]): any[] {
  const optimizations = [];
  
  if (avgCycle > 30) {
    optimizations.push({
      type: "payment-terms",
      description: "Implement faster payment terms and incentives",
      potentialImprovement: Math.round(receivables * 0.15),
      timeline: "30 days",
      effort: "medium"
    });
  }
  
  if (receivables > 50000) {
    optimizations.push({
      type: "collections",
      description: "Implement automated collections system",
      potentialImprovement: Math.round(receivables * 0.25),
      timeline: "60 days",
      effort: "high"
    });
  }
  
  return optimizations;
}

function generateCashFlowAlerts(currentCash: number, receivables: number, optimizations: any[]): any[] {
  const alerts = [];
  
  if (currentCash < 10000) {
    alerts.push({
      type: "low-cash-position",
      severity: "critical",
      message: "Cash position critically low",
      actionRequired: "Accelerate collections immediately"
    });
  }
  
  if (receivables > currentCash * 3) {
    alerts.push({
      type: "high-receivables",
      severity: "warning",
      message: "Outstanding receivables significantly exceed cash position",
      actionRequired: "Review collection processes"
    });
  }
  
  return alerts;
}

function calculateExpenseTrend(expenses: any[]): string {
  if (expenses.length < 2) return "insufficient-data";
  
  const sorted = expenses.sort((a, b) => a.date - b.date);
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, exp) => sum + exp.amount, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, exp) => sum + exp.amount, 0) / secondHalf.length;
  
  const change = (secondAvg - firstAvg) / firstAvg;
  
  if (change > 0.1) return "increasing";
  if (change < -0.1) return "decreasing";
  return "stable";
}

function identifyCostReductions(variances: any[], expenses: any[]): any[] {
  const opportunities = [];
  
  // High variance categories
  variances.filter(v => v.variancePercentage > 0.2).forEach(variance => {
    opportunities.push({
      category: variance.category,
      type: "variance-reduction",
      description: `High variance in ${variance.category} expenses`,
      potentialSavings: Math.round(variance.variance * 0.5),
      confidence: "medium"
    });
  });
  
  // Trend-based opportunities
  variances.filter(v => v.trend === "increasing").forEach(variance => {
    opportunities.push({
      category: variance.category,
      type: "trend-reversal",
      description: `Rising trend in ${variance.category} costs`,
      potentialSavings: Math.round(variance.actual * 0.1),
      confidence: "high"
    });
  });
  
  return opportunities;
}

function generateExpenseAlerts(variances: any[]): any[] {
  const alerts = [];
  
  variances.forEach(variance => {
    if (Math.abs(variance.variancePercentage) > FINANCIAL_AGENT_CONFIG.alertThresholds.highExpenseVariance) {
      alerts.push({
        type: "expense-variance",
        severity: variance.variancePercentage > 0 ? "warning" : "info",
        message: `${variance.category} expenses ${variance.variancePercentage > 0 ? 'over' : 'under'} budget by ${Math.abs(Math.round(variance.variancePercentage * 100))}%`,
        actionRequired: variance.variancePercentage > 0 ? "Review expense controls" : "Analyze budget accuracy"
      });
    }
  });
  
  return alerts;
}

function analyzeHistoricalSpending(expenses: any[], jobs: any[], period: string): any {
  const categoryAnalysis = new Map();
  
  // Group expenses by category
  expenses.forEach(expense => {
    const category = expense.category;
    if (!categoryAnalysis.has(category)) {
      categoryAnalysis.set(category, []);
    }
    categoryAnalysis.get(category).push(expense);
  });
  
  // Analyze each category
  for (const [category, categoryExpenses] of categoryAnalysis) {
    const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = categoryExpenses.length;
    const average = total / count;
    
    // Calculate monthly average
    const months = Math.max(1, categoryExpenses.length / 4); // Rough estimate
    const averageMonthly = total / months;
    
    categoryAnalysis.set(category, {
      total,
      count,
      average,
      averageMonthly,
      trend: calculateExpenseTrend(categoryExpenses),
      variance: calculateCategoryVariance(categoryExpenses)
    });
  }
  
  return { categoryAnalysis };
}

function calculateCategoryVariance(expenses: any[]): number {
  if (expenses.length < 2) return 0;
  
  const amounts = expenses.map(exp => exp.amount);
  const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const squaredDiffs = amounts.map(amount => Math.pow(amount - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / amounts.length;
  
  return variance;
}

function getCategoryOptimization(category: string, analysis: any): any {
  const optimizations = {
    "labor": { multiplier: 0.95, type: "efficiency", savings: analysis.averageMonthly * 0.05, confidence: "high" },
    "equipment": { multiplier: 0.92, type: "utilization", savings: analysis.averageMonthly * 0.08, confidence: "medium" },
    "fuel": { multiplier: 0.90, type: "route-optimization", savings: analysis.averageMonthly * 0.10, confidence: "high" },
    "marketing": { multiplier: 1.05, type: "investment", savings: 0, confidence: "medium" },
    "insurance": { multiplier: 1.02, type: "inflation-adjustment", savings: 0, confidence: "high" }
  };
  
  return optimizations[category] || { 
    multiplier: 1.0, 
    type: "maintain", 
    savings: 0, 
    confidence: "medium" 
  };
}

function generateBudgetImplementationPlan(recommendations: any[]): any[] {
  return [
    { phase: 1, description: "Implement high-confidence optimizations", timeline: "30 days" },
    { phase: 2, description: "Monitor expense tracking systems", timeline: "60 days" },
    { phase: 3, description: "Adjust based on performance data", timeline: "90 days" }
  ];
}

function generateBudgetKPIs(recommendations: any[]): string[] {
  return [
    "Monthly expense variance by category",
    "Budget adherence percentage",
    "Cost per job ratio",
    "Expense trend analysis"
  ];
}

// Financial Intelligence Agent Main Interface
export const processFinancialIntelligence = mutation({
  args: {
    message: v.string(),
    context: v.object({
      requestType: v.string(), // "profitability", "cash-flow", "expense-variance", "budget-optimization"
      jobId: v.optional(v.id("jobs")),
      customerId: v.optional(v.id("customers")),
      timeframe: v.optional(v.string())
    })
  },
  handler: async (ctx, args) => {
    const { message, context } = args;
    
    let response = "";
    let data = null;
    
    switch (context.requestType) {
      case "profitability":
        data = await analyzeProfitability(ctx, { 
          analysisScope: { 
            timeframe: context.timeframe || "monthly", 
            jobId: context.jobId,
            customerId: context.customerId,
            includeOverhead: true 
          } 
        });
        response = `Profitability analysis: ${data.summary.totalJobs} jobs, $${data.summary.totalProfit} profit, ${Math.round(data.summary.averageMargin * 100)}% margin`;
        break;
        
      case "cash-flow":
        data = await optimizeCashFlow(ctx, { forecastPeriod: 90, includeScheduledJobs: true });
        response = `Cash flow: $${data.cashFlow.current} current, $${data.cashFlow.projectedCash} projected, ${data.optimizations.length} optimization opportunities`;
        break;
        
      case "expense-variance":
        data = await analyzeExpenseVariance(ctx, { timeframe: context.timeframe || "monthly" });
        response = `Expense variance: $${data.totalVariance} total variance (${data.totalVariancePercentage}%), ${data.costReductionOpportunities.length} cost reduction opportunities`;
        break;
        
      default:
        const performance = await monitorFinancialPerformance(ctx, {});
        response = `Financial Intelligence Status: ${performance.alerts.length} active alerts. Profit margin: ${Math.round(performance.metrics.profitMargin * 100)}%`;
        data = performance;
    }
    
    return {
      agentId: FINANCIAL_AGENT_CONFIG.agentId,
      response,
      data,
      timestamp: Date.now(),
      confidence: 0.95
    };
  }
});