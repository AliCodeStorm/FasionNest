const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');

// Configure PayPal
paypal.configure({
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

/**
 * Process Stripe payment
 * @param {Object} paymentData - Payment data
 * @param {String} paymentData.token - Stripe token
 * @param {Number} paymentData.amount - Amount in cents
 * @param {String} paymentData.currency - Currency code (default: 'usd')
 * @param {String} paymentData.description - Payment description
 * @param {String} paymentData.email - Customer email
 * @returns {Promise} - Stripe charge result
 */
const processStripePayment = async (paymentData) => {
  try {
    // Create customer
    const customer = await stripe.customers.create({
      email: paymentData.email,
      source: paymentData.token
    });

    // Create charge
    const charge = await stripe.charges.create({
      amount: Math.round(paymentData.amount * 100), // Convert to cents
      currency: paymentData.currency || 'usd',
      customer: customer.id,
      description: paymentData.description || 'FashionNest Purchase',
      receipt_email: paymentData.email
    });

    return {
      success: true,
      id: charge.id,
      status: charge.status,
      receipt_url: charge.receipt_url
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create PayPal payment
 * @param {Object} paymentData - Payment data
 * @param {Number} paymentData.amount - Amount
 * @param {String} paymentData.currency - Currency code (default: 'USD')
 * @param {String} paymentData.description - Payment description
 * @param {String} paymentData.returnUrl - Success URL
 * @param {String} paymentData.cancelUrl - Cancel URL
 * @returns {Promise} - PayPal payment creation result
 */
const createPayPalPayment = (paymentData) => {
  const paymentJson = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: paymentData.returnUrl,
      cancel_url: paymentData.cancelUrl
    },
    transactions: [{
      amount: {
        total: paymentData.amount.toFixed(2),
        currency: paymentData.currency || 'USD'
      },
      description: paymentData.description || 'FashionNest Purchase'
    }]
  };

  return new Promise((resolve, reject) => {
    paypal.payment.create(paymentJson, (error, payment) => {
      if (error) {
        reject(error);
      } else {
        // Extract approval URL
        const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
        resolve({
          paymentId: payment.id,
          approvalUrl: approvalUrl.href
        });
      }
    });
  });
};

/**
 * Execute PayPal payment
 * @param {String} paymentId - PayPal payment ID
 * @param {String} payerId - PayPal payer ID
 * @returns {Promise} - PayPal payment execution result
 */
const executePayPalPayment = (paymentId, payerId) => {
  const executePaymentJson = {
    payer_id: payerId
  };

  return new Promise((resolve, reject) => {
    paypal.payment.execute(paymentId, executePaymentJson, (error, payment) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          success: true,
          id: payment.id,
          status: payment.state,
          payer: payment.payer.payer_info.email
        });
      }
    });
  });
};

module.exports = {
  processStripePayment,
  createPayPalPayment,
  executePayPalPayment
}; 