const db = require('../config/db');

exports.list = (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const type = req.query.type;
  const city = req.query.city;
  const sort = req.query.sort || 'name';

  let sql = `
    SELECT a.*, c.name AS city_name, c.country AS country
    FROM activities a
    JOIN cities c ON c.id = a.city_id
    WHERE 1=1
  `;
  const params = [];
  if (q) {
    sql += ' AND (lower(a.name) LIKE ? OR lower(c.name) LIKE ? OR lower(a.description) LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (type) {
    sql += ' AND a.type = ?';
    params.push(type);
  }
  if (city) {
    sql += ' AND c.name = ?';
    params.push(city);
  }
  if (sort === 'cost') sql += ' ORDER BY a.cost ASC';
  else if (sort === 'type') sql += ' ORDER BY a.type, a.name';
  else sql += ' ORDER BY a.name';

  const activities = db.prepare(sql).all(...params);
  res.json({ success: true, activities });
};
