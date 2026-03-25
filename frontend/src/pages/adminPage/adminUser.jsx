import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./adminUser.css";

/* ── Helpers ── */
const getRoleBadgeClass = (role) => {
  switch (role?.toUpperCase()) {
    case "ADMIN": return "admin";
    case "MANAGER": return "manager";
    case "LINE_LEADER": return "line-leader";
    default: return "manager";
  }
};

const getInitials = (username = "") =>
  username.substring(0, 2).toUpperCase() || "U";

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

/* ── Component ── */
const UsersAdmin = () => {
  const currentUser = authService.getCurrentUser();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "", email: "", password: "", firstName: "", lastName: "",
    phoneNumber: "", role: "MANAGER", employeeCode: "", status: true,
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;
  const feedbackTimerRef = useRef(null);

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 2600);
  }, []);

  /* Search debounce */
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
  useEffect(() => () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); }, []);

  /* API */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: currentPage, size: pageSize };
      if (roleFilter && roleFilter !== "All roles") params.role = roleFilter;
      if (debouncedSearch?.trim()) params.search = debouncedSearch.trim();
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
    }  }, [currentPage, pageSize, roleFilter, debouncedSearch]);

  useEffect(() => {
    return () => window.clearTimeout(feedbackTimerRef.current);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => setFormData({
    username: "", email: "", password: "", firstName: "", lastName: "",
    phoneNumber: "", role: "MANAGER", employeeCode: "", status: true,
  });

  const handleCancel = () => { resetForm(); setShowCreateUser(false); setShowEditUser(false); setSelectedUser(null); };

  /* Create */
  const handleSave = async () => {
    try {
      setActionLoading(true);
      await authService.register({
        username: formData.username, password: formData.password,
        firstName: formData.firstName, lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        role: formData.role,
        employeeCode: formData.employeeCode || undefined,
      });
      resetForm(); setShowCreateUser(false); fetchUsers();
      showFeedback("success", "User created successfully.");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || "Unknown error";
      showFeedback("error", `Failed to create user: ${msg}`);
    } finally { setActionLoading(false); }
  };

  /* Edit */
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
      if (formData.role !== selectedUser.role) await adminService.updateAccountRole(selectedUser.id, formData.role);
      const currentlyActive = selectedUser.status === "active";
      if (formData.status !== currentlyActive) {
        formData.status ? await adminService.unlockAccount(selectedUser.id) : await adminService.lockAccount(selectedUser.id);
      }
      resetForm(); setShowEditUser(false); setSelectedUser(null); fetchUsers();
      showFeedback("success", "User updated successfully.");
    } catch (err) {
      showFeedback("error", err.response?.data?.message || err.response?.data || "Failed to update user");
    } finally { setActionLoading(false); }
  };

  const handleToggleLock = async (user) => {
    try {
      setActionLoading(true);
      if (user.status === "active") {
        await adminService.lockAccount(user.id);
        showFeedback("success", `Account "${user.username}" has been locked.`);
      } else {
        await adminService.unlockAccount(user.id);
        showFeedback("success", `Account "${user.username}" has been unlocked.`);
      }
      fetchUsers();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || err.response?.data || "Failed to update account status");
    } finally { setActionLoading(false); }
  };

  /* Stats */
  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "active").length;
    return { total: totalElements, active, locked: totalElements - active };
  }, [users, totalElements]);
  /* Pagination helpers */
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) start = Math.max(0, end - maxVisible);
    for (let i = start; i < end; i++) pages.push(i);
    return pages;
  };

  const getUserInitial = () => {
    const name = currentUser?.fullName || "Admin";
    return name.charAt(0).toUpperCase();
  };  /* ── Loading Screen ── */
  if (initialLoad && loading) {
    return (
      <div className="admin-container users-admin-page">
        <AdminSidebar />
        <div className="admin-main">
          <PageLoading variant="fullpage" text="Loading users..." />
        </div>
      </div>
    );
  }

  /* ── Create User Modal (Full-page) ── */
  if (showCreateUser) {
    return (
      <div className="create-user-page">
        <div className="modal">
          <div className="modal-header">
            <h2 className="modal-title">Create New User</h2>
            <button className="close-button" onClick={handleCancel}>✕</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Username <span style={{ color: "#dc2626" }}>*</span></label>
              <input type="text" placeholder="e.g. john.doe" value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)} className="form-input" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="text" placeholder="John" value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="text" placeholder="Doe" value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email <span style={{ color: "#dc2626" }}>*</span></label>
              <input type="email" placeholder="john@company.com" value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" placeholder="+84 xxx xxx xxx" value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Password <span style={{ color: "#dc2626" }}>*</span></label>
              <input type="password" placeholder="Minimum 8 characters" value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)} className="form-input" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role <span style={{ color: "#dc2626" }}>*</span></label>
                <select value={formData.role} onChange={(e) => handleChange("role", e.target.value)} className="form-select">
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="LINE_LEADER">Line Leader</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Employee Code</label>
                <input type="text" placeholder="Auto-generated if empty" value={formData.employeeCode}
                  onChange={(e) => handleChange("employeeCode", e.target.value)} className="form-input" />
                <span className="form-hint">Leave blank for auto-generation</span>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={handleCancel} disabled={actionLoading}>Cancel</button>
            <button className="btn-save" onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      </div>
    );  }
  /* ── Main Page ── */
  return (
    <div className="admin-container users-admin-page">
      <AdminSidebar />

      <div className="admin-main">
        {/* ===== Gradient Header (synced with Dashboard) ===== */}
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="dash-header-avatar">{getUserInitial()}</div>
            <div>
              <h1 className="dash-title">User Management</h1>
              <p className="dash-subtitle">
                Manage accounts, roles and permissions
                <span className="dash-last-updated"> · {totalElements} users total</span>
              </p>
            </div>
          </div>
          <div className="dash-header-right">
            <button className="dash-refresh-btn" onClick={fetchUsers} title="Refresh data">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
            <NotificationBell />
          </div>
        </header>

        {/* Content Card */}
        <div className="admin-content">
          {feedback.message && (
            <div className={`users-feedback-banner ${feedback.type === "error" ? "error" : "success"}`}>
              <span>{feedback.message}</span>
              <button onClick={() => setFeedback({ type: "", message: "" })}>Dismiss</button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button className="error-banner-btn" onClick={fetchUsers}>Retry</button>
            </div>
          )}

          {/* Stats Bar */}
          <div className="users-stats-bar">
            <div className="stat-chip">
              <div className="stat-chip-icon total">👥</div>
              <div className="stat-chip-info">
                <span className="stat-chip-value">{stats.total}</span>
                <span className="stat-chip-label">Total Users</span>
              </div>
            </div>
            <div className="stat-chip">
              <div className="stat-chip-icon active">✅</div>
              <div className="stat-chip-info">
                <span className="stat-chip-value">{stats.active}</span>
                <span className="stat-chip-label">Active</span>
              </div>
            </div>
            <div className="stat-chip">
              <div className="stat-chip-icon locked">🔒</div>
              <div className="stat-chip-info">
                <span className="stat-chip-value">{stats.locked}</span>
                <span className="stat-chip-label">Locked</span>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="content-header">
            <h2 className="content-title">
              All Users
              {debouncedSearch && <span style={{ fontWeight: 400, fontSize: 14, color: "#9ca3af" }}> — results for "{debouncedSearch}"</span>}
            </h2>
            <button className="btn-primary" onClick={() => setShowCreateUser(true)}>
              <span>＋</span> Add User
            </button>
          </div>          {/* Filters */}
          <div className="filters-toolbar">
            <div className="search-group">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input 
                type="text" 
                placeholder="Search by username or employee code..." 
                value={searchTerm} 
                onChange={handleSearchChange} 
                className="search-input" 
              />
              {searchTerm && (
                <button 
                  className="clear-btn" 
                  onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(0); }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-group">
              <label className="filter-label">Role</label>
              <select value={roleFilter} onChange={handleRoleFilterChange} className="filter-select">
                <option value="All roles">All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="LINE_LEADER">Line Leader</option>
              </select>
            </div>
          </div>

          {/* Table */}          <div className="table-wrapper" style={{ position: "relative" }}>
            {loading && !initialLoad && (
              <PageLoading variant="overlay" />
            )}

            {users.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">No users found</div>
                <div className="empty-state-hint">Try adjusting your search or filters</div>
              </div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th className="table-header">User</th>
                    <th className="table-header">Role</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Last Login</th>
                    <th className="table-header" style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="table-row">
                      <td className="table-cell">
                        <div className="user-info-cell">
                          <div className="user-info-avatar">{getInitials(user.username)}</div>
                          <div className="user-info-details">
                            <span className="user-info-name">{user.username}</span>
                            <span className="user-info-code">{user.employeeCode || "No code"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                          {user.role?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={user.status === "active" ? "status-active" : "status-blocked"}>
                          {user.status === "active" ? "Active" : "Locked"}
                        </span>
                      </td>
                      <td className="table-cell" style={{ color: "#6b7280", fontSize: 12 }}>
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="table-cell">
                        <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                          <button className="action-button" onClick={() => handleEditClick(user)}
                            title="Edit user" disabled={actionLoading}>
                            ✏️
                          </button>
                          <button className={`action-button ${user.status === "active" ? "delete" : ""}`}
                            onClick={() => handleToggleLock(user)}
                            title={user.status === "active" ? "Lock account" : "Unlock account"}
                            disabled={actionLoading}>
                            {user.status === "active" ? "🔒" : "🔓"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing <strong>{currentPage * pageSize + 1}</strong> to{" "}
                <strong>{Math.min((currentPage + 1) * pageSize, totalElements)}</strong> of{" "}
                <strong>{totalElements}</strong> users
              </div>
              <div className="pagination-controls">
                <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}>
                  ‹ Prev
                </button>
                {getPageNumbers().map((page) => (
                  <button key={page} className={`pagination-btn ${page === currentPage ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}>
                    {page + 1}
                  </button>
                ))}
                <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}>
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
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
                <input type="text" value={formData.username} disabled className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Employee Code</label>
                <input type="text" value={selectedUser?.employeeCode || "—"} disabled className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select value={formData.role} onChange={(e) => handleChange("role", e.target.value)}
                  className="form-select" disabled={selectedUser?.role === "ADMIN"}>
                  <option value="MANAGER">Manager</option>
                  <option value="LINE_LEADER">Line Leader</option>
                </select>
                {selectedUser?.role === "ADMIN" && (
                  <span className="form-hint">Admin role cannot be changed</span>
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
                {actionLoading ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdmin;
