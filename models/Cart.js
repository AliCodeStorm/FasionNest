const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    size: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  couponCode: {
    type: String
  },
  discount: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
CartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate cart total
CartSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Method to calculate cart total with discount
CartSchema.methods.calculateTotalWithDiscount = function() {
  const total = this.calculateTotal();
  return total - this.discount;
};

// Method to add item to cart
CartSchema.methods.addItem = function(productId, quantity, size, color, price) {
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString() && 
            item.size === size && 
            item.color === color
  );

  if (existingItemIndex > -1) {
    // Item exists, update quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      size,
      color,
      price
    });
  }

  return this.save();
};

// Method to remove item from cart
CartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
  return this.save();
};

// Method to update item quantity
CartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.find(item => item._id.toString() === itemId.toString());
  
  if (item) {
    item.quantity = quantity;
    return this.save();
  }
  
  return Promise.reject(new Error('Item not found'));
};

// Method to clear cart
CartSchema.methods.clearCart = function() {
  this.items = [];
  this.couponCode = null;
  this.discount = 0;
  return this.save();
};

const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart; 