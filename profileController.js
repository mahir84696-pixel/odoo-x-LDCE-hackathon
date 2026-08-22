const db = require('../config/db');

exports.get = (req, res) => {
  const user = db.prepare('SELECT id, name, email, avatar, city, country, language, role, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, user });
};

exports.update = (req, res) => {
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!current) return res.status(404).json({ success: false, message: 'User not found' });
  const { name, email, city, country, language, avatar } = req.body || {};
  if (email && email !== current.email) {
    const taken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(String(email).toLowerCase(), current.id);
    if (taken) return res.status(409).json({ success: false, message: 'Email already in use' });
  }
  db.prepare(`
    UPDATE users SET name=?, email=?, city=?, country=?, language=?, avatar=?
    WHERE id=?
  `).run(
    name ?? current.name,
    email ? String(email).toLowerCase() : current.email,
    city ?? current.city,
    country ?? current.country,
    language ?? current.language,
    avatar ?? current.avatar,
    current.id
  );
  const user = db.prepare('SELECT id, name, email, avatar, city, country, language, role, created_at FROM users WHERE id = ?').get(current.id);
  res.json({ success: true, user });
};

exports.remove = (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.json({ success: true });
};
