const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');
const User = require('../models/User');
const { ensureAuthenticated, ensureNotAuthenticated } = require('../middlewares/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');

/**
 * @route   GET /auth/login
 * @desc    Login page
 * @access  Public
 */
router.get('/login', ensureNotAuthenticated, (req, res) => {
  res.render('pages/auth/login', {
    title: 'Login - FashionNest'
  });
});

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', ensureNotAuthenticated, (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
});

/**
 * @route   GET /auth/register
 * @desc    Register page
 * @access  Public
 */
router.get('/register', ensureNotAuthenticated, (req, res) => {
  res.render('pages/auth/register', {
    title: 'Register - FashionNest'
  });
});

/**
 * @route   POST /auth/register
 * @desc    Register user
 * @access  Public
 */
router.post('/register', ensureNotAuthenticated, async (req, res) => {
  try {
    const { name, email, password, password2 } = req.body;
    const errors = [];
    
    // Validation
    if (!name || !email || !password || !password2) {
      errors.push({ msg: 'Please fill in all fields' });
    }
    
    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
      errors.push({ msg: 'Password should be at least 6 characters' });
    }
    
    if (errors.length > 0) {
      return res.render('pages/auth/register', {
        title: 'Register - FashionNest',
        errors,
        name,
        email
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      errors.push({ msg: 'Email is already registered' });
      return res.render('pages/auth/register', {
        title: 'Register - FashionNest',
        errors,
        name,
        email
      });
    }
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password
    });
    
    // Save user
    await newUser.save();
    
    // Send welcome email
    await sendWelcomeEmail(newUser);
    
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/auth/register');
  }
});

/**
 * @route   GET /auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.get('/logout', ensureAuthenticated, (req, res) => {
  req.logout(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/');
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  });
});

/**
 * @route   GET /auth/google
 * @desc    Google OAuth login
 * @access  Public
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

/**
 * @route   GET /auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/auth/login',
  failureFlash: true
}), (req, res) => {
  res.redirect(req.session.returnTo || '/');
  delete req.session.returnTo;
});

/**
 * @route   GET /auth/facebook
 * @desc    Facebook OAuth login
 * @access  Public
 */
router.get('/facebook', passport.authenticate('facebook', {
  scope: ['email']
}));

/**
 * @route   GET /auth/facebook/callback
 * @desc    Facebook OAuth callback
 * @access  Public
 */
router.get('/facebook/callback', passport.authenticate('facebook', {
  failureRedirect: '/auth/login',
  failureFlash: true
}), (req, res) => {
  res.redirect(req.session.returnTo || '/');
  delete req.session.returnTo;
});

/**
 * @route   GET /auth/forgot-password
 * @desc    Forgot password page
 * @access  Public
 */
router.get('/forgot-password', ensureNotAuthenticated, (req, res) => {
  res.render('pages/auth/forgot-password', {
    title: 'Forgot Password - FashionNest'
  });
});

/**
 * @route   POST /auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', ensureNotAuthenticated, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      req.flash('error_msg', 'No account with that email address exists');
      return res.redirect('/auth/forgot-password');
    }
    
    // Generate reset token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Set token and expiration
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${token}`;
    
    // Send password reset email
    await sendPasswordResetEmail(user, resetUrl);
    
    req.flash('success_msg', 'An email has been sent with further instructions');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Forgot password error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/auth/forgot-password');
  }
});

/**
 * @route   GET /auth/reset-password/:token
 * @desc    Reset password page
 * @access  Public
 */
router.get('/reset-password/:token', ensureNotAuthenticated, async (req, res) => {
  try {
    // Find user by token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      req.flash('error_msg', 'Password reset token is invalid or has expired');
      return res.redirect('/auth/forgot-password');
    }
    
    res.render('pages/auth/reset-password', {
      title: 'Reset Password - FashionNest',
      token: req.params.token
    });
  } catch (error) {
    console.error('Reset password page error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect('/auth/forgot-password');
  }
});

/**
 * @route   POST /auth/reset-password/:token
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password/:token', ensureNotAuthenticated, async (req, res) => {
  try {
    const { password, password2 } = req.body;
    
    // Validation
    if (password !== password2) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect(`/auth/reset-password/${req.params.token}`);
    }
    
    if (password.length < 6) {
      req.flash('error_msg', 'Password should be at least 6 characters');
      return res.redirect(`/auth/reset-password/${req.params.token}`);
    }
    
    // Find user by token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      req.flash('error_msg', 'Password reset token is invalid or has expired');
      return res.redirect('/auth/forgot-password');
    }
    
    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    req.flash('success_msg', 'Your password has been updated. You can now log in with your new password');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Reset password error:', error);
    req.flash('error_msg', 'Something went wrong. Please try again later.');
    res.redirect(`/auth/reset-password/${req.params.token}`);
  }
});

module.exports = router; 