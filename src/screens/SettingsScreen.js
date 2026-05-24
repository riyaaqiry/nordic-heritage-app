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
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginUser,
  loginWithTwoFactor,
  registerUser,
  getMe,
  updateProfile,
  deleteAccount,
  subscribeUser,
  unsubscribeUser,
  fetchNearbySites,
  createSubscription,
  cancelSubscription,
  bankidInitiate,
  bankidStatus,
} from '../services/api';
import {
  requestLocationPermissions,
  getCurrentLocation,
} from '../services/location';
import { startGeofencing, stopGeofencing } from '../services/geofencing';
import {
  startForegroundTracking,
  stopForegroundTracking,
} from '../services/foregroundTracking';
import { registerForPushNotifications } from '../services/notifications';

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

  // Auth: växla mellan inloggning och registrering, samt 2FA-steget.
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [fullName, setFullName] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [pendingTwoFactor, setPendingTwoFactor] = useState(null); // temp_token
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [busy, setBusy] = useState(false);

  // Premium-prenumeration (Stripe). Skild från SMS-prenumerationen ovan.
  const [hasPremium, setHasPremium] = useState(false);
  const [bankidMessage, setBankidMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const storedUserId = await AsyncStorage.getItem('user_id');
    const storedPhone = await AsyncStorage.getItem('phone');
    const storedEmail = await AsyncStorage.getItem('email');
    const storedToken = await AsyncStorage.getItem('access_token');
    const storedFullName = await AsyncStorage.getItem('full_name');
    const storedHomeAddress = await AsyncStorage.getItem('home_address');
    const storedTracking = await AsyncStorage.getItem('tracking_enabled');
    const storedMode = await AsyncStorage.getItem('tracking_mode');
    const storedSubscribed = await AsyncStorage.getItem('is_subscribed');
    const storedPremium = await AsyncStorage.getItem('has_premium');

    if (storedUserId) setUserId(storedUserId);
    if (storedPhone) setPhone(storedPhone);
    if (storedFullName) setFullName(storedFullName);
    if (storedHomeAddress) setHomeAddress(storedHomeAddress);
    if (storedEmail && storedToken) {
      setEmail(storedEmail);
      setIsLoggedIn(true);
      // Uppdatera profilen från servern (fångar ändringar gjorda på hemsidan).
      refreshProfile();
    }
    if (storedSubscribed === 'true') setIsSubscribed(true);
    if (storedPremium === 'true') setHasPremium(true);

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
        // Fullständig bakgrundsspårning via geofencing (kräver development build)
        try {
          const loc = await getCurrentLocation();
          const sites = await fetchNearbySites(
            loc.coords.latitude,
            loc.coords.longitude,
            150
          );
          const { started, count } = await startGeofencing(sites);
          if (started) {
            setTrackingMode('background');
            setTrackingEnabled(true);
            await AsyncStorage.setItem('tracking_enabled', 'true');
            await AsyncStorage.setItem('tracking_mode', 'background');
            Alert.alert(
              'Bakgrundsspårning aktiv',
              `Bevakar ${count} världsarv i din närhet.`
            );
            return;
          }
        } catch (err) {
          console.warn('Geofencing misslyckades, använder förgrund:', err);
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
        await stopGeofencing();
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

  // Sparar token + hämtar profilen från /auth/me och lägger den i state/storage.
  // 'user_id' förblir e-posten (notistjänsten är knuten till e-post); det
  // numeriska id:t sparas separat som 'auth_user_id' för betalningar.
  const finishLogin = async (token) => {
    await AsyncStorage.setItem('access_token', token);
    try {
      const me = await getMe();
      setEmail(me.email);
      setUserId(me.email);
      setFullName(me.full_name || '');
      setHomeAddress(me.home_address || '');
      setHasPremium(!!me.has_subscription);
      await AsyncStorage.multiSet([
        ['user_id', me.email],
        ['auth_user_id', String(me.id)],
        ['email', me.email],
        ['full_name', me.full_name || ''],
        ['home_address', me.home_address || ''],
        ['has_premium', me.has_subscription ? 'true' : 'false'],
      ]);
    } catch (err) {
      // Token sparad men /me misslyckades — fortsätt ändå som inloggad.
      await AsyncStorage.multiSet([
        ['user_id', email],
        ['email', email],
      ]);
      setUserId(email);
    }
    setIsLoggedIn(true);
    setPassword('');
    setPendingTwoFactor(null);
    setTwoFactorCode('');
  };

  const refreshProfile = async () => {
    try {
      const me = await getMe();
      setEmail(me.email);
      setUserId(me.email);
      setFullName(me.full_name || '');
      setHomeAddress(me.home_address || '');
      setHasPremium(!!me.has_subscription);
      await AsyncStorage.multiSet([
        ['auth_user_id', String(me.id)],
        ['full_name', me.full_name || ''],
        ['home_address', me.home_address || ''],
        ['has_premium', me.has_subscription ? 'true' : 'false'],
      ]);
    } catch (err) {
      // Token kan ha gått ut — användaren får logga in igen vid behov.
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Saknar uppgifter', 'Ange e-post och lösenord.');
      return;
    }
    setBusy(true);
    try {
      const res = await loginUser(email, password);
      if (res.requires_2fa) {
        setPendingTwoFactor(res.temp_token);
        Alert.alert('Tvåfaktor', 'Ange engångskoden från din autentiseringsapp.');
      } else if (res.access_token) {
        await finishLogin(res.access_token);
        Alert.alert('Inloggad!', `Välkommen ${email}`);
      } else {
        Alert.alert('Inloggningen misslyckades', 'Oväntat svar från servern.');
      }
    } catch (err) {
      Alert.alert('Inloggningen misslyckades', err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify2fa = async () => {
    if (!twoFactorCode) {
      Alert.alert('Saknar kod', 'Ange engångskoden.');
      return;
    }
    setBusy(true);
    try {
      const tok = await loginWithTwoFactor(pendingTwoFactor, twoFactorCode);
      await finishLogin(tok.access_token);
      Alert.alert('Inloggad!', `Välkommen ${email}`);
    } catch (err) {
      Alert.alert('Fel kod', err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Saknar uppgifter', 'Ange e-post och lösenord.');
      return;
    }
    setBusy(true);
    try {
      await registerUser({
        email,
        password,
        fullName: fullName || null,
        homeAddress: homeAddress || null,
      });
      // Kontot skapat — logga in direkt för att få en token.
      const res = await loginUser(email, password);
      if (res.access_token) {
        await finishLogin(res.access_token);
        Alert.alert('Konto skapat!', `Välkommen ${email}`);
      } else {
        setAuthMode('login');
        Alert.alert('Konto skapat', 'Logga in med dina uppgifter.');
      }
    } catch (err) {
      Alert.alert('Registreringen misslyckades', err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProfile = async () => {
    setBusy(true);
    try {
      const me = await updateProfile({
        fullName: fullName || null,
        homeAddress: homeAddress || null,
      });
      setFullName(me.full_name || '');
      setHomeAddress(me.home_address || '');
      await AsyncStorage.multiSet([
        ['full_name', me.full_name || ''],
        ['home_address', me.home_address || ''],
      ]);
      Alert.alert('Sparat', 'Profilen har uppdaterats.');
    } catch (err) {
      Alert.alert('Fel', err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Radera konto',
      'Detta raderar ditt konto permanent. Är du säker?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Radera',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              await handleLogout();
              Alert.alert('Konto raderat');
            } catch (err) {
              Alert.alert('Fel', err.message);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setIsSubscribed(false);
    setHasPremium(false);
    setUserId('');
    setEmail('');
    setPhone('');
    setPassword('');
    setFullName('');
    setHomeAddress('');
    setAuthMode('login');
    setPendingTwoFactor(null);
    setTwoFactorCode('');
    setBankidMessage('');
    await AsyncStorage.multiRemove([
      'user_id',
      'auth_user_id',
      'access_token',
      'email',
      'phone',
      'full_name',
      'home_address',
      'is_subscribed',
      'has_premium',
      'subscription_id',
    ]);
  };

  // ---- BankID-inloggning ----
  // Startar en BankID-order, öppnar BankID-appen via autostarttoken och
  // pollar status tills inloggningen är klar. Kräver att BankID-appen finns
  // på enheten (eller att backend kör i mock-läge som auto-slutför).
  const pollBankID = (orderRef) =>
    new Promise((resolve) => {
      let tries = 0;
      const tick = async () => {
        tries += 1;
        try {
          const st = await bankidStatus(orderRef);
          if (st.status === 'complete' && st.access_token) {
            setBankidMessage('');
            await finishLogin(st.access_token);
            Alert.alert('Inloggad med BankID!');
            return resolve();
          }
          if (st.status === 'failed') {
            setBankidMessage('');
            Alert.alert('BankID avbröts', st.details || st.hintCode || 'Försök igen.');
            return resolve();
          }
          setBankidMessage('Väntar på BankID…');
        } catch (e) {
          // Nätverksglapp — fortsätt polla.
        }
        if (tries > 60) {
          setBankidMessage('');
          Alert.alert('BankID', 'Tidsgränsen nåddes. Försök igen.');
          return resolve();
        }
        setTimeout(tick, 2000);
      };
      tick();
    });

  const handleBankID = async () => {
    setBusy(true);
    setBankidMessage('Startar BankID…');
    try {
      const init = await bankidInitiate();
      const url = `bankid:///?autostarttoken=${init.autoStartToken}&redirect=null`;
      // Öppna BankID-appen på samma enhet. Misslyckas tyst om appen saknas
      // (t.ex. i emulatorn eller när backend kör mock — pollningen sköter resten).
      Linking.openURL(url).catch(() => {});
      await pollBankID(init.orderRef);
    } catch (err) {
      setBankidMessage('');
      Alert.alert('BankID misslyckades', err.message);
    } finally {
      setBusy(false);
    }
  };

  // ---- Premium-prenumeration (Stripe) ----
  const handleSubscribePremium = async () => {
    setBusy(true);
    try {
      const userIdentifier =
        (await AsyncStorage.getItem('auth_user_id')) || email;
      const res = await createSubscription(userIdentifier, 'plan_basic', 'card');
      if (res.subscription_id) {
        await AsyncStorage.setItem('subscription_id', String(res.subscription_id));
      }
      if (res.url) {
        // Stripe-checkout öppnas i webbläsaren. Efter betalning återvänder
        // användaren till appen och trycker "Uppdatera status".
        Linking.openURL(res.url).catch(() =>
          Alert.alert('Fel', 'Kunde inte öppna betalsidan.')
        );
        Alert.alert(
          'Slutför i webbläsaren',
          'Betala i webbläsaren och återvänd sedan hit och tryck "Uppdatera status".'
        );
      } else {
        // Ingen checkout-URL (t.ex. mock) — uppdatera direkt.
        await refreshProfile();
        Alert.alert('Prenumeration skapad');
      }
    } catch (err) {
      Alert.alert('Betalning misslyckades', err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancelPremium = async () => {
    const subId = await AsyncStorage.getItem('subscription_id');
    if (!subId) {
      Alert.alert(
        'Saknar prenumerations-id',
        'Hantera prenumerationen på hemsidan i stället.'
      );
      return;
    }
    setBusy(true);
    try {
      await cancelSubscription(subId, 'card');
      await refreshProfile();
      Alert.alert('Prenumerationen avbruten');
    } catch (err) {
      Alert.alert('Fel', err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshStatus = async () => {
    setBusy(true);
    await refreshProfile();
    setBusy(false);
    Alert.alert('Uppdaterat', 'Kontostatusen har hämtats på nytt.');
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
          pendingTwoFactor ? (
            <View>
              <Text style={styles.hint}>
                Ange engångskoden från din autentiseringsapp.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="123456"
                value={twoFactorCode}
                onChangeText={setTwoFactorCode}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleVerify2fa}
                disabled={busy}
              >
                <Text style={styles.buttonText}>Verifiera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPendingTwoFactor(null);
                  setTwoFactorCode('');
                }}
              >
                <Text style={styles.linkText}>Avbryt</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.hint}>
                {authMode === 'login'
                  ? 'Logga in med samma konto som på hemsidan'
                  : 'Skapa ett nytt konto — fungerar även på hemsidan'}
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
              {authMode === 'register' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Namn (valfritt)"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Hemadress (valfritt)"
                    value={homeAddress}
                    onChangeText={setHomeAddress}
                  />
                </>
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={authMode === 'login' ? handleLogin : handleRegister}
                disabled={busy}
              >
                <Text style={styles.buttonText}>
                  {authMode === 'login' ? 'Logga in' : 'Skapa konto'}
                </Text>
              </TouchableOpacity>
              {authMode === 'login' && (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.bankidButton]}
                    onPress={handleBankID}
                    disabled={busy}
                  >
                    <Text style={styles.buttonText}>Logga in med BankID</Text>
                  </TouchableOpacity>
                  {bankidMessage ? (
                    <Text style={styles.hint}>{bankidMessage}</Text>
                  ) : null}
                </>
              )}
              <TouchableOpacity
                onPress={() =>
                  setAuthMode(authMode === 'login' ? 'register' : 'login')
                }
              >
                <Text style={styles.linkText}>
                  {authMode === 'login'
                    ? 'Inget konto? Registrera dig'
                    : 'Har du redan ett konto? Logga in'}
                </Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View>
            <View style={styles.subscribedBadge}>
              <Text style={styles.subscribedText}>Inloggad som {email}</Text>
            </View>
            <Text style={styles.label}>Profil</Text>
            <TextInput
              style={styles.input}
              placeholder="Namn"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Hemadress"
              value={homeAddress}
              onChangeText={setHomeAddress}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSaveProfile}
              disabled={busy}
            >
              <Text style={styles.buttonText}>Spara profil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logga ut</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteAccount}>
              <Text style={[styles.linkText, styles.dangerLink]}>
                Radera konto
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoggedIn && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium</Text>
          {hasPremium ? (
            <View>
              <View style={styles.subscribedBadge}>
                <Text style={styles.subscribedText}>Premium aktivt</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={handleCancelPremium}
                disabled={busy}
              >
                <Text style={styles.buttonText}>Avsluta prenumeration</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.hint}>
                Lås upp premiumfunktioner. Betalningen sker säkert via Stripe i
                webbläsaren.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleSubscribePremium}
                disabled={busy}
              >
                <Text style={styles.buttonText}>Prenumerera</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={handleRefreshStatus} disabled={busy}>
            <Text style={styles.linkText}>Uppdatera status</Text>
          </TouchableOpacity>
        </View>
      )}

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
  bankidButton: { backgroundColor: '#193e4f' },
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
  linkText: {
    color: '#1a5276',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  dangerLink: { color: '#c0392b' },
});
