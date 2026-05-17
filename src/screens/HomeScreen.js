import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { fetchNearbySites } from '../services/api';
import { getCurrentLocation } from '../services/location';

export default function HomeScreen({ navigation }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);

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
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadSites();
  };

  const renderSite = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Widget', { siteId: item.id_no })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{item.category || 'Okänd'}</Text>
        <Text style={styles.distance}>{item.distance_km} km</Text>
      </View>
      <Text style={styles.siteName}>{item.name_en}</Text>
      <Text style={styles.country}>{item.states_names}</Text>
      {item.short_description_en && (
        <Text style={styles.description} numberOfLines={2}>
          {item.short_description_en}
        </Text>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.subtitle}>
          {sites.length} platser inom 150 km
        </Text>
      </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 16 },
  header: { padding: 20, paddingBottom: 10, backgroundColor: '#1a5276' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#aed6f1', marginTop: 4 },
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
