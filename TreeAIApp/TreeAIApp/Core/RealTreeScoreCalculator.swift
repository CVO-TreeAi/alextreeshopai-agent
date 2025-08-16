import Foundation
import CoreData
import Combine

/// Real TreeScore calculator implementing TreeAI True Labor Cost methodology
class RealTreeScoreCalculator: ObservableObject {
    
    // MARK: - Published Properties
    @Published var currentCalculation: TreeScoreCalculation?
    @Published var isCalculating = false
    @Published var calculationHistory: [TreeScoreCalculation] = []
    
    // MARK: - Dependencies
    private let dataManager = DataManager.shared
    private let locationManager = LocationManager()
    
    // MARK: - TreeScore Calculation
    
    /// Calculate TreeScore with real labor cost integration
    func calculateTreeScore(
        height: Double,
        dbh: Double,
        crownRadius: Double,
        species: TreeSpecies,
        condition: TreeCondition,
        location: TreeLocation,
        crew: CrewConfiguration,
        equipment: [EquipmentType],
        workDate: Date = Date()
    ) async -> TreeScoreCalculation {
        
        isCalculating = true
        defer { isCalculating = false }
        
        // Base TreeScore calculation (standard formula)
        let baseTreeScore = calculateBaseTreeScore(
            height: height,
            dbh: dbh,
            crownRadius: crownRadius,
            species: species,
            condition: condition
        )
        
        // Complexity factors
        let complexityFactors = calculateComplexityFactors(
            location: location,
            condition: condition,
            equipment: equipment
        )
        
        // Apply complexity multiplier
        let adjustedTreeScore = baseTreeScore * complexityFactors.totalMultiplier
        
        // Calculate true labor costs
        let laborCosts = await calculateTrueLaborCosts(
            treeScore: adjustedTreeScore,
            crew: crew,
            workDate: workDate
        )
        
        // Calculate equipment costs
        let equipmentCosts = calculateEquipmentCosts(
            equipment: equipment,
            estimatedHours: laborCosts.estimatedHours
        )
        
        // Calculate total project cost with TreeAI methodology
        let totalCost = laborCosts.totalLaborCost + equipmentCosts.totalCost
        
        // Create calculation result
        let calculation = TreeScoreCalculation(
            id: UUID(),
            timestamp: Date(),
            treeScore: adjustedTreeScore,
            baseTreeScore: baseTreeScore,
            height: height,
            dbh: dbh,
            crownRadius: crownRadius,
            species: species,
            condition: condition,
            location: location,
            complexityFactors: complexityFactors,
            laborCosts: laborCosts,
            equipmentCosts: equipmentCosts,
            totalCost: totalCost,
            crew: crew,
            equipment: equipment
        )
        
        // Update published properties
        DispatchQueue.main.async {
            self.currentCalculation = calculation
            self.calculationHistory.insert(calculation, at: 0)
        }
        
        return calculation
    }
    
    // MARK: - Base TreeScore Calculation
    
    private func calculateBaseTreeScore(
        height: Double,
        dbh: Double,
        crownRadius: Double,
        species: TreeSpecies,
        condition: TreeCondition
    ) -> Double {
        // Standard TreeScore formula: Height × Crown Radius × 2 × DBH ÷ 12
        let baseScore = (height * crownRadius * 2 * dbh) / 12
        
        // Species multiplier
        let speciesMultiplier = species.difficultyMultiplier
        
        // Condition multiplier
        let conditionMultiplier = condition.difficultyMultiplier
        
        return baseScore * speciesMultiplier * conditionMultiplier
    }
    
    // MARK: - Complexity Analysis
    
    private func calculateComplexityFactors(
        location: TreeLocation,
        condition: TreeCondition,
        equipment: [EquipmentType]
    ) -> ComplexityFactors {
        
        var factors: [String: Double] = [:]
        
        // Location complexity
        factors["Location Access"] = location.accessDifficultyMultiplier
        factors["Power Lines"] = location.hasPowerLines ? 1.5 : 1.0
        factors["Structures"] = location.nearStructures ? 1.3 : 1.0
        factors["Terrain"] = location.terrainDifficultyMultiplier
        
        // Tree condition complexity
        factors["Structural Issues"] = condition.hasStructuralIssues ? 1.4 : 1.0
        factors["Disease/Pest"] = condition.hasDisease ? 1.2 : 1.0
        factors["Dead Branches"] = condition.hasDeadBranches ? 1.3 : 1.0
        
        // Equipment requirements
        let requiresSpecialEquipment = equipment.contains { $0.requiresSpecialTraining }
        factors["Special Equipment"] = requiresSpecialEquipment ? 1.2 : 1.0
        
        // Calculate total multiplier
        let totalMultiplier = factors.values.reduce(1.0, *)
        
        return ComplexityFactors(
            factors: factors,
            totalMultiplier: totalMultiplier
        )
    }
    
    // MARK: - True Labor Cost Calculation
    
    private func calculateTrueLaborCosts(
        treeScore: Double,
        crew: CrewConfiguration,
        workDate: Date
    ) async -> LaborCostBreakdown {
        
        // Get crew members from database
        let employees = dataManager.fetchEmployees()
        var crewMembers: [Employee] = []
        
        // Build crew based on configuration
        for position in crew.positions {
            if let employee = employees.first(where: { $0.position == position.rawValue }) {
                crewMembers.append(employee)
            }
        }
        
        // Estimate hours based on TreeScore and complexity
        let estimatedHours = calculateEstimatedHours(treeScore: treeScore)
        
        var laborCostDetails: [LaborCostDetail] = []
        var totalLaborCost: Double = 0
        
        for employee in crewMembers {
            guard let laborComponent = employee.laborCostComponent else { continue }
            
            // Get seasonal adjustment for Florida tree care
            let seasonalAdjustment = laborComponent.getSeasonalAdjustmentFactor(for: workDate)
            let adjustedHourlyCost = laborComponent.getAdjustedHourlyCost(for: workDate)
            
            let employeeLaborCost = adjustedHourlyCost * estimatedHours
            totalLaborCost += employeeLaborCost
            
            let detail = LaborCostDetail(
                employee: employee,
                position: EmployeePosition(rawValue: employee.position ?? "") ?? .groundCrew,
                baseHourlyRate: employee.hourlyRate,
                trueLaborCostPerHour: adjustedHourlyCost,
                hours: estimatedHours,
                totalCost: employeeLaborCost,
                seasonalAdjustment: seasonalAdjustment,
                burdenRate: laborComponent.baseBurdenRate + laborComponent.workersCompRate
            )
            
            laborCostDetails.append(detail)
        }
        
        return LaborCostBreakdown(
            estimatedHours: estimatedHours,
            crewSize: crewMembers.count,
            laborDetails: laborCostDetails,
            totalLaborCost: totalLaborCost,
            averageHourlyCost: totalLaborCost / (estimatedHours * Double(crewMembers.count))
        )
    }
    
    private func calculateEstimatedHours(treeScore: Double) -> Double {
        // TreeScore-based time estimation with real-world calibration
        switch treeScore {
        case 0...300:
            return 2.0  // Small, simple trees
        case 301...600:
            return 4.0  // Medium trees
        case 601...900:
            return 6.5  // Large trees
        case 901...1200:
            return 9.0  // Very large trees
        case 1201...1500:
            return 12.0 // Extremely large/complex
        default:
            return 16.0 // Massive/hazardous trees
        }
    }
    
    // MARK: - Equipment Cost Calculation
    
    private func calculateEquipmentCosts(
        equipment: [EquipmentType],
        estimatedHours: Double
    ) -> EquipmentCostBreakdown {
        
        var equipmentDetails: [EquipmentCostDetail] = []
        var totalCost: Double = 0
        
        for equipmentType in equipment {
            let hourlyCost = getEquipmentHourlyCost(type: equipmentType)
            let equipmentCost = hourlyCost * estimatedHours
            totalCost += equipmentCost
            
            let detail = EquipmentCostDetail(
                type: equipmentType,
                hourlyRate: hourlyCost,
                hours: estimatedHours,
                totalCost: equipmentCost,
                depreciationCost: hourlyCost * 0.4, // 40% depreciation
                operatingCost: hourlyCost * 0.6     // 60% operating costs
            )
            
            equipmentDetails.append(detail)
        }
        
        return EquipmentCostBreakdown(
            equipmentDetails: equipmentDetails,
            totalCost: totalCost
        )
    }
    
    private func getEquipmentHourlyCost(type: EquipmentType) -> Double {
        // Real equipment costs based on TreeAI analysis
        switch type {
        case .chainsaw:
            return 25.0
        case .chipper:
            return 85.0
        case .stumpGrinder:
            return 125.0
        case .aerialLift:
            return 95.0
        case .truck:
            return 35.0
        case .trailer:
            return 15.0
        case .climbingGear:
            return 20.0
        }
    }
    
    // MARK: - Quick Calculation Methods
    
    /// Quick TreeScore calculation for field use
    func quickCalculate(height: Double, dbh: Double, crownRadius: Double) -> Double {
        return calculateBaseTreeScore(
            height: height,
            dbh: dbh,
            crownRadius: crownRadius,
            species: .mixed,
            condition: .good
        )
    }
    
    /// Get estimated cost range for a TreeScore
    func getEstimatedCostRange(treeScore: Double) -> (min: Double, max: Double) {
        let baseHours = calculateEstimatedHours(treeScore: treeScore)
        let laborCostLow = baseHours * 2 * 45.0  // 2-person crew at $45/hr
        let laborCostHigh = baseHours * 3 * 65.0 // 3-person crew at $65/hr
        
        let equipmentCostLow = baseHours * 50.0   // Basic equipment
        let equipmentCostHigh = baseHours * 150.0 // Advanced equipment
        
        return (
            min: (laborCostLow + equipmentCostLow) * 1.2,  // 20% margin
            max: (laborCostHigh + equipmentCostHigh) * 1.3 // 30% margin
        )
    }
}

// MARK: - Supporting Types

struct TreeScoreCalculation {
    let id: UUID
    let timestamp: Date
    let treeScore: Double
    let baseTreeScore: Double
    let height: Double
    let dbh: Double
    let crownRadius: Double
    let species: TreeSpecies
    let condition: TreeCondition
    let location: TreeLocation
    let complexityFactors: ComplexityFactors
    let laborCosts: LaborCostBreakdown
    let equipmentCosts: EquipmentCostBreakdown
    let totalCost: Double
    let crew: CrewConfiguration
    let equipment: [EquipmentType]
    
    var profitMargin: Double {
        let markup = totalCost * 0.25 // 25% markup
        return (markup / (totalCost + markup)) * 100
    }
    
    var priceWithMargin: Double {
        return totalCost * 1.25 // 25% markup
    }
}

struct ComplexityFactors {
    let factors: [String: Double]
    let totalMultiplier: Double
    
    var description: String {
        let factorDescriptions = factors
            .filter { $0.value != 1.0 }
            .map { "\($0.key): \(String(format: "%.1fx", $0.value))" }
            .joined(separator: ", ")
        
        return factorDescriptions.isEmpty ? "Standard complexity" : factorDescriptions
    }
}

struct LaborCostBreakdown {
    let estimatedHours: Double
    let crewSize: Int
    let laborDetails: [LaborCostDetail]
    let totalLaborCost: Double
    let averageHourlyCost: Double
}

struct LaborCostDetail {
    let employee: Employee
    let position: EmployeePosition
    let baseHourlyRate: Double
    let trueLaborCostPerHour: Double
    let hours: Double
    let totalCost: Double
    let seasonalAdjustment: Double
    let burdenRate: Double
    
    var burdenPercentage: Double {
        return burdenRate * 100
    }
}

struct EquipmentCostBreakdown {
    let equipmentDetails: [EquipmentCostDetail]
    let totalCost: Double
}

struct EquipmentCostDetail {
    let type: EquipmentType
    let hourlyRate: Double
    let hours: Double
    let totalCost: Double
    let depreciationCost: Double
    let operatingCost: Double
}

struct CrewConfiguration {
    let positions: [EmployeePosition]
    let size: Int
    
    static let standard2Person = CrewConfiguration(
        positions: [.crewLeader, .groundCrew],
        size: 2
    )
    
    static let standard3Person = CrewConfiguration(
        positions: [.crewLeader, .treeClimber, .groundCrew],
        size: 3
    )
    
    static let certifiedCrew = CrewConfiguration(
        positions: [.certifiedArborist, .treeClimber, .groundCrew],
        size: 3
    )
    
    static let heavyEquipmentCrew = CrewConfiguration(
        positions: [.crewLeader, .equipmentOperator, .groundCrew, .groundCrew],
        size: 4
    )
}

// MARK: - Tree Data Types

enum TreeSpecies: String, CaseIterable {
    case oak = "Oak"
    case pine = "Pine"
    case palm = "Palm"
    case maple = "Maple"
    case cypress = "Cypress"
    case magnolia = "Magnolia"
    case mixed = "Mixed/Unknown"
    
    var difficultyMultiplier: Double {
        switch self {
        case .oak:
            return 1.3 // Hard wood, heavy branches
        case .pine:
            return 1.1 // Tall, but relatively easy
        case .palm:
            return 0.9 // Specialized but predictable
        case .maple:
            return 1.2 // Moderate difficulty
        case .cypress:
            return 1.4 // Challenging wood, often near water
        case .magnolia:
            return 1.2 // Large leaves, moderate difficulty
        case .mixed:
            return 1.0 // Average
        }
    }
}

enum TreeCondition: String, CaseIterable {
    case excellent = "Excellent"
    case good = "Good"
    case fair = "Fair"
    case poor = "Poor"
    case hazardous = "Hazardous"
    
    var difficultyMultiplier: Double {
        switch self {
        case .excellent:
            return 1.0
        case .good:
            return 1.1
        case .fair:
            return 1.3
        case .poor:
            return 1.6
        case .hazardous:
            return 2.0
        }
    }
    
    var hasStructuralIssues: Bool {
        return self == .poor || self == .hazardous
    }
    
    var hasDisease: Bool {
        return self == .fair || self == .poor
    }
    
    var hasDeadBranches: Bool {
        return self == .poor || self == .hazardous
    }
}

struct TreeLocation {
    let accessDifficulty: AccessDifficulty
    let hasPowerLines: Bool
    let nearStructures: Bool
    let terrainType: TerrainType
    
    var accessDifficultyMultiplier: Double {
        return accessDifficulty.multiplier
    }
    
    var terrainDifficultyMultiplier: Double {
        return terrainType.multiplier
    }
}

enum AccessDifficulty: String, CaseIterable {
    case easy = "Easy Access"
    case moderate = "Moderate Access"
    case difficult = "Difficult Access"
    case veryDifficult = "Very Difficult Access"
    
    var multiplier: Double {
        switch self {
        case .easy: return 1.0
        case .moderate: return 1.2
        case .difficult: return 1.5
        case .veryDifficult: return 2.0
        }
    }
}

enum TerrainType: String, CaseIterable {
    case flat = "Flat"
    case sloped = "Sloped"
    case steep = "Steep"
    case swampy = "Swampy"
    case rocky = "Rocky"
    
    var multiplier: Double {
        switch self {
        case .flat: return 1.0
        case .sloped: return 1.2
        case .steep: return 1.5
        case .swampy: return 1.4
        case .rocky: return 1.3
        }
    }
}

// MARK: - Equipment Extensions

extension EquipmentType {
    var requiresSpecialTraining: Bool {
        switch self {
        case .chainsaw, .chipper, .stumpGrinder, .aerialLift:
            return true
        case .truck, .trailer, .climbingGear:
            return false
        }
    }
}