console.log('Starting test server...');

const express = require('express');
console.log('Express loaded');

const app = express();
console.log('Express app initialized');

app.get('/', (req, res) => {
  res.send('Test server is running!');
});

const port = 3001;
console.log(`Port set to ${port}`);

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
}); 