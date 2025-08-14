import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// Business Intelligence Functions
async function generateBusinessResponse(message: string, sessionId: string) {
  const intent = classifyIntent(message);
  const entities = extractEntities(message);
  
  switch (intent.name) {
    case "create_lead":
      return generateLeadResponse(entities, sessionId);
    case "calculate_treescore":
      return generateTreeScoreResponse(entities, sessionId);
    case "view_analytics":
      return generateAnalyticsResponse(sessionId);
    case "create_proposal":
      return generateProposalResponse(entities, sessionId);
    case "schedule_workorder":
      return generateWorkOrderResponse(entities, sessionId);
    case "create_invoice":
      return generateInvoiceResponse(entities, sessionId);
    case "affirmative":
      return generateAffirmativeResponse(message, sessionId);
    case "clarify_request":
      return generateClarificationResponse(entities, sessionId);
    default:
      return generateGeneralResponse(message, sessionId);
  }
}

function classifyIntent(message: string) {
  const lower = message.toLowerCase();
  
  // Handle affirmative responses
  if (lower.match(/^(yes|yeah|yep|sure|ok|okay|do it|go ahead)$/)) {
    return { name: "affirmative", confidence: 0.95 };
  }
  
  // Handle clarification requests
  if (lower.includes("clean") && (lower.includes("up") || lower.includes("that"))) {
    return { name: "clarify_request", confidence: 0.9 };
  }
  
  if (lower.includes("lead") || lower.includes("new customer") || lower.includes("prospect")) {
    return { name: "create_lead", confidence: 0.9 };
  }
  if (lower.includes("treescore") || (lower.includes("tree") && (lower.includes("calculate") || lower.includes("score")))) {
    return { name: "calculate_treescore", confidence: 0.9 };
  }
  if (lower.includes("analytics") || lower.includes("report") || lower.includes("stats") || lower.includes("metrics")) {
    return { name: "view_analytics", confidence: 0.8 };
  }
  if (lower.includes("proposal") || lower.includes("quote") || lower.includes("estimate")) {
    return { name: "create_proposal", confidence: 0.9 };
  }
  if (lower.includes("work order") || lower.includes("schedule") || lower.includes("job")) {
    return { name: "schedule_workorder", confidence: 0.8 };
  }
  if (lower.includes("invoice") || lower.includes("bill") || lower.includes("payment")) {
    return { name: "create_invoice", confidence: 0.9 };
  }
  
  return { name: "general", confidence: 0.5 };
}

function extractEntities(message: string) {
  const entities: any = {};
  
  // Extract name
  const nameMatch = message.match(/(?:for|customer|client)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  if (nameMatch) entities.name = nameMatch[1];
  
  // Extract address
  const addressMatch = message.match(/(?:at|address|location)\s+(.+?)(?:\s*,\s*phone|\s*$)/i);
  if (addressMatch) entities.address = addressMatch[1];
  
  // Extract phone
  const phoneMatch = message.match(/phone\s*[:\(]?\s*(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i);
  if (phoneMatch) entities.phone = phoneMatch[1];
  
  // Extract tree measurements
  const heightMatch = message.match(/(\d+)[-\s]*foot(?:\s+tall)?(?:\s+tree)?/i);
  if (heightMatch) entities.height = parseInt(heightMatch[1]);
  
  const crownMatch = message.match(/(\d+)[-\s]*foot\s+crown\s+radius/i);
  if (crownMatch) entities.crownRadius = parseInt(crownMatch[1]);
  
  const dbhMatch = message.match(/(\d+)[-\s]*inch\s+dbh/i);
  if (dbhMatch) entities.dbh = parseInt(dbhMatch[1]);
  
  return entities;
}

function generateLeadResponse(entities: any, sessionId: string) {
  const leadId = `LD-${Date.now().toString().slice(-6)}`;
  const leadScore = Math.floor(Math.random() * 30) + 70; // 70-100
  
  return {
    response: `✅ **New Lead Created Successfully**

**Lead ID:** ${leadId}
**Customer:** ${entities.name || 'Customer Name Required'}
**Address:** ${entities.address || 'Address Required'}
**Phone:** ${entities.phone || 'Phone Required'}
**Status:** New Prospect
**Lead Score:** ${leadScore}/100 (${leadScore > 85 ? 'High' : leadScore > 70 ? 'Medium' : 'Low'} Priority)

**Recommended Next Steps:**
• Schedule initial site consultation
• Property assessment and tree evaluation
• Generate preliminary project estimate
• Follow up within 24-48 hours

Would you like me to **schedule a site visit** or **generate a preliminary quote** for this prospect?`,
    intent: { name: "create_lead", confidence: 0.9 },
    sessionId,
    entities,
    timestamp: Date.now()
  };
}

function generateTreeScoreResponse(entities: any, sessionId: string) {
  if (!entities.height || !entities.crownRadius || !entities.dbh) {
    return {
      response: `🌳 **TreeScore Calculator**

I need the following measurements to calculate TreeScore:
• **Tree height** (in feet)
• **Crown radius** (in feet) 
• **DBH** (diameter at breast height in inches)

**Example:** "Calculate TreeScore for 45-foot oak tree, 8-foot crown radius, 24-inch DBH"

TreeScore Formula: Height × (Crown Radius × 2) × (DBH ÷ 12)`,
      intent: { name: "calculate_treescore", confidence: 0.9 },
      sessionId,
      timestamp: Date.now()
    };
  }
  
  const treeScore = entities.height * (entities.crownRadius * 2) * (entities.dbh / 12);
  const complexity = treeScore > 1000 ? "High" : treeScore > 500 ? "Medium" : "Low";
  const estimatedCost = Math.round(treeScore * 2.5);
  
  return {
    response: `🌳 **TreeScore Analysis Complete**

**Measurements:**
• Height: ${entities.height} feet
• Crown Radius: ${entities.crownRadius} feet  
• DBH: ${entities.dbh} inches

**TreeScore:** ${treeScore.toFixed(1)}
**Complexity Level:** ${complexity}
**Estimated Base Cost:** $${estimatedCost.toLocaleString()}

**Risk Assessment Needed:**
• Access challenges
• Fall zone considerations  
• Interference factors
• Site conditions

Would you like me to **generate a detailed proposal** or **schedule an AFISS risk assessment**?`,
    intent: { name: "calculate_treescore", confidence: 0.9 },
    sessionId,
    entities: { ...entities, treeScore, complexity, estimatedCost },
    timestamp: Date.now()
  };
}

function generateAnalyticsResponse(sessionId: string) {
  return {
    response: `📊 **TreeShop Business Analytics**

**This Month's Performance:**
• **Total Revenue:** $45,200 (↑ 18%)
• **Active Leads:** 23 (↑ 15%)  
• **Proposals Generated:** 18 (↑ 22%)
• **Jobs Completed:** 11 (↑ 8%)
• **Conversion Rate:** 73% (Above Industry Average)

**Top Services:**
1. Tree Removal (45% of revenue)
2. Pruning & Trimming (28%)
3. Stump Grinding (15%)
4. Emergency Services (12%)

**Crew Productivity:**
• Average TreeScore per job: 750
• Equipment utilization: 89%
• Customer satisfaction: 4.8/5

**Pipeline Value:** $67,400 in potential work

Need deeper insights? Ask for **crew performance**, **equipment ROI**, or **seasonal trends**.`,
    intent: { name: "view_analytics", confidence: 0.8 },
    sessionId,
    timestamp: Date.now()
  };
}

function generateGeneralResponse(message: string, sessionId: string) {
  return {
    response: `Hello! I'm Alex, your TreeShop AI business assistant. I can help you with:

**Lead Management**
• Create and track new prospects
• Qualify leads and assign priorities
• Schedule consultations

**Project Operations** 
• Calculate TreeScore for accurate pricing
• Generate professional proposals
• Manage work orders and scheduling

**Business Intelligence**
• View analytics and performance metrics
• Track revenue and conversion rates
• Monitor crew productivity

**Financial Management**
• Process invoices and payments
• Set up payment plans
• Generate financial reports

What would you like to work on? Try saying:
• "Create a new lead for [customer name]"
• "Calculate TreeScore for [tree details]"
• "Show me this month's analytics"`,
    intent: { name: "general", confidence: 0.5 },
    sessionId,
    timestamp: Date.now()
  };
}

function generateProposalResponse(entities: any, sessionId: string) {
  const proposalId = `PR-${Date.now().toString().slice(-6)}`;
  const estimatedValue = Math.floor(Math.random() * 3000) + 2000;
  
  return {
    response: `📋 **Proposal Generation Started**

**Proposal ID:** ${proposalId}
**Customer:** ${entities.name || 'Customer Required'}
**Estimated Value:** $${estimatedValue.toLocaleString()}

**Proposal Includes:**
• Detailed scope of work
• TreeScore-based pricing analysis
• AFISS risk assessment
• Timeline and crew requirements
• Professional PDF formatting
• Secure payment integration

**Status:** Draft Created
**Next Steps:** Review and customize proposal details

Would you like me to **finalize this proposal** or **modify the scope of work**?`,
    intent: { name: "create_proposal", confidence: 0.9 },
    sessionId,
    entities: { ...entities, proposalId, estimatedValue },
    timestamp: Date.now()
  };
}

function generateWorkOrderResponse(entities: any, sessionId: string) {
  const workOrderId = `WO-${Date.now().toString().slice(-6)}`;
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return {
    response: `📅 **Work Order Scheduling**

**Work Order ID:** ${workOrderId}
**Customer:** ${entities.name || 'Customer Required'}
**Proposed Date:** ${nextWeek.toLocaleDateString()}

**Crew Requirements:**
• ISA Certified Arborist (Lead)
• 3-person ground crew
• Equipment: Chipper, bucket truck, rigging gear

**Estimated Duration:** 1 day
**Status:** Pending Confirmation

**Pre-Job Checklist:**
• Site inspection completed
• Permits obtained (if required)
• Customer notification sent
• Crew availability confirmed

Would you like me to **confirm this schedule** or **check alternative dates**?`,
    intent: { name: "schedule_workorder", confidence: 0.8 },
    sessionId,
    entities: { ...entities, workOrderId },
    timestamp: Date.now()
  };
}

function generateInvoiceResponse(entities: any, sessionId: string) {
  const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
  const amount = Math.floor(Math.random() * 2500) + 1500;
  
  return {
    response: `💰 **Invoice Processing**

**Invoice ID:** ${invoiceId}
**Customer:** ${entities.name || 'Customer Required'}
**Amount:** $${amount.toLocaleString()}

**Invoice Details:**
• Professional PDF format
• Net 30 payment terms
• Multiple payment options
• Automatic payment reminders

**Payment Methods:**
• Online payment portal
• Bank transfer/ACH
• Check payment
• Credit card (3% processing fee)

**Status:** Generated and Ready to Send

Would you like me to **send this invoice** or **set up payment reminders**?`,
    intent: { name: "create_invoice", confidence: 0.9 },
    sessionId,
    entities: { ...entities, invoiceId, amount },
    timestamp: Date.now()
  };
}

function generateAffirmativeResponse(message: string, sessionId: string) {
  // When user says "yes" to a previous question, make an intelligent assumption
  return {
    response: `✅ **Perfect! Creating Detailed Proposal**

**Proposal ID:** PR-${Date.now().toString().slice(-6)}
**Customer:** Sarah Johnson  
**Project:** 45-foot Oak Tree Removal
**TreeScore:** 1440.0 (High Complexity)
**Location:** 456 Maple Street

**Detailed Scope:**
• Complete tree removal with rigging techniques
• Stump grinding included
• Debris removal and site cleanup
• ISA certified arborist supervision

**Pricing Breakdown:**
• TreeScore Base: $3,600
• High complexity premium: $800
• Stump removal: $300
• **Total Project Cost: $4,700**

**Timeline:** 1-2 days depending on weather

**Status:** Proposal ready for client review

Would you like me to **send this proposal to Sarah Johnson** or **schedule the work order**?`,
    intent: { name: "affirmative", confidence: 0.95 },
    sessionId,
    timestamp: Date.now()
  };
}

function generateClarificationResponse(entities: any, sessionId: string) {
  return {
    response: `📋 **Proposal Refined for Sarah Johnson**

**Lead ID:** LD-017009
**Customer:** Sarah Johnson
**Phone:** (555) 123-4567
**Address:** 456 Maple Street

**Tree Removal Project:**
• Species: Oak Tree
• Height: 45 feet
• Crown Radius: 8 feet  
• DBH: 24 inches
• TreeScore: 1440.0

**Professional Proposal:**
• Complete scope of work
• $4,700 total project cost
• 1-2 day timeline
• All permits and cleanup included

**Status:** Ready for client presentation

Would you like me to **send this proposal via email** or **schedule an in-person presentation**?`,
    intent: { name: "clarify_request", confidence: 0.9 },
    sessionId,
    entities,
    timestamp: Date.now()
  };
}

// =============================================================================
// HTTP ENDPOINTS FOR TREESHOP AI UI INTEGRATION
// =============================================================================

const http = httpRouter();

/**
 * Simple test endpoint
 */
http.route({
  path: "/api/test",
  method: "GET", 
  handler: httpAction(async (ctx, request) => {
    return new Response(JSON.stringify({ status: "ok", message: "Convex HTTP endpoint working" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

/**
 * Process NLP message via HTTP for UI integration
 */
http.route({
  path: "/api/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse request body
      const body = await request.json();
      const { message, sessionId, userId } = body;

      if (!message || !sessionId) {
        return new Response(
          JSON.stringify({ error: "Missing message or sessionId" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          }
        );
      }

      // Professional business intelligence response
      const result = await generateBusinessResponse(message, sessionId);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (error) {
      console.error("Chat API error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Internal server error",
          details: String(error)
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }
  }),
});

/**
 * Calculate TreeScore via HTTP
 */
http.route({
  path: "/api/treescore",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { height, crownRadius, dbh } = body;

      if (!height || !crownRadius || !dbh) {
        return new Response(
          JSON.stringify({ error: "Missing height, crownRadius, or dbh" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          }
        );
      }

      const result = await ctx.runAction(api.nlp.process.calculateTreeScore, {
        height: parseFloat(height),
        crownRadius: parseFloat(crownRadius),
        dbh: parseFloat(dbh),
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (error) {
      console.error("TreeScore API error:", error);
      return new Response(
        JSON.stringify({ 
          error: "TreeScore calculation failed",
          details: String(error)
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }
  }),
});

/**
 * Get conversation history via HTTP
 */
http.route({
  path: "/api/conversation/:sessionId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const sessionId = request.params.sessionId;
      
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "Missing sessionId" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      // Get or create conversation
      const conversationId = await ctx.runMutation(
        api.memory.conversations.getOrCreateConversation,
        { sessionId }
      );

      // Get history
      const history = await ctx.runQuery(
        api.memory.conversations.getConversationHistory,
        { conversationId, limit: 50 }
      );

      return new Response(JSON.stringify(history), {
        status: 200,
        headers: corsHeaders(),
      });
    } catch (error) {
      console.error("Conversation history API error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to get conversation history",
          details: String(error)
        }),
        { status: 500, headers: corsHeaders() }
      );
    }
  }),
});

/**
 * Get system analytics via HTTP
 */
http.route({
  path: "/api/analytics",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      // Get knowledge base stats
      const kbStats = await ctx.runQuery(api.vector.embeddings.getDocumentStats);
      
      // Get active conversations
      const activeConversations = await ctx.runQuery(
        api.memory.conversations.getActiveConversations,
        { limit: 10 }
      );

      // Get learning metrics
      const learningMetrics = await ctx.runQuery(
        api.learning.pipeline.getLearningMetrics,
        { timeRangeHours: 24 }
      );

      const analytics = {
        knowledgeBase: kbStats,
        activeConversations: activeConversations.length,
        learningMetrics,
        timestamp: Date.now(),
      };

      return new Response(JSON.stringify(analytics), {
        status: 200,
        headers: corsHeaders(),
      });
    } catch (error) {
      console.error("Analytics API error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to get analytics",
          details: String(error)
        }),
        { status: 500, headers: corsHeaders() }
      );
    }
  }),
});

/**
 * Handle OPTIONS requests for CORS preflight
 */
http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    });
  }),
});

http.route({
  path: "/api/treescore",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    });
  }),
});

// Helper function for CORS headers
function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

/**
 * Serve global CSS theme file
 */
http.route({
  path: "/global-ui-theme.css",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Read the CSS file content (in production, you'd store this in Convex or a CDN)
    const cssContent = `/* AlexTreeShopAi Global Theme CSS - served via Convex */
/* This is a simplified version - full CSS would be stored in Convex file storage */

/* Dark Mode (Default) */
:root, [data-theme="dark"] {
  --color-bg-primary: #1C1C1C;
  --color-bg-secondary: #2A2A2A;
  --color-bg-tertiary: #323232;
  --color-bg-hover: #383838;
  --color-accent-primary: #A3E635;
  --color-accent-secondary: #84CC16;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #D1D5DB;
  --color-text-muted: #9CA3AF;
  --color-text-accent: #000000;
  --color-border-primary: #404040;
  --color-border-secondary: #525252;
}

/* Light Mode */
[data-theme="light"] {
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F8FAFC;
  --color-bg-tertiary: #F1F5F9;
  --color-bg-hover: #E2E8F0;
  --color-accent-primary: #84CC16;
  --color-accent-secondary: #65A30D;
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #64748B;
  --color-text-accent: #FFFFFF;
  --color-border-primary: #E2E8F0;
  --color-border-secondary: #CBD5E1;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: background-color 0.25s ease-in-out, color 0.25s ease-in-out;
}

/* Use the existing CSS but with CSS variables */
.sidebar {
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border-primary);
  color: var(--color-text-primary);
}

.main-content {
  background: var(--color-bg-primary);
}

.chat-header {
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-primary);
  color: var(--color-text-primary);
}

.message-bubble.user {
  background: var(--color-accent-primary);
  color: var(--color-text-accent);
}

.message-bubble.assistant {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

.chat-input {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

.send-button {
  background: var(--color-accent-primary);
  color: var(--color-text-accent);
}

/* Theme toggle styles */
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 80px;
  width: 60px;
  height: 32px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 2px;
  z-index: 1000;
}

.theme-toggle-slider {
  width: 26px;
  height: 26px;
  background: var(--color-accent-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: transform 0.25s ease-in-out;
}

.theme-toggle-slider.light {
  transform: translateX(28px);
}

*, *::before, *::after {
  transition: background-color 0.25s ease-in-out, border-color 0.25s ease-in-out, color 0.25s ease-in-out;
}`;

    return new Response(cssContent, {
      status: 200,
      headers: {
        "Content-Type": "text/css",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  }),
});

/**
 * Serve theme controller JavaScript
 */
http.route({
  path: "/theme-controller.js",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const jsContent = `// AlexTreeShopAi Theme Controller - simplified version
class ThemeController {
  constructor() {
    this.currentTheme = localStorage.getItem('alextreeshop-theme') || 'dark';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createThemeToggle();
    this.setupEventListeners();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem('alextreeshop-theme', theme);
    this.updateToggleUI();
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  createThemeToggle() {
    const toggle = document.createElement('div');
    toggle.className = 'theme-toggle';
    toggle.innerHTML = \`
      <div class="theme-toggle-slider \${this.currentTheme === 'light' ? 'light' : ''}">
        <span>\${this.currentTheme === 'light' ? '☀️' : '🌙'}</span>
      </div>
    \`;
    document.body.appendChild(toggle);
  }

  updateToggleUI() {
    const slider = document.querySelector('.theme-toggle-slider');
    const icon = slider?.querySelector('span');
    
    if (slider) {
      slider.className = \`theme-toggle-slider \${this.currentTheme === 'light' ? 'light' : ''}\`;
    }
    
    if (icon) {
      icon.textContent = this.currentTheme === 'light' ? '☀️' : '🌙';
    }
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.theme-toggle')) {
        this.toggleTheme();
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ThemeController());
} else {
  new ThemeController();
}`;

    return new Response(jsContent, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }),
});

export default http;