const db = require('../config/db');
const { hydrateTrip } = require('./tripController');
const { generateSlug } = require('../utils/generateSlug');

exports.listPublic = (_req, res) => {
  const trips = db.prepare(`
    SELECT t.id, t.name, t.start_date, t.end_date, t.description, t.cover, t.budget, t.share_slug, u.name AS author
    FROM trips t
    JOIN users u ON u.id = t.user_id
    WHERE t.share_slug IS NOT NULL
    ORDER BY t.created_at DESC
  `).all();
  res.json({ success: true, trips });
};

exports.getBySlug = (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE share_slug = ?').get(req.params.slug);
  if (!trip) return res.status(404).json({ success: false, message: 'Shared itinerary not found' });
  const author = db.prepare('SELECT name FROM users WHERE id = ?').get(trip.user_id);
  const full = hydrateTrip(trip);
  res.json({ success: true, trip: { ...full, author: author ? author.name : 'Traveler' } });
};

exports.refreshSlug = (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  const slug = generateSlug();
  db.prepare('UPDATE trips SET share_slug = ? WHERE id = ?').run(slug, trip.id);
  res.json({ success: true, shareSlug: slug });
};
