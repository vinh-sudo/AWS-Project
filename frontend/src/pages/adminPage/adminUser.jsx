import React, { useState } from 'react';

const UsersAdmin = () => {
  const [users, setUsers] = useState([
    { id: 1, username: 'an.ng', email: 'an.ng@x.com', role: 'Admin', status: 'Active' },
    { id: 2, username: 'binh.tt', email: 'binh.tt@y.com', role: 'Sales', status: 'Active' },
    { id: 3, username: 'planner1', email: 'planner1@z.com', role: 'Planner', status: 'Blocked' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All roles');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Admin',
    status: true
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const newUser = {
      id: users.length + 1,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      status: formData.status ? 'Active' : 'Blocked'
    };
    setUsers([...users, newUser]);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'Admin',
      status: true
    });
    setShowCreateUser(false);
    alert('User created successfully!');
  };

  const handleCancel = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'Admin',
      status: true
    });
    setShowCreateUser(false);
  };

  if (showCreateUser) {
    return (
      <div style={styles.createUserPage}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Create User</h2>
            <button style={styles.closeButton} onClick={handleCancel}>✕</button>
          </div>

          <div style={styles.modalBody}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                style={styles.select}
              >
                <option>Admin</option>
                <option>Sales</option>
                <option>Planner</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <div style={styles.toggleContainer}>
                <button
                  style={{
                    ...styles.toggleButton,
                    ...(formData.status ? styles.toggleButtonActive : {}),
                  }}
                  onClick={() => handleChange('status', true)}
                >
                  ON
                </button>
                <button
                  style={{
                    ...styles.toggleButton,
                    ...(!formData.status ? styles.toggleButtonActive : {}),
                  }}
                  onClick={() => handleChange('status', false)}
                >
                  OFF
                </button>
              </div>
            </div>
          </div>

          <div style={styles.modalFooter}>
            <button style={styles.cancelButton} onClick={handleCancel}>
              Cancel
            </button>
            <button style={styles.saveButton} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.adminContainer}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <img src="../../assets/ims.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
          </div>
        </div>
        
        <nav style={styles.sidebarNav}>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>📊</span>
            <span>Dashboard</span>
          </div>
          <div style={{...styles.navItem, ...styles.navItemActive}}>
            <span style={styles.navIcon}>👥</span>
            <span>Users</span>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>📋</span>
            <span>Audit Log</span>
          </div>
        </nav>
      </div>

      <div style={styles.mainContent}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Users Admin</h1>
          <div style={styles.headerActions}>
            <button style={styles.iconButton}>🔔</button>
            <div style={styles.userMenu}>
              <div style={styles.avatar}></div>
              <span>Admin</span>
              <span style={styles.dropdownIcon}>▼</span>
            </div>
          </div>
        </header>

        <div style={styles.content}>
          <div style={styles.contentHeader}>
            <h2 style={styles.contentTitle}>Users Admin</h2>
            <button style={styles.btnPrimary} onClick={() => setShowCreateUser(true)}>
              + Create User
            </button>
          </div>

          <div style={styles.filters}>
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>🔍</span>
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.roleFilter}>
              <label style={styles.roleLabel}>Role</label>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={styles.roleSelect}
              >
                <option>All roles</option>
                <option>Admin</option>
                <option>Sales</option>
                <option>Planner</option>
              </select>
            </div>
          </div>

          <table style={styles.usersTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Username</th>
                <th style={styles.tableHeader}>Email</th>
                <th style={styles.tableHeader}>Role</th>
                <th style={styles.tableHeader}>Status</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>{user.username}</td>
                  <td style={styles.tableCell}>{user.email}</td>
                  <td style={styles.tableCell}>{user.role}</td>
                  <td style={styles.tableCell}>
                    <span style={user.status === 'Active' ? styles.statusActive : styles.statusBlocked}>
                      {user.status}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <button style={styles.actionButton}>✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  adminContainer: {
    display: 'flex',
    height: '100vh',
    background: '#f5f5f7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: '200px',
    background: '#e8e8ea',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
  },
  sidebarHeader: {
    padding: '0 20px 30px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '28px',
    height: '28px',
    background: '#007AFF',
    borderRadius: '6px',
  },
  logoText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1d1d1f',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    cursor: 'pointer',
    color: '#6e6e73',
    fontSize: '14px',
  },
  navItemActive: {
    background: '#007AFF',
    color: 'white',
    borderRadius: '8px',
    margin: '0 10px',
  },
  navIcon: {
    fontSize: '18px',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  header: {
    background: 'white',
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e5e7',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#1d1d1f',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '8px',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#007AFF',
  },
  dropdownIcon: {
    fontSize: '10px',
    color: '#6e6e73',
  },
  content: {
    padding: '30px',
    background: 'white',
    margin: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
  },
  contentTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1d1d1f',
    margin: 0,
  },
  btnPrimary: {
    background: '#007AFF',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '25px',
  },
  searchBox: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '16px',
    color: '#86868b',
  },
  searchInput: {
    width: '100%',
    padding: '10px 10px 10px 40px',
    border: '1px solid #d2d2d7',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  roleFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  roleLabel: {
    fontSize: '14px',
    color: '#6e6e73',
    fontWeight: '500',
  },
  roleSelect: {
    padding: '10px 35px 10px 12px',
    border: '1px solid #d2d2d7',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
    background: 'white',
  },
  usersTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6e6e73',
    borderBottom: '1px solid #e5e5e7',
    background: '#f5f5f7',
  },
  tableRow: {
    borderBottom: '1px solid #f5f5f7',
  },
  tableCell: {
    padding: '16px',
    fontSize: '14px',
    color: '#1d1d1f',
  },
  statusActive: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    background: '#d4f4dd',
    color: '#1d9f3d',
  },
  statusBlocked: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    background: '#ffe4cc',
    color: '#cc7a00',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px 8px',
    opacity: 0.6,
  },
  // Create User Page Styles
  createUserPage: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '450px',
    maxWidth: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e5e7',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#1d1d1f',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6e6e73',
    padding: '4px 8px',
  },
  modalBody: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1d1d1f',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d2d2d7',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d2d2d7',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    background: 'white',
    boxSizing: 'border-box',
  },
  toggleContainer: {
    display: 'flex',
    gap: '8px',
  },
  toggleButton: {
    padding: '8px 24px',
    border: '1px solid #d2d2d7',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    background: 'white',
    color: '#6e6e73',
    transition: 'all 0.2s',
  },
  toggleButtonActive: {
    background: '#007AFF',
    color: 'white',
    borderColor: '#007AFF',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e5e5e7',
  },
  cancelButton: {
    padding: '10px 24px',
    border: '1px solid #d2d2d7',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    background: 'white',
    color: '#1d1d1f',
  },
  saveButton: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    background: '#007AFF',
    color: 'white',
  },
};

export default UsersAdmin;