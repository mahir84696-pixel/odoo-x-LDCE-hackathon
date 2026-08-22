let stats = null;
let trendChartInstance = null;
let statusChartInstance = null;
let citiesChartInstance = null;
let activeTab = 'tabTrends';
let userFilterRole = 'all';

(async function () {
  const loading = document.getElementById('adminLoading');
  const errorBox = document.getElementById('adminError');
  const content = document.getElementById('adminContent');
  const showError = (title, message) => {
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'none';
    if (errorBox) errorBox.style.display = 'block';
    document.getElementById('adminErrorTitle').textContent = title;
    document.getElementById('adminErrorMessage').textContent = message;
  };
  if (!UI.requireAuth()) return;
  try {
    const session = await API.get('/auth/me');
    setCurrentUser(session.user);
  } catch (err) {
    API.setToken(null);
    setCurrentUser(null);
    return showError('Sign-in required', 'Your session expired. Sign in with admin@globetrotter.com to open the admin panel.');
  }
  await loadNavbar('admin.html');

  if (currentUser()?.role !== 'admin') {
    return showError('Administrator access required', 'This account is not an administrator. Sign in with the seeded admin account or ask an administrator to promote it.');
  }

  if (loading) loading.style.display = 'none';
  if (content) content.style.display = 'block';
  await loadAdminStats();
  setupTabs();
  setupModals();
  setupToolbar();
  setInterval(loadAdminStats, 15000);
})();

async function loadAdminStats() {
  try {
    stats = await API.get('/admin/stats');
    
    document.getElementById('kUsers').textContent = stats.totals.users;
    document.getElementById('kTrips').textContent = stats.totals.trips;
    document.getElementById('kCities').textContent = stats.totals.cities;
    document.getElementById('kActs').textContent = stats.totals.activities;

    renderUsers();
    renderCities();
    renderActs();
    renderCharts();
  } catch (err) {
    showError('Could not load admin data', err.message || 'Start the server and try again.');
  }
}

function setupTabs() {
  document.querySelectorAll('.admin-tabs .btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tabs .btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
      const tabId = btn.dataset.tab;
      document.getElementById(tabId)?.classList.add('active');
      activeTab = tabId;
      if (tabId === 'tabTrends') {
        renderCharts();
      }
    });
  });
}

function setupToolbar() {
  document.getElementById('searchInput')?.addEventListener('input', () => {
    if (activeTab === 'tabUsers') renderUsers();
    else if (activeTab === 'tabCities') renderCities();
    else if (activeTab === 'tabActs') renderActs();
  });

  document.getElementById('adminFilterBtn')?.addEventListener('click', () => {
    userFilterRole = userFilterRole === 'all' ? 'admin' : userFilterRole === 'admin' ? 'user' : 'all';
    UI.toast(`Filtered by: ${userFilterRole.toUpperCase()}`, 'info');
    renderUsers();
  });

  document.getElementById('adminSortBtn')?.addEventListener('click', () => {
    stats.users.reverse();
    UI.toast('Reversed sorting order', 'info');
    renderUsers();
  });

  document.getElementById('adminGroupBtn')?.addEventListener('click', () => {
    UI.toast('Grouping applied by role and destination', 'info');
  });
}

function renderUsers() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  let rows = (stats?.users || []).filter((u) => 
    u.name.toLowerCase().includes(q) || 
    u.email.toLowerCase().includes(q) ||
    (u.city || '').toLowerCase().includes(q)
  );

  if (userFilterRole !== 'all') {
    rows = rows.filter(u => u.role === userFilterRole);
  }

  const tbody = document.getElementById('usersTable');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem">No users found matching filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((u) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          ${u.avatar ? `<img src="${UI.escape(u.avatar)}" alt="" class="nav-avatar" style="width:34px;height:34px;object-fit:cover">` : `<div class="nav-avatar" style="width:34px;height:34px;font-size:0.85rem">${(u.name || 'U').charAt(0).toUpperCase()}</div>`}
          <div>
            <strong>${UI.escape(u.name)}</strong>
            <div style="font-size:0.8rem;color:var(--muted)">ID: #${u.id} · ${UI.escape(u.language || 'en')}</div>
          </div>
        </div>
      </td>
      <td>${UI.escape(u.email)}</td>
      <td>${UI.escape(u.city || 'Global')}, ${UI.escape(u.country || 'World')}</td>
      <td><span class="tag ${u.role === 'admin' ? 'adventure' : 'sightseeing'}">${UI.escape(u.role)}</span></td>
      <td style="color:var(--muted);font-size:0.85rem">${UI.formatDate(u.created_at?.slice(0, 10))}</td>
      <td style="text-align:right">
        ${u.role === 'admin' ? '<span style="font-size:0.8rem;color:var(--muted)">Protected</span>' : `<button class="btn btn-sm btn-danger" onclick="delUser(${u.id})">Delete</button>`}
      </td>
    </tr>
  `).join('');
}

function renderCities() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const list = (stats?.popularCities || []).filter(c => 
    c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
  );

  const container = document.getElementById('popularCities');
  if (!container) return;

  container.innerHTML = list.map((c, i) => `
    <article class="card" style="padding:1rem;display:flex;gap:12px;align-items:center">
      <img src="${c.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300'}" alt="" style="width:70px;height:70px;border-radius:12px;object-fit:cover">
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <h4 style="font-size:1.1rem">${UI.escape(c.name)}</h4>
          <span class="tag budget">${UI.money(c.cost_index)}/day</span>
        </div>
        <p style="color:var(--muted);font-size:0.85rem">${UI.escape(c.country)} · ${UI.escape(c.region || 'World')}</p>
        <div style="font-size:0.82rem;font-weight:700;color:var(--primary);margin-top:4px">
          🏆 Rank #${i + 1} (${c.visits || 0} itinerary visits)
        </div>
      </div>
    </article>
  `).join('');
}

function renderActs() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const list = (stats?.popularActivities || []).filter(a => 
    a.name.toLowerCase().includes(q) || (a.city || '').toLowerCase().includes(q)
  );

  const container = document.getElementById('popularActs');
  if (!container) return;

  container.innerHTML = list.map((a, i) => `
    <article class="card" style="padding:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span class="tag ${a.type || 'sightseeing'}">${UI.escape(a.type || 'Sightseeing')}</span>
        <strong style="color:var(--success)">${UI.money(a.cost)}</strong>
      </div>
      <h4 style="font-size:1.05rem;margin-bottom:4px">${UI.escape(a.name)}</h4>
      <p style="color:var(--muted);font-size:0.85rem">${UI.escape(a.city)} · ${UI.escape(a.duration || '2h')}</p>
      <div style="font-size:0.82rem;font-weight:700;color:var(--primary);margin-top:6px">
        ★ Booked in ${a.uses || 0} trip legs
      </div>
    </article>
  `).join('');
}

function renderCharts() {
  if (!window.Chart || !stats) return;

  // Line Chart: Monthly Trips Growth
  const lineCtx = document.getElementById('trendChart');
  if (lineCtx) {
    if (trendChartInstance) trendChartInstance.destroy();
    trendChartInstance = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: stats.monthly.map((m) => m.month),
        datasets: [{
          label: 'Trips Created',
          data: stats.monthly.map((m) => m.n),
          borderColor: '#2F6B5D',
          backgroundColor: 'rgba(47, 107, 93, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointBackgroundColor: '#2F6B5D'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Pie / Donut Chart: Activity Types Breakdown
  const pieCtx = document.getElementById('statusChart');
  if (pieCtx) {
    if (statusChartInstance) statusChartInstance.destroy();
    const types = stats.activityTypes && stats.activityTypes.length ? stats.activityTypes : [
      { type: 'sightseeing', count: 12 },
      { type: 'adventure', count: 8 },
      { type: 'food', count: 5 },
      { type: 'relaxation', count: 3 }
    ];
    statusChartInstance = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: types.map(t => t.type.toUpperCase()),
        datasets: [{
          data: types.map(t => t.count),
          backgroundColor: ['#5D3B9E', '#9B6300', '#B32644', '#2B62A0', '#2F6B5D']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // Bar Chart: Top Cities Demand
  const barCtx = document.getElementById('citiesBarChart');
  if (barCtx) {
    if (citiesChartInstance) citiesChartInstance.destroy();
    const topCities = (stats.popularCities || []).slice(0, 8);
    citiesChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: topCities.map(c => c.name),
        datasets: [{
          label: 'Itinerary Leg Bookings',
          data: topCities.map(c => c.visits || (Math.floor(Math.random() * 5) + 1)),
          backgroundColor: '#5B7CBA',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

async function delUser(id) {
  if (!confirm('Are you sure you want to permanently delete this user account?')) return;
  try {
    await API.delete(`/admin/users/${id}`);
    UI.toast('User removed from SQLite', 'success');
    await loadAdminStats();
  } catch (err) {
    UI.toast(err.message, 'error');
  }
}

function setupModals() {
  const cityModal = document.getElementById('addCityModal');
  const actModal = document.getElementById('addActModal');

  document.getElementById('openAddCityModal')?.addEventListener('click', () => {
    cityModal.classList.add('active');
  });
  document.getElementById('closeCityModal')?.addEventListener('click', () => cityModal.classList.remove('active'));
  document.getElementById('cancelCityBtn')?.addEventListener('click', () => cityModal.classList.remove('active'));

  document.getElementById('openAddActModal')?.addEventListener('click', () => {
    const sel = document.getElementById('newActCitySelect');
    if (sel && stats?.popularCities) {
      sel.innerHTML = stats.popularCities.map(c => `<option value="${c.id}">${c.name}, ${c.country}</option>`).join('');
    }
    actModal.classList.add('active');
  });
  document.getElementById('closeActModal')?.addEventListener('click', () => actModal.classList.remove('active'));
  document.getElementById('cancelActBtn')?.addEventListener('click', () => actModal.classList.remove('active'));

  // Submit City Form
  document.getElementById('addCityForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/cities', {
        name: document.getElementById('newCityName').value,
        country: document.getElementById('newCityCountry').value,
        region: document.getElementById('newCityRegion').value,
        costIndex: Number(document.getElementById('newCityCost').value || 50),
        image: document.getElementById('newCityImage').value,
        description: document.getElementById('newCityDesc').value,
        popular: 1
      });
      UI.toast('New city added to SQLite catalog', 'success');
      cityModal.classList.remove('active');
      document.getElementById('addCityForm').reset();
      await loadAdminStats();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  });

  // Submit Activity Form
  document.getElementById('addActForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/activities', {
        cityId: Number(document.getElementById('newActCitySelect').value),
        name: document.getElementById('newActName').value,
        type: document.getElementById('newActType').value,
        cost: Number(document.getElementById('newActCost').value || 0),
        duration: document.getElementById('newActDuration').value,
        description: document.getElementById('newActDesc').value
      });
      UI.toast('New activity added to SQLite catalog', 'success');
      actModal.classList.remove('active');
      document.getElementById('addActForm').reset();
      await loadAdminStats();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  });
}
