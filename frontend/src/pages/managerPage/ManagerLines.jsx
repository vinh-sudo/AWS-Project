import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import managerService from "../../services/managerService";
import "./ManagerLines.css";

const ManagerLines = () => {
  const [linesOverview, setLinesOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState(null);

  useEffect(() => {
    fetchLinesData();
  }, []);

  const fetchLinesData = async () => {
    setLoading(true);
    try {
      const response = await managerService.getLinesOverview();
      setLinesOverview(response);
    } catch (error) {
      console.error("Error fetching lines:", error);
      setLinesOverview(mockLinesData);
    } finally {
      setLoading(false);
    }
  };

  // Mock data with more details
  const mockLinesData = [
    {
      lineId: 1,
      lineName: "SMT Line 1",
      busyHours: 6.5,
      availableHours: 8,
      availableMachines: 4,
      status: "Running",
      supervisor: "Nguyễn Văn A",
      currentOrder: "ORD-001",
      completedToday: 2500,
      targetToday: 3000,
      machines: [
        {
          id: "M001",
          name: "Pick & Place A1",
          status: "Running",
          efficiency: 92,
        },
        {
          id: "M002",
          name: "Reflow Oven R1",
          status: "Running",
          efficiency: 88,
        },
        {
          id: "M003",
          name: "AOI Inspector",
          status: "Running",
          efficiency: 95,
        },
        {
          id: "M004",
          name: "Solder Paste Printer",
          status: "Maintenance",
          efficiency: 0,
        },
      ],
    },
    {
      lineId: 2,
      lineName: "SMT Line 2",
      busyHours: 7.2,
      availableHours: 8,
      availableMachines: 3,
      status: "Running",
      supervisor: "Trần Thị B",
      currentOrder: "ORD-002",
      completedToday: 1800,
      targetToday: 2500,
      machines: [
        {
          id: "M005",
          name: "Pick & Place A2",
          status: "Running",
          efficiency: 85,
        },
        {
          id: "M006",
          name: "Reflow Oven R2",
          status: "Warning",
          efficiency: 70,
        },
        {
          id: "M007",
          name: "AOI Inspector 2",
          status: "Running",
          efficiency: 90,
        },
      ],
    },
    {
      lineId: 3,
      lineName: "Assembly Line 1",
      busyHours: 0,
      availableHours: 8,
      availableMachines: 5,
      status: "Idle",
      supervisor: "Lê Văn C",
      currentOrder: null,
      completedToday: 0,
      targetToday: 0,
      machines: [
        {
          id: "M008",
          name: "Assembly Station 1",
          status: "Idle",
          efficiency: 0,
        },
        {
          id: "M009",
          name: "Assembly Station 2",
          status: "Idle",
          efficiency: 0,
        },
        {
          id: "M010",
          name: "Quality Check Station",
          status: "Idle",
          efficiency: 0,
        },
        {
          id: "M011",
          name: "Packaging Station 1",
          status: "Idle",
          efficiency: 0,
        },
        {
          id: "M012",
          name: "Packaging Station 2",
          status: "Idle",
          efficiency: 0,
        },
      ],
    },
    {
      lineId: 4,
      lineName: "Test Line 1",
      busyHours: 4.5,
      availableHours: 8,
      availableMachines: 2,
      status: "Running",
      supervisor: "Phạm Thị D",
      currentOrder: "ORD-001",
      completedToday: 1200,
      targetToday: 2000,
      machines: [
        { id: "M013", name: "ICT Tester", status: "Running", efficiency: 88 },
        {
          id: "M014",
          name: "Functional Tester",
          status: "Running",
          efficiency: 85,
        },
      ],
    },
  ];

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "running":
        return "status-running";
      case "idle":
        return "status-idle";
      case "maintenance":
        return "status-maintenance";
      case "warning":
        return "status-warning";
      default:
        return "";
    }
  };

  const getEfficiencyClass = (efficiency) => {
    if (efficiency >= 85) return "efficiency-high";
    if (efficiency >= 60) return "efficiency-medium";
    if (efficiency > 0) return "efficiency-low";
    return "efficiency-none";
  };

  const handleLineClick = (line) => {
    setSelectedLine(selectedLine?.lineId === line.lineId ? null : line);
  };

  // Use mock data that includes machine details
  const displayData =
    linesOverview.length > 0
      ? linesOverview.map((line) => ({
          ...line,
          ...(mockLinesData.find((m) => m.lineId === line.lineId) || {}),
        }))
      : mockLinesData;

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <h1>🏭 Quản lý dây chuyền sản xuất</h1>
            <p>Giám sát và quản lý các lines sản xuất</p>
          </div>
          <div className="header-right">
            <button className="btn-refresh" onClick={fetchLinesData}>
              🔄 Làm mới
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="lines-summary">
          <div className="summary-card">
            <div className="summary-icon running">🟢</div>
            <div className="summary-content">
              <span className="summary-value">
                {
                  displayData.filter(
                    (l) => l.status?.toLowerCase() === "running",
                  ).length
                }
              </span>
              <span className="summary-label">Đang chạy</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon idle">⚪</div>
            <div className="summary-content">
              <span className="summary-value">
                {
                  displayData.filter((l) => l.status?.toLowerCase() === "idle")
                    .length
                }
              </span>
              <span className="summary-label">Chờ việc</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon maintenance">🟡</div>
            <div className="summary-content">
              <span className="summary-value">
                {
                  displayData.filter(
                    (l) => l.status?.toLowerCase() === "maintenance",
                  ).length
                }
              </span>
              <span className="summary-label">Bảo trì</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon total">🏭</div>
            <div className="summary-content">
              <span className="summary-value">{displayData.length}</span>
              <span className="summary-label">Tổng Lines</span>
            </div>
          </div>
        </section>

        {/* Lines Grid */}
        <section className="lines-grid">
          {loading ? (
            <div className="loading-spinner">Đang tải...</div>
          ) : (
            displayData.map((line) => (
              <div
                key={line.lineId}
                className={`line-card ${selectedLine?.lineId === line.lineId ? "expanded" : ""}`}
                onClick={() => handleLineClick(line)}
              >
                <div className="line-card-header">
                  <div className="line-info">
                    <span className="line-name">{line.lineName}</span>
                    <span
                      className={`status-badge ${getStatusClass(line.status)}`}
                    >
                      {line.status}
                    </span>
                  </div>
                  <span className="expand-icon">
                    {selectedLine?.lineId === line.lineId ? "▼" : "▶"}
                  </span>
                </div>

                <div className="line-metrics">
                  <div className="metric">
                    <span className="metric-label">Giờ hoạt động</span>
                    <span className="metric-value">
                      {line.busyHours}h / {line.availableHours}h
                    </span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{
                          width: `${(line.busyHours / line.availableHours) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Máy khả dụng</span>
                    <span className="metric-value">
                      {line.availableMachines}
                    </span>
                  </div>
                </div>

                {line.currentOrder && (
                  <div className="line-current-order">
                    <span className="current-order-label">Đơn hiện tại:</span>
                    <span className="current-order-id">
                      #{line.currentOrder}
                    </span>
                  </div>
                )}

                {line.targetToday > 0 && (
                  <div className="line-progress">
                    <div className="progress-header">
                      <span>Tiến độ hôm nay</span>
                      <span>
                        {line.completedToday?.toLocaleString()} /{" "}
                        {line.targetToday?.toLocaleString()}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(line.completedToday / line.targetToday) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Expanded Content - Machines */}
                {selectedLine?.lineId === line.lineId && line.machines && (
                  <div className="line-machines">
                    <h4>Danh sách máy móc</h4>
                    <div className="machines-list">
                      {line.machines.map((machine) => (
                        <div key={machine.id} className="machine-item">
                          <div className="machine-info">
                            <span className="machine-name">{machine.name}</span>
                            <span
                              className={`machine-status ${getStatusClass(machine.status)}`}
                            >
                              {machine.status}
                            </span>
                          </div>
                          <div className="machine-efficiency">
                            <span className="efficiency-label">Hiệu suất:</span>
                            <span
                              className={`efficiency-value ${getEfficiencyClass(machine.efficiency)}`}
                            >
                              {machine.efficiency}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {line.supervisor && (
                      <div className="line-supervisor">
                        <span className="supervisor-label">👤 Quản lý:</span>
                        <span className="supervisor-name">
                          {line.supervisor}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default ManagerLines;
