require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

app.use('/api/auth', authRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../../client')));

app.listen(PORT, () => {
  console.log(`GlobeTrotter API running on http://localhost:${PORT}`);
});
