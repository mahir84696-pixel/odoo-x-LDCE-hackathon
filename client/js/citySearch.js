let cities = [];
let groupBy = 'none';
let sortBy = 'name';
let country = '';

(async function () {
  if (!UI.requireAuth()) return;
  await loadNavbar('city-search.html');
  document.getElementById('searchInput').value = UI.qs('q') || '';
  await load();
  document.getElementById('searchInput').addEventListener('input', load);
  document.querySelector('[data-tool="group"]').addEventListener('click', () => {
    groupBy = groupBy === 'country' ? 'none' : 'country';
    render();
  });
  document.querySelector('[data-tool="sort"]').addEventListener('click', () => {
    sortBy = sortBy === 'name' ? 'cost' : 'name';
    load();
  });
  document.querySelector('[data-tool="filter"]').addEventListener('click', () => {
    const next = prompt('Country filter (blank for all)', country);
    if (next !== null) country = next.trim();
    load();
  });
})();

async function load() {
  const q = document.getElementById('searchInput').value;
  const data = await API.get(`/cities?q=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}&sort=${sortBy}`);
  cities = data.cities;
  render();
}

function render() {
  const el = document.getElementById('citiesList');
  if (!cities.length) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1">No cities match that search.</div>';
    return;
  }
  if (groupBy === 'country') {
    const groups = {};
    cities.forEach((c) => { (groups[c.country] ||= []).push(c); });
    el.innerHTML = Object.entries(groups).map(([k, list]) => `
      <div style="grid-column:1/-1"><h3>${UI.escape(k)}</h3></div>
      ${list.map(card).join('')}
    `).join('');
  } else el.innerHTML = cities.map(card).join('');
}

function card(c) {
  return `
    <article class="card">
      <img src="${c.image}" alt="" style="height:180px;width:100%;object-fit:cover;border-radius:12px;margin-bottom:10px">
      <h4>${UI.escape(c.name)}</h4>
      <p style="color:var(--muted)">${UI.escape(c.country)}</p>
      <p style="margin:8px 0">${UI.escape(c.description)}</p>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="tag">${UI.money(c.cost_index)}/day</span>
        <a class="btn btn-sm btn-primary" href="activity-search.html?city=${encodeURIComponent(c.name)}">Activities</a>
      </div>
    </article>
  `;
}
