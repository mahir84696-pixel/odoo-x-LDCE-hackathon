(async function () {
  if (!UI.requireAuth()) return;
  await loadNavbar('my-trips.html');
  const id = UI.qs('id');
  if (!id) return (location.href = 'my-trips.html');
  const data = await API.get(`/budget/${id}`);
  const trip = data.trip;
  document.getElementById('tripName').textContent = trip.name + ' budget';
  const e = data.expenses;
  ['transport', 'stay', 'activities', 'food', 'misc'].forEach((k) => {
    document.getElementById('exp' + k[0].toUpperCase() + k.slice(1)).value = e[k] || 0;
  });
  paint(data.summary, e, trip.budget, trip);
  document.getElementById('expenseForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const body = {
      transport: Number(document.getElementById('expTransport').value || 0),
      stay: Number(document.getElementById('expStay').value || 0),
      activities: Number(document.getElementById('expActivities').value || 0),
      food: Number(document.getElementById('expFood').value || 0),
      misc: Number(document.getElementById('expMisc').value || 0)
    };
    const res = await API.put(`/budget/${id}`, body);
    paint(res.summary, res.expenses, trip.budget, trip);
    UI.toast('Budget updated', 'success');
  });
})();

function paint(summary, e, budget, trip) {
  document.getElementById('budgetStats').innerHTML = [
    ['Transport', e.transport, 'trips'],
    ['Stay', e.stay, 'cities'],
    ['Activities', e.activities, 'acts'],
    ['Food', e.food, 'budget'],
    ['Total', summary.total, 'budget'],
    ['Remaining', Math.max(0, summary.remaining), 'cities']
  ].map(([label, val, cls]) => `
    <div class="kpi-card"><div class="kpi-icon ${cls}"></div><div><div class="kpi-value">${UI.money(val)}</div><div class="kpi-label">${label}</div></div></div>
  `).join('');
  const total = summary.total || 1;
  document.getElementById('breakdownChart').innerHTML = [
    ['Transport', e.transport],
    ['Stay', e.stay],
    ['Activities', e.activities],
    ['Food', e.food],
    ['Misc', e.misc]
  ].map(([label, val]) => `
    <p style="display:flex;justify-content:space-between"><span>${label}</span><span>${UI.money(val)}</span></p>
    <div class="progress-bar" style="margin:6px 0 12px"><div class="progress-fill" style="width:${Math.min(100, Math.round((val / total) * 100))}%"></div></div>
  `).join('') + `<p><strong>Remaining ${UI.money(budget - summary.total)}</strong></p>`;

  const warnings = (trip?.stops || []).map((stop, index) => {
    const spent = (stop.activities || []).reduce((sum, activity) => sum + Number(activity.cost || 0), 0);
    const limit = Number(stop.budget || 0);
    if (spent <= limit) return '';
    return `<div class="budget-warning">Day ${index + 1} is over budget by ${UI.money(spent - limit)}</div>`;
  }).join('');
  document.getElementById('dayWarnings').innerHTML = warnings;
}
