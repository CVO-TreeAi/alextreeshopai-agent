import Foundation
import CoreData
import CoreLocation
import Combine
import SwiftUI

/// Real equipment tracking and utilization monitoring for TreeAI operations
class EquipmentTrackingManager: ObservableObject {
    
    // MARK: - Published Properties
    @Published var activeEquipment: [EquipmentSession] = []
    @Published var utilizationMetrics: EquipmentUtilizationMetrics?
    @Published var maintenanceAlerts: [MaintenanceAlert] = []
    @Published var costAnalysis: EquipmentCostAnalysis?
    @Published var isTracking = false
    @Published var lastError: EquipmentError?
    
    // MARK: - Dependencies
    private let dataManager = DataManager.shared
    private let locationManager = LocationManager()
    private var cancellables = Set<AnyCancellable>()
    private var trackingTimer: Timer?
    
    // MARK: - Constants
    private let trackingInterval: TimeInterval = 60 // Track every minute
    private let geofenceRadius: CLLocationDistance = 50 // 50 meter accuracy for equipment
    
    // MARK: - Initialization
    init() {
        setupNotifications()
        loadActiveEquipment()
        startUtilizationMonitoring()
    }
    
    deinit {
        stopAllTracking()
    }
    
    private func setupNotifications() {
        // Listen for app state changes
        NotificationCenter.default.addObserver(
            forName: UIApplication.didEnterBackgroundNotification,
            object: nil,
            queue: .main
        ) { _ in
            self.pauseTracking()
        }
        
        NotificationCenter.default.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil,
            queue: .main
        ) { _ in
            self.resumeTracking()
        }
    }
    
    // MARK: - Equipment Session Management
    
    /// Start tracking equipment usage for a project
    func startEquipmentTracking(
        equipment: Equipment,
        project: Project,
        operator: Employee
    ) -> EquipmentSession? {
        
        guard let location = locationManager.currentLocation else {
            lastError = .locationUnavailable
            return nil
        }
        
        // Check if equipment is already being tracked
        if activeEquipment.contains(where: { $0.equipment.id == equipment.id }) {
            lastError = .equipmentAlreadyActive
            return nil
        }
        
        let session = EquipmentSession(
            id: UUID(),
            equipment: equipment,
            project: project,
            operator: operator,
            startTime: Date(),
            startLocation: location,
            initialReading: getEquipmentReading(equipment)
        )
        
        // Add to active tracking
        activeEquipment.append(session)
        
        // Record in Core Data
        let utilization = dataManager.recordEquipmentUsage(
            equipment: equipment,
            project: project,
            hours: 0, // Will be updated when session ends
            fuelCost: 0,
            maintenanceCost: 0
        )
        
        session.utilizationRecord = utilization
        
        print("🛠️ Started tracking \(equipment.name) for project \(project.name)")
        
        if !isTracking {
            startPeriodicTracking()
        }
        
        return session
    }
    
    /// Stop tracking equipment and calculate final metrics
    func stopEquipmentTracking(session: EquipmentSession) -> EquipmentUtilizationSummary? {
        
        guard let index = activeEquipment.firstIndex(where: { $0.id == session.id }),
              let location = locationManager.currentLocation else {
            lastError = .sessionNotFound
            return nil
        }
        
        let endTime = Date()
        let totalHours = endTime.timeIntervalSince(session.startTime) / 3600
        let finalReading = getEquipmentReading(session.equipment)
        
        // Update session
        session.endTime = endTime
        session.endLocation = location
        session.totalHours = totalHours
        session.finalReading = finalReading
        
        // Calculate metrics
        let summary = calculateUtilizationSummary(session: session)
        
        // Update Core Data record
        if let utilizationRecord = session.utilizationRecord {
            utilizationRecord.operatingHours = totalHours
            utilizationRecord.fuelCost = summary.fuelCost
            utilizationRecord.maintenanceCost = summary.maintenanceCost
            utilizationRecord.calculateCostPerHour()
            dataManager.save()
        }
        
        // Remove from active tracking
        activeEquipment.remove(at: index)
        
        print("🛠️ Stopped tracking \(session.equipment.name) - \(String(format: "%.1f", totalHours)) hours")
        
        if activeEquipment.isEmpty {
            stopPeriodicTracking()
        }
        
        // Check for maintenance needs
        checkMaintenanceRequirements(for: session.equipment, hours: totalHours)
        
        return summary
    }
    
    /// Get current equipment reading (hours, fuel, etc.)
    private func getEquipmentReading(_ equipment: Equipment) -> EquipmentReading {
        // In a real implementation, this would connect to equipment telematics
        // For now, we'll estimate based on existing data
        
        let baseHours = equipment.operatingHoursYTD
        let estimatedCurrent = baseHours + Double.random(in: 0...2) // Small increment
        
        return EquipmentReading(
            timestamp: Date(),
            operatingHours: estimatedCurrent,
            fuelLevel: Double.random(in: 0.2...1.0), // 20-100%
            engineRPM: getEstimatedRPM(for: equipment),
            hydraulicPressure: getEstimatedPressure(for: equipment),
            temperature: getEstimatedTemperature(for: equipment)
        )
    }
    
    // MARK: - Periodic Tracking
    
    private func startPeriodicTracking() {
        isTracking = true
        trackingTimer = Timer.scheduledTimer(withTimeInterval: trackingInterval, repeats: true) { [weak self] _ in
            self?.updateTrackingData()
        }
        print("📊 Started periodic equipment tracking")
    }
    
    private func stopPeriodicTracking() {
        isTracking = false
        trackingTimer?.invalidate()
        trackingTimer = nil
        print("📊 Stopped periodic equipment tracking")
    }
    
    private func pauseTracking() {
        trackingTimer?.invalidate()
        print("⏸️ Paused equipment tracking")
    }
    
    private func resumeTracking() {
        if isTracking && trackingTimer == nil {
            startPeriodicTracking()
            print("▶️ Resumed equipment tracking")
        }
    }
    
    private func stopAllTracking() {
        // End all active sessions
        for session in activeEquipment {
            _ = stopEquipmentTracking(session: session)
        }
    }
    
    private func updateTrackingData() {
        guard !activeEquipment.isEmpty else { return }
        
        for session in activeEquipment {
            // Update current readings
            session.currentReading = getEquipmentReading(session.equipment)
            
            // Update location if available
            if let location = locationManager.currentLocation {
                session.currentLocation = location
            }
            
            // Check for efficiency anomalies
            checkEfficiencyAnomalies(session: session)
        }
        
        // Update utilization metrics
        updateUtilizationMetrics()
    }
    
    // MARK: - Utilization Metrics
    
    private func updateUtilizationMetrics() {
        let totalHours = activeEquipment.reduce(0) { total, session in
            total + (session.totalHours ?? (Date().timeIntervalSince(session.startTime) / 3600))
        }
        
        let totalCost = activeEquipment.reduce(0) { total, session in
            total + (session.equipment.averageCostPerHour * (session.totalHours ?? 1))
        }
        
        let averageEfficiency = activeEquipment.reduce(0) { total, session in
            total + calculateCurrentEfficiency(session: session)
        } / Double(activeEquipment.count)
        
        utilizationMetrics = EquipmentUtilizationMetrics(
            activeEquipmentCount: activeEquipment.count,
            totalOperatingHours: totalHours,
            totalCost: totalCost,
            averageEfficiency: averageEfficiency,
            utilizationRate: calculateUtilizationRate()
        )
    }
    
    private func calculateCurrentEfficiency(session: EquipmentSession) -> Double {
        guard let currentReading = session.currentReading else { return 1.0 }
        
        // Efficiency based on various factors
        var efficiency = 1.0
        
        // Fuel efficiency
        let fuelEfficiency = calculateFuelEfficiency(session: session)
        efficiency *= fuelEfficiency
        
        // Operating temperature efficiency
        let tempEfficiency = calculateTemperatureEfficiency(reading: currentReading)
        efficiency *= tempEfficiency
        
        // Usage pattern efficiency
        let usageEfficiency = calculateUsageEfficiency(session: session)
        efficiency *= usageEfficiency
        
        return max(0.1, min(1.0, efficiency)) // Clamp between 10% and 100%
    }
    
    private func calculateFuelEfficiency(session: EquipmentSession) -> Double {
        guard let current = session.currentReading,
              let initial = session.initialReading else { return 1.0 }
        
        let fuelUsed = initial.fuelLevel - current.fuelLevel
        let hoursUsed = Date().timeIntervalSince(session.startTime) / 3600
        
        if hoursUsed <= 0 || fuelUsed <= 0 { return 1.0 }
        
        let fuelRate = fuelUsed / hoursUsed
        let expectedRate = getExpectedFuelRate(for: session.equipment)
        
        return min(1.0, expectedRate / fuelRate) // Better than expected = >1.0, worse = <1.0
    }
    
    private func calculateTemperatureEfficiency(reading: EquipmentReading) -> Double {
        let optimalTemp = 180.0 // Optimal operating temperature
        let tempDiff = abs(reading.temperature - optimalTemp)
        
        switch tempDiff {
        case 0...10:
            return 1.0 // Optimal range
        case 10...25:
            return 0.95 // Good range
        case 25...50:
            return 0.85 // Acceptable range
        default:
            return 0.7 // Poor efficiency
        }
    }
    
    private func calculateUsageEfficiency(session: EquipmentSession) -> Double {
        // Calculate based on actual usage vs. expected usage patterns
        let elapsedHours = Date().timeIntervalSince(session.startTime) / 3600
        let expectedUtilization = getExpectedUtilization(for: session.equipment)
        
        guard elapsedHours > 0 else { return 1.0 }
        
        let actualUtilization = (session.currentReading?.operatingHours ?? 0) - (session.initialReading?.operatingHours ?? 0)
        let utilizationRate = actualUtilization / elapsedHours
        
        return min(1.0, utilizationRate / expectedUtilization)
    }
    
    // MARK: - Maintenance Monitoring
    
    private func checkMaintenanceRequirements(for equipment: Equipment, hours: Double) {
        let totalHours = equipment.operatingHoursYTD + hours
        let maintenanceSchedule = getMaintenanceSchedule(for: equipment)
        
        for maintenance in maintenanceSchedule {
            if totalHours >= maintenance.dueAtHours {
                let alert = MaintenanceAlert(
                    id: UUID(),
                    equipment: equipment,
                    maintenanceType: maintenance.type,
                    severity: maintenance.severity,
                    description: maintenance.description,
                    dueDate: Date(),
                    estimatedCost: maintenance.estimatedCost
                )
                
                if !maintenanceAlerts.contains(where: { $0.id == alert.id }) {
                    maintenanceAlerts.append(alert)
                    print("🔧 Maintenance alert: \(equipment.name) - \(maintenance.type)")
                }
            }
        }
    }
    
    private func checkEfficiencyAnomalies(session: EquipmentSession) {
        let efficiency = calculateCurrentEfficiency(session: session)
        
        if efficiency < 0.7 { // Below 70% efficiency
            let alert = MaintenanceAlert(
                id: UUID(),
                equipment: session.equipment,
                maintenanceType: "Performance Check",
                severity: .warning,
                description: "Equipment efficiency has dropped to \(Int(efficiency * 100))%",
                dueDate: Date(),
                estimatedCost: 150.0
            )
            
            if !maintenanceAlerts.contains(where: { $0.equipment.id == session.equipment.id && $0.maintenanceType == "Performance Check" }) {
                maintenanceAlerts.append(alert)
            }
        }
    }
    
    // MARK: - Cost Analysis
    
    func generateCostAnalysis() {
        let totalEquipment = dataManager.fetchEquipment()
        let totalUtilizations = totalEquipment.flatMap { $0.utilizationsArray }
        
        let totalCost = totalUtilizations.reduce(0) { $0 + $1.totalCost }
        let totalHours = totalUtilizations.reduce(0) { $0 + $1.operatingHours }
        let averageCostPerHour = totalHours > 0 ? totalCost / totalHours : 0
        
        let utilizationByType = Dictionary(grouping: totalUtilizations) { $0.equipment?.type ?? "Unknown" }
        let costByType = utilizationByType.mapValues { utilizations in
            utilizations.reduce(0) { $0 + $1.totalCost }
        }
        
        costAnalysis = EquipmentCostAnalysis(
            totalCost: totalCost,
            totalHours: totalHours,
            averageCostPerHour: averageCostPerHour,
            costByType: costByType,
            utilizationTrends: calculateUtilizationTrends(totalUtilizations),
            recommendations: generateCostRecommendations(totalUtilizations)
        )
    }
    
    private func calculateUtilizationTrends(_ utilizations: [EquipmentUtilization]) -> [UtilizationTrend] {
        // Group by month and calculate trends
        let monthlyData = Dictionary(grouping: utilizations) { utilization in
            Calendar.current.dateInterval(of: .month, for: utilization.date)?.start ?? utilization.date
        }
        
        return monthlyData.map { (month, utilizations) in
            let totalHours = utilizations.reduce(0) { $0 + $1.operatingHours }
            let totalCost = utilizations.reduce(0) { $0 + $1.totalCost }
            
            return UtilizationTrend(
                period: month,
                hours: totalHours,
                cost: totalCost,
                efficiency: utilizations.reduce(0) { $0 + $1.efficiencyRating } / Double(utilizations.count)
            )
        }.sorted { $0.period < $1.period }
    }
    
    private func generateCostRecommendations(_ utilizations: [EquipmentUtilization]) -> [String] {
        var recommendations: [String] = []
        
        // Check for underutilized equipment
        let equipmentUtilization = Dictionary(grouping: utilizations) { $0.equipment?.id }
        
        for (_, equipmentUtilizations) in equipmentUtilization {
            let avgUtilization = equipmentUtilizations.reduce(0) { $0 + $1.utilizationRate } / Double(equipmentUtilizations.count)
            
            if avgUtilization < 0.3 { // Less than 30% utilization
                if let equipment = equipmentUtilizations.first?.equipment {
                    recommendations.append("Consider selling or renting out \(equipment.name) - low utilization rate")
                }
            }
        }
        
        // Check for high-cost equipment
        let avgCostPerHour = utilizations.reduce(0) { $0 + $1.costPerHour } / Double(utilizations.count)
        let highCostEquipment = utilizations.filter { $0.costPerHour > avgCostPerHour * 1.5 }
        
        for utilization in highCostEquipment {
            if let equipment = utilization.equipment {
                recommendations.append("Review high operating costs for \(equipment.name) - consider maintenance or replacement")
            }
        }
        
        return recommendations
    }
    
    // MARK: - Utility Methods
    
    private func loadActiveEquipment() {
        // Load any equipment that might have been tracking when app closed
        // In a real implementation, this would restore from persistent storage
    }
    
    private func calculateUtilizationRate() -> Double {
        guard !activeEquipment.isEmpty else { return 0 }
        
        let totalPossibleHours = Double(activeEquipment.count) * 8.0 // 8 hours per day max
        let totalActualHours = activeEquipment.reduce(0) { total, session in
            total + (Date().timeIntervalSince(session.startTime) / 3600)
        }
        
        return min(1.0, totalActualHours / totalPossibleHours)
    }
    
    private func getEstimatedRPM(for equipment: Equipment) -> Double {
        switch EquipmentType(rawValue: equipment.type) {
        case .chainsaw:
            return Double.random(in: 2000...8000)
        case .chipper:
            return Double.random(in: 1000...3000)
        case .stumpGrinder:
            return Double.random(in: 1500...2500)
        case .aerialLift:
            return Double.random(in: 1000...2000)
        case .truck:
            return Double.random(in: 800...3000)
        default:
            return 0
        }
    }
    
    private func getEstimatedPressure(for equipment: Equipment) -> Double {
        switch EquipmentType(rawValue: equipment.type) {
        case .aerialLift, .stumpGrinder:
            return Double.random(in: 2000...3500) // PSI
        default:
            return 0
        }
    }
    
    private func getEstimatedTemperature(for equipment: Equipment) -> Double {
        // Operating temperature in Fahrenheit
        return Double.random(in: 160...200)
    }
    
    private func getExpectedFuelRate(for equipment: Equipment) -> Double {
        // Gallons per hour
        switch EquipmentType(rawValue: equipment.type) {
        case .chainsaw:
            return 0.5
        case .chipper:
            return 3.0
        case .stumpGrinder:
            return 5.0
        case .aerialLift:
            return 2.0
        case .truck:
            return 4.0
        default:
            return 1.0
        }
    }
    
    private func getExpectedUtilization(for equipment: Equipment) -> Double {
        // Expected operating hours per elapsed hour
        switch EquipmentType(rawValue: equipment.type) {
        case .chainsaw:
            return 0.8 // High utilization when in use
        case .chipper:
            return 0.6 // Moderate utilization
        case .stumpGrinder:
            return 0.7 // Good utilization
        case .aerialLift:
            return 0.5 // Lower utilization due to setup time
        case .truck:
            return 0.3 // Low utilization (travel, loading)
        default:
            return 0.5
        }
    }
    
    private func getMaintenanceSchedule(for equipment: Equipment) -> [MaintenanceSchedule] {
        switch EquipmentType(rawValue: equipment.type) {
        case .chainsaw:
            return [
                MaintenanceSchedule(type: "Chain Sharpening", dueAtHours: 25, severity: .routine, description: "Sharpen chain", estimatedCost: 20),
                MaintenanceSchedule(type: "Air Filter", dueAtHours: 50, severity: .preventive, description: "Replace air filter", estimatedCost: 15),
                MaintenanceSchedule(type: "Spark Plug", dueAtHours: 100, severity: .preventive, description: "Replace spark plug", estimatedCost: 10)
            ]
        case .chipper:
            return [
                MaintenanceSchedule(type: "Blade Sharpening", dueAtHours: 100, severity: .routine, description: "Sharpen chipper blades", estimatedCost: 150),
                MaintenanceSchedule(type: "Belt Inspection", dueAtHours: 200, severity: .preventive, description: "Inspect drive belts", estimatedCost: 75),
                MaintenanceSchedule(type: "Engine Service", dueAtHours: 500, severity: .major, description: "Complete engine service", estimatedCost: 500)
            ]
        default:
            return []
        }
    }
}

// MARK: - Data Types

class EquipmentSession: ObservableObject, Identifiable {
    let id: UUID
    let equipment: Equipment
    let project: Project
    let operator: Employee
    let startTime: Date
    let startLocation: CLLocationCoordinate2D
    let initialReading: EquipmentReading
    
    var endTime: Date?
    var endLocation: CLLocationCoordinate2D?
    var totalHours: Double?
    var finalReading: EquipmentReading?
    var currentReading: EquipmentReading?
    var currentLocation: CLLocationCoordinate2D?
    var utilizationRecord: EquipmentUtilization?
    
    init(id: UUID, equipment: Equipment, project: Project, operator: Employee, startTime: Date, startLocation: CLLocationCoordinate2D, initialReading: EquipmentReading) {
        self.id = id
        self.equipment = equipment
        self.project = project
        self.operator = operator
        self.startTime = startTime
        self.startLocation = startLocation
        self.initialReading = initialReading
    }
}

struct EquipmentReading {
    let timestamp: Date
    let operatingHours: Double
    let fuelLevel: Double // 0.0 to 1.0
    let engineRPM: Double
    let hydraulicPressure: Double // PSI
    let temperature: Double // Fahrenheit
}

struct EquipmentUtilizationMetrics {
    let activeEquipmentCount: Int
    let totalOperatingHours: Double
    let totalCost: Double
    let averageEfficiency: Double
    let utilizationRate: Double
}

struct EquipmentUtilizationSummary {
    let totalHours: Double
    let fuelCost: Double
    let maintenanceCost: Double
    let efficiency: Double
    let costPerHour: Double
    let recommendations: [String]
}

struct MaintenanceAlert: Identifiable {
    let id: UUID
    let equipment: Equipment
    let maintenanceType: String
    let severity: Severity
    let description: String
    let dueDate: Date
    let estimatedCost: Double
    
    enum Severity {
        case routine, preventive, warning, critical, major
        
        var color: Color {
            switch self {
            case .routine: return .blue
            case .preventive: return .yellow
            case .warning: return .orange
            case .critical: return .red
            case .major: return .purple
            }
        }
    }
}

struct MaintenanceSchedule {
    let type: String
    let dueAtHours: Double
    let severity: MaintenanceAlert.Severity
    let description: String
    let estimatedCost: Double
}

struct EquipmentCostAnalysis {
    let totalCost: Double
    let totalHours: Double
    let averageCostPerHour: Double
    let costByType: [String: Double]
    let utilizationTrends: [UtilizationTrend]
    let recommendations: [String]
}

struct UtilizationTrend {
    let period: Date
    let hours: Double
    let cost: Double
    let efficiency: Double
}

enum EquipmentError: Error, LocalizedError {
    case locationUnavailable
    case equipmentAlreadyActive
    case sessionNotFound
    case dataCorruption
    
    var errorDescription: String? {
        switch self {
        case .locationUnavailable:
            return "Location unavailable for equipment tracking"
        case .equipmentAlreadyActive:
            return "Equipment is already being tracked"
        case .sessionNotFound:
            return "Equipment tracking session not found"
        case .dataCorruption:
            return "Equipment tracking data corrupted"
        }
    }
}

// MARK: - Core Data Extensions

extension DataManager {
    func fetchEquipment() -> [Equipment] {
        let request: NSFetchRequest<Equipment> = Equipment.fetchRequest()
        request.predicate = NSPredicate(format: "isActive == YES")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Equipment.name, ascending: true)]
        
        do {
            return try context.fetch(request)
        } catch {
            print("❌ Error fetching equipment: \(error)")
            return []
        }
    }
}