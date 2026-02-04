import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import dashboardIcon from "../../assets/dashboard.jpg";
import userIcon from "../../assets/user.jpg";
import auditIcon from "../../assets/auditlog.jpg";
import "./adminUser.css";

const UsersAdmin = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [users, setUsers] = useState([
    {
      id: 1,
      username: "an.ng",
      email: "an.ng@x.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: 2,
      username: "binh.tt",
      email: "binh.tt@y.com",
      role: "Sales",
      status: "Active",
    },
    {
      id: 3,
      username: "planner1",
      email: "planner1@z.com",
      role: "Planner",
      status: "Blocked",
    },
  ]);
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
    role: "Admin",
    status: true,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const newUser = {
      id: users.length + 1,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      status: formData.status ? "Active" : "Blocked",
    };
    setUsers([...users, newUser]);
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "Admin",
      status: true,
    });
    setShowCreateUser(false);
    alert("User created successfully!");
  };
  const handleCancel = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "Admin",
      status: true,
    });
    setShowCreateUser(false);
    setShowEditUser(false);
    setSelectedUser(null);
  };

  // Edit user handlers
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status === "Active",
    });
    setShowEditUser(true);
  };

  const handleEditSave = () => {
    if (!selectedUser) return;
    
    setUsers(users.map(user => 
      user.id === selectedUser.id 
        ? {
            ...user,
            username: formData.username,
            email: formData.email,
            role: formData.role,
            status: formData.status ? "Active" : "Blocked",
          }
        : user
    ));
    
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "Admin",
      status: true,
    });
    setShowEditUser(false);
    setSelectedUser(null);
    alert("User updated successfully!");
  };

  // Delete user handlers
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedUser) return;
    
    setUsers(users.filter(user => user.id !== selectedUser.id));
    setShowDeleteConfirm(false);
    setSelectedUser(null);
    alert("User deleted successfully!");
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSelectedUser(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

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
              <label className="form-label">Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className="form-input"
              />
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
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="form-input"
              />
            </div>            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="form-select"
              >
                <option>Admin</option>
                <option>Planner</option>
                <option>LineLeader</option>
                
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <div className="toggle-container">
                <button
                  className={`toggle-button ${formData.status ? "active" : ""}`}
                  onClick={() => handleChange("status", true)}
                >
                  ON
                </button>
                <button
                  className={`toggle-button ${
                    !formData.status ? "active" : ""
                  }`}
                  onClick={() => handleChange("status", false)}
                >
                  OFF
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn-save" onClick={handleSave}>
              Save
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
          </div>          <div className="nav-item" onClick={() => navigate("/admin/approval")}>
            <span className="nav-icon">✅</span>
            <span>Task Approval</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin/orders")}>
            <span className="nav-icon">📦</span>
            <span>Order Management</span>
          </div>          <div className="nav-item active">
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
            <button className="header-icon-btn">🔔</button>
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
            </div>            <div className="role-filter">
              <label className="role-label">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="role-select"
              >
                <option>All roles</option>
                <option>Admin</option>
                <option>Sales</option>
                <option>Planner</option>
                <option>LineLeader</option>
                <option>Director</option>
              </select>
            </div>
          </div>          <table className="users-table">
            <thead>
              <tr>
                <th className="table-header">Username</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) => {
                  const matchesSearch = 
                    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesRole = roleFilter === "All roles" || user.role === roleFilter;
                  return matchesSearch && matchesRole;
                })
                .map((user) => (
                <tr key={user.id} className="table-row">
                  <td className="table-cell">{user.username}</td>
                  <td className="table-cell">{user.email}</td>
                  <td className="table-cell">{user.role}</td>
                  <td className="table-cell">
                    <span
                      className={
                        user.status === "Active"
                          ? "status-active"
                          : "status-blocked"
                      }
                    >
                      {user.status}
                    </span>
                  </td>                  <td className="table-cell">
                    <button className="action-button" onClick={() => handleEditClick(user)} title="Edit user">✏️</button>
                    <button className="action-button delete" onClick={() => handleDeleteClick(user)} title="Delete user">🗑️</button>
                  </td>
                </tr>
              ))}
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
                  onChange={(e) => handleChange("username", e.target.value)}
                  className="form-input"
                />
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
                <label className="form-label">New Password (leave blank to keep current)</label>
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
                  <option>Admin</option>
                  <option>Sales</option>
                  <option>Planner</option>
                  <option>LineLeader</option>
                  <option>Director</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="toggle-container">
                  <button
                    className={`toggle-button ${formData.status ? "active" : ""}`}
                    onClick={() => handleChange("status", true)}
                  >
                    ON
                  </button>
                  <button
                    className={`toggle-button ${!formData.status ? "active" : ""}`}
                    onClick={() => handleChange("status", false)}
                  >
                    OFF
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleEditSave}>
                Update
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
                Are you sure you want to delete user <strong>{selectedUser.username}</strong>?
              </p>
              <p className="delete-warning">
                This action cannot be undone.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className="btn-delete" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdmin;
