import React, { useState, useRef, useEffect } from "react";
import "./AICopilot.css";

const AICopilot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "Hello! I'm the AI Production Assistant. I can help you with:\n\n• Optimize production schedules\n• Analyze productivity and provide suggestions\n• Prioritize orders\n• Identify bottlenecks\n• Performance information\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Call OpenRouter API
  const callOpenRouterAPI = async (userMessage) => {
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    const API_KEY = "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";

    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];

    const payload = {
      model: "mistralai/devstral-2512:free",
      messages: [
        {
          role: "system",
          content: `You are a professional AI Production Assistant specializing in industrial production management.
          
Your responsibilities:
- Optimize production schedules
- Analyze production line productivity
- Recommend order prioritization
- Identify and resolve bottlenecks
- Provide KPI and performance information
- Predict order completion times

Respond clearly and professionally in English. Use appropriate emojis to highlight important information.`
        },
        ...updatedHistory
      ]
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "IMS Production Copilot"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from API");
      }

      const assistantMessage = data.choices[0].message.content;

      setConversationHistory([
        ...updatedHistory,
        { role: "assistant", content: assistantMessage }
      ]);

      return assistantMessage;
    } catch (error) {
      console.error("API Error:", error);
      return `❌ Sorry, an error occurred while connecting to AI. Please try again later.\n\nError details: ${error.message}`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const aiResponse = await callOpenRouterAPI(currentInput);
      
      const botResponse = {
        id: messages.length + 2,
        type: "bot",
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      const errorResponse = {
        id: messages.length + 2,
        type: "bot",
        content: "❌ An error occurred. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    {
      label: "📅 Optimize Schedule",
      query: "Help me optimize today's production schedule",
    },
    { 
      label: "📊 Check Productivity", 
      query: "Analyze current production line productivity" 
    },
    { 
      label: "🔍 Find Bottlenecks", 
      query: "Identify bottlenecks in the production process" 
    },
    { 
      label: "📈 View KPIs", 
      query: "Show today's performance KPI metrics" 
    },
  ];

  const handleQuickAction = (query) => {
    setInputValue(query);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        type: "bot",
        content: "Hello! I'm the AI Production Assistant. How can I help you?",
        timestamp: new Date(),
      },
    ]);
    setConversationHistory([]);
  };

  if (!isOpen) return null;

  return (
    <div className="copilot-overlay">
      <div className="copilot-container">
        {/* Header */}
        <div className="copilot-header">
          <div className="copilot-header-left">
            <div className="copilot-avatar">
              <span>🤖</span>
            </div>
            <div className="copilot-header-info">
              <h3>AI Production Copilot</h3>
              <span className="copilot-status">
                <span className="status-dot"></span>
                Online
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button 
              className="copilot-close" 
              onClick={handleClearChat}
              title="Clear chat history"
              style={{ fontSize: "1rem" }}
            >
              🗑️
            </button>
            <button className="copilot-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="copilot-quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={() => handleQuickAction(action.query)}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="copilot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.type}`}>
              {msg.type === "bot" && <div className="message-avatar">🤖</div>}
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message bot">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="copilot-input-container">
          <textarea
            className="copilot-input"
            placeholder="Ask about schedules, productivity, orders..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
          <button
            className="copilot-send-btn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
          >
            ➤
          </button>
        </div>

        {/* Footer */}
        <div className="copilot-footer">
          <span>Powered by Mistral AI via OpenRouter</span>
        </div>
      </div>
    </div>
  );
};

export default AICopilot;
