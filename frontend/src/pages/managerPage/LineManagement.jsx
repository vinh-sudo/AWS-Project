import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./LineManagement.css";

const LineManagement = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);

  // Production Lines State
  const [productionLines, setProductionLines] = useState([
    {
      id: "LINE-SMT-01",
      name: "SMT Line 1",
      type: "SMT",
      location: "Building A - Floor 1",
      capacity: 500,
      capacityUnit: "boards/hour",
      status: "Running",
      oee: 85,
      shift: "Day Shift (08:00-17:00)",
      supervisor: "John Smith",
      machines: [
        {
          id: "M001",
          name: "Pick & Place A1",
          type: "Pick & Place",
          status: "Running",
          efficiency: 92,
        },
        {
          id: "M002",
          name: "Reflow Oven R1",
          type: "Reflow Oven",
          status: "Running",
          efficiency: 88,
        },
        {
          id: "M003",
          name: "AOI Inspector",
          type: "AOI",
          status: "Running",
          efficiency: 95,
        },
        {
          id: "M004",
          name: "Solder Paste Printer",
          type: "Printer",
          status: "Running",
          efficiency: 90,
        },
      ],
      currentOrder: "ORD-001",
      completedToday: 4200,
      targetToday: 5000,
    },
    {
      id: "LINE-SMT-02",
      name: "SMT Line 2",
      type: "SMT",
      location: "Building A - Floor 1",
      capacity: 450,
      capacityUnit: "boards/hour",
      status: "Running",
      oee: 72,
      shift: "Day Shift (08:00-17:00)",
      supervisor: "Jane Doe",
      machines: [
        {
          id: "M005",
          name: "Pick & Place A2",
          type: "Pick & Place",
          status: "Running",
          efficiency: 85,
        },
        {
          id: "M006",
          name: "Reflow Oven R2",
          type: "Reflow Oven",
          status: "Warning",
          efficiency: 70,
        },
        {
          id: "M007",
          name: "AOI Inspector 2",
          type: "AOI",
          status: "Running",
          efficiency: 90,
        },
      ],
      currentOrder: "ORD-003",
      completedToday: 2800,
      targetToday: 4000,
    },
    {
      id: "LINE-ASM-01",
      name: "Assembly Line 1",
      type: "Assembly",
      location: "Building B - Floor 1",
      capacity: 200,
      capacityUnit: "units/hour",
      status: "Idle",
      oee: 0,
      shift: "Day Shift (08:00-17:00)",
      supervisor: "Mike Johnson",
      machines: [
        {
          id: "M008",
          name: "Assembly Station 1",
          type: "Assembly",
          status: "Idle",
          efficiency: 0,
        },
        {
          id: "M009",
          name: "Assembly Station 2",
          type: "Assembly",
          status: "Idle",
          efficiency: 0,
        },
        {
          id: "M010",
          name: "Soldering Station",
          type: "Soldering",
          status: "Idle",
          efficiency: 0,
        },
      ],
      currentOrder: null,
      completedToday: 0,
      targetToday: 0,
    },
    {
      id: "LINE-TST-01",
      name: "Test Line 1",
      type: "Test",
      location: "Building B - Floor 2",
      capacity: 300,
      capacityUnit: "units/hour",
      status: "Running",
      oee: 60,
      shift: "Day Shift (08:00-17:00)",
      supervisor: "Sarah Williams",
      machines: [
        {
          id: "M011",
          name: "ICT Tester",
          type: "ICT",
          status: "Running",
          efficiency: 65,
        },
        {
          id: "M012",
          name: "FCT Tester",
          type: "FCT",
          status: "Running",
          efficiency: 70,
        },
        {
          id: "M013",
          name: "Burn-in Chamber",
          type: "Burn-in",
          status: "Maintenance",
          efficiency: 0,
        },
      ],
      currentOrder: "ORD-002",
      completedToday: 1500,
      targetToday: 2500,
    },
  ]);

  const [newLine, setNewLine] = useState({
    name: "",
    type: "SMT",
    location: "",
    capacity: "",
    capacityUnit: "boards/hour",
    shift: "Day Shift (08:00-17:00)",
    supervisor: "",
  });

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Running":
        return "status-running";
      case "Idle":
        return "status-idle";
      case "Maintenance":
        return "status-maintenance";
      case "Warning":
        return "status-warning";
      default:
        return "";
    }
  };

  const getOEEClass = (oee) => {
    if (oee >= 80) return "oee-good";
    if (oee >= 50) return "oee-warning";
    return "oee-low";
  };

  const handleAddLine = (e) => {
    e.preventDefault();
    const line = {
      id: `LINE-${newLine.type.toUpperCase()}-${String(productionLines.length + 1).padStart(2, "0")}`,
      ...newLine,
      capacity: parseInt(newLine.capacity),
      status: "Idle",
      oee: 0,
      machines: [],
      currentOrder: null,
      completedToday: 0,
      targetToday: 0,
    };
    setProductionLines([...productionLines, line]);
    setShowAddModal(false);
    setNewLine({
      name: "",
      type: "SMT",
      location: "",
      capacity: "",
      capacityUnit: "boards/hour",
      shift: "Day Shift (08:00-17:00)",
      supervisor: "",
    });
  };

  const handleViewMachines = (line) => {
    setSelectedLine(line);
    setShowMachineModal(true);
  };

  const totalCapacity = productionLines.reduce(
    (sum, line) => sum + line.capacity,
    0
  );
  const runningLines = productionLines.filter(
    (l) => l.status === "Running"
  ).length;
  const avgOEE = Math.round(
    productionLines
      .filter((l) => l.oee > 0)
      .reduce((sum, l) => sum + l.oee, 0) /
      productionLines.filter((l) => l.oee > 0).length || 0
  );

  return (
    <div className="line-management-container">
      {/* Sidebar - Simplified */}
      <aside className="line-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS Lines</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">🏭</span>
            <span>Line Management</span>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="line-main">
        {/* Header */}
        <header className="line-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <div className="header-title">
              <h1>Line & Capacity Management</h1>
              <p>Manage production lines and monitor capacity</p>
            </div>
          </div>
          <div className="header-right">
            <button
              className="btn-add-line"
              onClick={() => setShowAddModal(true)}
            >
              + Add New Line
            </button>
            <div className="user-info">
              <span className="user-name">
                {currentUser?.fullName || "Admin"}
              </span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </header>

        {/* Horizontal Tabs */}
        <div className="line-tabs">
          <button className="tab-btn active">🏭 All Lines</button>
          <button className="tab-btn">⚙️ Machines</button>
          <button className="tab-btn">📊 OEE Report</button>
          <button className="tab-btn">🔧 Maintenance</button>
        </div>

        {/* Overview Stats */}
        <div className="overview-stats">
          <div className="stat-card">
            <div className="stat-icon">🏭</div>
            <div className="stat-content">
              <span className="stat-number">{productionLines.length}</span>
              <span className="stat-label">Total Lines</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon running">▶</div>
            <div className="stat-content">
              <span className="stat-number">{runningLines}</span>
              <span className="stat-label">Running</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon capacity">📈</div>
            <div className="stat-content">
              <span className="stat-number">
                {totalCapacity.toLocaleString()}
              </span>
              <span className="stat-label">Total Capacity/hr</span>
            </div>
          </div>
          <div className="stat-card">
            <div className={`stat-icon oee ${getOEEClass(avgOEE)}`}>📊</div>
            <div className="stat-content">
              <span className="stat-number">{avgOEE}%</span>
              <span className="stat-label">Avg OEE</span>
            </div>
          </div>
        </div>

        {/* Lines Grid */}
        <div className="lines-grid">
          {productionLines.map((line) => (
            <div key={line.id} className="line-card">
              <div className="line-card-header">
                <div className="line-info">
                  <h3>{line.name}</h3>
                  <span className="line-id">{line.id}</span>
                </div>
                <span
                  className={`line-status-badge ${getStatusClass(line.status)}`}
                >
                  {line.status}
                </span>
              </div>

              <div className="line-type-badge">{line.type}</div>

              <div className="line-details">
                <div className="detail-row">
                  <span className="detail-label">📍 Location</span>
                  <span className="detail-value">{line.location}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">⚡ Capacity</span>
                  <span className="detail-value">
                    {line.capacity} {line.capacityUnit}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🕐 Shift</span>
                  <span className="detail-value">{line.shift}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">👤 Supervisor</span>
                  <span className="detail-value">{line.supervisor}</span>
                </div>
              </div>

              <div className="line-oee">
                <div className="oee-header">
                  <span>OEE</span>
                  <span className={`oee-value ${getOEEClass(line.oee)}`}>
                    {line.oee}%
                  </span>
                </div>
                <div className="oee-bar">
                  <div
                    className={`oee-fill ${getOEEClass(line.oee)}`}
                    style={{ width: `${line.oee}%` }}
                  ></div>
                </div>
              </div>

              {line.status === "Running" && (
                <div className="line-progress">
                  <div className="progress-header">
                    <span>Today's Progress</span>
                    <span>
                      {line.completedToday.toLocaleString()} /{" "}
                      {line.targetToday.toLocaleString()}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(line.completedToday / line.targetToday) * 100}%`,
                      }}
                    ></div>
                  </div>
                  {line.currentOrder && (
                    <div className="current-order">
                      Running: <strong>{line.currentOrder}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="line-machines-summary">
                <span className="machines-count">
                  ⚙️ {line.machines.length} Machines
                </span>
                <button
                  className="btn-view-machines"
                  onClick={() => handleViewMachines(line)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add Line Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Production Line</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddLine} className="line-form">
              <div className="form-group">
                <label>Line Name *</label>
                <input
                  type="text"
                  required
                  value={newLine.name}
                  onChange={(e) =>
                    setNewLine({ ...newLine, name: e.target.value })
                  }
                  placeholder="e.g., SMT Line 3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Line Type *</label>
                  <select
                    value={newLine.type}
                    onChange={(e) =>
                      setNewLine({ ...newLine, type: e.target.value })
                    }
                  >
                    <option value="SMT">SMT</option>
                    <option value="Assembly">Assembly</option>
                    <option value="Test">Test</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    required
                    value={newLine.location}
                    onChange={(e) =>
                      setNewLine({ ...newLine, location: e.target.value })
                    }
                    placeholder="e.g., Building A - Floor 2"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Capacity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newLine.capacity}
                    onChange={(e) =>
                      setNewLine({ ...newLine, capacity: e.target.value })
                    }
                    placeholder="e.g., 500"
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={newLine.capacityUnit}
                    onChange={(e) =>
                      setNewLine({ ...newLine, capacityUnit: e.target.value })
                    }
                  >
                    <option value="boards/hour">boards/hour</option>
                    <option value="units/hour">units/hour</option>
                    <option value="pcs/hour">pcs/hour</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Shift</label>
                  <select
                    value={newLine.shift}
                    onChange={(e) =>
                      setNewLine({ ...newLine, shift: e.target.value })
                    }
                  >
                    <option value="Day Shift (08:00-17:00)">
                      Day Shift (08:00-17:00)
                    </option>
                    <option value="Night Shift (20:00-05:00)">
                      Night Shift (20:00-05:00)
                    </option>
                    <option value="24/7 Operation">24/7 Operation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Supervisor</label>
                  <input
                    type="text"
                    value={newLine.supervisor}
                    onChange={(e) =>
                      setNewLine({ ...newLine, supervisor: e.target.value })
                    }
                    placeholder="Supervisor name"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Machine Details Modal */}
      {showMachineModal && selectedLine && (
        <div className="modal-overlay">
          <div className="modal-content modal-wide">
            <div className="modal-header">
              <h2>Machines - {selectedLine.name}</h2>
              <button
                className="modal-close"
                onClick={() => setShowMachineModal(false)}
              >
                ×
              </button>
            </div>
            <div className="machines-list">
              {selectedLine.machines.map((machine) => (
                <div key={machine.id} className="machine-card">
                  <div className="machine-header">
                    <div className="machine-info">
                      <h4>{machine.name}</h4>
                      <span className="machine-id">{machine.id}</span>
                    </div>
                    <span
                      className={`machine-status ${getStatusClass(machine.status)}`}
                    >
                      {machine.status}
                    </span>
                  </div>
                  <div className="machine-type">{machine.type}</div>
                  <div className="machine-efficiency">
                    <span>Efficiency</span>
                    <div className="efficiency-bar">
                      <div
                        className="efficiency-fill"
                        style={{
                          width: `${machine.efficiency}%`,
                          background:
                            machine.efficiency >= 80
                              ? "#4caf50"
                              : machine.efficiency >= 50
                                ? "#ff9800"
                                : "#f44336",
                        }}
                      ></div>
                    </div>
                    <span className="efficiency-value">
                      {machine.efficiency}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-add-machine">+ Add Machine</button>
              <button
                className="btn-close"
                onClick={() => setShowMachineModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineManagement;
