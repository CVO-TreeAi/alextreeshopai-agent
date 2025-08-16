import Foundation
import CoreLocation
import Combine
import SwiftUI

/// Real GPS location manager for TreeAI time tracking and productivity monitoring
class LocationManager: NSObject, ObservableObject {
    
    // MARK: - Published Properties
    @Published var currentLocation: CLLocationCoordinate2D?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isLocationServicesEnabled = false
    @Published var accuracy: CLLocationAccuracy = 0
    @Published var lastLocationUpdate: Date?
    @Published var locationError: LocationError?
    
    // MARK: - Private Properties
    private let locationManager = CLLocationManager()
    private let dataManager = DataManager.shared
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Constants
    private let desiredAccuracy: CLLocationAccuracy = 10.0 // 10 meters accuracy for job sites
    private let distanceFilter: CLLocationDistance = 5.0 // Update every 5 meters
    
    // MARK: - Initialization
    override init() {
        super.init()
        setupLocationManager()
    }
    
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = distanceFilter
        
        authorizationStatus = locationManager.authorizationStatus
        isLocationServicesEnabled = CLLocationManager.locationServicesEnabled()
    }
    
    // MARK: - Location Permissions
    func requestLocationPermission() {
        switch authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            locationError = .permissionDenied
        case .authorizedWhenInUse:
            locationManager.requestAlwaysAuthorization()
        case .authorizedAlways:
            startLocationUpdates()
        @unknown default:
            locationError = .unknown
        }
    }
    
    // MARK: - Location Updates
    func startLocationUpdates() {
        guard authorizationStatus == .authorizedAlways || authorizationStatus == .authorizedWhenInUse else {
            locationError = .permissionDenied
            return
        }
        
        guard CLLocationManager.locationServicesEnabled() else {
            locationError = .locationServicesDisabled
            return
        }
        
        locationManager.startUpdatingLocation()
        print("🌍 Started GPS location updates for time tracking")
    }
    
    func stopLocationUpdates() {
        locationManager.stopUpdatingLocation()
        print("🛑 Stopped GPS location updates")
    }
    
    // MARK: - Time Tracking Integration
    
    /// Clock in employee at current location
    func clockInEmployee(_ employee: Employee, project: Project) -> TimeEntry? {
        guard let location = currentLocation else {
            locationError = .locationUnavailable
            return nil
        }
        
        // Verify employee is at job site (within 100 meters of project address if available)
        if let projectLocation = getProjectLocation(for: project) {
            let distance = calculateDistance(from: location, to: projectLocation)
            if distance > 100 { // 100 meter geofence
                locationError = .notAtJobSite(distance: distance)
                return nil
            }
        }
        
        let timeEntry = dataManager.clockIn(
            employee: employee,
            project: project,
            location: location
        )
        
        print("⏰ Clocked in \(employee.name) at \(formatCoordinate(location))")
        return timeEntry
    }
    
    /// Clock out employee at current location
    func clockOutEmployee(timeEntry: TimeEntry) -> Bool {
        guard let location = currentLocation else {
            locationError = .locationUnavailable
            return false
        }
        
        dataManager.clockOut(timeEntry: timeEntry, location: location)
        print("⏰ Clocked out at \(formatCoordinate(location))")
        return true
    }
    
    /// Get current location for equipment tracking
    func getCurrentLocationForEquipment() -> CLLocationCoordinate2D? {
        return currentLocation
    }
    
    // MARK: - Productivity Tracking
    
    /// Calculate travel time between two locations
    func calculateTravelTime(from start: CLLocationCoordinate2D, to end: CLLocationCoordinate2D) -> TimeInterval {
        let distance = calculateDistance(from: start, to: end)
        
        // Estimate travel time based on distance (assuming 25 mph average with traffic)
        let speedMph: Double = 25
        let speedMeterPerSecond = speedMph * 0.44704
        
        return distance / speedMeterPerSecond
    }
    
    /// Track productivity by monitoring location changes during work
    func trackProductivityForTimeEntry(_ timeEntry: TimeEntry) {
        // Monitor if worker stays at job site during work hours
        // This could be expanded to track movement patterns for efficiency analysis
        guard let currentLoc = currentLocation,
              let projectLoc = getProjectLocationFromTimeEntry(timeEntry) else { return }
        
        let distance = calculateDistance(from: currentLoc, to: projectLoc)
        
        if distance > 200 { // 200 meter radius for large job sites
            // Worker may have left job site - could affect billable time
            print("⚠️ Worker may have left job site. Distance: \(Int(distance))m")
        }
    }
    
    // MARK: - Location Utilities
    
    private func calculateDistance(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> CLLocationDistance {
        let fromLocation = CLLocation(latitude: from.latitude, longitude: from.longitude)
        let toLocation = CLLocation(latitude: to.latitude, longitude: to.longitude)
        return fromLocation.distance(from: toLocation)
    }
    
    private func formatCoordinate(_ coordinate: CLLocationCoordinate2D) -> String {
        return String(format: "%.6f, %.6f", coordinate.latitude, coordinate.longitude)
    }
    
    /// Get project location from address (would integrate with geocoding service)
    private func getProjectLocation(for project: Project) -> CLLocationCoordinate2D? {
        // In a real implementation, this would geocode the project address
        // For now, return nil to skip geofencing
        return nil
    }
    
    private func getProjectLocationFromTimeEntry(_ timeEntry: TimeEntry) -> CLLocationCoordinate2D? {
        // Get the clock-in location as reference point for the job site
        return CLLocationCoordinate2D(latitude: timeEntry.latitude, longitude: timeEntry.longitude)
    }
    
    // MARK: - Weather Integration Support
    
    /// Get current location for weather data fetching
    func getCurrentLocationForWeather() -> CLLocationCoordinate2D? {
        return currentLocation
    }
    
    /// Get coordinates for weather impact on productivity
    func getLocationForWeatherAdjustment() -> (latitude: Double, longitude: Double)? {
        guard let location = currentLocation else { return nil }
        return (location.latitude, location.longitude)
    }
}

// MARK: - CLLocationManagerDelegate
extension LocationManager: CLLocationManagerDelegate {
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        DispatchQueue.main.async {
            self.currentLocation = location.coordinate
            self.accuracy = location.horizontalAccuracy
            self.lastLocationUpdate = Date()
            self.locationError = nil
        }
        
        print("📍 Location updated: \(formatCoordinate(location.coordinate)) (±\(Int(location.horizontalAccuracy))m)")
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        DispatchQueue.main.async {
            if let clError = error as? CLError {
                switch clError.code {
                case .denied:
                    self.locationError = .permissionDenied
                case .locationUnknown:
                    self.locationError = .locationUnavailable
                case .network:
                    self.locationError = .networkError
                default:
                    self.locationError = .unknown
                }
            } else {
                self.locationError = .unknown
            }
        }
        
        print("❌ Location error: \(error.localizedDescription)")
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        DispatchQueue.main.async {
            self.authorizationStatus = status
        }
        
        switch status {
        case .notDetermined:
            print("📍 Location permission not determined")
        case .denied, .restricted:
            print("❌ Location permission denied/restricted")
            DispatchQueue.main.async {
                self.locationError = .permissionDenied
            }
        case .authorizedWhenInUse:
            print("✅ Location permission granted (when in use)")
            startLocationUpdates()
        case .authorizedAlways:
            print("✅ Location permission granted (always)")
            startLocationUpdates()
        @unknown default:
            print("❓ Unknown location authorization status")
        }
    }
}

// MARK: - Location Errors
enum LocationError: Error, LocalizedError {
    case permissionDenied
    case locationServicesDisabled
    case locationUnavailable
    case networkError
    case notAtJobSite(distance: Double)
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .permissionDenied:
            return "Location permission denied. Please enable location access in Settings."
        case .locationServicesDisabled:
            return "Location services are disabled. Please enable them in Settings."
        case .locationUnavailable:
            return "Current location is not available. Please try again."
        case .networkError:
            return "Network error while getting location. Check your connection."
        case .notAtJobSite(let distance):
            return "You are \(Int(distance))m away from the job site. Move closer to clock in."
        case .unknown:
            return "An unknown location error occurred."
        }
    }
    
    var recoverysuggestion: String? {
        switch self {
        case .permissionDenied, .locationServicesDisabled:
            return "Go to Settings > Privacy & Security > Location Services and enable location access for TreeAI."
        case .locationUnavailable:
            return "Make sure you're outdoors with a clear view of the sky."
        case .networkError:
            return "Check your internet connection and try again."
        case .notAtJobSite:
            return "Move closer to the job site location to clock in."
        case .unknown:
            return "Restart the app and try again."
        }
    }
}

// MARK: - Time Tracking UI Components

/// SwiftUI view for GPS-based time tracking
struct GPSTimeTrackingView: View {
    @StateObject private var locationManager = LocationManager()
    @EnvironmentObject private var dataManager: DataManager
    @State private var selectedEmployee: Employee?
    @State private var selectedProject: Project?
    @State private var showingClockInSheet = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var employees: [Employee] {
        dataManager.fetchEmployees()
    }
    
    var projects: [Project] {
        dataManager.fetchProjects().filter { $0.status == ProjectStatus.inProgress.rawValue }
    }
    
    var activeTimeEntries: [TimeEntry] {
        dataManager.fetchActiveTimeEntries()
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Location Status
                LocationStatusCard(locationManager: locationManager)
                
                // Active Time Entries
                if !activeTimeEntries.isEmpty {
                    ActiveTimeEntriesSection(
                        timeEntries: activeTimeEntries,
                        locationManager: locationManager,
                        onClockOut: handleClockOut
                    )
                }
                
                // Clock In Section
                ClockInSection(
                    employees: employees,
                    projects: projects,
                    selectedEmployee: $selectedEmployee,
                    selectedProject: $selectedProject,
                    onClockIn: handleClockIn
                )
                
                Spacer()
            }
            .padding()
            .navigationTitle("Time Tracking")
            .alert("Location Error", isPresented: $showingAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
            .onAppear {
                locationManager.requestLocationPermission()
            }
            .onChange(of: locationManager.locationError) { error in
                if let error = error {
                    alertMessage = error.localizedDescription
                    showingAlert = true
                }
            }
        }
    }
    
    private func handleClockIn() {
        guard let employee = selectedEmployee,
              let project = selectedProject else {
            alertMessage = "Please select both an employee and project."
            showingAlert = true
            return
        }
        
        if let timeEntry = locationManager.clockInEmployee(employee, project: project) {
            selectedEmployee = nil
            selectedProject = nil
            print("✅ Successfully clocked in \(employee.name)")
        } else if let error = locationManager.locationError {
            alertMessage = error.localizedDescription
            showingAlert = true
        }
    }
    
    private func handleClockOut(timeEntry: TimeEntry) {
        if locationManager.clockOutEmployee(timeEntry: timeEntry) {
            print("✅ Successfully clocked out")
        } else if let error = locationManager.locationError {
            alertMessage = error.localizedDescription
            showingAlert = true
        }
    }
}

// MARK: - Supporting Views

struct LocationStatusCard: View {
    @ObservedObject var locationManager: LocationManager
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "location.fill")
                    .foregroundColor(locationManager.currentLocation != nil ? .green : .red)
                Text("GPS Status")
                    .font(.headline)
                Spacer()
                if let location = locationManager.currentLocation {
                    Text("±\(Int(locationManager.accuracy))m")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            if let location = locationManager.currentLocation {
                Text("📍 \(String(format: "%.6f, %.6f", location.latitude, location.longitude))")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if let lastUpdate = locationManager.lastLocationUpdate {
                    Text("Updated: \(lastUpdate, style: .relative) ago")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            } else {
                Text("Location unavailable")
                    .foregroundColor(.red)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ActiveTimeEntriesSection: View {
    let timeEntries: [TimeEntry]
    let locationManager: LocationManager
    let onClockOut: (TimeEntry) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Active Time Entries")
                .font(.headline)
            
            ForEach(timeEntries, id: \.id) { timeEntry in
                ActiveTimeEntryCard(
                    timeEntry: timeEntry,
                    onClockOut: { onClockOut(timeEntry) }
                )
            }
        }
    }
}

struct ActiveTimeEntryCard: View {
    let timeEntry: TimeEntry
    let onClockOut: () -> Void
    
    @State private var elapsedTime: TimeInterval = 0
    @State private var timer: Timer?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading) {
                    Text(timeEntry.employee?.name ?? "Unknown Employee")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    Text(timeEntry.project?.name ?? "Unknown Project")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing) {
                    Text(formatElapsedTime(elapsedTime))
                        .font(.headline)
                        .fontWeight(.bold)
                    if let clockIn = timeEntry.clockIn {
                        Text("Started: \(clockIn, style: .time)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Button(action: onClockOut) {
                HStack {
                    Image(systemName: "clock.badge.xmark.fill")
                    Text("Clock Out")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .onAppear {
            startTimer()
        }
        .onDisappear {
            timer?.invalidate()
        }
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            if let clockIn = timeEntry.clockIn {
                elapsedTime = Date().timeIntervalSince(clockIn)
            }
        }
    }
    
    private func formatElapsedTime(_ interval: TimeInterval) -> String {
        let hours = Int(interval) / 3600
        let minutes = Int(interval) % 3600 / 60
        let seconds = Int(interval) % 60
        return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
    }
}

struct ClockInSection: View {
    let employees: [Employee]
    let projects: [Project]
    @Binding var selectedEmployee: Employee?
    @Binding var selectedProject: Project?
    let onClockIn: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Clock In")
                .font(.headline)
            
            VStack(spacing: 12) {
                // Employee Selection
                Menu {
                    ForEach(employees, id: \.id) { employee in
                        Button(employee.name) {
                            selectedEmployee = employee
                        }
                    }
                } label: {
                    HStack {
                        Text(selectedEmployee?.name ?? "Select Employee")
                            .foregroundColor(selectedEmployee != nil ? .primary : .secondary)
                        Spacer()
                        Image(systemName: "chevron.down")
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
                
                // Project Selection
                Menu {
                    ForEach(projects, id: \.id) { project in
                        Button(project.name) {
                            selectedProject = project
                        }
                    }
                } label: {
                    HStack {
                        Text(selectedProject?.name ?? "Select Project")
                            .foregroundColor(selectedProject != nil ? .primary : .secondary)
                        Spacer()
                        Image(systemName: "chevron.down")
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
                
                // Clock In Button
                Button(action: onClockIn) {
                    HStack {
                        Image(systemName: "clock.badge.checkmark.fill")
                        Text("Clock In")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
                .buttonStyle(.borderedProminent)
                .disabled(selectedEmployee == nil || selectedProject == nil)
            }
        }
    }
}