import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { fetchNearbySites, fetchLanguages, translateText } from '../services/api';
import { getCurrentLocation } from '../services/location';

// Vanliga språk att visa först i språkväljaren. Övriga följer efter.
const PRIORITY_LANGS = ['en', 'ar', 'es', 'de', 'fr', 'fa', 'so', 'uk'];

export default function HomeScreen({ navigation }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);

  const [languages, setLanguages] = useState([]);
  const [targetLang, setTargetLang] = useState('original');
  const [translations, setTranslations] = useState({}); // `${id}_${lang}` -> { name, description }
  const [translating, setTranslating] = useState(false);

  const loadSites = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc.coords);
      const data = await fetchNearbySites(
        loc.coords.latitude,
        loc.coords.longitude,
        150
      );
      setSites(data);
    } catch (err) {
      console.error('Kunde inte ladda världsarv:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSites();
    fetchLanguages()
      .then((langs) => {
        // Sortera prioriterade språk först.
        const sorted = [...langs].sort((a, b) => {
          const ia = PRIORITY_LANGS.indexOf(a.code);
          const ib = PRIORITY_LANGS.indexOf(b.code);
          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });
        setLanguages(sorted);
      })
      .catch(() => {});
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadSites();
  };

  const siteKey = (s) => s.id_no || s.name_en;

  const selectLanguage = async (lang) => {
    setTargetLang(lang);
    if (lang === 'original') return;

    setTranslating(true);
    try {
      const updates = {};
      await Promise.all(
        sites.map(async (s) => {
          const key = `${siteKey(s)}_${lang}`;
          if (translations[key]) return;
          const [nameRes, descRes] = await Promise.all([
            s.name_en
              ? translateText(s.name_en, lang)
              : Promise.resolve({ translated_text: '' }),
            s.short_description_en
              ? translateText(s.short_description_en, lang)
              : Promise.resolve({ translated_text: '' }),
          ]);
          updates[key] = {
            name: nameRes.translated_text,
            description: descRes.translated_text,
          };
        })
      );
      setTranslations((prev) => ({ ...prev, ...updates }));
    } catch (err) {
      Alert.alert('Översättning misslyckades', err.message);
      setTargetLang('original');
    } finally {
      setTranslating(false);
    }
  };

  const renderSite = ({ item }) => {
    const key = `${siteKey(item)}_${targetLang}`;
    const t = targetLang !== 'original' ? translations[key] : null;
    const name = t?.name || item.name_en;
    const description = t?.description || item.short_description_en;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Widget', { siteId: item.id_no })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.category}>{item.category || 'Okänd'}</Text>
          <Text style={styles.distance}>{item.distance_km} km</Text>
        </View>
        <Text style={styles.siteName}>{name}</Text>
        <Text style={styles.country}>{item.states_names}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a5276" />
        <Text style={styles.loadingText}>Söker efter världsarv...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Världsarv i närheten</Text>
        <Text style={styles.subtitle}>{sites.length} platser inom 150 km</Text>
      </View>

      {languages.length > 0 && (
        <View style={styles.langBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LangChip
              label="Original"
              active={targetLang === 'original'}
              onPress={() => selectLanguage('original')}
            />
            {languages.map((l) => (
              <LangChip
                key={l.code}
                label={l.name}
                active={targetLang === l.code}
                onPress={() => selectLanguage(l.code)}
              />
            ))}
          </ScrollView>
          {translating && (
            <ActivityIndicator
              style={styles.langSpinner}
              size="small"
              color="#1a5276"
            />
          )}
        </View>
      )}

      <FlatList
        data={sites}
        keyExtractor={(item, index) => item.id_no?.toString() || index.toString()}
        renderItem={renderSite}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Inga världsarv hittades i din närhet.</Text>
        }
      />
    </View>
  );
}

function LangChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 16 },
  header: { padding: 20, paddingBottom: 10, backgroundColor: '#1a5276' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#aed6f1', marginTop: 4 },
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  langSpinner: { marginHorizontal: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eef2f5',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#1a5276' },
  chipText: { fontSize: 13, color: '#2c3e50', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  category: {
    fontSize: 12,
    color: '#1a5276',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  distance: { fontSize: 12, color: '#27ae60', fontWeight: '600' },
  siteName: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  country: { fontSize: 13, color: '#7f8c8d', marginBottom: 6 },
  description: { fontSize: 13, color: '#555', lineHeight: 18 },
  empty: { textAlign: 'center', color: '#999', fontSize: 16, marginTop: 40 },
});
