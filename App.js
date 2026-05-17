import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

// Importera bakgrundsuppgiften så den registreras
import './src/services/locationTask';

import HomeScreen from './src/screens/HomeScreen';
import WidgetScreen from './src/screens/WidgetScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    // Lyssna på notiser som öppnas (användaren trycker på notisen)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notis öppnad:', data);
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a5276' },
          headerTintColor: '#fff',
          tabBarActiveTintColor: '#1a5276',
          tabBarInactiveTintColor: '#999',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Upptäck',
            headerShown: false,
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🗺️</Text>,
          }}
        />
        <Tab.Screen
          name="Widget"
          component={WidgetScreen}
          options={{
            title: 'Annonsmodul',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📰</Text>,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Inställningar',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
