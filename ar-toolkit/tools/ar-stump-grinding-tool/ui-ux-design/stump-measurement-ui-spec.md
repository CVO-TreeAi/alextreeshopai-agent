# StumpScore AR Measurement UI Specification

## Core Formula Display
**StumpScore = (Height + Grind_Depth) × Diameter**

## UI Flow States

### 1. Launch Screen
```
┌─────────────────────────────────┐
│  🌳 STUMP GRINDING TOOL        │
│                                 │
│  📷 Start AR Measurement        │
│                                 │
│  ⚙️  Settings                   │
│     • Default Grind Depth: 8"  │
│     • Units: Imperial          │
│     • Accuracy: ±0.5"          │
│                                 │
│  📊 Recent Measurements         │
└─────────────────────────────────┘
```

### 2. AR Camera - Object Detection
```
┌─────────────────────────────────┐
│ 📹 AR CAMERA VIEW              │
│                                 │
│     [Tree/Stump Outline]       │
│     🎯 AI Detection Active     │
│                                 │
│ ┌─ Detection Panel ─────────┐   │
│ │ 🤖 Analyzing object...    │   │
│ │ Type: [Tree/Stump]       │   │  
│ │ Confidence: 95%          │   │
│ │ ✅ Confirm  ↻ Retry      │   │
│ └─────────────────────────────┘   │
│                                 │
│ [❌ Cancel] [⚙️ Settings]       │
└─────────────────────────────────┘
```

### 3. Diameter Measurement
```
┌─────────────────────────────────┐
│ 📹 DIAMETER MEASUREMENT        │
│                                 │
│        ┌─────┐                 │
│    ═══╪═════╪═══              │
│        │  🎯 │  26.5"          │
│    ═══╪═════╪═══              │
│        └─────┘                 │
│                                 │
│ ┌─ Instructions ─────────────┐   │
│ │ Align crosshairs with      │   │
│ │ stump edges. Tap when      │   │
│ │ aligned precisely.         │   │
│ │                            │   │
│ │ Accuracy: ±0.3" ✅         │   │
│ └─────────────────────────────┘   │
│                                 │
│ [⬅️ Back] [✅ Confirm: 26.5"]  │
└─────────────────────────────────┘
```

### 4. Height Measurement
```
For Standing Tree (>3ft):
┌─────────────────────────────────┐
│ 📹 HEIGHT MEASUREMENT          │
│                                 │
│           🔺 TOP               │
│           │                     │
│           │ 45.2 ft            │
│           │                     │
│           🔻 BASE              │
│                                 │
│ ┌─ Instructions ─────────────┐   │
│ │ 1. Mark base point ✅      │   │
│ │ 2. Move back 30ft ✅       │   │
│ │ 3. Mark top point 🎯       │   │
│ │                            │   │
│ │ Distance: 28ft Good ✅     │   │
│ └─────────────────────────────┘   │
│                                 │
│ [⬅️ Back] [✅ Confirm: 45.2ft] │
└─────────────────────────────────┘

For Cut Stump (<3ft):
┌─────────────────────────────────┐
│ 📹 STUMP HEIGHT                │
│                                 │
│        🔺─── 2.1 ft            │
│        │                       │
│    ┌───┴────┐                  │
│    │ STUMP  │                  │
│    └────────┘                  │
│        🔻 GROUND               │
│                                 │
│ ┌─ Instructions ─────────────┐   │
│ │ Measuring from ground      │   │
│ │ to top of stump           │   │
│ │                            │   │
│ │ Accuracy: ±0.4" ✅         │   │
│ └─────────────────────────────┘   │
│                                 │
│ [⬅️ Back] [✅ Confirm: 2.1ft]  │
└─────────────────────────────────┘
```

### 5. Grind Depth Setting
```
┌─────────────────────────────────┐
│ ⚙️ GRIND DEPTH SETTING         │
│                                 │
│    ┌────────────────┐           │
│ ██ │ Ground Level   │           │
│ ██ │ ╭─────────────╮│           │
│ ██ │ │   STUMP     ││ 2.1 ft    │
│ ██ │ ╰─────────────╯│           │
│ ██ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓│ 8.0" ⚙️    │
│ ██ │ GRIND ZONE    │           │
│ ██ └────────────────┘           │
│                                 │
│ ┌─ Depth Settings ────────────┐  │
│ │ ○ 6" Shallow              │  │
│ │ ● 8" Standard (Default)   │  │
│ │ ○ 12" Deep                │  │
│ │ ○ Custom: [__] inches     │  │
│ └─────────────────────────────┘  │
│                                 │
│ [⬅️ Back] [✅ Confirm: 8"]     │
└─────────────────────────────────┘
```

### 6. StumpScore Calculation & Results
```
┌─────────────────────────────────┐
│ 🎯 STUMP SCORE CALCULATED      │
│                                 │
│    SCORE: 267.8                │
│    ═══════════                 │
│                                 │
│ ┌─ Calculation Breakdown ────┐   │
│ │ Height:     2.1 ft         │   │
│ │ Grind Depth: + 0.67 ft     │   │
│ │ Subtotal:   2.77 ft        │   │
│ │                            │   │
│ │ Diameter:   × 26.5"        │   │
│ │                            │   │
│ │ StumpScore: 267.8          │   │
│ └─────────────────────────────┘   │
│                                 │
│ ┌─ Measurements Summary ─────┐   │
│ │ 📏 Diameter: 26.5" ±0.3"  │   │
│ │ 📐 Height: 2.1 ft ±0.4"   │   │
│ │ ⚙️ Grind: 8.0" (user set) │   │
│ │ 📍 GPS: [coordinates]      │   │
│ │ 📅 Time: [timestamp]       │   │
│ └─────────────────────────────┘   │
│                                 │
│ [📝 Edit] [💾 Save] [🔄 Retry] │
└─────────────────────────────────┘
```

### 7. Final Confirmation & Actions
```
┌─────────────────────────────────┐
│ ✅ MEASUREMENT COMPLETE        │
│                                 │
│    StumpScore: 267.8           │
│                                 │
│ ┌─ Next Actions ──────────────┐  │
│ │ 💰 Generate Quote          │  │
│ │ 📋 Create Work Order       │  │
│ │ 👥 Schedule Crew           │  │
│ │ 📊 Add to Analytics        │  │
│ │ 📤 Export Data (.csv)      │  │
│ └─────────────────────────────┘  │
│                                 │
│ ┌─ Customer Info ─────────────┐  │
│ │ Name: [Auto-filled]        │  │
│ │ Address: [GPS to address]  │  │
│ │ Notes: [Optional]          │  │
│ └─────────────────────────────┘  │
│                                 │
│ [🏠 Home] [📊 AlexTreeShopAi]   │
└─────────────────────────────────┘
```

## Precision Indicators

### Accuracy Visual Feedback
```
Accuracy Levels:
├── ✅ Excellent (±0.2"): Green
├── ✅ Good (±0.5"): Green  
├── ⚠️ Acceptable (±1.0"): Yellow
└── ❌ Poor (>1.0"): Red

Real-time Feedback:
├── Stability Indicator
│   ├── 📱 Hold Steady
│   ├── ✋ Too Much Movement  
│   └── ✅ Stable
├── Distance Guidance
│   ├── ⬅️ Move Closer
│   ├── ➡️ Move Further
│   └── ✅ Good Distance
└── Lighting Assessment
    ├── 🔅 Too Dark
    ├── ☀️ Too Bright
    └── ✅ Good Lighting
```

### Measurement Confidence
```
Confidence Scoring:
├── 🎯 95-100%: Excellent
├── ✅ 85-94%: Good
├── ⚠️ 70-84%: Acceptable  
└── ❌ <70%: Re-measure

Display Format:
"Diameter: 26.5" ±0.3" (96% confidence) ✅"
```

## Error Handling UI

### Common Issues
```
Error States:
├── Poor Lighting
│   ├── "💡 Need better lighting"
│   ├── "Try moving to brighter area"
│   └── [Retry] [Use Flash] [Manual Entry]
├── Obstruction Detected  
│   ├── "🚧 Object partially hidden"
│   ├── "Clear view needed for accuracy"
│   └── [Reposition] [Override] [Skip]
├── Low Confidence
│   ├── "⚠️ Measurement uncertainty high"
│   ├── "Confidence: 65% (Need >85%)"
│   └── [Retry] [Adjust] [Manual Override]
└── Calibration Issues
    ├── "📐 Calibration may be off"
    ├── "Consider using reference object"
    └── [Recalibrate] [Continue] [Manual]
```

## Settings Panel
```
┌─────────────────────────────────┐
│ ⚙️ MEASUREMENT SETTINGS        │
│                                 │
│ Default Grind Depth             │
│ ○ 6"  ● 8"  ○ 10"  ○ 12"      │
│ Custom: [__] inches             │
│                                 │
│ Accuracy Target                 │
│ ● ±0.5" (Recommended)          │
│ ○ ±1.0" (Acceptable)           │
│ ○ ±1.5" (Relaxed)              │
│                                 │
│ Units                           │
│ ● Imperial (ft/in)             │
│ ○ Metric (m/cm)                │
│                                 │
│ Business Integration            │
│ ● Auto-create leads           │
│ ● GPS location capture        │
│ ● Photo documentation         │
│                                 │
│ [Reset to Defaults] [Save]      │
└─────────────────────────────────┘
```

## Integration Touch Points

### AlexTreeShopAi Workflow
```
Data Flow:
StumpScore (267.8) →
├── Lead Generation
│   ├── Customer: [GPS → Address]
│   ├── Service: Stump Grinding
│   ├── Measurements: [All data]
│   └── Photos: [AR screenshots]
├── Pricing Engine  
│   ├── Base Score: 267.8
│   ├── Regional Multiplier
│   ├── Access Difficulty
│   └── Final Quote
├── Work Order
│   ├── Equipment: Based on size
│   ├── Crew: Based on complexity
│   ├── Duration: Based on score
│   └── Schedule: User selection
└── Analytics
    ├── Measurement accuracy tracking
    ├── Score vs actual time correlation
    ├── Profitability by score range
    └── Customer satisfaction metrics
```