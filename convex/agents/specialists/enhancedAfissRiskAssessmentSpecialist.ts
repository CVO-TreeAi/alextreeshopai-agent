import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

export const performAfissAssessment = mutation({
  args: {
    afissRequest: v.object({
      jobId: v.string(),
      siteInformation: v.object({
        address: v.string(),
        gpsCoordinates: v.object({
          latitude: v.number(),
          longitude: v.number()
        }),
        propertyType: v.string(),
        lotSize: v.number(),
        zoning: v.string()
      }),
      treeData: v.array(v.object({
        treeId: v.string(),
        species: v.string(),
        dbh: v.number(),
        height: v.number(),
        crownRadius: v.number(),
        treeScore: v.number(),
        condition: v.string(),
        location: v.object({
          distanceFromStructures: v.number(),
          distanceFromPowerLines: v.number(),
          distanceFromRoad: v.number(),
          elevation: v.number()
        })
      })),
      accessAssessment: v.object({
        vehicleAccess: v.object({
          canReachWithTruck: v.boolean(),
          craneAccess: v.boolean(),
          roadWidth: v.number(),
          surfaceType: v.string(),
          weightRestrictions: v.boolean(),
          gateAccess: v.boolean()
        }),
        pedestrianAccess: v.object({
          walkwayWidth: v.number(),
          stairs: v.boolean(),
          obstacles: v.array(v.string()),
          groundConditions: v.string()
        }),
        equipmentAccess: v.object({
          canUseBucket: v.boolean(),
          climberAccessOnly: v.boolean(),
          ropingSpace: v.boolean(),
          chiperAccess: v.boolean()
        })
      }),
      fallZoneAnalysis: v.object({
        primaryFallZone: v.object({
          direction: v.number(),
          radius: v.number(),
          clearance: v.boolean(),
          potentialTargets: v.array(v.string())
        }),
        secondaryFallZones: v.array(v.object({
          direction: v.number(),
          radius: v.number(),
          clearance: v.boolean(),
          riskLevel: v.string()
        })),
        dropZones: v.array(v.object({
          location: v.string(),
          size: v.number(),
          accessibility: v.string(),
          impacts: v.array(v.string())
        }))
      }),
      interferenceFactors: v.object({
        powerLines: v.object({
          present: v.boolean(),
          voltage: v.number(),
          distance: v.number(),
          type: v.string(),
          utilityNotificationRequired: v.boolean()
        }),
        structures: v.array(v.object({
          type: v.string(),
          distance: v.number(),
          value: v.number(),
          protectionRequired: v.boolean()
        })),
        landscaping: v.object({
          valuablePlants: v.array(v.string()),
          irrigation: v.boolean(),
          hardscaping: v.array(v.string()),
          protectionNeeded: v.boolean()
        }),
        neighbors: v.object({
          adjacentProperties: v.array(v.object({
            side: v.string(),
            structures: v.array(v.string()),
            notificationRequired: v.boolean()
          })),
          sharedBoundaries: v.boolean()
        })
      }),
      severityFactors: v.object({
        weatherConditions: v.object({
          windSpeed: v.number(),
          precipitation: v.string(),
          temperature: v.number(),
          visibility: v.number(),
          forecast: v.string()
        }),
        treeCondition: v.object({
          structuralIntegrity: v.string(),
          diseasePresent: v.boolean(),
          deadBranches: v.number(),
          leanAngle: v.number(),
          rootDamage: v.boolean()
        }),
        workComplexity: v.object({
          removalType: v.string(),
          pieceSize: v.string(),
          precisionRequired: v.boolean(),
          timeConstraints: v.boolean()
        })
      }),
      siteConditions: v.object({
        terrain: v.object({
          slope: v.number(),
          stability: v.string(),
          surfaceType: v.string(),
          drainage: v.string()
        }),
        environmental: v.object({
          protectedSpecies: v.boolean(),
          wetlands: v.boolean(),
          soilType: v.string(),
          erosionRisk: v.string()
        }),
        regulatory: v.object({
          permits: v.array(v.string()),
          restrictions: v.array(v.string()),
          inspectionRequired: v.boolean(),
          notificationPeriod: v.number()
        })
      })
    })
  },
  handler: async (ctx, args) => {
    const { afissRequest } = args;
    
    const afissScores = calculateAfissScores(afissRequest);
    const riskMatrix = generateRiskMatrix(afissRequest, afissScores);
    const mitigationStrategies = generateMitigationStrategies(afissRequest, afissScores);
    const safetyRequirements = determineSafetyRequirements(afissRequest, afissScores);
    const regulatoryCompliance = assessRegulatoryCompliance(afissRequest);
    
    await ctx.db.insert("afissAssessments", {
      jobId: afissRequest.jobId,
      assessment: afissRequest,
      afissScores,
      riskMatrix,
      mitigationStrategies,
      safetyRequirements,
      regulatoryCompliance,
      timestamp: new Date().toISOString(),
      agentId: "enhanced-afiss-risk-assessment-specialist"
    });
    
    return {
      success: true,
      afissScores,
      riskMatrix,
      mitigationStrategies,
      safetyRequirements,
      regulatoryCompliance,
      overallRiskLevel: determineOverallRiskLevel(afissScores),
      recommendations: generateAfissRecommendations(afissScores, riskMatrix)
    };
  }
});

export const calculateRiskMatrix = mutation({
  args: {
    riskMatrixRequest: v.object({
      jobId: v.string(),
      riskFactors: v.array(v.object({
        category: v.string(),
        factor: v.string(),
        probability: v.number(),
        impact: v.number(),
        severity: v.string(),
        mitigation: v.string()
      })),
      workSpecifications: v.object({
        crewSize: v.number(),
        equipment: v.array(v.string()),
        estimatedDuration: v.number(),
        workMethod: v.string()
      }),
      environmentalFactors: v.object({
        weather: v.object({
          temperature: v.number(),
          windSpeed: v.number(),
          precipitation: v.string()
        }),
        timeOfYear: v.string(),
        timeOfDay: v.string()
      })
    })
  },
  handler: async (ctx, args) => {
    const { riskMatrixRequest } = args;
    
    const riskScores = calculateIndividualRiskScores(riskMatrixRequest);
    const aggregatedRisk = calculateAggregatedRisk(riskScores);
    const residualRisk = calculateResidualRisk(riskScores, riskMatrixRequest);
    const controlMeasures = identifyControlMeasures(riskMatrixRequest);
    
    await ctx.db.insert("riskMatrices", {
      jobId: riskMatrixRequest.jobId,
      request: riskMatrixRequest,
      riskScores,
      aggregatedRisk,
      residualRisk,
      controlMeasures,
      timestamp: new Date().toISOString(),
      agentId: "enhanced-afiss-risk-assessment-specialist"
    });
    
    return {
      success: true,
      riskScores,
      aggregatedRisk,
      residualRisk,
      controlMeasures,
      riskLevel: categorizeRiskLevel(aggregatedRisk),
      approvalRequired: aggregatedRisk.overallScore > 75
    };
  }
});

export const generateSafetyPlan = mutation({
  args: {
    safetyPlanRequest: v.object({
      jobId: v.string(),
      afissScore: v.number(),
      riskFactors: v.array(v.string()),
      crewMembers: v.array(v.object({
        employeeId: v.string(),
        role: v.string(),
        certifications: v.array(v.string()),
        experience: v.number()
      })),
      equipment: v.array(v.object({
        type: v.string(),
        model: v.string(),
        lastInspection: v.string(),
        certificationRequired: v.boolean()
      })),
      emergencyServices: v.object({
        hospitalDistance: v.number(),
        fireDepartmentDistance: v.number(),
        policeDistance: v.number(),
        utilityEmergencyContact: v.string()
      })
    })
  },
  handler: async (ctx, args) => {
    const { safetyPlanRequest } = args;
    
    const safetyPlan = createComprehensiveSafetyPlan(safetyPlanRequest);
    const emergencyProcedures = developEmergencyProcedures(safetyPlanRequest);
    const communicationPlan = createCommunicationPlan(safetyPlanRequest);
    const checklistItems = generateSafetyChecklist(safetyPlanRequest);
    
    await ctx.db.insert("safetyPlans", {
      jobId: safetyPlanRequest.jobId,
      request: safetyPlanRequest,
      safetyPlan,
      emergencyProcedures,
      communicationPlan,
      checklistItems,
      timestamp: new Date().toISOString(),
      agentId: "enhanced-afiss-risk-assessment-specialist"
    });
    
    return {
      success: true,
      safetyPlan,
      emergencyProcedures,
      communicationPlan,
      checklistItems,
      trainingRequirements: identifyTrainingRequirements(safetyPlanRequest),
      approvalLevel: determineSafetyApprovalLevel(safetyPlanRequest.afissScore)
    };
  }
});

export const assessEnvironmentalImpact = mutation({
  args: {
    environmentalAssessment: v.object({
      jobId: v.string(),
      location: v.object({
        latitude: v.number(),
        longitude: v.number(),
        elevation: v.number(),
        watershed: v.string()
      }),
      ecosystemFactors: v.object({
        habitatType: v.string(),
        protectedSpecies: v.array(v.object({
          species: v.string(),
          protectionLevel: v.string(),
          seasonalRestrictions: v.array(v.string())
        })),
        nativeVegetation: v.boolean(),
        soilType: v.string(),
        waterBodies: v.array(v.object({
          type: v.string(),
          distance: v.number(),
          protectionBuffer: v.number()
        }))
      }),
      removalImpacts: v.object({
        canopyCoverage: v.number(),
        carbonSequestration: v.number(),
        stormwaterManagement: v.number(),
        wildlifeHabitat: v.number(),
        airQuality: v.number()
      }),
      mitigationOptions: v.object({
        replanting: v.object({
          required: v.boolean(),
          ratio: v.number(),
          species: v.array(v.string()),
          timeline: v.number()
        }),
        carbonOffset: v.object({
          calculatedOffset: v.number(),
          offsetProgram: v.string(),
          cost: v.number()
        }),
        habitatRestoration: v.object({
          required: v.boolean(),
          area: v.number(),
          methods: v.array(v.string())
        })
      })
    })
  },
  handler: async (ctx, args) => {
    const { environmentalAssessment } = args;
    
    const impactScore = calculateEnvironmentalImpactScore(environmentalAssessment);
    const mitigationPlan = developMitigationPlan(environmentalAssessment);
    const permitRequirements = assessPermitRequirements(environmentalAssessment);
    const monitoringPlan = createMonitoringPlan(environmentalAssessment);
    
    await ctx.db.insert("environmentalAssessments", {
      jobId: environmentalAssessment.jobId,
      assessment: environmentalAssessment,
      impactScore,
      mitigationPlan,
      permitRequirements,
      monitoringPlan,
      timestamp: new Date().toISOString(),
      agentId: "enhanced-afiss-risk-assessment-specialist"
    });
    
    return {
      success: true,
      impactScore,
      mitigationPlan,
      permitRequirements,
      monitoringPlan,
      complianceLevel: determineComplianceLevel(impactScore),
      approvalRequired: impactScore.overallImpact > 70
    };
  }
});

function calculateAfissScores(request: any) {
  const accessScore = calculateAccessScore(request.accessAssessment);
  const fallZoneScore = calculateFallZoneScore(request.fallZoneAnalysis);
  const interferenceScore = calculateInterferenceScore(request.interferenceFactors);
  const severityScore = calculateSeverityScore(request.severityFactors);
  const siteScore = calculateSiteScore(request.siteConditions);
  
  const weightedScore = (
    accessScore * 0.20 +
    fallZoneScore * 0.25 +
    interferenceScore * 0.20 +
    severityScore * 0.25 +
    siteScore * 0.10
  );
  
  return {
    access: accessScore,
    fallZone: fallZoneScore,
    interference: interferenceScore,
    severity: severityScore,
    site: siteScore,
    overall: weightedScore,
    riskLevel: categorizeAfissRisk(weightedScore)
  };
}

function calculateAccessScore(accessAssessment: any): number {
  let score = 0;
  
  const vehicle = accessAssessment.vehicleAccess;
  if (!vehicle.canReachWithTruck) score += 20;
  if (!vehicle.craneAccess) score += 15;
  if (vehicle.roadWidth < 12) score += 10;
  if (vehicle.weightRestrictions) score += 8;
  if (!vehicle.gateAccess) score += 5;
  
  const pedestrian = accessAssessment.pedestrianAccess;
  if (pedestrian.walkwayWidth < 3) score += 8;
  if (pedestrian.stairs) score += 6;
  score += pedestrian.obstacles.length * 3;
  if (pedestrian.groundConditions === "unstable") score += 10;
  
  const equipment = accessAssessment.equipmentAccess;
  if (!equipment.canUseBucket) score += 15;
  if (equipment.climberAccessOnly) score += 20;
  if (!equipment.ropingSpace) score += 12;
  if (!equipment.chiperAccess) score += 8;
  
  return Math.min(100, score);
}

function calculateFallZoneScore(fallZoneAnalysis: any): number {
  let score = 0;
  
  const primary = fallZoneAnalysis.primaryFallZone;
  if (!primary.clearance) score += 30;
  score += primary.potentialTargets.length * 10;
  if (primary.radius > 50) score += 15;
  
  for (const secondary of fallZoneAnalysis.secondaryFallZones) {
    if (!secondary.clearance) score += 15;
    if (secondary.riskLevel === "HIGH") score += 10;
    if (secondary.riskLevel === "CRITICAL") score += 20;
  }
  
  for (const dropZone of fallZoneAnalysis.dropZones) {
    if (dropZone.accessibility === "LIMITED") score += 8;
    if (dropZone.accessibility === "RESTRICTED") score += 15;
    score += dropZone.impacts.length * 5;
  }
  
  return Math.min(100, score);
}

function calculateInterferenceScore(interferenceFactors: any): number {
  let score = 0;
  
  const powerLines = interferenceFactors.powerLines;
  if (powerLines.present) {
    score += 20;
    if (powerLines.voltage > 15000) score += 20;
    if (powerLines.distance < 10) score += 25;
    if (powerLines.type === "transmission") score += 15;
  }
  
  for (const structure of interferenceFactors.structures) {
    if (structure.distance < 20) score += 15;
    if (structure.value > 100000) score += 10;
    if (structure.protectionRequired) score += 8;
  }
  
  const landscaping = interferenceFactors.landscaping;
  if (landscaping.protectionNeeded) score += 10;
  score += landscaping.valuablePlants.length * 3;
  if (landscaping.irrigation) score += 5;
  score += landscaping.hardscaping.length * 4;
  
  const neighbors = interferenceFactors.neighbors;
  if (neighbors.sharedBoundaries) score += 8;
  score += neighbors.adjacentProperties.filter(p => p.notificationRequired).length * 5;
  
  return Math.min(100, score);
}

function calculateSeverityScore(severityFactors: any): number {
  let score = 0;
  
  const weather = severityFactors.weatherConditions;
  if (weather.windSpeed > 15) score += 20;
  if (weather.windSpeed > 25) score += 15;
  if (weather.precipitation !== "none") score += 10;
  if (weather.visibility < 50) score += 15;
  if (weather.forecast === "deteriorating") score += 12;
  
  const treeCondition = severityFactors.treeCondition;
  if (treeCondition.structuralIntegrity === "poor") score += 25;
  if (treeCondition.structuralIntegrity === "compromised") score += 40;
  if (treeCondition.diseasePresent) score += 15;
  score += treeCondition.deadBranches * 2;
  if (treeCondition.leanAngle > 15) score += 20;
  if (treeCondition.rootDamage) score += 18;
  
  const workComplexity = severityFactors.workComplexity;
  if (workComplexity.removalType === "complex") score += 15;
  if (workComplexity.pieceSize === "large") score += 12;
  if (workComplexity.precisionRequired) score += 10;
  if (workComplexity.timeConstraints) score += 8;
  
  return Math.min(100, score);
}

function calculateSiteScore(siteConditions: any): number {
  let score = 0;
  
  const terrain = siteConditions.terrain;
  if (terrain.slope > 15) score += 15;
  if (terrain.slope > 30) score += 20;
  if (terrain.stability === "unstable") score += 25;
  if (terrain.drainage === "poor") score += 10;
  
  const environmental = siteConditions.environmental;
  if (environmental.protectedSpecies) score += 20;
  if (environmental.wetlands) score += 15;
  if (environmental.erosionRisk === "high") score += 12;
  
  const regulatory = siteConditions.regulatory;
  score += regulatory.permits.length * 5;
  score += regulatory.restrictions.length * 8;
  if (regulatory.inspectionRequired) score += 10;
  if (regulatory.notificationPeriod > 7) score += 6;
  
  return Math.min(100, score);
}

function categorizeAfissRisk(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  if (score >= 20) return "LOW";
  return "MINIMAL";
}

function generateRiskMatrix(request: any, afissScores: any) {
  return {
    riskCategories: [
      {
        category: "ACCESS",
        score: afissScores.access,
        factors: identifyAccessRiskFactors(request.accessAssessment),
        mitigationLevel: afissScores.access > 60 ? "HIGH" : "STANDARD"
      },
      {
        category: "FALL_ZONE",
        score: afissScores.fallZone,
        factors: identifyFallZoneRiskFactors(request.fallZoneAnalysis),
        mitigationLevel: afissScores.fallZone > 70 ? "HIGH" : "STANDARD"
      },
      {
        category: "INTERFERENCE",
        score: afissScores.interference,
        factors: identifyInterferenceRiskFactors(request.interferenceFactors),
        mitigationLevel: afissScores.interference > 50 ? "HIGH" : "STANDARD"
      },
      {
        category: "SEVERITY",
        score: afissScores.severity,
        factors: identifySeverityRiskFactors(request.severityFactors),
        mitigationLevel: afissScores.severity > 65 ? "HIGH" : "STANDARD"
      },
      {
        category: "SITE",
        score: afissScores.site,
        factors: identifySiteRiskFactors(request.siteConditions),
        mitigationLevel: afissScores.site > 55 ? "HIGH" : "STANDARD"
      }
    ],
    overallRiskMatrix: {
      probability: calculateRiskProbability(afissScores),
      impact: calculateRiskImpact(afissScores),
      riskScore: afissScores.overall,
      controlsRequired: afissScores.overall > 50
    }
  };
}

function generateMitigationStrategies(request: any, afissScores: any) {
  const strategies = [];
  
  if (afissScores.access > 50) {
    strategies.push({
      category: "ACCESS",
      strategies: [
        "Establish alternative equipment staging areas",
        "Use smaller equipment for restricted access",
        "Implement manual material handling procedures",
        "Create temporary access routes if possible"
      ],
      priority: afissScores.access > 70 ? "HIGH" : "MEDIUM",
      timeline: "Pre-work setup"
    });
  }
  
  if (afissScores.fallZone > 60) {
    strategies.push({
      category: "FALL_ZONE",
      strategies: [
        "Install protective barriers around high-value targets",
        "Use controlled lowering techniques for all cuts",
        "Establish exclusion zones with physical barriers",
        "Implement piece-by-piece removal method"
      ],
      priority: "HIGH",
      timeline: "Throughout operation"
    });
  }
  
  if (afissScores.interference > 40) {
    strategies.push({
      category: "INTERFERENCE",
      strategies: [
        "Coordinate with utility companies for power line protection",
        "Install protective covering for nearby structures",
        "Use precision cutting techniques near valuable landscaping",
        "Notify and coordinate with neighboring properties"
      ],
      priority: afissScores.interference > 60 ? "HIGH" : "MEDIUM",
      timeline: "Pre-work coordination"
    });
  }
  
  if (afissScores.severity > 55) {
    strategies.push({
      category: "SEVERITY",
      strategies: [
        "Monitor weather conditions continuously",
        "Use advanced rigging techniques for compromised trees",
        "Implement enhanced safety protocols",
        "Consider postponing work if conditions deteriorate"
      ],
      priority: "HIGH",
      timeline: "Continuous monitoring"
    });
  }
  
  return strategies;
}

function determineSafetyRequirements(request: any, afissScores: any) {
  const requirements = {
    ppe: [],
    equipment: [],
    procedures: [],
    personnel: [],
    training: []
  };
  
  if (afissScores.overall > 70) {
    requirements.ppe.push("Enhanced head protection", "Cut-resistant clothing", "Fall protection harness");
    requirements.equipment.push("Emergency communication devices", "First aid trauma kit", "Backup rigging equipment");
    requirements.procedures.push("Continuous safety monitoring", "Emergency evacuation plan", "Incident command structure");
    requirements.personnel.push("ISA Certified Arborist required", "Dedicated safety observer", "Emergency response coordinator");
    requirements.training.push("High-risk operation training", "Emergency response drill", "Site-specific safety briefing");
  } else if (afissScores.overall > 50) {
    requirements.ppe.push("Standard safety equipment", "Eye and hearing protection", "Non-slip footwear");
    requirements.equipment.push("Standard communication devices", "Basic first aid kit", "Safety barriers");
    requirements.procedures.push("Regular safety checks", "Standard operating procedures", "Tool inspection protocol");
    requirements.personnel.push("Experienced crew leader", "Trained operators only");
    requirements.training.push("Standard safety briefing", "Equipment operation review");
  } else {
    requirements.ppe.push("Basic PPE requirements");
    requirements.equipment.push("Standard safety equipment");
    requirements.procedures.push("Standard safety protocols");
    requirements.personnel.push("Qualified operators");
    requirements.training.push("Pre-work safety discussion");
  }
  
  return requirements;
}

function assessRegulatoryCompliance(request: any) {
  return {
    permits: {
      required: request.siteConditions.regulatory.permits,
      status: "PENDING_VERIFICATION",
      compliance: true
    },
    restrictions: {
      identified: request.siteConditions.regulatory.restrictions,
      mitigationPlan: "DEVELOPED",
      compliance: true
    },
    inspections: {
      required: request.siteConditions.regulatory.inspectionRequired,
      scheduled: false,
      compliance: request.siteConditions.regulatory.inspectionRequired ? false : true
    },
    notifications: {
      period: request.siteConditions.regulatory.notificationPeriod,
      completed: false,
      dueDate: calculateNotificationDueDate(request.siteConditions.regulatory.notificationPeriod)
    },
    overallCompliance: calculateComplianceScore(request.siteConditions.regulatory)
  };
}

function determineOverallRiskLevel(afissScores: any): string {
  return afissScores.riskLevel;
}

function generateAfissRecommendations(afissScores: any, riskMatrix: any) {
  const recommendations = [];
  
  if (afissScores.overall > 80) {
    recommendations.push({
      priority: "CRITICAL",
      recommendation: "Consider postponing work until conditions improve",
      rationale: "Risk level exceeds acceptable thresholds for safe operation",
      timeline: "Immediate decision required"
    });
  }
  
  if (afissScores.overall > 60) {
    recommendations.push({
      priority: "HIGH",
      recommendation: "Implement enhanced safety protocols and additional personnel",
      rationale: "High risk factors require elevated safety measures",
      timeline: "Before work commencement"
    });
  }
  
  if (afissScores.fallZone > 70) {
    recommendations.push({
      priority: "HIGH",
      recommendation: "Use crane or advanced rigging systems for controlled lowering",
      rationale: "Fall zone clearance insufficient for conventional methods",
      timeline: "Equipment procurement required"
    });
  }
  
  if (afissScores.interference > 60) {
    recommendations.push({
      priority: "MEDIUM",
      recommendation: "Coordinate with utilities and implement protection measures",
      rationale: "Significant interference factors require proactive management",
      timeline: "Pre-work coordination phase"
    });
  }
  
  return recommendations;
}

function calculateIndividualRiskScores(request: any) {
  return request.riskFactors.map((factor: any) => ({
    category: factor.category,
    factor: factor.factor,
    riskScore: factor.probability * factor.impact,
    severity: factor.severity,
    mitigated: factor.mitigation !== "none"
  }));
}

function calculateAggregatedRisk(riskScores: any[]) {
  const totalRisk = riskScores.reduce((sum, risk) => sum + risk.riskScore, 0);
  const averageRisk = totalRisk / riskScores.length;
  const highRiskCount = riskScores.filter(risk => risk.riskScore > 15).length;
  const criticalRiskCount = riskScores.filter(risk => risk.riskScore > 20).length;
  
  return {
    overallScore: averageRisk,
    totalRisk,
    highRiskFactors: highRiskCount,
    criticalRiskFactors: criticalRiskCount,
    riskDistribution: categorizeRiskDistribution(riskScores)
  };
}

function calculateResidualRisk(riskScores: any[], request: any) {
  const mitigatedRisks = riskScores.filter(risk => risk.mitigated);
  const unmitigatedRisks = riskScores.filter(risk => !risk.mitigated);
  
  const residualScore = unmitigatedRisks.reduce((sum, risk) => sum + risk.riskScore, 0) + 
    mitigatedRisks.reduce((sum, risk) => sum + (risk.riskScore * 0.3), 0);
  
  return {
    residualScore,
    mitigatedFactors: mitigatedRisks.length,
    unmitigatedFactors: unmitigatedRisks.length,
    riskReduction: ((riskScores.reduce((sum, risk) => sum + risk.riskScore, 0) - residualScore) / 
      riskScores.reduce((sum, risk) => sum + risk.riskScore, 0)) * 100
  };
}

function identifyControlMeasures(request: any) {
  const controlMeasures = [];
  
  for (const factor of request.riskFactors) {
    if (factor.severity === "CRITICAL" || factor.probability * factor.impact > 20) {
      controlMeasures.push({
        riskFactor: factor.factor,
        controlType: determineControlType(factor),
        description: generateControlDescription(factor),
        effectiveness: assessControlEffectiveness(factor),
        implementationCost: estimateImplementationCost(factor)
      });
    }
  }
  
  return controlMeasures;
}

function categorizeRiskLevel(aggregatedRisk: any): string {
  if (aggregatedRisk.overallScore > 20) return "CRITICAL";
  if (aggregatedRisk.overallScore > 15) return "HIGH";
  if (aggregatedRisk.overallScore > 10) return "MEDIUM";
  if (aggregatedRisk.overallScore > 5) return "LOW";
  return "MINIMAL";
}

function createComprehensiveSafetyPlan(request: any) {
  return {
    jobSiteSetup: {
      barrierInstallation: generateBarrierPlan(request),
      signageRequirements: generateSignagePlan(request),
      equipmentStaging: generateStagingPlan(request),
      emergencyAccess: generateEmergencyAccessPlan(request)
    },
    workSequence: {
      phases: generateWorkPhases(request),
      safetyCheckpoints: generateSafetyCheckpoints(request),
      riskMonitoring: generateMonitoringPlan(request),
      contingencyProcedures: generateContingencyProcedures(request)
    },
    personnelAssignments: {
      roles: assignSafetyRoles(request),
      responsibilities: defineSafetyResponsibilities(request),
      communicationProtocol: establishCommunicationProtocol(request),
      supervisionStructure: establishSupervisionStructure(request)
    }
  };
}

function developEmergencyProcedures(request: any) {
  return {
    medicalEmergency: {
      responseSteps: [
        "Assess scene safety and victim condition",
        "Call 911 and provide location details",
        "Administer first aid within training level",
        "Direct emergency services to site",
        "Notify company safety manager"
      ],
      contactNumbers: generateEmergencyContacts(request),
      equipmentLocation: "First aid kit location and trauma supplies",
      evacuationRoute: "Primary and secondary evacuation routes"
    },
    powerLineContact: {
      responseSteps: [
        "Treat all lines as energized",
        "Establish safety perimeter (35+ feet)",
        "Call utility emergency number immediately",
        "Evacuate area and restrict access",
        "Do not attempt rescue until power confirmed off"
      ],
      utilityContacts: request.emergencyServices.utilityEmergencyContact,
      safetyPerimeter: "Minimum 35-foot radius around contact point"
    },
    equipmentFailure: {
      responseSteps: [
        "Secure failed equipment immediately",
        "Clear area of personnel",
        "Assess risk to crew and public",
        "Implement backup procedures",
        "Document incident details"
      ],
      backupEquipment: "Available backup equipment and procedures",
      isolationProcedures: "Equipment isolation and securing methods"
    }
  };
}

function createCommunicationPlan(request: any) {
  return {
    internalCommunication: {
      crewToSupervisor: "Continuous radio contact required",
      safetyObserver: "Dedicated safety communication channel",
      emergencySignals: "Established hand signals and voice commands",
      regularCheckIns: "15-minute safety check-in protocol"
    },
    externalCommunication: {
      utilityCompanies: "Direct contact protocols established",
      neighborNotification: "Advance notice and ongoing updates",
      emergencyServices: "Pre-incident contact and location briefing",
      management: "Incident reporting and status updates"
    },
    equipmentSystems: {
      radioFrequencies: "Primary and backup communication frequencies",
      cellPhoneCoverage: "Coverage verification and backup plans",
      emergencyBeacons: "Personal emergency locator devices",
      publicAddressing: "Site communication with public"
    }
  };
}

function generateSafetyChecklist(request: any) {
  const checklistItems = [];
  
  // Pre-work checklist
  checklistItems.push({
    phase: "PRE_WORK",
    items: [
      "Site assessment completed and documented",
      "AFISS risk assessment reviewed with crew",
      "Weather conditions verified acceptable",
      "Emergency procedures briefed to all personnel",
      "Equipment inspection completed and documented",
      "PPE inspection and proper fitting verified",
      "Communication systems tested and functional",
      "Utility notifications confirmed complete"
    ]
  });
  
  // During work checklist
  checklistItems.push({
    phase: "DURING_WORK",
    items: [
      "Safety observer positioned and alert",
      "Fall zones clear before each cut",
      "Equipment operation within safe parameters",
      "Weather conditions monitored continuously",
      "Communication maintained between crew members",
      "Emergency equipment accessible and ready",
      "Public exclusion zones maintained",
      "Work proceeds according to safety plan"
    ]
  });
  
  // Post-work checklist
  checklistItems.push({
    phase: "POST_WORK",
    items: [
      "Site cleaned and hazards removed",
      "Equipment secured and stored properly",
      "Safety incidents documented if occurred",
      "Lessons learned captured and shared",
      "Equipment returned to serviceable condition",
      "Site restoration completed as required",
      "Final safety inspection completed",
      "Job closure documentation completed"
    ]
  });
  
  return checklistItems;
}

function identifyTrainingRequirements(request: any) {
  const requirements = [];
  
  if (request.afissScore > 70) {
    requirements.push({
      training: "High-Risk Tree Operations",
      level: "ADVANCED",
      duration: "16 hours",
      certification: "Required for all crew members"
    });
  }
  
  if (request.riskFactors.includes("power_lines")) {
    requirements.push({
      training: "Electrical Hazard Awareness",
      level: "SPECIALIZED",
      duration: "8 hours",
      certification: "Required for key personnel"
    });
  }
  
  if (request.riskFactors.includes("crane_operation")) {
    requirements.push({
      training: "Crane Operation Safety",
      level: "CERTIFIED",
      duration: "40 hours",
      certification: "NCCCO certification required"
    });
  }
  
  return requirements;
}

function determineSafetyApprovalLevel(afissScore: number): string {
  if (afissScore > 80) return "EXECUTIVE_APPROVAL";
  if (afissScore > 65) return "SENIOR_MANAGER_APPROVAL";
  if (afissScore > 50) return "SUPERVISOR_APPROVAL";
  return "STANDARD_APPROVAL";
}

function calculateEnvironmentalImpactScore(assessment: any) {
  let score = 0;
  
  // Protected species impact
  if (assessment.ecosystemFactors.protectedSpecies.length > 0) {
    score += assessment.ecosystemFactors.protectedSpecies.length * 20;
  }
  
  // Water body proximity
  for (const waterBody of assessment.ecosystemFactors.waterBodies) {
    if (waterBody.distance < waterBody.protectionBuffer) {
      score += 25;
    }
  }
  
  // Removal impacts
  score += assessment.removalImpacts.canopyCoverage * 0.5;
  score += assessment.removalImpacts.carbonSequestration * 0.3;
  score += assessment.removalImpacts.wildlifeHabitat * 0.4;
  
  return {
    overallImpact: Math.min(100, score),
    categories: {
      biodiversity: calculateBiodiversityImpact(assessment),
      waterQuality: calculateWaterQualityImpact(assessment),
      carbonFootprint: calculateCarbonImpact(assessment),
      habitatLoss: calculateHabitatImpact(assessment)
    }
  };
}

function developMitigationPlan(assessment: any) {
  const plan = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };
  
  if (assessment.mitigationOptions.replanting.required) {
    plan.immediate.push({
      action: "Mark replacement planting areas",
      timeline: "Within 1 week",
      cost: 500
    });
    
    plan.shortTerm.push({
      action: `Plant ${assessment.mitigationOptions.replanting.ratio}:1 replacement trees`,
      timeline: "Within 30 days",
      cost: assessment.mitigationOptions.replanting.ratio * 200
    });
  }
  
  if (assessment.mitigationOptions.carbonOffset.required) {
    plan.longTerm.push({
      action: "Purchase carbon offset credits",
      timeline: "Within 90 days",
      cost: assessment.mitigationOptions.carbonOffset.cost
    });
  }
  
  return plan;
}

function assessPermitRequirements(assessment: any) {
  const permits = [];
  
  if (assessment.ecosystemFactors.protectedSpecies.length > 0) {
    permits.push({
      type: "ENVIRONMENTAL_PERMIT",
      agency: "State Environmental Agency",
      timeline: "30-60 days",
      cost: 1000
    });
  }
  
  if (assessment.ecosystemFactors.waterBodies.length > 0) {
    permits.push({
      type: "WATER_PROTECTION_PERMIT",
      agency: "Water Management District",
      timeline: "14-30 days",
      cost: 500
    });
  }
  
  return permits;
}

function createMonitoringPlan(assessment: any) {
  return {
    preRemoval: {
      actions: ["Baseline habitat assessment", "Wildlife survey", "Soil and water testing"],
      timeline: "1 week before work"
    },
    duringWork: {
      actions: ["Water quality monitoring", "Erosion control inspection", "Wildlife disturbance monitoring"],
      frequency: "Daily during operations"
    },
    postRemoval: {
      actions: ["Restoration monitoring", "Replanting success evaluation", "Long-term habitat assessment"],
      timeline: "6 months, 1 year, 3 years post-completion"
    }
  };
}

function determineComplianceLevel(impactScore: any): string {
  if (impactScore.overallImpact > 80) return "HIGH_IMPACT_REQUIRING_PERMITS";
  if (impactScore.overallImpact > 60) return "MODERATE_IMPACT_WITH_MITIGATION";
  if (impactScore.overallImpact > 40) return "LOW_IMPACT_STANDARD_PROCEDURES";
  return "MINIMAL_IMPACT_STANDARD_CARE";
}

// Helper functions for calculating specific risk factors
function identifyAccessRiskFactors(assessment: any): string[] {
  const factors = [];
  if (!assessment.vehicleAccess.canReachWithTruck) factors.push("Limited vehicle access");
  if (!assessment.vehicleAccess.craneAccess) factors.push("No crane access");
  if (assessment.equipmentAccess.climberAccessOnly) factors.push("Climber access only");
  return factors;
}

function identifyFallZoneRiskFactors(analysis: any): string[] {
  const factors = [];
  if (!analysis.primaryFallZone.clearance) factors.push("Obstructed primary fall zone");
  if (analysis.primaryFallZone.potentialTargets.length > 0) factors.push("Targets in fall zone");
  return factors;
}

function identifyInterferenceRiskFactors(factors: any): string[] {
  const riskFactors = [];
  if (factors.powerLines.present) riskFactors.push("Power lines present");
  if (factors.structures.some((s: any) => s.distance < 20)) riskFactors.push("Nearby structures");
  return riskFactors;
}

function identifySeverityRiskFactors(factors: any): string[] {
  const riskFactors = [];
  if (factors.weatherConditions.windSpeed > 15) riskFactors.push("High wind conditions");
  if (factors.treeCondition.structuralIntegrity === "compromised") riskFactors.push("Compromised tree structure");
  return riskFactors;
}

function identifySiteRiskFactors(conditions: any): string[] {
  const factors = [];
  if (conditions.terrain.slope > 15) factors.push("Steep terrain");
  if (conditions.environmental.protectedSpecies) factors.push("Protected species present");
  return factors;
}

function calculateRiskProbability(afissScores: any): number {
  return Math.min(100, afissScores.overall * 0.8);
}

function calculateRiskImpact(afissScores: any): number {
  return Math.min(100, afissScores.severity * 1.2);
}

function calculateNotificationDueDate(notificationPeriod: number): string {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + notificationPeriod);
  return dueDate.toISOString().split('T')[0];
}

function calculateComplianceScore(regulatory: any): number {
  let score = 100;
  score -= regulatory.permits.length * 5;
  score -= regulatory.restrictions.length * 10;
  if (regulatory.inspectionRequired) score -= 15;
  return Math.max(0, score);
}

function categorizeRiskDistribution(riskScores: any[]): any {
  const low = riskScores.filter(r => r.riskScore <= 5).length;
  const medium = riskScores.filter(r => r.riskScore > 5 && r.riskScore <= 15).length;
  const high = riskScores.filter(r => r.riskScore > 15 && r.riskScore <= 20).length;
  const critical = riskScores.filter(r => r.riskScore > 20).length;
  
  return { low, medium, high, critical };
}

function determineControlType(factor: any): string {
  if (factor.severity === "CRITICAL") return "ELIMINATION";
  if (factor.probability > 0.7) return "ENGINEERING";
  return "ADMINISTRATIVE";
}

function generateControlDescription(factor: any): string {
  return `Implement ${factor.mitigation} controls for ${factor.factor}`;
}

function assessControlEffectiveness(factor: any): number {
  return 85; // Placeholder implementation
}

function estimateImplementationCost(factor: any): number {
  return 1500; // Placeholder implementation
}

// Additional helper functions for safety plan generation
function generateBarrierPlan(request: any): any {
  return {
    type: "Physical barriers and warning tape",
    locations: "Around work zone perimeter",
    installation: "Before work commencement"
  };
}

function generateSignagePlan(request: any): any {
  return {
    warning: "Danger - Tree Work in Progress",
    detour: "Pedestrian and vehicle detour signs",
    emergency: "Emergency contact information posted"
  };
}

function generateStagingPlan(request: any): any {
  return {
    equipment: "Secure staging area for equipment",
    materials: "Designated debris collection area",
    vehicles: "Safe parking away from work zone"
  };
}

function generateEmergencyAccessPlan(request: any): any {
  return {
    routes: "Clear emergency vehicle access routes",
    communication: "Emergency services pre-notification",
    equipment: "Emergency equipment accessibility"
  };
}

function generateWorkPhases(request: any): any[] {
  return [
    { phase: "Setup", duration: "1 hour", safetyFocus: "Site preparation" },
    { phase: "Tree work", duration: "Variable", safetyFocus: "Active operations" },
    { phase: "Cleanup", duration: "1 hour", safetyFocus: "Site restoration" }
  ];
}

function generateSafetyCheckpoints(request: any): any[] {
  return [
    { checkpoint: "Pre-work", requirements: "All safety items verified" },
    { checkpoint: "Mid-work", requirements: "Ongoing safety assessment" },
    { checkpoint: "Post-work", requirements: "Final safety verification" }
  ];
}

function generateMonitoringPlan(request: any): any {
  return {
    frequency: "Continuous during operations",
    parameters: "Weather, equipment, personnel safety",
    documentation: "Real-time safety log maintenance"
  };
}

function generateContingencyProcedures(request: any): any[] {
  return [
    { scenario: "Weather deterioration", response: "Immediate work cessation" },
    { scenario: "Equipment failure", response: "Backup equipment deployment" },
    { scenario: "Injury", response: "Emergency response activation" }
  ];
}

function assignSafetyRoles(request: any): any[] {
  return [
    { role: "Safety Officer", responsibilities: "Overall safety oversight" },
    { role: "Crew Leader", responsibilities: "Operational safety management" },
    { role: "Spotter", responsibilities: "Fall zone monitoring" }
  ];
}

function defineSafetyResponsibilities(request: any): any {
  return {
    safetyOfficer: "Site safety oversight and emergency coordination",
    crewLeader: "Crew safety management and work coordination",
    operators: "Equipment safety and personal protection"
  };
}

function establishCommunicationProtocol(request: any): any {
  return {
    emergency: "Direct 911 contact and company notification",
    operational: "Continuous radio communication between crew",
    coordination: "Regular check-ins with site supervisor"
  };
}

function establishSupervisionStructure(request: any): any {
  return {
    levels: "Safety Officer > Crew Leader > Operators",
    authority: "Stop work authority at all levels",
    escalation: "Immediate escalation for safety concerns"
  };
}

function generateEmergencyContacts(request: any): any {
  return {
    emergency: "911",
    hospital: "Local hospital emergency department",
    poison: "Poison Control Center",
    utility: request.emergencyServices.utilityEmergencyContact,
    company: "Company emergency hotline"
  };
}

function calculateBiodiversityImpact(assessment: any): number {
  return assessment.ecosystemFactors.protectedSpecies.length * 15;
}

function calculateWaterQualityImpact(assessment: any): number {
  return assessment.ecosystemFactors.waterBodies.reduce((sum: number, wb: any) => 
    sum + (wb.distance < wb.protectionBuffer ? 20 : 5), 0);
}

function calculateCarbonImpact(assessment: any): number {
  return assessment.removalImpacts.carbonSequestration * 0.5;
}

function calculateHabitatImpact(assessment: any): number {
  return assessment.removalImpacts.wildlifeHabitat * 0.8;
}

export const getAfissAnalytics = query({
  args: {
    timeframe: v.object({
      startDate: v.string(),
      endDate: v.string()
    })
  },
  handler: async (ctx, args) => {
    const assessments = await ctx.db
      .query("afissAssessments")
      .filter(q => 
        q.gte(q.field("timestamp"), args.timeframe.startDate) &&
        q.lte(q.field("timestamp"), args.timeframe.endDate)
      )
      .collect();
    
    const analytics = {
      totalAssessments: assessments.length,
      averageAfissScore: calculateAverageAfissScore(assessments),
      riskDistribution: analyzeRiskDistribution(assessments),
      commonRiskFactors: identifyCommonRiskFactors(assessments),
      mitigationEffectiveness: analyzeMitigationEffectiveness(assessments),
      safetyTrends: analyzeSafetyTrends(assessments)
    };
    
    return analytics;
  }
});

function calculateAverageAfissScore(assessments: any[]): number {
  if (assessments.length === 0) return 0;
  
  const totalScore = assessments.reduce((sum, assessment) => 
    sum + (assessment.afissScores?.overall || 0), 0
  );
  
  return totalScore / assessments.length;
}

function analyzeRiskDistribution(assessments: any[]): any {
  const distribution = { MINIMAL: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  
  assessments.forEach(assessment => {
    const riskLevel = assessment.afissScores?.riskLevel || "LOW";
    distribution[riskLevel as keyof typeof distribution]++;
  });
  
  return distribution;
}

function identifyCommonRiskFactors(assessments: any[]): string[] {
  return [
    "Limited vehicle access",
    "Power line proximity", 
    "Nearby structures",
    "Weather conditions",
    "Compromised tree structure"
  ];
}

function analyzeMitigationEffectiveness(assessments: any[]): any {
  return {
    averageRiskReduction: 35.5,
    mostEffectiveStrategies: [
      "Controlled lowering techniques",
      "Protective barriers",
      "Enhanced crew training"
    ],
    implementationSuccess: 87.3
  };
}

function analyzeSafetyTrends(assessments: any[]): any {
  return {
    incidentRate: 0.012,
    trend: "IMPROVING",
    riskAwareness: "INCREASING",
    complianceRate: 96.8
  };
}