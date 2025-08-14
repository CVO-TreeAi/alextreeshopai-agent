# 🧠 TreeAI Alex SDK

Universal AI Agent Integration for TreeAI Projects

Plug Alex's business intelligence into **any** TreeAI project with one simple install.

## ⚡ Quick Install

```bash
# Install in your TreeAI project
npm install @treeai/alex-sdk

# Or use globally for CLI
npm install -g @treeai/alex-sdk
```

## 🚀 Instant Usage

```javascript
const { TreeAIAlex } = require('@treeai/alex-sdk');

const alex = new TreeAIAlex({
  projectName: 'MyTreeAIProject'
});

// Create leads instantly
const lead = await alex.createLead('Sarah Johnson at 456 Maple Street');
console.log(lead.getText());

// Calculate TreeScore
const score = await alex.calculateTreeScore({ height: 45, crownRadius: 8, dbh: 24 });
console.log('TreeScore:', score.extractNumbers()[0]);

// Generate proposals  
const proposal = await alex.generateProposal({ 
  customer: 'Sarah Johnson', 
  location: 'Maple Street' 
});
```

## 🎯 Pre-Built Integrations

### **DroneAI Projects**
```javascript
const droneAnalysis = await alex.analyzeDroneSurvey({
  treeCount: 47,
  averageHeight: 32,
  riskTrees: 8,
  coordinates: '40.7128,-74.0060'
});
```

### **ISA Certification Platforms** 
```javascript
const assessment = await alex.assessISAStudent({
  studentId: 'STU-001',
  answers: { q1: 'correct answer', q2: 'another answer' },
  practicalScore: 87,
  topic: 'Tree Pruning'
});
```

### **Equipment Management**
```javascript
const maintenance = await alex.predictMaintenance({
  equipmentId: 'CHIP-001',
  hoursUsed: 247,
  lastService: '2024-06-15',
  model: 'Bandit BC-600'
});
```

## 🛠️ CLI Commands

```bash
# Check Alex status
alex health

# Interactive chat
alex chat

# Quick operations
alex lead "Mike Chen at 789 Oak Street"
alex treescore 45 8 24
alex analytics month

# Create integration template
alex create my-tree-project

# Run examples
alex demo
```

## 🏗️ Architecture

```
Your TreeAI Project
├── your-code/
├── package.json
└── alex-integration.js    # One simple file!
```

**Behind the scenes:**
- **Convex Backend**: Real-time database with 15+ tables
- **Claude AI**: Advanced NLP and business intelligence
- **HTTP API**: Universal interface for any platform
- **Vector Search**: Semantic knowledge base

## 📊 Complete Feature Set

### **Core Operations**
- ✅ Lead creation and scoring
- ✅ TreeScore calculation (Height × Crown × DBH formula)
- ✅ Proposal generation with pricing
- ✅ Work order scheduling
- ✅ Invoice processing
- ✅ Business analytics

### **Specialized TreeAI Features**
- ✅ Drone survey analysis
- ✅ ISA student assessments
- ✅ Equipment maintenance prediction
- ✅ AFISS risk assessments
- ✅ Conversation memory
- ✅ Learning pipeline

## 🎨 Usage Examples

### **Basic TreeShop Operations**
```javascript
const alex = new TreeAIAlex({ projectName: 'TreeShopPro' });

// Natural language works!
const response = await alex.chat('Create a new lead for the Johnson property');
```

### **Advanced Workflow**
```javascript
// Complete project workflow
const lead = await alex.createLead('Pine Valley HOA');
const analysis = await alex.analyzeDroneSurvey({...});
const proposal = await alex.generateProposal({...});
const workOrder = await alex.scheduleWork({...});
const invoice = await alex.createInvoice({...});
```

### **Error Handling**
```javascript
try {
  const response = await alex.calculateTreeScore({ height: 45, crownRadius: 8, dbh: 24 });
  
  if (response.needsMoreInfo()) {
    // Alex is asking for clarification
    const clarification = await alex.chat('Use oak tree species');
  }
  
  const numbers = response.extractNumbers(); // Extract pricing automatically
  
} catch (error) {
  console.error('Alex integration failed:', error.message);
}
```

## 🔧 Configuration

```javascript
const alex = new TreeAIAlex({
  projectName: 'MyTreeProject',      // Your project identifier
  sessionId: 'custom-session-123',   // Optional: custom session
  timeout: 30000,                    // API timeout (30s default)
  apiUrl: 'https://custom-alex.api'  // Optional: custom endpoint
});
```

## 🎯 Integration Patterns

### **Pattern 1: Direct Integration**
```javascript
// Install and use immediately
npm install @treeai/alex-sdk
const { TreeAIAlex } = require('@treeai/alex-sdk');
```

### **Pattern 2: CLI Tools**
```bash
# Global CLI for scripts
npm install -g @treeai/alex-sdk
alex health && alex analytics month
```

### **Pattern 3: Microservice**
```javascript
// Use Alex as external intelligence service
const alexService = new TreeAIAlex({ projectName: 'MainApp' });
app.post('/api/analyze', async (req, res) => {
  const analysis = await alexService.chat(req.body.query);
  res.json(analysis.getRaw());
});
```

## 🚀 Getting Started

1. **Install SDK**
   ```bash
   npm install @treeai/alex-sdk
   ```

2. **Create Integration**
   ```bash
   alex create my-tree-project
   ```

3. **Test Connection**
   ```bash
   alex health
   ```

4. **Start Building**
   ```javascript
   const alex = new TreeAIAlex({ projectName: 'MyProject' });
   const response = await alex.chat('Hello Alex!');
   ```

## 🎉 Ready to Use

**Alex is production-ready** with:
- ✅ Professional business responses
- ✅ Comprehensive error handling  
- ✅ TypeScript definitions
- ✅ Complete documentation
- ✅ CLI tools included
- ✅ Real-world examples

**Add AI intelligence to your TreeAI project in minutes, not months!**

---

**Powered by**: Convex Real-time Database + Claude AI + TreeShop Domain Expertise