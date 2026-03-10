// ============================================================================
// NOTE: Backend does not have PlannerController.
// This page uses 100% mock data (hardcoded in fetchDashboardData).
// Planner CAN use Manager endpoints (plans, tracking) if backend
// grants permission to role PRODUCTION_PLANNER, but currently does not.
// ============================================================================
import React, { useState, useEffect } from "react";
import "./PlannerDashboard.css";
import OrderList from "./components/OrderList";
import LineStatus from "./components/LineStatus";
import WorkloadChart from "./components/WorkloadChart";

const PlannerDashboard = () => {
  const [stats, setStats] = useState({
    unscheduled: 0,
    atRisk: 0,
    overloadLines: 0,
    todayWorkload: 0,
  });

  const [orders, setOrders] = useState({
    unscheduled: [],
    atRisk: [],
  });

  const [lines, setLines] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [activeTab, setActiveTab] = useState("unscheduled");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Mock data - replace with actual API
    const mockOrders = {
      unscheduled: [
        {
          id: "ORD-001",
          customer: "Nike",
          style: "Air Max 90",
          quantity: 5000,
          dueDate: "2026-02-10",
          priority: "high",
        },
        {
          id: "ORD-002",
          customer: "Adidas",
          style: "Ultraboost",
          quantity: 3000,
          dueDate: "2026-02-15",
          priority: "medium",
        },
        {
          id: "ORD-003",
          customer: "Puma",
          style: "RS-X",
          quantity: 2500,
          dueDate: "2026-02-20",
          priority: "low",
        },
      ],
      atRisk: [
        {
          id: "ORD-004",
          customer: "Nike",
          style: "Jordan 1",
          quantity: 4000,
          dueDate: "2026-01-30",
          daysLeft: 4,
          progress: 65,
        },
        {
          id: "ORD-005",
          customer: "New Balance",
          style: "990v5",
          quantity: 2000,
          dueDate: "2026-02-01",
          daysLeft: 6,
          progress: 45,
        },
      ],
    };

    const mockLines = [
      {
        id: "LINE-A1",
        name: "Line A1",
        capacity: 100,
        currentLoad: 120,
        status: "overload",
      },
      {
        id: "LINE-A2",
        name: "Line A2",
        capacity: 100,
        currentLoad: 95,
        status: "high",
      },
      {
        id: "LINE-B1",
        name: "Line B1",
        capacity: 100,
        currentLoad: 75,
        status: "normal",
      },
      {
        id: "LINE-B2",
        name: "Line B2",
        capacity: 100,
        currentLoad: 110,
        status: "overload",
      },
    ];

    const mockWorkload = [
      { date: "26/01", planned: 850, capacity: 1000 },
      { date: "27/01", planned: 920, capacity: 1000 },
      { date: "28/01", planned: 1050, capacity: 1000 },
      { date: "29/01", planned: 780, capacity: 1000 },
      { date: "30/01", planned: 890, capacity: 1000 },
      { date: "31/01", planned: 650, capacity: 1000 },
      { date: "01/02", planned: 720, capacity: 1000 },
    ];

    setOrders(mockOrders);
    setLines(mockLines);
    setWorkloadData(mockWorkload);
    setStats({
      unscheduled: mockOrders.unscheduled.length,
      atRisk: mockOrders.atRisk.length,
      overloadLines: mockLines.filter((l) => l.status === "overload").length,
      todayWorkload: 85,
    });
  };

  return (
    <div className="planner-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1>📋 Planner Dashboard</h1>
          <p className="today-date">
            Today:{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="header-question">
          <span className="question-icon">💡</span>
          <span className="question-text">
            Which orders need scheduling today?
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div
          className="stat-card unscheduled"
          onClick={() => setActiveTab("unscheduled")}
        >
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <span className="stat-number">{stats.unscheduled}</span>
            <span className="stat-label">Unscheduled</span>
          </div>
        </div>

        <div
          className="stat-card at-risk"
          onClick={() => setActiveTab("atRisk")}
        >
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <span className="stat-number">{stats.atRisk}</span>
            <span className="stat-label">At Risk</span>
          </div>
        </div>

        <div
          className="stat-card overload"
          onClick={() => setActiveTab("lines")}
        >
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <span className="stat-number">{stats.overloadLines}</span>
            <span className="stat-label">Line Overload</span>
          </div>
        </div>

        <div
          className="stat-card workload"
          onClick={() => setActiveTab("workload")}
        >
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-number">{stats.todayWorkload}%</span>
            <span className="stat-label">Today's Workload</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Panel - Orders */}
        <div className="left-panel">
          <div className="panel-tabs">
            <button
              className={`tab-btn ${activeTab === "unscheduled" ? "active" : ""}`}
              onClick={() => setActiveTab("unscheduled")}
            >
              📝 Unscheduled ({orders.unscheduled.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "atRisk" ? "active" : ""}`}
              onClick={() => setActiveTab("atRisk")}
            >
              ⚠️ At Risk ({orders.atRisk.length})
            </button>
          </div>

          <div className="panel-content">
            {activeTab === "unscheduled" && (
              <OrderList orders={orders.unscheduled} type="unscheduled" />
            )}
            {activeTab === "atRisk" && (
              <OrderList orders={orders.atRisk} type="atRisk" />
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {/* Line Status */}
          <div className="panel-section">
            <h3>🏭 Line Status</h3>
            <LineStatus lines={lines} />
          </div>

          {/* Workload Chart */}
          <div className="panel-section">
            <h3>📈 This Week's Workload</h3>
            <WorkloadChart data={workloadData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerDashboard;
