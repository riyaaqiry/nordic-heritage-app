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
import { sendLocationUpdate } from './api';
import { PROXIMITY_THRESHOLD_METERS } from '../config';

let watchSubscription = null;
let pollInterval = null;

// ---- Intern hjälpfunktion: kolla närhet ----

async function checkProximity(latitude, longitude) {
  try {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) return;

    const radiusKm = PROXIMITY_THRESHOLD_METERS / 1000;
    const result = await sendLocationUpdate(userId, latitude, longitude, radiusKm);

    if (!result.success || !result.site_name) return;

    const notifiedKey = `notified_${result.site_id}`;
    const lastNotified = await AsyncStorage.getItem(notifiedKey);
    const now = Date.now();
    if (lastNotified && now - parseInt(lastNotified) < 3600000) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏛️ Världsarv i närheten!',
        body: `${result.site_name} är bara ${result.distance_km} km bort. Tryck för att läsa mer!`,
        data: { siteId: result.site_id, siteName: result.site_name, lat: latitude, lon: longitude },
      },
      trigger: null,
    });

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

  // 2. Poll-timer (fångar stillastående + ger periodisk kontroll)
  pollInterval = setInterval(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      checkProximity(loc.coords.latitude, loc.coords.longitude);
    } catch (err) {
      console.warn('Foreground poll error:', err);
    }
  }, 60000); // var 60:e sekund
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
