import SwiftUI

/// Comprehensive TreeScore display card with breakdown
struct TreeScoreDisplayCard: View {
    let score: Int
    let measurements: [(String, Double, String)]
    let riskFactors: [RiskFactor]
    
    var body: some View {
        VStack(spacing: 20) {
            // Main score display
            TreeScoreBadge(score: score, compact: false)
            
            // Score breakdown sections
            VStack(spacing: 16) {
                MeasurementBreakdownSection(measurements: measurements)
                
                if !riskFactors.isEmpty {
                    RiskFactorBreakdownSection(riskFactors: riskFactors)
                }
                
                ScoreInterpretationSection(score: score)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 4)
    }
}

/// Main TreeScore badge with animated display
struct TreeScoreBadge: View {
    let score: Int
    let compact: Bool
    @State private var animatedScore: Double = 0
    
    var scoreColor: Color {
        switch score {
        case 800...:
            return .green
        case 600..<800:
            return .blue
        case 400..<600:
            return .orange
        case 200..<400:
            return .red
        default:
            return .gray
        }
    }
    
    var scoreGrade: String {
        switch score {
        case 800...:
            return "A"
        case 600..<800:
            return "B"
        case 400..<600:
            return "C"
        case 200..<400:
            return "D"
        default:
            return "F"
        }
    }
    
    var body: some View {
        if compact {
            compactView
        } else {
            fullView
        }
    }
    
    private var compactView: some View {
        HStack(spacing: 8) {
            Text("\(Int(animatedScore))")
                .font(.headline.weight(.bold))
                .foregroundColor(scoreColor)
            
            Text("TreeScore")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .onAppear {
            animateScore()
        }
    }
    
    private var fullView: some View {
        VStack(spacing: 12) {
            ZStack {
                // Background circle
                Circle()
                    .stroke(scoreColor.opacity(0.2), lineWidth: 12)
                    .frame(width: 120, height: 120)
                
                // Progress circle
                Circle()
                    .trim(from: 0, to: min(animatedScore / 1000, 1.0))
                    .stroke(
                        AngularGradient(
                            gradient: Gradient(colors: [scoreColor.opacity(0.3), scoreColor]),
                            center: .center,
                            startAngle: .degrees(-90),
                            endAngle: .degrees(270)
                        ),
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .frame(width: 120, height: 120)
                    .rotationEffect(.degrees(-90))
                
                VStack(spacing: 4) {
                    Text("\(Int(animatedScore))")
                        .font(.largeTitle.weight(.bold))
                        .foregroundColor(scoreColor)
                    
                    Text("Grade \(scoreGrade)")
                        .font(.headline.weight(.semibold))
                        .foregroundColor(.secondary)
                }
            }
            
            Text("TreeScore")
                .font(.title2.weight(.semibold))
                .foregroundColor(.primary)
        }
        .onAppear {
            animateScore()
        }
    }
    
    private func animateScore() {
        withAnimation(.easeOut(duration: 1.5)) {
            animatedScore = Double(score)
        }
    }
}

/// Circular progress view for smaller displays
struct CircularProgressView: View {
    let progress: Float
    let size: CGFloat
    let lineWidth: CGFloat
    
    init(progress: Float, size: CGFloat, lineWidth: CGFloat = 8) {
        self.progress = progress
        self.size = size
        self.lineWidth = lineWidth
    }
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.gray.opacity(0.3), lineWidth: lineWidth)
                .frame(width: size, height: size)
            
            Circle()
                .trim(from: 0, to: CGFloat(progress))
                .stroke(Color.blue, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .frame(width: size, height: size)
                .rotationEffect(.degrees(-90))
            
            Text("\(Int(progress * 100))%")
                .font(.caption.weight(.semibold))
                .foregroundColor(.primary)
        }
    }
}

/// Measurement breakdown section
struct MeasurementBreakdownSection: View {
    let measurements: [(String, Double, String)]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Measurements")
                .font(.headline.weight(.semibold))
                .foregroundColor(.primary)
            
            VStack(spacing: 8) {
                ForEach(Array(measurements.enumerated()), id: \.offset) { index, measurement in
                    MeasurementRow(
                        name: measurement.0,
                        value: measurement.1,
                        unit: measurement.2
                    )
                    
                    if index < measurements.count - 1 {
                        Divider()
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }
}

/// Individual measurement row
struct MeasurementRow: View {
    let name: String
    let value: Double
    let unit: String
    
    var body: some View {
        HStack {
            Text(name)
                .font(.subheadline)
                .foregroundColor(.primary)
            
            Spacer()
            
            Text(String(format: "%.1f %@", value, unit))
                .font(.subheadline.weight(.semibold))
                .foregroundColor(.secondary)
        }
    }
}

/// Risk factor breakdown section
struct RiskFactorBreakdownSection: View {
    let riskFactors: [RiskFactor]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Risk Factors")
                .font(.headline.weight(.semibold))
                .foregroundColor(.primary)
            
            VStack(spacing: 8) {
                ForEach(riskFactors) { riskFactor in
                    RiskFactorRow(riskFactor: riskFactor)
                }
            }
        }
    }
}

/// Individual risk factor row
struct RiskFactorRow: View {
    let riskFactor: RiskFactor
    
    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(riskFactor.severity.color)
                .font(.caption)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(riskFactor.type)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.primary)
                
                Text(riskFactor.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text(riskFactor.severity.displayName)
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(riskFactor.severity.color.opacity(0.2))
                .foregroundColor(riskFactor.severity.color)
                .cornerRadius(6)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(riskFactor.severity.color.opacity(0.3), lineWidth: 1)
        )
    }
}

/// Score interpretation section
struct ScoreInterpretationSection: View {
    let score: Int
    
    var interpretation: (title: String, description: String, color: Color) {
        switch score {
        case 800...:
            return (
                "Excellent Condition",
                "Tree is in excellent health with minimal risk factors. Routine maintenance recommended.",
                .green
            )
        case 600..<800:
            return (
                "Good Condition",
                "Tree is in good health. Monitor for changes and perform regular maintenance.",
                .blue
            )
        case 400..<600:
            return (
                "Fair Condition",
                "Tree requires attention. Professional assessment and treatment recommended.",
                .orange
            )
        case 200..<400:
            return (
                "Poor Condition",
                "Tree may pose risks. Immediate professional evaluation required.",
                .red
            )
        default:
            return (
                "Critical Condition",
                "Tree poses significant risks. Immediate removal or intervention necessary.",
                .red
            )
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Assessment")
                .font(.headline.weight(.semibold))
                .foregroundColor(.primary)
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "info.circle.fill")
                        .foregroundColor(interpretation.color)
                    
                    Text(interpretation.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(interpretation.color)
                }
                
                Text(interpretation.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding()
            .background(interpretation.color.opacity(0.1))
            .cornerRadius(12)
        }
    }
}

/// TreeScore comparison chart
struct TreeScoreComparisonChart: View {
    let scores: [TreeScoreComparison]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Score Comparison")
                .font(.headline.weight(.semibold))
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                ForEach(scores) { comparison in
                    TreeScoreComparisonBar(comparison: comparison)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

/// Individual score comparison bar
struct TreeScoreComparisonBar: View {
    let comparison: TreeScoreComparison
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(comparison.label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text("\(comparison.score)")
                    .font(.subheadline.weight(.bold))
                    .foregroundColor(comparison.color)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                        .cornerRadius(4)
                    
                    Rectangle()
                        .fill(comparison.color)
                        .frame(
                            width: geometry.size.width * CGFloat(comparison.score) / 1000,
                            height: 8
                        )
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)
        }
    }
}

/// Assessment summary card for completion view
struct AssessmentSummaryCard: View {
    @EnvironmentObject var workflowManager: AssessmentWorkflowManager
    
    var body: some View {
        VStack(spacing: 16) {
            // TreeScore display
            TreeScoreBadge(score: workflowManager.formData.treeScore, compact: false)
            
            // Quick stats
            HStack(spacing: 20) {
                StatItem(
                    title: "Height",
                    value: String(format: "%.1f ft", workflowManager.formData.height),
                    icon: "ruler.fill"
                )
                
                StatItem(
                    title: "DBH",
                    value: String(format: "%.1f in", workflowManager.formData.dbh),
                    icon: "circle.dashed"
                )
                
                StatItem(
                    title: "Risks",
                    value: "\(workflowManager.formData.riskFactors.count)",
                    icon: "exclamationmark.triangle.fill"
                )
            }
            
            // Customer info
            VStack(alignment: .leading, spacing: 4) {
                Text("Assessment Details")
                    .font(.headline.weight(.semibold))
                
                Text("Customer: \(workflowManager.formData.customerName)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text("Property: \(workflowManager.formData.propertyAddress)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if !workflowManager.formData.treeSpecies.isEmpty {
                    Text("Species: \(workflowManager.formData.treeSpecies)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 4)
    }
}

/// Individual stat item
struct StatItem: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
            
            Text(value)
                .font(.headline.weight(.bold))
                .foregroundColor(.primary)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Supporting Types

struct TreeScoreComparison: Identifiable {
    let id = UUID()
    let label: String
    let score: Int
    let color: Color
}

#Preview {
    ScrollView {
        VStack(spacing: 20) {
            TreeScoreDisplayCard(
                score: 750,
                measurements: [
                    ("Height", 45.5, "ft"),
                    ("DBH", 24.2, "in"),
                    ("Crown Radius", 18.5, "ft")
                ],
                riskFactors: [
                    RiskFactor(type: "Power Lines", severity: .high, description: "Within 15 feet of power lines"),
                    RiskFactor(type: "Dead Branches", severity: .medium, description: "Some deadwood present")
                ]
            )
            
            TreeScoreComparisonChart(scores: [
                TreeScoreComparison(label: "Current Tree", score: 750, color: .blue),
                TreeScoreComparison(label: "Property Average", score: 650, color: .green),
                TreeScoreComparison(label: "Regional Average", score: 700, color: .orange)
            ])
        }
        .padding()
    }
}