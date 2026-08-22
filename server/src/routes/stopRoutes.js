const express = require('express');
const router = express.Router();
const stop = require('../controllers/stopController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.put('/:id', stop.updateStop);
router.delete('/:id', stop.removeStop);

module.exports = router;
