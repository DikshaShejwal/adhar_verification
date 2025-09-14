const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Routes
const aadhaarRoutes = require('./routes/aadhar'); // make sure file name is exactly 'aadhar.js'
const panRoutes = require('./routes/pan');       // make sure file name is exactly 'pan.js'

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/aadhaar', aadhaarRoutes);
app.use('/api/pan', panRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
