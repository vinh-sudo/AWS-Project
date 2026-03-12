import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import managerService from "../../services/managerService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./ManagerReports.css";

const ManagerReports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Date range for statistics
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];
  const [dateFrom, setDateFrom] = useState(weekAgo);
  const [dateTo, setDateTo] = useState(today);
  const [overviewRange, setOverviewRange] = useState("TODAY");

  // Data states
  const [productionOverview, setProductionOverview] = useState(null);
  const [oeeTrend, setOeeTrend] = useState([]);
  const [lineComparison, setLineComparison] = useState([]);
  const [yieldTrend, setYieldTrend] = useState([]);
  const [scheduleAdherence, setScheduleAdherence] = useState(null);
  const [incidentSummary, setIncidentSummary] = useState(null);

  // Fetch production overview
  const fetchOverview = async () => {
    try {
      const data = await managerService.getProductionOverview(overviewRange);
      setProductionOverview(data);
    } catch (err) {
      console.error("Error fetching production overview:", err);
    }
  };

  // Fetch all trend data
  const fetchTrendData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use Promise.allSettled so one failing API doesn't block the rest
      const [oeeRes, lineRes, yieldRes, schedRes, incRes] =
        await Promise.allSettled([
          managerService.getOeeTrend(dateFrom, dateTo),
          managerService.getLineComparison(dateFrom, dateTo),
          managerService.getYieldTrend(dateFrom, dateTo),
          managerService.getScheduleAdherence(dateFrom, dateTo),
          managerService.getIncidentSummary(dateFrom, dateTo),
        ]);

      setOeeTrend(
        oeeRes.status === "fulfilled" ? oeeRes.value?.items || [] : [],
      );
      setLineComparison(
        lineRes.status === "fulfilled" ? lineRes.value?.lines || [] : [],
      );
      setYieldTrend(
        yieldRes.status === "fulfilled" ? yieldRes.value?.items || [] : [],
      );
      setScheduleAdherence(
        schedRes.status === "fulfilled" ? schedRes.value || null : null,
      );
      setIncidentSummary(
        incRes.status === "fulfilled" ? incRes.value || null : null,
      );

      // Collect partial errors
      const errors = [oeeRes, lineRes, yieldRes, schedRes, incRes]
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason?.message || "Unknown error");
      if (errors.length > 0) {
        console.error("Partial statistics errors:", errors);
        if (errors.length === 5) {
          setError("Failed to load statistics. Please try again.");
        }
      }
    } catch (err) {
      console.error("Error fetching trend data:", err);
      setError("Failed to load statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [overviewRange]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTrendData();
  }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format OEE trend for chart (values are 0-1, convert to %)
  const oeeChartData = oeeTrend.map((item) => ({
    date: item.workDate,
    OEE: parseFloat(((item.oee || 0) * 100).toFixed(1)),
    Availability: parseFloat(((item.availability || 0) * 100).toFixed(1)),
    Performance: parseFloat(((item.performance || 0) * 100).toFixed(1)),
    Quality: parseFloat(((item.quality || 0) * 100).toFixed(1)),
  }));

  // Format yield trend for chart
  const yieldChartData = yieldTrend.map((item) => ({
    date: item.workDate,
    "Good Rate": parseFloat(((item.goodRate || 0) * 100).toFixed(1)),
    "Reject Rate": parseFloat(((item.rejectRate || 0) * 100).toFixed(1)),
  }));

  // Format line comparison for chart
  const lineChartData = lineComparison.map((item) => ({
    name: item.lineName,
    Good: item.totalGood || 0,
    Reject: item.totalReject || 0,
    OEE: parseFloat(((item.oee || 0) * 100).toFixed(1)),
  }));

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <h1>📊 Statistics & Reports</h1>
            <p>Production analytics and performance insights</p>
          </div>
          <div className="header-right">
            <div className="date-range-picker">
              <label>From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="date-picker"
              />
              <label>To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="date-picker"
              />
            </div>
            <button className="btn-refresh" onClick={fetchTrendData}>
              🔄 Refresh
            </button>
            <NotificationBell />
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={fetchTrendData}>Retry</button>
          </div>
        )}

        {/* Tabs */}
        <div className="report-tabs">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            🎯 Production Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "oee" ? "active" : ""}`}
            onClick={() => setActiveTab("oee")}
          >
            📈 OEE Trend
          </button>
          <button
            className={`tab-btn ${activeTab === "lines" ? "active" : ""}`}
            onClick={() => setActiveTab("lines")}
          >
            🏭 Line Comparison
          </button>
          <button
            className={`tab-btn ${activeTab === "yield" ? "active" : ""}`}
            onClick={() => setActiveTab("yield")}
          >
            📊 Yield Trend
          </button>
          <button
            className={`tab-btn ${activeTab === "schedule" ? "active" : ""}`}
            onClick={() => setActiveTab("schedule")}
          >
            📅 Schedule Adherence
          </button>
          <button
            className={`tab-btn ${activeTab === "incidents" ? "active" : ""}`}
            onClick={() => setActiveTab("incidents")}
          >
            🔧 Incidents
          </button>
        </div>

        {/* Content */}
        <div className="report-content" style={{ position: "relative" }}>
          {loading && (
            <PageLoading variant="overlay" />
          )}

          {/* === Production Overview === */}
          {activeTab === "overview" && (
            <section className="report-section">
              <div className="section-header">
                <h2>Production Overview</h2>
                <div className="range-toggle">
                  {["TODAY", "WEEK", "MONTH"].map((range) => (
                    <button
                      key={range}
                      className={`toggle-btn ${overviewRange === range ? "active" : ""}`}
                      onClick={() => setOverviewRange(range)}
                    >
                      {range === "TODAY"
                        ? "Today"
                        : range === "WEEK"
                          ? "This Week"
                          : "This Month"}
                    </button>
                  ))}
                </div>
              </div>

              {productionOverview ? (
                <div className="overview-grid">
                  <div className="overview-card good">
                    <div className="overview-icon">✅</div>
                    <div className="overview-info">
                      <span className="overview-value">
                        {(productionOverview.totalGood || 0).toLocaleString()}
                      </span>
                      <span className="overview-label">Good Products</span>
                    </div>
                  </div>
                  <div className="overview-card reject">
                    <div className="overview-icon">❌</div>
                    <div className="overview-info">
                      <span className="overview-value">
                        {(productionOverview.totalReject || 0).toLocaleString()}
                      </span>
                      <span className="overview-label">Rejected</span>
                    </div>
                  </div>
                  <div className="overview-card target">
                    <div className="overview-icon">🎯</div>
                    <div className="overview-info">
                      <span className="overview-value">
                        {(productionOverview.totalTarget || 0).toLocaleString()}
                      </span>
                      <span className="overview-label">Target</span>
                    </div>
                  </div>
                  <div className="overview-card achievement">
                    <div className="overview-icon">📊</div>
                    <div className="overview-info">
                      <span className="overview-value">
                        {(
                          (productionOverview.achievementRate || 0) * 100
                        ).toFixed(1)}
                        %
                      </span>
                      <span className="overview-label">Achievement Rate</span>
                    </div>
                  </div>
                  <div className="overview-card downtime">
                    <div className="overview-icon">⏱️</div>
                    <div className="overview-info">
                      <span className="overview-value">
                        {productionOverview.totalDowntimeMinutes || 0} min
                      </span>
                      <span className="overview-label">Total Downtime</span>
                    </div>
                  </div>
                  <div className="overview-card reject-rate">
                    <div className="overview-icon">⚠️</div>
                    <div className="overview-info">
                      <span className="overview-value">
                        {((productionOverview.rejectRate || 0) * 100).toFixed(
                          1,
                        )}
                        %
                      </span>
                      <span className="overview-label">Reject Rate</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  <span className="no-data-icon">📭</span>
                  <span>No production data available for this period</span>
                </div>
              )}
            </section>
          )}

          {/* === OEE Trend === */}
          {activeTab === "oee" && (
            <section className="report-section">
              <div className="section-header">
                <h2>
                  OEE Trend ({dateFrom} → {dateTo})
                </h2>
              </div>
              {oeeChartData.length === 0 ? (
                <div className="no-data">
                  <span className="no-data-icon">📭</span>
                  <span>No OEE data available for this date range</span>
                </div>
              ) : (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={oeeChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [`${value}%`]} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="OEE"
                        stroke="#4a6cf7"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Availability"
                        stroke="#36b58a"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Performance"
                        stroke="#9b59f0"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Quality"
                        stroke="#f7a94a"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          )}

          {/* === Line Comparison === */}
          {activeTab === "lines" && (
            <section className="report-section">
              <div className="section-header">
                <h2>
                  Line Comparison ({dateFrom} → {dateTo})
                </h2>
              </div>
              {lineChartData.length === 0 ? (
                <div className="no-data">
                  <span className="no-data-icon">📭</span>
                  <span>No line comparison data available</span>
                </div>
              ) : (
                <>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={lineChartData} barCategoryGap="20%">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#eef0f5"
                          vertical={false}
                        />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="Good"
                          fill="#36b58a"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="Reject"
                          fill="#e74c3c"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Comparison Table */}
                  <div className="comparison-table-wrapper">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Line</th>
                          <th>Good</th>
                          <th>Reject</th>
                          <th>Target</th>
                          <th>OEE</th>
                          <th>Yield Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineComparison.map((line) => (
                          <tr key={line.lineId}>
                            <td className="line-name">{line.lineName}</td>
                            <td className="text-success">
                              {(line.totalGood || 0).toLocaleString()}
                            </td>
                            <td className="text-danger">
                              {(line.totalReject || 0).toLocaleString()}
                            </td>
                            <td>{(line.totalTarget || 0).toLocaleString()}</td>
                            <td>
                              <span
                                className={`oee-badge ${(line.oee || 0) >= 0.85 ? "excellent" : (line.oee || 0) >= 0.65 ? "good" : "poor"}`}
                              >
                                {((line.oee || 0) * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td>{((line.yieldRate || 0) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}

          {/* === Yield Trend === */}
          {activeTab === "yield" && (
            <section className="report-section">
              <div className="section-header">
                <h2>
                  Yield Trend ({dateFrom} → {dateTo})
                </h2>
              </div>
              {yieldChartData.length === 0 ? (
                <div className="no-data">
                  <span className="no-data-icon">📭</span>
                  <span>No yield data available for this date range</span>
                </div>
              ) : (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={yieldChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [`${value}%`]} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Good Rate"
                        stroke="#36b58a"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Reject Rate"
                        stroke="#e74c3c"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          )}

          {/* === Schedule Adherence === */}
          {activeTab === "schedule" && (
            <section className="report-section">
              <div className="section-header">
                <h2>
                  Schedule Adherence ({dateFrom} → {dateTo})
                </h2>
              </div>
              {scheduleAdherence ? (
                <div className="adherence-grid">
                  <div className="adherence-card total">
                    <span className="adherence-value">
                      {scheduleAdherence.totalSchedules || 0}
                    </span>
                    <span className="adherence-label">Total Schedules</span>
                  </div>
                  <div className="adherence-card completed">
                    <span className="adherence-value">
                      {scheduleAdherence.completedCount || 0}
                    </span>
                    <span className="adherence-label">Completed</span>
                  </div>
                  <div className="adherence-card running">
                    <span className="adherence-value">
                      {scheduleAdherence.runningCount || 0}
                    </span>
                    <span className="adherence-label">Running</span>
                  </div>
                  <div className="adherence-card paused">
                    <span className="adherence-value">
                      {scheduleAdherence.pausedCount || 0}
                    </span>
                    <span className="adherence-label">Paused</span>
                  </div>
                  <div className="adherence-card rate">
                    <span className="adherence-value">
                      {((scheduleAdherence.completionRate || 0) * 100).toFixed(
                        1,
                      )}
                      %
                    </span>
                    <span className="adherence-label">Completion Rate</span>
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  <span className="no-data-icon">📭</span>
                  <span>No schedule data available for this date range</span>
                </div>
              )}
            </section>
          )}

          {/* === Incident Summary === */}
          {activeTab === "incidents" && (
            <section className="report-section">
              <div className="section-header">
                <h2>
                  Incident Summary ({dateFrom} → {dateTo})
                </h2>
              </div>
              {incidentSummary && incidentSummary.totalIncidents > 0 ? (
                <>
                  <div className="incident-total">
                    <span className="incident-total-value">
                      {incidentSummary.totalIncidents}
                    </span>
                    <span className="incident-total-label">
                      Total Incidents
                    </span>
                  </div>
                  <div className="incident-table-wrapper">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Incident Type</th>
                          <th>Severity</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(incidentSummary.breakdown || []).map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.incidentType}</td>
                            <td>
                              <span
                                className={`severity-badge severity-${(item.severity || "").toLowerCase()}`}
                              >
                                {item.severity}
                              </span>
                            </td>
                            <td>{item.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="no-data">
                  <span className="no-data-icon">✅</span>
                  <span>No incidents recorded for this date range</span>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerReports;
