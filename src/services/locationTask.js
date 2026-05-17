import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNearbySites, triggerLocationNotification } from './api';
import { PROXIMITY_THRESHOLD_METERS } from '../config';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (!data) return;

  const { locations } = data;
  const location = locations[0];
  if (!location) return;

  const { latitude, longitude } = location.coords;

  try {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) return;

    // Hämta världsarv nära nuvarande position (radie baserat på threshold)
    const radiusKm = PROXIMITY_THRESHOLD_METERS / 1000;
    const sites = await fetchNearbySites(latitude, longitude, radiusKm);

    if (sites.length === 0) return;

    // Trigga notis för närmaste världsarv
    const nearest = sites[0];
    const siteId = nearest.id_no || nearest.name_en?.toLowerCase().replace(/\s+/g, '_');
    const siteName = nearest.name_en || 'Okänt världsarv';

    // Kolla om vi redan har notifierat för detta världsarv nyligen
    const notifiedKey = `notified_${siteId}`;
    const lastNotified = await AsyncStorage.getItem(notifiedKey);
    const now = Date.now();

    // Vänta minst 1 timme mellan notiser för samma plats
    if (lastNotified && now - parseInt(lastNotified) < 3600000) return;

    // Trigga server-side notis (SMS/email via backend)
    await triggerLocationNotification(userId, siteId, siteName);

    // Visa lokal push-notis i appen
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏛️ Världsarv i närheten!',
        body: `${siteName} är bara ${nearest.distance_km} km bort. Tryck för att läsa mer!`,
        data: { siteId, siteName, lat: latitude, lon: longitude },
      },
      trigger: null, // Visa direkt
    });

    await AsyncStorage.setItem(notifiedKey, now.toString());
  } catch (err) {
    console.error('Background location task error:', err);
  }
});
