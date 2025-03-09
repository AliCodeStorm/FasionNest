require('dotenv').config();
const express = require('express');
console.log('Express loaded');

const mongoose = require('mongoose');
console.log('Mongoose loaded');

const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const expressLayouts = require('express-ejs-layouts');
console.log('Environment variables loaded');

// Import database connection
const connectDB = require('./config/database');
console.log('Database connection module loaded');

// Initialize Express app
const app = express();
console.log('Express app initialized');

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files - make sure this is correctly configured
const rootPublicPath = path.join(__dirname, 'public');
console.log('Checking root public path:', rootPublicPath);

// Serve from root public directory
if (require('fs').existsSync(rootPublicPath)) {
  console.log('Using root public directory');
  app.use(express.static(rootPublicPath));
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Flash messages
app.use(flash());

// Passport configuration
const configurePassport = require('./config/passport');
configurePassport(passport);

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

// Global variables
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');

// Use routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', {
    title: '500 - Server Error',
    message: 'Something went wrong. Please try again later.'
  });
});

// Connect to MongoDB and start server
const port = process.env.PORT || 3000;

// Connect to MongoDB
console.log('Initializing MongoDB connection...');
connectDB()
  .then((conn) => {
    if (conn && conn.connection) {
      console.log('MongoDB connection successful');
      
      // Start the server after successful database connection
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    } else {
      throw new Error('MongoDB connection failed - no connection object returned');
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

module.exports = app;