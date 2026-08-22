const db = require('../config/db');

exports.stats = (_req, res) => {
  const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const trips = db.prepare('SELECT COUNT(*) AS n FROM trips').get().n;
  const cities = db.prepare('SELECT COUNT(*) AS n FROM cities').get().n;
  const activities = db.prepare('SELECT COUNT(*) AS n FROM activities').get().n;
  const totalBudget = db.prepare('SELECT COALESCE(SUM(budget), 0) AS total FROM trips').get().total;

  const popularCities = db.prepare(`
    SELECT c.id, c.name, c.country, c.region, c.cost_index, c.image, COUNT(s.id) AS visits
    FROM cities c
    LEFT JOIN stops s ON s.city_id = c.id
    GROUP BY c.id
    ORDER BY visits DESC, c.popular DESC, c.name
    LIMIT 12
  `).all();

  const popularActivities = db.prepare(`
    SELECT a.id, a.name, a.type, a.cost, a.duration, c.name AS city, COUNT(sa.id) AS uses
    FROM activities a
    JOIN cities c ON c.id = a.city_id
    LEFT JOIN stop_activities sa ON sa.activity_id = a.id
    GROUP BY a.id
    ORDER BY uses DESC, a.cost DESC, a.name
    LIMIT 12
  `).all();

  const activityTypes = db.prepare(`
    SELECT type, COUNT(*) AS count
    FROM activities
    GROUP BY type
    ORDER BY count DESC
  `).all();

  const statusRows = db.prepare('SELECT status, COUNT(*) AS n FROM trips GROUP BY status').all();
  
  let monthly = db.prepare(`
    SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS n
    FROM trips
    GROUP BY month
    ORDER BY month
  `).all();

  if (!monthly.length) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    monthly = [{ month: currentMonth, n: trips || 1 }];
  }

  const allUsers = db.prepare(`
    SELECT id, name, email, avatar, city, country, language, role, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  res.json({
    success: true,
    totals: { users, trips, cities, activities, totalBudget },
    popularCities,
    popularActivities,
    activityTypes,
    statusRows,
    monthly,
    users: allUsers
  });
};

exports.removeUser = (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own admin account here' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'User removed' });
};

exports.addCity = (req, res) => {
  const { name, country, region, costIndex, image, description, popular } = req.body || {};
  if (!name || !country) {
    return res.status(400).json({ success: false, message: 'Name and country are required' });
  }
  const info = db.prepare(`
    INSERT INTO cities (name, country, region, cost_index, image, description, popular)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    country.trim(),
    region || 'General',
    Number(costIndex || 50),
    image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    description || '',
    popular ? 1 : 0
  );
  const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, city });
};

exports.addActivity = (req, res) => {
  const { cityId, name, type, cost, duration, description, image } = req.body || {};
  if (!cityId || !name) {
    return res.status(400).json({ success: false, message: 'City and activity name are required' });
  }
  const city = db.prepare('SELECT image FROM cities WHERE id = ?').get(cityId);
  const info = db.prepare(`
    INSERT INTO activities (city_id, name, type, cost, duration, image, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(cityId),
    name.trim(),
    type || 'sightseeing',
    Number(cost || 0),
    duration || '2h',
    image || (city ? city.image : null),
    description || ''
  );
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, activity });
};
