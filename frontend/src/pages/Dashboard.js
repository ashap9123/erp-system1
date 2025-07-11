import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaShoppingCart, FaUsers, FaHistory, FaChartLine, FaClipboardList, FaChartBar } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      // Fetch products count
      const productsResponse = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch orders - use /all endpoint for admin to get total count, regular endpoint for regular users
      const ordersEndpoint = isAdmin ? 'http://localhost:5000/api/orders/all' : 'http://localhost:5000/api/orders';
      const ordersResponse = await axios.get(ordersEndpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch users count (only if admin)
      let usersCount = 0;
      if (isAdmin) {
        const usersResponse = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        usersCount = usersResponse.data.length;
      }

      setStats({
        totalProducts: productsResponse.data.length,
        totalOrders: ordersResponse.data.length,
        totalUsers: usersCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.response?.data?.message || 'Failed to fetch dashboard statistics');
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
    ...(isAdmin ? [{ text: 'Reports', icon: <FaChartBar />, path: '/reports' }] : []),
    ...(isAdmin ? [{ text: 'Users', icon: <FaUsers />, path: '/users' }] : [])
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
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
              className={`menu-item ${item.path === '/dashboard' ? 'active' : ''}`}
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
            {<FaBox />}
          </button>
          <h1>Dashboard</h1>
        </header>

        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaBox />
              </div>
              <div className="stat-info">
                <h3>Total Products</h3>
                <p>{stats.totalProducts}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaClipboardList />
              </div>
              <div className="stat-info">
                <h3>Total Orders</h3>
                <p>{stats.totalOrders}</p>
              </div>
            </div>

            {isAdmin && (
              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p>{stats.totalUsers}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 