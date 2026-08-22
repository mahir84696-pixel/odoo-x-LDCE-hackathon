const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cityController');

router.get('/', ctrl.list);
router.get('/countries', ctrl.countries);

module.exports = router;
