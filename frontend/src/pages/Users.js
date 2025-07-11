import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaUserShield, FaEdit, FaTrash, FaSpinner, FaBox, FaShoppingCart, FaUsers, FaHistory, FaChartLine, FaClipboardList, FaChartBar, FaUserPlus, FaUserEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <FaChartLine />, path: '/dashboard' },
    { text: 'Products', icon: <FaBox />, path: '/products' },
    { text: 'Orders', icon: <FaClipboardList />, path: '/orders' },
    { text: 'Reports', icon: <FaChartBar />, path: '/reports' },
    { text: 'Users', icon: <FaUsers />, path: '/users' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:5000/api/users/${userId}`);
        await fetchUsers();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/users/${editingUser._id}`, formData);
      }
      setShowModal(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="loading">
        <FaSpinner className="spinner" />
        <span>Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchUsers} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">ERP System</h1>
        </div>
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.text}
              className={`menu-item ${item.path === '/users' ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-text">{item.text}</span>
            </button>
          ))}
          <button
            className="menu-item logout-item"
            onClick={handleLogout}
          >
            <span className="menu-icon">{<FaHistory />}</span>
            <span className="menu-text">Logout</span>
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <button className="menu-toggle" onClick={handleDrawerToggle}>
            {<FaUsers />}
          </button>
          <h1>Users</h1>
        </header>

        <div className="dashboard-content">
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          <FaUser />
                        </div>
                        <span className="user-name">{user.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-email">
                        <FaEnvelope className="info-icon" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className={`user-role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                        {user.role}
                      </div>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="user-actions">
                          <button
                            className="action-button edit"
                            onClick={() => handleEdit(user)}
                            title="Edit User"
                            disabled={loading}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-button delete"
                            onClick={() => handleDelete(user._id)}
                            title="Delete User"
                            disabled={loading}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>

          {showModal && (
            <div className="modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Edit User</h2>
                  <button 
                    className="close-button" 
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    ×
                  </button>
                </div>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="cancel-button" 
                      onClick={() => setShowModal(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="save-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="spinner" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </main>
    </div>
  );
};

export default Users; 