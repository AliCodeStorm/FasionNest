# FashionNest

FashionNest is a modern e-commerce platform for fashion products built with Node.js, Express, and MongoDB.

## Features

- User authentication (register, login, logout)
- Product browsing and searching
- Product categories and filtering
- Shopping cart functionality
- Checkout process
- Order management
- User profile management
- Admin dashboard (product, order, and user management)
- Responsive design for all devices

## Installation

1. Clone the repository
```
git clone https://github.com/yourusername/fashionnest.git
cd fashionnest
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fashionnest
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

4. Start the development server
```
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Authentication**: Passport.js, JWT
- **Frontend**: EJS, Bootstrap 5, jQuery
- **Other**: Nodemailer, Multer, etc.

## Project Structure

```
fashionnest/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middlewares/        # Custom middlewares
├── models/             # Database models
├── public/             # Static files (CSS, JS, images)
├── routes/             # Route definitions
├── utils/              # Utility functions
├── views/              # EJS templates
│   ├── pages/          # Page templates
│   ├── partials/       # Reusable template parts
│   └── layouts/        # Layout templates
├── app.js              # Express app setup
├── server.js           # Server entry point
└── package.json        # Project dependencies
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Bootstrap](https://getbootstrap.com/)
- [Font Awesome](https://fontawesome.com/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) 