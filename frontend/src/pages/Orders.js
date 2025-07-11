import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FaBox, FaUsers, FaHistory, FaChartLine, FaClipboardList, FaChartBar, FaAddressCard, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import './Orders.css';

const Orders = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.newOrder) {
      setSuccessMessage(location.state.message);
      setOrders(prevOrders => [location.state.newOrder, ...prevOrders]);
      navigate(location.pathname, { replace: true });
    }
    fetchOrders();
  }, [location.state]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/orders' + (isAdmin ? '/all' : ''), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }
      setOrders(data);
    } catch (error) {
      setError(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      setShowStatusModal(false);
      setSuccessMessage('Order status updated successfully');
    } catch (error) {
      setError(error.message || 'Failed to update order status');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheck className="status-icon completed" />;
      case 'cancelled':
        return <FaTimes className="status-icon cancelled" />;
      case 'pending':
        return <FaSpinner className="status-icon pending" />;
      default:
        return null;
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '$0.00';
    return `$${Number(price).toFixed(2)}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="orders-container">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">ERP System</h1>
        </div>
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.text}
              className={`menu-item ${item.path === '/orders' ? 'active' : ''}`}
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
            {<FaClipboardList />}
          </button>
          <h1>Orders</h1>
        </header>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {isAdmin && (
          <div className="orders-summary">
            <div className="summary-card">
              <h3>Total Orders</h3>
              <p>{orders.length}</p>
            </div>
            <div className="summary-card">
              <h3>Pending Orders</h3>
              <p>{orders.filter(order => order.status === 'pending').length}</p>
            </div>
            <div className="summary-card">
              <h3>Completed Orders</h3>
              <p>{orders.filter(order => order.status === 'completed').length}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : (
          <div className="orders-content">
            {orders.length === 0 ? (
              <p className="no-orders">No orders found</p>
            ) : (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order Number</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Total Price</th>
                      <th>Status</th>
                      <th>Order Date</th>
                      {isAdmin && <th>Customer</th>}
                      {isAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.orderNumber || 'N/A'}</td>
                        <td>{order.productName || 'N/A'}</td>
                        <td>{order.quantity || 0}</td>
                        <td>{formatPrice(order.totalPrice)}</td>
                        <td>
                          <div className="status-cell">
                            {getStatusIcon(order.status)}
                            <span className={`status-badge ${order.status || 'pending'}`}>
                              {order.status || 'pending'}
                            </span>
                          </div>
                        </td>
                        <td>{formatDate(order.orderDate)}</td>
                        {isAdmin && <td>{order.userId?.name || order.userId?.email || 'N/A'}</td>}
                        {isAdmin && (
                          <td>
                            <div className="action-buttons">
                              <select
                                value={order.status || 'pending'}
                                onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                className="status-select"
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders; 