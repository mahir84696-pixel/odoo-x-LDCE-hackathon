const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'globetrotter-hackathon-secret-change-me',
    { expiresIn: '7d' }
  );
}

function publicUser(row) {
  if (!row) return null;
  const { password, ...safe } = row;
  return safe;
}

exports.signup = (req, res) => {
  const { name, email, password, city, country, avatar } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) return res.status(409).json({ success: false, message: 'Email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO users (name, email, password, avatar, city, country)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name.trim(), normalizedEmail, hash, avatar || null, city || null, country || null);

  const user = publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid));
  res.status(201).json({ success: true, user, token: tokenFor(user) });
};

exports.login = (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  res.json({ success: true, user: publicUser(user), token: tokenFor(user) });
};

exports.me = (req, res) => {
  const user = publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id));
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
};
