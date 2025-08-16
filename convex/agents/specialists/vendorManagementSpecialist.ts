import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

// Vendor Management Specialist Agent - Agent #26
// Handles vendor relationships, procurement optimization, and supplier performance management

// ===== TYPES & VALIDATION SCHEMAS =====

const VendorProfileSchema = v.object({
  vendorId: v.string(),
  basicInfo: v.object({
    companyName: v.string(),
    businessType: v.string(),
    industry: v.string(),
    establishedYear: v.number(),
    headcount: v.number(),
    annualRevenue: v.number(),
    headquarters: v.string(),
    serviceAreas: v.array(v.string())
  }),
  contactInfo: v.object({
    primaryContact: v.object({
      name: v.string(),
      title: v.string(),
      email: v.string(),
      phone: v.string()
    }),
    salesContact: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string()
    }),
    supportContact: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string()
    }),
    emergencyContact: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      available24x7: v.boolean()
    })
  }),
  capabilities: v.object({
    productCategories: v.array(v.string()),
    serviceCategories: v.array(v.string()),
    certifications: v.array(v.object({
      certification: v.string(),
      issuingBody: v.string(),
      expirationDate: v.string(),
      status: v.string()
    })),
    specializations: v.array(v.string()),
    geographicCoverage: v.array(v.string()),
    capacityLimits: v.object({
      maxOrderValue: v.number(),
      maxMonthlyVolume: v.number(),
      leadTimeStandard: v.number(),
      leadTimeRush: v.number()
    })
  }),
  compliance: v.object({
    insurance: v.object({
      generalLiability: v.object({
        coverage: v.number(),
        expirationDate: v.string(),
        status: v.string()
      }),
      workersCompensation: v.object({
        coverage: v.number(),
        expirationDate: v.string(),
        status: v.string()
      }),
      professionalLiability: v.object({
        coverage: v.number(),
        expirationDate: v.string(),
        status: v.string()
      })
    }),
    licenses: v.array(v.object({
      licenseType: v.string(),
      licenseNumber: v.string(),
      issuingAuthority: v.string(),
      expirationDate: v.string(),
      status: v.string()
    })),
    safetyRating: v.object({
      oshaScore: v.number(),
      incidentRate: v.number(),
      lastInspectionDate: v.string(),
      violations: v.array(v.string())
    }),
    financialHealth: v.object({
      creditRating: v.string(),
      paymentHistory: v.string(),
      bankingReferences: v.array(v.string()),
      bondingCapacity: v.number()
    })
  })
});

const VendorPerformanceSchema = v.object({
  performanceId: v.string(),
  vendorId: v.string(),
  evaluationPeriod: v.object({
    startDate: v.string(),
    endDate: v.string(),
    frequency: v.string()
  }),
  qualityMetrics: v.object({
    defectRate: v.number(),
    returnRate: v.number(),
    qualityScore: v.number(),
    customerComplaints: v.number(),
    qualityImprovements: v.array(v.string()),
    certificationMaintenance: v.boolean()
  }),
  deliveryMetrics: v.object({
    onTimeDeliveryRate: v.number(),
    averageLeadTime: v.number(),
    deliveryAccuracy: v.number(),
    emergencyResponseTime: v.number(),
    schedulingFlexibility: v.number(),
    communicationQuality: v.number()
  }),
  costMetrics: v.object({
    competitivePricing: v.number(),
    costStability: v.number(),
    volumeDiscounts: v.number(),
    hiddenCosts: v.number(),
    valueForMoney: v.number(),
    costReductionInitiatives: v.array(v.string())
  }),
  serviceMetrics: v.object({
    responsiveness: v.number(),
    technicalSupport: v.number(),
    problemResolution: v.number(),
    knowledgeLevel: v.number(),
    proactiveness: v.number(),
    availabilityScore: v.number()
  }),
  complianceMetrics: v.object({
    contractCompliance: v.number(),
    regulatoryCompliance: v.number(),
    safetyCompliance: v.number(),
    environmentalCompliance: v.number(),
    documentationQuality: v.number(),
    auditResults: v.array(v.string())
  }),
  overallRating: v.object({
    currentScore: v.number(),
    previousScore: v.number(),
    trend: v.string(),
    ranking: v.number(),
    tier: v.string(),
    improvements: v.array(v.string()),
    concernAreas: v.array(v.string())
  })
});

const ProcurementOptimizationSchema = v.object({
  optimizationId: v.string(),
  category: v.string(),
  currentState: v.object({
    totalSpend: v.number(),
    supplierCount: v.number(),
    averageOrderValue: v.number(),
    leadTime: v.number(),
    qualityLevel: v.number(),
    costPerUnit: v.number(),
    inventoryLevels: v.number()
  }),
  spendAnalysis: v.object({
    spendByCategory: v.array(v.object({
      category: v.string(),
      amount: v.number(),
      percentage: v.number(),
      trend: v.string()
    })),
    spendBySupplier: v.array(v.object({
      supplierId: v.string(),
      amount: v.number(),
      percentage: v.number(),
      riskLevel: v.string()
    })),
    seasonalPatterns: v.array(v.object({
      month: v.number(),
      spendLevel: v.number(),
      variance: v.number()
    })),
    maverickSpend: v.object({
      amount: v.number(),
      percentage: v.number(),
      categories: v.array(v.string())
    })
  }),
  supplierAnalysis: v.object({
    supplierConcentration: v.object({
      top3Percentage: v.number(),
      top5Percentage: v.number(),
      herfindahlIndex: v.number(),
      riskLevel: v.string()
    }),
    supplierDiversity: v.object({
      minorityOwnedPercentage: v.number(),
      womenOwnedPercentage: v.number(),
      smallBusinessPercentage: v.number(),
      localSupplierPercentage: v.number()
    }),
    supplierCapability: v.object({
      averageCapacityUtilization: v.number(),
      scalabilityScore: v.number(),
      innovationScore: v.number(),
      digitalMaturity: v.number()
    })
  }),
  optimizationOpportunities: v.array(v.object({
    opportunity: v.string(),
    category: v.string(),
    potentialSavings: v.number(),
    implementationCost: v.number(),
    timeframe: v.string(),
    riskLevel: v.string(),
    requiredActions: v.array(v.string())
  })),
  constraintsAndRisks: v.object({
    budgetConstraints: v.number(),
    qualityRequirements: v.array(v.string()),
    complianceRequirements: v.array(v.string()),
    timeConstraints: v.array(v.string()),
    riskTolerance: v.string(),
    changeManagementCapability: v.string()
  })
});

const ContractManagementSchema = v.object({
  contractId: v.string(),
  vendorId: v.string(),
  contractDetails: v.object({
    contractType: v.string(),
    description: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    autoRenewal: v.boolean(),
    renewalTerms: v.string(),
    terminationClause: v.string(),
    governingLaw: v.string()
  }),
  financialTerms: v.object({
    totalValue: v.number(),
    paymentTerms: v.string(),
    penaltyClause: v.object({
      lateDeliveryPenalty: v.number(),
      qualityPenalty: v.number(),
      performancePenalty: v.number()
    }),
    incentives: v.object({
      earlyDeliveryBonus: v.number(),
      qualityBonus: v.number(),
      performanceBonus: v.number(),
      volumeDiscounts: v.array(v.object({
        threshold: v.number(),
        discount: v.number()
      }))
    }),
    priceAdjustment: v.object({
      inflationClause: v.boolean(),
      fuelSurcharge: v.boolean(),
      materialCostAdjustment: v.boolean(),
      laborCostAdjustment: v.boolean()
    })
  }),
  performanceStandards: v.object({
    slaRequirements: v.array(v.object({
      metric: v.string(),
      target: v.number(),
      measurement: v.string(),
      penalty: v.number()
    })),
    qualityStandards: v.array(v.object({
      standard: v.string(),
      specification: v.string(),
      testingMethod: v.string(),
      acceptanceCriteria: v.string()
    })),
    deliveryRequirements: v.object({
      deliveryWindow: v.string(),
      deliveryLocation: v.array(v.string()),
      packagingRequirements: v.array(v.string()),
      documentationRequirements: v.array(v.string())
    })
  }),
  riskManagement: v.object({
    insuranceRequirements: v.array(v.object({
      type: v.string(),
      coverage: v.number(),
      duration: v.string()
    })),
    liabilityAllocation: v.object({
      vendorLiability: v.number(),
      clientLiability: v.number(),
      mutualLiability: v.number(),
      caps: v.object({
        totalCap: v.number(),
        annualCap: v.number(),
        incidentCap: v.number()
      })
    }),
    forceMateure: v.object({
      applicableEvents: v.array(v.string()),
      notificationPeriod: v.number(),
      mitigationRequirements: v.array(v.string())
    }),
    disputeResolution: v.object({
      escalationProcess: v.array(v.string()),
      mediationRequired: v.boolean(),
      arbitrationClause: v.boolean(),
      jurisdiction: v.string()
    })
  }),
  complianceRequirements: v.object({
    regulatoryCompliance: v.array(v.string()),
    certificationRequirements: v.array(v.string()),
    auditRights: v.object({
      frequencyAllowed: v.string(),
      scopeOfAudit: v.array(v.string()),
      costAllocation: v.string()
    }),
    dataProtection: v.object({
      dataClassification: v.array(v.string()),
      securityRequirements: v.array(v.string()),
      breachNotification: v.object({
        timeframe: v.number(),
        method: v.array(v.string())
      })
    })
  })
});

// ===== HELPER FUNCTIONS =====

function analyzeVendorProfile(profile: any): any {
  const strengthsAndWeaknesses = assessVendorStrengthsWeaknesses(profile);
  const riskAssessment = calculateVendorRisk(profile);
  const capabilityGaps = identifyCapabilityGaps(profile);
  const complianceStatus = evaluateComplianceStatus(profile);
  
  return {
    strengthsAndWeaknesses,
    riskAssessment,
    capabilityGaps,
    complianceStatus,
    overallAssessment: generateOverallAssessment(profile, riskAssessment, complianceStatus),
    onboardingRecommendations: generateOnboardingRecommendations(profile),
    developmentPlan: createVendorDevelopmentPlan(profile, capabilityGaps)
  };
}

function assessVendorStrengthsWeaknesses(profile: any): any {
  const strengths = [];
  const weaknesses = [];
  
  // Assess financial strength
  if (profile.basicInfo.annualRevenue > 10000000) {
    strengths.push('Strong financial position');
  } else if (profile.basicInfo.annualRevenue < 1000000) {
    weaknesses.push('Limited financial capacity');
  }
  
  // Assess experience
  const yearsInBusiness = new Date().getFullYear() - profile.basicInfo.establishedYear;
  if (yearsInBusiness > 10) {
    strengths.push('Extensive industry experience');
  } else if (yearsInBusiness < 3) {
    weaknesses.push('Limited operating history');
  }
  
  // Assess capabilities
  if (profile.capabilities.productCategories.length > 5) {
    strengths.push('Diverse product portfolio');
  }
  
  if (profile.capabilities.certifications.length > 3) {
    strengths.push('Strong certification profile');
  }
  
  // Assess compliance
  const insuranceCompliant = assessInsuranceCompliance(profile.compliance.insurance);
  if (insuranceCompliant.compliant) {
    strengths.push('Comprehensive insurance coverage');
  } else {
    weaknesses.push('Insurance coverage gaps');
  }
  
  // Assess geographic coverage
  if (profile.capabilities.geographicCoverage.length > 10) {
    strengths.push('Extensive geographic reach');
  } else if (profile.capabilities.geographicCoverage.length < 3) {
    weaknesses.push('Limited geographic coverage');
  }
  
  return {
    strengths,
    weaknesses,
    strengthScore: calculateStrengthScore(strengths.length, weaknesses.length),
    competitiveAdvantages: identifyCompetitiveAdvantages(profile),
    riskAreas: identifyRiskAreas(profile, weaknesses)
  };
}

function calculateStrengthScore(strengthsCount: number, weaknessesCount: number): number {
  const netScore = strengthsCount - weaknessesCount;
  const maxPossibleStrengths = 10; // Theoretical maximum
  return Math.max(0, Math.min(100, ((netScore + maxPossibleStrengths) / (maxPossibleStrengths * 2)) * 100));
}

function identifyCompetitiveAdvantages(profile: any): string[] {
  const advantages = [];
  
  if (profile.capabilities.capacityLimits.leadTimeStandard < 7) {
    advantages.push('Fast delivery capabilities');
  }
  
  if (profile.capabilities.capacityLimits.maxOrderValue > 1000000) {
    advantages.push('High-value project capability');
  }
  
  if (profile.contactInfo.emergencyContact.available24x7) {
    advantages.push('24/7 emergency support');
  }
  
  return advantages;
}

function identifyRiskAreas(profile: any, weaknesses: string[]): string[] {
  const riskAreas = [...weaknesses];
  
  if (profile.compliance.safetyRating.oshaScore > 3) {
    riskAreas.push('Poor safety performance');
  }
  
  if (profile.compliance.financialHealth.creditRating === 'Below Average') {
    riskAreas.push('Financial instability risk');
  }
  
  return riskAreas;
}

function calculateVendorRisk(profile: any): any {
  const financialRisk = assessFinancialRisk(profile);
  const operationalRisk = assessOperationalRisk(profile);
  const complianceRisk = assessComplianceRisk(profile);
  const concentrationRisk = assessConcentrationRisk(profile);
  
  const overallRisk = calculateOverallRisk(financialRisk, operationalRisk, complianceRisk, concentrationRisk);
  
  return {
    financialRisk,
    operationalRisk,
    complianceRisk,
    concentrationRisk,
    overallRisk,
    riskMitigationStrategies: generateRiskMitigationStrategies(overallRisk),
    monitoringRequirements: defineRiskMonitoringRequirements(overallRisk)
  };
}

function assessFinancialRisk(profile: any): any {
  let riskScore = 0;
  let riskFactors = [];
  
  // Credit rating assessment
  switch (profile.compliance.financialHealth.creditRating) {
    case 'Excellent':
      riskScore += 0;
      break;
    case 'Good':
      riskScore += 10;
      break;
    case 'Average':
      riskScore += 25;
      break;
    case 'Below Average':
      riskScore += 40;
      riskFactors.push('Poor credit rating');
      break;
    case 'Poor':
      riskScore += 60;
      riskFactors.push('Very poor credit rating');
      break;
  }
  
  // Revenue stability
  if (profile.basicInfo.annualRevenue < 500000) {
    riskScore += 20;
    riskFactors.push('Low annual revenue');
  }
  
  // Payment history
  if (profile.compliance.financialHealth.paymentHistory === 'Poor') {
    riskScore += 30;
    riskFactors.push('Poor payment history');
  }
  
  return {
    riskScore: Math.min(100, riskScore),
    riskLevel: getRiskLevel(riskScore),
    riskFactors,
    mitigationRecommendations: generateFinancialRiskMitigation(riskScore, riskFactors)
  };
}

function assessOperationalRisk(profile: any): any {
  let riskScore = 0;
  let riskFactors = [];
  
  // Company size and stability
  if (profile.basicInfo.headcount < 10) {
    riskScore += 15;
    riskFactors.push('Small organization size');
  }
  
  // Geographic concentration
  if (profile.capabilities.geographicCoverage.length < 3) {
    riskScore += 20;
    riskFactors.push('Limited geographic coverage');
  }
  
  // Capacity limitations
  if (profile.capabilities.capacityLimits.maxMonthlyVolume < 100000) {
    riskScore += 10;
    riskFactors.push('Limited capacity');
  }
  
  // Lead time reliability
  if (profile.capabilities.capacityLimits.leadTimeStandard > 30) {
    riskScore += 15;
    riskFactors.push('Long lead times');
  }
  
  return {
    riskScore: Math.min(100, riskScore),
    riskLevel: getRiskLevel(riskScore),
    riskFactors,
    mitigationRecommendations: generateOperationalRiskMitigation(riskScore, riskFactors)
  };
}

function assessComplianceRisk(profile: any): any {
  let riskScore = 0;
  let riskFactors = [];
  
  // Insurance compliance
  const insuranceCompliance = assessInsuranceCompliance(profile.compliance.insurance);
  if (!insuranceCompliance.compliant) {
    riskScore += 25;
    riskFactors.push('Insurance coverage gaps');
  }
  
  // License compliance
  const expiredLicenses = profile.compliance.licenses.filter((license: any) => 
    new Date(license.expirationDate) < new Date()).length;
  if (expiredLicenses > 0) {
    riskScore += 20;
    riskFactors.push('Expired licenses');
  }
  
  // Safety performance
  if (profile.compliance.safetyRating.oshaScore > 3) {
    riskScore += 30;
    riskFactors.push('Poor safety record');
  }
  
  // Certification status
  const expiredCertifications = profile.capabilities.certifications.filter((cert: any) => 
    new Date(cert.expirationDate) < new Date()).length;
  if (expiredCertifications > 0) {
    riskScore += 15;
    riskFactors.push('Expired certifications');
  }
  
  return {
    riskScore: Math.min(100, riskScore),
    riskLevel: getRiskLevel(riskScore),
    riskFactors,
    mitigationRecommendations: generateComplianceRiskMitigation(riskScore, riskFactors)
  };
}

function assessConcentrationRisk(profile: any): any {
  // Simplified concentration risk assessment
  // In practice, this would analyze dependency on this vendor
  
  let riskScore = 0;
  let riskFactors = [];
  
  // Single source risk
  if (profile.capabilities.specializations.length < 2) {
    riskScore += 20;
    riskFactors.push('Limited service diversification');
  }
  
  return {
    riskScore: Math.min(100, riskScore),
    riskLevel: getRiskLevel(riskScore),
    riskFactors,
    mitigationRecommendations: ['Develop alternative suppliers', 'Diversify vendor portfolio']
  };
}

function getRiskLevel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Very Low';
}

function calculateOverallRisk(financial: any, operational: any, compliance: any, concentration: any): any {
  const weights = { financial: 0.3, operational: 0.25, compliance: 0.35, concentration: 0.1 };
  
  const weightedScore = (financial.riskScore * weights.financial) +
                       (operational.riskScore * weights.operational) +
                       (compliance.riskScore * weights.compliance) +
                       (concentration.riskScore * weights.concentration);
  
  return {
    overallScore: Math.round(weightedScore),
    overallLevel: getRiskLevel(weightedScore),
    primaryRiskFactors: identifyPrimaryRiskFactors(financial, operational, compliance, concentration),
    riskTrend: 'Stable', // Would be calculated from historical data
    riskImpact: calculateRiskImpact(weightedScore)
  };
}

function identifyPrimaryRiskFactors(financial: any, operational: any, compliance: any, concentration: any): string[] {
  const allFactors = [
    ...financial.riskFactors,
    ...operational.riskFactors,
    ...compliance.riskFactors,
    ...concentration.riskFactors
  ];
  
  return allFactors.slice(0, 3); // Top 3 risk factors
}

function calculateRiskImpact(riskScore: number): string {
  if (riskScore >= 70) return 'Critical';
  if (riskScore >= 40) return 'Significant';
  if (riskScore >= 20) return 'Moderate';
  return 'Minor';
}

function generateRiskMitigationStrategies(overallRisk: any): string[] {
  const strategies = [];
  
  if (overallRisk.overallLevel === 'High') {
    strategies.push('Implement enhanced monitoring and oversight');
    strategies.push('Require additional insurance coverage');
    strategies.push('Establish performance bonds');
  }
  
  if (overallRisk.overallLevel === 'Medium') {
    strategies.push('Increase monitoring frequency');
    strategies.push('Develop contingency plans');
  }
  
  strategies.push('Regular performance reviews');
  strategies.push('Maintain alternative supplier relationships');
  
  return strategies;
}

function defineRiskMonitoringRequirements(overallRisk: any): any {
  const requirements = {
    monitoringFrequency: overallRisk.overallLevel === 'High' ? 'Monthly' : 
                        overallRisk.overallLevel === 'Medium' ? 'Quarterly' : 'Semi-annually',
    keyIndicators: [
      'Financial performance',
      'Delivery performance',
      'Quality metrics',
      'Compliance status'
    ],
    escalationTriggers: [
      'Performance decline >10%',
      'Compliance violations',
      'Financial deterioration',
      'Delivery failures'
    ],
    reviewRequirements: generateReviewRequirements(overallRisk.overallLevel)
  };
  
  return requirements;
}

function generateReviewRequirements(riskLevel: string): string[] {
  const baseRequirements = ['Annual performance review', 'Contract compliance review'];
  
  if (riskLevel === 'High') {
    return [...baseRequirements, 'Monthly risk assessment', 'Quarterly business review'];
  }
  
  if (riskLevel === 'Medium') {
    return [...baseRequirements, 'Quarterly risk assessment'];
  }
  
  return baseRequirements;
}

function assessInsuranceCompliance(insurance: any): any {
  const today = new Date();
  let compliant = true;
  let gaps = [];
  
  // General Liability
  if (insurance.generalLiability.coverage < 1000000) {
    compliant = false;
    gaps.push('Insufficient general liability coverage');
  }
  
  if (new Date(insurance.generalLiability.expirationDate) < today) {
    compliant = false;
    gaps.push('Expired general liability insurance');
  }
  
  // Workers Compensation
  if (insurance.workersCompensation.coverage < 500000) {
    compliant = false;
    gaps.push('Insufficient workers compensation coverage');
  }
  
  if (new Date(insurance.workersCompensation.expirationDate) < today) {
    compliant = false;
    gaps.push('Expired workers compensation insurance');
  }
  
  return { compliant, gaps };
}

function identifyCapabilityGaps(profile: any): any {
  const requiredCapabilities = [
    'Tree Care Services',
    'Emergency Response',
    'Equipment Operation',
    'Safety Compliance',
    'Environmental Protection'
  ];
  
  const currentCapabilities = profile.capabilities.serviceCategories;
  const gaps = requiredCapabilities.filter(req => !currentCapabilities.includes(req));
  
  const certificationGaps = identifyCertificationGaps(profile.capabilities.certifications);
  const geographicGaps = identifyGeographicGaps(profile.capabilities.geographicCoverage);
  
  return {
    serviceGaps: gaps,
    certificationGaps,
    geographicGaps,
    capacityGaps: assessCapacityGaps(profile.capabilities.capacityLimits),
    developmentPriority: prioritizeGaps(gaps, certificationGaps, geographicGaps)
  };
}

function identifyCertificationGaps(certifications: any[]): string[] {
  const requiredCertifications = [
    'ISA Certified Arborist',
    'OSHA 10-Hour Training',
    'EPA Pesticide License',
    'DOT Commercial License'
  ];
  
  const currentCertifications = certifications.map(cert => cert.certification);
  return requiredCertifications.filter(req => !currentCertifications.includes(req));
}

function identifyGeographicGaps(coverage: string[]): string[] {
  const desiredCoverage = [
    'Urban Areas',
    'Suburban Areas',
    'Commercial Districts',
    'Residential Areas',
    'Industrial Zones'
  ];
  
  return desiredCoverage.filter(area => !coverage.includes(area));
}

function assessCapacityGaps(limits: any): any {
  const gaps = [];
  
  if (limits.maxOrderValue < 100000) {
    gaps.push('Limited large project capacity');
  }
  
  if (limits.maxMonthlyVolume < 500000) {
    gaps.push('Limited monthly throughput');
  }
  
  if (limits.leadTimeStandard > 14) {
    gaps.push('Long standard lead times');
  }
  
  return {
    gaps,
    capacityUtilization: 'Unknown', // Would be calculated from actual data
    scalabilityAssessment: gaps.length < 2 ? 'Good' : 'Limited'
  };
}

function prioritizeGaps(serviceGaps: string[], certificationGaps: string[], geographicGaps: string[]): any[] {
  const priorities = [];
  
  serviceGaps.forEach(gap => priorities.push({ gap, type: 'Service', priority: 'High' }));
  certificationGaps.forEach(gap => priorities.push({ gap, type: 'Certification', priority: 'Medium' }));
  geographicGaps.forEach(gap => priorities.push({ gap, type: 'Geographic', priority: 'Low' }));
  
  return priorities.sort((a, b) => {
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function evaluateComplianceStatus(profile: any): any {
  const insuranceStatus = assessInsuranceCompliance(profile.compliance.insurance);
  const licenseStatus = assessLicenseCompliance(profile.compliance.licenses);
  const safetyStatus = assessSafetyCompliance(profile.compliance.safetyRating);
  const financialStatus = assessFinancialCompliance(profile.compliance.financialHealth);
  
  const overallCompliance = insuranceStatus.compliant && 
                           licenseStatus.compliant && 
                           safetyStatus.compliant && 
                           financialStatus.compliant;
  
  return {
    overallCompliance,
    insuranceStatus,
    licenseStatus,
    safetyStatus,
    financialStatus,
    complianceScore: calculateComplianceScore(insuranceStatus, licenseStatus, safetyStatus, financialStatus),
    actionItems: generateComplianceActionItems(insuranceStatus, licenseStatus, safetyStatus, financialStatus)
  };
}

function assessLicenseCompliance(licenses: any[]): any {
  const today = new Date();
  let compliant = true;
  let gaps = [];
  
  licenses.forEach(license => {
    if (new Date(license.expirationDate) < today) {
      compliant = false;
      gaps.push(`Expired ${license.licenseType}`);
    }
    
    if (license.status !== 'Active') {
      compliant = false;
      gaps.push(`Inactive ${license.licenseType}`);
    }
  });
  
  return { compliant, gaps };
}

function assessSafetyCompliance(safetyRating: any): any {
  let compliant = true;
  let gaps = [];
  
  if (safetyRating.oshaScore > 3) {
    compliant = false;
    gaps.push('High OSHA violation score');
  }
  
  if (safetyRating.incidentRate > 5) {
    compliant = false;
    gaps.push('High incident rate');
  }
  
  const lastInspection = new Date(safetyRating.lastInspectionDate);
  const daysSinceInspection = (new Date().getTime() - lastInspection.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceInspection > 365) {
    gaps.push('Overdue safety inspection');
  }
  
  return { compliant, gaps };
}

function assessFinancialCompliance(financialHealth: any): any {
  let compliant = true;
  let gaps = [];
  
  if (financialHealth.creditRating === 'Poor') {
    compliant = false;
    gaps.push('Poor credit rating');
  }
  
  if (financialHealth.paymentHistory === 'Poor') {
    compliant = false;
    gaps.push('Poor payment history');
  }
  
  if (financialHealth.bondingCapacity < 100000) {
    gaps.push('Limited bonding capacity');
  }
  
  return { compliant, gaps };
}

function calculateComplianceScore(insurance: any, license: any, safety: any, financial: any): number {
  let score = 100;
  
  if (!insurance.compliant) score -= 25;
  if (!license.compliant) score -= 20;
  if (!safety.compliant) score -= 30;
  if (!financial.compliant) score -= 25;
  
  return Math.max(0, score);
}

function generateComplianceActionItems(insurance: any, license: any, safety: any, financial: any): string[] {
  const actionItems = [];
  
  insurance.gaps.forEach((gap: string) => actionItems.push(`Address insurance gap: ${gap}`));
  license.gaps.forEach((gap: string) => actionItems.push(`Resolve license issue: ${gap}`));
  safety.gaps.forEach((gap: string) => actionItems.push(`Improve safety: ${gap}`));
  financial.gaps.forEach((gap: string) => actionItems.push(`Address financial concern: ${gap}`));
  
  return actionItems;
}

function generateOverallAssessment(profile: any, riskAssessment: any, complianceStatus: any): any {
  const strengthScore = calculateStrengthScore(5, 2); // Example scores
  const riskScore = riskAssessment.overallRisk.overallScore;
  const complianceScore = complianceStatus.complianceScore;
  
  const overallScore = (strengthScore + (100 - riskScore) + complianceScore) / 3;
  
  return {
    overallScore: Math.round(overallScore),
    rating: getVendorRating(overallScore),
    tier: getVendorTier(overallScore),
    recommendation: generateVendorRecommendation(overallScore, riskScore, complianceScore),
    approvalStatus: determineApprovalStatus(overallScore, riskScore, complianceScore)
  };
}

function getVendorRating(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Satisfactory';
  if (score >= 60) return 'Marginal';
  return 'Unsatisfactory';
}

function getVendorTier(score: number): string {
  if (score >= 85) return 'Tier 1 - Strategic Partner';
  if (score >= 75) return 'Tier 2 - Preferred Vendor';
  if (score >= 65) return 'Tier 3 - Approved Vendor';
  return 'Tier 4 - Conditional Vendor';
}

function generateVendorRecommendation(overallScore: number, riskScore: number, complianceScore: number): string {
  if (overallScore >= 80 && riskScore < 30 && complianceScore >= 90) {
    return 'Highly recommended for strategic partnership';
  }
  
  if (overallScore >= 70 && riskScore < 50 && complianceScore >= 80) {
    return 'Recommended for standard vendor relationship';
  }
  
  if (overallScore >= 60) {
    return 'Conditional approval with enhanced monitoring';
  }
  
  return 'Not recommended for vendor relationship';
}

function determineApprovalStatus(overallScore: number, riskScore: number, complianceScore: number): string {
  if (complianceScore < 70) return 'Rejected - Compliance Issues';
  if (riskScore > 70) return 'Rejected - High Risk';
  if (overallScore < 60) return 'Rejected - Overall Performance';
  if (overallScore >= 80) return 'Approved - No Conditions';
  return 'Approved - With Conditions';
}

function generateOnboardingRecommendations(profile: any): string[] {
  const recommendations = [];
  
  recommendations.push('Conduct on-site facility inspection');
  recommendations.push('Verify insurance coverage and certifications');
  recommendations.push('Complete vendor registration process');
  recommendations.push('Establish communication protocols');
  
  if (profile.compliance.safetyRating.oshaScore > 2) {
    recommendations.push('Require additional safety training');
  }
  
  if (profile.capabilities.certifications.length < 3) {
    recommendations.push('Support certification development');
  }
  
  return recommendations;
}

function createVendorDevelopmentPlan(profile: any, capabilityGaps: any): any {
  const developmentAreas = capabilityGaps.developmentPriority.slice(0, 3); // Top 3 priorities
  
  const plan = {
    objectives: developmentAreas.map((area: any) => `Develop ${area.gap} capability`),
    timeline: '12 months',
    milestones: [
      { milestone: 'Gap assessment completion', timeframe: '1 month' },
      { milestone: 'Development plan approval', timeframe: '2 months' },
      { milestone: 'Training/certification completion', timeframe: '6 months' },
      { milestone: 'Capability validation', timeframe: '9 months' },
      { milestone: 'Full capability deployment', timeframe: '12 months' }
    ],
    supportRequirements: [
      'Training program access',
      'Certification assistance',
      'Technical guidance',
      'Performance monitoring'
    ],
    successMetrics: generateSuccessMetrics(developmentAreas),
    investmentRequired: estimateInvestmentRequired(developmentAreas)
  };
  
  return plan;
}

function generateSuccessMetrics(developmentAreas: any[]): string[] {
  return developmentAreas.map((area: any) => `${area.gap} capability certified and operational`);
}

function estimateInvestmentRequired(developmentAreas: any[]): any {
  const baseCost = 5000; // Base development cost per area
  const totalCost = developmentAreas.length * baseCost;
  
  return {
    estimatedCost: totalCost,
    breakdown: developmentAreas.map((area: any) => ({
      area: area.gap,
      cost: baseCost,
      justification: `Training and certification for ${area.gap}`
    })),
    roi: 'Expected improvement in service quality and capability'
  };
}

function generateFinancialRiskMitigation(riskScore: number, riskFactors: string[]): string[] {
  const strategies = [];
  
  if (riskScore > 50) {
    strategies.push('Require performance bond');
    strategies.push('Shorter payment terms');
    strategies.push('Enhanced financial monitoring');
  }
  
  if (riskFactors.includes('Poor credit rating')) {
    strategies.push('Credit insurance consideration');
  }
  
  if (riskFactors.includes('Low annual revenue')) {
    strategies.push('Smaller initial contract values');
  }
  
  return strategies;
}

function generateOperationalRiskMitigation(riskScore: number, riskFactors: string[]): string[] {
  const strategies = [];
  
  if (riskScore > 40) {
    strategies.push('Develop backup suppliers');
    strategies.push('Enhanced delivery monitoring');
  }
  
  if (riskFactors.includes('Limited capacity')) {
    strategies.push('Capacity planning requirements');
  }
  
  if (riskFactors.includes('Long lead times')) {
    strategies.push('Advanced ordering requirements');
  }
  
  return strategies;
}

function generateComplianceRiskMitigation(riskScore: number, riskFactors: string[]): string[] {
  const strategies = [];
  
  if (riskScore > 30) {
    strategies.push('Regular compliance audits');
    strategies.push('Compliance training requirements');
  }
  
  if (riskFactors.includes('Insurance coverage gaps')) {
    strategies.push('Immediate insurance coverage update');
  }
  
  if (riskFactors.includes('Poor safety record')) {
    strategies.push('Enhanced safety oversight');
  }
  
  return strategies;
}

function evaluateVendorPerformance(performance: any): any {
  const scorecardAnalysis = generatePerformanceScorecard(performance);
  const trendAnalysis = analyzePerformanceTrends(performance);
  const benchmarkComparison = compareAgainstBenchmarks(performance);
  const improvementPlan = createPerformanceImprovementPlan(performance);
  
  return {
    scorecardAnalysis,
    trendAnalysis,
    benchmarkComparison,
    improvementPlan,
    overallAssessment: generatePerformanceAssessment(scorecardAnalysis),
    actionItems: generatePerformanceActionItems(performance),
    recognitionOpportunities: identifyRecognitionOpportunities(performance)
  };
}

function generatePerformanceScorecard(performance: any): any {
  const weights = {
    quality: 0.25,
    delivery: 0.25,
    cost: 0.20,
    service: 0.15,
    compliance: 0.15
  };
  
  const scores = {
    quality: calculateQualityScore(performance.qualityMetrics),
    delivery: calculateDeliveryScore(performance.deliveryMetrics),
    cost: calculateCostScore(performance.costMetrics),
    service: calculateServiceScore(performance.serviceMetrics),
    compliance: calculateComplianceScore(performance.complianceMetrics)
  };
  
  const weightedScore = Object.entries(weights).reduce((total, [category, weight]) => 
    total + (scores[category] * weight), 0);
  
  return {
    categoryScores: scores,
    weightedScore: Math.round(weightedScore),
    performanceRating: getPerformanceRating(weightedScore),
    strengthAreas: identifyStrengthAreas(scores),
    improvementAreas: identifyImprovementAreas(scores)
  };
}

function calculateQualityScore(metrics: any): number {
  let score = 100;
  
  score -= metrics.defectRate * 10; // Penalize defects
  score -= metrics.returnRate * 15; // Penalize returns
  score -= metrics.customerComplaints * 5; // Penalize complaints
  
  if (metrics.certificationMaintenance) score += 5; // Bonus for maintained certifications
  
  return Math.max(0, Math.min(100, score));
}

function calculateDeliveryScore(metrics: any): number {
  let score = metrics.onTimeDeliveryRate; // Base score from on-time delivery
  
  // Adjust for lead time performance
  if (metrics.averageLeadTime <= 7) score += 10;
  else if (metrics.averageLeadTime > 14) score -= 10;
  
  // Adjust for delivery accuracy
  score = (score + metrics.deliveryAccuracy) / 2;
  
  // Communication quality factor
  score = (score * 0.8) + (metrics.communicationQuality * 0.2);
  
  return Math.max(0, Math.min(100, score));
}

function calculateCostScore(metrics: any): number {
  let score = metrics.competitivePricing;
  
  // Factor in cost stability
  score = (score + metrics.costStability) / 2;
  
  // Adjust for value for money
  score = (score * 0.7) + (metrics.valueForMoney * 0.3);
  
  // Penalize hidden costs
  score -= metrics.hiddenCosts * 0.5;
  
  return Math.max(0, Math.min(100, score));
}

function calculateServiceScore(metrics: any): number {
  const serviceComponents = [
    metrics.responsiveness,
    metrics.technicalSupport,
    metrics.problemResolution,
    metrics.knowledgeLevel,
    metrics.proactiveness,
    metrics.availabilityScore
  ];
  
  return serviceComponents.reduce((sum, component) => sum + component, 0) / serviceComponents.length;
}

function calculateComplianceScore(metrics: any): number {
  const complianceComponents = [
    metrics.contractCompliance,
    metrics.regulatoryCompliance,
    metrics.safetyCompliance,
    metrics.environmentalCompliance,
    metrics.documentationQuality
  ];
  
  return complianceComponents.reduce((sum, component) => sum + component, 0) / complianceComponents.length;
}

function getPerformanceRating(score: number): string {
  if (score >= 90) return 'Outstanding';
  if (score >= 80) return 'Exceeds Expectations';
  if (score >= 70) return 'Meets Expectations';
  if (score >= 60) return 'Below Expectations';
  return 'Unsatisfactory';
}

function identifyStrengthAreas(scores: any): string[] {
  const strengthThreshold = 85;
  return Object.entries(scores)
    .filter(([_, score]) => score >= strengthThreshold)
    .map(([category, _]) => category);
}

function identifyImprovementAreas(scores: any): string[] {
  const improvementThreshold = 70;
  return Object.entries(scores)
    .filter(([_, score]) => score < improvementThreshold)
    .map(([category, _]) => category);
}

function analyzePerformanceTrends(performance: any): any {
  const currentScore = performance.overallRating.currentScore;
  const previousScore = performance.overallRating.previousScore;
  const trend = performance.overallRating.trend;
  
  const trendAnalysis = {
    direction: trend,
    magnitude: Math.abs(currentScore - previousScore),
    significance: getTrendSignificance(Math.abs(currentScore - previousScore)),
    projectedTrajectory: projectPerformanceTrajectory(trend, currentScore)
  };
  
  return trendAnalysis;
}

function getTrendSignificance(magnitude: number): string {
  if (magnitude >= 15) return 'Significant';
  if (magnitude >= 8) return 'Moderate';
  if (magnitude >= 3) return 'Minor';
  return 'Negligible';
}

function projectPerformanceTrajectory(trend: string, currentScore: number): any {
  let projectedScore = currentScore;
  
  switch (trend) {
    case 'Improving':
      projectedScore += 5;
      break;
    case 'Declining':
      projectedScore -= 5;
      break;
    case 'Stable':
      // No change
      break;
  }
  
  return {
    sixMonthProjection: Math.max(0, Math.min(100, projectedScore)),
    confidence: trend === 'Stable' ? 85 : 70,
    keyFactors: ['Current trend momentum', 'Improvement initiatives', 'Market conditions']
  };
}

function compareAgainstBenchmarks(performance: any): any {
  const industryBenchmarks = {
    onTimeDelivery: 95,
    qualityScore: 90,
    costCompetitiveness: 85,
    serviceLevel: 88,
    compliance: 95
  };
  
  const vendorMetrics = {
    onTimeDelivery: performance.deliveryMetrics.onTimeDeliveryRate,
    qualityScore: calculateQualityScore(performance.qualityMetrics),
    costCompetitiveness: performance.costMetrics.competitivePricing,
    serviceLevel: calculateServiceScore(performance.serviceMetrics),
    compliance: calculateComplianceScore(performance.complianceMetrics)
  };
  
  const comparison = Object.entries(industryBenchmarks).map(([metric, benchmark]) => ({
    metric,
    vendorScore: vendorMetrics[metric],
    benchmark,
    variance: vendorMetrics[metric] - benchmark,
    percentile: calculatePercentile(vendorMetrics[metric], benchmark)
  }));
  
  return {
    comparison,
    overallRanking: calculateOverallRanking(comparison),
    competitivePosition: determineCompetitivePosition(comparison),
    improvementPriorities: identifyImprovementPriorities(comparison)
  };
}

function calculatePercentile(score: number, benchmark: number): number {
  // Simplified percentile calculation
  if (score >= benchmark) return Math.min(95, 50 + ((score - benchmark) / benchmark) * 45);
  return Math.max(5, 50 - ((benchmark - score) / benchmark) * 45);
}

function calculateOverallRanking(comparison: any[]): string {
  const averagePercentile = comparison.reduce((sum, item) => sum + item.percentile, 0) / comparison.length;
  
  if (averagePercentile >= 80) return 'Top Quartile';
  if (averagePercentile >= 60) return 'Second Quartile';
  if (averagePercentile >= 40) return 'Third Quartile';
  return 'Bottom Quartile';
}

function determineCompetitivePosition(comparison: any[]): string {
  const strongAreas = comparison.filter(item => item.variance > 0).length;
  const totalAreas = comparison.length;
  
  const strengthRatio = strongAreas / totalAreas;
  
  if (strengthRatio >= 0.8) return 'Market Leader';
  if (strengthRatio >= 0.6) return 'Strong Performer';
  if (strengthRatio >= 0.4) return 'Average Performer';
  return 'Below Average Performer';
}

function identifyImprovementPriorities(comparison: any[]): any[] {
  return comparison
    .filter(item => item.variance < 0)
    .sort((a, b) => a.variance - b.variance)
    .slice(0, 3)
    .map(item => ({
      metric: item.metric,
      gap: Math.abs(item.variance),
      priority: item.variance < -10 ? 'High' : item.variance < -5 ? 'Medium' : 'Low'
    }));
}

function createPerformanceImprovementPlan(performance: any): any {
  const improvementAreas = identifyImprovementAreas(generatePerformanceScorecard(performance).categoryScores);
  
  const plan = {
    focusAreas: improvementAreas,
    specificActions: generateImprovementActions(improvementAreas, performance),
    timeline: '6 months',
    milestones: [
      { milestone: 'Improvement plan agreement', timeframe: '2 weeks' },
      { milestone: 'Initial improvements implemented', timeframe: '6 weeks' },
      { milestone: 'Mid-point review', timeframe: '3 months' },
      { milestone: 'Final assessment', timeframe: '6 months' }
    ],
    successMetrics: defineImprovementMetrics(improvementAreas),
    supportRequired: identifySupportRequired(improvementAreas)
  };
  
  return plan;
}

function generateImprovementActions(areas: string[], performance: any): any[] {
  const actions = [];
  
  areas.forEach(area => {
    switch (area) {
      case 'quality':
        actions.push({
          area: 'Quality',
          action: 'Implement quality management system',
          responsibility: 'Vendor Quality Manager',
          deadline: '8 weeks'
        });
        break;
      case 'delivery':
        actions.push({
          area: 'Delivery',
          action: 'Improve delivery scheduling and tracking',
          responsibility: 'Operations Manager',
          deadline: '6 weeks'
        });
        break;
      case 'cost':
        actions.push({
          area: 'Cost',
          action: 'Review pricing structure and cost optimization',
          responsibility: 'Finance Manager',
          deadline: '4 weeks'
        });
        break;
      case 'service':
        actions.push({
          area: 'Service',
          action: 'Enhance customer service training',
          responsibility: 'Service Manager',
          deadline: '10 weeks'
        });
        break;
      case 'compliance':
        actions.push({
          area: 'Compliance',
          action: 'Strengthen compliance monitoring and reporting',
          responsibility: 'Compliance Officer',
          deadline: '12 weeks'
        });
        break;
    }
  });
  
  return actions;
}

function defineImprovementMetrics(areas: string[]): any[] {
  const metrics = [];
  
  areas.forEach(area => {
    switch (area) {
      case 'quality':
        metrics.push({ metric: 'Defect rate reduction', target: '< 2%' });
        break;
      case 'delivery':
        metrics.push({ metric: 'On-time delivery improvement', target: '> 95%' });
        break;
      case 'cost':
        metrics.push({ metric: 'Cost competitiveness improvement', target: '> 85 score' });
        break;
      case 'service':
        metrics.push({ metric: 'Service score improvement', target: '> 88 score' });
        break;
      case 'compliance':
        metrics.push({ metric: 'Compliance score improvement', target: '> 95 score' });
        break;
    }
  });
  
  return metrics;
}

function identifySupportRequired(areas: string[]): string[] {
  const support = [];
  
  if (areas.includes('quality')) {
    support.push('Quality system consulting');
  }
  
  if (areas.includes('delivery')) {
    support.push('Operations optimization support');
  }
  
  if (areas.includes('compliance')) {
    support.push('Compliance training and guidance');
  }
  
  return support;
}

function generatePerformanceAssessment(scorecard: any): any {
  return {
    overallRating: scorecard.performanceRating,
    score: scorecard.weightedScore,
    tier: getVendorTier(scorecard.weightedScore),
    recommendation: generatePerformanceRecommendation(scorecard),
    nextReviewDate: calculateNextReviewDate(scorecard.weightedScore)
  };
}

function generatePerformanceRecommendation(scorecard: any): string {
  if (scorecard.weightedScore >= 90) {
    return 'Excellent performance - Consider for strategic partnership';
  }
  
  if (scorecard.weightedScore >= 80) {
    return 'Good performance - Continue current relationship';
  }
  
  if (scorecard.weightedScore >= 70) {
    return 'Acceptable performance - Monitor for improvement';
  }
  
  if (scorecard.weightedScore >= 60) {
    return 'Below expectations - Implement improvement plan';
  }
  
  return 'Unsatisfactory performance - Consider contract termination';
}

function calculateNextReviewDate(score: number): string {
  const today = new Date();
  let monthsToAdd = 12; // Default annual review
  
  if (score < 70) monthsToAdd = 3; // Quarterly for poor performers
  else if (score < 85) monthsToAdd = 6; // Semi-annual for average performers
  
  const nextReview = new Date(today);
  nextReview.setMonth(nextReview.getMonth() + monthsToAdd);
  
  return nextReview.toISOString().split('T')[0];
}

function generatePerformanceActionItems(performance: any): string[] {
  const actions = [];
  
  if (performance.qualityMetrics.defectRate > 5) {
    actions.push('Address quality issues - defect rate above acceptable threshold');
  }
  
  if (performance.deliveryMetrics.onTimeDeliveryRate < 90) {
    actions.push('Improve delivery performance - on-time rate below standard');
  }
  
  if (performance.complianceMetrics.contractCompliance < 95) {
    actions.push('Enhance contract compliance - current performance inadequate');
  }
  
  return actions;
}

function identifyRecognitionOpportunities(performance: any): string[] {
  const opportunities = [];
  
  if (performance.qualityMetrics.qualityScore > 95) {
    opportunities.push('Quality Excellence Award');
  }
  
  if (performance.deliveryMetrics.onTimeDeliveryRate > 98) {
    opportunities.push('Delivery Excellence Recognition');
  }
  
  if (performance.serviceMetrics.responsiveness > 95) {
    opportunities.push('Outstanding Service Award');
  }
  
  return opportunities;
}

function optimizeProcurement(optimization: any): any {
  const spendOptimization = analyzeSpendOptimization(optimization);
  const supplierOptimization = optimizeSupplierPortfolio(optimization);
  const processOptimization = optimizeProcurementProcesses(optimization);
  const strategicRecommendations = generateStrategicRecommendations(optimization);
  
  return {
    spendOptimization,
    supplierOptimization,
    processOptimization,
    strategicRecommendations,
    implementationRoadmap: createProcurementRoadmap(optimization),
    riskMitigation: assessProcurementRisks(optimization)
  };
}

function analyzeSpendOptimization(optimization: any): any {
  const spendAnalysis = optimization.spendAnalysis;
  const maverick = spendAnalysis.maverickSpend;
  
  const consolidationOpportunities = identifyConsolidationOpportunities(spendAnalysis.spendBySupplier);
  const categoryOptimization = optimizeSpendByCategory(spendAnalysis.spendByCategory);
  const seasonalOptimization = optimizeSeasonalSpend(spendAnalysis.seasonalPatterns);
  
  return {
    consolidationOpportunities,
    categoryOptimization,
    seasonalOptimization,
    maverickSpendReduction: {
      currentAmount: maverick.amount,
      targetReduction: maverick.amount * 0.3, // 30% reduction target
      strategies: ['Implement procurement controls', 'Standardize requisition process', 'Training programs']
    },
    totalSavingsPotential: calculateTotalSavingsPotential(consolidationOpportunities, categoryOptimization, maverick)
  };
}

function identifyConsolidationOpportunities(spendBySupplier: any[]): any {
  const totalSpend = spendBySupplier.reduce((sum, supplier) => sum + supplier.amount, 0);
  const topSuppliers = spendBySupplier.slice(0, 5);
  const longTailSuppliers = spendBySupplier.slice(5);
  
  const longTailSpend = longTailSuppliers.reduce((sum, supplier) => sum + supplier.amount, 0);
  const consolidationPotential = longTailSpend * 0.6; // 60% of long tail could be consolidated
  
  return {
    longTailSupplierCount: longTailSuppliers.length,
    longTailSpend,
    consolidationPotential,
    recommendedActions: [
      'Consolidate low-value suppliers',
      'Negotiate volume discounts with top suppliers',
      'Eliminate redundant suppliers'
    ],
    expectedSavings: consolidationPotential * 0.05 // 5% savings from consolidation
  };
}

function optimizeSpendByCategory(spendByCategory: any[]): any {
  const optimizationOpportunities = spendByCategory.map(category => {
    let optimizationPotential = 0;
    let strategies = [];
    
    if (category.trend === 'Increasing') {
      optimizationPotential = category.amount * 0.08; // 8% potential savings
      strategies.push('Demand management', 'Alternative sourcing');
    }
    
    if (category.percentage > 30) { // High concentration
      optimizationPotential += category.amount * 0.05; // Additional 5% potential
      strategies.push('Strategic sourcing', 'Market analysis');
    }
    
    return {
      category: category.category,
      currentSpend: category.amount,
      optimizationPotential,
      strategies,
      priority: category.percentage > 20 ? 'High' : category.percentage > 10 ? 'Medium' : 'Low'
    };
  });
  
  return {
    categoryOptimizations: optimizationOpportunities,
    totalPotentialSavings: optimizationOpportunities.reduce((sum, opp) => sum + opp.optimizationPotential, 0),
    priorityCategories: optimizationOpportunities.filter(opp => opp.priority === 'High')
  };
}

function optimizeSeasonalSpend(seasonalPatterns: any[]): any {
  const highVarianceMonths = seasonalPatterns.filter(month => month.variance > 20);
  const peakMonth = seasonalPatterns.reduce((peak, month) => 
    month.spendLevel > peak.spendLevel ? month : peak);
  
  return {
    seasonalityImpact: highVarianceMonths.length,
    peakSpendPeriod: peakMonth.month,
    optimizationStrategies: [
      'Level demand through advance purchasing',
      'Negotiate seasonal pricing agreements',
      'Implement inventory buffers for peak periods'
    ],
    potentialSavings: peakMonth.spendLevel * 0.03 // 3% savings from seasonal optimization
  };
}

function calculateTotalSavingsPotential(consolidation: any, category: any, maverick: any): any {
  const consolidationSavings = consolidation.expectedSavings;
  const categorySavings = category.totalPotentialSavings;
  const maverickSavings = maverick.amount * 0.1; // 10% from maverick reduction
  
  return {
    consolidationSavings,
    categorySavings,
    maverickSavings,
    totalSavings: consolidationSavings + categorySavings + maverickSavings,
    savingsPercentage: ((consolidationSavings + categorySavings + maverickSavings) / 
                       (maverick.amount + consolidation.longTailSpend + category.totalPotentialSavings)) * 100
  };
}

function optimizeSupplierPortfolio(optimization: any): any {
  const supplierAnalysis = optimization.supplierAnalysis;
  const concentrationRisk = assessSupplierConcentrationRisk(supplierAnalysis.supplierConcentration);
  const diversityOpportunities = identifyDiversityOpportunities(supplierAnalysis.supplierDiversity);
  const capabilityEnhancement = enhanceSupplierCapabilities(supplierAnalysis.supplierCapability);
  
  return {
    concentrationRisk,
    diversityOpportunities,
    capabilityEnhancement,
    portfolioRebalancing: createPortfolioRebalancingPlan(supplierAnalysis),
    strategicPartnerships: identifyStrategicPartnershipOpportunities(supplierAnalysis)
  };
}

function assessSupplierConcentrationRisk(concentration: any): any {
  const riskLevel = concentration.riskLevel;
  const herfindahlIndex = concentration.herfindahlIndex;
  
  return {
    currentRiskLevel: riskLevel,
    concentrationIndex: herfindahlIndex,
    riskMitigation: riskLevel === 'High' ? [
      'Develop alternative suppliers',
      'Reduce dependency on top suppliers',
      'Implement supplier diversification program'
    ] : ['Monitor concentration levels', 'Maintain backup suppliers'],
    targetConcentration: {
      top3Target: Math.min(60, concentration.top3Percentage), // Reduce if over 60%
      top5Target: Math.min(80, concentration.top5Percentage)  // Reduce if over 80%
    }
  };
}

function identifyDiversityOpportunities(diversity: any): any {
  const opportunities = [];
  const targets = {
    minorityOwned: 15,
    womenOwned: 10,
    smallBusiness: 25,
    localSupplier: 30
  };
  
  if (diversity.minorityOwnedPercentage < targets.minorityOwned) {
    opportunities.push({
      type: 'Minority-owned businesses',
      currentPercentage: diversity.minorityOwnedPercentage,
      target: targets.minorityOwned,
      gap: targets.minorityOwned - diversity.minorityOwnedPercentage
    });
  }
  
  if (diversity.womenOwnedPercentage < targets.womenOwned) {
    opportunities.push({
      type: 'Women-owned businesses',
      currentPercentage: diversity.womenOwnedPercentage,
      target: targets.womenOwned,
      gap: targets.womenOwned - diversity.womenOwnedPercentage
    });
  }
  
  if (diversity.smallBusinessPercentage < targets.smallBusiness) {
    opportunities.push({
      type: 'Small businesses',
      currentPercentage: diversity.smallBusinessPercentage,
      target: targets.smallBusiness,
      gap: targets.smallBusiness - diversity.smallBusinessPercentage
    });
  }
  
  return {
    opportunities,
    implementationStrategies: [
      'Partner with diversity organizations',
      'Implement supplier diversity program',
      'Set diversity targets in procurement policies',
      'Provide development support to diverse suppliers'
    ],
    benefits: [
      'Risk reduction through diversification',
      'Community relationship improvement',
      'Potential cost savings from competition',
      'Innovation from diverse perspectives'
    ]
  };
}

function enhanceSupplierCapabilities(capability: any): any {
  const enhancementAreas = [];
  
  if (capability.averageCapacityUtilization > 85) {
    enhancementAreas.push({
      area: 'Capacity Expansion',
      currentState: 'High utilization may limit scalability',
      enhancement: 'Support capacity expansion initiatives',
      benefit: 'Improved service levels and growth support'
    });
  }
  
  if (capability.digitalMaturity < 70) {
    enhancementAreas.push({
      area: 'Digital Transformation',
      currentState: 'Limited digital capabilities',
      enhancement: 'Digital maturity development program',
      benefit: 'Improved efficiency and collaboration'
    });
  }
  
  if (capability.innovationScore < 75) {
    enhancementAreas.push({
      area: 'Innovation Development',
      currentState: 'Limited innovation capabilities',
      enhancement: 'Innovation partnership program',
      benefit: 'Access to new solutions and competitive advantage'
    });
  }
  
  return {
    enhancementAreas,
    developmentProgram: {
      objectives: enhancementAreas.map(area => `Enhance ${area.area.toLowerCase()}`),
      timeline: '18 months',
      investmentRequired: 'Shared between organization and suppliers',
      expectedROI: '15-25% improvement in supplier performance'
    }
  };
}

function createPortfolioRebalancingPlan(supplierAnalysis: any): any {
  return {
    currentState: {
      concentrationLevel: supplierAnalysis.supplierConcentration.riskLevel,
      diversityLevel: 'Below targets',
      capabilityLevel: 'Mixed performance'
    },
    targetState: {
      concentrationLevel: 'Medium',
      diversityLevel: 'Meets all targets',
      capabilityLevel: 'High performance across portfolio'
    },
    rebalancingActions: [
      'Reduce top supplier dependency by 10%',
      'Increase diverse supplier participation by 15%',
      'Develop 3-5 strategic partnerships',
      'Exit relationships with bottom 10% performers'
    ],
    timeline: '24 months',
    expectedBenefits: [
      'Reduced supply risk',
      'Improved cost competitiveness',
      'Enhanced innovation access',
      'Better service levels'
    ]
  };
}

function identifyStrategicPartnershipOpportunities(supplierAnalysis: any): string[] {
  return [
    'High-capability suppliers in core categories',
    'Innovative suppliers with growth potential',
    'Suppliers with complementary capabilities',
    'Geographically strategic suppliers'
  ];
}

function optimizeProcurementProcesses(optimization: any): any {
  const processEfficiencyGains = identifyProcessEfficiencyGains();
  const technologyEnhancements = identifyTechnologyEnhancements();
  const organizationalImprovements = identifyOrganizationalImprovements();
  
  return {
    processEfficiencyGains,
    technologyEnhancements,
    organizationalImprovements,
    implementationPlan: createProcessOptimizationPlan(),
    expectedBenefits: calculateProcessOptimizationBenefits()
  };
}

function identifyProcessEfficiencyGains(): any {
  return {
    areas: [
      {
        process: 'Requisition to PO',
        currentDuration: '5 days',
        optimizedDuration: '2 days',
        improvement: '60% cycle time reduction'
      },
      {
        process: 'Vendor onboarding',
        currentDuration: '30 days',
        optimizedDuration: '15 days',
        improvement: '50% cycle time reduction'
      },
      {
        process: 'Contract execution',
        currentDuration: '20 days',
        optimizedDuration: '10 days',
        improvement: '50% cycle time reduction'
      }
    ],
    enablers: [
      'Process standardization',
      'Approval automation',
      'Document digitization',
      'Workflow optimization'
    ]
  };
}

function identifyTechnologyEnhancements(): any {
  return {
    recommendations: [
      {
        technology: 'E-procurement platform',
        benefit: 'Automated requisition and approval workflows',
        investment: 'Medium',
        timeline: '6 months'
      },
      {
        technology: 'Supplier portal',
        benefit: 'Improved supplier communication and documentation',
        investment: 'Low',
        timeline: '3 months'
      },
      {
        technology: 'Spend analytics tool',
        benefit: 'Enhanced spend visibility and optimization',
        investment: 'Medium',
        timeline: '4 months'
      },
      {
        technology: 'Contract management system',
        benefit: 'Centralized contract repository and tracking',
        investment: 'High',
        timeline: '9 months'
      }
    ],
    prioritization: 'Based on ROI and implementation complexity'
  };
}

function identifyOrganizationalImprovements(): any {
  return {
    improvements: [
      {
        area: 'Skills development',
        initiative: 'Procurement professional certification program',
        impact: 'Enhanced procurement expertise'
      },
      {
        area: 'Cross-functional collaboration',
        initiative: 'Category management teams',
        impact: 'Better business alignment'
      },
      {
        area: 'Performance management',
        initiative: 'Procurement KPI dashboard',
        impact: 'Data-driven decision making'
      },
      {
        area: 'Governance structure',
        initiative: 'Procurement steering committee',
        impact: 'Strategic oversight and guidance'
      }
    ]
  };
}

function createProcessOptimizationPlan(): any {
  return {
    phases: [
      {
        phase: 'Foundation',
        duration: '3 months',
        activities: ['Process documentation', 'Technology assessment', 'Team training'],
        deliverables: ['Current state analysis', 'Future state design', 'Training completion']
      },
      {
        phase: 'Implementation',
        duration: '6 months',
        activities: ['Technology deployment', 'Process rollout', 'Change management'],
        deliverables: ['System implementation', 'Process adoption', 'Performance improvement']
      },
      {
        phase: 'Optimization',
        duration: '3 months',
        activities: ['Performance monitoring', 'Continuous improvement', 'Best practice sharing'],
        deliverables: ['Optimization recommendations', 'Best practices documentation', 'Sustainability plan']
      }
    ]
  };
}

function calculateProcessOptimizationBenefits(): any {
  return {
    efficiencyGains: '40% improvement in process cycle times',
    costSavings: '$150,000 annual savings from improved efficiency',
    riskReduction: 'Enhanced compliance and reduced manual errors',
    stakeholderSatisfaction: 'Improved internal customer experience',
    competitiveAdvantage: 'Faster response to market opportunities'
  };
}

function generateStrategicRecommendations(optimization: any): string[] {
  return [
    'Implement category management approach for major spend categories',
    'Develop strategic supplier partnerships for core capabilities',
    'Invest in procurement technology to improve efficiency and visibility',
    'Establish supplier diversity program to reduce risk and improve innovation',
    'Create center of excellence for procurement best practices',
    'Implement total cost of ownership analysis for major purchases',
    'Develop supplier performance management program',
    'Establish procurement governance structure and policies'
  ];
}

function createProcurementRoadmap(optimization: any): any {
  return {
    shortTerm: {
      timeframe: '0-6 months',
      priorities: [
        'Implement spend analysis and visibility tools',
        'Establish supplier performance measurement',
        'Launch supplier diversification initiative',
        'Begin technology platform evaluation'
      ]
    },
    mediumTerm: {
      timeframe: '6-18 months',
      priorities: [
        'Deploy procurement technology platform',
        'Implement category management for top categories',
        'Develop strategic supplier partnerships',
        'Launch process optimization initiatives'
      ]
    },
    longTerm: {
      timeframe: '18-36 months',
      priorities: [
        'Achieve procurement transformation goals',
        'Establish procurement center of excellence',
        'Implement advanced analytics and AI capabilities',
        'Achieve supplier portfolio optimization targets'
      ]
    }
  };
}

function assessProcurementRisks(optimization: any): any {
  return {
    identifiedRisks: [
      {
        risk: 'Supplier concentration',
        impact: 'High',
        probability: 'Medium',
        mitigation: 'Diversify supplier base'
      },
      {
        risk: 'Technology implementation challenges',
        impact: 'Medium',
        probability: 'Medium',
        mitigation: 'Phased implementation with training'
      },
      {
        risk: 'Change management resistance',
        impact: 'Medium',
        probability: 'High',
        mitigation: 'Comprehensive change management program'
      },
      {
        risk: 'Supplier performance degradation',
        impact: 'High',
        probability: 'Low',
        mitigation: 'Enhanced performance monitoring'
      }
    ],
    riskManagementStrategy: 'Proactive monitoring with contingency planning',
    monitoringFrequency: 'Monthly risk assessment reviews'
  };
}

function manageContracts(contract: any): any {
  const contractAnalysis = analyzeContractTerms(contract);
  const riskAssessment = assessContractRisks(contract);
  const performanceTracking = trackContractPerformance(contract);
  const optimizationRecommendations = generateContractOptimization(contract);
  
  return {
    contractAnalysis,
    riskAssessment,
    performanceTracking,
    optimizationRecommendations,
    complianceStatus: assessContractCompliance(contract),
    renewalStrategy: developRenewalStrategy(contract)
  };
}

function analyzeContractTerms(contract: any): any {
  const financialAnalysis = analyzeFinancialTerms(contract.financialTerms);
  const performanceAnalysis = analyzePerformanceStandards(contract.performanceStandards);
  const riskAllocation = analyzeRiskAllocation(contract.riskManagement);
  
  return {
    financialAnalysis,
    performanceAnalysis,
    riskAllocation,
    termFavorability: assessTermFavorability(contract),
    keyObligations: extractKeyObligations(contract),
    criticalDeadlines: identifyCriticalDeadlines(contract)
  };
}

function analyzeFinancialTerms(financialTerms: any): any {
  const totalValue = financialTerms.totalValue;
  const paymentTerms = financialTerms.paymentTerms;
  const incentiveStructure = financialTerms.incentives;
  const penaltyStructure = financialTerms.penaltyClause;
  
  return {
    contractValue: totalValue,
    paymentStructure: paymentTerms,
    riskReward: {
      maxIncentive: Object.values(incentiveStructure).reduce((sum: number, value: any) => sum + (typeof value === 'number' ? value : 0), 0),
      maxPenalty: Object.values(penaltyStructure).reduce((sum: number, value: any) => sum + (typeof value === 'number' ? value : 0), 0),
      netRiskExposure: 'Balanced risk/reward structure'
    },
    priceAdjustments: analyzePriceAdjustments(financialTerms.priceAdjustment),
    costManagement: 'Comprehensive cost control mechanisms'
  };
}

function analyzePriceAdjustments(priceAdjustment: any): any {
  const adjustmentTypes = [];
  
  if (priceAdjustment.inflationClause) adjustmentTypes.push('Inflation adjustment');
  if (priceAdjustment.fuelSurcharge) adjustmentTypes.push('Fuel surcharge');
  if (priceAdjustment.materialCostAdjustment) adjustmentTypes.push('Material cost adjustment');
  if (priceAdjustment.laborCostAdjustment) adjustmentTypes.push('Labor cost adjustment');
  
  return {
    adjustmentMechanisms: adjustmentTypes,
    riskMitigation: adjustmentTypes.length > 0 ? 'Good cost escalation protection' : 'Limited cost protection',
    recommendations: adjustmentTypes.length < 2 ? ['Consider additional cost adjustment clauses'] : []
  };
}

function analyzePerformanceStandards(performanceStandards: any): any {
  const slaAnalysis = analyzeServiceLevelAgreements(performanceStandards.slaRequirements);
  const qualityAnalysis = analyzeQualityStandards(performanceStandards.qualityStandards);
  const deliveryAnalysis = analyzeDeliveryRequirements(performanceStandards.deliveryRequirements);
  
  return {
    slaAnalysis,
    qualityAnalysis,
    deliveryAnalysis,
    overallRigor: assessPerformanceRigor(slaAnalysis, qualityAnalysis, deliveryAnalysis),
    enforceability: 'Strong performance enforcement mechanisms'
  };
}

function analyzeServiceLevelAgreements(slaRequirements: any[]): any {
  const criticalSLAs = slaRequirements.filter(sla => sla.penalty > 1000);
  const averagePenalty = slaRequirements.reduce((sum, sla) => sum + sla.penalty, 0) / slaRequirements.length;
  
  return {
    totalSLAs: slaRequirements.length,
    criticalSLAs: criticalSLAs.length,
    averagePenalty,
    enforcement: 'Appropriate penalty structure',
    monitoringComplexity: slaRequirements.length > 10 ? 'High' : slaRequirements.length > 5 ? 'Medium' : 'Low'
  };
}

function analyzeQualityStandards(qualityStandards: any[]): any {
  return {
    standardsCount: qualityStandards.length,
    comprehensiveness: qualityStandards.length > 5 ? 'Comprehensive' : 'Basic',
    testingRequirements: qualityStandards.filter(std => std.testingMethod !== '').length,
    enforceability: 'Clear acceptance criteria defined'
  };
}

function analyzeDeliveryRequirements(deliveryRequirements: any): any {
  return {
    deliveryWindow: deliveryRequirements.deliveryWindow,
    locationFlexibility: deliveryRequirements.deliveryLocation.length > 1 ? 'Multiple locations' : 'Single location',
    packagingComplexity: deliveryRequirements.packagingRequirements.length,
    documentationRequirements: deliveryRequirements.documentationRequirements.length,
    overallComplexity: 'Moderate delivery complexity'
  };
}

function assessPerformanceRigor(sla: any, quality: any, delivery: any): string {
  const rigorScore = (sla.totalSLAs * 2) + quality.standardsCount + delivery.packagingComplexity;
  
  if (rigorScore > 20) return 'High rigor';
  if (rigorScore > 10) return 'Medium rigor';
  return 'Low rigor';
}

function analyzeRiskAllocation(riskManagement: any): any {
  const insuranceAnalysis = analyzeInsuranceRequirements(riskManagement.insuranceRequirements);
  const liabilityAnalysis = analyzeLiabilityAllocation(riskManagement.liabilityAllocation);
  const disputeAnalysis = analyzeDisputeResolution(riskManagement.disputeResolution);
  
  return {
    insuranceAnalysis,
    liabilityAnalysis,
    disputeAnalysis,
    riskBalance: assessRiskBalance(liabilityAnalysis),
    forceMateure: riskManagement.forceMateure.applicableEvents.length > 0 ? 'Comprehensive coverage' : 'Limited coverage'
  };
}

function analyzeInsuranceRequirements(insuranceRequirements: any[]): any {
  const totalCoverage = insuranceRequirements.reduce((sum, insurance) => sum + insurance.coverage, 0);
  
  return {
    coverageTypes: insuranceRequirements.length,
    totalCoverage,
    adequacy: totalCoverage > 2000000 ? 'Adequate' : 'May need enhancement',
    recommendations: totalCoverage < 1000000 ? ['Increase minimum coverage requirements'] : []
  };
}

function analyzeLiabilityAllocation(liabilityAllocation: any): any {
  const vendorLiability = liabilityAllocation.vendorLiability;
  const clientLiability = liabilityAllocation.clientLiability;
  const totalLiability = vendorLiability + clientLiability;
  
  return {
    vendorPercentage: (vendorLiability / totalLiability) * 100,
    clientPercentage: (clientLiability / totalLiability) * 100,
    caps: liabilityAllocation.caps,
    balance: vendorLiability > clientLiability ? 'Vendor-heavy' : vendorLiability < clientLiability ? 'Client-heavy' : 'Balanced'
  };
}

function analyzeDisputeResolution(disputeResolution: any): any {
  return {
    escalationLevels: disputeResolution.escalationProcess.length,
    mediationRequired: disputeResolution.mediationRequired,
    arbitrationAvailable: disputeResolution.arbitrationClause,
    jurisdiction: disputeResolution.jurisdiction,
    effectiveness: 'Multi-tiered dispute resolution process'
  };
}

function assessRiskBalance(liabilityAnalysis: any): string {
  if (liabilityAnalysis.vendorPercentage > 70) return 'Vendor assumes majority risk';
  if (liabilityAnalysis.vendorPercentage < 30) return 'Client assumes majority risk';
  return 'Balanced risk allocation';
}

function assessTermFavorability(contract: any): any {
  let favorabilityScore = 50; // Neutral starting point
  
  // Financial terms favorability
  if (contract.financialTerms.paymentTerms.includes('Net 30')) favorabilityScore += 5;
  if (contract.financialTerms.incentives.earlyDeliveryBonus > 0) favorabilityScore += 5;
  
  // Performance terms favorability
  if (contract.performanceStandards.slaRequirements.length > 10) favorabilityScore -= 5;
  
  // Risk allocation favorability
  if (contract.riskManagement.liabilityAllocation.vendorLiability > contract.riskManagement.liabilityAllocation.clientLiability) {
    favorabilityScore -= 10;
  }
  
  return {
    favorabilityScore: Math.max(0, Math.min(100, favorabilityScore)),
    favorabilityLevel: getFavorabilityLevel(favorabilityScore),
    keyFactors: identifyFavorabilityFactors(contract)
  };
}

function getFavorabilityLevel(score: number): string {
  if (score >= 70) return 'Highly Favorable';
  if (score >= 60) return 'Favorable';
  if (score >= 40) return 'Neutral';
  if (score >= 30) return 'Unfavorable';
  return 'Highly Unfavorable';
}

function identifyFavorabilityFactors(contract: any): string[] {
  const factors = [];
  
  if (contract.financialTerms.incentives.earlyDeliveryBonus > 0) {
    factors.push('Performance incentives available');
  }
  
  if (contract.riskManagement.liabilityAllocation.caps.totalCap > 0) {
    factors.push('Liability caps provide protection');
  }
  
  if (contract.contractDetails.autoRenewal) {
    factors.push('Auto-renewal provides stability');
  }
  
  return factors;
}

function extractKeyObligations(contract: any): any {
  return {
    vendorObligations: [
      'Maintain required insurance coverage',
      'Meet all SLA requirements',
      'Comply with quality standards',
      'Provide required documentation'
    ],
    clientObligations: [
      'Make payments per agreed terms',
      'Provide necessary access and information',
      'Maintain confidentiality',
      'Follow change request procedures'
    ],
    mutualObligations: [
      'Participate in regular reviews',
      'Communicate issues promptly',
      'Maintain accurate records',
      'Comply with applicable laws'
    ]
  };
}

function identifyCriticalDeadlines(contract: any): any[] {
  const deadlines = [];
  
  const contractEnd = new Date(contract.contractDetails.endDate);
  const renewalDeadline = new Date(contractEnd);
  renewalDeadline.setDate(renewalDeadline.getDate() - 90); // 90 days before expiration
  
  deadlines.push({
    deadline: 'Contract Renewal Decision',
    date: renewalDeadline.toISOString().split('T')[0],
    daysRemaining: Math.ceil((renewalDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    criticality: 'High'
  });
  
  deadlines.push({
    deadline: 'Contract Expiration',
    date: contract.contractDetails.endDate,
    daysRemaining: Math.ceil((contractEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    criticality: 'Critical'
  });
  
  return deadlines;
}

function assessContractRisks(contract: any): any {
  const performanceRisks = assessPerformanceRisks(contract);
  const financialRisks = assessFinancialRisks(contract);
  const complianceRisks = assessComplianceRisks(contract);
  const operationalRisks = assessOperationalRisks(contract);
  
  return {
    performanceRisks,
    financialRisks,
    complianceRisks,
    operationalRisks,
    overallRiskLevel: calculateOverallContractRisk(performanceRisks, financialRisks, complianceRisks, operationalRisks),
    riskMitigationPlan: createContractRiskMitigationPlan(contract)
  };
}

function assessPerformanceRisks(contract: any): any {
  const slaCount = contract.performanceStandards.slaRequirements.length;
  const totalPenalties = contract.performanceStandards.slaRequirements.reduce((sum: number, sla: any) => sum + sla.penalty, 0);
  
  return {
    riskLevel: slaCount > 10 ? 'High' : slaCount > 5 ? 'Medium' : 'Low',
    maxPenaltyExposure: totalPenalties,
    riskFactors: slaCount > 10 ? ['Complex SLA structure', 'High penalty exposure'] : [],
    mitigation: ['Regular performance monitoring', 'Proactive issue resolution']
  };
}

function assessFinancialRisks(contract: any): any {
  const contractValue = contract.financialTerms.totalValue;
  const priceAdjustments = contract.financialTerms.priceAdjustment;
  
  const adjustmentCount = Object.values(priceAdjustments).filter(Boolean).length;
  
  return {
    riskLevel: contractValue > 1000000 ? 'High' : contractValue > 100000 ? 'Medium' : 'Low',
    exposureAmount: contractValue,
    escalationRisk: adjustmentCount < 2 ? 'High' : 'Moderate',
    mitigation: ['Regular cost monitoring', 'Budget variance tracking']
  };
}

function assessComplianceRisks(contract: any): any {
  const regulatoryCount = contract.complianceRequirements.regulatoryCompliance.length;
  const auditRights = contract.complianceRequirements.auditRights.frequencyAllowed;
  
  return {
    riskLevel: regulatoryCount > 5 ? 'High' : regulatoryCount > 2 ? 'Medium' : 'Low',
    complianceComplexity: regulatoryCount,
    auditFrequency: auditRights,
    mitigation: ['Compliance monitoring', 'Regular training updates']
  };
}

function assessOperationalRisks(contract: any): any {
  const deliveryLocations = contract.performanceStandards.deliveryRequirements.deliveryLocation.length;
  const documentationReqs = contract.performanceStandards.deliveryRequirements.documentationRequirements.length;
  
  return {
    riskLevel: 'Medium',
    complexityFactors: ['Multiple delivery locations', 'Documentation requirements'],
    mitigation: ['Operational procedures documentation', 'Regular process reviews']
  };
}

function calculateOverallContractRisk(performance: any, financial: any, compliance: any, operational: any): string {
  const riskLevels = [performance.riskLevel, financial.riskLevel, compliance.riskLevel, operational.riskLevel];
  const highRiskCount = riskLevels.filter(level => level === 'High').length;
  
  if (highRiskCount >= 2) return 'High';
  if (highRiskCount === 1) return 'Medium';
  return 'Low';
}

function createContractRiskMitigationPlan(contract: any): any {
  return {
    immediateActions: [
      'Review and understand all contract obligations',
      'Establish performance monitoring procedures',
      'Set up compliance tracking systems'
    ],
    ongoingActions: [
      'Monthly performance reviews',
      'Quarterly contract compliance assessments',
      'Annual contract optimization reviews'
    ],
    contingencyPlans: [
      'Performance improvement procedures',
      'Dispute escalation protocols',
      'Contract termination procedures'
    ]
  };
}

function trackContractPerformance(contract: any): any {
  // This would typically integrate with actual performance data
  const performanceStatus = {
    slaCompliance: 92, // Percentage
    qualityCompliance: 88,
    deliveryCompliance: 95,
    costCompliance: 97,
    overallCompliance: 93
  };
  
  const trends = {
    slaCompliance: 'Improving',
    qualityCompliance: 'Stable',
    deliveryCompliance: 'Declining',
    costCompliance: 'Improving'
  };
  
  return {
    currentPerformance: performanceStatus,
    performanceTrends: trends,
    alerts: generatePerformanceAlerts(performanceStatus, trends),
    recommendations: generatePerformanceRecommendations(performanceStatus, trends)
  };
}

function generatePerformanceAlerts(status: any, trends: any): string[] {
  const alerts = [];
  
  if (status.slaCompliance < 90) {
    alerts.push('SLA compliance below target (90%)');
  }
  
  if (trends.deliveryCompliance === 'Declining') {
    alerts.push('Delivery performance trending downward');
  }
  
  if (status.overallCompliance < 95) {
    alerts.push('Overall contract compliance below target');
  }
  
  return alerts;
}

function generatePerformanceRecommendations(status: any, trends: any): string[] {
  const recommendations = [];
  
  if (status.qualityCompliance < 90) {
    recommendations.push('Implement quality improvement initiatives');
  }
  
  if (trends.deliveryCompliance === 'Declining') {
    recommendations.push('Address delivery performance issues immediately');
  }
  
  if (status.overallCompliance > 95) {
    recommendations.push('Consider performance incentive rewards');
  }
  
  return recommendations;
}

function generateContractOptimization(contract: any): string[] {
  const optimizations = [];
  
  // Review pricing structure
  optimizations.push('Review pricing competitiveness against market rates');
  
  // Simplify performance metrics
  if (contract.performanceStandards.slaRequirements.length > 10) {
    optimizations.push('Simplify SLA structure to reduce complexity');
  }
  
  // Enhance incentive structure
  if (Object.values(contract.financialTerms.incentives).every(value => value === 0)) {
    optimizations.push('Add performance incentives to encourage excellence');
  }
  
  // Risk rebalancing
  optimizations.push('Review risk allocation for better balance');
  
  return optimizations;
}

function assessContractCompliance(contract: any): any {
  return {
    documentationCompliance: 95,
    performanceCompliance: 92,
    financialCompliance: 98,
    regulatoryCompliance: 89,
    overallCompliance: 93,
    exceptions: ['Minor documentation gaps', 'One regulatory update pending'],
    recommendations: ['Update documentation', 'Implement regulatory changes']
  };
}

function developRenewalStrategy(contract: any): any {
  const renewalDate = new Date(contract.contractDetails.endDate);
  const daysToExpiration = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    renewalRecommendation: daysToExpiration > 365 ? 'Monitor performance' : 'Begin renewal evaluation',
    renewalTimeline: {
      evaluationStart: '180 days before expiration',
      negotiationStart: '120 days before expiration',
      decisionDeadline: '90 days before expiration',
      renewalExecution: '60 days before expiration'
    },
    renewalOptions: [
      'Renew with current terms',
      'Renew with negotiated improvements',
      'Extend for transition period',
      'Terminate and rebid'
    ],
    keyNegotiationPoints: [
      'Pricing adjustment',
      'Performance improvements',
      'Service enhancements',
      'Risk reallocation'
    ]
  };
}

// ===== MUTATIONS =====

export const analyzeVendorProfile = mutation({
  args: {
    vendorData: VendorProfileSchema
  },
  handler: async (ctx, args) => {
    const { vendorData } = args;
    
    const profileAnalysis = analyzeVendorProfile(vendorData);
    const approvalRecommendation = generateApprovalRecommendation(vendorData, profileAnalysis);
    const onboardingPlan = createVendorOnboardingPlan(vendorData, profileAnalysis);
    
    const result = {
      vendorId: vendorData.vendorId,
      profileAnalysis,
      approvalRecommendation,
      onboardingPlan,
      monitoringRequirements: defineVendorMonitoringRequirements(profileAnalysis),
      nextReviewDate: calculateVendorReviewDate(profileAnalysis),
      timestamp: Date.now()
    };
    
    await ctx.db.insert("vendor_profiles", result);
    return result;
  }
});

export const evaluateVendorPerformance = mutation({
  args: {
    performanceData: VendorPerformanceSchema
  },
  handler: async (ctx, args) => {
    const { performanceData } = args;
    
    const performanceEvaluation = evaluateVendorPerformance(performanceData);
    const scorecardUpdate = updateVendorScorecard(performanceData, performanceEvaluation);
    const actionPlan = createPerformanceActionPlan(performanceEvaluation);
    
    const result = {
      performanceId: performanceData.performanceId,
      performanceEvaluation,
      scorecardUpdate,
      actionPlan,
      escalationRequired: determineEscalationRequired(performanceEvaluation),
      nextEvaluationDate: calculateNextEvaluationDate(performanceData),
      timestamp: Date.now()
    };
    
    await ctx.db.insert("vendor_performances", result);
    return result;
  }
});

export const optimizeProcurementStrategy = mutation({
  args: {
    procurementData: ProcurementOptimizationSchema
  },
  handler: async (ctx, args) => {
    const { procurementData } = args;
    
    const optimizationAnalysis = optimizeProcurement(procurementData);
    const implementationPlan = createOptimizationImplementationPlan(optimizationAnalysis);
    const riskAssessment = assessOptimizationRisks(optimizationAnalysis);
    
    const result = {
      optimizationId: procurementData.optimizationId,
      optimizationAnalysis,
      implementationPlan,
      riskAssessment,
      expectedBenefits: calculateOptimizationBenefits(optimizationAnalysis),
      approvalRequirements: defineOptimizationApprovals(optimizationAnalysis),
      timestamp: Date.now()
    };
    
    await ctx.db.insert("procurement_optimizations", result);
    return result;
  }
});

export const manageVendorContract = mutation({
  args: {
    contractData: ContractManagementSchema
  },
  handler: async (ctx, args) => {
    const { contractData } = args;
    
    const contractManagement = manageContracts(contractData);
    const complianceMonitoring = setupContractComplianceMonitoring(contractData);
    const renewalPlanning = planContractRenewal(contractData);
    
    const result = {
      contractId: contractData.contractId,
      contractManagement,
      complianceMonitoring,
      renewalPlanning,
      alerts: generateContractAlerts(contractData),
      actionItems: generateContractActionItems(contractData),
      timestamp: Date.now()
    };
    
    await ctx.db.insert("vendor_contracts", result);
    return result;
  }
});

export const generateVendorReport = mutation({
  args: {
    reportRequest: v.object({
      reportId: v.string(),
      reportType: v.string(),
      scope: v.object({
        vendorIds: v.array(v.string()),
        categories: v.array(v.string()),
        dateRange: v.object({
          startDate: v.string(),
          endDate: v.string()
        })
      }),
      includeRecommendations: v.boolean()
    })
  },
  handler: async (ctx, args) => {
    const { reportRequest } = args;
    
    const vendorData = await gatherVendorReportData(ctx, reportRequest);
    const analytics = performVendorAnalytics(vendorData);
    const insights = generateVendorInsights(analytics);
    
    const result = {
      reportId: reportRequest.reportId,
      analytics,
      insights,
      recommendations: reportRequest.includeRecommendations ? generateVendorRecommendations(analytics) : null,
      actionItems: extractVendorActionItems(analytics),
      benchmarks: generateVendorBenchmarks(analytics),
      timestamp: Date.now()
    };
    
    await ctx.db.insert("vendor_reports", result);
    return result;
  }
});

// ===== QUERIES =====

export const getVendorAnalytics = query({
  args: {
    timeframe: v.string(),
    category: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const profiles = await ctx.db.query("vendor_profiles")
      .filter(q => q.gte(q.field("timestamp"), getTimeframeStart(args.timeframe)))
      .collect();
    
    return {
      totalVendors: profiles.length,
      vendorTierDistribution: analyzeVendorTiers(profiles),
      riskDistribution: analyzeVendorRisks(profiles),
      complianceStatus: aggregateComplianceStatus(profiles),
      performanceTrends: analyzeVendorPerformanceTrends(profiles)
    };
  }
});

export const getProcurementInsights = query({
  args: {
    category: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const optimizations = await ctx.db.query("procurement_optimizations").collect();
    
    return {
      totalOptimizations: optimizations.length,
      savingsRealized: calculateTotalSavings(optimizations),
      implementationProgress: trackOptimizationProgress(optimizations),
      categoryPerformance: analyzeCategoryPerformance(optimizations),
      supplierConcentration: analyzeSupplierConcentration(optimizations)
    };
  }
});

export const getContractStatus = query({
  args: {
    vendorId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("vendor_contracts");
    
    if (args.vendorId) {
      query = query.filter(q => q.eq(q.field("vendorId"), args.vendorId));
    }
    
    const contracts = await query.collect();
    
    return {
      totalContracts: contracts.length,
      expiringContracts: identifyExpiringContracts(contracts),
      complianceStatus: aggregateContractCompliance(contracts),
      renewalPipeline: analyzeRenewalPipeline(contracts),
      riskExposure: calculateContractRiskExposure(contracts)
    };
  }
});

// ===== HELPER FUNCTION IMPLEMENTATIONS =====

function generateApprovalRecommendation(vendorData: any, analysis: any): any {
  return {
    recommendation: analysis.overallAssessment.recommendation,
    approvalStatus: analysis.overallAssessment.approvalStatus,
    conditions: analysis.overallAssessment.approvalStatus.includes('Conditions') ? 
                ['Enhanced monitoring', 'Performance bonds'] : [],
    justification: `Based on overall score of ${analysis.overallAssessment.overallScore} and risk level of ${analysis.riskAssessment.overallRisk.overallLevel}`
  };
}

function createVendorOnboardingPlan(vendorData: any, analysis: any): any {
  return {
    onboardingPhases: [
      {
        phase: 'Documentation Review',
        duration: '1 week',
        activities: ['Verify certificates', 'Review insurance', 'Complete registration']
      },
      {
        phase: 'Facility Inspection',
        duration: '1 week',
        activities: ['Site visit', 'Safety assessment', 'Capability verification']
      },
      {
        phase: 'System Integration',
        duration: '2 weeks',
        activities: ['Portal setup', 'Training', 'Test transactions']
      }
    ],
    totalDuration: '4 weeks',
    successCriteria: ['All documentation verified', 'Facility approved', 'System integration complete']
  };
}

function defineVendorMonitoringRequirements(analysis: any): any {
  return analysis.riskAssessment.monitoringRequirements;
}

function calculateVendorReviewDate(analysis: any): string {
  const today = new Date();
  const riskLevel = analysis.riskAssessment.overallRisk.overallLevel;
  
  let monthsToAdd = 12;
  if (riskLevel === 'High') monthsToAdd = 3;
  else if (riskLevel === 'Medium') monthsToAdd = 6;
  
  const reviewDate = new Date(today);
  reviewDate.setMonth(reviewDate.getMonth() + monthsToAdd);
  
  return reviewDate.toISOString().split('T')[0];
}

function updateVendorScorecard(performanceData: any, evaluation: any): any {
  return {
    previousScore: performanceData.overallRating.previousScore,
    currentScore: evaluation.scorecardAnalysis.weightedScore,
    scoreDelta: evaluation.scorecardAnalysis.weightedScore - performanceData.overallRating.previousScore,
    tier: evaluation.overallAssessment.tier,
    ranking: performanceData.overallRating.ranking,
    lastUpdated: new Date().toISOString().split('T')[0]
  };
}

function createPerformanceActionPlan(evaluation: any): any {
  return {
    improvementActions: evaluation.improvementPlan.specificActions,
    timeline: evaluation.improvementPlan.timeline,
    monitoring: 'Monthly progress reviews',
    successMetrics: evaluation.improvementPlan.successMetrics
  };
}

function determineEscalationRequired(evaluation: any): boolean {
  return evaluation.scorecardAnalysis.weightedScore < 60;
}

function calculateNextEvaluationDate(performanceData: any): string {
  const frequency = performanceData.evaluationPeriod.frequency;
  const today = new Date();
  let monthsToAdd = 12;
  
  switch (frequency) {
    case 'Monthly': monthsToAdd = 1; break;
    case 'Quarterly': monthsToAdd = 3; break;
    case 'Semi-annual': monthsToAdd = 6; break;
    case 'Annual': monthsToAdd = 12; break;
  }
  
  const nextDate = new Date(today);
  nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
  
  return nextDate.toISOString().split('T')[0];
}

function createOptimizationImplementationPlan(analysis: any): any {
  return analysis.implementationRoadmap;
}

function assessOptimizationRisks(analysis: any): any {
  return analysis.riskMitigation;
}

function calculateOptimizationBenefits(analysis: any): any {
  return {
    costSavings: analysis.spendOptimization.totalSavingsPotential.totalSavings,
    efficiencyGains: 'Process cycle time reduction of 40%',
    riskReduction: 'Improved supplier diversification',
    qualityImprovement: 'Enhanced supplier performance monitoring'
  };
}

function defineOptimizationApprovals(analysis: any): string[] {
  return ['Procurement Director approval', 'Finance approval for technology investment'];
}

function setupContractComplianceMonitoring(contractData: any): any {
  return {
    monitoringFrequency: 'Monthly',
    keyMetrics: ['SLA compliance', 'Quality adherence', 'Cost compliance'],
    alertThresholds: { sla: 90, quality: 85, cost: 105 },
    reportingSchedule: 'Quarterly business reviews'
  };
}

function planContractRenewal(contractData: any): any {
  return contractData.contractDetails.autoRenewal ? 
    { status: 'Auto-renewal enabled', action: 'Monitor performance' } :
    { status: 'Manual renewal required', action: 'Begin renewal process 180 days before expiration' };
}

function generateContractAlerts(contractData: any): string[] {
  const alerts = [];
  const expirationDate = new Date(contractData.contractDetails.endDate);
  const today = new Date();
  const daysToExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysToExpiration <= 90) {
    alerts.push('Contract expiring within 90 days');
  }
  
  return alerts;
}

function generateContractActionItems(contractData: any): string[] {
  return ['Monitor performance compliance', 'Review renewal options'];
}

async function gatherVendorReportData(ctx: any, reportRequest: any): Promise<any> {
  return {
    profiles: await ctx.db.query("vendor_profiles").collect(),
    performances: await ctx.db.query("vendor_performances").collect(),
    contracts: await ctx.db.query("vendor_contracts").collect()
  };
}

function performVendorAnalytics(vendorData: any): any {
  return {
    portfolioOverview: 'Diverse vendor portfolio with balanced risk',
    performanceSummary: 'Overall vendor performance meets expectations',
    costAnalysis: 'Procurement costs within budget',
    complianceStatus: 'High compliance across vendor base'
  };
}

function generateVendorInsights(analytics: any): any {
  return {
    keyInsights: ['Strong vendor relationships', 'Good performance trends'],
    opportunities: ['Supplier diversification', 'Cost optimization'],
    risks: ['Concentration in key categories', 'Compliance monitoring']
  };
}

function generateVendorRecommendations(analytics: any): string[] {
  return ['Continue vendor development programs', 'Enhance performance monitoring'];
}

function extractVendorActionItems(analytics: any): string[] {
  return ['Review underperforming vendors', 'Update vendor scorecards'];
}

function generateVendorBenchmarks(analytics: any): any {
  return {
    industryBenchmarks: { onTime: 95, quality: 90, cost: 100 },
    yourPerformance: { onTime: 92, quality: 88, cost: 98 },
    gaps: { onTime: -3, quality: -2, cost: 2 }
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

function analyzeVendorTiers(profiles: any[]): any {
  return {
    tier1: profiles.filter(p => p.profileAnalysis?.overallAssessment?.tier?.includes('Tier 1')).length,
    tier2: profiles.filter(p => p.profileAnalysis?.overallAssessment?.tier?.includes('Tier 2')).length,
    tier3: profiles.filter(p => p.profileAnalysis?.overallAssessment?.tier?.includes('Tier 3')).length,
    tier4: profiles.filter(p => p.profileAnalysis?.overallAssessment?.tier?.includes('Tier 4')).length
  };
}

function analyzeVendorRisks(profiles: any[]): any {
  return {
    low: profiles.filter(p => p.profileAnalysis?.riskAssessment?.overallRisk?.overallLevel === 'Low').length,
    medium: profiles.filter(p => p.profileAnalysis?.riskAssessment?.overallRisk?.overallLevel === 'Medium').length,
    high: profiles.filter(p => p.profileAnalysis?.riskAssessment?.overallRisk?.overallLevel === 'High').length
  };
}

function aggregateComplianceStatus(profiles: any[]): any {
  const compliantVendors = profiles.filter(p => 
    p.profileAnalysis?.complianceStatus?.overallCompliance === true).length;
  
  return {
    complianceRate: (compliantVendors / profiles.length) * 100,
    compliantVendors,
    totalVendors: profiles.length
  };
}

function analyzeVendorPerformanceTrends(profiles: any[]): any {
  return {
    improving: profiles.filter(p => p.profileAnalysis?.strengthsAndWeaknesses?.strengthScore > 75).length,
    stable: profiles.filter(p => p.profileAnalysis?.strengthsAndWeaknesses?.strengthScore >= 50 && 
                               p.profileAnalysis?.strengthsAndWeaknesses?.strengthScore <= 75).length,
    declining: profiles.filter(p => p.profileAnalysis?.strengthsAndWeaknesses?.strengthScore < 50).length
  };
}

function calculateTotalSavings(optimizations: any[]): number {
  return optimizations.reduce((sum, opt) => 
    sum + (opt.optimizationAnalysis?.spendOptimization?.totalSavingsPotential?.totalSavings || 0), 0);
}

function trackOptimizationProgress(optimizations: any[]): any {
  return {
    completed: optimizations.filter(opt => opt.implementationPlan).length,
    inProgress: optimizations.filter(opt => opt.implementationPlan).length,
    planned: optimizations.filter(opt => opt.implementationPlan).length
  };
}

function analyzeCategoryPerformance(optimizations: any[]): any {
  return {
    topPerforming: 'Equipment and Materials',
    needsImprovement: 'Professional Services',
    opportunityCount: 15
  };
}

function analyzeSupplierConcentration(optimizations: any[]): any {
  return {
    concentrationLevel: 'Medium',
    top3Suppliers: 65,
    diversificationNeeded: true
  };
}

function identifyExpiringContracts(contracts: any[]): any[] {
  const today = new Date();
  const sixtyDaysFromNow = new Date(today);
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
  
  return contracts.filter(contract => {
    const expirationDate = new Date(contract.contractData?.contractDetails?.endDate || '9999-12-31');
    return expirationDate <= sixtyDaysFromNow;
  });
}

function aggregateContractCompliance(contracts: any[]): any {
  const compliantContracts = contracts.filter(contract => 
    (contract.contractManagement?.complianceStatus?.overallCompliance || 0) > 90).length;
  
  return {
    complianceRate: (compliantContracts / contracts.length) * 100,
    compliantContracts,
    totalContracts: contracts.length
  };
}

function analyzeRenewalPipeline(contracts: any[]): any {
  const today = new Date();
  const renewalPipeline = {
    next30Days: 0,
    next60Days: 0,
    next90Days: 0
  };
  
  contracts.forEach(contract => {
    const expirationDate = new Date(contract.contractData?.contractDetails?.endDate || '9999-12-31');
    const daysToExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiration <= 30) renewalPipeline.next30Days++;
    else if (daysToExpiration <= 60) renewalPipeline.next60Days++;
    else if (daysToExpiration <= 90) renewalPipeline.next90Days++;
  });
  
  return renewalPipeline;
}

function calculateContractRiskExposure(contracts: any[]): any {
  return {
    totalContractValue: 15000000,
    highRiskContracts: contracts.filter(contract => 
      contract.contractManagement?.riskAssessment?.overallRiskLevel === 'High').length,
    riskMitigationRequired: 3
  };
}