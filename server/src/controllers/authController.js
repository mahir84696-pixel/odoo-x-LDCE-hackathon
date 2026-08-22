const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'globetrotter-dev-secret';

function publicUser(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    country: row.country,
    additionalInfo: row.additional_info,
    photoUrl: row.photo_url
  };
}

function saveProfilePhoto(photoData, userId) {
  if (!photoData || typeof photoData !== 'string') return null;
  const match = photoData.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) return null;

  const ext = match[2].toLowerCase() === 'jpeg' || match[2].toLowerCase() === 'jpg' ? 'jpg' : match[2].toLowerCase();
  const buffer = Buffer.from(match[3], 'base64');
  if (buffer.length > 2 * 1024 * 1024) {
    throw new Error('Photo must be 2 MB or smaller.');
  }

  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `user-${userId}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

exports.register = (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    city,
    country,
    additionalInfo,
    photo
  } = req.body || {};

  if (!firstName || !lastName || !email || !password || !phone || !city || !country) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(String(password), 10);
  const result = db.prepare(`
    INSERT INTO users (first_name, last_name, email, password_hash, phone, city, country, additional_info)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    firstName.trim(),
    lastName.trim(),
    email.trim().toLowerCase(),
    passwordHash,
    phone.trim(),
    city.trim(),
    country.trim(),
    additionalInfo ? String(additionalInfo).trim() : null
  );

  let photoUrl = null;
  try {
    photoUrl = saveProfilePhoto(photo, result.lastInsertRowid);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  if (photoUrl) {
    db.prepare('UPDATE users SET photo_url = ? WHERE id = ?').run(photoUrl, result.lastInsertRowid);
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({
    message: 'Account created.',
    user: publicUser(user)
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  return res.json({
    token: signToken(user.id),
    user: publicUser(user)
  });
};

exports.forgotPassword = (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (user) {
    const token = crypto.randomBytes(24).toString('hex');
    db.prepare('INSERT INTO password_resets (user_id, token) VALUES (?, ?)').run(user.id, token);
  }

  return res.json({
    message: 'If an account exists for that email, a reset request has been saved.'
  });
};
