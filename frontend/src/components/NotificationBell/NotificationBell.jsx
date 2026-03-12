import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import notificationService from "../../services/notificationService";
import authService from "../../services/authService";
import "./NotificationBell.css";

const SOURCE_TYPES = [
  { label: "All", value: null },
  { label: "Order", value: "ORDER" },
  { label: "Schedule", value: "SCHEDULE" },
  { label: "Line", value: "LINE" },
  { label: "Account", value: "ACCOUNT" },
  { label: "KPI", value: "KPI" },
  { label: "Report", value: "REPORT" },
  { label: "Plan", value: "PLAN" },
];

const LEVEL_ICONS = {
  INFO: "ℹ️",
  WARN: "⚠️",
  ERROR: "🔴",
};

const SOURCE_ICONS = {
  ORDER: "📦",
  SCHEDULE: "📅",
  LINE: "🏭",
  ACCOUNT: "👤",
  KPI: "📊",
  REPORT: "📋",
  PLAN: "📝",
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// Strip HTML tags from notification message
function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeFilter, setActiveFilter] = useState(null);
  const intervalRef = useRef(null);
  const triggerRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const navigate = useNavigate();

  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id;

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, [userId]);

  // Fetch notifications (first page or append)
  const fetchNotifications = useCallback(
    async (pageNum = 0, filter = activeFilter, append = false) => {
      if (!userId) return;
      try {
        setLoading(true);
        let data;
        if (filter) {
          data = await notificationService.getFilteredNotifications(
            userId,
            filter,
            pageNum,
            15,
          );
        } else {
          data = await notificationService.getNotifications(
            userId,
            pageNum,
            15,
          );
        }
        const items = data.content || [];
        setNotifications((prev) => (append ? [...prev, ...items] : items));
        setPage(data.number ?? pageNum);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    },
    [userId, activeFilter],
  );

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchUnreadCount]);

  // When dropdown opens, fetch notifications
  useEffect(() => {
    if (open) {
      setPage(0);
      fetchNotifications(0, activeFilter, false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((prev) => !prev);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFilterChange = (sourceType) => {
    setActiveFilter(sourceType);
    setPage(0);
    setNotifications([]);
    fetchNotifications(0, sourceType, false);
  };

  const handleMarkAsRead = async (notif) => {
    if (!userId || notif.status === "READ") return;
    try {
      await notificationService.markAsRead(notif.id, userId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, status: "READ" } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    fetchNotifications(nextPage, activeFilter, true);
  };

  const handleItemClick = (notif) => {
    handleMarkAsRead(notif);
    if (notif.url) {
      setOpen(false);
      navigate(notif.url);
    }
  };

  return (
    <div className="notification-bell">
      <button
        ref={triggerRef}
        className="notification-bell__trigger"
        onClick={handleToggle}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="notification-bell__overlay" onClick={handleClose} />
          <div className="notification-bell__dropdown" style={dropdownStyle}>
            {/* Header */}
            <div className="notification-bell__header">
              <h3 className="notification-bell__title">Notifications</h3>
              <button
                className="notification-bell__mark-all"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </button>
            </div>

            {/* Filter tabs */}
            <div className="notification-bell__filters">
              {SOURCE_TYPES.map((st) => (
                <button
                  key={st.label}
                  className={`notification-bell__filter-btn ${
                    activeFilter === st.value
                      ? "notification-bell__filter-btn--active"
                      : ""
                  }`}
                  onClick={() => handleFilterChange(st.value)}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="notification-bell__list">
              {loading && notifications.length === 0 ? (
                <div className="notification-bell__loading">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="notification-bell__empty">
                  <span className="notification-bell__empty-icon">🔕</span>
                  <span className="notification-bell__empty-text">
                    No notifications
                  </span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`notification-bell__item ${
                      notif.status === "UNREAD"
                        ? "notification-bell__item--unread"
                        : ""
                    }`}
                    onClick={() => handleItemClick(notif)}
                  >
                    <div
                      className={`notification-bell__item-icon notification-bell__item-icon--${notif.level || "INFO"}`}
                    >
                      {SOURCE_ICONS[notif.sourceType] ||
                        LEVEL_ICONS[notif.level] ||
                        "🔔"}
                    </div>
                    <div className="notification-bell__item-body">
                      <p className="notification-bell__item-title">
                        {notif.title}
                      </p>
                      <p className="notification-bell__item-message">
                        {stripHtml(notif.message)}
                      </p>
                      <span className="notification-bell__item-time">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    {notif.status === "UNREAD" && (
                      <div className="notification-bell__item-dot" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Load more */}
            {page + 1 < totalPages && (
              <div className="notification-bell__load-more">
                <button
                  className="notification-bell__load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
