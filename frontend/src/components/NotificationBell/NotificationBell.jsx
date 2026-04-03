import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import notificationService from "../../services/notificationService";
import authService from "../../services/authService";
import "./NotificationBell.css";

const SOURCE_TYPES = [
  { label: "All", value: null },
  { label: "Order", value: "ORDER" },
  { label: "Schedule", value: "SCHEDULE" },
  { label: "Line", value: "LINE" },
];

const PAGE_SIZE = 20;

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
  QUALITY: "🧪",
  REPORT: "📋",
  MACHINE: "🛠️",
};

const SOURCE_LABELS = SOURCE_TYPES.reduce((acc, item) => {
  if (item.value) {
    acc[item.value] = item.label;
  }
  return acc;
}, {});

const getRoleDefaultPath = (role) => {
  const normalizedRole =
    (role || "").toUpperCase() === "PRODUCTION_PLANNER"
      ? "MANAGER"
      : (role || "").toUpperCase();

  switch (normalizedRole) {
    case "ADMIN":
      return "/admin/dashboard";
    case "MANAGER":
      return "/manager/dashboard";
    case "LINE_LEADER":
      return "/leader/progress";
    default:
      return "/dashboard";
  }
};

const normalizeNotificationUrl = (notif, role) => {
  const fallback = getRoleDefaultPath(role);
  const normalizedRole = (role || "").toUpperCase();
  const normalizedSourceType = (notif?.sourceType || "").toUpperCase();

  if (normalizedRole === "MANAGER" && normalizedSourceType === "SCHEDULE") {
    return "/manager/planning";
  }

  if (!notif?.url) return fallback;

  let pathname = "";
  let search = "";

  try {
    const parsed = new URL(notif.url, window.location.origin);
    pathname = parsed.pathname || "";
    search = parsed.search || "";
  } catch {
    return fallback;
  }

  if (
    normalizedRole === "MANAGER" &&
    pathname.startsWith("/manager/schedules/")
  ) {
    return "/manager/planning";
  }

  if (
    pathname === "/admin/accounts" ||
    pathname.startsWith("/admin/accounts/")
  ) {
    return `/admin/users${search}`;
  }

  if (
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/manager/") ||
    pathname.startsWith("/planner/") ||
    pathname.startsWith("/leader/")
  ) {
    if (
      pathname.startsWith("/planner/") &&
      (role || "").toUpperCase() !== "PRODUCTION_PLANNER"
    ) {
      return "/manager/dashboard";
    }
    return `${pathname}${search}`;
  }

  if (pathname === "/dashboard") {
    return "/dashboard";
  }

  if (pathname.startsWith("/dashboard/")) {
    const dashboardSection = pathname.split("/")[2]?.toLowerCase();
    if (dashboardSection === "kpi" || dashboardSection === "quality") {
      if ((role || "").toUpperCase() === "MANAGER") {
        return "/manager/reports";
      }
      return fallback;
    }
    return "/dashboard";
  }

  if (pathname.startsWith("/orders/")) {
    if ((role || "").toUpperCase() === "ADMIN") {
      return "/admin/orders";
    }
    if ((role || "").toUpperCase() === "MANAGER") {
      return "/manager/orders";
    }
    return fallback;
  }

  if (pathname.startsWith("/plans/create")) {
    if ((role || "").toUpperCase() === "MANAGER") {
      return `/manager/planning${search}`;
    }
    return "/admin/orders";
  }

  if (pathname.startsWith("/machines/")) {
    if ((role || "").toUpperCase() === "MANAGER") {
      return "/manager/tracking";
    }
    if ((role || "").toUpperCase() === "ADMIN") {
      return "/admin/dashboard";
    }
    return fallback;
  }

  if (pathname.startsWith("/lines/")) {
    return "/manager/tracking";
  }

  if (pathname.startsWith("/reports/")) {
    if ((role || "").toUpperCase() === "MANAGER") {
      return "/manager/reports";
    }
    if ((role || "").toUpperCase() === "LINE_LEADER") {
      return "/leader/progress";
    }
    return fallback;
  }

  if (
    pathname === "/my-line" ||
    pathname === "/profile" ||
    pathname === "/security" ||
    pathname === "/account" ||
    pathname === "/support"
  ) {
    return fallback;
  }

  return fallback;
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
  const [loadError, setLoadError] = useState("");
  const intervalRef = useRef(null);
  const triggerRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const navigate = useNavigate();

  const currentUser = authService.getCurrentUser();
  const userRole = (currentUser?.role || "").toUpperCase();
  const userIdCandidates = [currentUser?.userId, currentUser?.id]
    .map((value) => Number(value))
    .filter(
      (value, index, arr) =>
        Number.isFinite(value) && value > 0 && arr.indexOf(value) === index,
    );
  const [resolvedUserId, setResolvedUserId] = useState(
    userIdCandidates[0] ?? null,
  );

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportPadding = 12;
    const width = Math.min(380, window.innerWidth - viewportPadding * 2);
    const left = Math.max(
      viewportPadding,
      Math.min(rect.right - width, window.innerWidth - width - viewportPadding),
    );

    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left,
      width,
    });
  }, []);

  const resolveUserIdForNotifications = useCallback(async () => {
    if (resolvedUserId) return resolvedUserId;
    if (userIdCandidates.length === 0) return null;

    const chosen = userIdCandidates[0];
    setResolvedUserId(chosen);
    return chosen;
  }, [resolvedUserId, userIdCandidates]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    const baseUserId = await resolveUserIdForNotifications();
    if (!baseUserId) return;

    const tryIds = [
      baseUserId,
      ...userIdCandidates.filter((id) => id !== baseUserId),
    ];

    try {
      for (const candidateId of tryIds) {
        try {
          const count = await notificationService.getUnreadCount(candidateId);
          setUnreadCount(count);
          if (resolvedUserId !== candidateId) {
            setResolvedUserId(candidateId);
          }
          return;
        } catch {
          // Try next candidate id.
        }
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, [resolveUserIdForNotifications, userIdCandidates, resolvedUserId]);

  // Fetch notifications (first page or append)
  const fetchNotifications = useCallback(
    async (pageNum = 0, filter = activeFilter, append = false) => {
      const baseUserId = await resolveUserIdForNotifications();
      if (!baseUserId) return;

      const tryIds = [
        baseUserId,
        ...userIdCandidates.filter((id) => id !== baseUserId),
      ];

      try {
        setLoading(true);
        if (!append) {
          setLoadError("");
        }

        let selectedData = null;
        let selectedUserId = null;

        for (const candidateId of tryIds) {
          try {
            const data = filter
              ? await notificationService.getFilteredNotifications(
                  candidateId,
                  filter,
                  pageNum,
                  PAGE_SIZE,
                )
              : await notificationService.getNotifications(
                  candidateId,
                  pageNum,
                  PAGE_SIZE,
                );

            const hasResults =
              (data?.totalElements ?? 0) > 0 ||
              (data?.content || []).length > 0;
            if (!selectedData || hasResults || candidateId === baseUserId) {
              selectedData = data;
              selectedUserId = candidateId;
            }

            if (hasResults) {
              break;
            }
          } catch {
            // Try next candidate id.
          }
        }

        if (!selectedData) {
          throw new Error(
            "Unable to load notifications for current session user",
          );
        }

        if (selectedUserId && resolvedUserId !== selectedUserId) {
          setResolvedUserId(selectedUserId);
        }

        const items = selectedData.content || [];
        setNotifications((prev) => (append ? [...prev, ...items] : items));
        setPage(selectedData.number ?? pageNum);
        setTotalPages(selectedData.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        setLoadError("Unable to load notifications. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [
      activeFilter,
      resolveUserIdForNotifications,
      userIdCandidates,
      resolvedUserId,
    ],
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
      updateDropdownPosition();
      setPage(0);
      fetchNotifications(0, activeFilter, false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handleScroll = () => {
      updateDropdownPosition();
    };

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, updateDropdownPosition]);

  const handleToggle = () => {
    if (!open) {
      updateDropdownPosition();
    }
    setOpen((prev) => !prev);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFilterChange = (sourceType) => {
    const normalized = sourceType ? String(sourceType).toUpperCase() : null;
    setActiveFilter(normalized);
    setPage(0);
    setLoadError("");
    setNotifications([]);
    fetchNotifications(0, normalized, false);
  };

  const handleMarkAsRead = async (notif) => {
    const userId = await resolveUserIdForNotifications();
    if (!userId || notif.status === "READ") return;
    try {
      await notificationService.markAsRead(notif.id, userId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, status: "READ" } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setLoadError("");
    } catch (err) {
      console.error("Failed to mark as read:", err);
      setLoadError("Unable to mark notification as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    const userId = await resolveUserIdForNotifications();
    if (!userId) return;
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
      setUnreadCount(0);
      setLoadError("");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      setLoadError("Unable to mark all notifications as read.");
    }
  };

  const handleLoadMore = () => {
    if (loading || page + 1 >= totalPages) return;
    const nextPage = page + 1;
    fetchNotifications(nextPage, activeFilter, true);
  };

  const handleItemClick = async (notif) => {
    await handleMarkAsRead(notif);
    const nextUrl = normalizeNotificationUrl(notif, userRole);
    setOpen(false);
    navigate(nextUrl);
  };

  return (
    <div className="notification-bell">
      <button
        ref={triggerRef}
        className="notification-bell__trigger"
        onClick={handleToggle}
        title="Notifications"
        type="button"
        aria-label="Open notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
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
                  type="button"
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
                    type="button"
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {loadError && (
                <div className="notification-bell__error">
                  <span>{loadError}</span>
                  <button
                    className="notification-bell__error-retry"
                    onClick={() => fetchNotifications(0, activeFilter, false)}
                    disabled={loading}
                    type="button"
                  >
                    Retry
                  </button>
                </div>
              )}

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
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleItemClick(notif);
                        }
                      }}
                    >
                      <div
                        className={`notification-bell__item-icon notification-bell__item-icon--${(notif.level || "INFO").toUpperCase()}`}
                      >
                        {SOURCE_ICONS[(notif.sourceType || "").toUpperCase()] ||
                          LEVEL_ICONS[(notif.level || "INFO").toUpperCase()] ||
                          "🔔"}
                      </div>
                      <div className="notification-bell__item-body">
                        <p className="notification-bell__item-title">
                          {notif.title}
                        </p>
                        <p className="notification-bell__item-message">
                          {stripHtml(notif.message)}
                        </p>
                        <div className="notification-bell__item-meta">
                          <span className="notification-bell__item-time">
                            {timeAgo(notif.createdAt)}
                          </span>
                          <span className="notification-bell__item-source">
                            {SOURCE_LABELS[
                              (notif.sourceType || "").toUpperCase()
                            ] ||
                              notif.sourceType ||
                              "General"}
                          </span>
                        </div>
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
                    type="button"
                  >
                    {loading ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
};

export default NotificationBell;
