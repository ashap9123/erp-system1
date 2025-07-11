import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
      setShowError(true);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/orders/${orderId}/status`, {
        status: newStatus
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
      setShowError(true);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="admin-orders-container">
      <div className="page-header">
        <h1 className="page-title">All Orders</h1>
      </div>

      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Products</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Shipping Address</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order._id}</td>
              <td>
                <div className="customer-info">
                  <span className="customer-name">{order.user.name}</span>
                  <span className="customer-email">{order.user.email}</span>
                </div>
              </td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              <td>
                {order.products.map((item, index) => (
                  <div key={index}>
                    {item.product.name} x {item.quantity}
                  </div>
                ))}
              </td>
              <td className="total-amount">{formatPrice(order.totalAmount)}</td>
              <td>
                <select
                  className={`status-select ${order.status}`}
                  value={order.status}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                >
                  <option value="pending">PENDING</option>
                  <option value="processing">PROCESSING</option>
                  <option value="shipped">SHIPPED</option>
                  <option value="delivered">DELIVERED</option>
                  <option value="cancelled">CANCELLED</option>
                </select>
              </td>
              <td>
                <div className="shipping-address">
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                  {order.shippingAddress.zipCode}<br />
                  {order.shippingAddress.country}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showError && (
        <div className="error-snackbar" onClick={() => setShowError(false)}>
          {error}
        </div>
      )}
    </div>
  );
};

export default AdminOrders; 