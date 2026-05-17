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
import { subscribeUser, unsubscribeUser } from '../services/api';
import {
  requestLocationPermissions,
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
} from '../services/location';
import { registerForPushNotifications } from '../services/notifications';

export default function SettingsScreen() {
  const [userId, setUserId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [trackingEnabled, setTrackingEnabled] = useState(false);
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
    const storedSubscribed = await AsyncStorage.getItem('is_subscribed');

    if (storedUserId) setUserId(storedUserId);
    if (storedPhone) setPhone(storedPhone);
    if (storedEmail) setEmail(storedEmail);
    if (storedTracking === 'true') setTrackingEnabled(true);
    if (storedSubscribed === 'true') setIsSubscribed(true);
  };

  const handleToggleTracking = async (value) => {
    if (value) {
      const perms = await requestLocationPermissions();
      if (!perms.background) {
        Alert.alert(
          'Behörighet saknas',
          'Du måste tillåta platsåtkomst "Alltid" för att bakgrundsspårning ska fungera. Gå till Inställningar > Nordic Heritage > Plats.'
        );
        return;
      }
      await startBackgroundLocationTracking();
      setTrackingEnabled(true);
      await AsyncStorage.setItem('tracking_enabled', 'true');
    } else {
      await stopBackgroundLocationTracking();
      setTrackingEnabled(false);
      await AsyncStorage.setItem('tracking_enabled', 'false');
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

  const handleSubscribe = async () => {
    if (!phone && !email) {
      Alert.alert('Saknar kontaktinfo', 'Ange telefonnummer eller e-post.');
      return;
    }

    const generatedUserId = userId || `user_${Date.now()}`;
    setUserId(generatedUserId);
    await AsyncStorage.setItem('user_id', generatedUserId);
    await AsyncStorage.setItem('phone', phone);
    await AsyncStorage.setItem('email', email);

    const result = await subscribeUser(generatedUserId, phone || null, email || null, null);

    if (result.success) {
      setIsSubscribed(true);
      await AsyncStorage.setItem('is_subscribed', 'true');
      Alert.alert('Prenumeration aktiverad!', 'Du får nu notiser om världsarv i din närhet.');
    } else {
      Alert.alert('Fel', result.error || 'Kunde inte skapa prenumeration.');
    }
  };

  const handleUnsubscribe = async () => {
    const result = await unsubscribeUser(userId);
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
            <Text style={styles.label}>Bakgrundsspårning</Text>
            <Text style={styles.hint}>
              Få notiser även när appen är stängd
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
        <Text style={styles.sectionTitle}>Kontaktuppgifter</Text>
        <Text style={styles.hint}>
          Ange telefonnummer och/eller e-post för att få SMS/e-postnotiser
        </Text>
        <TextInput
          style={styles.input}
          placeholder="+46701234567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="din@email.se"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
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
