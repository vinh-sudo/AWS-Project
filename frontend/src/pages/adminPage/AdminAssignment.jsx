import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import "./AdminAssignment.css";

const AdminAssignment = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [assignments, setAssignments] = useState([]);
  const [availableLeaders, setAvailableLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ lineId: "", leaderId: "" });

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

  const handleAssign = async () => {
    if (!assignForm.lineId || !assignForm.leaderId) return;
    try {
      setActionLoading(true);
      await adminService.assignLeaderToLine({
        lineId: Number(assignForm.lineId),
        leaderId: Number(assignForm.leaderId),
      });
      setShowAssignModal(false);
      setAssignForm({ lineId: "", leaderId: "" });
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

  const assignedLineIds = assignments.map((a) => a.lineId);

  return (
    <div className="admin-container">
      <AdminSidebar />

      <div className="admin-main">
        <header className="admin-header">
          <h1 className="header-title">Leader Assignment</h1>
          <div className="header-actions">
            <NotificationBell />
            <div className="user-menu">
              <div className="user-avatar"></div>
              <span className="user-name">
                {currentUser?.fullName || "Admin"}
              </span>
              <span className="dropdown-icon">▼</span>
            </div>
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
                <p className="loading-text">Loading assignments...</p>
              </div>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <p className="error-message">{error}</p>
              <button className="btn-primary" onClick={fetchData}>
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Header actions */}
              <div className="assignment-header">
                <div className="assignment-stats">
                  <div className="stat-badge">
                    <span className="stat-badge-label">Active</span>
                    <span className="stat-badge-value">
                      {assignments.length}
                    </span>
                  </div>
                  <div className="stat-badge available">
                    <span className="stat-badge-label">Available Leaders</span>
                    <span className="stat-badge-value">
                      {availableLeaders.length}
                    </span>
                  </div>
                </div>
                <button
                  className="btn-primary btn-assign"
                  onClick={() => setShowAssignModal(true)}
                  disabled={availableLeaders.length === 0 || actionLoading}
                >
                  + Assign Leader
                </button>
              </div>

              {/* Active Assignments Table */}
              <div className="assignment-table-container">
                <h3 className="section-title">Active Assignments</h3>
                {assignments.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📋</span>
                    <p>
                      No active assignments. Assign a leader to a line to get
                      started.
                    </p>
                  </div>
                ) : (
                  <table className="assignment-table">
                    <thead>
                      <tr>
                        <th>Line</th>
                        <th>Leader</th>
                        <th>Employee Code</th>
                        <th>Status</th>
                        <th>Start Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a.assignmentId}>
                          <td>
                            <span className="line-name">{a.lineName}</span>
                          </td>
                          <td>{a.leaderUsername || "—"}</td>
                          <td>
                            <code className="emp-code">
                              {a.leaderEmployeeCode}
                            </code>
                          </td>
                          <td>
                            <span
                              className={`status-badge status-${a.status?.toLowerCase()}`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td>
                            {a.startDate
                              ? new Date(a.startDate).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "—"}
                          </td>
                          <td>
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
                              Unassign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Available Leaders */}
              {availableLeaders.length > 0 && (
                <div className="assignment-table-container">
                  <h3 className="section-title">
                    Available Leaders (Unassigned)
                  </h3>
                  <table className="assignment-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Employee Code</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
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
                              : "Never"}
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
              <h2>Assign Leader to Line</h2>
              <button
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Production Line ID</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter line ID"
                  value={assignForm.lineId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, lineId: e.target.value })
                  }
                />
                {assignedLineIds.length > 0 && (
                  <small className="form-hint">
                    Already assigned: {assignedLineIds.join(", ")}
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Leader</label>
                <select
                  value={assignForm.leaderId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, leaderId: e.target.value })
                  }
                >
                  <option value="">-- Select Leader --</option>
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
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAssign}
                disabled={
                  !assignForm.lineId || !assignForm.leaderId || actionLoading
                }
              >
                {actionLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignment;
