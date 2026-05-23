/**
 * Förgrundsspårning — pollar position medan appen är öppen.
 *
 * Används som fallback när bakgrundsplats inte är tillgänglig
 * (t.ex. i Expo Go på iOS). Ger samma funktionalitet som
 * bakgrundsuppgiften: kollar närhet till världsarv och visar
 * lokal push-notis + triggar backend-notis (SMS/email).
 */
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNearbySites, triggerLocationNotification } from './api';
import { PROXIMITY_THRESHOLD_METERS } from '../config';

let watchSubscription = null;
let pollInterval = null;

// ---- Intern hjälpfunktion: kolla närhet ----

async function checkProximity(latitude, longitude) {
  try {
    const radiusKm = PROXIMITY_THRESHOLD_METERS / 1000;
    const sites = await fetchNearbySites(latitude, longitude, radiusKm);

    if (!sites || sites.length === 0) return;

    const nearest = sites[0];
    const siteId =
      nearest.id_no || nearest.name_en?.toLowerCase().replace(/\s+/g, '_');
    const siteName = nearest.name_en || 'Okänt världsarv';

    // Cooldown — max 1 notis per plats per timme
    const notifiedKey = `notified_${siteId}`;
    const lastNotified = await AsyncStorage.getItem(notifiedKey);
    const now = Date.now();
    if (lastNotified && now - parseInt(lastNotified) < 3600000) return;

    // Lokal push-notis visas oavsett inloggning — närhetsvarningen är
    // värdefull även utan konto.
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏛️ Världsarv i närheten!',
        body: `${siteName} är bara ${nearest.distance_km} km bort. Tryck för att läsa mer!`,
        data: { siteId, siteName, lat: latitude, lon: longitude },
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
    console.warn('Foreground proximity check error:', err);
  }
}

// ---- Publik API ----

/**
 * Starta förgrundsspårning.
 * Kombinerar watchPositionAsync (rörelsekänslig) med en
 * poll var 60:e sekund (fångar stillastående användare).
 */
export async function startForegroundTracking() {
  if (watchSubscription) return; // redan igång

  // 1. Realtids-watch (triggas vid rörelse)
  watchSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 100, // minst 100 m mellan uppdateringar
    },
    (location) => {
      checkProximity(location.coords.latitude, location.coords.longitude);
    }
  );

  // 2. Poll-timer (fångar stillastående + ger periodisk kontroll).
  //    Omedelbar första koll så användaren inte väntar en hel cykel.
  pollOnce();
  pollInterval = setInterval(pollOnce, 60000); // var 60:e sekund
}

async function pollOnce() {
  try {
    let loc;
    try {
      loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (e) {
      // En färsk fix saknas ofta vid kallstart och i emulatorn
      // (inga satelliter) — fall tillbaka på senast kända position.
      loc = await Location.getLastKnownPositionAsync();
    }
    if (loc) {
      checkProximity(loc.coords.latitude, loc.coords.longitude);
    }
  } catch (err) {
    console.warn('Foreground poll error:', err);
  }
}

/**
 * Stoppa förgrundsspårning.
 */
export function stopForegroundTracking() {
  if (watchSubscription) {
    watchSubscription.remove();
    watchSubscription = null;
  }
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

/**
 * Returnerar true om förgrundsspårningen körs.
 */
export function isForegroundTrackingActive() {
  return watchSubscription !== null;
}
