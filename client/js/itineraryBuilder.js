let trip = null;
let cities = [];

(async function () {
  if (!UI.requireAuth()) return;
  await loadNavbar('my-trips.html');
  const id = UI.qs('id');
  if (!id) return (location.href = 'my-trips.html');

  try {
    const cityData = await API.get('/cities');
    cities = cityData.cities || [];
    const citySelect = document.getElementById('stopCity');
    if (citySelect) {
      citySelect.innerHTML = cities.map((c) => `<option value="${c.id}">${c.name}, ${c.country}</option>`).join('');
    }
    await refresh();
  } catch (err) {
    UI.toast(err.message, 'error');
  }

  document.getElementById('addSection')?.addEventListener('click', addSection);
  document.getElementById('saveDetails')?.addEventListener('click', saveDetails);
  document.getElementById('bigAddSectionBtn')?.addEventListener('click', () => {
    document.getElementById('sectionTitle')?.focus();
    UI.toast('Enter section details on the sidebar and click Add Section', 'info');
  });
})();

async function refresh() {
  const id = UI.qs('id');
  const data = await API.get(`/trips/${id}`);
  trip = data.trip;

  document.getElementById('tripTitle').textContent = trip.name;
  document.getElementById('tripDates').textContent = `📅 ${UI.formatDate(trip.start_date)} to ${UI.formatDate(trip.end_date)} · Target Budget: ${UI.money(trip.budget)}`;
  document.getElementById('editName').value = trip.name || '';
  document.getElementById('editBudget').value = trip.budget || 0;
  
  if (!document.getElementById('stopStart').value && trip.start_date) {
    document.getElementById('stopStart').value = trip.start_date;
  }
  if (!document.getElementById('stopEnd').value && trip.end_date) {
    document.getElementById('stopEnd').value = trip.end_date;
  }

  document.getElementById('previewLink').href = `itinerary-view.html?id=${trip.id}`;
  document.getElementById('budgetLink').href = `budget.html?id=${trip.id}`;
  renderSections();
}

function renderSections() {
  const box = document.getElementById('stopsContainer');
  if (!box) return;

  if (!trip.stops || !trip.stops.length) {
    box.innerHTML = `
      <div class="empty-state">
        <div class="icon">🗺️</div>
        <h3>No sections in this itinerary yet</h3>
        <p style="margin-top:6px">Use the sidebar to add your first itinerary section.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = trip.stops.map((s, i) => {
    const activities = s.activities || [];
    const sectionTypeFormatted = (s.section_type || 'other').toUpperCase();
    const startDateText = s.start_date ? UI.formatDate(s.start_date) : 'Start date';
    const endDateText = s.end_date ? UI.formatDate(s.end_date) : 'End date';

    return `
      <article class="section-wireframe-card" id="section-${s.id}">
        <div class="section-card-header">
          <div>
            <div class="section-num-badge">Section ${i + 1}: ${sectionTypeFormatted}</div>
            <h3 style="font-size:1.45rem;color:var(--text);margin-top:2px">${UI.escape(s.title || s.city || 'Untitled Section')}</h3>
          </div>
          <button class="btn btn-sm btn-danger" onclick="removeStop(${s.id})" title="Delete this section">✕ Delete Section</button>
        </div>

        ${s.notes ? `<p class="section-desc-note">${UI.escape(s.notes)}</p>` : ''}

        <!-- Two Wireframe Meta Boxes -->
        <div class="wireframe-meta-row">
          <div class="wireframe-meta-cell">
            <span style="color:var(--muted)">Date Range:</span>
            <strong>${startDateText} to ${endDateText}</strong>
          </div>
          <div class="wireframe-meta-cell">
            <label style="color:var(--muted)" for="section-budget-${s.id}">Budget of this section (INR):</label>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
              <input class="form-input section-budget-input" id="section-budget-${s.id}" type="number" min="0" step="1" value="${Number(s.budget || 0)}" aria-label="Section budget">
              <button class="btn btn-sm btn-secondary" type="button" onclick="saveSectionBudget(${s.id})">Save</button>
            </div>
          </div>
        </div>

        <!-- Activities Sub-list -->
        <div style="margin-top:1.2rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h5 style="font-size:0.95rem;text-transform:uppercase;letter-spacing:0.04em;color:var(--muted)">Assigned Activities (${activities.length})</h5>
            <a class="btn btn-sm btn-secondary" href="activity-search.html?trip=${trip.id}&stop=${s.id}&city=${encodeURIComponent(s.city || '')}">+ Add Activity</a>
          </div>

          ${activities.length ? activities.map((a) => `
            <div class="activity-row">
              <strong style="min-width:60px;color:var(--primary)">${a.time || '09:00'}</strong>
              <div style="flex:1">
                <span style="font-weight:600">${UI.escape(a.name)}</span>
                ${a.notes ? `<p style="font-size:0.82rem;color:var(--muted)">${UI.escape(a.notes)}</p>` : ''}
              </div>
              <span class="cost">${UI.money(a.cost)}</span>
              <button class="btn btn-sm btn-ghost" style="padding:4px 10px;font-size:0.78rem" onclick="removeAct(${a.id})">Remove</button>
            </div>
          `).join('') : `
            <div style="padding:14px;background:var(--bg);border-radius:var(--radius-sm);text-align:center;color:var(--muted);font-size:0.9rem">
              No activities added to this section yet. Click "+ Add Activity" to attach from catalog.
            </div>
          `}
        </div>
      </article>
    `;
  }).join('');
}

async function addSection() {
  try {
    const cityId = Number(document.getElementById('stopCity').value);
    const sectionType = document.getElementById('sectionType').value;
    const title = document.getElementById('sectionTitle').value.trim();
    const notes = document.getElementById('sectionNotes').value.trim();
    const startDate = document.getElementById('stopStart').value;
    const endDate = document.getElementById('stopEnd').value;
    const budget = Number(document.getElementById('sectionBudget').value || 0);

    const selectedCity = cities.find(c => c.id === cityId);
    const finalTitle = title || (selectedCity ? `${selectedCity.name} Stay` : 'Trip Section');

    await API.post(`/trips/${trip.id}/stops`, {
      cityId,
      sectionType,
      title: finalTitle,
      notes,
      startDate,
      endDate,
      budget
    });

    UI.toast('Section added successfully', 'success');
    document.getElementById('sectionTitle').value = '';
    document.getElementById('sectionNotes').value = '';
    await refresh();
  } catch (err) {
    UI.toast(err.message, 'error');
  }
}

async function saveDetails() {
  try {
    const name = document.getElementById('editName').value.trim();
    const budget = Number(document.getElementById('editBudget').value || 0);
    if (!name) return UI.toast('Trip name is required', 'error');

    await API.put(`/trips/${trip.id}`, { name, budget });
    UI.toast('Trip settings updated', 'success');
    await refresh();
  } catch (err) {
    UI.toast(err.message, 'error');
  }
}

async function saveSectionBudget(id) {
  const input = document.getElementById(`section-budget-${id}`);
  try {
    await API.put(`/trips/stops/${id}`, { budget: Number(input?.value || 0) });
    UI.toast('Section budget updated', 'success');
    await refresh();
  } catch (err) {
    UI.toast(err.message, 'error');
  }
}

async function removeStop(id) {
  if (!confirm('Are you sure you want to delete this entire section and its activities?')) return;
  try {
    await API.delete(`/trips/stops/${id}`);
    UI.toast('Section deleted', 'info');
    await refresh();
  } catch (err) {
    UI.toast(err.message, 'error');
  }
}

async function removeAct(id) {
  try {
    await API.delete(`/trips/activities/${id}`);
    UI.toast('Activity removed', 'info');
    await refresh();
  } catch (err) {
    UI.toast(err.message, 'error');
  }
}
