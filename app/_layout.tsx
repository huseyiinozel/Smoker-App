import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 0;

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#f5f5f5',
            height: 40 + bottomPadding,
            paddingBottom: 10 + bottomPadding,
            paddingTop: 5,
          },
          tabBarActiveTintColor: 'green',
          tabBarInactiveTintColor: '#7f8c8d',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          tabBarIconStyle: {
            marginBottom: -4,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="(tabs)/index"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Entypo name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(tabs)/history"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="history" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}