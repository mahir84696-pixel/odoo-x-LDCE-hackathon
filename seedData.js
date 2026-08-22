require('../config/db');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const cities = [
  ['Delhi', 'India', 'Asia', 35, 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800', 'Capital city with Mughal history and vibrant street life', 1],
  ['Jaipur', 'India', 'Asia', 30, 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800', 'The Pink City known for palaces and forts', 1],
  ['Agra', 'India', 'Asia', 28, 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800', 'Home of the Taj Mahal and Agra Fort', 1],
  ['Goa', 'India', 'Asia', 40, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800', 'Beaches, Portuguese heritage and nightlife', 1],
  ['Varanasi', 'India', 'Asia', 20, 'https://images.unsplash.com/photo-1561361058-4b47f19e2c7e?w=800', 'Spiritual city on the Ganges', 0],
  ['Bali', 'Indonesia', 'Asia', 40, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'Temples, beaches and rice terraces', 1],
  ['Jakarta', 'Indonesia', 'Asia', 38, 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800', 'Modern capital mixed with tradition', 0],
  ['Yogyakarta', 'Indonesia', 'Asia', 25, 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800', 'Cultural heart of Java and Borobudur', 1],
  ['Lombok', 'Indonesia', 'Asia', 35, 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800', 'Quiet beaches and Mount Rinjani', 0],
  ['Kathmandu', 'Nepal', 'Asia', 25, 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'Gateway to the Himalayas', 1],
  ['Pokhara', 'Nepal', 'Asia', 22, 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800', 'Lakeside city under Annapurna', 1],
  ['Chitwan', 'Nepal', 'Asia', 30, 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800', 'Wildlife safari in national parks', 0],
  ['Sydney', 'Australia', 'Oceania', 85, 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800', 'Harbour city with Opera House and Bondi', 1],
  ['Melbourne', 'Australia', 'Oceania', 80, 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800', 'Coffee, art and laneways', 1],
  ['Cairns', 'Australia', 'Oceania', 75, 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800', 'Gateway to the Great Barrier Reef', 1],
  ['Gold Coast', 'Australia', 'Oceania', 70, 'https://images.unsplash.com/photo-1575351881846-7d5f5973f015?w=800', 'Surf beaches and theme parks', 0],
  ['Perth', 'Australia', 'Oceania', 78, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', 'Sunny beaches and nearby wine country', 0],
  ['Bangkok', 'Thailand', 'Asia', 45, 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800', 'Temples, street food and markets', 1],
  ['Phuket', 'Thailand', 'Asia', 50, 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800', 'Tropical beaches and island hops', 1],
  ['Tokyo', 'Japan', 'Asia', 90, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'Modern city with deep tradition', 1],
  ['Kyoto', 'Japan', 'Asia', 75, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', 'Temples and historic districts', 1],
  ['Singapore', 'Singapore', 'Asia', 95, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800', 'Garden city with world-class food', 1],
  ['Dubai', 'UAE', 'Middle East', 100, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'Desert metropolis and skyline views', 1]
];

const activities = [
  ['Agra', 'Taj Mahal Sunrise Tour', 'sightseeing', 20, '3h', 'Watch sunrise over the marble mausoleum'],
  ['Jaipur', 'Hawa Mahal Photography Walk', 'sightseeing', 5, '2h', 'Photograph the Palace of Winds'],
  ['Delhi', 'Old Delhi Food Tour', 'food', 30, '4h', 'Street food in Chandni Chowk'],
  ['Jaipur', 'Amber Fort Visit', 'adventure', 25, '3h', 'Hilltop fort and palace courtyards'],
  ['Goa', 'Goa Beach Hopping', 'relaxation', 15, '6h', 'Beaches from Baga to Palolem'],
  ['Varanasi', 'Ganga Aarti Ceremony', 'sightseeing', 0, '2h', 'Evening ritual on the river'],
  ['Bali', 'Tegallalang Rice Terrace', 'sightseeing', 5, '2h', 'Walk through rice paddies'],
  ['Bali', 'Ulun Danu Temple Visit', 'sightseeing', 10, '2h', 'Temple on Lake Beratan'],
  ['Bali', 'Mount Batur Sunrise Trek', 'adventure', 45, '6h', 'Volcano hike at dawn'],
  ['Yogyakarta', 'Borobudur Temple Sunrise', 'sightseeing', 25, '4h', 'Largest Buddhist temple at dawn'],
  ['Kathmandu', 'Everest Scenic Flight', 'adventure', 200, '1h', 'Fly near Everest and the Himalayas'],
  ['Pokhara', 'Phewa Lake Boating', 'relaxation', 15, '2h', 'Boat ride with mountain views'],
  ['Pokhara', 'Annapurna Base Camp Trek', 'adventure', 500, '7d', 'Multi-day trek to Annapurna'],
  ['Chitwan', 'Chitwan Jungle Safari', 'adventure', 80, '1d', 'Wildlife safari in the park'],
  ['Sydney', 'Sydney Opera House Tour', 'sightseeing', 30, '1h', 'Guided tour of the Opera House'],
  ['Sydney', 'Harbour Bridge Climb', 'adventure', 150, '3h', 'Climb Sydney Harbour Bridge'],
  ['Cairns', 'Great Barrier Reef Dive', 'adventure', 200, '8h', 'Snorkel or dive the reef'],
  ['Melbourne', 'Great Ocean Road Trip', 'sightseeing', 80, '12h', 'Coastal drive to the Apostles'],
  ['Melbourne', 'Melbourne Coffee Tour', 'food', 40, '3h', 'Laneway cafes and coffee'],
  ['Gold Coast', 'Gold Coast Surf Lesson', 'adventure', 60, '2h', 'Learn to surf'],
  ['Bangkok', 'Grand Palace Visit', 'sightseeing', 15, '3h', 'Royal palace complex'],
  ['Phuket', 'Phi Phi Islands Boat Tour', 'adventure', 50, '8h', 'Island hopping including Maya Bay'],
  ['Bangkok', 'Thai Cooking Class', 'food', 35, '4h', 'Cook Pad Thai and curries'],
  ['Tokyo', 'Shibuya Crossing Walk', 'sightseeing', 0, '1h', 'World-famous pedestrian crossing'],
  ['Kyoto', 'Fushimi Inari Shrine Hike', 'sightseeing', 0, '3h', 'Thousands of torii gates'],
  ['Singapore', 'Gardens by the Bay', 'sightseeing', 20, '3h', 'Supertrees and cloud forest'],
  ['Dubai', 'Burj Khalifa Observation', 'sightseeing', 40, '2h', 'Views from the tallest building'],
  ['Dubai', 'Desert Safari Dune Bashing', 'adventure', 70, '6h', '4x4 ride over sand dunes']
];

function seed() {
  const cityCount = db.prepare('SELECT COUNT(*) AS n FROM cities').get().n;
  if (cityCount === 0) {
    const insertCity = db.prepare(`
      INSERT INTO cities (name, country, region, cost_index, image, description, popular)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAll = db.transaction(() => {
      cities.forEach((c) => insertCity.run(...c));
    });
    insertAll();
  }

  const actCount = db.prepare('SELECT COUNT(*) AS n FROM activities').get().n;
  if (actCount === 0) {
    const insertAct = db.prepare(`
      INSERT INTO activities (city_id, name, type, cost, duration, image, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAll = db.transaction(() => {
      activities.forEach(([cityName, name, type, cost, duration, description]) => {
        const city = db.prepare('SELECT id, image FROM cities WHERE name = ?').get(cityName);
        if (city) insertAct.run(city.id, name, type, cost, duration, city.image, description);
      });
    });
    insertAll();
  }

  let admin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@globetrotter.com');
  if (!admin) {
    const info = db.prepare(`
      INSERT INTO users (name, email, password, city, country, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Admin Guide', 'admin@globetrotter.com', bcrypt.hashSync('admin123', 10), 'Mumbai', 'India', 'admin');
    admin = { id: info.lastInsertRowid };
  }

  // Seed sample shared community trips if none exist
  const tripCount = db.prepare('SELECT COUNT(*) AS n FROM trips').get().n;
  if (tripCount === 0) {
    const today = new Date();
    const start1 = new Date(today.getTime() + 10 * 86400000).toISOString().slice(0, 10);
    const end1 = new Date(today.getTime() + 18 * 86400000).toISOString().slice(0, 10);

    const trip1 = db.prepare(`
      INSERT INTO trips (user_id, name, start_date, end_date, description, cover, status, budget, currency, share_slug)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      admin.id,
      'Golden Triangle Heritage Expedition',
      start1,
      end1,
      'Comprehensive 8-day route exploring Delhi, Agra, and Jaipur with historical landmarks and authentic cuisine.',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1000',
      'upcoming',
      1200,
      'USD',
      'golden-triangle-heritage'
    );

    const t1Id = trip1.lastInsertRowid;
    db.prepare('INSERT INTO expenses (trip_id, transport, stay, activities, food, misc) VALUES (?, ?, ?, ?, ?, ?)')
      .run(t1Id, 250, 450, 180, 220, 80);

    const delhi = db.prepare('SELECT id FROM cities WHERE name = ?').get('Delhi');
    const agra = db.prepare('SELECT id FROM cities WHERE name = ?').get('Agra');
    const jaipur = db.prepare('SELECT id FROM cities WHERE name = ?').get('Jaipur');

    if (delhi) {
      const s1 = db.prepare(`INSERT INTO stops (trip_id, city_id, title, section_type, start_date, end_date, budget, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(t1Id, delhi.id, 'Old & New Delhi Exploration', 'city', start1, start1, 300, 'Arrival and culinary trail', 1);
      const foodTour = db.prepare('SELECT id FROM activities WHERE name LIKE ?').get('%Food Tour%');
      if (foodTour) db.prepare(`INSERT INTO stop_activities (stop_id, activity_id, name, time, cost, type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(s1.lastInsertRowid, foodTour.id, 'Old Delhi Food Tour', '16:00', 30, 'food', 'Chandni Chowk street specialties');
    }

    if (agra) {
      const s2 = db.prepare(`INSERT INTO stops (trip_id, city_id, title, section_type, start_date, end_date, budget, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(t1Id, agra.id, 'Wonders of Agra', 'city', end1, end1, 350, 'Taj Mahal sunrise visit', 2);
      const taj = db.prepare('SELECT id FROM activities WHERE name LIKE ?').get('%Taj Mahal%');
      if (taj) db.prepare(`INSERT INTO stop_activities (stop_id, activity_id, name, time, cost, type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(s2.lastInsertRowid, taj.id, 'Taj Mahal Sunrise Tour', '06:00', 20, 'sightseeing', 'Private guided entry at sunrise');
    }

    if (jaipur) {
      const s3 = db.prepare(`INSERT INTO stops (trip_id, city_id, title, section_type, start_date, end_date, budget, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(t1Id, jaipur.id, 'Royal Jaipur & Palaces', 'city', end1, end1, 400, 'Pink city forts and bazaars', 3);
      const amber = db.prepare('SELECT id FROM activities WHERE name LIKE ?').get('%Amber Fort%');
      if (amber) db.prepare(`INSERT INTO stop_activities (stop_id, activity_id, name, time, cost, type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(s3.lastInsertRowid, amber.id, 'Amber Fort Visit', '10:00', 25, 'adventure', 'Palace courtyards tour');
    }
  }
}

if (require.main === module) {
  seed();
  console.log('Seed complete. Admin login: admin@globetrotter.com / admin123');
}

module.exports = seed;
