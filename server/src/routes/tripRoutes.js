const express = require('express');
const router = express.Router();
const trip = require('../controllers/tripController');
const stop = require('../controllers/stopController');
const stopAct = require('../controllers/stopActivityController');
const budget = require('../controllers/budgetController');
const share = require('../controllers/shareController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/dashboard', trip.dashboard);
router.get('/', trip.list);
router.post('/', trip.create);
router.post('/clone/:slugOrId', trip.cloneTrip);

// Stop and activity routes MUST be before /:id to avoid 'stops' being matched as a trip id
router.post('/:tripId/stops', stop.addStop);
router.put('/stops/:id', stop.updateStop);
router.delete('/stops/:id', stop.removeStop);

router.post('/stops/:stopId/activities', stopAct.add);
router.delete('/activities/:id', stopAct.remove);

router.get('/:tripId/budget', budget.get);
router.put('/:tripId/budget', budget.update);

router.post('/:id/share', share.refreshSlug);
router.get('/:id', trip.getOne);
router.put('/:id', trip.update);
router.delete('/:id', trip.remove);

module.exports = router;
