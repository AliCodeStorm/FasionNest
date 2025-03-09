const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const { ensureAdmin } = require('../middlewares/auth');
const { productImageUpload, handleUploadError } = require('../middlewares/upload');
const slugify = require('slugify');

/**
 * @route   GET /admin
 * @desc    Admin dashboard
 * @access  Admin
 */
router.get('/', ensureAdmin, async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');
    
    res.render('pages/admin/dashboard', {
      title: 'Admin Dashboard - FashionNest',
      userCount,
      productCount,
      orderCount,
      recentOrders
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/');
  }
});

/**
 * @route   GET /admin/products
 * @desc    List all products
 * @access  Admin
 */
router.get('/products', ensureAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    res.render('pages/admin/products', {
      title: 'Manage Products - FashionNest',
      products
    });
  } catch (error) {
    console.error('Admin products error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin');
  }
});

/**
 * @route   GET /admin/products/add
 * @desc    Add product form
 * @access  Admin
 */
router.get('/products/add', ensureAdmin, (req, res) => {
  res.render('pages/admin/products/add', {
    title: 'Add Product - FashionNest'
  });
});

/**
 * @route   POST /admin/products/add
 * @desc    Add product
 * @access  Admin
 */
router.post('/products/add', ensureAdmin, productImageUpload, handleUploadError, async (req, res) => {
  try {
    const {
      name,
      price,
      discountPrice,
      category,
      subcategory,
      brand,
      description,
      featured,
      trending,
      sizes,
      colors
    } = req.body;
    
    // Validate input
    if (!name || !price || !category || !subcategory || !brand || !description) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect('/admin/products/add');
    }
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      req.flash('error_msg', 'Please upload at least one product image');
      return res.redirect('/admin/products/add');
    }
    
    // Create slug
    const slug = slugify(name, {
      lower: true,
      strict: true
    });
    
    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug });
    
    if (existingProduct) {
      req.flash('error_msg', 'A product with this name already exists');
      return res.redirect('/admin/products/add');
    }
    
    // Process sizes
    const sizeArray = [];
    if (Array.isArray(sizes)) {
      for (let i = 0; i < sizes.length; i++) {
        sizeArray.push({
          name: sizes[i],
          stock: req.body[`stock_${sizes[i]}`] || 0
        });
      }
    } else if (sizes) {
      sizeArray.push({
        name: sizes,
        stock: req.body[`stock_${sizes}`] || 0
      });
    }
    
    // Process colors
    const colorArray = [];
    if (Array.isArray(colors)) {
      for (let i = 0; i < colors.length; i++) {
        colorArray.push({
          name: colors[i],
          code: req.body[`color_code_${colors[i]}`] || '#000000'
        });
      }
    } else if (colors) {
      colorArray.push({
        name: colors,
        code: req.body[`color_code_${colors}`] || '#000000'
      });
    }
    
    // Process images
    const images = req.files.map(file => `/uploads/${file.filename}`);
    
    // Create new product
    const newProduct = new Product({
      name,
      slug,
      price,
      discountPrice: discountPrice || undefined,
      category,
      subcategory,
      brand,
      description,
      images,
      sizes: sizeArray,
      colors: colorArray,
      featured: featured === 'on',
      trending: trending === 'on'
    });
    
    await newProduct.save();
    
    req.flash('success_msg', 'Product added successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Add product error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin/products/add');
  }
});

/**
 * @route   GET /admin/products/edit/:id
 * @desc    Edit product form
 * @access  Admin
 */
router.get('/products/edit/:id', ensureAdmin, async (req, res) => {
  try {
    // Find product
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/admin/products');
    }
    
    res.render('pages/admin/products/edit', {
      title: 'Edit Product - FashionNest',
      product
    });
  } catch (error) {
    console.error('Edit product form error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin/products');
  }
});

/**
 * @route   POST /admin/products/edit/:id
 * @desc    Update product
 * @access  Admin
 */
router.post('/products/edit/:id', ensureAdmin, productImageUpload, handleUploadError, async (req, res) => {
  try {
    const {
      name,
      price,
      discountPrice,
      category,
      subcategory,
      brand,
      description,
      featured,
      trending
    } = req.body;
    
    // Validate input
    if (!name || !price || !category || !subcategory || !brand || !description) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect(`/admin/products/edit/${req.params.id}`);
    }
    
    // Find product
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/admin/products');
    }
    
    // Create slug if name changed
    let slug = product.slug;
    if (name !== product.name) {
      slug = slugify(name, {
        lower: true,
        strict: true
      });
      
      // Check if slug already exists
      const existingProduct = await Product.findOne({ slug, _id: { $ne: req.params.id } });
      
      if (existingProduct) {
        req.flash('error_msg', 'A product with this name already exists');
        return res.redirect(`/admin/products/edit/${req.params.id}`);
      }
    }
    
    // Process sizes
    const sizeArray = [];
    const sizes = req.body.sizes || [];
    if (Array.isArray(sizes)) {
      for (let i = 0; i < sizes.length; i++) {
        sizeArray.push({
          name: sizes[i],
          stock: req.body[`stock_${sizes[i]}`] || 0
        });
      }
    } else if (sizes) {
      sizeArray.push({
        name: sizes,
        stock: req.body[`stock_${sizes}`] || 0
      });
    }
    
    // Process colors
    const colorArray = [];
    const colors = req.body.colors || [];
    if (Array.isArray(colors)) {
      for (let i = 0; i < colors.length; i++) {
        colorArray.push({
          name: colors[i],
          code: req.body[`color_code_${colors[i]}`] || '#000000'
        });
      }
    } else if (colors) {
      colorArray.push({
        name: colors,
        code: req.body[`color_code_${colors}`] || '#000000'
      });
    }
    
    // Process images
    let images = product.images;
    if (req.files && req.files.length > 0) {
      // Add new images
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      images = [...images, ...newImages];
    }
    
    // Remove images if requested
    const imagesToRemove = req.body.removeImages || [];
    if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
      images = images.filter(img => !imagesToRemove.includes(img));
    } else if (imagesToRemove) {
      images = images.filter(img => img !== imagesToRemove);
    }
    
    // Update product
    product.name = name;
    product.slug = slug;
    product.price = price;
    product.discountPrice = discountPrice || undefined;
    product.category = category;
    product.subcategory = subcategory;
    product.brand = brand;
    product.description = description;
    product.images = images;
    product.sizes = sizeArray;
    product.colors = colorArray;
    product.featured = featured === 'on';
    product.trending = trending === 'on';
    
    await product.save();
    
    req.flash('success_msg', 'Product updated successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Update product error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect(`/admin/products/edit/${req.params.id}`);
  }
});

/**
 * @route   POST /admin/products/delete/:id
 * @desc    Delete product
 * @access  Admin
 */
router.post('/products/delete/:id', ensureAdmin, async (req, res) => {
  try {
    // Find and delete product
    await Product.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Product deleted successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Delete product error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin/products');
  }
});

/**
 * @route   GET /admin/users
 * @desc    List all users
 * @access  Admin
 */
router.get('/users', ensureAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    
    res.render('pages/admin/users', {
      title: 'Manage Users - FashionNest',
      users
    });
  } catch (error) {
    console.error('Admin users error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin');
  }
});

/**
 * @route   GET /admin/users/edit/:id
 * @desc    Edit user form
 * @access  Admin
 */
router.get('/users/edit/:id', ensureAdmin, async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }
    
    res.render('pages/admin/users/edit', {
      title: 'Edit User - FashionNest',
      user
    });
  } catch (error) {
    console.error('Edit user form error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin/users');
  }
});

/**
 * @route   POST /admin/users/edit/:id
 * @desc    Update user
 * @access  Admin
 */
router.post('/users/edit/:id', ensureAdmin, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Validate input
    if (!name || !email || !role) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect(`/admin/users/edit/${req.params.id}`);
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }
    
    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      
      if (existingUser) {
        req.flash('error_msg', 'Email is already taken');
        return res.redirect(`/admin/users/edit/${req.params.id}`);
      }
    }
    
    // Update user
    user.name = name;
    user.email = email;
    user.role = role;
    
    await user.save();
    
    req.flash('success_msg', 'User updated successfully');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Update user error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect(`/admin/users/edit/${req.params.id}`);
  }
});

/**
 * @route   POST /admin/users/delete/:id
 * @desc    Delete user
 * @access  Admin
 */
router.post('/users/delete/:id', ensureAdmin, async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }
    
    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      req.flash('error_msg', 'You cannot delete your own account');
      return res.redirect('/admin/users');
    }
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'User deleted successfully');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Delete user error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin/users');
  }
});

/**
 * @route   GET /admin/orders
 * @desc    List all orders
 * @access  Admin
 */
router.get('/orders', ensureAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    
    res.render('pages/admin/orders', {
      title: 'Manage Orders - FashionNest',
      orders
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin');
  }
});

/**
 * @route   GET /admin/orders/:id
 * @desc    Order details
 * @access  Admin
 */
router.get('/orders/:id', ensureAdmin, async (req, res) => {
  try {
    // Find order
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product');
    
    if (!order) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/admin/orders');
    }
    
    res.render('pages/admin/orders/details', {
      title: `Order #${order._id} - FashionNest`,
      order
    });
  } catch (error) {
    console.error('Order details error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin/orders');
  }
});

/**
 * @route   POST /admin/orders/:id/status
 * @desc    Update order status
 * @access  Admin
 */
router.post('/orders/:id/status', ensureAdmin, async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    
    // Validate input
    if (!status) {
      req.flash('error_msg', 'Please select a status');
      return res.redirect(`/admin/orders/${req.params.id}`);
    }
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/admin/orders');
    }
    
    // Update order
    order.status = status;
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    // Set delivered date if status is delivered
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = Date.now();
    }
    
    await order.save();
    
    // TODO: Send email notification to user about status update
    
    req.flash('success_msg', 'Order status updated successfully');
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (error) {
    console.error('Update order status error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect(`/admin/orders/${req.params.id}`);
  }
});

/**
 * @route   GET /admin/coupons
 * @desc    Admin coupons list
 * @access  Admin
 */
router.get('/coupons', ensureAdmin, async (req, res) => {
  try {
    // Get all coupons
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    
    res.render('pages/admin/coupons/index', {
      title: 'Manage Coupons - FashionNest',
      coupons
    });
  } catch (error) {
    console.error('Admin coupons error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin');
  }
});

/**
 * @route   GET /admin/coupons/add
 * @desc    Add coupon form
 * @access  Admin
 */
router.get('/coupons/add', ensureAdmin, async (req, res) => {
  try {
    // Get products for applicable products selection
    const products = await Product.find().select('name');
    
    res.render('pages/admin/coupons/add', {
      title: 'Add Coupon - FashionNest',
      products
    });
  } catch (error) {
    console.error('Add coupon form error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin/coupons');
  }
});

/**
 * @route   POST /admin/coupons/add
 * @desc    Add coupon
 * @access  Admin
 */
router.post('/coupons/add', ensureAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumPurchase,
      startDate,
      endDate,
      usageLimit,
      applicableProducts,
      applicableCategories
    } = req.body;
    
    // Validate input
    if (!code || !description || !discountType || !discountValue || !startDate || !endDate) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect('/admin/coupons/add');
    }
    
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (existingCoupon) {
      req.flash('error_msg', 'Coupon code already exists');
      return res.redirect('/admin/coupons/add');
    }
    
    // Create new coupon
    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minimumPurchase: minimumPurchase || 0,
      startDate,
      endDate,
      usageLimit: usageLimit || null,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || []
    });
    
    await newCoupon.save();
    
    req.flash('success_msg', 'Coupon added successfully');
    res.redirect('/admin/coupons');
  } catch (error) {
    console.error('Add coupon error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin/coupons/add');
  }
});

/**
 * @route   GET /admin/coupons/edit/:id
 * @desc    Edit coupon form
 * @access  Admin
 */
router.get('/coupons/edit/:id', ensureAdmin, async (req, res) => {
  try {
    // Find coupon
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      req.flash('error_msg', 'Coupon not found');
      return res.redirect('/admin/coupons');
    }
    
    // Get products for applicable products selection
    const products = await Product.find().select('name');
    
    res.render('pages/admin/coupons/edit', {
      title: 'Edit Coupon - FashionNest',
      coupon,
      products
    });
  } catch (error) {
    console.error('Edit coupon form error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin/coupons');
  }
});

/**
 * @route   POST /admin/coupons/edit/:id
 * @desc    Update coupon
 * @access  Admin
 */
router.post('/coupons/edit/:id', ensureAdmin, async (req, res) => {
  try {
    const {
      description,
      discountType,
      discountValue,
      minimumPurchase,
      startDate,
      endDate,
      usageLimit,
      isActive,
      applicableProducts,
      applicableCategories
    } = req.body;
    
    // Validate input
    if (!description || !discountType || !discountValue || !startDate || !endDate) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.redirect(`/admin/coupons/edit/${req.params.id}`);
    }
    
    // Find coupon
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      req.flash('error_msg', 'Coupon not found');
      return res.redirect('/admin/coupons');
    }
    
    // Update coupon
    coupon.description = description;
    coupon.discountType = discountType;
    coupon.discountValue = discountValue;
    coupon.minimumPurchase = minimumPurchase || 0;
    coupon.startDate = startDate;
    coupon.endDate = endDate;
    coupon.usageLimit = usageLimit || null;
    coupon.isActive = isActive === 'on';
    coupon.applicableProducts = applicableProducts || [];
    coupon.applicableCategories = applicableCategories || [];
    
    await coupon.save();
    
    req.flash('success_msg', 'Coupon updated successfully');
    res.redirect('/admin/coupons');
  } catch (error) {
    console.error('Update coupon error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect(`/admin/coupons/edit/${req.params.id}`);
  }
});

/**
 * @route   POST /admin/coupons/delete/:id
 * @desc    Delete coupon
 * @access  Admin
 */
router.post('/coupons/delete/:id', ensureAdmin, async (req, res) => {
  try {
    // Find and delete coupon
    await Coupon.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Coupon deleted successfully');
    res.redirect('/admin/coupons');
  } catch (error) {
    console.error('Delete coupon error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/admin/coupons');
  }
});

module.exports = router; 