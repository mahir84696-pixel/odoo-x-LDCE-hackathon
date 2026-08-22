(async function () {
  if (!UI.requireAuth()) return;
  await loadNavbar('dashboard.html');
  try {
    const { stats, trips, popular } = await API.get('/trips/dashboard');
    document.getElementById('userName').textContent = currentUser()?.name || 'Traveler';
    document.getElementById('statTrips').textContent = stats.totalTrips;
    document.getElementById('statCities').textContent = stats.cities;
    document.getElementById('statActs').textContent = stats.activities;
    document.getElementById('statBudget').textContent = UI.money(stats.totalBudget);

    const dest = document.getElementById('destinations');
    dest.innerHTML = popular.slice(0, 4).map((c) => `
      <article class="card" style="padding:0;overflow:hidden;cursor:pointer" onclick="location.href='city-search.html?q=${encodeURIComponent(c.name)}'">
        <img src="${c.image}" alt="${UI.escape(c.name)}" style="height:170px;width:100%;object-fit:cover">
        <div style="padding:12px 14px">
          <h4>${UI.escape(c.name)}</h4>
          <p style="color:var(--muted);font-size:0.85rem">${UI.escape(c.country)} · ${UI.money(c.cost_index)}/day</p>
        </div>
      </article>
    `).join('');

    const upcoming = trips.filter((t) => t.status === 'upcoming').slice(0, 3);
    const box = document.getElementById('recentTrips');
    if (!upcoming.length) {
      box.innerHTML = `<div class="empty-state" style="grid-column:1/-1">No trips yet. Create one to see it here.</div>`;
    } else {
      box.innerHTML = upcoming.map(tripCard).join('');
    }
  } catch (err) {
    UI.toast(err.message, 'error');
  }
})();

function tripCard(t) {
  return `
    <article class="card trip-card">
      <div class="cover"><img src="${t.cover}" alt=""></div>
      <h4>${UI.escape(t.name)}</h4>
      <div class="trip-meta"><span>${UI.formatDate(t.start_date)}</span><span>${t.stops?.length || 0} sections</span></div>
      <a class="btn btn-sm btn-primary" href="itinerary-view.html?id=${t.id}">View</a>
    </article>
  `;
}
