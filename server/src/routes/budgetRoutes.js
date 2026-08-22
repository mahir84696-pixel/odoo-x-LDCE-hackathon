const express = require('express');
const router = express.Router();
const budget = require('../controllers/budgetController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/:tripId', budget.get);
router.put('/:tripId', budget.update);

module.exports = router;
