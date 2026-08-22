const db = require('../config/db');

exports.list = (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const country = req.query.country;
  const region = req.query.region;
  const sort = req.query.sort || 'name';

  let sql = 'SELECT * FROM cities WHERE 1=1';
  const params = [];
  if (q) {
    sql += ' AND (lower(name) LIKE ? OR lower(country) LIKE ? OR lower(description) LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (country) {
    sql += ' AND country = ?';
    params.push(country);
  }
  if (region) {
    sql += ' AND region = ?';
    params.push(region);
  }
  if (sort === 'cost') sql += ' ORDER BY cost_index ASC, name';
  else if (sort === 'popular') sql += ' ORDER BY popular DESC, name';
  else sql += ' ORDER BY name';

  const cities = db.prepare(sql).all(...params);
  res.json({ success: true, cities });
};

exports.countries = (_req, res) => {
  const rows = db.prepare('SELECT DISTINCT country, region FROM cities ORDER BY country').all();
  res.json({ success: true, countries: rows });
};
