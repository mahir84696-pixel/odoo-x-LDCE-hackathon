const db = require('../config/db');
const { calculateBudget } = require('../utils/budgetCalculator');
const { hydrateTrip } = require('./tripController');

exports.get = (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(req.params.tripId, req.user.id);
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const expenses = db.prepare('SELECT * FROM expenses WHERE trip_id = ?').get(trip.id) || {
    transport: 0, stay: 0, activities: 0, food: 0, misc: 0
  };
  res.json({ success: true, expenses, summary: calculateBudget(expenses, trip.budget), trip: hydrateTrip(trip) });
};

exports.update = (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(req.params.tripId, req.user.id);
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const body = req.body || {};
  db.prepare(`
    INSERT INTO expenses (trip_id, transport, stay, activities, food, misc)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(trip_id) DO UPDATE SET
      transport=excluded.transport,
      stay=excluded.stay,
      activities=excluded.activities,
      food=excluded.food,
      misc=excluded.misc
  `).run(
    trip.id,
    Number(body.transport || 0),
    Number(body.stay || 0),
    Number(body.activities || 0),
    Number(body.food || 0),
    Number(body.misc || 0)
  );
  const expenses = db.prepare('SELECT * FROM expenses WHERE trip_id = ?').get(trip.id);
  res.json({ success: true, expenses, summary: calculateBudget(expenses, trip.budget) });
};
