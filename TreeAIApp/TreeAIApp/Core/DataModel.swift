import Foundation
import CoreData
import CloudKit
import Combine
import SwiftUI

/// Core Data manager with CloudKit sync for TreeAI True Labor Cost system
class DataManager: ObservableObject {
    
    // MARK: - Singleton
    static let shared = DataManager()
    
    // MARK: - Published Properties
    @Published var isCloudKitReady = false
    @Published var syncStatus: SyncStatus = .idle
    @Published var lastSyncDate: Date?
    
    // MARK: - Core Data Stack
    lazy var persistentContainer: NSPersistentCloudKitContainer = {
        let container = NSPersistentCloudKitContainer(name: "TreeAIDataModel")
        
        // Configure CloudKit
        guard let description = container.persistentStoreDescriptions.first else {
            fatalError("Could not retrieve persistent store description")
        }
        
        description.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
        description.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
        
        // CloudKit configuration
        description.setOption(true as NSNumber, forKey: NSPersistentCloudKitContainerOptionsKey)
        
        container.loadPersistentStores { _, error in
            if let error = error {
                print("❌ Core Data failed to load: \(error.localizedDescription)")
                fatalError("Core Data error: \(error)")
            } else {
                print("✅ Core Data loaded successfully with CloudKit")
                DispatchQueue.main.async {
                    self.isCloudKitReady = true
                    self.syncStatus = .ready
                }
            }
        }
        
        // Enable automatic merging
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        
        return container
    }()
    
    var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    // MARK: - Sync Status
    enum SyncStatus {
        case idle
        case syncing
        case ready
        case error(String)
        
        var description: String {
            switch self {
            case .idle: return "Starting..."
            case .syncing: return "Syncing..."
            case .ready: return "Ready"
            case .error(let message): return "Error: \(message)"
            }
        }
    }
    
    // MARK: - Initialization
    private init() {
        setupNotifications()
    }
    
    private func setupNotifications() {
        // Listen for CloudKit remote changes
        NotificationCenter.default.addObserver(
            forName: .NSPersistentStoreRemoteChange,
            object: nil,
            queue: .main
        ) { _ in
            self.syncStatus = .syncing
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.syncStatus = .ready
                self.lastSyncDate = Date()
            }
        }
    }
    
    // MARK: - Save Operations
    func save() {
        guard context.hasChanges else { return }
        
        do {
            try context.save()
            print("✅ Data saved successfully")
        } catch {
            print("❌ Save error: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Employee Labor Cost Management
    func createEmployee(
        name: String,
        hourlyRate: Double,
        position: EmployeePosition,
        certifications: [String] = []
    ) -> Employee {
        let employee = Employee(context: context)
        employee.id = UUID()
        employee.name = name
        employee.hourlyRate = hourlyRate
        employee.position = position.rawValue
        employee.certifications = certifications
        employee.isActive = true
        employee.hireDate = Date()
        
        // Create initial labor cost components
        let laborCost = LaborCostComponent(context: context)
        laborCost.id = UUID()
        laborCost.employee = employee
        laborCost.baseBurdenRate = calculateBaseBurdenRate(for: position)
        laborCost.workersCompRate = getWorkersCompRate(for: position)
        laborCost.benefitsCostAnnual = calculateBenefitsCost(hourlyRate: hourlyRate)
        laborCost.equipmentAllocation = getEquipmentAllocation(for: position)
        laborCost.productiveHoursAnnual = 1440 // Base: 2080 hours - 30% non-productive
        laborCost.lastCalculated = Date()
        laborCost.calculateTrueLaborCost()
        
        save()
        return employee
    }
    
    func updateLaborCostComponents(for employee: Employee) {
        guard let laborCost = employee.laborCostComponent else { return }
        
        laborCost.baseBurdenRate = calculateBaseBurdenRate(for: EmployeePosition(rawValue: employee.position ?? "") ?? .groundCrew)
        laborCost.workersCompRate = getWorkersCompRate(for: EmployeePosition(rawValue: employee.position ?? "") ?? .groundCrew)
        laborCost.benefitsCostAnnual = calculateBenefitsCost(hourlyRate: employee.hourlyRate)
        laborCost.lastCalculated = Date()
        laborCost.calculateTrueLaborCost()
        
        save()
    }
    
    // MARK: - Time Tracking
    func clockIn(
        employee: Employee,
        project: Project,
        location: CLLocationCoordinate2D
    ) -> TimeEntry {
        let timeEntry = TimeEntry(context: context)
        timeEntry.id = UUID()
        timeEntry.employee = employee
        timeEntry.project = project
        timeEntry.clockIn = Date()
        timeEntry.latitude = location.latitude
        timeEntry.longitude = location.longitude
        timeEntry.isActive = true
        
        save()
        return timeEntry
    }
    
    func clockOut(timeEntry: TimeEntry, location: CLLocationCoordinate2D) {
        timeEntry.clockOut = Date()
        timeEntry.isActive = false
        
        // Calculate billable time
        if let clockIn = timeEntry.clockIn,
           let clockOut = timeEntry.clockOut {
            let totalMinutes = clockOut.timeIntervalSince(clockIn) / 60
            let billableMinutes = totalMinutes - timeEntry.breakMinutes - timeEntry.weatherDelayMinutes - timeEntry.travelMinutes
            timeEntry.billableMinutes = max(0, billableMinutes)
        }
        
        save()
    }
    
    // MARK: - Equipment Utilization
    func createEquipment(
        name: String,
        type: EquipmentType,
        purchasePrice: Double,
        yearPurchased: Int
    ) -> Equipment {
        let equipment = Equipment(context: context)
        equipment.id = UUID()
        equipment.name = name
        equipment.type = type.rawValue
        equipment.purchasePrice = purchasePrice
        equipment.yearPurchased = Int16(yearPurchased)
        equipment.isActive = true
        equipment.calculateDepreciation()
        
        save()
        return equipment
    }
    
    func recordEquipmentUsage(
        equipment: Equipment,
        project: Project,
        hours: Double,
        fuelCost: Double = 0,
        maintenanceCost: Double = 0
    ) -> EquipmentUtilization {
        let utilization = EquipmentUtilization(context: context)
        utilization.id = UUID()
        utilization.equipment = equipment
        utilization.project = project
        utilization.date = Date()
        utilization.operatingHours = hours
        utilization.fuelCost = fuelCost
        utilization.maintenanceCost = maintenanceCost
        utilization.calculateCostPerHour()
        
        save()
        return utilization
    }
    
    // MARK: - TreeAI Specific Calculations
    
    /// Calculate Florida-specific burden rate for tree care workers
    private func calculateBaseBurdenRate(for position: EmployeePosition) -> Double {
        switch position {
        case .certifiedArborist:
            return 0.42 // 42% - includes higher insurance and certification costs
        case .treeClimber:
            return 0.38 // 38% - high risk premium
        case .crewLeader:
            return 0.35 // 35% - supervisory responsibilities
        case .equipmentOperator:
            return 0.32 // 32% - specialized equipment training
        case .groundCrew:
            return 0.28 // 28% - entry level
        }
    }
    
    /// Get Florida workers' compensation rates for tree care industry
    private func getWorkersCompRate(for position: EmployeePosition) -> Double {
        switch position {
        case .certifiedArborist:
            return 0.12 // 12% - reduced due to certification
        case .treeClimber:
            return 0.15 // 15% - highest risk category
        case .crewLeader:
            return 0.10 // 10% - supervisory role
        case .equipmentOperator:
            return 0.13 // 13% - equipment operation risks
        case .groundCrew:
            return 0.08 // 8% - ground-level work
        }
    }
    
    private func calculateBenefitsCost(hourlyRate: Double) -> Double {
        let annualWage = hourlyRate * 2080
        return annualWage * 0.25 // 25% of annual wage for benefits
    }
    
    private func getEquipmentAllocation(for position: EmployeePosition) -> Double {
        switch position {
        case .certifiedArborist:
            return 1500 // Annual equipment allocation
        case .treeClimber:
            return 2500 // Climbing gear and safety equipment
        case .crewLeader:
            return 1000 // Basic tools and safety
        case .equipmentOperator:
            return 3000 // Heavy equipment operation
        case .groundCrew:
            return 800 // Basic ground tools
        }
    }
    
    // MARK: - Project Management
    func createProject(
        name: String,
        address: String,
        estimatedHours: Double,
        treeScore: Double
    ) -> Project {
        let project = Project(context: context)
        project.id = UUID()
        project.name = name
        project.address = address
        project.estimatedHours = estimatedHours
        project.treeScore = treeScore
        project.status = ProjectStatus.scheduled.rawValue
        project.createdDate = Date()
        
        save()
        return project
    }
    
    // MARK: - Data Fetching
    func fetchEmployees() -> [Employee] {
        let request: NSFetchRequest<Employee> = Employee.fetchRequest()
        request.predicate = NSPredicate(format: "isActive == YES")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Employee.name, ascending: true)]
        
        do {
            return try context.fetch(request)
        } catch {
            print("❌ Error fetching employees: \(error)")
            return []
        }
    }
    
    func fetchActiveTimeEntries() -> [TimeEntry] {
        let request: NSFetchRequest<TimeEntry> = TimeEntry.fetchRequest()
        request.predicate = NSPredicate(format: "isActive == YES")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \TimeEntry.clockIn, ascending: false)]
        
        do {
            return try context.fetch(request)
        } catch {
            print("❌ Error fetching time entries: \(error)")
            return []
        }
    }
    
    func fetchProjects() -> [Project] {
        let request: NSFetchRequest<Project> = Project.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Project.createdDate, ascending: false)]
        
        do {
            return try context.fetch(request)
        } catch {
            print("❌ Error fetching projects: \(error)")
            return []
        }
    }
}

// MARK: - Supporting Enums

enum EmployeePosition: String, CaseIterable {
    case certifiedArborist = "Certified Arborist"
    case treeClimber = "Tree Climber"
    case crewLeader = "Crew Leader"
    case equipmentOperator = "Equipment Operator"
    case groundCrew = "Ground Crew"
    
    var iconName: String {
        switch self {
        case .certifiedArborist: return "graduationcap.fill"
        case .treeClimber: return "figure.climbing"
        case .crewLeader: return "person.3.fill"
        case .equipmentOperator: return "gear"
        case .groundCrew: return "person.2.fill"
        }
    }
}

enum EquipmentType: String, CaseIterable {
    case chainsaw = "Chainsaw"
    case chipper = "Chipper"
    case stumpGrinder = "Stump Grinder"
    case aerialLift = "Aerial Lift"
    case truck = "Truck"
    case trailer = "Trailer"
    case climbingGear = "Climbing Gear"
    
    var iconName: String {
        switch self {
        case .chainsaw: return "bolt.fill"
        case .chipper: return "tornado"
        case .stumpGrinder: return "gear.circle.fill"
        case .aerialLift: return "arrow.up.circle.fill"
        case .truck: return "truck.box.fill"
        case .trailer: return "rectangle.on.rectangle"
        case .climbingGear: return "link.circle.fill"
        }
    }
}

enum ProjectStatus: String, CaseIterable {
    case scheduled = "Scheduled"
    case inProgress = "In Progress"
    case completed = "Completed"
    case cancelled = "Cancelled"
    
    var color: Color {
        switch self {
        case .scheduled: return .blue
        case .inProgress: return .orange
        case .completed: return .green
        case .cancelled: return .red
        }
    }
}

// MARK: - Core Location Import
import CoreLocation