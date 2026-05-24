import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const DEFAULT_HEADERS = {};

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

// Bygger Authorization-header från sparad JWT. Token sparas vid inloggning.
async function authHeaders() {
  const token = await AsyncStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(response, fallback) {
  const data = await response.json().catch(() => ({}));
  return new Error(data.detail || fallback);
}

// Returnerar hela LoginResponse: { access_token?, token_type?, requires_2fa, temp_token? }.
// Anroparen sparar token resp. hanterar 2FA-flödet.
export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await parseError(response, 'Inloggningen misslyckades');
  return response.json();
}

// Steg 2 i tvåfaktorsinloggning. Returnerar { access_token, token_type }.
export async function loginWithTwoFactor(tempToken, code) {
  const response = await fetch(`${API_BASE_URL}/auth/login/2fa`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ temp_token: tempToken, code }),
  });
  if (!response.ok) throw await parseError(response, 'Tvåfaktorsinloggningen misslyckades');
  return response.json();
}

// Skapar ett konto. Backend returnerar användaren (ingen token) — logga in efteråt.
export async function registerUser({
  email,
  password,
  fullName,
  homeAddress,
  homeLat,
  homeLon,
}) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      email,
      password,
      full_name: fullName ?? null,
      home_address: homeAddress ?? null,
      home_lat: homeLat ?? null,
      home_lon: homeLon ?? null,
    }),
  });
  if (!response.ok) throw await parseError(response, 'Registreringen misslyckades');
  return response.json();
}

// Hämtar inloggad användares profil (kräver token).
export async function getMe() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: await authHeaders(),
  });
  if (!response.ok) throw await parseError(response, 'Kunde inte hämta profilen');
  return response.json();
}

// Uppdaterar profilfält (kräver token).
export async function updateProfile({ fullName, homeAddress, homeLat, homeLon }) {
  const response = await fetch(`${API_BASE_URL}/auth/me/profile`, {
    method: 'PATCH',
    headers: { ...JSON_HEADERS, ...(await authHeaders()) },
    body: JSON.stringify({
      full_name: fullName ?? null,
      home_address: homeAddress ?? null,
      home_lat: homeLat ?? null,
      home_lon: homeLon ?? null,
    }),
  });
  if (!response.ok) throw await parseError(response, 'Kunde inte uppdatera profilen');
  return response.json();
}

// Raderar inloggat konto permanent (kräver token).
export async function deleteAccount() {
  const response = await fetch(`${API_BASE_URL}/auth/account`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!response.ok) throw await parseError(response, 'Kunde inte radera kontot');
  return true;
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

// ---- UNESCO AI-chatt (kräver token) ----

export async function chatAboutSites({ message, lat, lon, radius = 150, pageLang = 'sv' }) {
  const response = await fetch(`${API_BASE_URL}/unesco/chat`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...(await authHeaders()) },
    body: JSON.stringify({ message, lat, lon, radius, page_lang: pageLang }),
  });
  if (!response.ok) throw await parseError(response, 'AI-chatten kunde inte svara');
  return response.json(); // { answer, sites_used }
}

// ---- Översättning ----

export async function fetchLanguages() {
  const response = await fetch(`${API_BASE_URL}/translation/languages`, {
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) throw await parseError(response, 'Kunde inte hämta språk');
  return response.json();
}

export async function translateText(text, targetLanguage = 'en') {
  const response = await fetch(`${API_BASE_URL}/translation/translate`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ text, target_language: targetLanguage }),
  });
  if (!response.ok) throw await parseError(response, 'Översättningen misslyckades');
  return response.json(); // { translated_text, detected_language }
}

// ---- Betalning / prenumeration (Stripe) ----

// Skapar en prenumeration. För method 'card' returneras en Stripe-checkout-URL
// som öppnas i webbläsaren.
export async function createSubscription(userId, planId = 'plan_basic', method = 'card') {
  const response = await fetch(`${API_BASE_URL}/payment/create`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ user_id: userId, plan_id: planId, method }),
  });
  if (!response.ok) throw await parseError(response, 'Betalningen kunde inte skapas');
  return response.json(); // { subscription_id, url, record }
}

export async function cancelSubscription(subscriptionId, method = 'card') {
  const response = await fetch(`${API_BASE_URL}/payment/cancel`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ subscription_id: subscriptionId, method }),
  });
  if (!response.ok) throw await parseError(response, 'Kunde inte avbryta prenumerationen');
  return response.json(); // { cancelled }
}

// Markerar inloggad användare som prenumerant i backend (kräver token).
export async function activateSubscription() {
  const response = await fetch(`${API_BASE_URL}/auth/subscription/activate`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!response.ok) throw await parseError(response, 'Kunde inte aktivera prenumerationen');
  return response.json(); // UserResponse
}

// ---- BankID ----

export async function bankidInitiate() {
  const response = await fetch(`${API_BASE_URL}/auth/bankid/initiate`, {
    method: 'POST',
    headers: JSON_HEADERS,
  });
  if (!response.ok) throw await parseError(response, 'BankID kunde inte startas');
  return response.json(); // { orderRef, autoStartToken, qrStartToken, qrStartSecret }
}

// Pollas tills status === 'complete' (då finns access_token + user) eller 'failed'.
export async function bankidStatus(orderRef) {
  const response = await fetch(`${API_BASE_URL}/auth/bankid/status/${orderRef}`, {
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) throw await parseError(response, 'BankID-status kunde inte hämtas');
  return response.json(); // BankIDLoginResponse
}

// ---- Tvåfaktorsautentisering (2FA) ----

export async function twoFactorStatus() {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/status`, {
    headers: await authHeaders(),
  });
  if (!response.ok) throw await parseError(response, 'Kunde inte hämta 2FA-status');
  return response.json(); // { two_factor_enabled }
}

// Startar 2FA-registrering: returnerar hemlighet + otpauth-URI för QR.
export async function setupTwoFactor() {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/setup`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!response.ok) throw await parseError(response, 'Kunde inte starta 2FA-registrering');
  return response.json(); // { secret, provisioning_uri, message }
}

// Aktiverar 2FA efter att användaren bekräftat med en engångskod.
export async function enableTwoFactor(code) {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/enable`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...(await authHeaders()) },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw await parseError(response, 'Fel kod — 2FA aktiverades inte');
  return response.json(); // UserResponse
}

export async function disableTwoFactor(code) {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/disable`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...(await authHeaders()) },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw await parseError(response, 'Fel kod — 2FA inaktiverades inte');
  return response.json(); // UserResponse
}
