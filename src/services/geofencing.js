/**
 * Geofencing-baserad bakgrundsspårning.
 *
 * Istället för att kontinuerligt polla GPS:en registrerar vi geofence-regioner
 * runt världsarven. Operativsystemet väcker appen när användaren korsar en
 * gräns (ENTER) — även om appen är stängd. Detta ger betydligt bättre
 * batteritid och fungerar offline (regionerna cachas på enheten).
 *
 * Kräver en development build (fungerar INTE i Expo Go).
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerLocationNotification } from './api';
import { PROXIMITY_THRESHOLD_METERS } from '../config';

export const GEOFENCE_TASK = 'geofence-task';

// iOS tillåter max 20 övervakade regioner samtidigt; Android ~100.
// Vi håller oss under iOS-gränsen för att vara plattformsoberoende.
const MAX_REGIONS = 20;

// Minst 1 timme mellan notiser för samma plats.
const COOLDOWN_MS = 3600000;

// Lagrar id -> { name } så bakgrundsuppgiften kan slå upp platsnamnet.
// Geofence-händelsen innehåller bara region.identifier, inte namnet.
const SITES_MAP_KEY = 'geofence_sites_map';

// ---- Bakgrundsuppgift (måste definieras vid modulladdning) ----

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Geofence task error:', error);
    return;
  }
  if (!data) return;

  const { eventType, region } = data;
  if (eventType !== Location.GeofencingEventType.Enter) return;

  await handleEnter(region);
});

async function handleEnter(region) {
  try {
    const siteId = region.identifier;

    // Cooldown — undvik upprepade notiser för samma plats.
    const notifiedKey = `notified_${siteId}`;
    const lastNotified = await AsyncStorage.getItem(notifiedKey);
    const now = Date.now();
    if (lastNotified && now - parseInt(lastNotified, 10) < COOLDOWN_MS) return;

    // Slå upp platsnamnet ur den lagrade kartan.
    let siteName = 'ett världsarv';
    const raw = await AsyncStorage.getItem(SITES_MAP_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      if (map[siteId]?.name) siteName = map[siteId].name;
    }

    // Lokal push-notis visas oavsett inloggning — närhetsvarningen är
    // värdefull även utan konto.
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏛️ Världsarv i närheten!',
        body: `Du är nära ${siteName}. Tryck för att läsa mer!`,
        data: { siteId, siteName },
      },
      trigger: null,
    });

    // Backend-notis (SMS/e-post) kräver inloggad användare.
    const userId = await AsyncStorage.getItem('user_id');
    if (userId) {
      await triggerLocationNotification(userId, siteId, siteName).catch((err) =>
        console.warn('Backend-notis misslyckades:', err)
      );
    }

    await AsyncStorage.setItem(notifiedKey, now.toString());
  } catch (err) {
    console.error('Geofence enter handler error:', err);
  }
}

// ---- Publik API ----

function buildRegions(sites) {
  return sites
    .filter((s) => s?.coordinates?.lat != null && s?.coordinates?.lon != null)
    .slice(0, MAX_REGIONS)
    .map((s) => ({
      identifier: String(s.id_no),
      latitude: s.coordinates.lat,
      longitude: s.coordinates.lon,
      radius: PROXIMITY_THRESHOLD_METERS,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));
}

/**
 * Starta geofencing för en lista världsarv.
 * Returnerar { started, count } där count är antal registrerade regioner.
 */
export async function startGeofencing(sites) {
  const regions = buildRegions(sites);
  if (regions.length === 0) return { started: false, count: 0 };

  // Spara id -> namn för bakgrundsuppgiften.
  const map = {};
  for (const s of sites) {
    if (s?.id_no != null) map[String(s.id_no)] = { name: s.name_en };
  }
  await AsyncStorage.setItem(SITES_MAP_KEY, JSON.stringify(map));

  // Starta om rent om vi redan övervakar (uppdaterar regionuppsättningen).
  const already = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(
    () => false
  );
  if (already) await Location.stopGeofencingAsync(GEOFENCE_TASK);

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
  return { started: true, count: regions.length };
}

export async function stopGeofencing() {
  const already = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(
    () => false
  );
  if (already) await Location.stopGeofencingAsync(GEOFENCE_TASK);
}

export async function isGeofencingActive() {
  return Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false);
}
