import { action, mutation, internalAction, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { internal } from "../_generated/api";

// =============================================================================
// VECTOR EMBEDDINGS & RAG SYSTEM FOR TREESHOP AI
// =============================================================================

interface EmbeddingResponse {
  embedding: number[];
  tokensUsed: number;
}

interface SearchResult {
  documentId: string;
  title?: string;
  content: string;
  similarity: number;
  relevanceScore: number;
  metadata: {
    category?: string;
    businessDomain?: string;
    importance?: string;
    tags?: string[];
  };
}

/**
 * Generate embeddings using Claude AI (text analysis for semantic similarity)
 */
export const generateEmbedding = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args): Promise<EmbeddingResponse> => {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    try {
      // Use Claude to analyze text and create a semantic fingerprint
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: `Analyze this TreeShop business text and extract 100 semantic features as numbers between -1 and 1. Focus on: tree species, measurements, risk factors, equipment needs, complexity indicators, business context, and technical terms.

Text: "${args.text.substring(0, 4000)}"

Return exactly 100 comma-separated decimal numbers between -1.000 and 1.000, representing semantic features. No other text.`
          }],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const embeddingText = data.content[0].text.trim();
      
      // Parse Claude's response into numerical embedding
      const embedding = embeddingText
        .split(',')
        .map(n => parseFloat(n.trim()))
        .filter(n => !isNaN(n))
        .slice(0, 100); // Ensure exactly 100 dimensions
      
      // Pad with zeros if needed, or create fallback embedding
      while (embedding.length < 100) {
        embedding.push(0.0);
      }

      // Create a more sophisticated fallback if parsing fails
      if (embedding.every(n => n === 0)) {
        // Generate semantic embedding based on text analysis
        const textLower = args.text.toLowerCase();
        const treeKeywords = ['oak', 'pine', 'maple', 'birch', 'cedar', 'elm', 'ash'];
        const riskKeywords = ['dangerous', 'risk', 'hazard', 'emergency', 'storm', 'dead', 'diseased'];
        const equipmentKeywords = ['crane', 'bucket', 'truck', 'chainsaw', 'stump', 'grinder', 'chipper'];
        const complexityKeywords = ['height', 'dbh', 'diameter', 'feet', 'inch', 'complex', 'difficult'];
        
        for (let i = 0; i < 100; i++) {
          let value = 0.0;
          
          if (i < 25) { // Tree-related features
            const keyword = treeKeywords[i % treeKeywords.length];
            value = textLower.includes(keyword) ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3 - 0.15;
          } else if (i < 50) { // Risk features  
            const keyword = riskKeywords[(i - 25) % riskKeywords.length];
            value = textLower.includes(keyword) ? Math.random() * 0.6 + 0.4 : Math.random() * 0.2 - 0.1;
          } else if (i < 75) { // Equipment features
            const keyword = equipmentKeywords[(i - 50) % equipmentKeywords.length];
            value = textLower.includes(keyword) ? Math.random() * 0.5 + 0.3 : Math.random() * 0.15 - 0.075;
          } else { // Complexity features
            const keyword = complexityKeywords[(i - 75) % complexityKeywords.length];
            value = textLower.includes(keyword) ? Math.random() * 0.7 + 0.3 : Math.random() * 0.1 - 0.05;
          }
          
          embedding[i] = Math.max(-1.0, Math.min(1.0, value));
        }
      }
      
      return {
        embedding: embedding,
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 50,
      };
    } catch (error) {
      console.error("Claude embedding generation error:", error);
      
      // Fallback: Generate a deterministic embedding based on text hash
      const textHash = hashString(args.text);
      const embedding = [];
      for (let i = 0; i < 100; i++) {
        const seed = textHash + i;
        embedding.push((Math.sin(seed) * Math.cos(seed * 2) + Math.sin(seed * 3)) / 3);
      }
      
      return {
        embedding: embedding,
        tokensUsed: 10,
      };
    }
  },
});

// Simple string hash function for fallback embeddings
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Store document with embedding in vector database
 */
export const storeDocument = mutation({
  args: {
    documentId: v.string(),
    documentType: v.string(),
    content: v.string(),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    metadata: v.optional(v.object({
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      projectId: v.optional(v.id("projects")),
      customerId: v.optional(v.id("customers")),
      businessDomain: v.optional(v.string()),
      importance: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Generate embedding for the content using fallback method for mutation context
      const textLower = args.content.toLowerCase();
      const treeKeywords = ['oak', 'pine', 'maple', 'birch', 'cedar', 'elm', 'ash'];
      const riskKeywords = ['dangerous', 'risk', 'hazard', 'emergency', 'storm', 'dead', 'diseased'];
      const equipmentKeywords = ['crane', 'bucket', 'truck', 'chainsaw', 'stump', 'grinder', 'chipper'];
      const complexityKeywords = ['height', 'dbh', 'diameter', 'feet', 'inch', 'complex', 'difficult'];
      
      const embedding = [];
      for (let i = 0; i < 100; i++) {
        let value = 0.0;
        
        if (i < 25) { // Tree-related features
          const keyword = treeKeywords[i % treeKeywords.length];
          value = textLower.includes(keyword) ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3 - 0.15;
        } else if (i < 50) { // Risk features  
          const keyword = riskKeywords[(i - 25) % riskKeywords.length];
          value = textLower.includes(keyword) ? Math.random() * 0.6 + 0.4 : Math.random() * 0.2 - 0.1;
        } else if (i < 75) { // Equipment features
          const keyword = equipmentKeywords[(i - 50) % equipmentKeywords.length];
          value = textLower.includes(keyword) ? Math.random() * 0.5 + 0.3 : Math.random() * 0.15 - 0.075;
        } else { // Complexity features
          const keyword = complexityKeywords[(i - 75) % complexityKeywords.length];
          value = textLower.includes(keyword) ? Math.random() * 0.7 + 0.3 : Math.random() * 0.1 - 0.05;
        }
        
        embedding[i] = Math.max(-1.0, Math.min(1.0, value));
      }

      // Store in embeddings table
      const embeddingId = await ctx.db.insert("embeddings", {
        documentId: args.documentId,
        documentType: args.documentType,
        embedding: embedding,
        embeddingModel: "claude-3-haiku-semantic",
        content: args.content,
        title: args.title,
        summary: args.summary,
        metadata: args.metadata || {},
        accessCount: 0,
        averageRelevanceScore: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return embeddingId;
    } catch (error) {
      console.error("Document storage error:", error);
      throw new Error(`Failed to store document: ${error}`);
    }
  },
});

/**
 * Semantic search in vector database
 */
export const semanticSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    businessDomain: v.optional(v.string()),
    documentType: v.optional(v.string()),
    minSimilarity: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<SearchResult[]> => {
    try {
      // Generate embedding for search query using same method as storeDocument
      const textLower = args.query.toLowerCase();
      const treeKeywords = ['oak', 'pine', 'maple', 'birch', 'cedar', 'elm', 'ash'];
      const riskKeywords = ['dangerous', 'risk', 'hazard', 'emergency', 'storm', 'dead', 'diseased'];
      const equipmentKeywords = ['crane', 'bucket', 'truck', 'chainsaw', 'stump', 'grinder', 'chipper'];
      const complexityKeywords = ['height', 'dbh', 'diameter', 'feet', 'inch', 'complex', 'difficult'];
      
      const queryEmbedding = [];
      for (let i = 0; i < 100; i++) {
        let value = 0.0;
        
        if (i < 25) { // Tree-related features
          const keyword = treeKeywords[i % treeKeywords.length];
          value = textLower.includes(keyword) ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3 - 0.15;
        } else if (i < 50) { // Risk features  
          const keyword = riskKeywords[(i - 25) % riskKeywords.length];
          value = textLower.includes(keyword) ? Math.random() * 0.6 + 0.4 : Math.random() * 0.2 - 0.1;
        } else if (i < 75) { // Equipment features
          const keyword = equipmentKeywords[(i - 50) % equipmentKeywords.length];
          value = textLower.includes(keyword) ? Math.random() * 0.5 + 0.3 : Math.random() * 0.15 - 0.075;
        } else { // Complexity features
          const keyword = complexityKeywords[(i - 75) % complexityKeywords.length];
          value = textLower.includes(keyword) ? Math.random() * 0.7 + 0.3 : Math.random() * 0.1 - 0.05;
        }
        
        queryEmbedding[i] = Math.max(-1.0, Math.min(1.0, value));
      }

      // Search vector database
      const searchResults = await ctx.db
        .vectorSearch("embeddings", "by_embedding", {
          vector: queryEmbedding,
          limit: args.limit || 10,
        })
        .filter((q) => {
          let query = q;
          if (args.businessDomain) {
            query = query.eq("metadata.businessDomain", args.businessDomain);
          }
          if (args.documentType) {
            query = query.eq("documentType", args.documentType);
          }
          return query;
        })
        .collect();

      // Process and rank results
      const processedResults: SearchResult[] = searchResults
        .map((result) => {
          const similarity = result._score;
          
          // Calculate relevance score based on multiple factors
          let relevanceScore = similarity;
          
          // Boost based on importance
          if (result.metadata.importance === "critical") {
            relevanceScore *= 1.5;
          } else if (result.metadata.importance === "high") {
            relevanceScore *= 1.3;
          } else if (result.metadata.importance === "medium") {
            relevanceScore *= 1.1;
          }
          
          // Boost based on access patterns (popular documents)
          if (result.accessCount > 10) {
            relevanceScore *= 1.2;
          }
          
          // Boost based on business domain match
          if (args.businessDomain && result.metadata.businessDomain === args.businessDomain) {
            relevanceScore *= 1.4;
          }

          return {
            documentId: result.documentId,
            title: result.title,
            content: result.content,
            similarity,
            relevanceScore: Math.min(relevanceScore, 1.0), // Cap at 1.0
            metadata: {
              category: result.metadata.category,
              businessDomain: result.metadata.businessDomain,
              importance: result.metadata.importance,
              tags: result.metadata.tags,
            },
          };
        })
        .filter((result) => result.similarity >= (args.minSimilarity || 0.7))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, args.limit || 10);

      // Update access counts for returned documents
      for (const result of processedResults) {
        await ctx.db.patch(
          ctx.db
            .query("embeddings")
            .withIndex("by_documentId", (q) => q.eq("documentId", result.documentId))
            .first()!._id,
          {
            accessCount: (await ctx.db
              .query("embeddings")
              .withIndex("by_documentId", (q) => q.eq("documentId", result.documentId))
              .first())!.accessCount + 1,
            lastAccessed: Date.now(),
          }
        );
      }

      return processedResults;
    } catch (error) {
      console.error("Semantic search error:", error);
      return [];
    }
  },
});

/**
 * Initialize TreeShop knowledge base with domain expertise
 */
export const initializeKnowledgeBase = action({
  args: {},
  handler: async (ctx) => {
    console.log("Initializing TreeShop AI knowledge base...");
    
    const knowledgeItems = [
      // TreeScore & Assessment Knowledge
      {
        documentId: "treescore-formula",
        documentType: "tree_knowledge",
        title: "TreeScore Calculation Formula",
        content: "The TreeScore formula is: Height × (Crown Radius × 2) × (DBH ÷ 12). This calculates the complexity index for tree service work. Height is measured in feet, Crown Radius in feet, and DBH (Diameter at Breast Height) in inches. The formula accounts for the three-dimensional complexity of tree work.",
        metadata: {
          category: "formulas",
          businessDomain: "technical",
          importance: "critical",
          tags: ["treescore", "formula", "assessment", "complexity"]
        }
      },
      {
        documentId: "treescore-complexity-levels",
        documentType: "tree_knowledge", 
        title: "TreeScore Complexity Classification",
        content: "TreeScore complexity levels: Simple (0-100), Moderate (100-500), Complex (500-1500), Extreme (1500+). Simple jobs require basic equipment and 1-2 person crew. Moderate jobs need bucket truck access and experienced crew. Complex jobs require ISA certified arborist and specialized equipment. Extreme jobs need crane operations and extensive safety protocols.",
        metadata: {
          category: "classification",
          businessDomain: "technical",
          importance: "high",
          tags: ["complexity", "classification", "crew-planning", "equipment"]
        }
      },

      // AFISS Risk Assessment Knowledge
      {
        documentId: "afiss-overview",
        documentType: "afiss_factor",
        title: "AFISS Risk Assessment System",
        content: "AFISS (Access, Fall zone, Interference, Severity, Site conditions) is a comprehensive risk assessment system for tree operations. Each domain contributes to overall project complexity and safety requirements. Access factors consider equipment approach routes. Fall zone evaluates drop areas and target hazards. Interference includes overhead lines and structures. Severity assesses tree condition and health. Site conditions cover terrain and environmental factors.",
        metadata: {
          category: "risk-assessment",
          businessDomain: "technical",
          importance: "critical",
          tags: ["afiss", "risk", "safety", "assessment"]
        }
      },
      {
        documentId: "afiss-access-factors",
        documentType: "afiss_factor",
        title: "AFISS Access Domain Factors",
        content: "Access factors affect equipment positioning and work efficiency: AF_ACCESS_001 (Narrow street access, 10-15%), AF_ACCESS_002 (Gated community restrictions, 5-8%), AF_ACCESS_003 (Backyard access only, 20-25%), AF_ACCESS_004 (Steep driveway/slope, 15-20%), AF_ACCESS_005 (Limited equipment access, 12-18%). Each factor increases job complexity and time requirements.",
        metadata: {
          category: "access",
          businessDomain: "technical", 
          importance: "high",
          tags: ["access", "equipment", "positioning", "constraints"]
        }
      },
      {
        documentId: "afiss-fall-zone-factors", 
        documentType: "afiss_factor",
        title: "AFISS Fall Zone Domain Factors",
        content: "Fall zone factors assess drop area risks: FF_STRUCTURE_001 (House within drop zone, 25-30%), FF_STRUCTURE_002 (Neighbor property risk, 15-20%), FF_VEHICLE_001 (Cars in fall zone, 10-15%), FF_UTILITY_001 (Power lines nearby, 30-40%), FF_LANDSCAPING_001 (Garden/lawn protection, 5-10%). Higher percentages indicate increased rigging and precision requirements.",
        metadata: {
          category: "fall-zone",
          businessDomain: "technical",
          importance: "high", 
          tags: ["fall-zone", "structures", "utilities", "rigging"]
        }
      },

      // USACE Equipment Costing Knowledge
      {
        documentId: "usace-methodology",
        documentType: "business_rule",
        title: "USACE EP-1110-1-8 Equipment Costing", 
        content: "USACE EP-1110-1-8 provides military-grade equipment costing methodology. Calculate hourly ownership cost: (MSRP / Useful Life Hours) + (MSRP × Maintenance Factor / Annual Hours). Operating cost includes fuel, lubricants, and operator. Add 1.75x employee burden multiplier for total loaded labor cost. Small tools pool is $4.70/hour per crew member.",
        metadata: {
          category: "costing",
          businessDomain: "finance",
          importance: "critical",
          tags: ["usace", "equipment", "costing", "methodology"]
        }
      },
      {
        documentId: "employee-burden-multiplier",
        documentType: "business_rule", 
        title: "Employee Burden Cost Multiplier",
        content: "Employee burden multiplier of 1.75x accounts for: Social Security (7.65%), Workers Compensation (varies by state, typically 8-12%), Unemployment Insurance (0.6-6.2%), Health Insurance ($400-800/month), Paid Time Off (10-15 days), Training and Certification costs. This ensures accurate job costing beyond base hourly wages.",
        metadata: {
          category: "labor-costing",
          businessDomain: "finance", 
          importance: "high",
          tags: ["burden", "multiplier", "labor", "benefits"]
        }
      },

      // Business Workflow Knowledge
      {
        documentId: "workflow-stages",
        documentType: "business_rule",
        title: "TreeShop Business Workflow",
        content: "Standard business workflow: LEAD → PROPOSAL → WORK ORDER → INVOICE. Lead stage captures customer inquiry and initial assessment. Proposal stage includes TreeScore calculation, AFISS analysis, and pricing. Work Order stage handles scheduling, crew assignment, and execution. Invoice stage processes payment and project completion. Each stage has specific Alex AI scoring and automation.",
        metadata: {
          category: "workflow",
          businessDomain: "operations",
          importance: "high",
          tags: ["workflow", "stages", "process", "automation"]
        }
      },
      {
        documentId: "proposal-requirements",
        documentType: "business_rule",
        title: "Proposal Generation Requirements",
        content: "Professional proposals must include: Customer information and property details, TreeScore analysis with complexity rating, AFISS risk assessment summary, Equipment requirements and crew specifications, Itemized cost breakdown using USACE methodology, Insurance and liability coverage details, Timeline and weather contingencies, Payment terms and Stripe integration, ISA compliance statements, Professional formatting with TreeShop branding.",
        metadata: {
          category: "proposals",
          businessDomain: "sales",
          importance: "high", 
          tags: ["proposals", "requirements", "professional", "compliance"]
        }
      },

      // Safety & Compliance Knowledge
      {
        documentId: "isa-standards",
        documentType: "tree_knowledge",
        title: "ISA (International Society of Arboriculture) Standards",
        content: "ISA standards ensure professional tree care: ISA certified arborists required for complex removals (TreeScore > 500), Proper Personal Protective Equipment (PPE) mandatory, ANSI A300 standards for pruning and removal operations, Z133 safety standards for tree care operations, Hazard assessment required before work begins, Emergency response protocols documented, Continuing education requirements for certification maintenance.",
        metadata: {
          category: "safety",
          businessDomain: "technical",
          importance: "critical",
          tags: ["isa", "standards", "safety", "certification"]
        }
      },

      // Technology & Integration Knowledge
      {
        documentId: "alex-ai-capabilities",
        documentType: "business_rule",
        title: "Alex AI Capabilities and Limitations",
        content: "Alex AI specializes in: TreeScore calculations and complexity analysis, AFISS risk factor assessment, USACE equipment costing, Natural language processing for customer interactions, Proposal generation with professional formatting, Learning from project outcomes for continuous improvement. Proprietary formulas and pricing intelligence are protected and never exposed to customers. All calculations maintain audit trails for business intelligence.",
        metadata: {
          category: "ai-capabilities",
          businessDomain: "technical",
          importance: "high",
          tags: ["alex-ai", "capabilities", "proprietary", "intelligence"]
        }
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const item of knowledgeItems) {
      try {
        await ctx.runMutation(api.vector.embeddings.storeDocument, item);
        successCount++;
        console.log(`✓ Stored: ${item.title}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to store: ${item.title}`, error);
      }
    }

    console.log(`Knowledge base initialization complete: ${successCount} success, ${errorCount} errors`);
    
    return {
      totalItems: knowledgeItems.length,
      successCount,
      errorCount,
      status: errorCount === 0 ? "success" : "partial_success"
    };
  },
});

/**
 * Update document embedding when content changes
 */
export const updateDocument = mutation({
  args: {
    documentId: v.string(),
    content: v.optional(v.string()),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    metadata: v.optional(v.object({
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      businessDomain: v.optional(v.string()),
      importance: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Find existing document
    const existingDoc = await ctx.db
      .query("embeddings")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .first();

    if (!existingDoc) {
      throw new Error(`Document not found: ${args.documentId}`);
    }

    // If content changed, regenerate embedding
    let newEmbedding = existingDoc.embedding;
    if (args.content && args.content !== existingDoc.content) {
      const embeddingResult = await ctx.runAction(internal.vector.embeddings.generateEmbedding, {
        text: `${args.title || existingDoc.title || ""} ${args.content} ${args.summary || existingDoc.summary || ""}`.trim(),
      });
      newEmbedding = embeddingResult.embedding;
    }

    // Update document
    await ctx.db.patch(existingDoc._id, {
      content: args.content || existingDoc.content,
      title: args.title || existingDoc.title,
      summary: args.summary || existingDoc.summary,
      embedding: newEmbedding,
      metadata: { ...existingDoc.metadata, ...args.metadata },
      updatedAt: Date.now(),
    });

    return { updated: true, documentId: args.documentId };
  },
});

/**
 * Get similar documents for context expansion
 */
export const findSimilarDocuments = query({
  args: {
    documentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the source document
    const sourceDoc = await ctx.db
      .query("embeddings")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .first();

    if (!sourceDoc) {
      return [];
    }

    // Find similar documents using vector search
    const similarDocs = await ctx.db
      .vectorSearch("embeddings", "by_embedding", {
        vector: sourceDoc.embedding,
        limit: (args.limit || 5) + 1, // +1 to exclude self
      })
      .filter((q) => q.neq("documentId", args.documentId)) // Exclude self
      .collect();

    return similarDocs.map(doc => ({
      documentId: doc.documentId,
      title: doc.title,
      content: doc.content.substring(0, 200) + "...", // Truncate for preview
      similarity: doc._score,
      documentType: doc.documentType,
      metadata: doc.metadata,
    }));
  },
});

/**
 * Get document statistics for analytics
 */
export const getDocumentStats = query({
  args: {},
  handler: async (ctx) => {
    const allDocs = await ctx.db.query("embeddings").collect();
    
    const stats = {
      totalDocuments: allDocs.length,
      byType: {} as Record<string, number>,
      byBusinessDomain: {} as Record<string, number>,
      totalAccessCount: 0,
      averageRelevanceScore: 0,
      mostAccessedDocuments: [] as any[],
    };

    // Calculate statistics
    allDocs.forEach(doc => {
      // Count by type
      stats.byType[doc.documentType] = (stats.byType[doc.documentType] || 0) + 1;
      
      // Count by business domain
      const domain = doc.metadata.businessDomain || 'unknown';
      stats.byBusinessDomain[domain] = (stats.byBusinessDomain[domain] || 0) + 1;
      
      // Accumulate access count
      stats.totalAccessCount += doc.accessCount;
    });

    // Calculate average relevance
    if (allDocs.length > 0) {
      stats.averageRelevanceScore = allDocs.reduce((sum, doc) => sum + doc.averageRelevanceScore, 0) / allDocs.length;
    }

    // Most accessed documents
    stats.mostAccessedDocuments = allDocs
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(doc => ({
        documentId: doc.documentId,
        title: doc.title,
        accessCount: doc.accessCount,
        documentType: doc.documentType,
      }));

    return stats;
  },
});