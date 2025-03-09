const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');

/**
 * @route   GET /cart
 * @desc    View cart
 * @access  Private
 */
router.get('/', ensureAuthenticated, (req, res) => {
  res.render('pages/cart/index', {
    title: 'Shopping Cart - FashionNest',
    cart: { items: [] }
  });
});

/**
 * @route   POST /cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/add', ensureAuthenticated, (req, res) => {
  // For demo purposes, just return success
  if (req.xhr) {
    return res.json({
      success: true,
      message: 'Item added to cart',
      cartCount: 1
    });
  }
  
  req.flash('success_msg', 'Item added to cart');
  res.redirect('/cart');
});

/**
 * @route   POST /cart/update
 * @desc    Update cart item quantity
 * @access  Private
 */
router.post('/update', ensureAuthenticated, (req, res) => {
  // For demo purposes, just return success
  res.json({
    success: true,
    message: 'Cart updated',
    itemTotal: 0,
    subtotal: 0,
    total: 0,
    cartCount: 1
  });
});

/**
 * @route   POST /cart/remove
 * @desc    Remove item from cart
 * @access  Private
 */
router.post('/remove', ensureAuthenticated, (req, res) => {
  // For demo purposes, just return success
  res.json({
    success: true,
    message: 'Item removed from cart',
    subtotal: 0,
    total: 0,
    cartCount: 0
  });
});

/**
 * @route   GET /cart/count
 * @desc    Get cart item count (AJAX)
 * @access  Private
 */
router.get('/count', ensureAuthenticated, (req, res) => {
  // For demo purposes, just return 0
  res.json({ count: 0 });
});

module.exports = router; 