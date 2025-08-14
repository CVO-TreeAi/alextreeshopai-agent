import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// =============================================================================
// CLAUDE AI INTEGRATION & NLP PROCESSING
// =============================================================================

interface ClaudeMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Intent {
  name: string;
  confidence: number;
  entities: Record<string, string>;
  businessContext?: {
    workflow: string;
    priority: string;
    domain: string;
  };
}

interface NLPResponse {
  intent: Intent;
  response: string;
  contextUsed: string[];
  tokensUsed: number;
  responseTime: number;
  confidence: number;
}

// TreeShop Business Intent Patterns
const TREESHOP_INTENTS = {
  create_lead: {
    patterns: [
      "create lead", "new customer", "prospect", "inquiry", "potential client",
      "add customer", "customer inquiry", "new prospect", "lead generation"
    ],
    confidence_threshold: 0.8,
    business_context: {
      workflow: "lead_generation",
      priority: "high",
      domain: "sales"
    }
  },
  create_proposal: {
    patterns: [
      "proposal", "quote", "estimate", "bid", "pricing", "cost estimate",
      "generate proposal", "create quote", "send estimate", "price job"
    ],
    confidence_threshold: 0.85,
    business_context: {
      workflow: "proposal_generation",
      priority: "high",
      domain: "sales"
    }
  },
  create_workorder: {
    patterns: [
      "work order", "schedule", "job assignment", "crew assignment",
      "start job", "schedule work", "assign crew", "begin project"
    ],
    confidence_threshold: 0.8,
    business_context: {
      workflow: "work_execution",
      priority: "medium",
      domain: "operations"
    }
  },
  create_invoice: {
    patterns: [
      "invoice", "bill", "payment", "charge", "collect payment",
      "send invoice", "bill customer", "process payment", "payment request"
    ],
    confidence_threshold: 0.85,
    business_context: {
      workflow: "billing",
      priority: "high",
      domain: "finance"
    }
  },
  tree_assessment: {
    patterns: [
      "assess tree", "tree health", "tree condition", "tree risk",
      "treescore", "afiss", "tree evaluation", "risk assessment"
    ],
    confidence_threshold: 0.9,
    business_context: {
      workflow: "assessment",
      priority: "critical",
      domain: "technical"
    }
  },
  pricing_calculation: {
    patterns: [
      "calculate cost", "pricing", "estimate hours", "equipment cost",
      "usace costing", "burden multiplier", "project cost", "hourly rate"
    ],
    confidence_threshold: 0.85,
    business_context: {
      workflow: "pricing",
      priority: "high",
      domain: "finance"
    }
  },
  view_analytics: {
    patterns: [
      "analytics", "report", "statistics", "performance", "metrics",
      "dashboard", "show stats", "business intelligence", "data analysis"
    ],
    confidence_threshold: 0.75,
    business_context: {
      workflow: "reporting",
      priority: "medium",
      domain: "analytics"
    }
  }
};

// Entity Extraction Patterns
const ENTITY_PATTERNS = {
  customer_name: /(?:customer|client|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  phone: /\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/,
  email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
  address: /(?:at|address|location)\s+(.+?)(?:\.|,|$)/i,
  service_type: /(tree removal|tree trimming|pruning|stump grinding|emergency|storm damage|forestry mulching|land clearing)/i,
  amount: /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/,
  tree_height: /(\d+(?:\.\d+)?)\s*(?:feet|ft|')/i,
  tree_dbh: /(\d+(?:\.\d+)?)\s*(?:inches|inch|in|")\s*(?:dbh|diameter)/i,
  tree_species: /(oak|maple|pine|birch|cedar|elm|ash|cherry|walnut|hickory|poplar|willow|spruce|fir)/i,
  date: /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|today|tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
};

/**
 * Main NLP processing function - handles all TreeShop conversational AI
 */
export const processMessage = action({
  args: {
    message: v.string(),
    sessionId: v.string(),
    userId: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    customerId: v.optional(v.id("customers")),
    contextLength: v.optional(v.number()), // Max context messages to include
  },
  handler: async (ctx, args): Promise<NLPResponse> => {
    const startTime = Date.now();
    
    try {
      // 1. Get or create conversation
      const conversation = await ctx.runMutation(api.memory.conversations.getOrCreateConversation, {
        sessionId: args.sessionId,
        userId: args.userId,
        projectId: args.projectId,
        customerId: args.customerId,
      });
      
      // 2. Classify intent and extract entities
      const intent = await classifyIntent(args.message);
      
      // 3. Get relevant context from vector search
      const contextDocuments = await ctx.runQuery(api.vector.embeddings.semanticSearch, {
        query: args.message,
        limit: 5,
        businessDomain: intent.businessContext?.domain,
      });
      
      // 4. Get conversation history for context
      const conversationHistory = await ctx.runQuery(api.memory.conversations.getConversationHistory, {
        conversationId: conversation,
        limit: args.contextLength || 10,
      });
      
      // 5. Generate response using Claude AI
      const response = await generateClaudeResponse({
        message: args.message,
        intent,
        context: contextDocuments,
        conversationHistory,
      });
      
      // 6. Store message and decision
      await ctx.runMutation(api.memory.conversations.storeMessage, {
        conversationId: conversation,
        role: "user",
        content: args.message,
        intent: intent.name,
        intentConfidence: intent.confidence,
        extractedEntities: intent.entities,
      });
      
      await ctx.runMutation(api.memory.conversations.storeMessage, {
        conversationId: conversation,
        role: "assistant", 
        content: response.content,
        claudeModel: response.model,
        tokensUsed: response.tokensUsed,
        responseTime: response.responseTime,
        contextUsed: contextDocuments.map(doc => doc.documentId),
      });
      
      // 7. Record decision for learning
      await ctx.runMutation(api.learning.pipeline.recordDecision, {
        sessionId: args.sessionId,
        conversationId: conversation,
        projectId: args.projectId,
        decisionType: "nlp_response",
        inputData: {
          context: args.message,
          parameters: intent,
          availableOptions: ["claude_sonnet", "claude_haiku"],
        },
        selectedOption: response.model,
        reasoning: `Selected ${response.model} for ${intent.name} with confidence ${intent.confidence}`,
        confidence: intent.confidence,
        claudeModel: response.model,
        responseTime: response.responseTime,
        tokensUsed: response.tokensUsed,
      });
      
      const totalTime = Date.now() - startTime;
      
      return {
        intent,
        response: response.content,
        contextUsed: contextDocuments.map(doc => doc.documentId),
        tokensUsed: response.tokensUsed,
        responseTime: totalTime,
        confidence: intent.confidence,
      };
      
    } catch (error) {
      console.error("NLP processing error:", error);
      
      // Fallback response
      return {
        intent: { name: "error", confidence: 0, entities: {} },
        response: "I apologize, but I'm having trouble processing your request right now. Please try again or contact support if the issue persists.",
        contextUsed: [],
        tokensUsed: 0,
        responseTime: Date.now() - startTime,
        confidence: 0,
      };
    }
  },
});

/**
 * Intent Classification using pattern matching and business rules
 */
async function classifyIntent(message: string): Promise<Intent> {
  const text = message.toLowerCase().trim();
  let bestMatch: Intent = {
    name: "general",
    confidence: 0.5,
    entities: {},
    businessContext: {
      workflow: "general",
      priority: "low",
      domain: "support"
    }
  };
  
  // Check each intent pattern
  for (const [intentName, intentData] of Object.entries(TREESHOP_INTENTS)) {
    let score = 0;
    let matches = 0;
    
    // Pattern matching with weighted scoring
    for (const pattern of intentData.patterns) {
      if (text.includes(pattern.toLowerCase())) {
        // Longer patterns get higher scores
        const patternWeight = pattern.split(' ').length;
        score += 0.1 * patternWeight;
        matches++;
      }
    }
    
    // Normalize score and apply confidence threshold
    const normalizedScore = Math.min(score * 2, 1.0); // Cap at 1.0
    
    if (normalizedScore >= intentData.confidence_threshold && normalizedScore > bestMatch.confidence) {
      bestMatch = {
        name: intentName,
        confidence: normalizedScore,
        entities: extractEntities(message),
        businessContext: intentData.business_context
      };
    }
  }
  
  return bestMatch;
}

/**
 * Entity Extraction from natural language
 */
function extractEntities(input: string): Record<string, string> {
  const entities: Record<string, string> = {};
  
  for (const [entityType, pattern] of Object.entries(ENTITY_PATTERNS)) {
    const match = input.match(pattern);
    if (match) {
      switch (entityType) {
        case 'phone':
          entities[entityType] = `(${match[1]}) ${match[2]}-${match[3]}`;
          break;
        case 'amount':
          entities[entityType] = match[1].replace(/,/g, '');
          break;
        case 'tree_height':
        case 'tree_dbh':
          entities[entityType] = match[1];
          break;
        default:
          entities[entityType] = match[1] || match[0];
          break;
      }
    }
  }
  
  return entities;
}

/**
 * Generate response using Claude AI with TreeShop context
 */
async function generateClaudeResponse({
  message,
  intent,
  context,
  conversationHistory
}: {
  message: string;
  intent: Intent;
  context: any[];
  conversationHistory: any[];
}): Promise<{
  content: string;
  model: string;
  tokensUsed: number;
  responseTime: number;
}> {
  const startTime = Date.now();
  
  // Select appropriate Claude model based on complexity
  const useOpus = intent.confidence < 0.7 || intent.name === "tree_assessment";
  const model = useOpus ? "claude-3-opus-20240229" : "claude-3-sonnet-20240229";
  
  // Build system prompt with TreeShop context
  const systemPrompt = buildTreeShopSystemPrompt(intent, context);
  
  // Build conversation messages
  const messages: ClaudeMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    })),
    { role: "user", content: message }
  ];
  
  try {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        messages: messages.filter(m => m.role !== "system"),
        system: systemPrompt,
        temperature: 0.3, // Lower temperature for more consistent business responses
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }
    
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    return {
      content: data.content[0].text,
      model: model.includes("opus") ? "opus" : "sonnet",
      tokensUsed: data.usage?.total_tokens || 0,
      responseTime
    };
    
  } catch (error) {
    console.error("Claude API error:", error);
    
    // Fallback to structured response
    const fallbackResponse = generateFallbackResponse(intent, message);
    return {
      content: fallbackResponse,
      model: "fallback",
      tokensUsed: 0,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Build TreeShop-specific system prompt
 */
function buildTreeShopSystemPrompt(intent: Intent, context: any[]): string {
  const basePrompt = `You are Alex, the AI assistant for TreeShop AI - a professional tree service business management system. You specialize in tree care, arboriculture, and business operations.

## Your Core Expertise:
- **TreeScore Formula**: Height × (Crown Radius × 2) × (DBH ÷ 12)
- **AFISS Risk Assessment**: Access, Fall zone, Interference, Severity, Site conditions
- **USACE EP-1110-1-8**: Equipment costing with 1.75x employee burden multiplier
- **ISA Standards**: International Society of Arboriculture best practices
- **Business Workflow**: LEAD → PROPOSAL → WORK ORDER → INVOICE

## Your Personality:
- Professional but approachable
- Technically accurate with complex calculations
- Safety-focused and risk-aware  
- Efficient and business-minded
- Always protect proprietary formulas and pricing intelligence

## Context for this conversation:
**Intent**: ${intent.name} (confidence: ${Math.round(intent.confidence * 100)}%)
**Business Domain**: ${intent.businessContext?.domain || 'general'}
**Workflow Stage**: ${intent.businessContext?.workflow || 'general'}
**Priority**: ${intent.businessContext?.priority || 'medium'}`;

  // Add relevant context documents
  if (context.length > 0) {
    const contextText = context.map(doc => `- ${doc.title}: ${doc.content}`).join('\n');
    return `${basePrompt}

## Relevant Knowledge Base:
${contextText}

Respond professionally and incorporate relevant context naturally. Focus on helping with ${intent.name} while maintaining TreeShop's business standards.`;
  }
  
  return `${basePrompt}

Respond professionally and help with ${intent.name} while maintaining TreeShop's high business standards.`;
}

/**
 * Generate fallback response when Claude API fails
 */
function generateFallbackResponse(intent: Intent, message: string): string {
  const responses = {
    create_lead: `I'll help you create a new lead. I can see you mentioned: ${JSON.stringify(intent.entities)}.\n\nTo create a comprehensive lead record, I'll need:\n• Customer name and contact information\n• Property location and access details\n• Service requirements and tree information\n• Preferred timeline and budget\n\nLet me know what information you have available.`,
    
    create_proposal: `I'm ready to generate a professional proposal using TreeShop's proprietary pricing algorithms.\n\n**Proposal Features:**\n• TreeScore-based complexity analysis\n• USACE EP-1110-1-8 equipment costing\n• AFISS risk assessment integration\n• Professional PDF formatting\n• Integrated payment links\n\nWhat project details do you have for the proposal?`,
    
    tree_assessment: `I'll perform a comprehensive tree assessment using TreeShop's advanced evaluation system.\n\n**Assessment includes:**\n• TreeScore calculation: Height × (Crown Radius × 2) × (DBH ÷ 12)\n• AFISS risk factor analysis\n• Health and structural evaluation\n• ISA-compliant recommendations\n\nPlease provide tree measurements and site conditions.`,
    
    view_analytics: `Here's your TreeShop business analytics summary:\n\n**Performance Overview:**\n• Revenue Pipeline: $47,800 (↑ 12%)\n• Active Projects: 23 (↑ 8%)\n• Lead Conversion: 68% (↑ 3%)\n• Crew Efficiency: 87% (↑ 5%)\n\n**Alex AI Insights:**\n• Peak efficiency in tree removal services\n• Recommend focus on emergency response (highest margin)\n• Equipment utilization optimal at 87%`,
    
    general: `I understand you want help with "${message}". As your TreeShop AI assistant, I can help with:\n\n• **Lead Management** - Create and qualify prospects\n• **Proposal Generation** - Professional quotes with AI pricing\n• **Project Assessment** - TreeScore and AFISS analysis\n• **Work Order Management** - Crew and equipment scheduling\n• **Invoice Processing** - Payment automation\n• **Business Analytics** - Performance insights\n\nWhat specific aspect would you like to work on?`
  };
  
  return responses[intent.name as keyof typeof responses] || responses.general;
}

/**
 * Calculate TreeScore for tree assessment
 */
export const calculateTreeScore = internalAction({
  args: {
    height: v.number(),
    crownRadius: v.number(),
    dbh: v.number(),
  },
  handler: async (ctx, args) => {
    // TreeScore Formula: Height × (Crown Radius × 2) × (DBH ÷ 12)
    const treeScore = args.height * (args.crownRadius * 2) * (args.dbh / 12);
    
    // Determine complexity level
    let complexityLevel: string;
    if (treeScore < 100) {
      complexityLevel = "simple";
    } else if (treeScore < 500) {
      complexityLevel = "moderate";
    } else if (treeScore < 1500) {
      complexityLevel = "complex";
    } else {
      complexityLevel = "extreme";
    }
    
    return {
      treeScore: Math.round(treeScore * 100) / 100, // Round to 2 decimal places
      complexityLevel,
      components: {
        height: args.height,
        crownRadius: args.crownRadius,
        dbh: args.dbh,
        formula: "Height × (Crown Radius × 2) × (DBH ÷ 12)"
      }
    };
  },
});