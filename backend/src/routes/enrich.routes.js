const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const openFoodFactsService = require('../services/openfoodfacts.service');

/**
 * @route   POST /api/products/enrich/:barcode
 * @desc    Enrich a product with OpenFoodFacts data
 * @access  Public
 */
router.post('/enrich/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    
    // Find existing product
    const existingProduct = await Product.findOne({ barcode });
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in database. Please create it first.'
      });
    }
    
    // Enrich with OFF/OBF data
    const enrichResult = await openFoodFactsService.fetchAndEnrich(
      barcode, 
      existingProduct.toObject()
    );
    
    if (!enrichResult.success) {
      return res.status(404).json({
        success: false,
        message: enrichResult.message
      });
    }
    
    // Update product in database
    const updatedProduct = await Product.findOneAndUpdate(
      { barcode },
      enrichResult.product,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: enrichResult.message,
      source: enrichResult.source,
      product: updatedProduct
    });
    
  } catch (error) {
    console.error('Error enriching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error enriching product',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/products/create-and-enrich
 * @desc    Create a new product and enrich it with OFF data
 * @access  Public
 */
router.post('/create-and-enrich', async (req, res) => {
  try {
    const { barcode, ...productData } = req.body;
    
    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required'
      });
    }
    
    // Check if product already exists
    const existingProduct = await Product.findOne({ barcode });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product already exists'
      });
    }
    
    // Fetch and enrich from OFF/OBF
    const enrichResult = await openFoodFactsService.fetchAndEnrich(barcode, {
      barcode,
      ...productData,
      createdAt: new Date()
    });
    
    // Create product with enriched data
    const newProduct = new Product(enrichResult.product);
    await newProduct.save();
    
    res.status(201).json({
      success: true,
      message: enrichResult.success 
        ? `Product created and enriched from ${enrichResult.source}`
        : 'Product created without enrichment',
      source: enrichResult.source || null,
      product: newProduct
    });
    
  } catch (error) {
    console.error('Error creating and enriching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/check-off/:barcode
 * @desc    Check if product exists on OpenFoodFacts
 * @access  Public
 */
router.get('/check-off/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const result = await openFoodFactsService.fetchProduct(barcode);
    
    res.json({
      success: true,
      found: result.found,
      source: result.source,
      data: result.found ? openFoodFactsService.extractProductData(result.data) : null
    });
    
  } catch (error) {
    console.error('Error checking OpenFoodFacts:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking OpenFoodFacts',
      error: error.message
    });
  }
});

module.exports = router;

