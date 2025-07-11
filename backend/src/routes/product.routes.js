const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const auth = require('../middleware/auth');

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get single product
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Create product
router.post('/', auth, async (req, res) => {
  try {
    // Log the incoming request body
    console.log('Creating product with data:', req.body);

    // Validate required fields
    const requiredFields = ['name', 'type', 'quantity', 'price', 'supplier', 'category', 'brand', 'batchNumber', 'expiryDate', 'minStockLevel'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields: missingFields 
      });
    }

    // Create new product
    const product = new Product(req.body);
    
    // Validate the product before saving
    const validationError = product.validateSync();
    if (validationError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: validationError.message 
      });
    }

    // Save the product
    const savedProduct = await product.save();
    console.log('Product created successfully:', savedProduct);
    
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ 
      message: 'Error creating product', 
      error: error.message,
      details: error.errors // Include mongoose validation errors if any
    });
  }
});

// Update product
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: 'Error updating product', error: error.message });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router; 