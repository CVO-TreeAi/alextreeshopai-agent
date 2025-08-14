/**
 * TreeAI Alex SDK - Universal Integration for All TreeAI Projects
 * Simple, powerful interface to Alex's business intelligence
 */

class TreeAIAlex {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'https://tremendous-whale-894.convex.site/api';
    this.projectName = options.projectName || 'TreeAI-Project';
    this.sessionId = options.sessionId || this.generateSessionId();
    this.timeout = options.timeout || 30000;
  }

  generateSessionId() {
    return `${this.projectName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Main chat interface - send any message to Alex
   * @param {string} message - Natural language message
   * @param {Object} options - Optional parameters
   * @returns {Promise<AlexResponse>}
   */
  async chat(message, options = {}) {
    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: options.sessionId || this.sessionId,
          projectId: options.projectId,
          userId: options.userId,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Alex API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return new AlexResponse(data);
    } catch (error) {
      throw new AlexError(`Failed to communicate with Alex: ${error.message}`, error);
    }
  }

  // =========================================================================
  // SPECIALIZED METHODS FOR COMMON TREEAI OPERATIONS
  // =========================================================================

  /**
   * Create a new lead with intelligent extraction
   * @param {string} customerInfo - Natural language customer info
   * @returns {Promise<AlexResponse>}
   */
  async createLead(customerInfo) {
    const message = `Create a new lead for ${customerInfo}`;
    return this.chat(message);
  }

  /**
   * Calculate TreeScore for pricing
   * @param {Object} measurements - Tree measurements
   * @returns {Promise<AlexResponse>}
   */
  async calculateTreeScore({ height, crownRadius, dbh, species = 'tree' }) {
    const message = `Calculate TreeScore for ${height}-foot ${species}, ${crownRadius}-foot crown radius, ${dbh}-inch DBH`;
    return this.chat(message);
  }

  /**
   * Generate professional proposal
   * @param {Object} project - Project details
   * @returns {Promise<AlexResponse>}
   */
  async generateProposal({ customer, treeScore, location, services = [] }) {
    const servicesText = services.length ? ` for ${services.join(', ')}` : '';
    const message = `Generate proposal for ${customer}${servicesText} with TreeScore ${treeScore} at ${location}`;
    return this.chat(message);
  }

  /**
   * Schedule work order
   * @param {Object} workOrder - Work order details
   * @returns {Promise<AlexResponse>}
   */
  async scheduleWork({ customer, date, services, crewSize = 3 }) {
    const message = `Schedule ${services} for ${customer} on ${date} with ${crewSize}-person crew`;
    return this.chat(message);
  }

  /**
   * Get business analytics
   * @param {string} timeframe - Optional timeframe (week, month, quarter)
   * @returns {Promise<AlexResponse>}
   */
  async getAnalytics(timeframe = 'month') {
    const message = `Show me ${timeframe} analytics and performance metrics`;
    return this.chat(message);
  }

  /**
   * Process invoice
   * @param {Object} invoice - Invoice details
   * @returns {Promise<AlexResponse>}
   */
  async createInvoice({ customer, amount, description, projectId }) {
    const message = `Create invoice for ${customer} - ${description} - $${amount}`;
    return this.chat(message, { projectId });
  }

  // =========================================================================
  // SPECIALIZED TREEAI PROJECT INTEGRATIONS
  // =========================================================================

  /**
   * Analyze drone survey data
   * @param {Object} droneData - Drone survey results
   * @returns {Promise<AlexResponse>}
   */
  async analyzeDroneSurvey({ treeCount, averageHeight, riskTrees, coordinates }) {
    const message = `Analyze drone survey: ${treeCount} trees, average height ${averageHeight}ft, ${riskTrees} high-risk trees at coordinates ${coordinates}`;
    return this.chat(message);
  }

  /**
   * ISA certification assessment
   * @param {Object} assessment - Student assessment data
   * @returns {Promise<AlexResponse>}
   */
  async assessISAStudent({ studentId, answers, practicalScore, topic }) {
    const message = `Assess ISA student ${studentId} on ${topic}: practical score ${practicalScore}/100, answers: ${JSON.stringify(answers)}`;
    return this.chat(message);
  }

  /**
   * Equipment maintenance prediction
   * @param {Object} equipment - Equipment data
   * @returns {Promise<AlexResponse>}
   */
  async predictMaintenance({ equipmentId, hoursUsed, lastService, model }) {
    const message = `Predict maintenance for ${model} equipment ${equipmentId}: ${hoursUsed} hours since last service on ${lastService}`;
    return this.chat(message);
  }

  /**
   * Risk assessment from any data source
   * @param {Object} riskData - Risk assessment data
   * @returns {Promise<AlexResponse>}
   */
  async assessRisk({ location, treeData, environmentalFactors, accessChallenges }) {
    const message = `AFISS risk assessment for ${location}: trees ${JSON.stringify(treeData)}, environment ${environmentalFactors}, access ${accessChallenges}`;
    return this.chat(message);
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Check Alex system status
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.apiUrl}/test`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reset session (start fresh conversation)
   */
  resetSession() {
    this.sessionId = this.generateSessionId();
    return this.sessionId;
  }

  /**
   * Get conversation history
   * @returns {Promise<Array>}
   */
  async getHistory() {
    try {
      const response = await fetch(`${this.apiUrl}/conversation/${this.sessionId}`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.warn('Could not retrieve conversation history:', error.message);
      return [];
    }
  }
}

/**
 * Alex Response wrapper with helpful methods
 */
class AlexResponse {
  constructor(data) {
    this.raw = data;
    this.response = data.response;
    this.intent = data.intent;
    this.sessionId = data.sessionId;
    this.timestamp = data.timestamp;
    this.entities = data.entities || {};
  }

  /**
   * Get clean text response
   */
  getText() {
    return this.response;
  }

  /**
   * Get detected intent
   */
  getIntent() {
    return this.intent?.name || 'unknown';
  }

  /**
   * Get confidence score
   */
  getConfidence() {
    return this.intent?.confidence || 0;
  }

  /**
   * Get extracted entities
   */
  getEntities() {
    return this.entities;
  }

  /**
   * Check if response contains specific data
   */
  contains(keyword) {
    return this.response.toLowerCase().includes(keyword.toLowerCase());
  }

  /**
   * Extract numerical values (prices, scores, etc.)
   */
  extractNumbers() {
    const numbers = this.response.match(/\$?[\d,]+\.?\d*/g);
    return numbers ? numbers.map(n => n.replace(/[$,]/g, '')) : [];
  }

  /**
   * Check if Alex is asking for more information
   */
  needsMoreInfo() {
    return this.response.includes('?') || this.response.toLowerCase().includes('need');
  }

  /**
   * Get full response data
   */
  getRaw() {
    return this.raw;
  }
}

/**
 * Alex Error wrapper
 */
class AlexError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'AlexError';
    this.originalError = originalError;
  }
}

// =========================================================================
// EXPORT FOR DIFFERENT ENVIRONMENTS
// =========================================================================

// Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TreeAIAlex, AlexResponse, AlexError };
}

// ES6 Modules
if (typeof exports !== 'undefined') {
  exports.TreeAIAlex = TreeAIAlex;
  exports.AlexResponse = AlexResponse;
  exports.AlexError = AlexError;
}

// Browser/Global
if (typeof window !== 'undefined') {
  window.TreeAIAlex = TreeAIAlex;
  window.AlexResponse = AlexResponse;
  window.AlexError = AlexError;
}

// AMD/RequireJS
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return { TreeAIAlex, AlexResponse, AlexError };
  });
}