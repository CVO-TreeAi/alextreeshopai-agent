# Alex TreeAI Integration Guide for React-Convex-Anthropic App

## 1. Convex Backend Setup

### Install Dependencies
```bash
npm install @anthropic-ai/sdk
npm install axios
```

### Add Environment Variables to Convex
```bash
# In your .env.local
ANTHROPIC_API_KEY=your_anthropic_key
TREEAI_BACKEND_URL=https://your-treeai-backend.com
```

### Create Alex Agent Convex Function
```typescript
// convex/alex.ts
import { v } from "convex/values";
import { action } from "./_generated/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const assessProject = action({
  args: {
    trees: v.array(v.object({
      height: v.number(),
      dbh: v.number(),
      crownRadius: v.number()
    })),
    stumps: v.optional(v.array(v.object({
      diameter: v.number(),
      complexity: v.string()
    }))),
    projectType: v.string(),
    accessChallenges: v.array(v.string()),
    address: v.string(),
    description: v.string()
  },
  handler: async (ctx, args) => {
    // Calculate TreeScore
    const treeScores = args.trees.map(tree => 
      tree.height * (tree.crownRadius * 2) * (tree.dbh / 12)
    );
    const totalTreeScore = treeScores.reduce((sum, score) => sum + score, 0);
    
    // AFISS Assessment
    const afissFactors = await assessAFISSFactors(args);
    
    // Equipment & Crew Requirements
    const equipment = await determineEquipment(totalTreeScore, args.projectType);
    const crew = await determineCrew(totalTreeScore, equipment);
    
    // Pricing Calculation
    const pricing = await calculatePricing(equipment, crew, args.trees.length);
    
    return {
      treeScore: totalTreeScore,
      afissFactors,
      equipment,
      crew,
      pricing,
      timestamp: Date.now()
    };
  }
});

async function assessAFISSFactors(projectData: any) {
  // AFISS logic here - could call external API or use local calculation
  const factors = [];
  let compositeScore = 0;
  
  // Access factors
  if (projectData.accessChallenges.includes("narrow_street")) {
    factors.push({ code: "AF_ACCESS_002", description: "Narrow Street Access", percentage: 12 });
    compositeScore += 12 * 0.20; // 20% weight
  }
  
  // Add more AFISS logic...
  
  return { factors, compositeScore };
}
```

### Create Equipment Cost Functions
```typescript
// convex/equipment.ts
export const calculateEquipmentCosts = action({
  args: {
    equipmentList: v.array(v.string()),
    severityFactor: v.number(),
    hours: v.number()
  },
  handler: async (ctx, args) => {
    const equipmentDefaults = {
      bucket_truck: { msrp: 165000, fuelRate: 6.5, maintenanceFactor: 60 },
      chipper: { msrp: 50000, fuelRate: 2.5, maintenanceFactor: 90 },
      // ... more equipment
    };
    
    const costs = args.equipmentList.map(eq => {
      const data = equipmentDefaults[eq];
      // USACE calculation logic here
      return calculateUSACECost(data, args.severityFactor);
    });
    
    return {
      equipmentCosts: costs,
      totalPerHour: costs.reduce((sum, cost) => sum + cost.totalPerHour, 0),
      totalProject: costs.reduce((sum, cost) => sum + cost.totalPerHour, 0) * args.hours
    };
  }
});
```

## 2. React Frontend Integration

### Create Alex Service Hook
```typescript
// hooks/useAlex.ts
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

export function useAlex() {
  const assessProject = useAction(api.alex.assessProject);
  const calculateEquipment = useAction(api.equipment.calculateEquipmentCosts);
  
  const runCompleteAssessment = async (projectData) => {
    try {
      const assessment = await assessProject(projectData);
      return assessment;
    } catch (error) {
      console.error("Alex assessment failed:", error);
      throw error;
    }
  };
  
  return {
    runCompleteAssessment,
    calculateEquipment
  };
}
```

### Create Assessment Components
```typescript
// components/TreeAssessment.tsx
import React, { useState } from 'react';
import { useAlex } from '../hooks/useAlex';

export function TreeAssessment() {
  const { runCompleteAssessment } = useAlex();
  const [trees, setTrees] = useState([{
    height: 0,
    dbh: 0,
    crownRadius: 0
  }]);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleAssess = async () => {
    setLoading(true);
    try {
      const result = await runCompleteAssessment({
        trees,
        projectType: "residential_removal",
        accessChallenges: [],
        address: "",
        description: ""
      });
      setAssessment(result);
    } catch (error) {
      console.error("Assessment failed:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="assessment-container">
      <h2>TreeAI Assessment</h2>
      
      {/* Tree Input Form */}
      {trees.map((tree, index) => (
        <div key={index} className="tree-input">
          <label>Height (ft):
            <input 
              type="number" 
              value={tree.height}
              onChange={(e) => updateTree(index, 'height', Number(e.target.value))}
            />
          </label>
          <label>DBH (inches):
            <input 
              type="number" 
              value={tree.dbh}
              onChange={(e) => updateTree(index, 'dbh', Number(e.target.value))}
            />
          </label>
          <label>Crown Radius (ft):
            <input 
              type="number" 
              value={tree.crownRadius}
              onChange={(e) => updateTree(index, 'crownRadius', Number(e.target.value))}
            />
          </label>
        </div>
      ))}
      
      <button onClick={handleAssess} disabled={loading}>
        {loading ? "Assessing..." : "Run Alex Assessment"}
      </button>
      
      {/* Results Display */}
      {assessment && (
        <div className="assessment-results">
          <h3>Assessment Results</h3>
          <p>TreeScore: {assessment.treeScore.toFixed(1)} points</p>
          <p>AFISS Composite: {assessment.afissFactors.compositeScore.toFixed(1)}%</p>
          <p>Total Project Cost: ${assessment.pricing.totalProject.toFixed(2)}</p>
          <p>Recommended Price: ${assessment.pricing.recommendedPrice.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
```

## 3. Real-time Integration

### Add WebSocket for Live Updates
```typescript
// convex/alexStream.ts
export const streamAssessment = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Stream real-time updates as Alex processes the project
    // Useful for complex calculations that take time
  }
});
```

### Create Live Pricing Component
```typescript
// components/LivePricing.tsx
export function LivePricing({ projectData }) {
  const [pricing, setPricing] = useState(null);
  
  // Debounced calculation as user types
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (projectData.trees.length > 0) {
        const result = await runCompleteAssessment(projectData);
        setPricing(result.pricing);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [projectData]);
  
  return (
    <div className="live-pricing">
      {pricing && (
        <div>
          <h3>Live Pricing Update</h3>
          <p>Cost: ${pricing.totalProject}</p>
          <p>Price: ${pricing.recommendedPrice}</p>
        </div>
      )}
    </div>
  );
}
```

## 4. Authentication & Permissions

### Add User Access Control
```typescript
// convex/auth.ts
export const checkAlexAccess = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // Check if user has Alex access subscription
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();
      
    return user?.alexSubscription?.active || false;
  }
});
```

## 5. Deployment Steps

1. **Deploy Convex Functions**:
   ```bash
   npx convex deploy
   ```

2. **Set Environment Variables**:
   ```bash
   npx convex env set ANTHROPIC_API_KEY your_key_here
   ```

3. **Initialize Database Schema**:
   ```bash
   npx convex dev
   ```

4. **Test Integration**:
   ```typescript
   // Test Alex integration
   import { ConvexReactClient } from "convex/react";
   const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);
   ```

## 6. Usage in Your App

```typescript
// App.tsx
import { TreeAssessment } from './components/TreeAssessment';

function App() {
  return (
    <ConvexProvider client={convex}>
      <div className="app">
        <h1>TreeAI Operations</h1>
        <TreeAssessment />
      </div>
    </ConvexProvider>
  );
}
```

This integration gives your React-Convex app full access to Alex's pricing intelligence with real-time calculations, proper data persistence, and user authentication.