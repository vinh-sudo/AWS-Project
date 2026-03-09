import React, { useState, useEffect } from "react";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import "./AdminAssignment.css";
import "./AdminDashboard.css";

const TOTAL_LINES = 5;

const AdminAssignment = () => {
  const currentUser = authService.getCurrentUser();

  const [assignments, setAssignments] = useState([]);
  const [availableLeaders, setAvailableLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assignData, leaderData] = await Promise.all([
        adminService.getAssignments(),
        adminService.getAvailableLeaders(),
      ]);
      setAssignments(assignData || []);
      setAvailableLeaders(leaderData || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError(err.response?.data?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (lineId) => {
    setSelectedLineId(lineId);
    setSelectedLeaderId("");
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedLineId || !selectedLeaderId) return;
    try {
      setActionLoading(true);
      await adminService.assignLeaderToLine({
        lineId: selectedLineId,
        leaderId: Number(selectedLeaderId),
      });
      setShowAssignModal(false);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign leader");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassign = async (assignmentId, leaderCode) => {
    if (!window.confirm(`Gỡ leader ${leaderCode} khỏi dây chuyền?`)) return;
    try {
      setActionLoading(true);
      await adminService.unassignLeader(assignmentId);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unassign leader");
    } finally {
      setActionLoading(false);
    }
  };

  // Build line slots: merge known assignments with empty slots
  const buildLineSlots = () => {
    const assignmentMap = {};
    assignments.forEach((a) => {
      assignmentMap[a.lineId] = a;
    });

    const slots = [];
    // Lines from assignments (may include IDs outside 1-5)
    const knownIds = new Set();
    for (let i = 1; i <= TOTAL_LINES; i++) {
      knownIds.add(i);
      slots.push({
        lineId: i,
        lineName: assignmentMap[i]?.lineName || `Line ${i}`,
        assignment: assignmentMap[i] || null,
      });
    }
    // Include any assignment lines outside 1-5 range
    assignments.forEach((a) => {
      if (!knownIds.has(a.lineId)) {
        slots.push({
          lineId: a.lineId,
          lineName: a.lineName,
          assignment: a,
        });
      }
    });
    return slots;
  };

  const lineSlots = loading ? [] : buildLineSlots();
  const assignedCount = assignments.length;

  return (
    <div className="admin-container">
      <AdminSidebar />

      <div className="admin-main">
<<<<<<< HEAD
        <header className="admin-header">
          <h1 className="header-title">Gán Leader vào Line</h1>
          <div className="header-actions">
            <NotificationBell />
            <div className="user-menu">
              <div className="user-avatar"></div>
              <span className="user-name">
                {currentUser?.fullName || "Admin"}
              </span>
=======
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="dash-header-avatar">
              {(currentUser?.fullName || "A").charAt(0).toUpperCase()}
>>>>>>> b61125edceb7d7cbf1893e48420b9c1980fe130e
            </div>
            <div>
              <h1 className="dash-title">Leader Assignment</h1>
              <p className="dash-subtitle">Assign line leaders to production lines</p>
            </div>
          </div>
          <div className="dash-header-right">
            <NotificationBell />
          </div>
        </header>

        <div className="admin-content assignment-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-skeleton">
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
                <p className="loading-text">Đang tải...</p>
              </div>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <p className="error-message">{error}</p>
              <button className="btn-primary" onClick={fetchData}>
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="assignment-header">
                <div className="assignment-stats">
                  <div className="stat-badge">
                    <span className="stat-badge-label">Đã gán</span>
                    <span className="stat-badge-value">{assignedCount}</span>
                  </div>
                  <div className="stat-badge available">
                    <span className="stat-badge-label">Line trống</span>
                    <span className="stat-badge-value">
                      {lineSlots.filter((s) => !s.assignment).length}
                    </span>
                  </div>
                  <div className="stat-badge leader-stat">
                    <span className="stat-badge-label">Leader khả dụng</span>
                    <span className="stat-badge-value">
                      {availableLeaders.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Cards Grid */}
              <div className="line-grid">
                {lineSlots.map((slot) => {
                  const a = slot.assignment;
                  const isAssigned = !!a;
                  return (
                    <div
                      key={slot.lineId}
                      className={`line-card ${isAssigned ? "assigned" : "vacant"}`}
                    >
                      <div className="line-card-header">
                        <div className="line-card-id">Line {slot.lineId}</div>
                        <span
                          className={`line-status-dot ${isAssigned ? "dot-active" : "dot-vacant"}`}
                        />
                      </div>
                      <div className="line-card-name">{slot.lineName}</div>

                      {isAssigned ? (
                        <div className="line-card-body">
                          <div className="leader-info">
                            <div className="leader-avatar">
                              {a.leaderUsername?.charAt(0)?.toUpperCase() ||
                                "L"}
                            </div>
                            <div className="leader-details">
                              <span className="leader-username">
                                {a.leaderUsername || "—"}
                              </span>
                              <code className="emp-code">
                                {a.leaderEmployeeCode}
                              </code>
                            </div>
                          </div>
                          <div className="line-card-meta">
                            Từ{" "}
                            {a.startDate
                              ? new Date(a.startDate).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "—"}
                          </div>
                          <button
                            className="btn-unassign"
                            onClick={() =>
                              handleUnassign(
                                a.assignmentId,
                                a.leaderEmployeeCode,
                              )
                            }
                            disabled={actionLoading}
                          >
                            Gỡ Leader
                          </button>
                        </div>
                      ) : (
                        <div className="line-card-body vacant-body">
                          <div className="vacant-icon">👤</div>
                          <p className="vacant-text">Chưa có leader</p>
                          <button
                            className="btn-assign-card"
                            onClick={() => openAssignModal(slot.lineId)}
                            disabled={
                              availableLeaders.length === 0 || actionLoading
                            }
                          >
                            + Gán Leader
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Available Leaders Table */}
              {availableLeaders.length > 0 && (
                <div className="assignment-table-container">
                  <h3 className="section-title">
                    Leader chưa gán ({availableLeaders.length})
                  </h3>
                  <table className="assignment-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Mã nhân viên</th>
                        <th>Role</th>
                        <th>Trạng thái</th>
                        <th>Đăng nhập cuối</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableLeaders.map((l) => (
                        <tr key={l.id}>
                          <td>{l.username}</td>
                          <td>
                            <code className="emp-code">{l.employeeCode}</code>
                          </td>
                          <td>{l.role}</td>
                          <td>
                            <span
                              className={`status-badge status-${l.status?.toLowerCase()}`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td>
                            {l.lastLogin
                              ? new Date(l.lastLogin).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "Chưa"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gán Leader → Line {selectedLineId}</h2>
              <button
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Chọn Leader</label>
                <select
                  value={selectedLeaderId}
                  onChange={(e) => setSelectedLeaderId(e.target.value)}
                >
                  <option value="">-- Chọn Leader --</option>
                  {availableLeaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.username} ({l.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAssignModal(false)}
              >
                Huỷ
              </button>
              <button
                className="btn-primary"
                onClick={handleAssign}
                disabled={!selectedLeaderId || actionLoading}
              >
                {actionLoading ? "Đang gán..." : "Gán Leader"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignment;
