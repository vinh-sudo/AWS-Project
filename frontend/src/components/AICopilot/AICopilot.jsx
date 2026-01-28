import { useState, useRef, useEffect } from "react";
import "./AICopilot.css";

function AICopilot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hello! I'm your AI Production Copilot. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: "bot",
        text: getAIResponse(inputValue),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const getAIResponse = (input) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes("production") || lowerInput.includes("schedule")) {
      return "I can help you with production scheduling. Would you like me to show you the current production status or help you create a new schedule?";
    }
    if (lowerInput.includes("order") || lowerInput.includes("orders")) {
      return "I can assist with order management. You can view pending orders, track order progress, or create new orders through the Manager dashboard.";
    }
    if (lowerInput.includes("report") || lowerInput.includes("analytics")) {
      return "For reports and analytics, you can access the Reports section. I can help you generate production reports, efficiency metrics, or custom analytics.";
    }
    if (lowerInput.includes("task") || lowerInput.includes("assignment")) {
      return "Task management is available in the Manager Tasks section. You can assign tasks to team members, track progress, and manage deadlines.";
    }
    if (lowerInput.includes("help") || lowerInput.includes("what can you do")) {
      return "I can help you with:\n• Production scheduling and planning\n• Order management and tracking\n• Task assignments and progress\n• Reports and analytics\n• System navigation\n\nJust ask me anything!";
    }
    
    return "I understand you're asking about: \"" + input + "\". Let me help you with that. Could you provide more details about what you'd like to accomplish?";
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { icon: "📊", label: "View Reports" },
    { icon: "📋", label: "Check Orders" },
    { icon: "📅", label: "Schedule" },
    { icon: "❓", label: "Help" },
  ];

  if (!isOpen) return null;

  return (
    <div className="copilot-overlay">
      <div className="copilot-container">
        {/* Header */}
        <div className="copilot-header">
          <div className="copilot-header-left">
            <div className="copilot-avatar">🤖</div>
            <div className="copilot-header-info">
              <h3>AI Production Copilot</h3>
              <div className="copilot-status">
                <span className="status-dot"></span>
                <span>Online</span>
              </div>
            </div>
          </div>
          <button className="copilot-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Messages Area */}
        <div className="copilot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.type === "user" ? "user-message" : "bot-message"}`}
            >
              {message.type === "bot" && (
                <div className="message-avatar">🤖</div>
              )}
              <div className="message-content">
                <p>{message.text}</p>
                <span className="message-time">{message.time}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message bot-message">
              <div className="message-avatar">🤖</div>
              <div className="message-content typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="copilot-quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={() => setInputValue(action.label)}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="copilot-input">
          <input
            type="text"
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default AICopilot;
