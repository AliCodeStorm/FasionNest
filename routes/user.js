const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { ensureAuthenticated } = require('../middlewares/auth');
const { singleImageUpload, handleUploadError } = require('../middlewares/upload');

/**
 * @route   GET /user/dashboard
 * @desc    User dashboard
 * @access  Private
 */
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    // Get user's recent orders
    const recentOrders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get user's wishlist items
    await req.user.populate('wishlist');
    
    res.render('pages/user/dashboard', {
      title: 'Dashboard - FashionNest',
      user: req.user,
      recentOrders,
      wishlist: req.user.wishlist
    });
  } catch (error) {
    console.error('User dashboard error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/');
  }
});

/**
 * @route   GET /user/profile
 * @desc    User profile page
 * @access  Private
 */
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.user._id);
    
    res.render('pages/user/profile', {
      title: 'My Profile',
      user: user
    });
  } catch (error) {
    console.error('Profile page error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/dashboard');
  }
});

/**
 * @route   POST /user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.post('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    // Validate input
    if (!name || !email) {
      req.flash('error_msg', 'Name and email are required');
      return res.redirect('/user/profile');
    }
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      req.flash('error_msg', 'Email is already taken');
      return res.redirect('/user/profile');
    }
    
    // Update user using updateOne to avoid validation issues
    await User.updateOne(
      { _id: req.user._id },
      { 
        $set: { 
          name: name,
          email: email,
          phone: phone || '',
          address: address || ''
        } 
      }
    );
    
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/user/profile');
  } catch (error) {
    console.error('Update profile error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/user/profile');
  }
});

/**
 * @route   GET /user/change-password
 * @desc    Change password page
 * @access  Private
 */
router.get('/change-password', ensureAuthenticated, (req, res) => {
  res.render('pages/user/change-password', {
    title: 'Change Password - FashionNest'
  });
});

/**
 * @route   POST /user/change-password
 * @desc    Change password
 * @access  Private
 */
router.post('/change-password', ensureAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash('error_msg', 'Please fill in all fields');
      return res.redirect('/user/change-password');
    }
    
    if (newPassword !== confirmPassword) {
      req.flash('error_msg', 'New passwords do not match');
      return res.redirect('/user/change-password');
    }
    
    if (newPassword.length < 6) {
      req.flash('error_msg', 'Password should be at least 6 characters');
      return res.redirect('/user/change-password');
    }
    
    // Check current password
    const isMatch = await req.user.comparePassword(currentPassword);
    
    if (!isMatch) {
      req.flash('error_msg', 'Current password is incorrect');
      return res.redirect('/user/change-password');
    }
    
    // Update password
    req.user.password = newPassword;
    await req.user.save();
    
    req.flash('success_msg', 'Password changed successfully');
    res.redirect('/user/profile');
  } catch (error) {
    console.error('Change password error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/user/change-password');
  }
});

/**
 * @route   GET /user/addresses
 * @desc    User addresses page
 * @access  Private
 */
router.get('/addresses', ensureAuthenticated, (req, res) => {
  res.render('pages/user/addresses', {
    title: 'My Addresses - FashionNest'
  });
});

/**
 * @route   POST /user/addresses/add
 * @desc    Add address
 * @access  Private
 */
router.post('/addresses/add', ensureAuthenticated, async (req, res) => {
  try {
    const { street, city, state, zipCode, country, isDefault } = req.body;
    
    // Validate input
    if (!street || !city || !state || !zipCode || !country) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect('/user/addresses');
    }
    
    // Create new address
    const newAddress = {
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault === 'on'
    };
    
    // If new address is default, remove default from other addresses
    if (newAddress.isDefault) {
      req.user.addresses.forEach(address => {
        address.isDefault = false;
      });
    }
    
    // Add address to user
    req.user.addresses.push(newAddress);
    
    await req.user.save();
    
    req.flash('success_msg', 'Address added successfully');
    res.redirect('/user/addresses');
  } catch (error) {
    console.error('Add address error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/user/addresses');
  }
});

/**
 * @route   POST /user/addresses/update/:id
 * @desc    Update address
 * @access  Private
 */
router.post('/addresses/update/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { street, city, state, zipCode, country, isDefault } = req.body;
    
    // Validate input
    if (!street || !city || !state || !zipCode || !country) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect('/user/addresses');
    }
    
    // Find address
    const address = req.user.addresses.id(req.params.id);
    
    if (!address) {
      req.flash('error_msg', 'Address not found');
      return res.redirect('/user/addresses');
    }
    
    // Update address
    address.street = street;
    address.city = city;
    address.state = state;
    address.zipCode = zipCode;
    address.country = country;
    
    // Handle default address
    const setDefault = isDefault === 'on';
    
    if (setDefault && !address.isDefault) {
      // If setting as default, remove default from other addresses
      req.user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      address.isDefault = true;
    } else if (!setDefault && address.isDefault) {
      // If removing default status, set first address as default
      address.isDefault = false;
      if (req.user.addresses.length > 0) {
        req.user.addresses[0].isDefault = true;
      }
    }
    
    await req.user.save();
    
    req.flash('success_msg', 'Address updated successfully');
    res.redirect('/user/addresses');
  } catch (error) {
    console.error('Update address error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/user/addresses');
  }
});

/**
 * @route   POST /user/addresses/delete/:id
 * @desc    Delete address
 * @access  Private
 */
router.post('/addresses/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Find address
    const address = req.user.addresses.id(req.params.id);
    
    if (!address) {
      req.flash('error_msg', 'Address not found');
      return res.redirect('/user/addresses');
    }
    
    // Check if it's the default address
    const wasDefault = address.isDefault;
    
    // Remove address
    req.user.addresses.pull(req.params.id);
    
    // If it was the default address, set a new default
    if (wasDefault && req.user.addresses.length > 0) {
      req.user.addresses[0].isDefault = true;
    }
    
    await req.user.save();
    
    req.flash('success_msg', 'Address deleted successfully');
    res.redirect('/user/addresses');
  } catch (error) {
    console.error('Delete address error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/user/addresses');
  }
});

/**
 * @route   GET /user/orders
 * @desc    User orders page
 * @access  Private
 */
router.get('/orders', ensureAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product')
            .sort({ createdAt: -1 });
        
        res.render('pages/user/orders', { 
            orders,
            user: req.user,
            title: 'My Orders'
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        req.flash('error', 'Failed to fetch orders');
        res.redirect('/dashboard');
    }
});

/**
 * @route   GET /user/orders/:id
 * @desc    Order details
 * @access  Private
 */
router.get('/orders/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Find order
    const order = await Order.findById(req.params.id).populate('items.product');
    
    if (!order) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/user/orders');
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Unauthorized');
      return res.redirect('/user/orders');
    }
    
    res.render('pages/user/order-details', {
      title: `Order #${order._id} - FashionNest`,
      order
    });
  } catch (error) {
    console.error('Order details error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/user/orders');
  }
});

/**
 * @route   GET /user/wishlist
 * @desc    User wishlist page
 * @access  Private
 */
router.get('/wishlist', ensureAuthenticated, (req, res) => {
  res.render('pages/user/wishlist', {
    title: 'My Wishlist - FashionNest'
  });
});

/**
 * @route   POST /user/wishlist/add/:productId
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post('/wishlist/add/:productId', ensureAuthenticated, async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Check if product exists
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if product is already in wishlist
    if (req.user.wishlist.includes(productId)) {
      return res.json({
        success: true,
        message: 'Product is already in your wishlist'
      });
    }
    
    // Add product to wishlist
    req.user.wishlist.push(productId);
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Product added to wishlist'
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
});

/**
 * @route   POST /user/wishlist/remove/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.post('/wishlist/remove/:productId', ensureAuthenticated, async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Remove product from wishlist
    req.user.wishlist.pull(productId);
    await req.user.save();
    
    // Check if request is AJAX
    if (req.xhr) {
      return res.json({
        success: true,
        message: 'Product removed from wishlist'
      });
    }
    
    req.flash('success_msg', 'Product removed from wishlist');
    res.redirect('/user/wishlist');
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    
    // Check if request is AJAX
    if (req.xhr) {
      return res.status(500).json({
        success: false,
        message: 'Something went wrong. Please try again later.'
      });
    }
    
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/user/wishlist');
  }
});

/**
 * @route   POST /user/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.post('/avatar', ensureAuthenticated, singleImageUpload, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error_msg', 'Please select an image to upload');
      return res.redirect('/user/profile');
    }
    
    // Update user avatar
    const user = await User.findById(req.user._id);
    user.avatar = `/uploads/${req.file.filename}`;
    
    // Only update the avatar field
    await User.updateOne(
      { _id: req.user._id },
      { $set: { avatar: `/uploads/${req.file.filename}` } }
    );
    
    req.flash('success_msg', 'Avatar updated successfully');
    res.redirect('/user/profile');
  } catch (error) {
    console.error('Update avatar error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/user/profile');
  }
});

/**
 * @route   GET /user/settings
 * @desc    User settings page
 * @access  Private
 */
router.get('/settings', ensureAuthenticated, async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.user._id);
    
    res.render('pages/user/settings', {
      title: 'Account Settings',
      user: user
    });
  } catch (error) {
    console.error('Settings page error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/dashboard');
  }
});

module.exports = router; 