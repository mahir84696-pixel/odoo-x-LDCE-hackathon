const db = require('../config/db');
const { hydrateTrip } = require('./tripController');

function ownTrip(tripId, userId) {
  return db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId);
}

exports.addStop = (req, res) => {
  const trip = ownTrip(req.params.tripId, req.user.id);
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const { cityId, title, sectionType, startDate, endDate, budget, notes } = req.body || {};
  const max = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM stops WHERE trip_id = ?').get(trip.id).m;
  const info = db.prepare(`
    INSERT INTO stops (trip_id, city_id, title, section_type, start_date, end_date, budget, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    trip.id,
    cityId || null,
    title || null,
    sectionType || 'city',
    startDate || null,
    endDate || null,
    Number(budget || 0),
    notes || '',
    max + 1
  );
  const stop = db.prepare('SELECT * FROM stops WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, stop, trip: hydrateTrip(trip) });
};

exports.updateStop = (req, res) => {
  const stop = db.prepare(`
    SELECT s.* FROM stops s
    JOIN trips t ON t.id = s.trip_id
    WHERE s.id = ? AND t.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!stop) return res.status(404).json({ success: false, message: 'Section not found' });
  db.prepare(`
    UPDATE stops SET city_id=?, title=?, section_type=?, start_date=?, end_date=?, budget=?, notes=?
    WHERE id=?
  `).run(
    req.body.cityId ?? stop.city_id,
    req.body.title ?? stop.title,
    req.body.sectionType ?? stop.section_type,
    req.body.startDate ?? stop.start_date,
    req.body.endDate ?? stop.end_date,
    req.body.budget != null ? Number(req.body.budget) : stop.budget,
    req.body.notes ?? stop.notes,
    stop.id
  );
  res.json({ success: true, trip: hydrateTrip(db.prepare('SELECT * FROM trips WHERE id = ?').get(stop.trip_id)) });
};

exports.removeStop = (req, res) => {
  const stop = db.prepare(`
    SELECT s.* FROM stops s
    JOIN trips t ON t.id = s.trip_id
    WHERE s.id = ? AND t.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!stop) return res.status(404).json({ success: false, message: 'Section not found' });
  db.prepare('DELETE FROM stops WHERE id = ?').run(stop.id);
  res.json({ success: true, trip: hydrateTrip(db.prepare('SELECT * FROM trips WHERE id = ?').get(stop.trip_id)) });
};
