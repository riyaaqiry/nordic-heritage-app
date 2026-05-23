import * as Location from 'expo-location';

export async function requestLocationPermissions() {
  const { status: foreground } = await Location.requestForegroundPermissionsAsync();
  if (foreground !== 'granted') {
    return { foreground: false, background: false };
  }

  const { status: background } = await Location.requestBackgroundPermissionsAsync();
  return { foreground: true, background: background === 'granted' };
}

export async function getCurrentLocation() {
  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
}
