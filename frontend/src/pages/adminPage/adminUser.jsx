import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import "./adminUser.css";

const UsersAdmin = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "MANAGER",
    employeeCode: "",
    status: true,
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const searchTimerRef = useRef(null);
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(0);
    }, 500);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(0);
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, debouncedSearch]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: currentPage, size: pageSize };
      if (roleFilter && roleFilter !== "All roles") params.role = roleFilter;
      if (debouncedSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const data = await adminService.getAccounts(params);
      setUsers(Array.isArray(data.content) ? data.content : []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || err.response?.data || "Failed to load users");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setActionLoading(true);
      const registerData = {
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        role: formData.role,
        employeeCode: formData.employeeCode || undefined,
      };
      await authService.register(registerData);
      resetForm();
      setShowCreateUser(false);
      fetchUsers();
      alert("User created successfully!");
    } catch (err) {
      console.error("Error creating user:", err);
      const msg = err.response?.data?.message || err.response?.data || err.message || "Unknown error";
      alert("Failed to create user:\n" + msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowCreateUser(false);
    setShowEditUser(false);
    setSelectedUser(null);
  };

  const resetForm = () => {
    setFormData({
      username: "", email: "", password: "", firstName: "", lastName: "",
      phoneNumber: "", role: "MANAGER", employeeCode: "", status: true,
    });
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || "", email: "", password: "", firstName: "", lastName: "",
      phoneNumber: "", role: user.role?.toUpperCase() || "MANAGER", status: user.status === "active",
    });
    setShowEditUser(true);
  };

  const handleEditSave = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      if (formData.role !== selectedUser.role) {
        await adminService.updateAccountRole(selectedUser.id, formData.role);
      }
      const currentlyActive = selectedUser.status === "active";
      if (formData.status !== currentlyActive) {
        if (formData.status) {
          await adminService.unlockAccount(selectedUser.id);
        } else {
          await adminService.lockAccount(selectedUser.id);
        }
      }
      resetForm();
      setShowEditUser(false);
      setSelectedUser(null);
      fetchUsers();
      alert("User updated successfully!");
    } catch (err) {
      console.error("Error updating user:", err);
      alert(err.response?.data?.message || err.response?.data || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async (user) => {
    try {
      setActionLoading(true);
      if (user.status === "active") {
        await adminService.lockAccount(user.id);
        alert(`Account "${user.username}" has been locked.`);
      } else {
        await adminService.unlockAccount(user.id);
        alert(`Account "${user.username}" has been unlocked.`);
      }
      fetchUsers();
    } catch (err) {
      console.error("Error toggling lock:", err);
      alert(err.response?.data?.message || err.response?.data || "Failed to update account status");
    } finally {
      setActionLoading(false);
    }
  };

  if (initialLoad && loading) {
    return (
      <div className="page-loading">
        <div className="loading-card">
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <p className="loading-text">Loading users...</p>
        </div>
      </div>
    );
  }

  if (showCreateUser) {
    return (
      <div className="create-user-page">
        <div className="modal">
          <div className="modal-header">
            <h2 className="modal-title">Create User</h2>
            <button className="close-button" onClick={handleCancel}>✕</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input type="text" placeholder="Enter username" value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)} className="form-input" />
            </div>
            <div className="form-row" style={{ display: "flex", gap: "16px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">First Name *</label>
                <input type="text" placeholder="Enter first name" value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)} className="form-input" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Last Name *</label>
                <input type="text" placeholder="Enter last name" value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" placeholder="Enter email" value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" placeholder="Enter phone number" value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" placeholder="Enter password" value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select value={formData.role} onChange={(e) => handleChange("role", e.target.value)} className="form-select">
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="LINE_LEADER">Line Leader</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Employee Code (auto-generated if empty)</label>
              <input type="text" placeholder="e.g. EMP001 (optional)" value={formData.employeeCode}
                onChange={(e) => handleChange("employeeCode", e.target.value)} className="form-input" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={handleCancel} disabled={actionLoading}>Cancel</button>
            <button className="btn-save" onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? "Creating..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminSidebar />

      <div className="admin-main">
        <header className="admin-header">
          <h1 className="header-title">Users Admin</h1>
          <div className="header-actions">
            <button className="header-icon-btn" onClick={fetchUsers} title="Refresh">🔄</button>
            <NotificationBell />
            <div className="user-menu">
              <div className="user-avatar"></div>
              <span className="user-name">{currentUser?.fullName || "Admin"}</span>
              <span className="dropdown-icon">▼</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {error && (
            <div className="error-banner" style={{
              background: "#ffebee", color: "#c62828", padding: "12px 16px",
              borderRadius: "8px", marginBottom: "16px", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}>
              <span>⚠️ {error}</span>
              <button onClick={fetchUsers} style={{
                background: "#c62828", color: "white", border: "none",
                padding: "6px 12px", borderRadius: "4px", cursor: "pointer",
              }}>Retry</button>
            </div>
          )}
          <div className="content-header">
            <h2 className="content-title">Users Management</h2>
            <button className="btn-primary" onClick={() => setShowCreateUser(true)}>+ Create User</button>
          </div>
          <div className="filters-container">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search by username or employee code..."
                value={searchTerm} onChange={handleSearchChange} className="search-input" />
            </div>
            <div className="role-filter">
              <label className="role-label">Role</label>
              <select value={roleFilter} onChange={handleRoleFilterChange} className="role-select">
                <option>All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="LINE_LEADER">Line Leader</option>
              </select>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            {loading && !initialLoad && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(255,255,255,0.7)", display: "flex",
                alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: "8px",
              }}>
                <span style={{ fontSize: "16px", color: "#555" }}>Loading...</span>
              </div>
            )}
            <table className="users-table">
              <thead>
                <tr>
                  <th className="table-header">Username</th>
                  <th className="table-header">Employee Code</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Last Login</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="table-row">
                      <td className="table-cell">{user.username}</td>
                      <td className="table-cell">{user.employeeCode || "-"}</td>
                      <td className="table-cell">{user.role}</td>
                      <td className="table-cell">
                        <span className={user.status === "active" ? "status-active" : "status-blocked"}>
                          {user.status === "active" ? "Active" : "Locked"}
                        </span>
                      </td>
                      <td className="table-cell">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "-"}
                      </td>
                      <td className="table-cell">
                        <button className="action-button" onClick={() => handleEditClick(user)}
                          title="Edit role & status" disabled={actionLoading}>✏️</button>
                        <button className={`action-button ${user.status === "active" ? "delete" : ""}`}
                          onClick={() => handleToggleLock(user)}
                          title={user.status === "active" ? "Lock account" : "Unlock account"}
                          disabled={actionLoading}>
                          {user.status === "active" ? "🔒" : "🔓"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination" style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                gap: "8px", marginTop: "20px", padding: "16px 0",
              }}>
                <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ddd",
                    background: currentPage === 0 ? "#f5f5f5" : "#fff",
                    cursor: currentPage === 0 ? "not-allowed" : "pointer" }}>
                  ← Previous
                </button>
                <span style={{ padding: "0 12px", color: "#555" }}>
                  Page {currentPage + 1} of {totalPages} ({totalElements} users)
                </span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ddd",
                    background: currentPage >= totalPages - 1 ? "#f5f5f5" : "#fff",
                    cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer" }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Edit User</h2>
              <button className="close-button" onClick={handleCancel}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" value={formData.username} disabled className="form-input"
                  style={{ background: "#f5f5f5", cursor: "not-allowed" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Employee Code</label>
                <input type="text" value={selectedUser?.employeeCode || "-"} disabled className="form-input"
                  style={{ background: "#f5f5f5", cursor: "not-allowed" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select value={formData.role} onChange={(e) => handleChange("role", e.target.value)}
                  className="form-select" disabled={selectedUser?.role === "ADMIN"}>
                  <option value="MANAGER">Manager</option>
                  <option value="LINE_LEADER">Line Leader</option>
                </select>
                {selectedUser?.role === "ADMIN" && (
                  <small style={{ color: "#999", marginTop: "4px", display: "block" }}>
                    Cannot change role of an Admin account
                  </small>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="toggle-container">
                  <button className={`toggle-button ${formData.status ? "active" : ""}`}
                    onClick={() => handleChange("status", true)}>Active</button>
                  <button className={`toggle-button ${!formData.status ? "active" : ""}`}
                    onClick={() => handleChange("status", false)}>Locked</button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancel} disabled={actionLoading}>Cancel</button>
              <button className="btn-save" onClick={handleEditSave} disabled={actionLoading}>
                {actionLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdmin;
