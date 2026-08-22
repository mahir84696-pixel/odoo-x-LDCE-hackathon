function getToken() {
  return localStorage.getItem('gt_token');
}

function setSession(token, user) {
  localStorage.setItem('gt_token', token);
  if (user) {
    localStorage.setItem('gt_user', JSON.stringify(user));
  }
}

function clearSession() {
  localStorage.removeItem('gt_token');
  localStorage.removeItem('gt_user');
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('gt_user') || 'null');
  } catch {
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}
