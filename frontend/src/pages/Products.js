import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaShoppingCart, FaUsers, FaHistory, FaPlus, FaEdit, FaTrash, FaChartLine, FaClipboardList, FaChartBar } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [showOrderModal, setShowOrderModal] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    type: 'raw',
    quantity: 0,
    price: 0,
    supplier: '',
    category: '',
    brand: '',
    batchNumber: '',
    expiryDate: '',
    minStockLevel: 0
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = (product) => {
    setSelectedProductForOrder(product);
    setOrderQuantity(1);
    setShowOrderModal(true);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user) {
        setError('Please log in to place an order');
        return;
      }

      if (!selectedProductForOrder || !selectedProductForOrder._id) {
        setError('Invalid product information');
        return;
      }

      if (orderQuantity <= 0) {
        setError('Please enter a valid quantity');
        return;
      }

      if (orderQuantity > selectedProductForOrder.quantity) {
        setError(`Order quantity exceeds available stock. Only ${selectedProductForOrder.quantity} units available.`);
        return;
      }

      const totalPrice = parseFloat((orderQuantity * selectedProductForOrder.price).toFixed(2));
      const unitPrice = parseFloat(selectedProductForOrder.price);

      const orderData = {
        productId: selectedProductForOrder._id,
        productName: selectedProductForOrder.name,
        quantity: parseInt(orderQuantity),
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        status: 'pending',
        orderDate: new Date().toISOString()
      };

      console.log('Submitting order:', orderData);

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          throw new Error(Array.isArray(data.details) ? data.details.join(', ') : data.details);
        }
        throw new Error(data.message || 'Failed to place order');
      }

      // Show success message
      setSuccessMessage('Order placed successfully!');
      
      // Clear the order quantity
      setOrderQuantity(1);

      // Close the order modal
      setShowOrderModal(false);

      // Redirect to orders page after a short delay
      setTimeout(() => {
        navigate('/orders', { 
          state: { 
            newOrder: data.order,
            message: 'Order placed successfully!'
          }
        });
      }, 1500);

    } catch (error) {
      console.error('Error placing order:', error);
      setError(error.message || 'Failed to place order');
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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/products', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setFormData({
        name: '',
        sku: '',
        type: 'raw',
        quantity: 0,
        price: 0,
        supplier: '',
        category: '',
        brand: '',
        batchNumber: '',
        expiryDate: '',
        minStockLevel: 0
      });
      await fetchProducts();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add product');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/products/${selectedProduct._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      await fetchProducts();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchProducts();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      type: product.type,
      quantity: product.quantity,
      price: product.price,
      supplier: product.supplier,
      category: product.category,
      brand: product.brand,
      batchNumber: product.batchNumber,
      expiryDate: new Date(product.expiryDate).toISOString().split('T')[0],
      minStockLevel: product.minStockLevel
    });
    setShowEditModal(true);
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="products-container">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">ERP System</h1>
        </div>
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.text}
              className={`menu-item ${item.path === '/products' ? 'active' : ''}`}
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
          <h1>Products</h1>
          {isAdmin && (
            <button className="add-product-button" onClick={() => setShowAddModal(true)}>
              <FaPlus /> Add Product
            </button>
          )}
        </header>

        <div className="products-content">
          {isAdmin && (
            <div className="products-summary">
              <div className="summary-card">
                <h3>Total Products</h3>
                <p>{products.length}</p>
              </div>
              <div className="summary-card">
                <h3>Low Stock Items</h3>
                <p>{products.filter(p => p.quantity <= p.minStockLevel).length}</p>
              </div>
              <div className="summary-card">
                <h3>Out of Stock</h3>
                <p>{products.filter(p => p.quantity === 0).length}</p>
              </div>
            </div>
          )}

          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  {isAdmin && (
                    <>
                      <th>Supplier</th>
                      <th>Batch Number</th>
                      <th>Expiry Date</th>
                      <th>Min Stock</th>
                    </>
                  )}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>${product.price}</td>
                    <td>
                      <span className={`stock-level ${product.quantity <= product.minStockLevel ? 'low-stock' : ''}`}>
                        {product.quantity}
                      </span>
                    </td>
                    {isAdmin && (
                      <>
                        <td>{product.supplier}</td>
                        <td>{product.batchNumber}</td>
                        <td>{new Date(product.expiryDate).toLocaleDateString()}</td>
                        <td>{product.minStockLevel}</td>
                      </>
                    )}
                    <td>
                      <div className="action-buttons">
                        {!isAdmin && (
                          <button
                            className="action-button order"
                            onClick={() => handleOrder(product)}
                            disabled={product.quantity <= 0}
                          >
                            Order
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              className="action-button edit"
                              onClick={() => handleEditClick(product)}
                              title="Edit Product"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="action-button delete"
                              onClick={() => handleDeleteProduct(product._id)}
                              title="Delete Product"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 6} className="no-products">
                      No products available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Modal */}
        {showOrderModal && selectedProductForOrder && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Place Order - {selectedProductForOrder.name}</h2>
                <button className="close-button" onClick={() => setShowOrderModal(false)}>×</button>
              </div>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleOrderSubmit}>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={selectedProductForOrder.name}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Price per unit</label>
                  <input
                    type="text"
                    value={`$${selectedProductForOrder.price}`}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="orderQuantity">Quantity</label>
                  <input
                    type="number"
                    id="orderQuantity"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value))}
                    min="1"
                    max={selectedProductForOrder.quantity}
                    required
                  />
                  <small>Available stock: {selectedProductForOrder.quantity}</small>
                </div>
                <div className="form-group">
                  <label>Total Price</label>
                  <input
                    type="text"
                    value={`$${(selectedProductForOrder.price * orderQuantity).toFixed(2)}`}
                    disabled
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-button" onClick={() => setShowOrderModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-button">
                    Place Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Add New Product</h2>
                <button className="close-button" onClick={() => setShowAddModal(false)}>×</button>
              </div>
              <form onSubmit={handleAddProduct}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="raw">Raw</option>
                    <option value="refined">Refined</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Stock Level</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-button">
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditModal && selectedProduct && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edit Product</h2>
                <button className="close-button" onClick={() => setShowEditModal(false)}>×</button>
              </div>
              <form onSubmit={handleEditProduct}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="raw">Raw</option>
                    <option value="refined">Refined</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Stock Level</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-button" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-button">
                    Update Product
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

export default Products; 