let currentTrip = null;
let searchQuery = '';
let filterPaid = 'all'; // 'all', 'free', 'paid'
let sortBy = 'time'; // 'time', 'cost'

(async function () {
  if (!UI.requireAuth()) return;
  await loadNavbar('my-trips.html');
  const id = UI.qs('id');
  if (!id) return (location.href = 'my-trips.html');

  try {
    const { trip } = await API.get(`/trips/${id}`);
    currentTrip = trip;

    document.getElementById('editBtn').href = `itinerary-builder.html?id=${id}`;
    document.getElementById('budgetBtn').href = `budget.html?id=${id}`;
    document.getElementById('tripName').textContent = trip.name;
    document.getElementById('tripDates').textContent = `📅 ${UI.formatDate(trip.start_date)} – ${UI.formatDate(trip.end_date)}`;
    document.getElementById('tripDesc').textContent = trip.description || 'Custom crafted itinerary with verified activities and sectional budgets.';
    document.getElementById('tripCover').src = trip.cover || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000';
    
    const tag = document.getElementById('tripStatusTag');
    if (tag) {
      tag.className = `tag ${trip.status || 'upcoming'}`;
      tag.textContent = (trip.status || 'Upcoming').toUpperCase();
    }

    renderFlowTimeline();
    renderBudgetOverview();

    // Toolbar Listeners
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderFlowTimeline();
    });

    document.getElementById('toolFilter')?.addEventListener('click', () => {
      filterPaid = filterPaid === 'all' ? 'paid' : filterPaid === 'paid' ? 'free' : 'all';
      UI.toast(`Showing ${filterPaid.toUpperCase()} activities`, 'info');
      renderFlowTimeline();
    });

    document.getElementById('toolSort')?.addEventListener('click', () => {
      sortBy = sortBy === 'time' ? 'cost' : 'time';
      UI.toast(`Sorted by ${sortBy.toUpperCase()}`, 'info');
      renderFlowTimeline();
    });

    document.getElementById('toolGroup')?.addEventListener('click', () => {
      UI.toast('Organized by Itinerary Leg / Day', 'info');
    });

    document.getElementById('shareBtn')?.addEventListener('click', async () => {
      try {
        const data = await API.post(`/trips/${id}/share`, {});
        const shareUrl = `${location.origin}/shared.html?slug=${data.shareSlug}`;
        await navigator.clipboard.writeText(shareUrl);
        UI.toast('Public itinerary link copied to clipboard! Anyone can view & clone it.', 'success');
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });

  } catch (err) {
    UI.toast(err.message, 'error');
  }
})();

function renderFlowTimeline() {
  const timeline = document.getElementById('timeline');
  if (!timeline || !currentTrip) return;

  const stops = currentTrip.stops || [];
  document.getElementById('sectionCountTag').textContent = `${stops.length} Section${stops.length === 1 ? '' : 's'}`;

  if (!stops.length) {
    timeline.innerHTML = `
      <div class="empty-state">
        <div class="icon">✈️</div>
        <h3>No sections or activities planned yet</h3>
        <p style="margin:8px 0 16px">Add your first section (City Stay, Travel leg, or Hotel) in the builder to see your flow diagram.</p>
        <a class="btn btn-primary" href="itinerary-builder.html?id=${currentTrip.id}">Go to Builder</a>
      </div>
    `;
    return;
  }

  let html = '';

  stops.forEach((s, dayIdx) => {
    let activities = s.activities || [];

    // Apply search filter
    if (searchQuery) {
      activities = activities.filter(a => 
        a.name.toLowerCase().includes(searchQuery) ||
        (s.title || '').toLowerCase().includes(searchQuery) ||
        (s.city || '').toLowerCase().includes(searchQuery)
      );
    }

    // Apply free/paid filter
    if (filterPaid === 'free') {
      activities = activities.filter(a => Number(a.cost || 0) === 0);
    } else if (filterPaid === 'paid') {
      activities = activities.filter(a => Number(a.cost || 0) > 0);
    }

    // Apply sorting
    activities.sort((a, b) => {
      if (sortBy === 'cost') return (b.cost || 0) - (a.cost || 0);
      return (a.time || '').localeCompare(b.time || '');
    });

    const dayNumber = dayIdx + 1;
    const legTitle = s.title || s.city || `Day ${dayNumber} Exploration`;
    const dateRange = s.start_date ? `${UI.formatDate(s.start_date)} – ${UI.formatDate(s.end_date || s.start_date)}` : '';
    const sectionBudget = Number(s.budget || 0);

    html += `
      <div class="flow-day-container">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;flex-wrap:wrap;gap:8px">
          <div>
            <span class="day-badge-title">Day ${dayNumber} · ${UI.escape(s.section_type || 'city').toUpperCase()}</span>
            <h3 style="font-size:1.4rem;color:var(--text);margin-top:4px">${UI.escape(legTitle)}</h3>
            <p style="font-size:0.88rem;color:var(--muted)">${dateRange} ${s.notes ? `· ${UI.escape(s.notes)}` : ''}</p>
          </div>
          <div style="text-align:right">
            <span class="tag budget">Leg Budget: ${UI.money(sectionBudget)}</span>
          </div>
        </div>

        <!-- Wireframe Column Headers -->
        <div class="flow-headers">
          <div>Physical Activity Flow</div>
          <div style="text-align:right">Expense</div>
        </div>
    `;

    if (!activities.length) {
      html += `
        <div style="padding:16px;background:var(--bg);border-radius:var(--radius-sm);color:var(--muted);text-align:center">
          No activities scheduled for this day yet. <a href="activity-search.html?trip=${currentTrip.id}&stop=${s.id}">Add an activity</a>
        </div>
      `;
    } else {
      activities.forEach((act, actIdx) => {
        html += `
          <div class="flow-node-row">
            <div class="flow-node-activity">
              <span class="tag ${act.type || 'sightseeing'}" style="min-width:70px;text-align:center">${act.time || '09:00'}</span>
              <div style="flex:1">
                <h4 style="font-size:1.05rem;margin-bottom:2px">${UI.escape(act.name)}</h4>
                <p style="font-size:0.84rem;color:var(--muted)">${UI.escape(act.type || 'Activity')} ${act.notes ? `· ${UI.escape(act.notes)}` : ''}</p>
              </div>
            </div>
            <div class="flow-node-expense">
              <span>${Number(act.cost || 0) === 0 ? 'FREE' : UI.money(act.cost)}</span>
            </div>
          </div>
        `;

        // Downward Flow Connecting Arrow (if not the last activity)
        if (actIdx < activities.length - 1) {
          html += `
            <div style="grid-column:1/-1;text-align:center;padding:2px 0">
              <div class="flow-connector-arrow">↓</div>
            </div>
          `;
        }
      });
    }

    html += `</div>`;
  });

  timeline.innerHTML = html;
}

function renderBudgetOverview() {
  const b = currentTrip.budgetSummary || { total: 0, remaining: currentTrip.budget || 0 };
  const totalBudget = Number(currentTrip.budget || 0);
  const spent = Number(b.total || 0);
  const remaining = totalBudget - spent;
  const pct = totalBudget > 0 ? Math.min(100, Math.round((spent / totalBudget) * 100)) : 0;

  document.getElementById('budgetOverview').innerHTML = `
    <h3 style="font-size:1.3rem;margin-bottom:1rem">Budget & Expense Breakdown</h3>
    <div class="grid grid-3" style="margin-bottom:1.2rem">
      <div class="kpi-card" style="padding:1rem;box-shadow:none;border:1.5px solid var(--line)">
        <div class="kpi-icon budget">₹</div>
        <div>
          <div class="kpi-value">${UI.money(totalBudget)}</div>
          <div class="kpi-label">Target Budget</div>
        </div>
      </div>
      <div class="kpi-card" style="padding:1rem;box-shadow:none;border:1.5px solid var(--line)">
        <div class="kpi-icon acts">◎</div>
        <div>
          <div class="kpi-value" style="color:var(--danger)">${UI.money(spent)}</div>
          <div class="kpi-label">Total Spent</div>
        </div>
      </div>
      <div class="kpi-card" style="padding:1rem;box-shadow:none;border:1.5px solid var(--line)">
        <div class="kpi-icon trips">✓</div>
        <div>
          <div class="kpi-value" style="color:var(--success)">${UI.money(remaining)}</div>
          <div class="kpi-label">Remaining</div>
        </div>
      </div>
    </div>
    <div style="margin-top:0.8rem">
      <div style="display:flex;justify-content:space-between;font-size:0.88rem;font-weight:700;margin-bottom:6px">
        <span>Budget Utilization</span>
        <span>${pct}%</span>
      </div>
      <div class="progress-bar" style="height:12px">
        <div class="progress-fill" style="width:${pct}%;background:${pct > 100 ? 'var(--danger)' : 'linear-gradient(90deg, var(--primary), var(--primary-light))'}"></div>
      </div>
    </div>
  `;
}
