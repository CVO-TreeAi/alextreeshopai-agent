/**
 * TreeAI Customer Alex SDK - Restricted Version for Customer-Facing Applications
 * Limited, safe interface for lead generation and customer interaction
 */

class CustomerAlex {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'https://tremendous-whale-894.convex.site/api';
    this.projectName = 'TreeShop-Customer-Portal';
    this.sessionId = options.sessionId || this.generateSessionId();
    this.timeout = options.timeout || 15000; // Shorter timeout for customers
  }

  generateSessionId() {
    return `customer-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Restricted chat interface for customer interactions
   * @param {string} message - Customer message
   * @param {Object} options - Optional parameters
   * @returns {Promise<CustomerResponse>}
   */
  async chat(message, options = {}) {
    // Filter out restricted topics before sending
    const filteredMessage = this.filterCustomerMessage(message);
    
    try {
      const response = await fetch(`${this.apiUrl}/customer-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: filteredMessage,
          sessionId: this.sessionId,
          customerContext: true, // Flag for customer-only responses
          restrictedMode: true
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error('Service temporarily unavailable');
      }

      const data = await response.json();
      return new CustomerResponse(data);
    } catch (error) {
      return new CustomerResponse({
        response: "I'm having trouble right now. Please try again or call us at (555) 123-4567 for immediate assistance.",
        intent: { name: 'error', confidence: 1.0 },
        sessionId: this.sessionId
      });
    }
  }

  /**
   * Filter customer messages for safety
   */
  filterCustomerMessage(message) {
    const restrictedTerms = [
      'revenue', 'profit', 'cost', 'margin', 'competitor', 'employee', 
      'salary', 'pricing strategy', 'business plan', 'financial'
    ];
    
    let filtered = message.toLowerCase();
    restrictedTerms.forEach(term => {
      if (filtered.includes(term)) {
        filtered = filtered.replace(new RegExp(term, 'gi'), '[business inquiry]');
      }
    });
    
    return filtered;
  }

  // =========================================================================
  // CUSTOMER-SPECIFIC METHODS
  // =========================================================================

  /**
   * Get a property assessment for customer
   * @param {Object} property - Property details
   */
  async assessProperty({ acres, treeType, access, location }) {
    const message = `I have ${acres} acres of ${treeType} trees at ${location} with ${access} access. What services do I need?`;
    return this.chat(message);
  }

  /**
   * Get service explanation
   * @param {string} service - Service type
   */
  async explainService(service) {
    const validServices = ['forestry mulching', 'land clearing', 'stump grinding'];
    if (!validServices.includes(service.toLowerCase())) {
      return new CustomerResponse({
        response: "I can help explain our forestry mulching, land clearing, or stump grinding services. Which would you like to know about?",
        intent: { name: 'service_clarification', confidence: 1.0 }
      });
    }
    
    const message = `Explain ${service} service for customers`;
    return this.chat(message);
  }

  /**
   * Get basic quote estimate
   * @param {Object} project - Project details  
   */
  async getQuoteEstimate({ service, acres, description, timeframe }) {
    const message = `Quote for ${service} on ${acres} acres: ${description}. Timeline: ${timeframe}`;
    return this.chat(message);
  }

  /**
   * FAQ responses
   * @param {string} question - Customer question
   */
  async askFAQ(question) {
    const message = `Customer FAQ: ${question}`;
    return this.chat(message);
  }

  /**
   * Schedule consultation request
   * @param {Object} details - Contact details
   */
  async requestConsultation({ name, phone, email, preferredTime, projectType }) {
    const message = `Schedule consultation for ${name} (${phone}) for ${projectType} project. Preferred time: ${preferredTime}`;
    return this.chat(message);
  }

  /**
   * Check service area
   * @param {string} location - Customer location
   */
  async checkServiceArea(location) {
    const message = `Do you service ${location} Florida?`;
    return this.chat(message);
  }

  /**
   * Get timeline estimate
   * @param {Object} project - Project scope
   */
  async getTimeline({ service, scope, season }) {
    const message = `How long does ${service} take for ${scope} project in ${season}?`;
    return this.chat(message);
  }

  // =========================================================================
  // SAFETY AND UTILITY METHODS
  // =========================================================================

  /**
   * Reset session for new customer
   */
  resetSession() {
    this.sessionId = this.generateSessionId();
    return this.sessionId;
  }

  /**
   * Check if service is available
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
}

/**
 * Customer-safe response wrapper
 */
class CustomerResponse {
  constructor(data) {
    this.raw = data;
    this.response = this.sanitizeResponse(data.response || '');
    this.intent = data.intent || { name: 'general', confidence: 0.5 };
    this.sessionId = data.sessionId;
    this.isQuote = this.response.includes('$') || this.response.includes('estimate');
    this.needsContact = this.response.includes('call') || this.response.includes('contact');
  }

  /**
   * Remove any sensitive business information from responses
   */
  sanitizeResponse(response) {
    // Remove any business-sensitive information
    const sanitized = response
      .replace(/profit|margin|cost\s+breakdown/gi, 'pricing')
      .replace(/employee|crew\s+pay/gi, 'team member')
      .replace(/competitor|competition/gi, 'other companies');
    
    return sanitized;
  }

  getText() {
    return this.response;
  }

  getIntent() {
    return this.intent?.name || 'general';
  }

  isQuoteResponse() {
    return this.isQuote;
  }

  needsHumanContact() {
    return this.needsContact;
  }

  extractPrice() {
    const priceMatch = this.response.match(/\$[\d,]+/);
    return priceMatch ? priceMatch[0] : null;
  }

  getRaw() {
    return this.raw;
  }
}

/**
 * Export for different environments
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CustomerAlex, CustomerResponse };
}

if (typeof window !== 'undefined') {
  window.CustomerAlex = CustomerAlex;
  window.CustomerResponse = CustomerResponse;
}

if (typeof define === 'function' && define.amd) {
  define([], function() {
    return { CustomerAlex, CustomerResponse };
  });
}