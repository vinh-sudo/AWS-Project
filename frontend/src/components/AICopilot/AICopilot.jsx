import { useState, useRef, useEffect, useCallback } from "react";
import aiService from "../../services/aiService";
import "./AICopilot.css";

function AICopilot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hello! I'm the AI Production Copilot. I can help you analyze production, check line status, or answer questions about manufacturing operations.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = useCallback((text, suggestions = []) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        type: "bot",
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        suggestions,
      },
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue.trim();
    const userMessage = {
      id: Date.now(),
      type: "user",
      text: userText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const data = await aiService.chat(userText, sessionId);
      addBotMessage(
        data.response || "No response from AI.",
        data.suggestedQuestions || [],
      );
    } catch {
      addBotMessage(
        "Sorry, unable to connect to AI at the moment. Please try again later.",
      );
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

  const handleSuggestionClick = (question) => {
    setInputValue(question);
  };

  const formatMessage = (text) => {
    if (!text) return text;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

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
                <div className="message-text">
                  {message.text.split("\n").map((line, i) => (
                    <span key={i}>
                      {formatMessage(line)}
                      {i < message.text.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
                {message.suggestions?.length > 0 && (
                  <div className="message-suggestions">
                    {message.suggestions.map((q, i) => (
                      <button
                        key={i}
                        className="suggestion-btn"
                        onClick={() => handleSuggestionClick(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <span className="message-time">{message.time}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message bot-message">
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

        {/* Input Area */}
        <div className="copilot-input-container">
          <input
            className="copilot-input"
            type="text"
            placeholder="Ask about production..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
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
        <div className="copilot-footer">Powered by AI • GPT-4o-mini</div>
      </div>
    </div>
  );
}

export default AICopilot;
