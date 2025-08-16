import Foundation
import Combine

/// Agent-driven TreeScore calculation system that replaces hardcoded logic with specialist agent intelligence
class AgentDrivenTreeScore: ObservableObject {
    
    // MARK: - Published Properties
    @Published var currentScore: Int = 0
    @Published var scoreBreakdown: TreeScoreBreakdown?
    @Published var afissScore: AFISSScore?
    @Published var validationResult: ScoreValidation?
    @Published var agentRecommendations: [TreeScoreRecommendation] = []
    @Published var isCalculating: Bool = false
    @Published var calculationHistory: [TreeScoreCalculation] = []
    
    // MARK: - Agent Services
    private let treeScoreService: TreeScoreAgentService
    private let safetyService: SafetyAgentService
    private let operationsService: OperationsAgentService
    
    // MARK: - Configuration
    private let calculationConfig: TreeScoreConfiguration
    
    init(treeScoreService: TreeScoreAgentService? = nil) {
        self.treeScoreService = treeScoreService ?? AgentServiceFactory.shared.createTreeScoreService()
        self.safetyService = AgentServiceFactory.shared.createSafetyService()
        self.operationsService = AgentServiceFactory.shared.createOperationsService()
        self.calculationConfig = TreeScoreConfiguration.default
    }
    
    // MARK: - Agent-Driven TreeScore Calculation
    
    /// Calculate TreeScore using specialist agent intelligence
    func calculateTreeScore(
        measurements: TreeMeasurements,
        context: TreeScoreContext = TreeScoreContext()
    ) async throws -> TreeScoreResult {
        
        isCalculating = true
        defer { isCalculating = false }
        
        // Step 1: Validate measurements with agent
        let validation = try await validateMeasurementsWithAgent(measurements)
        await MainActor.run {
            self.validationResult = validation
        }
        
        guard validation.isValid else {
            throw TreeScoreError.invalidMeasurements(validation.errors)
        }
        
        // Step 2: Calculate base TreeScore with agent
        let scoreResponse = try await treeScoreService.calculateTreeScore(measurements)
        
        // Step 3: Get AFISS assessment from safety agent
        let safetyData = createSafetyAssessmentData(from: measurements, context: context)
        let safetyResponse = try await safetyService.assessSafetyRisks(safetyData)
        
        // Step 4: Apply agent-recommended adjustments
        let finalScore = await applyAgentAdjustments(
            baseScore: scoreResponse.treeScore,
            breakdown: scoreResponse.breakdown,
            safetyAssessment: safetyResponse
        )
        
        // Step 5: Store calculation for learning
        let calculation = TreeScoreCalculation(
            id: UUID().uuidString,
            timestamp: Date(),
            measurements: measurements,
            baseScore: scoreResponse.treeScore,
            finalScore: finalScore.score,
            breakdown: finalScore.breakdown,
            afissScore: finalScore.afissScore,
            agentRecommendations: finalScore.recommendations,
            calculationMethod: "agent-driven-v1.0",
            confidence: scoreResponse.confidence
        )
        
        await MainActor.run {
            self.currentScore = finalScore.score
            self.scoreBreakdown = finalScore.breakdown
            self.afissScore = finalScore.afissScore
            self.agentRecommendations = finalScore.recommendations
            self.calculationHistory.append(calculation)
        }
        
        return finalScore
    }
    
    /// Calculate stump score using specialist agent
    func calculateStumpScore(
        stumpData: StumpMeasurements,
        context: StumpScoreContext = StumpScoreContext()
    ) async throws -> StumpScoreResult {
        
        isCalculating = true
        defer { isCalculating = false }
        
        let scoreResponse = try await treeScoreService.calculateStumpScore(stumpData)
        
        let result = StumpScoreResult(
            score: scoreResponse.stumpScore,
            breakdown: scoreResponse.breakdown,
            recommendations: scoreResponse.recommendations.map { rec in
                TreeScoreRecommendation(
                    type: .optimization,
                    message: rec,
                    impact: .medium,
                    agentSource: "treescore-calculator"
                )
            },
            confidence: scoreResponse.confidence
        )
        
        await MainActor.run {
            self.currentScore = result.score
        }
        
        return result
    }
    
    /// Real-time score validation as measurements are taken
    func validateMeasurementInRealTime(
        partialMeasurements: PartialTreeMeasurements
    ) async throws -> RealTimeValidation {
        
        let validation = RealTimeValidation(
            isComplete: partialMeasurements.isComplete,
            estimatedScore: calculateEstimatedScore(partialMeasurements),
            missingMeasurements: partialMeasurements.getMissingMeasurements(),
            qualityAssessment: await assessMeasurementQuality(partialMeasurements),
            nextStepRecommendation: await getNextMeasurementRecommendation(partialMeasurements)
        )
        
        return validation
    }
    
    // MARK: - Agent Integration Methods
    
    private func validateMeasurementsWithAgent(_ measurements: TreeMeasurements) async throws -> ScoreValidation {
        let validationResponse = try await treeScoreService.validateMeasurements(measurements)
        
        return ScoreValidation(
            isValid: validationResponse.isValid,
            errors: validationResponse.errors,
            warnings: validationResponse.warnings,
            suggestions: validationResponse.suggestions,
            confidence: validationResponse.confidence
        )
    }
    
    private func applyAgentAdjustments(
        baseScore: Int,
        breakdown: TreeScoreBreakdown,
        safetyAssessment: SafetyAnalysisResponse
    ) async -> TreeScoreResult {
        
        var adjustedScore = baseScore
        var adjustments: [ScoreAdjustment] = []
        var recommendations: [TreeScoreRecommendation] = []
        
        // Apply safety-based adjustments
        for risk in safetyAssessment.identifiedRisks {
            let adjustment = calculateSafetyAdjustment(risk)
            adjustedScore += adjustment.scoreChange
            adjustments.append(adjustment)
            
            if abs(adjustment.scoreChange) > 10 {
                recommendations.append(TreeScoreRecommendation(
                    type: .safety,
                    message: "Score adjusted by \(adjustment.scoreChange) due to \(risk.description)",
                    impact: adjustment.scoreChange > 0 ? .positive : .negative,
                    agentSource: "safety-manager"
                ))
            }
        }
        
        // Create enhanced AFISS score
        let afissScore = AFISSScore(
            access: calculateAccessScore(safetyAssessment),
            fallZone: calculateFallZoneScore(safetyAssessment),
            interference: calculateInterferenceScore(safetyAssessment),
            severity: calculateSeverityScore(safetyAssessment),
            siteConditions: calculateSiteConditionsScore(safetyAssessment),
            totalScore: adjustedScore,
            riskLevel: safetyAssessment.riskLevel
        )
        
        // Add operational recommendations
        recommendations.append(contentsOf: safetyAssessment.recommendations.map { rec in
            TreeScoreRecommendation(
                type: .operational,
                message: rec,
                impact: .medium,
                agentSource: "safety-manager"
            )
        })
        
        return TreeScoreResult(
            score: max(0, adjustedScore),
            breakdown: enhanceBreakdown(breakdown, adjustments: adjustments),
            afissScore: afissScore,
            recommendations: recommendations,
            confidence: min(0.95, (Double(baseScore) / Double(adjustedScore)) * 0.9)
        )
    }
    
    // MARK: - Score Calculation Helpers
    
    private func calculateSafetyAdjustment(_ risk: IdentifiedRisk) -> ScoreAdjustment {
        var scoreChange = 0
        
        switch risk.type {
        case .powerLines:
            scoreChange = risk.severity == .critical ? 50 : 25
        case .structuralIssues:
            scoreChange = risk.severity == .critical ? -30 : -15
        case .accessRestriction:
            scoreChange = 20
        case .propertyDamageRisk:
            scoreChange = risk.severity == .high ? 40 : 20
        case .environmentalConcern:
            scoreChange = 15
        default:
            scoreChange = 10
        }
        
        return ScoreAdjustment(
            type: .safety,
            reason: risk.description,
            scoreChange: scoreChange,
            riskType: risk.type,
            severity: risk.severity
        )
    }
    
    private func calculateAccessScore(_ safetyAssessment: SafetyAnalysisResponse) -> Int {
        let hasAccessIssues = safetyAssessment.identifiedRisks.contains { $0.type == .accessRestriction }
        return hasAccessIssues ? 15 : 5
    }
    
    private func calculateFallZoneScore(_ safetyAssessment: SafetyAnalysisResponse) -> Int {
        let hasFallZoneIssues = safetyAssessment.identifiedRisks.contains { 
            $0.type == .propertyDamageRisk || $0.type == .structuralIssues 
        }
        return hasFallZoneIssues ? 18 : 8
    }
    
    private func calculateInterferenceScore(_ safetyAssessment: SafetyAnalysisResponse) -> Int {
        let hasPowerLines = safetyAssessment.identifiedRisks.contains { $0.type == .powerLines }
        return hasPowerLines ? 20 : 5
    }
    
    private func calculateSeverityScore(_ safetyAssessment: SafetyAnalysisResponse) -> Int {
        let criticalRisks = safetyAssessment.identifiedRisks.filter { $0.severity == .critical }
        return criticalRisks.isEmpty ? 5 : 18
    }
    
    private func calculateSiteConditionsScore(_ safetyAssessment: SafetyAnalysisResponse) -> Int {
        let hasEnvironmentalConcerns = safetyAssessment.identifiedRisks.contains { $0.type == .environmentalConcern }
        return hasEnvironmentalConcerns ? 12 : 6
    }
    
    private func enhanceBreakdown(_ breakdown: TreeScoreBreakdown, adjustments: [ScoreAdjustment]) -> TreeScoreBreakdown {
        return TreeScoreBreakdown(
            baseCalculation: breakdown.baseCalculation,
            heightComponent: breakdown.heightComponent,
            diameterComponent: breakdown.diameterComponent,
            crownComponent: breakdown.crownComponent,
            afissComponent: breakdown.afissComponent + adjustments.reduce(0) { $0 + $1.scoreChange },
            adjustments: adjustments,
            finalScore: breakdown.finalScore + adjustments.reduce(0) { $0 + $1.scoreChange }
        )
    }
    
    // MARK: - Real-time Helpers
    
    private func calculateEstimatedScore(_ partial: PartialTreeMeasurements) -> Int {
        // Estimate based on available measurements
        var estimate = 0
        
        if let height = partial.height {
            estimate += Int(height * 10) // Rough estimation
        }
        
        if let dbh = partial.dbh {
            estimate += Int(dbh * 5)
        }
        
        if let crownRadius = partial.crownRadius {
            estimate += Int(crownRadius * 3)
        }
        
        return estimate
    }
    
    private func assessMeasurementQuality(_ partial: PartialTreeMeasurements) async -> MeasurementQuality {
        // Agent would assess measurement quality in real implementation
        return MeasurementQuality(
            accuracy: 0.85,
            completeness: partial.completeness,
            consistency: 0.90,
            issues: []
        )
    }
    
    private func getNextMeasurementRecommendation(_ partial: PartialTreeMeasurements) async -> String {
        let missing = partial.getMissingMeasurements()
        
        if missing.contains("height") {
            return "Take height measurement next for baseline TreeScore calculation"
        } else if missing.contains("dbh") {
            return "Measure DBH (Diameter at Breast Height) for accurate volume calculation"
        } else if missing.contains("crownRadius") {
            return "Measure crown radius to complete the standard TreeScore formula"
        }
        
        return "All primary measurements complete. Consider additional risk factors."
    }
    
    private func createSafetyAssessmentData(from measurements: TreeMeasurements, context: TreeScoreContext) -> SafetyAssessmentData {
        return SafetyAssessmentData(
            location: measurements.location,
            powerLines: PowerLineProximity(
                present: context.nearPowerLines,
                distance: context.powerLineDistance,
                voltage: .residential
            ),
            structures: context.nearbyStructures,
            groundConditions: GroundConditions(
                slope: context.groundSlope,
                surface: context.surfaceType,
                stability: .stable
            ),
            weather: WeatherConditions(
                windSpeed: context.windSpeed,
                precipitation: 0.0,
                visibility: 10.0,
                temperature: 70.0
            ),
            traffic: TrafficConditions(
                volume: context.trafficVolume,
                speed: context.speedLimit,
                proximityToRoad: context.roadDistance
            )
        )
    }
}

// MARK: - Data Types

struct TreeScoreResult {
    let score: Int
    let breakdown: TreeScoreBreakdown
    let afissScore: AFISSScore
    let recommendations: [TreeScoreRecommendation]
    let confidence: Double
}

struct StumpScoreResult {
    let score: Int
    let breakdown: StumpScoreBreakdown
    let recommendations: [TreeScoreRecommendation]
    let confidence: Double
}

struct ScoreValidation {
    let isValid: Bool
    let errors: [ValidationError]
    let warnings: [ValidationWarning]
    let suggestions: [String]
    let confidence: Double
}

struct RealTimeValidation {
    let isComplete: Bool
    let estimatedScore: Int
    let missingMeasurements: [String]
    let qualityAssessment: MeasurementQuality
    let nextStepRecommendation: String
}

struct TreeScoreBreakdown: Codable {
    let baseCalculation: String
    let heightComponent: Double
    let diameterComponent: Double
    let crownComponent: Double
    let afissComponent: Int
    let adjustments: [ScoreAdjustment]
    let finalScore: Int
}

struct StumpScoreBreakdown: Codable {
    let baseCalculation: String
    let diameterComponent: Double
    let heightComponent: Double
    let depthComponent: Double
    let afissComponent: Int
    let finalScore: Int
}

struct AFISSScore {
    let access: Int
    let fallZone: Int
    let interference: Int
    let severity: Int
    let siteConditions: Int
    let totalScore: Int
    let riskLevel: RiskLevel
}

struct ScoreAdjustment: Codable {
    let type: AdjustmentType
    let reason: String
    let scoreChange: Int
    let riskType: RiskType
    let severity: RiskSeverity
    
    enum AdjustmentType: String, Codable {
        case safety, complexity, access, environmental
    }
}

struct TreeScoreRecommendation: Identifiable {
    let id = UUID()
    let type: RecommendationType
    let message: String
    let impact: Impact
    let agentSource: String
    let timestamp: Date = Date()
    
    enum RecommendationType {
        case safety, operational, optimization, warning, calculation
    }
    
    enum Impact {
        case positive, negative, neutral, medium
    }
}

struct TreeScoreCalculation {
    let id: String
    let timestamp: Date
    let measurements: TreeMeasurements
    let baseScore: Int
    let finalScore: Int
    let breakdown: TreeScoreBreakdown
    let afissScore: AFISSScore
    let agentRecommendations: [TreeScoreRecommendation]
    let calculationMethod: String
    let confidence: Double
}

struct PartialTreeMeasurements {
    let height: Double?
    let dbh: Double?
    let crownRadius: Double?
    let species: String?
    
    var isComplete: Bool {
        return height != nil && dbh != nil && crownRadius != nil
    }
    
    var completeness: Double {
        let total = 3.0
        var completed = 0.0
        if height != nil { completed += 1 }
        if dbh != nil { completed += 1 }
        if crownRadius != nil { completed += 1 }
        return completed / total
    }
    
    func getMissingMeasurements() -> [String] {
        var missing: [String] = []
        if height == nil { missing.append("height") }
        if dbh == nil { missing.append("dbh") }
        if crownRadius == nil { missing.append("crownRadius") }
        return missing
    }
}

struct MeasurementQuality {
    let accuracy: Double
    let completeness: Double
    let consistency: Double
    let issues: [String]
}

struct TreeScoreContext {
    let nearPowerLines: Bool
    let powerLineDistance: Double
    let nearbyStructures: [NearbyStructure]
    let groundSlope: GroundSlope
    let surfaceType: SurfaceType
    let windSpeed: Double
    let trafficVolume: TrafficVolume
    let speedLimit: Int
    let roadDistance: Double
    
    init(
        nearPowerLines: Bool = false,
        powerLineDistance: Double = 100.0,
        nearbyStructures: [NearbyStructure] = [],
        groundSlope: GroundSlope = .level,
        surfaceType: SurfaceType = .grass,
        windSpeed: Double = 5.0,
        trafficVolume: TrafficVolume = .low,
        speedLimit: Int = 25,
        roadDistance: Double = 50.0
    ) {
        self.nearPowerLines = nearPowerLines
        self.powerLineDistance = powerLineDistance
        self.nearbyStructures = nearbyStructures
        self.groundSlope = groundSlope
        self.surfaceType = surfaceType
        self.windSpeed = windSpeed
        self.trafficVolume = trafficVolume
        self.speedLimit = speedLimit
        self.roadDistance = roadDistance
    }
}

struct StumpScoreContext {
    let accessDifficulty: AccessDifficulty
    let rootSystemComplexity: RootSystemComplexity
    let soilType: SoilType
    
    enum AccessDifficulty {
        case easy, moderate, difficult, extreme
    }
    
    enum RootSystemComplexity {
        case simple, moderate, complex, extensive
    }
    
    enum SoilType {
        case sandy, clay, loam, rocky
    }
}

struct TreeScoreConfiguration {
    let enableRealTimeValidation: Bool
    let useAgentAdjustments: Bool
    let confidenceThreshold: Double
    let maxCalculationTime: TimeInterval
    
    static let `default` = TreeScoreConfiguration(
        enableRealTimeValidation: true,
        useAgentAdjustments: true,
        confidenceThreshold: 0.8,
        maxCalculationTime: 30.0
    )
}

// MARK: - Error Types

enum TreeScoreError: Error, LocalizedError {
    case invalidMeasurements([ValidationError])
    case calculationFailed(String)
    case agentUnavailable
    case confidenceTooLow(Double)
    
    var errorDescription: String? {
        switch self {
        case .invalidMeasurements(let errors):
            return "Invalid measurements: \(errors.map { $0.message }.joined(separator: ", "))"
        case .calculationFailed(let reason):
            return "TreeScore calculation failed: \(reason)"
        case .agentUnavailable:
            return "TreeScore calculation agent is unavailable"
        case .confidenceTooLow(let confidence):
            return "Calculation confidence too low: \(Int(confidence * 100))%"
        }
    }
}

// Supporting enums and structures would be defined here or imported from other files...