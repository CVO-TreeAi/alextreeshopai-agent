import Foundation
import CoreData
import CloudKit

// MARK: - Employee Entity Extension
@objc(Employee)
public class Employee: NSManagedObject {
    
    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var hourlyRate: Double
    @NSManaged public var position: String?
    @NSManaged public var certifications: [String]
    @NSManaged public var isActive: Bool
    @NSManaged public var hireDate: Date
    
    // Relationships
    @NSManaged public var laborCostComponent: LaborCostComponent?
    @NSManaged public var timeEntries: NSSet?
    
    var currentTimeEntry: TimeEntry? {
        guard let timeEntries = timeEntries as? Set<TimeEntry> else { return nil }
        return timeEntries.first { $0.isActive }
    }
    
    var totalHoursWorked: Double {
        guard let timeEntries = timeEntries as? Set<TimeEntry> else { return 0 }
        return timeEntries.reduce(0) { total, entry in
            total + (entry.billableMinutes / 60.0)
        }
    }
    
    /// Calculate true labor cost per hour including all burden
    var trueLaborCostPerHour: Double {
        return laborCostComponent?.trueLaborCost ?? hourlyRate
    }
}

extension Employee {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Employee> {
        return NSFetchRequest<Employee>(entityName: "Employee")
    }
}

// MARK: - LaborCostComponent Entity Extension
@objc(LaborCostComponent)
public class LaborCostComponent: NSManagedObject {
    
    @NSManaged public var id: UUID
    @NSManaged public var baseBurdenRate: Double
    @NSManaged public var workersCompRate: Double
    @NSManaged public var benefitsCostAnnual: Double
    @NSManaged public var equipmentAllocation: Double
    @NSManaged public var productiveHoursAnnual: Double
    @NSManaged public var trueLaborCost: Double
    @NSManaged public var lastCalculated: Date
    
    // Relationships
    @NSManaged public var employee: Employee?
    
    /// Calculate and update the true labor cost
    func calculateTrueLaborCost() {
        guard let employee = employee else { return }
        
        let annualWage = employee.hourlyRate * 2080
        let totalBurdenRate = baseBurdenRate + workersCompRate
        let totalAnnualCost = (annualWage * (1 + totalBurdenRate)) + benefitsCostAnnual + equipmentAllocation
        
        self.trueLaborCost = totalAnnualCost / productiveHoursAnnual
        self.lastCalculated = Date()
    }
    
    /// Get seasonal adjustment factor for Florida tree care
    func getSeasonalAdjustmentFactor(for date: Date = Date()) -> Double {
        let calendar = Calendar.current
        let month = calendar.component(.month, from: date)
        
        switch month {
        case 6...11: // Hurricane season (June-November)
            return 0.85 // 15% productivity reduction
        case 12...2: // Winter dry season
            return 1.10 // 10% productivity increase
        default: // Spring months
            return 1.0 // Normal productivity
        }
    }
    
    /// Calculate adjusted hourly cost based on season and conditions
    func getAdjustedHourlyCost(for date: Date = Date()) -> Double {
        let seasonalFactor = getSeasonalAdjustmentFactor(for: date)
        return trueLaborCost / seasonalFactor
    }
}

extension LaborCostComponent {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<LaborCostComponent> {
        return NSFetchRequest<LaborCostComponent>(entityName: "LaborCostComponent")
    }
}

// MARK: - TimeEntry Entity Extension
@objc(TimeEntry)
public class TimeEntry: NSManagedObject {
    
    @NSManaged public var id: UUID
    @NSManaged public var clockIn: Date?
    @NSManaged public var clockOut: Date?
    @NSManaged public var breakMinutes: Double
    @NSManaged public var weatherDelayMinutes: Double
    @NSManaged public var travelMinutes: Double
    @NSManaged public var billableMinutes: Double
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var isActive: Bool
    
    // Relationships
    @NSManaged public var employee: Employee?
    @NSManaged public var project: Project?
    
    var totalHours: Double {
        guard let clockIn = clockIn,
              let clockOut = clockOut else { return 0 }
        return clockOut.timeIntervalSince(clockIn) / 3600
    }
    
    var billableHours: Double {
        return billableMinutes / 60.0
    }
    
    var effectiveHourlyRate: Double {
        guard let employee = employee else { return 0 }
        return employee.trueLaborCostPerHour
    }
    
    var totalLaborCost: Double {
        return billableHours * effectiveHourlyRate
    }
    
    /// Calculate productivity percentage for this time entry
    var productivityPercentage: Double {
        guard totalHours > 0 else { return 0 }
        return (billableHours / totalHours) * 100
    }
}

extension TimeEntry {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<TimeEntry> {
        return NSFetchRequest<TimeEntry>(entityName: "TimeEntry")
    }
}

// MARK: - Equipment Entity Extension
@objc(Equipment)
public class Equipment: NSManagedObject {
    
    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var type: String
    @NSManaged public var purchasePrice: Double
    @NSManaged public var currentValue: Double
    @NSManaged public var yearPurchased: Int16
    @NSManaged public var isActive: Bool
    @NSManaged public var maintenanceCostYTD: Double
    @NSManaged public var operatingHoursYTD: Double
    
    // Relationships
    @NSManaged public var utilizations: NSSet?
    
    var age: Int {
        return Calendar.current.component(.year, from: Date()) - Int(yearPurchased)
    }
    
    var totalOperatingHours: Double {
        guard let utilizations = utilizations as? Set<EquipmentUtilization> else { return 0 }
        return utilizations.reduce(0) { total, util in
            total + util.operatingHours
        }
    }
    
    var averageCostPerHour: Double {
        let totalHours = totalOperatingHours
        guard totalHours > 0 else { return 0 }
        
        let totalCosts = depreciationCost + maintenanceCostYTD
        return totalCosts / totalHours
    }
    
    /// Calculate annual depreciation using MACRS 7-year schedule
    var depreciationCost: Double {
        let macrsRates = [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893] // 7-year MACRS
        let yearIndex = min(age, macrsRates.count - 1)
        
        if age < macrsRates.count {
            return purchasePrice * macrsRates[yearIndex]
        } else {
            return 0 // Fully depreciated
        }
    }
    
    func calculateDepreciation() {
        let macrsRates = [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893]
        var totalDepreciation: Double = 0
        
        for year in 0..<min(age, macrsRates.count) {
            totalDepreciation += purchasePrice * macrsRates[year]
        }
        
        currentValue = max(0, purchasePrice - totalDepreciation)
    }
}

extension Equipment {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Equipment> {
        return NSFetchRequest<Equipment>(entityName: "Equipment")
    }
}

// MARK: - EquipmentUtilization Entity Extension
@objc(EquipmentUtilization)
public class EquipmentUtilization: NSManagedObject {
    
    @NSManaged public var id: UUID
    @NSManaged public var date: Date
    @NSManaged public var operatingHours: Double
    @NSManaged public var costPerHour: Double
    @NSManaged public var maintenanceCost: Double
    @NSManaged public var fuelCost: Double
    @NSManaged public var utilizationRate: Double
    
    // Relationships
    @NSManaged public var equipment: Equipment?
    @NSManaged public var project: Project?
    
    var totalCost: Double {
        return (costPerHour * operatingHours) + maintenanceCost + fuelCost
    }
    
    func calculateCostPerHour() {
        guard let equipment = equipment else { return }
        
        // Base depreciation cost per hour
        let depreciationPerHour = equipment.depreciationCost / 2000 // Assume 2000 hours/year
        
        // Operating cost per hour (fuel, maintenance, insurance)
        let operatingCostPerHour = (maintenanceCost + fuelCost) / max(operatingHours, 1)
        
        self.costPerHour = depreciationPerHour + operatingCostPerHour + 25 // Base operating cost
    }
    
    /// Calculate equipment efficiency for this utilization period
    var efficiencyRating: Double {
        // Efficiency based on utilization rate and maintenance costs
        let utilizationScore = min(utilizationRate * 100, 100)
        let maintenanceScore = max(0, 100 - (maintenanceCost / (costPerHour * operatingHours) * 100))
        
        return (utilizationScore + maintenanceScore) / 2
    }
}

extension EquipmentUtilization {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<EquipmentUtilization> {
        return NSFetchRequest<EquipmentUtilization>(entityName: "EquipmentUtilization")
    }
}

// MARK: - Project Entity Extension
@objc(Project)
public class Project: NSManagedObject {
    
    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var address: String
    @NSManaged public var estimatedHours: Double
    @NSManaged public var actualHours: Double
    @NSManaged public var treeScore: Double
    @NSManaged public var status: String
    @NSManaged public var createdDate: Date
    @NSManaged public var completedDate: Date?
    @NSManaged public var estimatedCost: Double
    @NSManaged public var actualCost: Double
    
    // Relationships
    @NSManaged public var timeEntries: NSSet?
    @NSManaged public var equipmentUtilizations: NSSet?
    
    var timeEntriesArray: [TimeEntry] {
        guard let timeEntries = timeEntries as? Set<TimeEntry> else { return [] }
        return Array(timeEntries).sorted { $0.clockIn ?? Date() < $1.clockIn ?? Date() }
    }
    
    var equipmentUtilizationsArray: [EquipmentUtilization] {
        guard let utilizations = equipmentUtilizations as? Set<EquipmentUtilization> else { return [] }
        return Array(utilizations).sorted { $0.date < $1.date }
    }
    
    /// Calculate total labor cost for this project
    var totalLaborCost: Double {
        return timeEntriesArray.reduce(0) { total, entry in
            total + entry.totalLaborCost
        }
    }
    
    /// Calculate total equipment cost for this project
    var totalEquipmentCost: Double {
        return equipmentUtilizationsArray.reduce(0) { total, utilization in
            total + utilization.totalCost
        }
    }
    
    /// Calculate total project cost (labor + equipment)
    var totalProjectCost: Double {
        return totalLaborCost + totalEquipmentCost
    }
    
    /// Calculate profit margin
    var profitMargin: Double {
        guard estimatedCost > 0 else { return 0 }
        return ((estimatedCost - totalProjectCost) / estimatedCost) * 100
    }
    
    /// Calculate project efficiency
    var efficiency: Double {
        guard estimatedHours > 0 else { return 0 }
        return (estimatedHours / max(actualHours, 0.1)) * 100
    }
    
    /// Update actual hours from time entries
    func updateActualHours() {
        actualHours = timeEntriesArray.reduce(0) { total, entry in
            total + entry.billableHours
        }
    }
    
    /// Update actual cost from labor and equipment
    func updateActualCost() {
        actualCost = totalProjectCost
    }
    
    /// Calculate TreeScore-based estimated cost using True Labor Cost
    func calculateEstimatedCost(crewSize: Int = 2, equipmentType: EquipmentType = .chainsaw) {
        // TreeScore complexity factor
        let complexityFactor: Double
        switch treeScore {
        case 0...400:
            complexityFactor = 1.0
        case 401...800:
            complexityFactor = 1.5
        case 801...1200:
            complexityFactor = 2.0
        default:
            complexityFactor = 2.5
        }
        
        // Base time estimation from TreeScore
        let baseHours = (treeScore / 100) * complexityFactor
        estimatedHours = baseHours
        
        // Calculate labor cost with True Labor Cost methodology
        let averageTrueLaborCost: Double = 55.0 // This should be calculated from actual crew
        let laborCost = baseHours * Double(crewSize) * averageTrueLaborCost
        
        // Equipment cost estimation
        let equipmentCostPerHour: Double
        switch equipmentType {
        case .chainsaw:
            equipmentCostPerHour = 25.0
        case .chipper:
            equipmentCostPerHour = 85.0
        case .stumpGrinder:
            equipmentCostPerHour = 125.0
        case .aerialLift:
            equipmentCostPerHour = 95.0
        case .truck:
            equipmentCostPerHour = 35.0
        default:
            equipmentCostPerHour = 50.0
        }
        
        let equipmentCost = baseHours * equipmentCostPerHour
        
        // Total estimated cost with 20% margin
        estimatedCost = (laborCost + equipmentCost) * 1.20
    }
}

extension Project {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Project> {
        return NSFetchRequest<Project>(entityName: "Project")
    }
}