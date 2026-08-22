const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const projectRoot = path.resolve(__dirname, '../../..');
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(projectRoot, process.env.DATABASE_PATH)
  : path.join(projectRoot, 'server', 'database', 'globetrotter.db');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Checkpoint WAL on startup so SQLite Viewer extensions can see all data
db.pragma('wal_checkpoint(TRUNCATE)');

// Flush WAL to main db file on graceful shutdown
process.on('exit', () => { try { db.pragma('wal_checkpoint(TRUNCATE)'); db.close(); } catch {} });
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar TEXT,
    city TEXT,
    country TEXT,
    language TEXT DEFAULT 'en',
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT,
    cost_index INTEGER DEFAULT 50,
    image TEXT,
    description TEXT,
    popular INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'sightseeing',
    cost REAL DEFAULT 0,
    duration TEXT,
    image TEXT,
    description TEXT,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    description TEXT,
    cover TEXT,
    status TEXT DEFAULT 'upcoming',
    budget REAL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    share_slug TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    city_id INTEGER,
    title TEXT,
    section_type TEXT DEFAULT 'city',
    start_date TEXT,
    end_date TEXT,
    budget REAL DEFAULT 0,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS stop_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stop_id INTEGER NOT NULL,
    activity_id INTEGER,
    name TEXT,
    time TEXT,
    cost REAL DEFAULT 0,
    type TEXT,
    notes TEXT,
    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    trip_id INTEGER PRIMARY KEY,
    transport REAL DEFAULT 0,
    stay REAL DEFAULT 0,
    activities REAL DEFAULT 0,
    food REAL DEFAULT 0,
    misc REAL DEFAULT 0,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );
`);

db.prepare("UPDATE trips SET currency = 'INR' WHERE currency IS NULL OR currency = 'USD'").run();

db.databasePath = dbPath;
module.exports = db;
