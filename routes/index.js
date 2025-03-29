const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * @route   GET /
 * @desc    Home page
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Get featured products
    const featuredProducts = await Product.find({ featured: true }).limit(8);
    
    // Get trending products
    const trendingProducts = await Product.find({ trending: true }).limit(8);
    
    // Get new arrivals (sort by createdAt)
    const newArrivals = await Product.find({ featured: false })
      .sort({ createdAt: -1 })
      .limit(8);
    
    // Get best sellers (products with highest ratings)
    const bestSellers = await Product.find()
      .sort({ 'ratings.average': -1 })
      .limit(8);
    
    res.render('pages/home', {
      title: 'FashionNest - Home',
      featuredProducts,
      trendingProducts,
      newArrivals,
      bestSellers
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      message: 'Something went wrong. Please try again later.'
    });
  }
});

/**
 * @route   GET /about
 * @desc    About page
 * @access  Public
 */
router.get('/about', (req, res) => {
  res.render('pages/about', {
    title: 'About Us - FashionNest'
  });
});

/**
 * @route   GET /contact
 * @desc    Contact page
 * @access  Public
 */
router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: 'Contact Us - FashionNest'
  });
});

/**
 * @route   POST /contact
 * @desc    Submit contact form
 * @access  Public
 */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // TODO: Send email with contact form data
    
    req.flash('success_msg', 'Your message has been sent. We will get back to you soon!');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/contact');
  }
});

/**
 * @route   POST /newsletter
 * @desc    Newsletter subscription
 * @access  Public
 */
router.post('/newsletter', (req, res) => {
  const { email } = req.body;
  
  // In a real app, you would save this to a database
  console.log(`Newsletter subscription: ${email}`);
  
  res.json({
    success: true,
    message: 'Thank you for subscribing to our newsletter!'
  });
});

module.exports = router; 