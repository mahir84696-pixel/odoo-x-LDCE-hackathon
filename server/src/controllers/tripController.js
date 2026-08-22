const db = require('../config/db');
const { generateSlug } = require('../utils/generateSlug');
const { calculateBudget } = require('../utils/budgetCalculator');

function hydrateTrip(trip) {
  if (!trip) return null;
  const stops = db.prepare(`
    SELECT s.*, c.name AS city_name, c.country AS city_country, c.image AS city_image
    FROM stops s
    LEFT JOIN cities c ON c.id = s.city_id
    WHERE s.trip_id = ?
    ORDER BY s.sort_order, s.id
  `).all(trip.id);

  trip.stops = stops.map((stop) => {
    const activities = db.prepare('SELECT * FROM stop_activities WHERE stop_id = ? ORDER BY time, id').all(stop.id);
    return {
      ...stop,
      city: stop.city_name,
      country: stop.city_country,
      activities
    };
  });

  const rawExpenses = db.prepare('SELECT * FROM expenses WHERE trip_id = ?').get(trip.id) || {
    transport: 0, stay: 0, activities: 0, food: 0, misc: 0
  };

  const expenses = {
    transport: Number(rawExpenses.transport || 0),
    stay: Number(rawExpenses.stay || 0),
    activities: Number(rawExpenses.activities || 0),
    food: Number(rawExpenses.food || 0),
    misc: Number(rawExpenses.misc || 0)
  };

  // Dynamically compute activities cost from stop_activities
  let dynamicActivitiesCost = 0;
  trip.stops.forEach((s) => {
    (s.activities || []).forEach((a) => {
      dynamicActivitiesCost += Number(a.cost || 0);
    });
  });
  if (dynamicActivitiesCost > 0) {
    expenses.activities = dynamicActivitiesCost;
  }

  trip.expenses = expenses;
  trip.budgetSummary = calculateBudget(expenses, trip.budget);
  return trip;
}

function tripStatus(start, end) {
  const today = new Date().toISOString().slice(0, 10);
  if (start && end) {
    if (today < start) return 'upcoming';
    if (today > end) return 'completed';
    return 'ongoing';
  }
  return 'upcoming';
}

function addDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

exports.dashboard = (req, res) => {
  const trips = db.prepare('SELECT * FROM trips WHERE user_id = ?').all(req.user.id).map(hydrateTrip);
  const cityCount = db.prepare('SELECT COUNT(*) AS n FROM cities').get().n;
  const activityCount = db.prepare('SELECT COUNT(*) AS n FROM activities').get().n;
  const totalBudget = trips.reduce((s, t) => s + Number(t.budget || 0), 0);
  const popular = db.prepare('SELECT * FROM cities WHERE popular = 1 ORDER BY name LIMIT 8').all();
  res.json({
    success: true,
    stats: {
      totalTrips: trips.length,
      cities: cityCount,
      activities: activityCount,
      totalBudget
    },
    trips,
    popular
  });
};

exports.list = (req, res) => {
  const trips = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY start_date DESC, id DESC').all(req.user.id);
  res.json({ success: true, trips: trips.map(hydrateTrip) });
};

exports.getOne = (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  res.json({ success: true, trip: hydrateTrip(trip) });
};

exports.create = (req, res) => {
  const { name, startDate, endDate, description, cover, budget, currency } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Trip name is required' });
  const status = tripStatus(startDate, endDate);
  const slug = generateSlug();
  const info = db.prepare(`
    INSERT INTO trips (user_id, name, start_date, end_date, description, cover, status, budget, currency, share_slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    name.trim(),
    startDate || null,
    endDate || null,
    description || '',
    cover || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    status,
    Number(budget || 0),
    currency || 'INR',
    slug
  );
  db.prepare('INSERT INTO expenses (trip_id) VALUES (?)').run(info.lastInsertRowid);
  const trip = hydrateTrip(db.prepare('SELECT * FROM trips WHERE id = ?').get(info.lastInsertRowid));
  res.status(201).json({ success: true, trip });
};

exports.autoPlan = (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  const origin = db.prepare('SELECT * FROM cities WHERE id = ?').get(req.body?.originCityId);
  const destination = db.prepare('SELECT * FROM cities WHERE id = ?').get(req.body?.destinationCityId);
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  if (!origin || !destination) return res.status(400).json({ success: false, message: 'Start and destination cities are required' });
  if (origin.id === destination.id) return res.status(400).json({ success: false, message: 'Choose two different cities' });

  const dayCount = trip.start_date && trip.end_date
    ? Math.max(1, Math.ceil((new Date(`${trip.end_date}T00:00:00`) - new Date(`${trip.start_date}T00:00:00`)) / 86400000) + 1)
    : 1;
  const insertStop = db.prepare(`
    INSERT INTO stops (trip_id, city_id, title, section_type, start_date, end_date, budget, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertActivity = db.prepare(`
    INSERT INTO stop_activities (stop_id, activity_id, name, time, cost, type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const destinationActivities = db.prepare('SELECT * FROM activities WHERE city_id = ? ORDER BY id').all(destination.id);
  const planTypes = dayCount === 1 ? ['other'] : ['travel', 'hotel', 'activity', 'food', 'other'];
  const planWeights = dayCount === 1 ? [1] : [0.2, 0.3, 0.25, 0.15, 0.1];
  const weightTotal = planWeights.slice(0, dayCount).reduce((sum, weight) => sum + weight, 0);
  const createPlan = db.transaction(() => {
    db.prepare('DELETE FROM stops WHERE trip_id = ?').run(trip.id);
    for (let day = 0; day < dayCount; day += 1) {
      const dateValue = trip.start_date ? addDays(trip.start_date, day) : null;
      const city = day === 0 ? origin : destination;
      const sectionType = planTypes[Math.min(day, planTypes.length - 1)];
      const sectionBudget = Number(trip.budget || 0) * (planWeights[Math.min(day, planWeights.length - 1)] || 0) / weightTotal;
      const title = day === 0 ? `Day 1 - Depart ${origin.name}` : day === dayCount - 1 ? `Day ${day + 1} - Explore ${destination.name}` : `Day ${day + 1} - ${destination.name}`;
      const stopInfo = insertStop.run(trip.id, city.id, title, sectionType, dateValue, dateValue, sectionBudget, day === 0 ? `Travel from ${origin.name} to ${destination.name}.` : `Plan ${sectionType} in ${destination.name}.`, day);
      const activity = destinationActivities[day - 1];
      if (activity) {
        insertActivity.run(stopInfo.lastInsertRowid, activity.id, activity.name, '10:00', activity.cost, activity.type, activity.description || 'Automatically added to your day plan.');
      }
    }
  });
  createPlan();
  res.json({ success: true, trip: hydrateTrip(db.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id)) });
};

exports.update = (req, res) => {
  const existing = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Trip not found' });
  const next = {
    name: req.body.name ?? existing.name,
    start_date: req.body.startDate ?? existing.start_date,
    end_date: req.body.endDate ?? existing.end_date,
    description: req.body.description ?? existing.description,
    cover: req.body.cover ?? existing.cover,
    budget: req.body.budget != null ? Number(req.body.budget) : existing.budget,
    currency: req.body.currency ?? existing.currency
  };
  next.status = tripStatus(next.start_date, next.end_date);
  db.prepare(`
    UPDATE trips SET name=?, start_date=?, end_date=?, description=?, cover=?, status=?, budget=?, currency=?
    WHERE id=?
  `).run(next.name, next.start_date, next.end_date, next.description, next.cover, next.status, next.budget, next.currency, existing.id);
  res.json({ success: true, trip: hydrateTrip(db.prepare('SELECT * FROM trips WHERE id = ?').get(existing.id)) });
};

exports.remove = (req, res) => {
  const existing = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Trip not found' });
  db.prepare('DELETE FROM trips WHERE id = ?').run(existing.id);
  res.json({ success: true });
};

exports.cloneTrip = (req, res) => {
  const original = db.prepare('SELECT * FROM trips WHERE share_slug = ? OR id = ?').get(req.params.slugOrId, req.params.slugOrId);
  if (!original) return res.status(404).json({ success: false, message: 'Trip to clone was not found' });

  const newSlug = generateSlug();
  const tripInfo = db.prepare(`
    INSERT INTO trips (user_id, name, start_date, end_date, description, cover, status, budget, currency, share_slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    `${original.name} (Copy)`,
    original.start_date,
    original.end_date,
    original.description,
    original.cover,
    original.status,
    original.budget,
    original.currency,
    newSlug
  );
  const newTripId = tripInfo.lastInsertRowid;

  const originalExpenses = db.prepare('SELECT * FROM expenses WHERE trip_id = ?').get(original.id) || {
    transport: 0, stay: 0, activities: 0, food: 0, misc: 0
  };
  db.prepare(`
    INSERT INTO expenses (trip_id, transport, stay, activities, food, misc)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(newTripId, originalExpenses.transport, originalExpenses.stay, originalExpenses.activities, originalExpenses.food, originalExpenses.misc);

  const stops = db.prepare('SELECT * FROM stops WHERE trip_id = ? ORDER BY sort_order, id').all(original.id);
  for (const s of stops) {
    const stopInfo = db.prepare(`
      INSERT INTO stops (trip_id, city_id, title, section_type, start_date, end_date, budget, notes, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newTripId, s.city_id, s.title, s.section_type, s.start_date, s.end_date, s.budget, s.notes, s.sort_order);
    const newStopId = stopInfo.lastInsertRowid;

    const acts = db.prepare('SELECT * FROM stop_activities WHERE stop_id = ?').all(s.id);
    for (const a of acts) {
      db.prepare(`
        INSERT INTO stop_activities (stop_id, activity_id, name, time, cost, type, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(newStopId, a.activity_id, a.name, a.time, a.cost, a.type, a.notes);
    }
  }

  const cloned = hydrateTrip(db.prepare('SELECT * FROM trips WHERE id = ?').get(newTripId));
  res.status(201).json({ success: true, trip: cloned, message: 'Trip successfully cloned to your account' });
};

exports.hydrateTrip = hydrateTrip;
