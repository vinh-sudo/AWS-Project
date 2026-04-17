import { useState, useRef, useEffect, useCallback } from "react";
import aiService from "../../services/aiService";
import "./AICopilot.css";

function AICopilot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Xin chào! Tôi là AI Production Copilot. Tôi có thể giúp bạn phân tích sản xuất, kiểm tra tình trạng dây chuyền, hoặc trả lời các câu hỏi về hoạt động sản xuất.",
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
        data.response || "Không có phản hồi từ AI.",
        data.suggestedQuestions || [],
      );
    } catch {
      addBotMessage(
        "Xin lỗi, hiện tại không thể kết nối đến AI. Vui lòng thử lại sau.",
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickStatus = async () => {
    if (isTyping) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        text: "📊 Tình trạng sản xuất nhanh",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setIsTyping(true);

    try {
      const data = await aiService.getQuickStatus();
      addBotMessage(
        data.response || "Không có dữ liệu.",
        data.suggestedQuestions || [],
      );
    } catch {
      addBotMessage("Không thể lấy tình trạng sản xuất. Vui lòng thử lại.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleProductionHealth = async () => {
    if (isTyping) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        text: "🏭 Kiểm tra sức khỏe sản xuất",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setIsTyping(true);

    try {
      const data = await aiService.getProductionHealth();
      const statusEmoji =
        data.overallStatus === "STABLE"
          ? "✅"
          : data.overallStatus === "WARNING"
            ? "⚠️"
            : "🔴";
      let text = `${statusEmoji} **Trạng thái:** ${data.overallStatus}\n`;
      if (data.mainIssue) text += `\n📌 **Vấn đề chính:** ${data.mainIssue}`;
      if (data.criticalLines?.length > 0)
        text += `\n\n🚨 **Dây chuyền cần chú ý:**\n${data.criticalLines.map((l) => `• ${l}`).join("\n")}`;
      if (data.recommendations?.length > 0)
        text += `\n\n💡 **Khuyến nghị:**\n${data.recommendations.map((r) => `• ${r}`).join("\n")}`;
      addBotMessage(text);
    } catch {
      addBotMessage("Không thể lấy dữ liệu sức khỏe sản xuất.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleRootCause = async () => {
    if (isTyping) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        text: "🔍 Phân tích nguyên nhân gốc",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setIsTyping(true);

    try {
      const data = await aiService.getRootCauseAnalysis();
      let text = `🔍 **Nguyên nhân chính:** ${data.primaryRootCause}\n`;
      text += `📊 **Độ tin cậy:** ${data.confidence}`;
      if (data.contributingFactors?.length > 0)
        text += `\n\n📋 **Yếu tố liên quan:**\n${data.contributingFactors.map((f) => `• ${f}`).join("\n")}`;
      if (data.evidencePoints?.length > 0)
        text += `\n\n📄 **Bằng chứng:**\n${data.evidencePoints.map((e) => `• ${e}`).join("\n")}`;
      if (data.immediateActions?.length > 0)
        text += `\n\n⚡ **Hành động ngay:**\n${data.immediateActions.map((a) => `• ${a}`).join("\n")}`;
      if (data.preventiveActions?.length > 0)
        text += `\n\n🛡️ **Phòng ngừa:**\n${data.preventiveActions.map((a) => `• ${a}`).join("\n")}`;
      addBotMessage(text);
    } catch {
      addBotMessage("Không thể thực hiện phân tích nguyên nhân gốc.");
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

  const handleAiHealthSummary = async () => {
    if (isTyping) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        text: "📝 Tóm tắt AI sức khỏe sản xuất",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setIsTyping(true);

    try {
      const data = await aiService.getProductionHealthSummary();
      addBotMessage(data || "Không có dữ liệu tóm tắt.");
    } catch {
      addBotMessage("Không thể lấy tóm tắt AI sức khỏe sản xuất.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleAiRootCauseSummary = async () => {
    if (isTyping) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        text: "📋 Tóm tắt AI nguyên nhân gốc",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setIsTyping(true);

    try {
      const data = await aiService.getRootCauseSummary();
      addBotMessage(data || "Không có dữ liệu tóm tắt nguyên nhân.");
    } catch {
      addBotMessage("Không thể lấy tóm tắt AI nguyên nhân gốc.");
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    { icon: "📊", label: "Trạng thái nhanh", action: handleQuickStatus },
    { icon: "🏭", label: "Sức khỏe SX", action: handleProductionHealth },
    { icon: "🔍", label: "Phân tích nguyên nhân", action: handleRootCause },
    { icon: "📝", label: "Tóm tắt AI SX", action: handleAiHealthSummary },
    {
      icon: "📋",
      label: "Tóm tắt nguyên nhân",
      action: handleAiRootCauseSummary,
    },
  ];

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

        {/* Quick Actions */}
        <div className="copilot-quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={action.action}
              disabled={isTyping}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
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
            placeholder="Hỏi về sản xuất..."
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
