/**
 * Next.js Lead Page Example with CustomerAlex Integration
 * Safe, restricted Alex for customer-facing lead generation
 */

'use client'; // Next.js 13+ App Router

import { useState, useEffect } from 'react';
import { CustomerAlex } from '@treeai/alex-sdk/customer-alex-sdk';

export default function LeadPage() {
  const [alex, setAlex] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leadData, setLeadData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    projectType: ''
  });

  // Initialize CustomerAlex
  useEffect(() => {
    const customerAlex = new CustomerAlex({
      sessionId: `lead-${Date.now()}`,
      timeout: 15000
    });
    setAlex(customerAlex);
    
    // Welcome message
    setChatHistory([{
      sender: 'alex',
      message: "Hi! I'm Alex, TreeShop's AI assistant. I can help you get a quote for tree services. What kind of tree work do you need?",
      timestamp: new Date()
    }]);
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !alex || isLoading) return;

    const userMessage = {
      sender: 'user',
      message: userInput,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await alex.chat(userInput);
      
      const alexMessage = {
        sender: 'alex',
        message: response.getText(),
        timestamp: new Date(),
        isQuote: response.isQuoteResponse(),
        needsContact: response.needsHumanContact()
      };

      setChatHistory(prev => [...prev, alexMessage]);

      // If Alex indicates this is a quote or needs contact, show lead form
      if (response.isQuoteResponse() || response.needsHumanContact()) {
        setShowLeadForm(true);
      }

    } catch (error) {
      const errorMessage = {
        sender: 'alex',
        message: "I'm having trouble right now. Please call us at (555) 123-4567 for immediate assistance.",
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const [showLeadForm, setShowLeadForm] = useState(false);

  const handleLeadFormSubmit = async (e) => {
    e.preventDefault();
    if (!alex) return;

    try {
      const consultation = await alex.requestConsultation({
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        preferredTime: 'ASAP',
        projectType: leadData.projectType
      });

      setChatHistory(prev => [...prev, {
        sender: 'alex',
        message: consultation.getText(),
        timestamp: new Date()
      }]);

      setShowLeadForm(false);
      setLeadData({ name: '', phone: '', email: '', location: '', projectType: '' });

    } catch (error) {
      alert('Sorry, there was an error submitting your information. Please call us at (555) 123-4567.');
    }
  };

  // Quick action handlers
  const handleQuickAction = async (action) => {
    if (!alex) return;
    
    setIsLoading(true);
    try {
      let response;
      
      switch (action) {
        case 'tree-removal':
          response = await alex.explainService('tree removal');
          break;
        case 'land-clearing':
          response = await alex.explainService('land clearing');
          break;
        case 'stump-grinding':
          response = await alex.explainService('stump grinding');
          break;
        case 'get-quote':
          setShowLeadForm(true);
          return;
        default:
          return;
      }

      setChatHistory(prev => [...prev, {
        sender: 'alex',
        message: response.getText(),
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Quick action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lead-page">
      <div className="hero-section">
        <h1>Get Your Tree Service Quote</h1>
        <p>Professional tree services in Florida. Chat with Alex to get started!</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.message}
                {msg.isQuote && (
                  <div className="quote-indicator">💰 Quote Available</div>
                )}
                {msg.needsContact && (
                  <button 
                    onClick={() => setShowLeadForm(true)}
                    className="contact-button"
                  >
                    Get My Quote
                  </button>
                )}
              </div>
              <div className="timestamp">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message alex loading">
              Alex is typing...
            </div>
          )}
        </div>

        <div className="quick-actions">
          <button onClick={() => handleQuickAction('tree-removal')}>
            Tree Removal
          </button>
          <button onClick={() => handleQuickAction('land-clearing')}>
            Land Clearing
          </button>
          <button onClick={() => handleQuickAction('stump-grinding')}>
            Stump Grinding
          </button>
          <button onClick={() => handleQuickAction('get-quote')}>
            Get Quote
          </button>
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about tree services..."
            disabled={isLoading}
          />
          <button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()}>
            Send
          </button>
        </div>
      </div>

      {showLeadForm && (
        <div className="lead-form-overlay">
          <div className="lead-form">
            <h3>Get Your Professional Quote</h3>
            <form onSubmit={handleLeadFormSubmit}>
              <input
                type="text"
                placeholder="Your Name"
                value={leadData.name}
                onChange={(e) => setLeadData({...leadData, name: e.target.value})}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={leadData.phone}
                onChange={(e) => setLeadData({...leadData, phone: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={leadData.email}
                onChange={(e) => setLeadData({...leadData, email: e.target.value})}
              />
              <input
                type="text"
                placeholder="Property Location"
                value={leadData.location}
                onChange={(e) => setLeadData({...leadData, location: e.target.value})}
                required
              />
              <select
                value={leadData.projectType}
                onChange={(e) => setLeadData({...leadData, projectType: e.target.value})}
                required
              >
                <option value="">Select Service Type</option>
                <option value="tree-removal">Tree Removal</option>
                <option value="land-clearing">Land Clearing</option>
                <option value="stump-grinding">Stump Grinding</option>
                <option value="forestry-mulching">Forestry Mulching</option>
                <option value="multiple">Multiple Services</option>
              </select>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowLeadForm(false)}>
                  Cancel
                </button>
                <button type="submit">
                  Get My Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="trust-indicators">
        <div className="indicator">
          <span>🏆</span>
          <p>Licensed & Insured</p>
        </div>
        <div className="indicator">
          <span>⚡</span>
          <p>24/7 Emergency Service</p>
        </div>
        <div className="indicator">
          <span>💯</span>
          <p>Satisfaction Guaranteed</p>
        </div>
      </div>

      <style jsx>{`
        .lead-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
        }

        .hero-section {
          text-align: center;
          margin-bottom: 40px;
        }

        .hero-section h1 {
          color: #2d5a27;
          font-size: 2.5em;
          margin-bottom: 10px;
        }

        .chat-container {
          border: 1px solid #ddd;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 30px;
        }

        .chat-messages {
          height: 400px;
          overflow-y: auto;
          padding: 20px;
          background: #f9f9f9;
        }

        .message {
          margin-bottom: 15px;
          padding: 12px 16px;
          border-radius: 8px;
          max-width: 70%;
        }

        .message.user {
          background: #A3E635;
          color: #1C1C1C;
          margin-left: auto;
          text-align: right;
        }

        .message.alex {
          background: white;
          border: 1px solid #ddd;
        }

        .message.loading {
          background: #f0f0f0;
          font-style: italic;
        }

        .quote-indicator {
          background: #A3E635;
          color: #1C1C1C;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          margin-top: 8px;
          display: inline-block;
        }

        .contact-button {
          background: #2d5a27;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          margin-top: 8px;
          cursor: pointer;
        }

        .timestamp {
          font-size: 0.7em;
          color: #888;
          margin-top: 4px;
        }

        .quick-actions {
          display: flex;
          gap: 10px;
          padding: 15px;
          background: white;
          border-bottom: 1px solid #ddd;
        }

        .quick-actions button {
          background: #f0f0f0;
          border: 1px solid #ccc;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9em;
        }

        .quick-actions button:hover {
          background: #A3E635;
          color: #1C1C1C;
        }

        .chat-input {
          display: flex;
          padding: 15px;
          background: white;
        }

        .chat-input input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px 0 0 6px;
          font-size: 1em;
        }

        .chat-input button {
          background: #2d5a27;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 0 6px 6px 0;
          cursor: pointer;
        }

        .chat-input button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .lead-form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .lead-form {
          background: white;
          padding: 30px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
        }

        .lead-form h3 {
          color: #2d5a27;
          margin-bottom: 20px;
          text-align: center;
        }

        .lead-form input,
        .lead-form select {
          width: 100%;
          padding: 12px;
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1em;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .form-actions button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1em;
        }

        .form-actions button[type="button"] {
          background: #f0f0f0;
          color: #333;
        }

        .form-actions button[type="submit"] {
          background: #2d5a27;
          color: white;
        }

        .trust-indicators {
          display: flex;
          justify-content: space-around;
          text-align: center;
          margin-top: 40px;
        }

        .indicator {
          flex: 1;
        }

        .indicator span {
          font-size: 2em;
          display: block;
          margin-bottom: 8px;
        }

        .indicator p {
          font-weight: bold;
          color: #2d5a27;
        }

        @media (max-width: 768px) {
          .quick-actions {
            flex-wrap: wrap;
          }
          
          .quick-actions button {
            flex: 1;
            min-width: calc(50% - 5px);
          }
        }
      `}</style>
    </div>
  );
}