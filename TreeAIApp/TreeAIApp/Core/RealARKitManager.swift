import ARKit
import RealityKit
import SwiftUI
import Combine
import Photos
import CoreLocation
import AVFoundation

/// Real ARKit manager with LiDAR measurements and photo capture for TreeAI field assessments
class RealARKitManager: NSObject, ObservableObject {
    
    // MARK: - Published Properties
    @Published var isARAvailable = false
    @Published var isSessionRunning = false
    @Published var arConfiguration: ARConfiguration?
    @Published var trackingState: ARCamera.TrackingState = .notAvailable
    @Published var currentMeasurement: TreeMeasurement?
    @Published var measurementHistory: [TreeMeasurement] = []
    @Published var sessionError: ARError?
    @Published var capturedImages: [CapturedImage] = []
    
    // Measurement state
    @Published var measurementMode: MeasurementMode = .height
    @Published var isPlacingPoints = false
    @Published var placedAnchors: [ARAnchor] = []
    @Published var measurementInProgress = false
    
    // MARK: - Private Properties
    private var arView: ARView?
    private var session: ARSession?
    private let locationManager = LocationManager()
    private let treeScoreCalculator = RealTreeScoreCalculator()
    
    // Measurement data
    private var measurementStartPoint: SIMD3<Float>?
    private var measurementEndPoint: SIMD3<Float>?
    private var heightMeasurement: Float?
    private var dbhMeasurement: Float?
    private var crownMeasurements: [Float] = []
    
    // Photo capture
    private var photoOutput: AVCapturePhotoOutput?
    
    // MARK: - Measurement Modes
    enum MeasurementMode: String, CaseIterable {
        case height = "Height"
        case dbh = "DBH"
        case crown = "Crown"
        case fullScan = "Full Scan"
        
        var icon: String {
            switch self {
            case .height: return "ruler.fill"
            case .dbh: return "circle.dashed"
            case .crown: return "circle.dotted"
            case .fullScan: return "scanner.fill"
            }
        }
        
        var instruction: String {
            switch self {
            case .height:
                return "Point at the base of the tree, then at the top"
            case .dbh:
                return "Point at two sides of the trunk at chest height (4.5 feet)"
            case .crown:
                return "Point at the edge of the crown in multiple directions"
            case .fullScan:
                return "Move around the tree to capture all measurements"
            }
        }
    }
    
    // MARK: - Initialization
    override init() {
        super.init()
        checkARAvailability()
        setupSession()
    }
    
    private func checkARAvailability() {
        isARAvailable = ARWorldTrackingConfiguration.isSupported
        
        if !isARAvailable {
            sessionError = ARError(.unsupportedConfiguration)
        }
        
        print("📱 AR Support: \(isARAvailable ? "✅ Available" : "❌ Not Available")")
        print("📡 LiDAR Support: \(ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) ? "✅" : "❌")")
    }
    
    private func setupSession() {
        guard isARAvailable else { return }
        
        session = ARSession()
        session?.delegate = self
        
        // Create AR view
        arView = ARView(frame: .zero)
        arView?.session = session
        arView?.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(handleTap(_:))))
        
        print("🎯 AR Session initialized")
    }
    
    // MARK: - Session Management
    
    func startARSession() {
        guard let session = session, isARAvailable else {
            sessionError = ARError(.unsupportedConfiguration)
            return
        }
        
        let configuration = ARWorldTrackingConfiguration()
        
        // Enable plane detection for ground reference
        configuration.planeDetection = [.horizontal, .vertical]
        
        // Enable LiDAR if available
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            configuration.sceneReconstruction = .mesh
            print("✅ LiDAR scene reconstruction enabled")
        }
        
        // Enable frame semantics for better understanding
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentation) {
            configuration.frameSemantics.insert(.personSegmentation)
        }
        
        // Run session
        session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
        
        DispatchQueue.main.async {
            self.isSessionRunning = true
            self.arConfiguration = configuration
            self.placedAnchors.removeAll()
        }
        
        print("🚀 AR Session started with LiDAR support")
    }
    
    func pauseARSession() {
        session?.pause()
        
        DispatchQueue.main.async {
            self.isSessionRunning = false
        }
        
        print("⏸️ AR Session paused")
    }
    
    func stopARSession() {
        session?.pause()
        
        DispatchQueue.main.async {
            self.isSessionRunning = false
            self.placedAnchors.removeAll()
            self.resetMeasurement()
        }
        
        print("🛑 AR Session stopped")
    }
    
    // MARK: - Measurement Methods
    
    func startMeasurement(mode: MeasurementMode) {
        measurementMode = mode
        isPlacingPoints = true
        measurementInProgress = true
        resetMeasurement()
        
        print("📏 Started \(mode.rawValue) measurement")
    }
    
    private func resetMeasurement() {
        measurementStartPoint = nil
        measurementEndPoint = nil
        crownMeasurements.removeAll()
        
        // Remove measurement anchors from AR scene
        placedAnchors.forEach { anchor in
            session?.remove(anchor: anchor)
        }
        placedAnchors.removeAll()
    }
    
    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        guard let arView = arView,
              isPlacingPoints,
              let frame = session?.currentFrame else { return }
        
        let location = gesture.location(in: arView)
        
        // Perform raycast to find world position
        let raycastQuery = arView.raycast(from: location, allowing: .estimatedPlane, alignment: .any)
        
        if let raycastResult = raycastQuery.first {
            handleMeasurementPoint(raycastResult.worldTransform)
        } else {
            // Fallback to hit test for devices without LiDAR
            let hitTestResults = arView.hitTest(location, types: [.existingPlaneUsingExtent, .estimatedHorizontalPlane])
            if let hitResult = hitTestResults.first {
                handleMeasurementPoint(hitResult.worldTransform)
            }
        }
    }
    
    private func handleMeasurementPoint(_ transform: simd_float4x4) {
        let position = SIMD3<Float>(transform.columns.3.x, transform.columns.3.y, transform.columns.3.z)
        
        // Add anchor for visualization
        let anchor = ARAnchor(transform: transform)
        session?.add(anchor: anchor)
        placedAnchors.append(anchor)
        
        switch measurementMode {
        case .height:
            handleHeightMeasurement(position: position)
        case .dbh:
            handleDBHMeasurement(position: position)
        case .crown:
            handleCrownMeasurement(position: position)
        case .fullScan:
            handleFullScanMeasurement(position: position)
        }
    }
    
    private func handleHeightMeasurement(position: SIMD3<Float>) {
        if measurementStartPoint == nil {
            measurementStartPoint = position
            print("📍 Height measurement start point placed at ground level")
        } else {
            measurementEndPoint = position
            calculateHeightMeasurement()
        }
    }
    
    private func handleDBHMeasurement(position: SIMD3<Float>) {
        if measurementStartPoint == nil {
            measurementStartPoint = position
            print("📍 DBH measurement first point placed")
        } else {
            measurementEndPoint = position
            calculateDBHMeasurement()
        }
    }
    
    private func handleCrownMeasurement(position: SIMD3<Float>) {
        // For crown measurement, we collect multiple points
        if crownMeasurements.count < 8 { // Collect up to 8 points around crown
            if let startPoint = measurementStartPoint {
                let distance = distance(startPoint, position)
                crownMeasurements.append(distance)
                print("📍 Crown measurement point \(crownMeasurements.count): \(distance)m")
            } else {
                // First point is the center reference
                measurementStartPoint = position
                print("📍 Crown center reference point placed")
            }
            
            if crownMeasurements.count >= 4 { // Minimum 4 measurements for crown
                calculateCrownMeasurement()
            }
        }
    }
    
    private func handleFullScanMeasurement(position: SIMD3<Float>) {
        // Full scan combines all measurement types
        // This would be implemented as a guided workflow
        print("📍 Full scan point recorded")
    }
    
    // MARK: - Measurement Calculations
    
    private func calculateHeightMeasurement() {
        guard let start = measurementStartPoint,
              let end = measurementEndPoint else { return }
        
        // Calculate vertical distance (height)
        heightMeasurement = abs(end.y - start.y)
        
        let heightInFeet = Double(heightMeasurement!) * 3.28084 // Convert to feet
        
        print("📏 Tree height: \(String(format: "%.1f", heightInFeet)) feet")
        
        finalizeMeasurement(value: heightInFeet, type: .height, unit: "feet")
    }
    
    private func calculateDBHMeasurement() {
        guard let start = measurementStartPoint,
              let end = measurementEndPoint else { return }
        
        // Calculate horizontal distance (diameter)
        let horizontalDistance = sqrt(pow(end.x - start.x, 2) + pow(end.z - start.z, 2))
        dbhMeasurement = horizontalDistance
        
        let dbhInInches = Double(horizontalDistance) * 39.3701 // Convert to inches
        
        print("📏 Tree DBH: \(String(format: "%.1f", dbhInInches)) inches")
        
        finalizeMeasurement(value: dbhInInches, type: .dbh, unit: "inches")
    }
    
    private func calculateCrownMeasurement() {
        guard !crownMeasurements.isEmpty else { return }
        
        // Calculate average crown radius from multiple measurements
        let averageRadius = crownMeasurements.reduce(0, +) / Float(crownMeasurements.count)
        let radiusInFeet = Double(averageRadius) * 3.28084 // Convert to feet
        
        print("📏 Crown radius: \(String(format: "%.1f", radiusInFeet)) feet")
        
        finalizeMeasurement(value: radiusInFeet, type: .crownRadius, unit: "feet")
    }
    
    private func finalizeMeasurement(value: Double, type: MeasurementType, unit: String) {
        let measurement = TreeMeasurement(
            id: UUID(),
            timestamp: Date(),
            type: type,
            value: value,
            unit: unit,
            accuracy: calculateMeasurementAccuracy(),
            location: locationManager.currentLocation,
            arConfiguration: arConfiguration?.description ?? "Unknown"
        )
        
        DispatchQueue.main.async {
            self.currentMeasurement = measurement
            self.measurementHistory.append(measurement)
            self.isPlacingPoints = false
            self.measurementInProgress = false
        }
        
        print("✅ Measurement completed: \(value) \(unit)")
    }
    
    private func calculateMeasurementAccuracy() -> Double {
        // Calculate accuracy based on tracking state and LiDAR availability
        switch trackingState {
        case .normal:
            if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
                return 0.95 // High accuracy with LiDAR
            } else {
                return 0.85 // Good accuracy without LiDAR
            }
        case .limited:
            return 0.70 // Limited accuracy
        case .notAvailable:
            return 0.50 // Poor accuracy
        }
    }
    
    // MARK: - Photo Capture
    
    func capturePhoto() {
        guard let frame = session?.currentFrame else { return }
        
        // Capture the camera frame
        let image = UIImage(pixelBuffer: frame.capturedImage)
        
        // Get current location
        let location = locationManager.currentLocation
        
        let capturedImage = CapturedImage(
            id: UUID(),
            image: image,
            timestamp: Date(),
            location: location,
            cameraTransform: frame.camera.transform,
            measurements: measurementHistory.suffix(3).map { $0 } // Include recent measurements
        )
        
        DispatchQueue.main.async {
            self.capturedImages.append(capturedImage)
        }
        
        // Save to photo library
        saveToPhotoLibrary(image: image)
        
        print("📸 Photo captured with AR data")
    }
    
    private func saveToPhotoLibrary(image: UIImage) {
        PHPhotoLibrary.requestAuthorization { status in
            guard status == .authorized else { return }
            
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }) { success, error in
                if success {
                    print("✅ Photo saved to library")
                } else if let error = error {
                    print("❌ Failed to save photo: \(error.localizedDescription)")
                }
            }
        }
    }
    
    // MARK: - TreeScore Integration
    
    func calculateTreeScoreFromMeasurements() async -> TreeScoreCalculation? {
        // Extract measurements
        let heightMeasurements = measurementHistory.filter { $0.type == .height }
        let dbhMeasurements = measurementHistory.filter { $0.type == .dbh }
        let crownMeasurements = measurementHistory.filter { $0.type == .crownRadius }
        
        guard let height = heightMeasurements.last?.value,
              let dbh = dbhMeasurements.last?.value,
              let crownRadius = crownMeasurements.last?.value else {
            print("❌ Insufficient measurements for TreeScore calculation")
            return nil
        }
        
        // Use default values for missing data
        let calculation = await treeScoreCalculator.calculateTreeScore(
            height: height,
            dbh: dbh,
            crownRadius: crownRadius,
            species: .mixed,
            condition: .good,
            location: TreeLocation(
                accessDifficulty: .moderate,
                hasPowerLines: false,
                nearStructures: false,
                terrainType: .flat
            ),
            crew: .standard2Person,
            equipment: [.chainsaw, .truck]
        )
        
        print("🌳 TreeScore calculated: \(calculation.treeScore)")
        return calculation
    }
    
    // MARK: - Utility Methods
    
    private func distance(_ point1: SIMD3<Float>, _ point2: SIMD3<Float>) -> Float {
        let dx = point1.x - point2.x
        let dy = point1.y - point2.y
        let dz = point1.z - point2.z
        return sqrt(dx*dx + dy*dy + dz*dz)
    }
    
    func getMeasurementSummary() -> String {
        let heights = measurementHistory.filter { $0.type == .height }
        let dbhs = measurementHistory.filter { $0.type == .dbh }
        let crowns = measurementHistory.filter { $0.type == .crownRadius }
        
        var summary = "Measurements Summary:\n"
        
        if let height = heights.last {
            summary += "Height: \(String(format: "%.1f", height.value)) \(height.unit)\n"
        }
        
        if let dbh = dbhs.last {
            summary += "DBH: \(String(format: "%.1f", dbh.value)) \(dbh.unit)\n"
        }
        
        if let crown = crowns.last {
            summary += "Crown Radius: \(String(format: "%.1f", crown.value)) \(crown.unit)\n"
        }
        
        return summary
    }
}

// MARK: - ARSessionDelegate
extension RealARKitManager: ARSessionDelegate {
    
    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        DispatchQueue.main.async {
            self.trackingState = frame.camera.trackingState
        }
    }
    
    func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        print("🎯 AR anchors added: \(anchors.count)")
    }
    
    func session(_ session: ARSession, didFailWithError error: Error) {
        DispatchQueue.main.async {
            self.sessionError = error as? ARError
        }
        print("❌ AR session error: \(error.localizedDescription)")
    }
    
    func sessionWasInterrupted(_ session: ARSession) {
        DispatchQueue.main.async {
            self.isSessionRunning = false
        }
        print("⚠️ AR session interrupted")
    }
    
    func sessionInterruptionEnded(_ session: ARSession) {
        print("✅ AR session interruption ended")
    }
}

// MARK: - Supporting Types

struct TreeMeasurement: Identifiable {
    let id: UUID
    let timestamp: Date
    let type: MeasurementType
    let value: Double
    let unit: String
    let accuracy: Double
    let location: CLLocationCoordinate2D?
    let arConfiguration: String
    
    var formattedValue: String {
        return String(format: "%.1f %@", value, unit)
    }
    
    var accuracyPercentage: String {
        return String(format: "%.0f%%", accuracy * 100)
    }
}

struct CapturedImage: Identifiable {
    let id: UUID
    let image: UIImage
    let timestamp: Date
    let location: CLLocationCoordinate2D?
    let cameraTransform: simd_float4x4
    let measurements: [TreeMeasurement]
}

// MARK: - UIImage Extension for PixelBuffer
extension UIImage {
    convenience init?(pixelBuffer: CVPixelBuffer) {
        var cgImage: CGImage?
        VTCreateCGImageFromCVPixelBuffer(pixelBuffer, options: nil, imageOut: &cgImage)
        
        guard let image = cgImage else { return nil }
        
        self.init(cgImage: image)
    }
}

// MARK: - ARView SwiftUI Wrapper
struct ARViewContainer: UIViewRepresentable {
    @ObservedObject var arManager: RealARKitManager
    
    func makeUIView(context: Context) -> ARView {
        guard let arView = arManager.arView else {
            return ARView(frame: .zero)
        }
        return arView
    }
    
    func updateUIView(_ uiView: ARView, context: Context) {
        // Update AR view if needed
    }
}

// MARK: - AR Measurement View
struct ARMeasurementInterfaceView: View {
    @ObservedObject var arManager: RealARKitManager
    @State private var showingMeasurementPicker = false
    
    var body: some View {
        ZStack {
            // AR View
            ARViewContainer(arManager: arManager)
                .edgesIgnoringSafeArea(.all)
            
            // Measurement UI Overlay
            VStack {
                // Top Controls
                HStack {
                    Button("Stop AR") {
                        arManager.stopARSession()
                    }
                    .padding()
                    .background(Color.black.opacity(0.7))
                    .foregroundColor(.white)
                    .cornerRadius(8)
                    
                    Spacer()
                    
                    Button(action: { arManager.capturePhoto() }) {
                        Image(systemName: "camera.fill")
                            .font(.title2)
                            .padding()
                            .background(Color.black.opacity(0.7))
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
                .padding()
                
                Spacer()
                
                // Measurement Instructions
                if arManager.isPlacingPoints {
                    VStack {
                        Text(arManager.measurementMode.instruction)
                            .font(.headline)
                            .multilineTextAlignment(.center)
                            .padding()
                            .background(Color.black.opacity(0.8))
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        
                        if arManager.measurementMode == .crown && !arManager.crownMeasurements.isEmpty {
                            Text("Crown points: \(arManager.crownMeasurements.count)/8")
                                .font(.caption)
                                .padding(.horizontal)
                                .background(Color.black.opacity(0.7))
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                    }
                    .padding()
                }
                
                // Bottom Controls
                HStack(spacing: 20) {
                    ForEach(RealARKitManager.MeasurementMode.allCases, id: \.self) { mode in
                        Button(action: {
                            arManager.startMeasurement(mode: mode)
                        }) {
                            VStack {
                                Image(systemName: mode.icon)
                                    .font(.title2)
                                Text(mode.rawValue)
                                    .font(.caption)
                            }
                            .padding()
                            .background(arManager.measurementMode == mode ? Color.blue : Color.black.opacity(0.7))
                            .foregroundColor(.white)
                            .cornerRadius(8)
                        }
                    }
                }
                .padding()
            }
            
            // Measurement Results Overlay
            if let measurement = arManager.currentMeasurement {
                VStack {
                    Spacer()
                    
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("✅ \(measurement.type.displayName)")
                                .font(.headline)
                            Spacer()
                            Text(measurement.accuracyPercentage)
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                        
                        Text(measurement.formattedValue)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Button("Calculate TreeScore") {
                            Task {
                                _ = await arManager.calculateTreeScoreFromMeasurements()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                    .background(Color.black.opacity(0.8))
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .padding()
                }
            }
        }
        .onAppear {
            arManager.startARSession()
        }
    }
}