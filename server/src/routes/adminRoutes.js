const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

router.use(auth, admin);
router.get('/stats', ctrl.stats);
router.delete('/users/:id', ctrl.removeUser);
router.post('/cities', ctrl.addCity);
router.post('/activities', ctrl.addActivity);

module.exports = router;
