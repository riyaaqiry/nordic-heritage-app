import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { API_BASE_URL } from '../config';

export default function WidgetScreen({ route }) {
  const siteId = route?.params?.siteId;
  const widgetUrl = siteId
    ? `${API_BASE_URL}/widget?id=${siteId}`
    : `${API_BASE_URL}/widget`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: widgetUrl }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#1a5276" />
          </View>
        )}
        geolocationEnabled={true}
        javaScriptEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
});
