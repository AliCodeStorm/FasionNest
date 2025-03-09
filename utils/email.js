const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.html - Email HTML content
 * @param {String} options.text - Email text content (fallback)
 * @returns {Promise} - Nodemailer send result
 */
const sendEmail = async (options) => {
  const mailOptions = {
    from: `FashionNest <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @returns {Promise} - Email send result
 */
const sendWelcomeEmail = async (user) => {
  return await sendEmail({
    to: user.email,
    subject: 'Welcome to FashionNest!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to FashionNest!</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for joining FashionNest! We're excited to have you as a member of our community.</p>
        <p>With your new account, you can:</p>
        <ul>
          <li>Shop the latest fashion trends</li>
          <li>Save your favorite items to your wishlist</li>
          <li>Track your orders</li>
          <li>Receive exclusive offers and discounts</li>
        </ul>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Happy shopping!</p>
        <p>The FashionNest Team</p>
      </div>
    `
  });
};

/**
 * Send order confirmation email
 * @param {Object} order - Order object (populated with user and items)
 * @returns {Promise} - Email send result
 */
const sendOrderConfirmationEmail = async (order) => {
  // Generate order items HTML
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.image}" alt="${item.name}" style="width: 50px; height: auto;">
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.size} / ${item.color}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return await sendEmail({
    to: order.user.email,
    subject: `FashionNest - Order Confirmation #${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Hello ${order.user.name},</p>
        <p>Thank you for your order! We're processing it now and will ship it soon.</p>
        
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> #${order._id}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod.replace('_', ' ').toUpperCase()}</p>
        
        <h3>Shipping Address</h3>
        <p>
          ${order.shippingAddress.street}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
          ${order.shippingAddress.country}
        </p>
        
        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left;">Image</th>
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: left;">Size/Color</th>
              <th style="padding: 10px; text-align: left;">Qty</th>
              <th style="padding: 10px; text-align: left;">Price</th>
              <th style="padding: 10px; text-align: left;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
              <td style="padding: 10px;">$${order.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="5" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
              <td style="padding: 10px;">$${order.shipping.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="5" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
              <td style="padding: 10px;">$${order.tax.toFixed(2)}</td>
            </tr>
            ${order.discount > 0 ? `
            <tr>
              <td colspan="5" style="padding: 10px; text-align: right;"><strong>Discount:</strong></td>
              <td style="padding: 10px;">-$${order.discount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td colspan="5" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px;"><strong>$${order.total.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <p>You will receive another email when your order ships with tracking information.</p>
        <p>If you have any questions about your order, please contact our customer service.</p>
        <p>Thank you for shopping with FashionNest!</p>
      </div>
    `
  });
};

/**
 * Send password reset email
 * @param {Object} user - User object with resetPasswordToken
 * @param {String} resetUrl - Password reset URL
 * @returns {Promise} - Email send result
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
  return await sendEmail({
    to: user.email,
    subject: 'FashionNest - Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your FashionNest account.</p>
        <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </p>
        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        <p>The FashionNest Team</p>
      </div>
    `
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail
}; 