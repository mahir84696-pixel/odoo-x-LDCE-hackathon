let acts = [];

(async function () {
  if (!UI.requireAuth()) return;
  await loadNavbar('activity-search.html');
  const backToTrip = document.getElementById('backToTrip');
  if (backToTrip && UI.qs('trip')) backToTrip.href = `itinerary-builder.html?id=${encodeURIComponent(UI.qs('trip'))}`;
  const trips = await API.get('/trips');
  const sel = document.getElementById('tripSelect');
  sel.innerHTML = '<option value="">Add to trip…</option>' + trips.trips.map((t) => `<option value="${t.id}">${UI.escape(t.name)}</option>`).join('');
  if (UI.qs('trip')) sel.value = UI.qs('trip');
  document.getElementById('searchInput').value = UI.qs('q') || '';
  await load();
  document.getElementById('searchInput').addEventListener('input', load);
  document.getElementById('typeFilter').addEventListener('change', load);
  document.querySelector('[data-tool="sort"]').addEventListener('click', () => load('cost'));
  document.querySelector('[data-tool="group"]').addEventListener('click', () => load('type'));
  document.querySelector('[data-tool="filter"]').addEventListener('click', () => document.getElementById('typeFilter').focus());
})();

async function load(sort) {
  const q = document.getElementById('searchInput').value;
  const type = document.getElementById('typeFilter').value;
  const city = UI.qs('city') || '';
  const data = await API.get(`/activities?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&city=${encodeURIComponent(city)}&sort=${sort || 'name'}`);
  acts = data.activities;
  const el = document.getElementById('activitiesList');
  el.innerHTML = acts.length ? acts.map((a) => `
    <article class="card">
      <img src="${a.image}" alt="" style="height:160px;width:100%;object-fit:cover;border-radius:12px;margin-bottom:8px">
      <span class="tag">${a.type}</span>
      <h4 style="margin-top:8px">${UI.escape(a.name)}</h4>
      <p style="color:var(--muted)">${UI.escape(a.city_name)}, ${UI.escape(a.country)} · ${UI.escape(a.duration)}</p>
      <p style="margin:8px 0">${UI.escape(a.description)}</p>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${UI.money(a.cost)}</strong>
        <button class="btn btn-sm btn-primary" onclick="addAct(${a.id})">Add</button>
      </div>
    </article>
  `).join('') : '<div class="empty-state" style="grid-column:1/-1">No activities found.</div>';
}

async function addAct(id) {
  const tripId = document.getElementById('tripSelect').value;
  if (!tripId) return UI.toast('Choose a trip first', 'error');
  const act = acts.find((a) => a.id === id);
  const { trip } = await API.get(`/trips/${tripId}`);
  let stop = trip.stops.find((s) => s.city === act.city_name);
  if (!stop) {
    const created = await API.post(`/trips/${tripId}/stops`, {
      cityId: act.city_id,
      sectionType: 'activity',
      title: act.city_name,
      startDate: trip.start_date,
      endDate: trip.end_date
    });
    stop = created.trip.stops.find((s) => s.city_id === act.city_id) || created.trip.stops.at(-1);
  }
  const stopId = UI.qs('stop') || stop.id;
  await API.post(`/trips/stops/${stopId}/activities`, { activityId: act.id });
  UI.toast(`Added ${act.name}`, 'success');
}
