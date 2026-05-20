import { API_BASE_URL } from '../config';

const DEFAULT_HEADERS = {};

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Inloggningen misslyckades');
  }
  return response.json();
}

export async function fetchNearbySites(lat, lon, radius = 150) {
  const response = await fetch(
    `${API_BASE_URL}/unesco/sites?lat=${lat}&lon=${lon}&radius=${radius}`,
    { headers: DEFAULT_HEADERS }
  );
  if (!response.ok) throw new Error('Kunde inte hämta världsarv');
  return response.json();
}

export async function subscribeUser(userId, phone, email, sites) {
  const response = await fetch(`${API_BASE_URL}/api/notification/subscribe`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ user_id: userId, phone, email, sites }),
  });
  return response.json();
}

export async function unsubscribeUser(userId, sites) {
  const response = await fetch(`${API_BASE_URL}/api/notification/unsubscribe`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ user_id: userId, sites }),
  });
  return response.json();
}

export async function triggerLocationNotification(userId, siteId, siteName) {
  const response = await fetch(
    `${API_BASE_URL}/api/notification/trigger?user_id=${userId}&site_id=${siteId}&site_name=${encodeURIComponent(siteName)}`,
    { headers: DEFAULT_HEADERS }
  );
  return response.json();
}

export async function markSiteVisited(userId, siteId) {
  const response = await fetch(`${API_BASE_URL}/api/notification/mark-visited`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ user_id: userId, site_id: siteId }),
  });
  return response.json();
}
