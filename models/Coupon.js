const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed']
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minimumPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if coupon is valid
CouponSchema.methods.isValid = function() {
  const now = new Date();
  
  // Check if coupon is active
  if (!this.isActive) return false;
  
  // Check if coupon is within valid date range
  if (now < this.startDate || now > this.endDate) return false;
  
  // Check if coupon has reached usage limit
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit) return false;
  
  return true;
};

// Method to calculate discount amount
CouponSchema.methods.calculateDiscount = function(cartTotal) {
  // Check if cart total meets minimum purchase requirement
  if (cartTotal < this.minimumPurchase) return 0;
  
  if (this.discountType === 'percentage') {
    // Calculate percentage discount
    return (cartTotal * this.discountValue) / 100;
  } else {
    // Fixed amount discount
    return Math.min(this.discountValue, cartTotal); // Don't exceed cart total
  }
};

// Method to increment usage count
CouponSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

const Coupon = mongoose.model('Coupon', CouponSchema);

module.exports = Coupon; 