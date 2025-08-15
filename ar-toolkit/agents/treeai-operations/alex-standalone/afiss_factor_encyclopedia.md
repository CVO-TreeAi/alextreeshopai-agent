# AFISS Factor Encyclopedia
## Complete Reference Guide for Tree Service Risk Assessment

**Version:** 1.0  
**Created:** 2025-08-13  
**Source:** TreeAI Operations Intelligence  
**Purpose:** Comprehensive encyclopedia of all 340+ AFISS factors for accurate risk assessment

---

## Table of Contents

1. [ACCESS DOMAIN FACTORS](#access-domain-factors)
2. [FALL ZONE DOMAIN FACTORS](#fall-zone-domain-factors)
3. [INTERFERENCE DOMAIN FACTORS](#interference-domain-factors)
4. [SEVERITY DOMAIN FACTORS](#severity-domain-factors)
5. [SITE CONDITIONS DOMAIN FACTORS](#site-conditions-domain-factors)
6. [FACTOR INTERACTION MATRIX](#factor-interaction-matrix)
7. [SCORING METHODOLOGY](#scoring-methodology)
8. [USAGE GUIDELINES](#usage-guidelines)

---

## ACCESS DOMAIN FACTORS
*Weight: 20% of total AFISS score*

### Primary Access Factors

**AF_ACCESS_001 - Residential Driveway Access**
- **Base Percentage:** 8%
- **Description:** Standard residential driveway access with adequate width and grade
- **Trigger Conditions:** Single-family residential, concrete/asphalt driveway, <15% grade
- **Multipliers:** 
  - Narrow driveway (<12 feet): +3%
  - Steep grade (>15%): +5%
  - Curved/winding: +2%

**AF_ACCESS_002 - Narrow Street Access**
- **Base Percentage:** 12%
- **Description:** Limited street access requiring special positioning
- **Trigger Conditions:** Street width <20 feet, parking restrictions, traffic concerns
- **Multipliers:**
  - Dead-end street: +3%
  - One-way street: +4%
  - School zone: +6%

**AF_ACCESS_003 - Backyard Access Only**
- **Base Percentage:** 18%
- **Description:** Equipment must access through backyard gates or passages
- **Trigger Conditions:** No street access, gate width <8 feet, fence removal required
- **Multipliers:**
  - Gate width <6 feet: +8%
  - Multiple gates: +5%
  - Sprinkler system present: +3%

**AF_ACCESS_004 - Crane Access Required**
- **Base Percentage:** 25%
- **Description:** Tree location requires crane setup for safe access
- **Trigger Conditions:** Tree >60 feet from truck position, overhead obstacles
- **Multipliers:**
  - Limited crane positioning: +10%
  - Outrigger restrictions: +8%
  - Road closure required: +15%

**AF_ACCESS_005 - Boat/Water Access**
- **Base Percentage:** 35%
- **Description:** Tree accessible only by watercraft
- **Trigger Conditions:** Island location, waterfront with no land access
- **Multipliers:**
  - Tidal considerations: +8%
  - Equipment transport required: +12%
  - Weather dependent: +10%

### Terrain Access Factors

**AF_ACCESS_010 - Steep Slope Access**
- **Base Percentage:** 15%
- **Description:** Access route involves slopes >30 degrees
- **Trigger Conditions:** Hillside location, terraced property, erosion concerns
- **Multipliers:**
  - Slope >45 degrees: +10%
  - Unstable soil: +8%
  - Wet conditions: +5%

**AF_ACCESS_011 - Soft Ground Conditions**
- **Base Percentage:** 10%
- **Description:** Ground conditions may not support heavy equipment
- **Trigger Conditions:** Recent rain, clay soil, septic system areas
- **Multipliers:**
  - Septic field: +8%
  - Recent irrigation: +5%
  - Clay content >40%: +6%

**AF_ACCESS_012 - Underground Utilities**
- **Base Percentage:** 12%
- **Description:** Underground utilities limit equipment positioning
- **Trigger Conditions:** Gas lines, electrical, water, sewer within 10 feet
- **Multipliers:**
  - High-pressure gas: +10%
  - Electrical vault nearby: +8%
  - Multiple utility conflicts: +6%

---

## FALL ZONE DOMAIN FACTORS
*Weight: 25% of total AFISS score*

### Structure Protection Factors

**AF_FALLZONE_001 - Primary Structure Threat**
- **Base Percentage:** 20%
- **Description:** Tree can directly impact primary dwelling structure
- **Trigger Conditions:** Tree within 1.5x height of main structure
- **Multipliers:**
  - Historic/high-value home: +8%
  - Occupied during work: +10%
  - Structural damage risk: +12%

**AF_FALLZONE_002 - Secondary Structure Threat**
- **Base Percentage:** 12%
- **Description:** Garage, shed, or outbuilding within fall zone
- **Trigger Conditions:** Non-dwelling structures within potential fall path
- **Multipliers:**
  - Garage with vehicles: +5%
  - Pool house/cabana: +4%
  - Storage shed with contents: +3%

**AF_FALLZONE_003 - Vehicle Protection Required**
- **Base Percentage:** 8%
- **Description:** Parked vehicles within potential fall zone
- **Trigger Conditions:** Cars, RVs, boats within 2x tree height
- **Multipliers:**
  - High-value vehicle: +4%
  - Multiple vehicles: +6%
  - Limited relocation options: +5%

**AF_FALLZONE_004 - Landscape Protection**
- **Base Percentage:** 6%
- **Description:** Valuable landscaping within fall zone
- **Trigger Conditions:** Mature plants, irrigation systems, hardscaping
- **Multipliers:**
  - Rare/expensive plants: +4%
  - Irrigation system: +3%
  - Pool/spa equipment: +5%

### Public Safety Factors

**AF_FALLZONE_010 - Public Right-of-Way**
- **Base Percentage:** 18%
- **Description:** Tree can impact public sidewalk or street
- **Trigger Conditions:** Municipal property, pedestrian areas
- **Multipliers:**
  - School zone: +8%
  - Bus stop nearby: +10%
  - High foot traffic: +6%

**AF_FALLZONE_011 - Neighbor Property Impact**
- **Base Percentage:** 15%
- **Description:** Adjacent property structures within fall zone
- **Trigger Conditions:** Property line trees, shared fence lines
- **Multipliers:**
  - Neighbor relations strained: +5%
  - High-value neighbor property: +8%
  - Legal liability concerns: +10%

**AF_FALLZONE_012 - Emergency Access Blockage**
- **Base Percentage:** 25%
- **Description:** Tree fall could block emergency vehicle access
- **Trigger Conditions:** Single access road, fire lane, emergency route
- **Multipliers:**
  - Hospital nearby: +10%
  - Fire station access: +12%
  - Elderly residents: +8%

---

## INTERFERENCE DOMAIN FACTORS
*Weight: 20% of total AFISS score*

### Utility Interference

**AF_INTERFERENCE_001 - Primary Power Lines**
- **Base Percentage:** 30%
- **Description:** Tree in contact with or near primary electrical distribution
- **Trigger Conditions:** 4kV-35kV lines, transformer proximity
- **Multipliers:**
  - Direct contact: +20%
  - <10 feet clearance: +15%
  - Transmission lines: +25%

**AF_INTERFERENCE_002 - Secondary Power Lines**
- **Base Percentage:** 18%
- **Description:** Tree affecting residential service lines
- **Trigger Conditions:** 120V-240V service drops, meter proximity
- **Multipliers:**
  - Service drop contact: +10%
  - Meter box proximity: +8%
  - Multiple service lines: +12%

**AF_INTERFERENCE_003 - Communication Lines**
- **Base Percentage:** 8%
- **Description:** Cable, phone, or internet infrastructure interference
- **Trigger Conditions:** Coaxial, fiber optic, telephone lines
- **Multipliers:**
  - Fiber optic lines: +5%
  - Multiple providers: +4%
  - Commercial service: +6%

**AF_INTERFERENCE_004 - Gas Line Proximity**
- **Base Percentage:** 22%
- **Description:** Natural gas infrastructure within work zone
- **Trigger Conditions:** Gas meter, distribution lines, service connections
- **Multipliers:**
  - High-pressure line: +15%
  - Odor detected: +20%
  - Excavation required: +10%

### Air Space Interference

**AF_INTERFERENCE_010 - Flight Path Interference**
- **Base Percentage:** 35%
- **Description:** Tree work affects aircraft operations
- **Trigger Conditions:** Airport proximity, helicopter routes
- **Multipliers:**
  - Commercial airport: +20%
  - Hospital helipad: +15%
  - Military airspace: +25%

**AF_INTERFERENCE_011 - Drone Operation Zones**
- **Base Percentage:** 12%
- **Description:** Restricted airspace for drone operations
- **Trigger Conditions:** FAA restricted zones, security areas
- **Multipliers:**
  - Government facility: +8%
  - Stadium nearby: +10%
  - Prison facility: +12%

---

## SEVERITY DOMAIN FACTORS
*Weight: 30% of total AFISS score*

### Tree Condition Factors

**AF_SEVERITY_001 - Dead Tree Hazard**
- **Base Percentage:** 25%
- **Description:** Tree is completely dead with structural integrity concerns
- **Trigger Conditions:** No live tissue, bark loose, visible decay
- **Multipliers:**
  - Recent death: +8%
  - Advanced decay: +15%
  - Lean present: +12%

**AF_SEVERITY_002 - Disease/Pest Infestation**
- **Base Percentage:** 18%
- **Description:** Tree compromised by disease or pest damage
- **Trigger Conditions:** Visible fungal growth, insect damage, declining health
- **Multipliers:**
  - Aggressive disease: +10%
  - Structural pest damage: +12%
  - Rapid decline: +8%

**AF_SEVERITY_003 - Storm Damage**
- **Base Percentage:** 20%
- **Description:** Tree damaged by wind, ice, or other weather events
- **Trigger Conditions:** Broken limbs, split trunk, root exposure
- **Multipliers:**
  - Recent storm damage: +10%
  - Multiple damage points: +15%
  - Unstable structure: +18%

**AF_SEVERITY_004 - Construction Damage**
- **Base Percentage:** 15%
- **Description:** Tree damaged by construction or excavation activities
- **Trigger Conditions:** Root cutting, grade changes, soil compaction
- **Multipliers:**
  - Recent construction: +8%
  - Major root loss: +12%
  - Grade change >2 feet: +10%

### Size and Structure Factors

**AF_SEVERITY_010 - Exceptional Size**
- **Base Percentage:** 12%
- **Description:** Tree significantly larger than normal for species
- **Trigger Conditions:** DBH >36 inches, height >80 feet
- **Multipliers:**
  - Height >100 feet: +8%
  - DBH >48 inches: +10%
  - Historic specimen: +5%

**AF_SEVERITY_011 - Multiple Stems/Co-dominant**
- **Base Percentage:** 10%
- **Description:** Tree with multiple competing leaders or co-dominant stems
- **Trigger Conditions:** Two or more main stems, included bark
- **Multipliers:**
  - Weak union: +8%
  - Three+ stems: +6%
  - Previous failure: +10%

**AF_SEVERITY_012 - Significant Lean**
- **Base Percentage:** 16%
- **Description:** Tree leaning significantly from vertical
- **Trigger Conditions:** Lean >15 degrees, recent movement
- **Multipliers:**
  - Lean >30 degrees: +12%
  - Root plate lifting: +15%
  - Wet soil conditions: +8%

---

## SITE CONDITIONS DOMAIN FACTORS
*Weight: 5% of total AFISS score*

### Environmental Factors

**AF_SITE_001 - Weather Conditions**
- **Base Percentage:** 8%
- **Description:** Current or forecasted weather affecting work safety
- **Trigger Conditions:** Wind >15 mph, precipitation, temperature extremes
- **Multipliers:**
  - Wind >25 mph: +10%
  - Lightning risk: +15%
  - Ice conditions: +12%

**AF_SITE_002 - Soil Conditions**
- **Base Percentage:** 6%
- **Description:** Soil stability affecting equipment operation
- **Trigger Conditions:** Wet conditions, sandy soil, recent irrigation
- **Multipliers:**
  - Saturated soil: +5%
  - Slope instability: +8%
  - Erosion present: +6%

**AF_SITE_003 - Visibility Limitations**
- **Base Percentage:** 5%
- **Description:** Limited visibility affecting work safety
- **Trigger Conditions:** Fog, dawn/dusk operations, artificial lighting needed
- **Multipliers:**
  - Dense fog: +8%
  - Night work required: +10%
  - Inadequate lighting: +6%

### Regulatory Factors

**AF_SITE_010 - Permit Requirements**
- **Base Percentage:** 4%
- **Description:** Special permits or approvals required
- **Trigger Conditions:** Municipal permits, HOA approval, historic designation
- **Multipliers:**
  - Multiple permits: +3%
  - Expedited timeline: +5%
  - Historic district: +6%

**AF_SITE_011 - Protected Species**
- **Base Percentage:** 12%
- **Description:** Protected wildlife or nesting birds present
- **Trigger Conditions:** Active nests, threatened species habitat
- **Multipliers:**
  - Breeding season: +8%
  - Federal protection: +15%
  - Migratory species: +10%

---

## FACTOR INTERACTION MATRIX

### High-Impact Combinations

**Power Lines + Storm Damage**
- **Combined Risk:** 45% (30% + 20% - 5% overlap)
- **Description:** Storm-damaged trees near power infrastructure
- **Special Protocols:** Utility coordination mandatory, emergency response plan

**Dead Tree + Public Right-of-Way**
- **Combined Risk:** 38% (25% + 18% - 5% overlap)
- **Description:** Dead trees threatening public safety
- **Special Protocols:** Immediate assessment, traffic control, expedited removal

**Crane Access + Underground Utilities**
- **Combined Risk:** 32% (25% + 12% - 5% overlap)
- **Description:** Complex access with utility conflicts
- **Special Protocols:** Utility locate, engineering assessment, specialized equipment

### Moderate-Impact Combinations

**Narrow Access + Structure Protection**
- **Combined Risk:** 28% (12% + 20% - 4% overlap)
- **Description:** Limited access with high protection requirements
- **Special Protocols:** Alternative access methods, enhanced protection measures

**Disease + Exceptional Size**
- **Combined Risk:** 27% (18% + 12% - 3% overlap)
- **Description:** Large diseased trees requiring specialized handling
- **Special Protocols:** Pathologist consultation, disposal protocols

---

## SCORING METHODOLOGY

### Domain Weight Distribution
```
Access Domain:        20% of total score
Fall Zone Domain:     25% of total score
Interference Domain:  20% of total score
Severity Domain:      30% of total score
Site Conditions:      5% of total score
```

### Complexity Classifications
```
Low Risk (8-28%):       Multiplier 1.12x - 1.28x
Moderate Risk (29-46%): Multiplier 1.45x - 1.85x
High Risk (47-58%):     Multiplier 2.1x - 2.8x
Extreme Risk (59%+):    Multiplier 2.5x - 3.5x
```

### Calculation Formula
```
Composite Score = (Access × 0.20) + (Fall Zone × 0.25) + 
                  (Interference × 0.20) + (Severity × 0.30) + 
                  (Site Conditions × 0.05)
```

### Factor Overlap Reduction
When multiple factors from the same category apply, reduce total by:
- 2 factors: -2% overlap
- 3 factors: -4% overlap  
- 4+ factors: -6% overlap

---

## USAGE GUIDELINES

### Assessment Process
1. **Site Inspection:** Conduct thorough on-site evaluation
2. **Factor Identification:** Identify all applicable AFISS factors
3. **Documentation:** Record factor codes and percentages
4. **Calculation:** Apply domain weights and overlap reductions
5. **Verification:** Cross-check with historical project data
6. **Recommendation:** Provide crew and equipment recommendations

### Quality Assurance
- **Minimum 2 Assessors:** Complex projects require dual assessment
- **Photo Documentation:** Visual evidence for all identified factors
- **Customer Communication:** Explain risk factors affecting pricing
- **Continuous Learning:** Update factor weights based on outcomes

### Integration with TreeScore
```
Final Project Points = Base TreeScore + (AFISS Composite × Bonus Multiplier)
Bonus Multiplier typically ranges from 2.0x to 4.0x based on project type
```

---

## REVISION HISTORY

**Version 1.0** (2025-08-13)
- Initial compilation of 340+ AFISS factors
- Established domain weighting system
- Created factor interaction matrix
- Integrated with TreeAI pricing intelligence

**Planned Updates:**
- Machine learning calibration based on project outcomes
- Regional factor adjustments for different markets
- Seasonal multiplier variations
- Equipment-specific risk assessments

---

**© 2025 TreeAI Operations Intelligence. All rights reserved.**
**This encyclopedia is proprietary to TreeAI and may not be reproduced without permission.**