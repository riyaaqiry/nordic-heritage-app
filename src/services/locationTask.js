import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendLocationUpdate } from './api';
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
    console.error('Background location task error:', err);
  }
});
