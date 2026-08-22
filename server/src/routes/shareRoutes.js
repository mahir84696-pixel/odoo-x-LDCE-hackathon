const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/shareController');

router.get('/', ctrl.listPublic);
router.get('/:slug', ctrl.getBySlug);

module.exports = router;
