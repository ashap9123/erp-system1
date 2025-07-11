const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/order.model');
const Product = require('../models/product.model');

// Get sales data
router.get('/sales', auth, async (req, res) => {
  try {
    const sales = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' },
            day: { $dayOfMonth: '$orderDate' }
          },
          totalSales: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ message: 'Error fetching sales data' });
  }
});

// Get inventory data
router.get('/inventory', auth, async (req, res) => {
  try {
    const inventory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    res.status(500).json({ message: 'Error fetching inventory data' });
  }
});

// Get low stock items
router.get('/low-stock', auth, async (req, res) => {
  try {
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    }).select('name quantity minStockLevel');

    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: 'Error fetching low stock items' });
  }
});

// Get sales vs purchase comparison
router.get('/sales-vs-purchase', auth, async (req, res) => {
  try {
    const sales = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' }
          },
          totalSales: { $sum: '$totalPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // For now, we'll just return sales data
    // In a real system, you would also fetch purchase data and compare
    res.json({
      sales,
      purchases: [] // This would be populated with actual purchase data
    });
  } catch (error) {
    console.error('Error fetching sales vs purchase data:', error);
    res.status(500).json({ message: 'Error fetching sales vs purchase data' });
  }
});

module.exports = router; 