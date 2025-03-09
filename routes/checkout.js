const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');

/**
 * @route   GET /checkout
 * @desc    Checkout page
 * @access  Private
 */
router.get('/', ensureAuthenticated, (req, res) => {
  // For demo purposes, we'll create a mock cart
  // In a real app, you'd fetch this from the database or session
  const mockCart = {
    items: [
      {
        name: 'Sample Product 1',
        image: '/img/products/product-1.jpg',
        size: 'M',
        color: 'Blue',
        price: 49.99,
        quantity: 1
      },
      {
        name: 'Sample Product 2',
        image: '/img/products/product-2.jpg',
        size: 'L',
        color: 'Black',
        price: 29.99,
        quantity: 2
      }
    ]
  };

  const subtotal = mockCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discount = 10.00;
  const shipping = 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal - discount + shipping + tax;

  res.render('pages/checkout/index', {
    title: 'Checkout',
    user: req.user,
    cart: mockCart,
    subtotal,
    discount,
    shipping,
    tax,
    total
  });
});

/**
 * @route   POST /checkout/process
 * @desc    Process checkout
 * @access  Private
 */
router.post('/process', ensureAuthenticated, async (req, res) => {
  try {
    // Get form data
    const { 
      fullName, 
      email, 
      phone, 
      street, 
      city, 
      state, 
      zipCode, 
      country, 
      saveAddress,
      paymentMethod 
    } = req.body;

    // In a real application, you would:
    // 1. Validate the form data
    // 2. Process the payment with a payment gateway
    // 3. Create an order in the database
    // 4. Clear the cart
    
    // For demo purposes, we'll create a mock order
    const mockOrder = {
      _id: 'ORD' + Date.now(),
      createdAt: new Date(),
      status: 'processing',
      paymentMethod: paymentMethod || 'credit_card',
      shippingAddress: {
        street,
        city,
        state,
        zipCode,
        country
      },
      items: [
        {
          name: 'Sample Product 1',
          size: 'M',
          color: 'Blue',
          price: 49.99,
          quantity: 1
        },
        {
          name: 'Sample Product 2',
          size: 'L',
          color: 'Black',
          price: 29.99,
          quantity: 2
        }
      ],
      subtotal: 109.97,
      discount: 10.00,
      shipping: 5.99,
      tax: 8.50,
      total: 114.46
    };

    // Store the order in session for the success page
    req.session.order = mockOrder;

    // Redirect to success page
    res.redirect('/checkout/success');
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      message: 'There was an error processing your checkout',
      error: error
    });
  }
});

/**
 * @route   GET /checkout/success
 * @desc    Order success page
 * @access  Private
 */
router.get('/success', ensureAuthenticated, (req, res) => {
  // Get the order from session
  const order = req.session.order;
  
  if (!order) {
    return res.redirect('/checkout');
  }
  
  // Clear the order from session after displaying
  // In a real app, you'd fetch this from the database
  req.session.order = null;
  
  res.render('pages/checkout/success', {
    title: 'Order Confirmation',
    user: req.user,
    order: order
  });
});

module.exports = router; 