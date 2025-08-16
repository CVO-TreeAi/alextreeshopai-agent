import Foundation
import CoreLocation
import Combine
import SwiftUI
import UserNotifications

/// Real safety monitoring system for TreeAI field operations
class RealSafetyMonitor: ObservableObject {
    
    // MARK: - Published Properties
    @Published var currentRiskLevel: RiskLevel = .low
    @Published var activeSafetyAlerts: [SafetyAlert] = []
    @Published var safetyChecklist: SafetyChecklist?
    @Published var emergencyContacts: [EmergencyContact] = []
    @Published var isMonitoringActive = false
    @Published var lastSafetyCheck: Date?
    @Published var weatherRisks: [WeatherRisk] = []
    @Published var equipmentSafetyStatus: [EquipmentSafetyStatus] = []
    @Published var crewSafetyMetrics: CrewSafetyMetrics?
    
    // MARK: - Dependencies
    private let locationManager = LocationManager()
    private let weatherService = WeatherService()
    private let equipmentManager = EquipmentTrackingManager()
    private let agentServices = RealTreeAIAgentServices()
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Monitoring Configuration
    private let monitoringInterval: TimeInterval = 30 // Check every 30 seconds
    private let emergencyThreshold: Double = 8.0 // Risk score 8+ triggers emergency
    private let mandatoryCheckInterval: TimeInterval = 3600 // Mandatory check every hour
    
    private var monitoringTimer: Timer?
    private var lastEmergencyAlert: Date?
    
    // MARK: - Initialization
    init() {
        setupEmergencyContacts()
        setupNotifications()
        startSafetyMonitoring()
        requestNotificationPermissions()
    }
    
    deinit {
        stopSafetyMonitoring()
    }
    
    private func setupEmergencyContacts() {
        emergencyContacts = [
            EmergencyContact(name: "911 Emergency", phone: "911", type: .emergency),
            EmergencyContact(name: "Poison Control", phone: "1-800-222-1222", type: .poison),
            EmergencyContact(name: "TreeAI Safety Line", phone: "1-800-TREEAI", type: .company),
            EmergencyContact(name: "OSHA Hotline", phone: "1-800-321-6742", type: .regulatory)
        ]
    }
    
    private func setupNotifications() {
        // Monitor weather changes
        weatherService.$currentWeather
            .compactMap { $0 }
            .sink { [weak self] weather in
                self?.assessWeatherRisks(weather: weather)
            }
            .store(in: &cancellables)
        
        // Monitor equipment alerts
        equipmentManager.$maintenanceAlerts
            .sink { [weak self] alerts in
                self?.assessEquipmentSafety(alerts: alerts)
            }
            .store(in: &cancellables)
        
        // Monitor location changes for geofencing
        locationManager.$currentLocation
            .compactMap { $0 }
            .sink { [weak self] location in
                self?.checkLocationSafety(location: location)
            }
            .store(in: &cancellables)
    }
    
    private func requestNotificationPermissions() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("✅ Notification permissions granted for safety alerts")
            } else {
                print("❌ Notification permissions denied")
            }
        }
    }
    
    // MARK: - Safety Monitoring
    
    func startSafetyMonitoring() {
        isMonitoringActive = true
        
        monitoringTimer = Timer.scheduledTimer(withTimeInterval: monitoringInterval, repeats: true) { [weak self] _ in
            Task {
                await self?.performSafetyCheck()
            }
        }
        
        print("🦺 Safety monitoring started")
    }
    
    func stopSafetyMonitoring() {
        isMonitoringActive = false
        monitoringTimer?.invalidate()
        monitoringTimer = nil
        print("🛑 Safety monitoring stopped")
    }
    
    /// Perform comprehensive safety assessment
    private func performSafetyCheck() async {
        lastSafetyCheck = Date()
        
        var riskFactors: [RiskFactor] = []
        
        // Environmental risk assessment
        if let weather = weatherService.currentWeather {
            riskFactors.append(contentsOf: assessWeatherRisks(weather: weather))
        }
        
        // Equipment safety assessment
        riskFactors.append(contentsOf: assessEquipmentRisks())
        
        // Location-based risks
        if let location = locationManager.currentLocation {
            riskFactors.append(contentsOf: assessLocationRisks(location: location))
        }
        
        // Crew-specific risks
        riskFactors.append(contentsOf: assessCrewRisks())
        
        // Calculate overall risk level
        let overallRisk = calculateOverallRisk(factors: riskFactors)
        
        DispatchQueue.main.async {
            self.currentRiskLevel = overallRisk.level
            self.updateSafetyAlerts(riskFactors: riskFactors)
            
            if overallRisk.score >= self.emergencyThreshold {
                self.triggerEmergencyProtocol(riskScore: overallRisk.score, factors: riskFactors)
            }
        }
        
        // Send to safety agent for analysis
        do {
            let _ = try await performAgentSafetyAssessment(riskFactors: riskFactors)
        } catch {
            print("❌ Agent safety assessment failed: \(error)")
        }
    }
    
    // MARK: - Risk Assessment Methods
    
    @discardableResult
    private func assessWeatherRisks(weather: WeatherConditions) -> [RiskFactor] {
        var risks: [RiskFactor] = []
        
        // Wind risk
        if weather.windSpeed > 35 {
            risks.append(RiskFactor(
                type: .weather,
                severity: .critical,
                description: "Dangerous wind speeds: \(Int(weather.windSpeed)) mph",
                score: 9.0,
                mitigation: "Suspend all tree work immediately"
            ))
        } else if weather.windSpeed > 25 {
            risks.append(RiskFactor(
                type: .weather,
                severity: .high,
                description: "High wind speeds: \(Int(weather.windSpeed)) mph",
                score: 7.0,
                mitigation: "Avoid climbing operations, use extreme caution"
            ))
        } else if weather.windSpeed > 15 {
            risks.append(RiskFactor(
                type: .weather,
                severity: .medium,
                description: "Moderate wind speeds: \(Int(weather.windSpeed)) mph",
                score: 4.0,
                mitigation: "Extra caution for climbers, secure all equipment"
            ))
        }
        
        // Precipitation risk
        if weather.precipitation > 0.1 {
            risks.append(RiskFactor(
                type: .weather,
                severity: .high,
                description: "Active precipitation creating slippery conditions",
                score: 7.5,
                mitigation: "Consider postponing work, use non-slip equipment"
            ))
        }
        
        // Temperature extremes
        if weather.temperature > 100 {
            risks.append(RiskFactor(
                type: .weather,
                severity: .high,
                description: "Extreme heat: \(Int(weather.temperature))°F",
                score: 8.0,
                mitigation: "Frequent hydration breaks, watch for heat exhaustion"
            ))
        } else if weather.temperature < 20 {
            risks.append(RiskFactor(
                type: .weather,
                severity: .high,
                description: "Extreme cold: \(Int(weather.temperature))°F",
                score: 7.0,
                mitigation: "Cold weather gear required, watch for hypothermia"
            ))
        }
        
        // Lightning risk
        if weather.condition.lowercased().contains("storm") || weather.condition.lowercased().contains("thunder") {
            risks.append(RiskFactor(
                type: .weather,
                severity: .critical,
                description: "Lightning risk present",
                score: 10.0,
                mitigation: "Evacuate elevated positions immediately"
            ))
        }
        
        DispatchQueue.main.async {
            self.weatherRisks = risks.map { WeatherRisk(from: $0) }
        }
        
        return risks
    }
    
    private func assessEquipmentRisks() -> [RiskFactor] {
        var risks: [RiskFactor] = []
        
        // Check maintenance alerts
        for alert in equipmentManager.maintenanceAlerts {
            let severity: RiskFactor.Severity
            let score: Double
            
            switch alert.severity {
            case .critical:
                severity = .critical
                score = 9.0
            case .warning:
                severity = .high
                score = 7.0
            case .preventive:
                severity = .medium
                score = 4.0
            default:
                severity = .low
                score = 2.0
            }
            
            risks.append(RiskFactor(
                type: .equipment,
                severity: severity,
                description: "\(alert.equipment.name): \(alert.description)",
                score: score,
                mitigation: "Address maintenance issue before continued use"
            ))
        }
        
        // Check active equipment sessions for anomalies
        for session in equipmentManager.activeEquipment {
            if let reading = session.currentReading {
                // Temperature overheating
                if reading.temperature > 220 {
                    risks.append(RiskFactor(
                        type: .equipment,
                        severity: .high,
                        description: "\(session.equipment.name) overheating: \(Int(reading.temperature))°F",
                        score: 7.5,
                        mitigation: "Stop operation and allow equipment to cool"
                    ))
                }
                
                // Low fuel level
                if reading.fuelLevel < 0.1 {
                    risks.append(RiskFactor(
                        type: .equipment,
                        severity: .medium,
                        description: "\(session.equipment.name) low fuel: \(Int(reading.fuelLevel * 100))%",
                        score: 3.0,
                        mitigation: "Refuel equipment to prevent operational interruption"
                    ))
                }
                
                // Abnormal RPM
                let expectedRPM = getExpectedRPM(for: session.equipment)
                if abs(reading.engineRPM - expectedRPM) > expectedRPM * 0.3 {
                    risks.append(RiskFactor(
                        type: .equipment,
                        severity: .medium,
                        description: "\(session.equipment.name) abnormal engine RPM",
                        score: 5.0,
                        mitigation: "Check engine condition, may require service"
                    ))
                }
            }
        }
        
        return risks
    }
    
    private func assessLocationRisks(location: CLLocationCoordinate2D) -> [RiskFactor] {
        var risks: [RiskFactor] = []
        
        // Check for proximity to power lines (this would use a database of power line locations)
        if isPowerLineProximity(location: location) {
            risks.append(RiskFactor(
                type: .location,
                severity: .critical,
                description: "Power lines detected in work area",
                score: 9.5,
                mitigation: "Maintain 10-foot clearance, contact utility company"
            ))
        }
        
        // Check for traffic hazards
        if isHighTrafficArea(location: location) {
            risks.append(RiskFactor(
                type: .location,
                severity: .high,
                description: "High traffic area detected",
                score: 6.0,
                mitigation: "Set up traffic control, use high-visibility gear"
            ))
        }
        
        // Check for residential proximity
        if isResidentialProximity(location: location) {
            risks.append(RiskFactor(
                type: .location,
                severity: .medium,
                description: "Residential structures nearby",
                score: 4.0,
                mitigation: "Extra caution for falling debris, notify residents"
            ))
        }
        
        return risks
    }
    
    private func assessCrewRisks() -> [RiskFactor] {
        var risks: [RiskFactor] = []
        
        // Check for required certifications
        let activeTimeEntries = DataManager.shared.fetchActiveTimeEntries()
        let activeCrew = activeTimeEntries.compactMap { $0.employee }
        
        for employee in activeCrew {
            // Check certification validity
            if !hasValidCertifications(employee: employee) {
                risks.append(RiskFactor(
                    type: .personnel,
                    severity: .high,
                    description: "\(employee.name) missing required certifications",
                    score: 7.0,
                    mitigation: "Verify certifications before allowing tree work"
                ))
            }
            
            // Check experience level for task complexity
            if isInexperiencedForTask(employee: employee) {
                risks.append(RiskFactor(
                    type: .personnel,
                    severity: .medium,
                    description: "\(employee.name) may need supervision for current task",
                    score: 4.5,
                    mitigation: "Assign experienced crew member for supervision"
                ))
            }
        }
        
        // Check crew size adequacy
        if activeCrew.count < 2 {
            risks.append(RiskFactor(
                type: .personnel,
                severity: .high,
                description: "Insufficient crew size for safe tree operations",
                score: 8.0,
                mitigation: "Minimum 2-person crew required for safety"
            ))
        }
        
        return risks
    }
    
    // MARK: - Risk Calculation
    
    private func calculateOverallRisk(factors: [RiskFactor]) -> (level: RiskLevel, score: Double) {
        guard !factors.isEmpty else { return (.low, 0) }
        
        // Calculate weighted risk score
        let totalScore = factors.reduce(0) { $0 + $1.score }
        let averageScore = totalScore / Double(factors.count)
        
        // Apply severity multipliers
        let criticalCount = factors.filter { $0.severity == .critical }.count
        let highCount = factors.filter { $0.severity == .high }.count
        
        var adjustedScore = averageScore
        
        // Critical risks have exponential impact
        if criticalCount > 0 {
            adjustedScore = min(10.0, averageScore + Double(criticalCount) * 2.0)
        } else if highCount > 2 {
            adjustedScore = min(10.0, averageScore + 1.5)
        }
        
        let level: RiskLevel
        switch adjustedScore {
        case 0..<3:
            level = .low
        case 3..<6:
            level = .medium
        case 6..<8:
            level = .high
        default:
            level = .critical
        }
        
        return (level, adjustedScore)
    }
    
    // MARK: - Alert Management
    
    private func updateSafetyAlerts(riskFactors: [RiskFactor]) {
        var newAlerts: [SafetyAlert] = []
        
        for factor in riskFactors {
            let alert = SafetyAlert(
                id: UUID(),
                type: factor.type,
                severity: factor.severity,
                title: factor.type.displayName + " Risk",
                description: factor.description,
                mitigation: factor.mitigation,
                timestamp: Date(),
                riskScore: factor.score
            )
            newAlerts.append(alert)
        }
        
        // Remove resolved alerts and add new ones
        activeSafetyAlerts = newAlerts
        
        // Send critical alerts as push notifications
        for alert in newAlerts.filter({ $0.severity == .critical }) {
            sendEmergencyNotification(alert: alert)
        }
    }
    
    private func triggerEmergencyProtocol(riskScore: Double, factors: [RiskFactor]) {
        // Prevent spam notifications
        if let lastAlert = lastEmergencyAlert,
           Date().timeIntervalSince(lastAlert) < 300 { // 5 minutes
            return
        }
        
        lastEmergencyAlert = Date()
        
        let emergencyAlert = SafetyAlert(
            id: UUID(),
            type: .emergency,
            severity: .critical,
            title: "EMERGENCY: Critical Safety Risk",
            description: "Multiple high-risk factors detected. Risk Score: \(String(format: "%.1f", riskScore))",
            mitigation: "Stop all operations immediately and assess safety",
            timestamp: Date(),
            riskScore: riskScore
        )
        
        activeSafetyAlerts.insert(emergencyAlert, at: 0)
        
        // Send emergency notification
        sendEmergencyNotification(alert: emergencyAlert)
        
        // Log emergency in Core Data
        // This would create an incident report
        
        print("🚨 EMERGENCY PROTOCOL TRIGGERED - Risk Score: \(riskScore)")
    }
    
    private func sendEmergencyNotification(alert: SafetyAlert) {
        let content = UNMutableNotificationContent()
        content.title = alert.title
        content.body = alert.description
        content.sound = .default
        content.categoryIdentifier = "SAFETY_ALERT"
        
        let request = UNNotificationRequest(
            identifier: alert.id.uuidString,
            content: content,
            trigger: nil // Immediate
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send safety notification: \(error)")
            }
        }
    }
    
    // MARK: - Agent Integration
    
    private func performAgentSafetyAssessment(riskFactors: [RiskFactor]) async throws -> SafetyAssessmentResponse {
        guard let location = locationManager.currentLocation else {
            throw SafetyError.locationUnavailable
        }
        
        let workSite = WorkSiteData(
            location: TreeAILocation(
                latitude: location.latitude,
                longitude: location.longitude,
                address: nil,
                accessibility: .moderate,
                terrain: .flat,
                hazards: riskFactors.map { $0.description }
            ),
            hazards: riskFactors.map { $0.description },
            accessibility: "Moderate",
            powerLines: riskFactors.contains { $0.type == .location && $0.description.contains("power") },
            structures: []
        )
        
        let crew = CrewData(
            members: DataManager.shared.fetchActiveTimeEntries().compactMap { entry in
                guard let employee = entry.employee else { return nil }
                return CrewMemberData(
                    id: employee.id.uuidString,
                    name: employee.name,
                    position: employee.position ?? "Unknown",
                    certifications: employee.certifications,
                    experienceYears: Calendar.current.dateComponents([.year], from: employee.hireDate, to: Date()).year ?? 0
                )
            },
            certifications: [],
            experience: "Mixed"
        )
        
        let weather = WeatherData(
            temperature: weatherService.currentWeather?.temperature ?? 70,
            windSpeed: weatherService.currentWeather?.windSpeed ?? 0,
            precipitation: weatherService.currentWeather?.precipitation ?? 0,
            visibility: weatherService.currentWeather?.visibility ?? 10,
            conditions: weatherService.currentWeather?.condition ?? "Clear"
        )
        
        return try await agentServices.performSafetyAssessment(
            workSite: workSite,
            crew: crew,
            equipment: equipmentManager.activeEquipment.map { $0.equipment.name },
            weather: weather
        )
    }
    
    // MARK: - Utility Methods
    
    private func hasValidCertifications(employee: Employee) -> Bool {
        // Check if employee has required certifications for their position
        let position = EmployeePosition(rawValue: employee.position ?? "") ?? .groundCrew
        
        switch position {
        case .certifiedArborist:
            return employee.certifications.contains("ISA Certified Arborist")
        case .treeClimber:
            return employee.certifications.contains("Tree Climbing Safety") || employee.certifications.contains("ISA Tree Climbing Specialist")
        case .equipmentOperator:
            return employee.certifications.contains("Equipment Operation Safety")
        default:
            return true // Ground crew doesn't require special certifications
        }
    }
    
    private func isInexperiencedForTask(employee: Employee) -> Bool {
        let experience = Calendar.current.dateComponents([.year], from: employee.hireDate, to: Date()).year ?? 0
        let position = EmployeePosition(rawValue: employee.position ?? "") ?? .groundCrew
        
        switch position {
        case .certifiedArborist:
            return experience < 3 // Requires 3+ years experience
        case .treeClimber:
            return experience < 2 // Requires 2+ years experience
        case .crewLeader:
            return experience < 5 // Requires 5+ years experience
        default:
            return false
        }
    }
    
    private func isPowerLineProximity(location: CLLocationCoordinate2D) -> Bool {
        // In a real implementation, this would check against a power line database
        // For now, we'll use a simplified heuristic
        return false // Would implement actual power line detection
    }
    
    private func isHighTrafficArea(location: CLLocationCoordinate2D) -> Bool {
        // In a real implementation, this would check traffic data
        return false // Would implement actual traffic detection
    }
    
    private func isResidentialProximity(location: CLLocationCoordinate2D) -> Bool {
        // In a real implementation, this would check land use data
        return true // Assume residential proximity for safety
    }
    
    private func getExpectedRPM(for equipment: Equipment) -> Double {
        switch EquipmentType(rawValue: equipment.type) {
        case .chainsaw: return 5000
        case .chipper: return 2000
        case .stumpGrinder: return 2000
        case .aerialLift: return 1500
        case .truck: return 2000
        default: return 1500
        }
    }
    
    // MARK: - Public Interface
    
    /// Manually trigger safety check
    func performManualSafetyCheck() {
        Task {
            await performSafetyCheck()
        }
    }
    
    /// Acknowledge safety alert
    func acknowledgeSafetyAlert(_ alert: SafetyAlert) {
        if let index = activeSafetyAlerts.firstIndex(where: { $0.id == alert.id }) {
            activeSafetyAlerts.remove(at: index)
        }
    }
    
    /// Get safety checklist for current conditions
    func generateSafetyChecklist() {
        var items: [SafetyChecklistItem] = []
        
        // Weather-based items
        if let weather = weatherService.currentWeather {
            if weather.windSpeed > 15 {
                items.append(SafetyChecklistItem(
                    category: .weather,
                    description: "Verify wind speed monitoring equipment",
                    isRequired: true,
                    isCompleted: false
                ))
            }
            
            if weather.temperature > 85 {
                items.append(SafetyChecklistItem(
                    category: .ppe,
                    description: "Verify hydration supplies and heat protection",
                    isRequired: true,
                    isCompleted: false
                ))
            }
        }
        
        // Equipment-based items
        for equipment in equipmentManager.activeEquipment {
            items.append(SafetyChecklistItem(
                category: .equipment,
                description: "Inspect \(equipment.equipment.name) before operation",
                isRequired: true,
                isCompleted: false
            ))
        }
        
        // Personnel-based items
        items.append(SafetyChecklistItem(
            category: .personnel,
            description: "Verify all crew members have required PPE",
            isRequired: true,
            isCompleted: false
        ))
        
        items.append(SafetyChecklistItem(
            category: .communication,
            description: "Test emergency communication equipment",
            isRequired: true,
            isCompleted: false
        ))
        
        safetyChecklist = SafetyChecklist(
            id: UUID(),
            items: items,
            createdDate: Date(),
            isCompleted: false
        )
    }
}

// MARK: - Data Types

enum RiskLevel: String, CaseIterable {
    case low = "Low"
    case medium = "Medium"
    case high = "High"
    case critical = "Critical"
    
    var color: Color {
        switch self {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .orange
        case .critical: return .red
        }
    }
    
    var description: String {
        switch self {
        case .low: return "Normal operations, standard precautions"
        case .medium: return "Increased caution required"
        case .high: return "Significant risks present, extra precautions needed"
        case .critical: return "Dangerous conditions, consider stopping operations"
        }
    }
}

struct RiskFactor {
    let type: RiskType
    let severity: Severity
    let description: String
    let score: Double // 0-10 scale
    let mitigation: String
    
    enum RiskType {
        case weather, equipment, location, personnel, emergency
        
        var displayName: String {
            switch self {
            case .weather: return "Weather"
            case .equipment: return "Equipment"
            case .location: return "Location"
            case .personnel: return "Personnel"
            case .emergency: return "Emergency"
            }
        }
    }
    
    enum Severity {
        case low, medium, high, critical
    }
}

struct SafetyAlert: Identifiable {
    let id: UUID
    let type: RiskFactor.RiskType
    let severity: RiskFactor.Severity
    let title: String
    let description: String
    let mitigation: String
    let timestamp: Date
    let riskScore: Double
}

struct WeatherRisk {
    let description: String
    let score: Double
    let mitigation: String
    
    init(from riskFactor: RiskFactor) {
        self.description = riskFactor.description
        self.score = riskFactor.score
        self.mitigation = riskFactor.mitigation
    }
}

struct EquipmentSafetyStatus {
    let equipment: Equipment
    let status: Status
    let lastCheck: Date
    let issues: [String]
    
    enum Status {
        case safe, warning, danger
    }
}

struct CrewSafetyMetrics {
    let totalCrewMembers: Int
    let certifiedMembers: Int
    let averageExperience: Double
    let safetyScore: Double
}

struct EmergencyContact {
    let name: String
    let phone: String
    let type: ContactType
    
    enum ContactType {
        case emergency, medical, poison, company, regulatory
    }
}

struct SafetyChecklist: Identifiable {
    let id: UUID
    var items: [SafetyChecklistItem]
    let createdDate: Date
    var isCompleted: Bool
    
    var completionPercentage: Double {
        guard !items.isEmpty else { return 0 }
        let completedCount = items.filter { $0.isCompleted }.count
        return Double(completedCount) / Double(items.count) * 100
    }
}

struct SafetyChecklistItem {
    let category: Category
    let description: String
    let isRequired: Bool
    var isCompleted: Bool
    
    enum Category {
        case weather, equipment, ppe, personnel, communication, location
    }
}

enum SafetyError: Error, LocalizedError {
    case locationUnavailable
    case monitoringInactive
    case emergencyProtocolActive
    
    var errorDescription: String? {
        switch self {
        case .locationUnavailable:
            return "Location unavailable for safety assessment"
        case .monitoringInactive:
            return "Safety monitoring is not active"
        case .emergencyProtocolActive:
            return "Emergency protocol is currently active"
        }
    }
}