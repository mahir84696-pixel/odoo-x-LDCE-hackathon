const db = require('../config/db');
const { hydrateTrip } = require('./tripController');

exports.add = (req, res) => {
  const stop = db.prepare(`
    SELECT s.* FROM stops s
    JOIN trips t ON t.id = s.trip_id
    WHERE s.id = ? AND t.user_id = ?
  `).get(req.params.stopId, req.user.id);
  if (!stop) return res.status(404).json({ success: false, message: 'Section not found' });

  const { activityId, name, time, cost, type, notes } = req.body || {};
  let actName = name;
  let actCost = Number(cost || 0);
  let actType = type;
  if (activityId) {
    const catalog = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId);
    if (catalog) {
      actName = actName || catalog.name;
      actCost = cost != null ? Number(cost) : catalog.cost;
      actType = actType || catalog.type;
    }
  }
  db.prepare(`
    INSERT INTO stop_activities (stop_id, activity_id, name, time, cost, type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(stop.id, activityId || null, actName || 'Activity', time || '09:00', actCost, actType || 'sightseeing', notes || '');

  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(stop.trip_id);
  res.status(201).json({ success: true, trip: hydrateTrip(trip) });
};

exports.remove = (req, res) => {
  const row = db.prepare(`
    SELECT sa.*, s.trip_id FROM stop_activities sa
    JOIN stops s ON s.id = sa.stop_id
    JOIN trips t ON t.id = s.trip_id
    WHERE sa.id = ? AND t.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ success: false, message: 'Activity not found' });
  db.prepare('DELETE FROM stop_activities WHERE id = ?').run(row.id);
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(row.trip_id);
  res.json({ success: true, trip: hydrateTrip(trip) });
};
