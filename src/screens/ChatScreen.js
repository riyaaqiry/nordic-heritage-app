import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { chatAboutSites } from '../services/api';
import { getCurrentLocation } from '../services/location';

// AI-guide om världsarv nära användaren. Backend (/unesco/chat) kräver
// inloggning, så vi visar en uppmaning att logga in om token saknas.
export default function ChatScreen() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', text }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('access_token').then((t) => setLoggedIn(!!t));
    }, [])
  );

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);

    let lat;
    let lon;
    try {
      const loc = await getCurrentLocation();
      lat = loc.coords.latitude;
      lon = loc.coords.longitude;
    } catch (e) {
      // Ingen position tillgänglig — backend faller tillbaka på Borlänge.
    }

    try {
      const res = await chatAboutSites({ message: text, lat, lon, pageLang: 'sv' });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoTitle}>AI-guide om världsarv</Text>
        <Text style={styles.infoText}>
          Logga in under fliken Inställningar för att ställa frågor om
          världsarv nära dig.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && (
          <Text style={styles.placeholder}>
            Fråga t.ex. "Vilka världsarv finns nära mig?" eller "Berätta om
            Drottningholm".
          </Text>
        )}
        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              m.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text style={m.role === 'user' ? styles.userText : styles.aiText}>
              {m.text}
            </Text>
          </View>
        ))}
        {loading && (
          <ActivityIndicator style={{ marginTop: 12 }} color="#1a5276" />
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Skriv en fråga…"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={send}
          disabled={loading}
        >
          <Text style={styles.sendText}>Skicka</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f5f6fa',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  infoText: { fontSize: 15, color: '#7f8c8d', textAlign: 'center', lineHeight: 21 },
  messages: { flex: 1 },
  messagesContent: { padding: 16 },
  placeholder: { color: '#95a5a6', fontSize: 14, textAlign: 'center', marginTop: 24 },
  bubble: {
    maxWidth: '85%',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1a5276' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e4e8' },
  userText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  aiText: { color: '#2c3e50', fontSize: 15, lineHeight: 21 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e4e8',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  sendButton: {
    backgroundColor: '#1a5276',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
