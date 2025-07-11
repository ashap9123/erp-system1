const express = require('express');
const router = express.Router();
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const auth = require('../middleware/auth');

// Get all orders for the current user
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get all orders (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const orders = await Order.find()
      .sort({ orderDate: -1 })
      .populate('userId', 'name email'); // Populate user details
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Create a new order
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received order request:', req.body); // Debug log
    console.log('User ID:', req.user.userId); // Debug log
    console.log('User role:', req.user.role); // Debug log

    const { productId, quantity, unitPrice, totalPrice, productName } = req.body;

    // Validate required fields
    if (!productId || !quantity || !unitPrice || !totalPrice || !productName) {
      console.log('Missing required fields:', { productId, quantity, unitPrice, totalPrice, productName });
      return res.status(400).json({ 
        message: 'All fields are required',
        received: { productId, quantity, unitPrice, totalPrice, productName },
        missing: Object.entries({ productId, quantity, unitPrice, totalPrice, productName })
          .filter(([_, value]) => !value)
          .map(([key]) => key)
      });
    }

    // Validate numeric fields
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: 'Invalid quantity',
        details: 'Quantity must be a positive number'
      });
    }

    if (isNaN(unitPrice) || unitPrice < 0) {
      return res.status(400).json({
        message: 'Invalid unit price',
        details: 'Unit price must be a non-negative number'
      });
    }

    if (isNaN(totalPrice) || totalPrice < 0) {
      return res.status(400).json({
        message: 'Invalid total price',
        details: 'Total price must be a non-negative number'
      });
    }

    // Validate product exists and has enough quantity
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ 
        message: 'Product not found',
        details: `No product found with ID: ${productId}`
      });
    }

    console.log('Found product:', {
      id: product._id,
      name: product.name,
      quantity: product.quantity,
      requestedQuantity: quantity
    });

    if (product.quantity < quantity) {
      console.log('Insufficient stock:', { available: product.quantity, requested: quantity });
      return res.status(400).json({ 
        message: 'Not enough stock available',
        details: `Requested ${quantity} units but only ${product.quantity} available`,
        available: product.quantity,
        requested: quantity
      });
    }

    // Generate order number
    const date = new Date();
    const datePrefix = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    
    // Find the last order number for today
    const lastOrder = await Order.findOne(
      { orderNumber: new RegExp(`^ORD-${datePrefix}-`) },
      {},
      { sort: { orderNumber: -1 } }
    );

    let orderNumber;
    if (lastOrder && lastOrder.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
      orderNumber = `ORD-${datePrefix}-${(lastNumber + 1).toString().padStart(4, '0')}`;
    } else {
      orderNumber = `ORD-${datePrefix}-0001`;
    }

    console.log('Generated order number:', orderNumber);

    // Create new order
    const order = new Order({
      orderNumber,
      userId: req.user.userId,
      productId,
      productName,
      quantity,
      unitPrice,
      totalPrice,
      status: 'pending',
      orderDate: date
    });

    console.log('Creating order:', order); // Debug log

    // Save order
    const savedOrder = await order.save();
    console.log('Order saved:', savedOrder); // Debug log

    // DO NOT reduce inventory here - it will be reduced when order is completed by admin
    // product.quantity -= quantity;
    // await product.save();
    // console.log('Product updated:', product); // Debug log

    res.status(201).json({
      message: 'Order created successfully',
      order: savedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error stack:', error.stack); // Debug log
    
    // Handle specific mongoose errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid data format',
        details: error.message
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate order number',
        details: 'An error occurred while generating the order number. Please try again.'
      });
    }

    res.status(500).json({ 
      message: 'Error creating order',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get a single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    // Reduce inventory only when order is completed
    if (status === 'completed' && previousStatus !== 'completed') {
      const product = await Product.findById(order.productId);
      if (product) {
        product.quantity -= order.quantity;
        await product.save();
        console.log(`Inventory reduced for product ${product.name}: ${order.quantity} units`);
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({ message: 'Error updating order' });
  }
});

module.exports = router; 