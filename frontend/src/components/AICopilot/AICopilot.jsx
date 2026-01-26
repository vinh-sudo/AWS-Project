import React, { useState, useRef, useEffect } from "react";
import "./AICopilot.css";

const AICopilot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "Xin chào! Tôi là AI Production Assistant. Tôi có thể giúp bạn với:\n\n• Tối ưu hóa lịch sản xuất\n• Phân tích năng suất và đề xuất\n• Gợi ý ưu tiên đơn hàng\n• Xác định điểm nghẽn\n• Thông tin hiệu suất\n\nTôi có thể giúp gì cho bạn hôm nay?",
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

  // Gọi API OpenRouter
  const callOpenRouterAPI = async (userMessage) => {
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    const API_KEY = "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";

    // Cập nhật conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];

    const payload = {
      model: "mistralai/devstral-2512:free",
      messages: [
        {
          role: "system",
          content: `Bạn là một AI Production Assistant chuyên nghiệp trong lĩnh vực quản lý sản xuất công nghiệp. 
          
Nhiệm vụ của bạn:
- Hỗ trợ tối ưu hóa lịch sản xuất
- Phân tích năng suất dây chuyền sản xuất
- Đề xuất ưu tiên đơn hàng
- Xác định và giải quyết điểm nghẽn (bottleneck)
- Cung cấp thông tin KPI và hiệu suất
- Dự đoán thời gian hoàn thành đơn hàng

Trả lời bằng tiếng Việt, rõ ràng, chuyên nghiệp. Sử dụng emoji phù hợp để làm nổi bật thông tin quan trọng.`
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

      // Cập nhật conversation history với response
      setConversationHistory([
        ...updatedHistory,
        { role: "assistant", content: assistantMessage }
      ]);

      return assistantMessage;
    } catch (error) {
      console.error("API Error:", error);
      return `❌ Xin lỗi, đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.\n\nChi tiết lỗi: ${error.message}`;
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
        content: "❌ Đã xảy ra lỗi. Vui lòng thử lại.",
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
      label: "📅 Tối ưu lịch",
      query: "Giúp tôi tối ưu hóa lịch sản xuất hôm nay",
    },
    { 
      label: "📊 Kiểm tra năng suất", 
      query: "Phân tích năng suất các dây chuyền sản xuất hiện tại" 
    },
    { 
      label: "🔍 Tìm điểm nghẽn", 
      query: "Xác định các điểm nghẽn trong quy trình sản xuất" 
    },
    { 
      label: "📈 Xem KPI", 
      query: "Hiển thị các chỉ số KPI hiệu suất hôm nay" 
    },
  ];

  const handleQuickAction = (query) => {
    setInputValue(query);
  };

  // Xóa lịch sử hội thoại
  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        type: "bot",
        content:
          "Xin chào! Tôi là AI Production Assistant. Tôi có thể giúp gì cho bạn?",
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
              title="Xóa lịch sử chat"
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
            placeholder="Hỏi về lịch sản xuất, năng suất, đơn hàng..."
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
