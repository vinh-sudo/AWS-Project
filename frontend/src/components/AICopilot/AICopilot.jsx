import React, { useState, useRef, useEffect } from "react";
import "./AICopilot.css";

const AICopilot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "Hello! I'm your AI Production Assistant. I can help you with:\n\n• Production scheduling optimization\n• Capacity analysis and recommendations\n• Order prioritization suggestions\n• Bottleneck identification\n• Performance insights\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulated AI responses based on keywords
  const getAIResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.includes("schedule") || lowerMsg.includes("scheduling")) {
      return "Based on current orders and line capacity, I recommend the following scheduling adjustments:\n\n📅 **Priority Orders:**\n1. ORD-001 (PCB-A100) - Deadline in 2 days, suggest allocating SMT Line 1\n2. ORD-003 (PCB-C300) - High priority, can run parallel on SMT Line 2\n\n⚠️ **Alert:** SMT Line 2 is at 72% OEE. Consider maintenance window before critical deadline.\n\n💡 **Optimization:** Shifting Test Line 1 schedule by 2 hours could reduce overall lead time by 15%.";
    }

    if (lowerMsg.includes("capacity") || lowerMsg.includes("line")) {
      return "📊 **Current Capacity Analysis:**\n\n• SMT Line 1: 85% utilized (500 boards/hr)\n• SMT Line 2: 72% utilized (Warning: Reflow Oven efficiency low)\n• Assembly Line 1: Idle - Available for scheduling\n• Test Line 1: 60% utilized (Burn-in Chamber in maintenance)\n\n**Total Available Capacity:** 1,450 units/hour\n**Current Demand:** 1,200 units/hour\n**Buffer:** 17% (Healthy)\n\n💡 **Recommendation:** Assembly Line 1 can be activated to handle overflow from high-priority orders.";
    }

    if (lowerMsg.includes("order") || lowerMsg.includes("priority")) {
      return "📋 **Order Priority Analysis:**\n\n🔴 **Critical (Next 48 hours):**\n• ORD-001: 5000 units, 60% complete, Deadline: Tomorrow\n• ORD-005: 2000 units, Not started, Customer: VIP\n\n🟡 **High (3-5 days):**\n• ORD-003: 8000 units, 35% complete\n• ORD-007: 3500 units, In progress\n\n🟢 **Normal:**\n• ORD-002, ORD-004, ORD-006\n\n💡 **Suggestion:** Reassign 2 workers from Assembly to SMT Line 1 to accelerate ORD-001 completion.";
    }

    if (
      lowerMsg.includes("bottleneck") ||
      lowerMsg.includes("issue") ||
      lowerMsg.includes("problem")
    ) {
      return "🔍 **Bottleneck Analysis:**\n\n**Identified Issues:**\n\n1. ⚠️ **Reflow Oven R2 (SMT Line 2)**\n   - Efficiency: 70% (Below threshold)\n   - Impact: 15% throughput reduction\n   - Recommendation: Schedule preventive maintenance\n\n2. ⚠️ **Test Line 1 Burn-in Chamber**\n   - Status: Under maintenance\n   - Expected resolution: 4 hours\n   - Workaround: Route urgent tests to Chamber B\n\n3. 📉 **Material Shortage**\n   - Component IC-2045: Low stock (200 units)\n   - Affected orders: ORD-003, ORD-007\n   - Action: Expedite procurement\n\n💡 Overall system efficiency can improve by 12% by addressing these issues.";
    }

    if (
      lowerMsg.includes("performance") ||
      lowerMsg.includes("kpi") ||
      lowerMsg.includes("oee")
    ) {
      return "📈 **Performance Dashboard:**\n\n**Today's KPIs:**\n• Overall OEE: 72.3% (Target: 80%)\n• On-Time Delivery: 94.5%\n• Quality Rate: 99.2%\n• Availability: 87%\n\n**Trends (Last 7 days):**\n• OEE trending up (+3.5%)\n• Defect rate reduced by 0.8%\n\n**Areas for Improvement:**\n1. SMT Line 2 availability (78% → target 90%)\n2. Test cycle time optimization potential: 8%\n\n🏆 **Highlight:** Assembly Line achieved 100% quality for 15 consecutive days!";
    }

    if (lowerMsg.includes("help") || lowerMsg.includes("what can you do")) {
      return 'I\'m your AI Production Assistant! Here\'s what I can help you with:\n\n📅 **Scheduling** - "Help me optimize the production schedule"\n\n📊 **Capacity** - "What\'s our current line capacity?"\n\n📋 **Orders** - "Show me order priorities"\n\n🔍 **Bottlenecks** - "Identify production bottlenecks"\n\n📈 **Performance** - "Show me today\'s KPIs"\n\n🔮 **Predictions** - "Predict completion time for ORD-001"\n\nJust ask naturally and I\'ll provide insights and recommendations!';
    }

    if (
      lowerMsg.includes("predict") ||
      lowerMsg.includes("forecast") ||
      lowerMsg.includes("when")
    ) {
      return "🔮 **Predictive Analysis:**\n\n**Completion Time Estimates:**\n• ORD-001: ~14 hours (85% confidence)\n• ORD-003: ~36 hours (78% confidence)\n• ORD-005: ~8 hours if started now\n\n**Risk Assessment:**\n• 15% chance of delay on ORD-001 if Reflow Oven issue persists\n• 92% probability of meeting all deadlines this week\n\n**Recommended Actions:**\n1. Prioritize Reflow Oven maintenance (reduces delay risk by 40%)\n2. Pre-stage materials for ORD-005\n\n📊 These predictions are based on historical performance data and current conditions.";
    }

    // Default response
    return (
      "I understand you're asking about \"" +
      userMessage +
      "\". Let me help you with that.\n\nTo provide the most relevant insights, could you specify:\n\n• Are you looking at scheduling optimization?\n• Capacity and resource analysis?\n• Order management and priorities?\n• Performance metrics and KPIs?\n\nI'm here to help optimize your production operations!"
    );
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(
      () => {
        const botResponse = {
          id: messages.length + 2,
          type: "bot",
          content: getAIResponse(inputValue),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      },
      1000 + Math.random() * 1000
    );
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
      query: "Help me optimize the production schedule",
    },
    { label: "📊 Check Capacity", query: "What's our current line capacity?" },
    { label: "🔍 Find Bottlenecks", query: "Identify production bottlenecks" },
    { label: "📈 Show KPIs", query: "Show me today's performance KPIs" },
  ];

  const handleQuickAction = (query) => {
    setInputValue(query);
    setTimeout(() => handleSendMessage(), 100);
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
          <button className="copilot-close" onClick={onClose}>
            ×
          </button>
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
            placeholder="Ask me about production scheduling, capacity, orders..."
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
          <span>Powered by AI Production Intelligence</span>
        </div>
      </div>
    </div>
  );
};

export default AICopilot;
