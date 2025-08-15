# StumpScore Calculation Specification

## Core StumpScore Formula
```
StumpScore = (Height + Grind_Depth) × Diameter
```

## Measurement Requirements

### 1. Diameter Measurement
- **Standing Tree**: Use DBH (Diameter at Breast Height - 4.5 feet)
- **Cut Stump**: Use stump diameter at ground level
- **Accuracy Required**: Within 0.5 inches (ideal), 1 inch maximum tolerance
- **AR Implementation**: Visual overlay with crosshairs for precise edge detection

### 2. Height Measurement  
- **Standing Tree**: Full tree height measurement (existing AR tool capability)
- **Cut Stump**: Measure remaining stump height above ground
- **Height Threshold**: When tree is cut to under 3 feet, switch to stump mode
- **Accuracy Required**: Within 0.5 inches (ideal), 1 inch maximum tolerance

### 3. Grind Depth
- **Default Setting**: 8 inches below ground level
- **User Configurable**: Business user can adjust depth per job
- **Typical Range**: 6-12 inches (industry standard)
- **Special Cases**: Deeper grinding for replanting areas

## AR Measurement Implementation

### Visual Interface Requirements
```
AR Overlay Elements:
├── Diameter Crosshairs
│   ├── Horizontal line across stump/trunk
│   ├── Real-time measurement display
│   └── Accuracy indicator (green/yellow/red)
├── Height Measurement
│   ├── Base point marker
│   ├── Top point marker  
│   └── Vertical measurement line
└── Grind Depth Indicator
    ├── Ground level reference
    ├── Depth visualization
    └── Adjustable depth setting
```

### Measurement Process
1. **Identify Object Type**: AI determines if standing tree or cut stump
2. **Diameter Capture**: 
   - Standing tree: Measure at 4.5ft height (DBH)
   - Cut stump: Measure at ground level
3. **Height Capture**:
   - Standing tree: Base to top measurement
   - Cut stump: Ground to top of remaining stump
4. **Depth Setting**: User confirms or adjusts grind depth
5. **Calculate StumpScore**: Apply formula with captured measurements

## Accuracy Validation

### Measurement Precision
- **Target Accuracy**: ±0.5 inches for both diameter and height
- **Maximum Tolerance**: ±1.0 inch (business requirement)
- **Validation Method**: Multiple measurement averaging
- **Confidence Scoring**: AI confidence level for each measurement

### Quality Assurance
```
Accuracy Checks:
├── Multiple Angle Measurements
│   ├── Diameter from 2-3 different angles
│   ├── Height verification with triangulation
│   └── Consistency validation across measurements
├── Environmental Factors
│   ├── Lighting condition assessment
│   ├── Camera stability detection
│   └── Obstacle interference checking
└── User Feedback Loop
    ├── Manual override capability
    ├── Measurement adjustment tools
    └── Re-measurement option
```

## Business Logic Integration

### Conditional Measurements
```python
def determine_measurement_type(object_height):
    if object_height > 3.0:  # feet
        return "STANDING_TREE"
    else:
        return "CUT_STUMP"

def calculate_stump_score(diameter, height, grind_depth=8.0):
    """
    Calculate StumpScore for pricing
    
    Args:
        diameter: inches (DBH for standing, stump diameter for cut)
        height: feet (full height for standing, stump height for cut)  
        grind_depth: inches below ground (default 8")
    
    Returns:
        stump_score: float
    """
    # Convert grind depth to feet for consistent units
    grind_depth_ft = grind_depth / 12.0
    
    # Calculate StumpScore
    stump_score = (height + grind_depth_ft) * diameter
    
    return round(stump_score, 2)
```

### User Configuration
```
Business Settings:
├── Default Grind Depth
│   ├── Standard: 8 inches
│   ├── Shallow: 6 inches
│   ├── Deep: 12 inches
│   └── Custom: User-defined
├── Measurement Units
│   ├── Imperial: inches/feet
│   └── Metric: cm/meters
└── Accuracy Tolerance
    ├── Strict: ±0.5 inches
    ├── Standard: ±1.0 inch
    └── Relaxed: ±1.5 inches
```

## Example Calculations

### Standing Tree Example
```
Tree Specifications:
- DBH: 24 inches
- Height: 45 feet
- Grind Depth: 8 inches (0.67 feet)

StumpScore = (45 + 0.67) × 24 = 45.67 × 24 = 1,096.08
```

### Cut Stump Example  
```
Stump Specifications:
- Stump Diameter: 26 inches
- Stump Height: 2.5 feet
- Grind Depth: 10 inches (0.83 feet)

StumpScore = (2.5 + 0.83) × 26 = 3.33 × 26 = 86.58
```

## Integration with AFISS

### Pre-AFISS StumpScore
The basic StumpScore provides foundation for:
- Initial pricing estimates
- Equipment requirement assessment
- Time estimation calculations
- Crew planning decisions

### AFISS Enhancement
After basic StumpScore calculation, AFISS factors can modify:
- Risk multipliers for complex locations
- Safety requirement adjustments
- Equipment access difficulty factors
- Environmental consideration modifiers

## AR Implementation Notes

### Technical Requirements
- **Real-time Processing**: Calculate StumpScore as measurements are taken
- **Visual Feedback**: Show calculation in AR overlay
- **Validation UI**: Allow user to verify measurements before finalizing
- **Offline Capability**: All calculations performed locally on device

### User Experience Flow
1. Point camera at stump/tree
2. AI identifies object type automatically
3. Guide user through diameter measurement
4. Guide user through height measurement  
5. Confirm/adjust grind depth setting
6. Display calculated StumpScore
7. Save measurements and score to job record