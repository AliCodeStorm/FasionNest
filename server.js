console.log('Starting FashionNest server...');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Welcome to FashionNest!');
});

app.listen(port, () => {
  console.log(`FashionNest server running on port ${port}`);
}); 