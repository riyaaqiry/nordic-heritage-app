import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, subscribeUser, unsubscribeUser, sendLocationUpdate } from '../services/api';
import {
  requestLocationPermissions,
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  getCurrentLocation,
} from '../services/location';
import {
  startForegroundTracking,
  stopForegroundTracking,
} from '../services/foregroundTracking';
import { registerForPushNotifications } from '../services/notifications';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const [userId, setUserId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [trackingMode, setTrackingMode] = useState(null); // 'background' | 'foreground'
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const storedUserId = await AsyncStorage.getItem('user_id');
    const storedPhone = await AsyncStorage.getItem('phone');
    const storedEmail = await AsyncStorage.getItem('email');
    const storedTracking = await AsyncStorage.getItem('tracking_enabled');
    const storedMode = await AsyncStorage.getItem('tracking_mode');
    const storedSubscribed = await AsyncStorage.getItem('is_subscribed');

    if (storedUserId) setUserId(storedUserId);
    if (storedPhone) setPhone(storedPhone);
    if (storedEmail) {
      setEmail(storedEmail);
      setIsLoggedIn(true);
    }
    if (storedSubscribed === 'true') setIsSubscribed(true);

    if (storedTracking === 'true') {
      setTrackingEnabled(true);
      // Återstarta förgrundsspårning (bakgrund körs redan via TaskManager)
      if (storedMode === 'foreground') {
        setTrackingMode('foreground');
        startForegroundTracking();
      } else if (storedMode === 'background') {
        setTrackingMode('background');
      }
    }
  };

  const handleToggleTracking = async (value) => {
    if (value) {
      const perms = await requestLocationPermissions();
      if (!perms.foreground) {
        Alert.alert(
          'Behörighet saknas',
          'Du måste tillåta platsåtkomst för att spårning ska fungera.'
        );
        return;
      }

      if (perms.background) {
        // Fullständig bakgrundsspårning (kräver development build)
        try {
          await startBackgroundLocationTracking();
          setTrackingMode('background');
          setTrackingEnabled(true);
          await AsyncStorage.setItem('tracking_enabled', 'true');
          await AsyncStorage.setItem('tracking_mode', 'background');
          return;
        } catch (err) {
          console.warn('Bakgrundsspårning misslyckades, använder förgrund:', err);
        }
      }

      // Fallback: förgrundsspårning (fungerar i Expo Go)
      await startForegroundTracking();
      setTrackingMode('foreground');
      setTrackingEnabled(true);
      await AsyncStorage.setItem('tracking_enabled', 'true');
      await AsyncStorage.setItem('tracking_mode', 'foreground');
    } else {
      // Stoppa allt
      if (trackingMode === 'background') {
        await stopBackgroundLocationTracking();
      } else {
        stopForegroundTracking();
      }
      setTrackingEnabled(false);
      setTrackingMode(null);
      await AsyncStorage.setItem('tracking_enabled', 'false');
      await AsyncStorage.setItem('tracking_mode', '');
    }
  };

  const handleToggleNotifications = async (value) => {
    if (value) {
      const result = await registerForPushNotifications();
      if (!result) {
        Alert.alert('Behörighet saknas', 'Tillåt notiser i dina enhetsinställningar.');
        return;
      }
    }
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());
  };

  const notifyNearestSite = async (loggedInUserId) => {
    try {
      const perms = await requestLocationPermissions();
      if (!perms.foreground) return;

      await registerForPushNotifications();

      const loc = await getCurrentLocation();
      const result = await sendLocationUpdate(
        loggedInUserId,
        loc.coords.latitude,
        loc.coords.longitude,
        150
      );

      if (result.success && result.site_name) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🏛️ Världsarv i närheten!',
            body: `${result.site_name} är ${result.distance_km} km bort. Tryck för att läsa mer!`,
            data: { siteId: result.site_id, siteName: result.site_name },
          },
          trigger: null,
        });
      }
    } catch (err) {
      console.warn('Kunde inte hämta närliggande världsarv:', err);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Saknar uppgifter', 'Ange e-post och lösenord.');
      return;
    }

    try {
      await loginUser(email, password);
      setUserId(email);
      setIsLoggedIn(true);
      await AsyncStorage.setItem('user_id', email);
      await AsyncStorage.setItem('email', email);
      Alert.alert('Inloggad!', `Välkommen ${email}`);
      notifyNearestSite(email);
    } catch (err) {
      Alert.alert('Inloggningen misslyckades', err.message);
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setIsSubscribed(false);
    setUserId('');
    setEmail('');
    setPhone('');
    setPassword('');
    await AsyncStorage.multiRemove(['user_id', 'email', 'phone', 'is_subscribed']);
    Alert.alert('Utloggad');
  };

  const handleSubscribe = async () => {
    if (!phone && !email) {
      Alert.alert('Saknar kontaktinfo', 'Ange telefonnummer för SMS-notiser.');
      return;
    }

    const result = await subscribeUser(email, phone || null, email, null);

    if (result.success) {
      setIsSubscribed(true);
      await AsyncStorage.setItem('is_subscribed', 'true');
      await AsyncStorage.setItem('phone', phone);
      Alert.alert('Prenumeration aktiverad!', 'Du får nu notiser om världsarv i din närhet.');
    } else {
      Alert.alert('Fel', result.error || 'Kunde inte skapa prenumeration.');
    }
  };

  const handleUnsubscribe = async () => {
    const result = await unsubscribeUser(email);
    if (result.success) {
      setIsSubscribed(false);
      await AsyncStorage.setItem('is_subscribed', 'false');
      Alert.alert('Avprenumererad', 'Du kommer inte längre få notiser.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platsspårning</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Platsspårning</Text>
            <Text style={styles.hint}>
              {trackingEnabled
                ? trackingMode === 'background'
                  ? '✅ Bakgrundsspårning aktiv — fungerar även när appen är stängd'
                  : '✅ Förgrundsspårning aktiv — fungerar medan appen är öppen'
                : 'Få notiser när du är nära ett världsarv'}
            </Text>
          </View>
          <Switch
            value={trackingEnabled}
            onValueChange={handleToggleTracking}
            trackColor={{ true: '#1a5276' }}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Push-notiser</Text>
            <Text style={styles.hint}>Visa notiser på din enhet</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ true: '#1a5276' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Konto</Text>
        {!isLoggedIn ? (
          <View>
            <Text style={styles.hint}>
              Logga in med samma konto som på hemsidan
            </Text>
            <TextInput
              style={styles.input}
              placeholder="din@email.se"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Lösenord"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Logga in</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.subscribedBadge}>
              <Text style={styles.subscribedText}>Inloggad som {email}</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logga ut</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoggedIn && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SMS-notiser</Text>
          <Text style={styles.hint}>
            Ange telefonnummer för att få SMS när du är nära ett världsarv
          </Text>
          <TextInput
            style={styles.input}
            placeholder="+46701234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {!isSubscribed ? (
            <TouchableOpacity style={styles.button} onPress={handleSubscribe}>
              <Text style={styles.buttonText}>Aktivera prenumeration</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.subscribedBadge}>
                <Text style={styles.subscribedText}>Prenumeration aktiv</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={handleUnsubscribe}
              >
                <Text style={styles.buttonText}>Avsluta prenumeration</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Om appen</Text>
        <Text style={styles.aboutText}>
          Nordic Heritage bevakar din position och meddelar dig när du befinner
          dig nära ett UNESCO-världsarv. Annonsmodulen visar relevant information
          och erbjudanden kopplade till dessa platser.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowText: { flex: 1, marginRight: 12 },
  label: { fontSize: 16, color: '#2c3e50' },
  hint: { fontSize: 13, color: '#7f8c8d', marginTop: 2, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#1a5276',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButton: { backgroundColor: '#c0392b' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  subscribedBadge: {
    backgroundColor: '#d4efdf',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  subscribedText: { color: '#27ae60', fontWeight: '600' },
  aboutText: { fontSize: 14, color: '#555', lineHeight: 20 },
});
