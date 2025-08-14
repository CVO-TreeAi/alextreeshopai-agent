# AlexTreeShopAi - Expert Business Intelligence Agent

A sophisticated AI agent system for TreeShop operations, powered by Convex real-time database and Claude AI.

## 🎯 **Core Purpose**
Expert-level business intelligence for tree service operations with advanced TreeScore pricing, AFISS risk assessment, and autonomous business management.

## 🏗️ **Architecture**

### **Convex Backend** (`convex/`)
- **Real-time Database**: 15+ optimized tables for complete business operations
- **HTTP API**: RESTful endpoints for agent interactions
- **Vector Embeddings**: 100-dimensional Claude-based semantic search
- **Conversation Memory**: Persistent context across interactions

### **Core Agents** (`convex/`)
```
convex/
├── schema.ts          # Database schema (15+ tables)
├── http.ts           # HTTP API endpoints  
├── nlp/
│   └── process.ts    # Claude AI processing
├── vector/
│   └── embeddings.ts # Vector search & storage
├── memory/
│   └── conversations.ts # Session management
└── learning/
    └── pipeline.ts   # Decision tracking & improvement
```

## 🚀 **Quick Start**

```bash
# Start Convex backend
npx convex dev

# Access via HTTP API
curl -X POST https://tremendous-whale-894.convex.site/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create lead for Sarah Johnson", "sessionId": "session-123"}'
```

## 🧠 **Agent Capabilities**

### **Lead Management**
- Intelligent lead creation with entity extraction
- Automated lead scoring (70-100 scale)
- Priority assignment and follow-up recommendations

### **TreeScore Intelligence**
- Formula: `Height × (Crown Radius × 2) × (DBH ÷ 12)`
- Complexity analysis (Low/Medium/High)
- Cost estimation with premium adjustments

### **Business Intelligence**
- Revenue analytics and conversion tracking  
- Crew productivity monitoring
- Equipment utilization metrics
- Pipeline value calculation

### **Document Generation**
- Professional proposals with TreeScore analysis
- Work order scheduling and crew assignment
- Invoice processing with payment integration
- AFISS risk assessments

## 🔧 **Environment Variables**

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...  # Claude AI
CONVEX_DEPLOYMENT=dev:tremendous-whale-894
CONVEX_URL=https://tremendous-whale-894.convex.cloud
```

## 📊 **Database Schema**

**Core Tables:**
- `customers` - Client management
- `projects` - Job tracking  
- `trees` - Tree inventory with TreeScore
- `employees` - Crew management
- `equipment` - Asset tracking
- `embeddings` - Vector search
- `conversations` - AI memory
- `agent_decisions` - Learning pipeline

## 🎯 **Agent Philosophy**

**Stay Focused**: Single-purpose expert system for tree service business
**Stay Clean**: Minimal dependencies, clear separation of concerns  
**Stay Fast**: Real-time responses, optimized queries, efficient processing

## 🔮 **Future Roadmap**
- iOS SwiftUI native app
- Advanced AFISS automation
- Equipment IoT integration  
- Predictive maintenance scheduling

---

**Powered by**: Convex Database + Claude AI + TreeShop Domain Expertise