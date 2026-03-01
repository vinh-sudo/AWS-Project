import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import managerService from "../../services/managerService";
import authService from "../../services/authService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import "./ManagerDashboard.css";

// Animated counter hook
const useAnimatedValue = (targetValue, duration = 1000) => {
  const [value, setValue] = useState(0);
  const startTime = useRef(null);
  const animationFrame = useRef(null);

  useEffect(() => {
    startTime.current = Date.now();
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * eased;
      setValue(current);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [targetValue, duration]);

  return value;
};

const ManagerDashboard = () => {
  const [linesOverview, setLinesOverview] = useState([]);
  const [oeeData, setOeeData] = useState([]);
  const [delays, setDelays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // === NEW STATES ===
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("dashboard-dark-mode") === "true";
  });
  const [chartView, setChartView] = useState("daily"); // daily | weekly
  const [expandedChart, setExpandedChart] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDelays, setFilteredDelays] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const currentUser = authService.getCurrentUser();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const avatarRef = useRef(null);
  const dropdownRef = useRef(null);
  const exportMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // === DARK MODE TOGGLE ===
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("dashboard-dark-mode", darkMode);
  }, [darkMode]);

  // === SEARCH FILTER FOR DELAYS ===
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDelays(delays);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDelays(
        delays.filter(
          (d) =>
            d.line?.toLowerCase().includes(query) ||
            d.machine?.toLowerCase().includes(query) ||
            d.risk?.toLowerCase().includes(query) ||
            String(d.scheduleId).includes(query),
        ),
      );
    }
  }, [searchQuery, delays]);

  // === GENERATE NOTIFICATIONS FROM DATA ===
  useEffect(() => {
    const newNotifications = [];

    // Critical delays
    delays
      .filter((d) => d.risk?.toUpperCase() === "HIGH")
      .forEach((d) => {
        newNotifications.push({
          id: `delay-${d.scheduleId}`,
          type: "danger",
          title: "Critical Delay Alert",
          message: `Schedule #${d.scheduleId} on ${d.line} - ${d.machine} is at high risk`,
          time: new Date(),
          read: false,
        });
      });

    // Low OEE warnings
    oeeData
      .filter((d) => (d.oee || 0) < 0.5 && (d.oee || 0) > 0)
      .forEach((d) => {
        newNotifications.push({
          id: `oee-${d.line}`,
          type: "warning",
          title: "Low OEE Warning",
          message: `${d.line} has OEE of ${((d.oee || 0) * 100).toFixed(1)}%`,
          time: new Date(),
          read: false,
        });
      });

    // Idle lines
    linesOverview
      .filter((l) => l.status?.toLowerCase() === "idle")
      .forEach((l) => {
        newNotifications.push({
          id: `idle-${l.lineId}`,
          type: "info",
          title: "Idle Line",
          message: `${l.lineName} is currently idle`,
          time: new Date(),
          read: false,
        });
      });

    setNotifications(newNotifications);
  }, [delays, oeeData, linesOverview]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowUserDropdown(false);
      }
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target)
      ) {
        setShowExportMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === KEYBOARD SHORTCUTS ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+D for dark mode
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        setDarkMode((prev) => !prev);
      }
      // Escape to close modals
      if (e.key === "Escape") {
        setExpandedChart(null);
        setShowUserDropdown(false);
        setShowExportMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [linesRes, oeeRes, delaysRes] = await Promise.all([
        managerService.getLinesOverview(),
        managerService.getOEE(selectedDate),
        managerService.getDelays(),
      ]);

      setLinesOverview(linesRes || []);
      setOeeData(oeeRes || []);
      setDelays(delaysRes || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Data loading failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // === GREETING BY TIME OF DAY ===
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // === EXPORT FUNCTIONS ===
  const exportToCSV = () => {
    const headers = ["Line,Status,Operating Hours,Available Hours,Available Machines"];
    const rows = linesOverview.map(
      (l) =>
        `${l.lineName},${l.status},${l.busyHours},${l.availableHours},${l.availableMachines}`,
    );
    const csvContent = [...headers, ...rows].join("\n");
    downloadFile(csvContent, `dashboard-report-${selectedDate}.csv`, "text/csv");
    setShowExportMenu(false);
  };

  const exportDelaysCSV = () => {
    const headers = ["Schedule ID,Line,Machine,Expected,Actual,Delay,Risk"];
    const rows = delays.map(
      (d) =>
        `${d.scheduleId},${d.line},${d.machine},${d.expected},${d.actual},${d.delay},${d.risk}`,
    );
    const csvContent = [...headers, ...rows].join("\n");
    downloadFile(csvContent, `delay-alerts-${selectedDate}.csv`, "text/csv");
    setShowExportMenu(false);
  };

  const exportOEECSV = () => {
    const headers = ["Line,Availability,Performance,Quality,OEE"];
    const rows = oeeData.map(
      (d) =>
        `${d.line},${((d.availability || 0) * 100).toFixed(1)}%,${((d.performance || 0) * 100).toFixed(1)}%,${((d.quality || 0) * 100).toFixed(1)}%,${((d.oee || 0) * 100).toFixed(1)}%`,
    );
    const csvContent = [...headers, ...rows].join("\n");
    downloadFile(csvContent, `oee-report-${selectedDate}.csv`, "text/csv");
    setShowExportMenu(false);
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // === TABLE SORT ===
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedLines = () => {
    if (!sortConfig.key) return linesOverview;
    return [...linesOverview].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "⬆️" : "⬇️";
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "running":
        return "status-running";
      case "idle":
        return "status-idle";
      case "maintenance":
        return "status-maintenance";
      default:
        return "";
    }
  };

  const getRiskClass = (risk) => {
    switch (risk?.toUpperCase()) {
      case "HIGH":
        return "risk-high";
      case "MEDIUM":
        return "risk-medium";
      case "LOW":
        return "risk-low";
      default:
        return "";
    }
  };

  // Calculate summary stats
  const totalLines = linesOverview.length;
  const runningLines = linesOverview.filter(
    (l) => l.status?.toLowerCase() === "running",
  ).length;
  const idleLines = linesOverview.filter(
    (l) => l.status?.toLowerCase() === "idle",
  ).length;
  const maintenanceLines = linesOverview.filter(
    (l) => l.status?.toLowerCase() === "maintenance",
  ).length;
  const averageOEE =
    oeeData.length > 0
      ? (
          (oeeData.reduce((sum, d) => sum + (d.oee || 0), 0) /
            oeeData.filter((d) => d.oee > 0).length || 0) * 100
        ).toFixed(1)
      : 0;
  const criticalDelays = delays.filter(
    (d) => d.risk?.toUpperCase() === "HIGH",
  ).length;
  const mediumDelays = delays.filter(
    (d) => d.risk?.toUpperCase() === "MEDIUM",
  ).length;
  const totalOperatingHours = linesOverview
    .reduce((sum, l) => sum + (l.busyHours || 0), 0)
    .toFixed(1);

  // Animated values
  const animatedOEE = useAnimatedValue(parseFloat(averageOEE), 1200);
  const animatedRunning = useAnimatedValue(runningLines, 800);
  const animatedDelays = useAnimatedValue(criticalDelays, 800);
  const animatedHours = useAnimatedValue(parseFloat(totalOperatingHours), 1000);

  // Prepare chart data from OEE
  const barChartData = oeeData.map((item) => ({
    name: item.line || "N/A",
    Availability: parseFloat(((item.availability || 0) * 100).toFixed(1)),
    Performance: parseFloat(((item.performance || 0) * 100).toFixed(1)),
    Quality: parseFloat(((item.quality || 0) * 100).toFixed(1)),
    OEE: parseFloat(((item.oee || 0) * 100).toFixed(1)),
  }));

  // Line status distribution for mini pie
  const statusDistribution = [
    { name: "Running", value: runningLines, color: "#36b58a" },
    { name: "Idle", value: idleLines, color: "#f0ad4e" },
    { name: "Maintenance", value: maintenanceLines, color: "#e74c5e" },
  ].filter((s) => s.value > 0);

  // Calculate average availability & performance for donut charts
  const avgAvailability =
    oeeData.length > 0
      ? parseFloat(
          (
            (oeeData.reduce((sum, d) => sum + (d.availability || 0), 0) /
              oeeData.length) *
            100
          ).toFixed(1),
        )
      : 0;
  const avgPerformance =
    oeeData.length > 0
      ? parseFloat(
          (
            (oeeData.reduce((sum, d) => sum + (d.performance || 0), 0) /
              oeeData.length) *
            100
          ).toFixed(1),
        )
      : 0;
  const avgQuality =
    oeeData.length > 0
      ? parseFloat(
          (
            (oeeData.reduce((sum, d) => sum + (d.quality || 0), 0) /
              oeeData.length) *
            100
          ).toFixed(1),
        )
      : 0;

  const availabilityDonut = [
    { name: "Availability", value: avgAvailability },
    { name: "Remaining", value: 100 - avgAvailability },
  ];
  const performanceDonut = [
    { name: "Performance", value: avgPerformance },
    { name: "Remaining", value: 100 - avgPerformance },
  ];
  const qualityDonut = [
    { name: "Quality", value: avgQuality },
    { name: "Remaining", value: 100 - avgQuality },
  ];

  const DONUT_COLORS_1 = ["#4a6cf7", "#e8ecf1"];
  const DONUT_COLORS_2 = ["#36b58a", "#e8ecf1"];
  const DONUT_COLORS_3 = ["#9b59f0", "#e8ecf1"];

  const renderCustomLabel = ({ cx, cy, value, name }) => {
    if (name === "Remaining") return null;
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: "22px", fontWeight: "800", fill: darkMode ? "#e0e0e0" : "#1a1a2e" }}
      >
        {value}%
      </text>
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className={`manager-container ${darkMode ? "dark-mode" : ""}`}>
      <ManagerSidebar />

      {/* Expanded Chart Modal */}
      {expandedChart && (
        <div className="chart-modal-overlay" onClick={() => setExpandedChart(null)}>
          <div className="chart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chart-modal-header">
              <h2>
                {expandedChart === "bar" && "OEE Breakdown by Line"}
                {expandedChart === "availability" && "Avg. Availability"}
                {expandedChart === "performance" && "Avg. Performance"}
                {expandedChart === "quality" && "Avg. Quality"}
              </h2>
              <button
                className="chart-modal-close"
                onClick={() => setExpandedChart(null)}
              >
                ✕
              </button>
            </div>
            <div className="chart-modal-content">
              {expandedChart === "bar" && (
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                    barCategoryGap="18%"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: "#8a92a6" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: "#8a92a6" }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e8ecf1", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", fontSize: "14px" }} formatter={(value) => [`${value}%`]} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: "14px", paddingTop: "14px" }} />
                    <Bar dataKey="Availability" fill="#4a6cf7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Performance" fill="#9b59f0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Quality" fill="#36b58a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {expandedChart === "availability" && (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={availabilityDonut} cx="50%" cy="50%" innerRadius={100} outerRadius={150} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0} label={renderCustomLabel} labelLine={false}>
                      {availabilityDonut.map((entry, index) => (
                        <Cell key={`cell-a-${index}`} fill={DONUT_COLORS_1[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
              {expandedChart === "performance" && (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={performanceDonut} cx="50%" cy="50%" innerRadius={100} outerRadius={150} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0} label={renderCustomLabel} labelLine={false}>
                      {performanceDonut.map((entry, index) => (
                        <Cell key={`cell-p-${index}`} fill={DONUT_COLORS_2[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
              {expandedChart === "quality" && (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={qualityDonut} cx="50%" cy="50%" innerRadius={100} outerRadius={150} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0} label={renderCustomLabel} labelLine={false}>
                      {qualityDonut.map((entry, index) => (
                        <Cell key={`cell-q-${index}`} fill={DONUT_COLORS_3[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="manager-main">
        {/* Top Header Bar */}
        <div className="top-header-bar">
          <div className="search-box">
            <svg className="search-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search lines, machines, schedules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="header-actions">
            {/* Dark Mode Toggle */}
            <button
              className={`header-icon-btn ${darkMode ? "active" : ""}`}
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Light Mode (Ctrl+D)" : "Dark Mode (Ctrl+D)"}
            >
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Notifications */}
            <div className="notification-wrapper" ref={notificationRef}>
              <button
                className="header-icon-btn"
                title="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="notification-badge">{unreadNotifications}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown-header">
                    <h3>Notifications</h3>
                    <span className="notification-count">{unreadNotifications} new</span>
                  </div>
                  <div className="notification-dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <span>🔔</span>
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notification-item ${n.type} ${n.read ? "read" : ""}`}
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((item) =>
                                item.id === n.id ? { ...item, read: true } : item,
                              ),
                            );
                          }}
                        >
                          <div className={`notification-icon-circle ${n.type}`}>
                            {n.type === "danger" && "🔴"}
                            {n.type === "warning" && "🟡"}
                            {n.type === "info" && "🔵"}
                          </div>
                          <div className="notification-content">
                            <span className="notification-title">{n.title}</span>
                            <span className="notification-message">{n.message}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="notification-dropdown-footer">
                      <button
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, read: true })),
                          )
                        }
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <button className="header-icon-btn" title="Messages">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            {/* User Avatar */}
            <div className="header-avatar-wrapper">
              <div
                className="header-avatar"
                ref={avatarRef}
                title={currentUser?.fullName || "Manager"}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                {currentUser?.fullName?.charAt(0) || "M"}
              </div>
              {showUserDropdown && (
                <div className="user-dropdown" ref={dropdownRef}>
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar">
                      {currentUser?.fullName?.charAt(0) || "M"}
                    </div>
                    <div className="user-dropdown-info">
                      <span className="user-dropdown-name">
                        {currentUser?.fullName || "Manager"}
                      </span>
                      <span className="user-dropdown-role">
                        Production Manager
                      </span>
                    </div>
                  </div>
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item" onClick={() => navigate("/manager/dashboard")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    My Profile
                  </button>
                  <button className="user-dropdown-item" onClick={() => navigate("/manager/dashboard")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Settings
                  </button>
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item logout" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="page-content">
          {/* Page Title */}
          <div className="page-title-row">
            <div className="page-title-left">
              <h1>{getGreeting()}, {currentUser?.fullName?.split(" ")[0] || "Manager"} 👋</h1>
              <p>{formatDate(new Date())} — Overview of production activities</p>
            </div>
            <div className="header-controls">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker"
              />

              {/* Export Button */}
              <div className="export-wrapper" ref={exportMenuRef}>
                <button
                  className="btn-export"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  title="Export Data"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </button>
                {showExportMenu && (
                  <div className="export-dropdown">
                    <button onClick={exportToCSV}>
                      <span>📄</span> Lines Overview (CSV)
                    </button>
                    <button onClick={exportOEECSV}>
                      <span>📊</span> OEE Report (CSV)
                    </button>
                    <button onClick={exportDelaysCSV}>
                      <span>⚠️</span> Delay Alerts (CSV)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={fetchDashboardData}>Retry</button>
            </div>
          )}

          {/* KPI Cards */}
          <section className="kpi-section">
            <div className="kpi-grid">
              <div className="kpi-card kpi-blue">
                <div className="kpi-card-top">
                  <span className="kpi-label">Lines Running</span>
                  <div className="kpi-icon">🏭</div>
                </div>
                <span className="kpi-value">
                  {Math.round(animatedRunning)}/{totalLines}
                </span>
                <span className="kpi-subtitle">Active production lines</span>
                {totalLines > 0 && (
                  <div className="kpi-mini-bar">
                    <div
                      className="kpi-mini-fill"
                      style={{ width: `${(runningLines / totalLines) * 100}%`, background: "#4a6cf7" }}
                    />
                  </div>
                )}
              </div>

              <div className="kpi-card kpi-green">
                <div className="kpi-card-top">
                  <span className="kpi-label">Average OEE</span>
                  <div className="kpi-icon">📈</div>
                </div>
                <span className="kpi-value">{animatedOEE.toFixed(1)}%</span>
                <span className="kpi-subtitle">Overall equipment effectiveness</span>
                <div className="kpi-mini-bar">
                  <div
                    className="kpi-mini-fill"
                    style={{
                      width: `${averageOEE}%`,
                      background:
                        averageOEE >= 85
                          ? "#36b58a"
                          : averageOEE >= 60
                            ? "#f0ad4e"
                            : "#e74c5e",
                    }}
                  />
                </div>
              </div>

              <div className="kpi-card kpi-orange">
                <div className="kpi-card-top">
                  <span className="kpi-label">Critical Delays</span>
                  <div className="kpi-icon">⚠️</div>
                </div>
                <span className="kpi-value">{Math.round(animatedDelays)}</span>
                <span className="kpi-subtitle">
                  {mediumDelays > 0
                    ? `+ ${mediumDelays} medium risk`
                    : "Schedules at high risk"}
                </span>
                {delays.length > 0 && (
                  <div className="kpi-risk-dots">
                    {delays.slice(0, 8).map((d, i) => (
                      <span
                        key={i}
                        className={`risk-dot ${d.risk?.toUpperCase() === "HIGH" ? "high" : d.risk?.toUpperCase() === "MEDIUM" ? "medium" : "low"}`}
                        title={`#${d.scheduleId} - ${d.risk}`}
                      />
                    ))}
                    {delays.length > 8 && <span className="risk-dot-more">+{delays.length - 8}</span>}
                  </div>
                )}
              </div>

              <div className="kpi-card kpi-purple">
                <div className="kpi-card-top">
                  <span className="kpi-label">Operating Hours</span>
                  <div className="kpi-icon">⏰</div>
                </div>
                <span className="kpi-value">{animatedHours.toFixed(1)}h</span>
                <span className="kpi-subtitle">Total hours today</span>
                {statusDistribution.length > 0 && (
                  <div className="kpi-status-legend">
                    {statusDistribution.map((s) => (
                      <span key={s.name} className="status-legend-item">
                        <span className="legend-dot" style={{ background: s.color }}></span>
                        {s.value} {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="dashboard-grid">
            {/* === Charts Row === */}
            <section className="dashboard-card chart-bar-card">
              <div className="card-header">
                <div className="card-header-left">
                  <h2>
                    <span className="card-icon blue">📊</span>
                    OEE Breakdown by Line
                  </h2>
                  <span className="card-subtitle">
                    Avg. OEE {averageOEE}%
                    {parseFloat(averageOEE) >= 85 && " ✅"}
                    {parseFloat(averageOEE) < 60 && parseFloat(averageOEE) > 0 && " ⚠️"}
                  </span>
                </div>
                <div className="chart-actions">
                  <div className="chart-filter-group">
                    <button
                      className={`chart-filter-btn ${chartView === "daily" ? "active" : ""}`}
                      onClick={() => setChartView("daily")}
                    >
                      Daily
                    </button>
                    <button
                      className={`chart-filter-btn ${chartView === "weekly" ? "active" : ""}`}
                      onClick={() => setChartView("weekly")}
                    >
                      Weekly
                    </button>
                  </div>
                  <button
                    className="chart-expand-btn"
                    onClick={() => setExpandedChart("bar")}
                    title="Expand chart"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="card-content chart-content">
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Loading data...</span>
                  </div>
                ) : barChartData.length === 0 ? (
                  <div className="no-data">
                    <span className="no-data-icon">📭</span>
                    <span>No chart data available</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={barChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      barCategoryGap="22%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={darkMode ? "#333" : "#eef0f5"}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: darkMode ? "#999" : "#8a92a6" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: darkMode ? "#999" : "#8a92a6" }}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #e8ecf1",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                          fontSize: "13px",
                          background: darkMode ? "#1e1e2e" : "#fff",
                          color: darkMode ? "#e0e0e0" : "#333",
                        }}
                        formatter={(value) => [`${value}%`]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                      />
                      <Bar
                        dataKey="Availability"
                        fill="#4a6cf7"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1200}
                      />
                      <Bar
                        dataKey="Performance"
                        fill="#9b59f0"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1200}
                      />
                      <Bar
                        dataKey="Quality"
                        fill="#36b58a"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1200}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Donut Charts */}
            <section className="dashboard-card donut-charts-card">
              <div className="donut-charts-row">
                <div className="donut-chart-item" onClick={() => setExpandedChart("availability")} style={{ cursor: "pointer" }}>
                  <div className="donut-chart-header">
                    <h3>Avg. Availability</h3>
                  </div>
                  <div className="donut-chart-wrapper">
                    {loading ? (
                      <div className="loading-spinner small">
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie data={availabilityDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={62} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0} label={renderCustomLabel} labelLine={false} animationDuration={1200}>
                            {availabilityDonut.map((entry, index) => (
                              <Cell key={`cell-a-${index}`} fill={DONUT_COLORS_1[index]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="donut-chart-legend">
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#4a6cf7" }}></span>
                      <span>Available</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#e8ecf1" }}></span>
                      <span>Downtime</span>
                    </div>
                  </div>
                </div>

                <div className="donut-chart-item" onClick={() => setExpandedChart("performance")} style={{ cursor: "pointer" }}>
                  <div className="donut-chart-header">
                    <h3>Avg. Performance</h3>
                  </div>
                  <div className="donut-chart-wrapper">
                    {loading ? (
                      <div className="loading-spinner small">
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie data={performanceDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={62} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0} label={renderCustomLabel} labelLine={false} animationDuration={1200}>
                            {performanceDonut.map((entry, index) => (
                              <Cell key={`cell-p-${index}`} fill={DONUT_COLORS_2[index]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="donut-chart-legend">
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#36b58a" }}></span>
                      <span>Effective</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#e8ecf1" }}></span>
                      <span>Loss</span>
                    </div>
                  </div>
                </div>

                <div className="donut-chart-item" onClick={() => setExpandedChart("quality")} style={{ cursor: "pointer" }}>
                  <div className="donut-chart-header">
                    <h3>Avg. Quality</h3>
                  </div>
                  <div className="donut-chart-wrapper">
                    {loading ? (
                      <div className="loading-spinner small">
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie data={qualityDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={62} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0} label={renderCustomLabel} labelLine={false} animationDuration={1200}>
                            {qualityDonut.map((entry, index) => (
                              <Cell key={`cell-q-${index}`} fill={DONUT_COLORS_3[index]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="donut-chart-legend">
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#9b59f0" }}></span>
                      <span>Good</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot" style={{ background: "#e8ecf1" }}></span>
                      <span>Defect</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Lines Overview */}
            <section className="dashboard-card lines-overview">
              <div className="card-header">
                <div className="card-header-left">
                  <h2>
                    <span className="card-icon blue">🏭</span>
                    Lines Overview
                  </h2>
                  <span className="card-subtitle">Operating status of production lines</span>
                </div>
                <div className="card-header-right">
                  <div className="status-filter-pills">
                    {statusDistribution.map((s) => (
                      <span key={s.name} className="status-pill" style={{ borderColor: s.color, color: s.color }}>
                        <span className="legend-dot" style={{ background: s.color }}></span>
                        {s.value} {s.name}
                      </span>
                    ))}
                  </div>
                  <span className="card-header-badge">{totalLines} Lines</span>
                </div>
              </div>
              <div className="card-content">
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Loading data...</span>
                  </div>
                ) : linesOverview.length === 0 ? (
                  <div className="no-data">
                    <span className="no-data-icon">📭</span>
                    <span>No lines data available</span>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("lineName")} style={{ cursor: "pointer" }}>
                          Line {getSortIcon("lineName")}
                        </th>
                        <th onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                          Status {getSortIcon("status")}
                        </th>
                        <th onClick={() => handleSort("busyHours")} style={{ cursor: "pointer" }}>
                          Operating Hours {getSortIcon("busyHours")}
                        </th>
                        <th>Available Machines</th>
                        <th>Capacity Load</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedLines().map((line) => {
                        const capacityPercent = (
                          ((line.busyHours || 0) / (line.availableHours || 1)) *
                          100
                        ).toFixed(0);
                        return (
                          <tr key={line.lineId} className={capacityPercent > 90 ? "row-highlight" : ""}>
                            <td className="line-name">{line.lineName}</td>
                            <td>
                              <span className={`status-badge ${getStatusClass(line.status)}`}>
                                <span className="status-pulse"></span>
                                {line.status}
                              </span>
                            </td>
                            <td>
                              {line.busyHours}h / {line.availableHours}h
                            </td>
                            <td>{line.availableMachines} machines</td>
                            <td>
                              <div className="capacity-cell">
                                <div className="capacity-bar">
                                  <div
                                    className="capacity-fill"
                                    style={{
                                      width: `${capacityPercent}%`,
                                      background:
                                        capacityPercent > 90
                                          ? "#e74c5e"
                                          : capacityPercent > 70
                                            ? "#f0ad4e"
                                            : "#36b58a",
                                    }}
                                  />
                                </div>
                                <span className="capacity-text">{capacityPercent}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Delays Alert */}
            <section className="dashboard-card delays-section">
              <div className="card-header">
                <div className="card-header-left">
                  <h2>
                    <span className="card-icon orange">⚠️</span>
                    Delay Alerts
                  </h2>
                  <span className="card-subtitle">Schedules at risk of delay</span>
                </div>
                <div className="card-header-right">
                  {criticalDelays > 0 && (
                    <span className="card-header-badge danger">{criticalDelays} Critical</span>
                  )}
                  {delays.length > 0 && (
                    <span className="card-header-badge">{delays.length} Alerts</span>
                  )}
                </div>
              </div>
              <div className="card-content">
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Loading data...</span>
                  </div>
                ) : filteredDelays.length === 0 ? (
                  <div className="no-data">
                    <span className="no-data-icon">
                      {searchQuery ? "🔍" : "✅"}
                    </span>
                    <span>
                      {searchQuery
                        ? `No results for "${searchQuery}"`
                        : "No delay alerts"}
                    </span>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Schedule ID</th>
                        <th>Line</th>
                        <th>Machine</th>
                        <th>Expected</th>
                        <th>Actual</th>
                        <th>Delay</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDelays.map((delay) => (
                        <tr
                          key={delay.scheduleId}
                          className={delay.risk?.toUpperCase() === "HIGH" ? "row-critical" : ""}
                        >
                          <td>#{delay.scheduleId}</td>
                          <td>{delay.line}</td>
                          <td>{delay.machine}</td>
                          <td>{delay.expected}</td>
                          <td>{delay.actual}</td>
                          <td className="delay-value">-{delay.delay}</td>
                          <td>
                            <span className={`risk-badge ${getRiskClass(delay.risk)}`}>
                              {delay.risk?.toUpperCase() === "HIGH" && "🔴 "}
                              {delay.risk?.toUpperCase() === "MEDIUM" && "🟡 "}
                              {delay.risk?.toUpperCase() === "LOW" && "🟢 "}
                              {delay.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="dashboard-footer">
            <div className="footer-left">
              <span>© 2026 Production Management System</span>
            </div>
            <div className="footer-right">
              <span className="footer-shortcut" title="Keyboard shortcuts">
                ⌨️ Ctrl+D: Dark Mode | Esc: Close
              </span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
