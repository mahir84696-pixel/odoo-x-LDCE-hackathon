const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/profileController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/', ctrl.get);
router.put('/', ctrl.update);
router.delete('/', ctrl.remove);

module.exports = router;
