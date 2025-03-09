const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { ensureAuthenticated } = require('../middlewares/auth');

/**
 * @route   GET /products
 * @desc    Product listing page
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // For demo purposes, we'll just return an empty array
    const products = [];
    
    res.render('pages/products/index', {
      title: 'Shop - FashionNest',
      products,
      categories: ['men', 'women', 'kids', 'accessories'],
      subcategories: [],
      brands: [],
      currentPage: 1,
      totalPages: 1,
      totalProducts: 0,
      filters: req.query
    });
  } catch (error) {
    console.error('Product listing error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      message: 'Something went wrong. Please try again later.'
    });
  }
});

/**
 * @route   GET /products/:slug
 * @desc    Product detail page
 * @access  Public
 */
router.get('/:slug', async (req, res) => {
  try {
    // Get product by slug
    const product = await Product.findOne({ slug: req.params.slug });
    
    if (!product) {
      return res.status(404).render('pages/error', {
        title: 'Product Not Found',
        message: 'The product you are looking for does not exist.'
      });
    }
    
    // Get related products (same category)
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id } // Exclude current product
    }).limit(4);
    
    res.render('pages/products/detail', {
      title: `${product.name} - FashionNest`,
      product,
      relatedProducts
    });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      message: 'Something went wrong. Please try again later.'
    });
  }
});

/**
 * @route   POST /products/:id/review
 * @desc    Add product review
 * @access  Private
 */
router.post('/:id/review', ensureAuthenticated, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      req.flash('error_msg', 'Please provide a valid rating (1-5)');
      return res.redirect(`/products/${req.params.id}`);
    }
    
    // Validate comment
    if (!comment || comment.trim().length === 0) {
      req.flash('error_msg', 'Please provide a review comment');
      return res.redirect(`/products/${req.params.id}`);
    }
    
    // Get product
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/products');
    }
    
    // Check if user already reviewed this product
    const alreadyReviewed = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );
    
    if (alreadyReviewed) {
      req.flash('error_msg', 'You have already reviewed this product');
      return res.redirect(`/products/${product.slug}`);
    }
    
    // Add review
    const review = {
      user: req.user._id,
      rating: Number(rating),
      comment
    };
    
    product.reviews.push(review);
    
    // Update product ratings
    product.ratings.count = product.reviews.length;
    product.ratings.average = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    
    await product.save();
    
    req.flash('success_msg', 'Review added successfully');
    res.redirect(`/products/${product.slug}`);
  } catch (error) {
    console.error('Add review error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect(`/products/${req.params.id}`);
  }
});

/**
 * @route   GET /products/search
 * @desc    Search products
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.redirect('/products');
    }
    
    // For demo purposes, we'll just return an empty array
    const products = [];
    
    res.render('pages/products/search', {
      title: `Search Results for "${q}" - FashionNest`,
      products,
      query: q
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      message: 'Something went wrong. Please try again later.'
    });
  }
});

/**
 * @route   GET /products/search/suggestions
 * @desc    Get search suggestions (AJAX)
 * @access  Public
 */
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json([]);
    }
    
    // For demo purposes, we'll just return an empty array
    res.json([]);
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router; 