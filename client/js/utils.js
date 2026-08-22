const TOKEN_KEY = 'gt_token';

const API = {
  token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const token = this.token();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${window.API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !path.startsWith('/auth')) {
      this.setToken(null);
      if (!location.pathname.endsWith('login.html')) location.href = 'login.html';
    }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },
  get(path) { return this.request(path); },
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); },
  put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); },
  delete(path) { return this.request(path, { method: 'DELETE' }); }
};

const UI = {
  toast(msg, type = 'info') {
    let box = document.querySelector('.toast-container');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toast-container';
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  },
  formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
  money(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0));
  },
  daysBetween(start, end) {
    if (!start || !end) return 0;
    const s = new Date(start), e = new Date(end);
    return Math.max(1, Math.ceil((e - s) / 86400000) + 1);
  },
  qs(name) {
    return new URLSearchParams(location.search).get(name);
  },
  requireAuth() {
    if (!API.token()) {
      location.href = 'login.html';
      return false;
    }
    return true;
  },
  escape(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
};

function currentUser() {
  try { return JSON.parse(localStorage.getItem('gt_user') || 'null'); } catch { return null; }
}

function setCurrentUser(user) {
  if (user) localStorage.setItem('gt_user', JSON.stringify(user));
  else localStorage.removeItem('gt_user');
}
