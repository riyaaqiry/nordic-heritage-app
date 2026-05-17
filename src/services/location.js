import * as Location from 'expo-location';
import { BACKGROUND_LOCATION_TASK } from './locationTask';
import {
  BACKGROUND_LOCATION_INTERVAL,
  BACKGROUND_LOCATION_DISTANCE,
} from '../config';

export async function requestLocationPermissions() {
  const { status: foreground } = await Location.requestForegroundPermissionsAsync();
  if (foreground !== 'granted') {
    return { foreground: false, background: false };
  }

  const { status: background } = await Location.requestBackgroundPermissionsAsync();
  return { foreground: true, background: background === 'granted' };
}

export async function startBackgroundLocationTracking() {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (hasStarted) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: BACKGROUND_LOCATION_INTERVAL,
    distanceInterval: BACKGROUND_LOCATION_DISTANCE,
    deferredUpdatesInterval: BACKGROUND_LOCATION_INTERVAL,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Nordic Heritage',
      notificationBody: 'Bevakar världsarv i din närhet',
      notificationColor: '#1a5276',
    },
  });
}

export async function stopBackgroundLocationTracking() {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

export async function getCurrentLocation() {
  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
}
