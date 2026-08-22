require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const path = require('path');
const express = require('express');
const cors = require('cors');

require('./config/db');
const seed = require('./seed/seedData');
seed();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/stops', require('./routes/stopRoutes'));
app.use('/api/cities', require('./routes/cityRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/budget', require('./routes/budgetRoutes'));
app.use('/api/share', require('./routes/shareRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use('/api', (_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const clientDir = path.join(__dirname, '../../client');
app.use(express.static(clientDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`GlobeTrotter running at http://localhost:${port}`);
});
