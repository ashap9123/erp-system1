import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaBox, FaShoppingCart, FaUsers, FaHistory, FaChartBar, FaChartPie, FaFileExport } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './Reports.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // State for different reports
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [salesVsPurchase, setSalesVsPurchase] = useState({ sales: [], purchases: [] });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      // Fetch sales data
      const salesResponse = await axios.get('http://localhost:5000/api/reports/sales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalesData(salesResponse.data || []);

      // Fetch inventory data
      const inventoryResponse = await axios.get('http://localhost:5000/api/reports/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventoryData(inventoryResponse.data || []);

      // Fetch low stock items
      const lowStockResponse = await axios.get('http://localhost:5000/api/reports/low-stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLowStockItems(lowStockResponse.data || []);

      // Fetch sales vs purchase data
      const comparisonResponse = await axios.get('http://localhost:5000/api/reports/sales-vs-purchase', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalesVsPurchase(comparisonResponse.data || { sales: [], purchases: [] });

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Convert data to CSV format
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (type) => {
    switch (type) {
      case 'sales':
        exportToCSV(salesData, 'sales_report');
        break;
      case 'inventory':
        exportToCSV(inventoryData, 'inventory_report');
        break;
      case 'lowStock':
        exportToCSV(lowStockItems, 'low_stock_report');
        break;
      case 'comparison':
        const comparisonData = [
          ...salesVsPurchase.sales.map(sale => ({ ...sale, type: 'Sales' })),
          ...salesVsPurchase.purchases.map(purchase => ({ ...purchase, type: 'Purchase' }))
        ];
        exportToCSV(comparisonData, 'sales_vs_purchase_report');
        break;
      default:
        break;
    }
  };

  // Prepare sales chart data
  const salesChartData = {
    labels: (salesData || []).map(item => `${item._id?.month || ''}/${item._id?.day || ''}/${item._id?.year || ''}`),
    datasets: [
      {
        label: 'Daily Sales ($)',
        data: (salesData || []).map(item => item.totalSales || 0),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  // Prepare inventory chart data
  const inventoryChartData = {
    labels: (inventoryData || []).map(item => item._id || ''),
    datasets: [
      {
        label: 'Number of Items',
        data: (inventoryData || []).map(item => item.totalItems || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: 'Total Quantity',
        data: (inventoryData || []).map(item => item.totalQuantity || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  // Prepare sales vs purchase chart data
  const comparisonChartData = {
    labels: (salesVsPurchase?.sales || []).map(item => `${item._id?.month || ''}/${item._id?.year || ''}`),
    datasets: [
      {
        label: 'Sales ($)',
        data: (salesVsPurchase?.sales || []).map(item => item.totalSales || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Purchases ($)',
        data: (salesVsPurchase?.purchases || []).map(item => item.totalPurchases || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
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
    { text: 'Orders', icon: <FaShoppingCart />, path: '/orders' },
    ...(isAdmin ? [{ text: 'Reports', icon: <FaChartBar />, path: '/reports' }] : []),
    ...(isAdmin ? [{ text: 'Users', icon: <FaUsers />, path: '/users' }] : [])
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Redirect non-admin users away from this page
  if (!isAdmin) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="reports-container">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">ERP System</h1>
        </div>
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.text}
              className={`menu-item ${item.path === '/reports' ? 'active' : ''}`}
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
            {<FaChartBar />}
          </button>
          <h1>Reports & Analytics</h1>
        </header>

        <div className="reports-content">
          <div className="reports-grid">
            {/* Sales Trends Section */}
            <div className="report-card">
              <div className="report-header">
                <h2>Sales Trends</h2>
                <button 
                  className="export-button"
                  onClick={() => handleExport('sales')}
                  title="Export sales data to CSV"
                >
                  <FaFileExport /> Export
                </button>
              </div>
              <div className="report-body">
                {salesData.length > 0 ? (
                  <>
                    <div className="chart-description">
                      <p>This chart shows the daily sales trends. The line represents the total sales amount for each day.</p>
                    </div>
                    <Line 
                      data={salesChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Daily Sales',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Sales Amount ($)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Date'
                            }
                          }
                        }
                      }}
                    />
                  </>
                ) : (
                  <div className="no-data">No sales data available</div>
                )}
              </div>
            </div>

            {/* Inventory Levels Section */}
            <div className="report-card">
              <div className="report-header">
                <h2>Inventory Levels</h2>
                <button 
                  className="export-button"
                  onClick={() => handleExport('inventory')}
                  title="Export inventory data to CSV"
                >
                  <FaFileExport /> Export
                </button>
              </div>
              <div className="report-body">
                {inventoryData.length > 0 ? (
                  <>
                    <div className="chart-description">
                      <p>This chart shows the inventory levels by category. The blue bars represent the number of different items, while the red bars show the total quantity in stock.</p>
                    </div>
                    <Bar
                      data={inventoryChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Inventory by Category',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Count'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Category'
                            }
                          }
                        }
                      }}
                    />
                  </>
                ) : (
                  <div className="no-data">No inventory data available</div>
                )}
              </div>
            </div>

            {/* Low Stock Alerts Section */}
            <div className="report-card">
              <div className="report-header">
                <h2>Low Stock Alerts</h2>
                <button 
                  className="export-button"
                  onClick={() => handleExport('lowStock')}
                  title="Export low stock data to CSV"
                >
                  <FaFileExport /> Export
                </button>
              </div>
              <div className="report-body">
                {lowStockItems.length > 0 ? (
                  <>
                    <div className="chart-description">
                      <p>This section shows products that are running low on stock. These items need attention to prevent stockouts.</p>
                    </div>
                    <div className="low-stock-list">
                      {lowStockItems.map((item) => (
                        <div key={item._id} className="low-stock-item">
                          <span className="item-name">{item.name}</span>
                          <span className="item-stock">{item.quantity} units</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="no-data">No low stock items</div>
                )}
              </div>
            </div>

            {/* Sales vs Purchase Section */}
            <div className="report-card">
              <div className="report-header">
                <h2>Sales vs Purchase</h2>
                <button 
                  className="export-button"
                  onClick={() => handleExport('comparison')}
                  title="Export sales vs purchase data to CSV"
                >
                  <FaFileExport /> Export
                </button>
              </div>
              <div className="report-body">
                {salesVsPurchase.sales.length > 0 || salesVsPurchase.purchases.length > 0 ? (
                  <>
                    <div className="chart-description">
                      <p>This chart compares monthly sales and purchases. The blue bars represent sales, while the red bars show purchases. This helps track the relationship between sales and inventory replenishment.</p>
                    </div>
                    <Bar
                      data={comparisonChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Monthly Comparison',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Amount ($)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Month'
                            }
                          }
                        }
                      }}
                    />
                  </>
                ) : (
                  <div className="no-data">No comparison data available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports; 