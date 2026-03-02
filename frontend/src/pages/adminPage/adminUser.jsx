import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import imsLogo from "../../assets/ims2.jpg";
import dashboardIcon from "../../assets/dashboard.jpg";
import userIcon from "../../assets/user.jpg";
import auditIcon from "../../assets/auditlog.jpg";
import "./adminUser.css";

const UsersAdmin = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "admin",
    status: true,
  });

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllUsers();
      // getAllUsers() returns [] since backend has no /api/admin/users endpoint yet
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setActionLoading(true);
      // Use /api/auth/register endpoint (the only user-creation endpoint available)
      const registerData = {
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        role: formData.role,
      };
      await authService.register(registerData);
      resetForm();
      setShowCreateUser(false);
      fetchUsers();
      alert("User created successfully!");
    } catch (err) {
      console.error("Error creating user:", err);
      alert(err.message || "Failed to create user");
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
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      role: "admin",
      status: true,
    });
  };

  // Edit user handlers
  const handleEditClick = (user) => {
    // NOTE: Backend chưa có endpoint /api/admin/users/{id} (PUT) để edit user.
    // Hiện tại chỉ hiển thị form nhưng save sẽ không hoạt động.
    alert(
      "Edit user is not available yet. Backend does not have user update endpoint.",
    );
    return;
    // Uncomment when backend adds PUT /api/admin/users/{id}
    /*
    setSelectedUser(user);
    setFormData({
      username: user.username || "",
      email: user.email || "",
      password: "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      role: user.role?.toLowerCase() || "admin",
      status: user.status === "active",
    });
    setShowEditUser(true);
    */
  };

  const handleEditSave = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      };

      // Only include password if it was changed
      if (formData.password) {
        userData.password = formData.password;
      }

      await adminService.updateUser(selectedUser.id, userData);

      // Update status if changed
      const newStatus = formData.status ? "active" : "blocked";
      if (newStatus !== selectedUser.status) {
        await adminService.updateUserStatus(selectedUser.id, newStatus);
      }

      resetForm();
      setShowEditUser(false);
      setSelectedUser(null);
      fetchUsers();
      alert("User updated successfully!");
    } catch (err) {
      console.error("Error updating user:", err);
      alert(err.response?.data?.message || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user handlers
  const handleDeleteClick = (user) => {
    // NOTE: Backend chưa có endpoint /api/admin/users/{id} (DELETE).
    alert(
      "Delete user is not available yet. Backend does not have user delete endpoint.",
    );
    return;
    // Uncomment when backend adds DELETE /api/admin/users/{id}
    /*
    setSelectedUser(user);
    setShowDeleteConfirm(true);
    */
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await adminService.deleteUser(selectedUser.id);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      fetchUsers();
      alert("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSelectedUser(null);
  };

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All roles" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-card">
          <img src={imsLogo} alt="Logo" className="loading-logo" />
          <h2 className="loading-title">IMS Admin</h2>
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
            <button className="close-button" onClick={handleCancel}>
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-row" style={{ display: "flex", gap: "16px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="form-select"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="worker">Worker</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-cancel"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={actionLoading}
            >
              {actionLoading ? "Creating..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title">IMS Admin</div>
        </div>

        <nav className="sidebar-nav">
          <div
            className="nav-item"
            onClick={() => navigate("/admin/dashboard")}
          >
            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" />
            <span>Dashboard</span>
          </div>{" "}
          <div className="nav-item" onClick={() => navigate("/admin/approval")}>
            <span className="nav-icon">✅</span>
            <span>Task Approval</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin/orders")}>
            <span className="nav-icon">📦</span>
            <span>Order Management</span>
          </div>{" "}
          <div className="nav-item active">
            <img src={userIcon} alt="Users" className="nav-icon-img" />
            <span>User Management</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/admin/audit-log")}
          >
            <img src={auditIcon} alt="Audit Log" className="nav-icon-img" />
            <span>Audit Log</span>
          </div>
        </nav>

        <div className="logout-item">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </div>

      <div className="admin-main">
        <header className="admin-header">
          <h1 className="header-title">Users Admin</h1>
          <div className="header-actions">
            <button
              className="header-icon-btn"
              onClick={fetchUsers}
              title="Refresh"
            >
              🔄
            </button>
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

        <div className="admin-content">
          {error && (
            <div
              className="error-banner"
              style={{
                background: "#ffebee",
                color: "#c62828",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>⚠️ {error}</span>
              <button
                onClick={fetchUsers}
                style={{
                  background: "#c62828",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}
          <div className="content-header">
            <h2 className="content-title">Users Management</h2>
            <button
              className="btn-primary"
              onClick={() => setShowCreateUser(true)}
            >
              + Create User
            </button>
          </div>
          <div className="filters-container">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>{" "}
            <div className="role-filter">
              <label className="role-label">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="role-select"
              >
                <option>All roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="worker">Worker</option>
              </select>
            </div>
          </div>{" "}
          <table className="users-table">
            <thead>
              <tr>
                <th className="table-header">Username</th>
                <th className="table-header">Full Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#666",
                    }}
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">{user.username}</td>
                    <td className="table-cell">{user.fullName || "-"}</td>
                    <td className="table-cell">{user.email || "-"}</td>
                    <td className="table-cell">{user.role}</td>
                    <td className="table-cell">
                      <span
                        className={
                          user.status === "active"
                            ? "status-active"
                            : "status-blocked"
                        }
                      >
                        {user.status === "active" ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button
                        className="action-button"
                        onClick={() => handleEditClick(user)}
                        title="Edit user"
                        disabled={actionLoading}
                      >
                        ✏️
                      </button>
                      <button
                        className="action-button delete"
                        onClick={() => handleDeleteClick(user)}
                        title="Delete user"
                        disabled={actionLoading}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Edit User</h2>
              <button className="close-button" onClick={handleCancel}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  disabled
                  className="form-input"
                  style={{ background: "#f5f5f5", cursor: "not-allowed" }}
                />
              </div>

              <div
                className="form-row"
                style={{ display: "flex", gap: "16px" }}
              >
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="form-select"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="worker">Worker</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="toggle-container">
                  <button
                    className={`toggle-button ${formData.status ? "active" : ""}`}
                    onClick={() => handleChange("status", true)}
                  >
                    Active
                  </button>
                  <button
                    className={`toggle-button ${!formData.status ? "active" : ""}`}
                    onClick={() => handleChange("status", false)}
                  >
                    Blocked
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleEditSave}
                disabled={actionLoading}
              >
                {actionLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h2 className="modal-title">Confirm Delete</h2>
              <button className="close-button" onClick={handleDeleteCancel}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="delete-message">
                Are you sure you want to delete user{" "}
                <strong>{selectedUser.username}</strong>?
              </p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleDeleteCancel}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn-delete"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdmin;
