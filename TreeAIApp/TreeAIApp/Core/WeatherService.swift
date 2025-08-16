import Foundation
import CoreLocation
import Combine

/// Real weather service for TreeAI productivity adjustments and safety monitoring
class WeatherService: ObservableObject {
    
    // MARK: - Published Properties
    @Published var currentWeather: WeatherConditions?
    @Published var weatherForecast: [WeatherForecast] = []
    @Published var productivityAdjustment: ProductivityAdjustment?
    @Published var weatherAlerts: [WeatherAlert] = []
    @Published var isLoading = false
    @Published var lastError: WeatherError?
    
    // MARK: - Private Properties
    private let apiKey: String
    private let session = URLSession.shared
    private let locationManager = LocationManager()
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Constants
    private let baseURL = "https://api.openweathermap.org/data/2.5"
    private let updateInterval: TimeInterval = 600 // Update every 10 minutes
    private var updateTimer: Timer?
    
    // MARK: - Initialization
    init(apiKey: String = "YOUR_OPENWEATHER_API_KEY") {
        self.apiKey = apiKey
        setupLocationUpdates()
        startPeriodicUpdates()
    }
    
    deinit {
        updateTimer?.invalidate()
    }
    
    private func setupLocationUpdates() {
        locationManager.$currentLocation
            .compactMap { $0 }
            .removeDuplicates { location1, location2 in
                // Only update if location changed significantly (>1km)
                let distance = CLLocation(latitude: location1.latitude, longitude: location1.longitude)
                    .distance(from: CLLocation(latitude: location2.latitude, longitude: location2.longitude))
                return distance < 1000
            }
            .sink { [weak self] location in
                Task {
                    await self?.fetchWeatherData(for: location)
                }
            }
            .store(in: &cancellables)
    }
    
    private func startPeriodicUpdates() {
        updateTimer = Timer.scheduledTimer(withTimeInterval: updateInterval, repeats: true) { [weak self] _ in
            guard let location = self?.locationManager.currentLocation else { return }
            Task {
                await self?.fetchWeatherData(for: location)
            }
        }
    }
    
    // MARK: - Weather Data Fetching
    
    /// Fetch current weather and forecast for location
    func fetchWeatherData(for location: CLLocationCoordinate2D) async {
        isLoading = true
        defer { 
            DispatchQueue.main.async {
                self.isLoading = false
            }
        }
        
        async let currentWeatherTask = fetchCurrentWeather(for: location)
        async let forecastTask = fetchWeatherForecast(for: location)
        async let alertsTask = fetchWeatherAlerts(for: location)
        
        do {
            let (current, forecast, alerts) = try await (currentWeatherTask, forecastTask, alertsTask)
            
            DispatchQueue.main.async {
                self.currentWeather = current
                self.weatherForecast = forecast
                self.weatherAlerts = alerts
                self.productivityAdjustment = self.calculateProductivityAdjustment(
                    current: current,
                    forecast: forecast
                )
                self.lastError = nil
            }
            
            print("🌤️ Weather data updated: \(current.condition)")
            
        } catch {
            DispatchQueue.main.async {
                self.lastError = error as? WeatherError ?? .networkError
            }
            print("❌ Weather update failed: \(error)")
        }
    }
    
    private func fetchCurrentWeather(for location: CLLocationCoordinate2D) async throws -> WeatherConditions {
        let url = URL(string: "\(baseURL)/weather?lat=\(location.latitude)&lon=\(location.longitude)&appid=\(apiKey)&units=imperial")!
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              200...299 ~= httpResponse.statusCode else {
            throw WeatherError.apiError
        }
        
        let weatherResponse = try JSONDecoder().decode(OpenWeatherResponse.self, from: data)
        return WeatherConditions(from: weatherResponse)
    }
    
    private func fetchWeatherForecast(for location: CLLocationCoordinate2D) async throws -> [WeatherForecast] {
        let url = URL(string: "\(baseURL)/forecast?lat=\(location.latitude)&lon=\(location.longitude)&appid=\(apiKey)&units=imperial")!
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              200...299 ~= httpResponse.statusCode else {
            throw WeatherError.apiError
        }
        
        let forecastResponse = try JSONDecoder().decode(OpenWeatherForecastResponse.self, from: data)
        return forecastResponse.list.map { WeatherForecast(from: $0) }
    }
    
    private func fetchWeatherAlerts(for location: CLLocationCoordinate2D) async throws -> [WeatherAlert] {
        // Note: Weather alerts require One Call API 3.0 subscription
        // For basic implementation, we'll check for severe weather in current conditions
        
        guard let current = currentWeather else { return [] }
        
        var alerts: [WeatherAlert] = []
        
        // Check for severe weather conditions
        if current.windSpeed > 25 {
            alerts.append(WeatherAlert(
                type: .wind,
                severity: .warning,
                title: "High Wind Warning",
                description: "Wind speeds of \(Int(current.windSpeed)) mph may affect tree work safety.",
                startTime: Date(),
                endTime: Date().addingTimeInterval(3600) // 1 hour
            ))
        }
        
        if current.precipitation > 0.1 {
            alerts.append(WeatherAlert(
                type: .precipitation,
                severity: .advisory,
                title: "Precipitation Advisory",
                description: "Rain may reduce work efficiency and create slippery conditions.",
                startTime: Date(),
                endTime: Date().addingTimeInterval(7200) // 2 hours
            ))
        }
        
        if current.temperature < 35 || current.temperature > 95 {
            let severity: WeatherAlert.Severity = current.temperature < 20 || current.temperature > 100 ? .warning : .advisory
            alerts.append(WeatherAlert(
                type: .temperature,
                severity: severity,
                title: "Extreme Temperature \(severity.rawValue.capitalized)",
                description: "Temperature of \(Int(current.temperature))°F may affect crew safety and productivity.",
                startTime: Date(),
                endTime: Date().addingTimeInterval(14400) // 4 hours
            ))
        }
        
        return alerts
    }
    
    // MARK: - Productivity Calculations
    
    /// Calculate productivity adjustment based on weather conditions
    private func calculateProductivityAdjustment(
        current: WeatherConditions,
        forecast: [WeatherForecast]
    ) -> ProductivityAdjustment {
        
        var adjustmentFactor: Double = 1.0
        var reasons: [String] = []
        
        // Temperature impact
        let tempAdjustment = calculateTemperatureAdjustment(current.temperature)
        adjustmentFactor *= tempAdjustment.factor
        if let reason = tempAdjustment.reason {
            reasons.append(reason)
        }
        
        // Wind impact
        let windAdjustment = calculateWindAdjustment(current.windSpeed)
        adjustmentFactor *= windAdjustment.factor
        if let reason = windAdjustment.reason {
            reasons.append(reason)
        }
        
        // Precipitation impact
        let precipAdjustment = calculatePrecipitationAdjustment(current.precipitation)
        adjustmentFactor *= precipAdjustment.factor
        if let reason = precipAdjustment.reason {
            reasons.append(reason)
        }
        
        // Visibility impact
        let visibilityAdjustment = calculateVisibilityAdjustment(current.visibility)
        adjustmentFactor *= visibilityAdjustment.factor
        if let reason = visibilityAdjustment.reason {
            reasons.append(reason)
        }
        
        // Heat index/wind chill impact
        let comfortAdjustment = calculateComfortAdjustment(current)
        adjustmentFactor *= comfortAdjustment.factor
        if let reason = comfortAdjustment.reason {
            reasons.append(reason)
        }
        
        // Florida-specific seasonal adjustments
        let seasonalAdjustment = calculateFloridaSeasonalAdjustment()
        adjustmentFactor *= seasonalAdjustment.factor
        if let reason = seasonalAdjustment.reason {
            reasons.append(reason)
        }
        
        return ProductivityAdjustment(
            factor: adjustmentFactor,
            percentage: (adjustmentFactor - 1.0) * 100,
            reasons: reasons,
            recommendation: getProductivityRecommendation(adjustmentFactor),
            severity: getAdjustmentSeverity(adjustmentFactor)
        )
    }
    
    private func calculateTemperatureAdjustment(_ temperature: Double) -> (factor: Double, reason: String?) {
        switch temperature {
        case ..<20:
            return (0.7, "Extreme cold reduces efficiency and safety")
        case 20..<35:
            return (0.85, "Cold weather slows work pace")
        case 35..<50:
            return (0.95, "Cool weather slightly reduces efficiency")
        case 50..<85:
            return (1.0, nil) // Optimal temperature range
        case 85..<95:
            return (0.9, "Hot weather requires more breaks")
        case 95..<105:
            return (0.75, "Very hot weather significantly reduces productivity")
        default:
            return (0.6, "Extreme heat creates dangerous working conditions")
        }
    }
    
    private func calculateWindAdjustment(_ windSpeed: Double) -> (factor: Double, reason: String?) {
        switch windSpeed {
        case 0..<10:
            return (1.0, nil) // Calm conditions
        case 10..<20:
            return (0.95, "Light wind may affect climbing operations")
        case 20..<35:
            return (0.8, "Strong wind creates safety hazards for tree work")
        default:
            return (0.5, "Dangerous wind conditions - consider postponing work")
        }
    }
    
    private func calculatePrecipitationAdjustment(_ precipitation: Double) -> (factor: Double, reason: String?) {
        switch precipitation {
        case 0:
            return (1.0, nil) // No precipitation
        case 0..<0.1:
            return (0.95, "Light precipitation may create slippery conditions")
        case 0.1..<0.5:
            return (0.8, "Moderate rain significantly reduces safety and efficiency")
        default:
            return (0.4, "Heavy rain makes tree work dangerous - consider stopping")
        }
    }
    
    private func calculateVisibilityAdjustment(_ visibility: Double) -> (factor: Double, reason: String?) {
        switch visibility {
        case 10...:
            return (1.0, nil) // Clear visibility
        case 5..<10:
            return (0.9, "Reduced visibility affects safety")
        case 1..<5:
            return (0.7, "Poor visibility creates significant safety risks")
        default:
            return (0.4, "Very poor visibility - work should be suspended")
        }
    }
    
    private func calculateComfortAdjustment(_ weather: WeatherConditions) -> (factor: Double, reason: String?) {
        // Calculate heat index for hot weather
        if weather.temperature > 80 {
            let heatIndex = calculateHeatIndex(temperature: weather.temperature, humidity: weather.humidity)
            switch heatIndex {
            case 90..<105:
                return (0.9, "High heat index requires additional hydration breaks")
            case 105..<130:
                return (0.75, "Dangerous heat index - frequent breaks required")
            case 130...:
                return (0.5, "Extreme heat index - consider postponing work")
            default:
                return (1.0, nil)
            }
        }
        
        // Calculate wind chill for cold weather
        if weather.temperature < 50 && weather.windSpeed > 5 {
            let windChill = calculateWindChill(temperature: weather.temperature, windSpeed: weather.windSpeed)
            switch windChill {
            case ..<20:
                return (0.8, "Wind chill requires additional cold weather gear")
            case ..<0:
                return (0.6, "Dangerous wind chill - limit exposure time")
            default:
                return (1.0, nil)
            }
        }
        
        return (1.0, nil)
    }
    
    private func calculateFloridaSeasonalAdjustment() -> (factor: Double, reason: String?) {
        let calendar = Calendar.current
        let month = calendar.component(.month, from: Date())
        
        switch month {
        case 6...11: // Hurricane season
            return (0.85, "Hurricane season may cause weather delays")
        case 12...2: // Dry season
            return (1.1, "Dry season provides optimal working conditions")
        default: // Spring
            return (1.0, nil)
        }
    }
    
    // MARK: - Weather Index Calculations
    
    private func calculateHeatIndex(temperature: Double, humidity: Double) -> Double {
        // Simplified heat index calculation
        let t = temperature
        let rh = humidity
        
        if t < 80 { return t }
        
        let hi = -42.379 + 2.04901523*t + 10.14333127*rh - 0.22475541*t*rh
                - 0.00683783*t*t - 0.05481717*rh*rh + 0.00122874*t*t*rh
                + 0.00085282*t*rh*rh - 0.00000199*t*t*rh*rh
        
        return hi
    }
    
    private func calculateWindChill(temperature: Double, windSpeed: Double) -> Double {
        // Wind chill calculation (NWS formula)
        if temperature > 50 || windSpeed < 3 { return temperature }
        
        let wc = 35.74 + 0.6215*temperature - 35.75*pow(windSpeed, 0.16) + 0.4275*temperature*pow(windSpeed, 0.16)
        return wc
    }
    
    // MARK: - Recommendations
    
    private func getProductivityRecommendation(_ factor: Double) -> String {
        switch factor {
        case 0.9...:
            return "Excellent conditions for tree work"
        case 0.8..<0.9:
            return "Good conditions with minor adjustments needed"
        case 0.7..<0.8:
            return "Moderate conditions - increase safety precautions"
        case 0.5..<0.7:
            return "Poor conditions - consider rescheduling non-urgent work"
        default:
            return "Dangerous conditions - suspend outdoor tree work"
        }
    }
    
    private func getAdjustmentSeverity(_ factor: Double) -> ProductivityAdjustment.Severity {
        switch factor {
        case 0.9...:
            return .minimal
        case 0.8..<0.9:
            return .moderate
        case 0.6..<0.8:
            return .significant
        default:
            return .severe
        }
    }
    
    // MARK: - Public Utility Methods
    
    /// Get weather impact for specific time period
    func getWeatherImpact(for date: Date) -> ProductivityAdjustment? {
        // Find forecast for the given date
        let targetForecast = weatherForecast.first { forecast in
            Calendar.current.isDate(forecast.date, inSameDayAs: date)
        }
        
        guard let forecast = targetForecast else { return productivityAdjustment }
        
        // Calculate adjustment for forecast conditions
        let forecastConditions = WeatherConditions(
            temperature: forecast.temperature,
            humidity: forecast.humidity,
            windSpeed: forecast.windSpeed,
            precipitation: forecast.precipitation,
            visibility: 10.0, // Default visibility for forecast
            condition: forecast.condition,
            timestamp: forecast.date
        )
        
        return calculateProductivityAdjustment(current: forecastConditions, forecast: weatherForecast)
    }
    
    /// Check if weather is suitable for tree work
    func isWeatherSuitableForWork() -> Bool {
        guard let adjustment = productivityAdjustment else { return false }
        return adjustment.factor >= 0.7 // 70% or better productivity
    }
    
    /// Get weather-adjusted labor cost
    func getWeatherAdjustedLaborCost(baseCost: Double) -> Double {
        guard let adjustment = productivityAdjustment else { return baseCost }
        
        // Inverse relationship: lower productivity = higher cost
        return baseCost / adjustment.factor
    }
}

// MARK: - Data Types

struct WeatherConditions {
    let temperature: Double // Fahrenheit
    let humidity: Double // Percentage
    let windSpeed: Double // mph
    let precipitation: Double // inches per hour
    let visibility: Double // miles
    let condition: String
    let timestamp: Date
    
    init(from response: OpenWeatherResponse) {
        self.temperature = response.main.temp
        self.humidity = response.main.humidity
        self.windSpeed = response.wind?.speed ?? 0
        self.precipitation = (response.rain?.oneHour ?? 0) + (response.snow?.oneHour ?? 0)
        self.visibility = (response.visibility ?? 10000) / 1609.34 // Convert meters to miles
        self.condition = response.weather.first?.main ?? "Unknown"
        self.timestamp = Date()
    }
    
    init(temperature: Double, humidity: Double, windSpeed: Double, precipitation: Double, visibility: Double, condition: String, timestamp: Date) {
        self.temperature = temperature
        self.humidity = humidity
        self.windSpeed = windSpeed
        self.precipitation = precipitation
        self.visibility = visibility
        self.condition = condition
        self.timestamp = timestamp
    }
}

struct WeatherForecast {
    let date: Date
    let temperature: Double
    let humidity: Double
    let windSpeed: Double
    let precipitation: Double
    let condition: String
    
    init(from item: ForecastItem) {
        self.date = Date(timeIntervalSince1970: item.dt)
        self.temperature = item.main.temp
        self.humidity = item.main.humidity
        self.windSpeed = item.wind?.speed ?? 0
        self.precipitation = (item.rain?.threeHour ?? 0) + (item.snow?.threeHour ?? 0)
        self.condition = item.weather.first?.main ?? "Unknown"
    }
}

struct ProductivityAdjustment {
    let factor: Double // 0.0 to 1.0+ multiplier
    let percentage: Double // Percentage change
    let reasons: [String]
    let recommendation: String
    let severity: Severity
    
    enum Severity {
        case minimal, moderate, significant, severe
        
        var color: String {
            switch self {
            case .minimal: return "green"
            case .moderate: return "yellow"
            case .significant: return "orange"
            case .severe: return "red"
            }
        }
    }
}

struct WeatherAlert {
    let type: AlertType
    let severity: Severity
    let title: String
    let description: String
    let startTime: Date
    let endTime: Date
    
    enum AlertType {
        case wind, precipitation, temperature, visibility, severe
    }
    
    enum Severity: String {
        case advisory, watch, warning, emergency
    }
}

enum WeatherError: Error, LocalizedError {
    case apiError
    case networkError
    case invalidApiKey
    case locationUnavailable
    
    var errorDescription: String? {
        switch self {
        case .apiError:
            return "Weather API error"
        case .networkError:
            return "Network connection error"
        case .invalidApiKey:
            return "Invalid weather API key"
        case .locationUnavailable:
            return "Location unavailable for weather data"
        }
    }
}

// MARK: - OpenWeather API Response Types

struct OpenWeatherResponse: Codable {
    let main: MainWeather
    let weather: [WeatherDescription]
    let wind: Wind?
    let rain: Precipitation?
    let snow: Precipitation?
    let visibility: Int?
}

struct MainWeather: Codable {
    let temp: Double
    let humidity: Double
}

struct WeatherDescription: Codable {
    let main: String
    let description: String
}

struct Wind: Codable {
    let speed: Double
}

struct Precipitation: Codable {
    let oneHour: Double?
    let threeHour: Double?
    
    enum CodingKeys: String, CodingKey {
        case oneHour = "1h"
        case threeHour = "3h"
    }
}

struct OpenWeatherForecastResponse: Codable {
    let list: [ForecastItem]
}

struct ForecastItem: Codable {
    let dt: TimeInterval
    let main: MainWeather
    let weather: [WeatherDescription]
    let wind: Wind?
    let rain: Precipitation?
    let snow: Precipitation?
}