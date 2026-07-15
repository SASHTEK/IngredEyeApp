import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { StatusBar } from 'expo-status-bar'; 


import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ScanScreen from './screens/ScanScreen';
import ScanBarcodeScreen from './screens/ScanBarcodeScreen';
import ShareScreen from './screens/ShareScreen';
import ProfileScreen from './screens/ProfileScreen';
import PinnedItemsScreen from './screens/PinnedItemsScreen';
import HelpScreen from './screens/HelpScreen';
import AboutScreen from './screens/AboutScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const [unseenCount, setUnseenCount] = useState(0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0b9414',
        tabBarInactiveTintColor: 'gray',
        tabBarBadge: route.name === 'Share' && unseenCount > 0 ? unseenCount : undefined,
        tabBarBadgeStyle: {
          backgroundColor: '#d32f2f',
          fontSize: 11,
          fontWeight: 'bold',
          minWidth: 20,
          height: 20,
          lineHeight: 20,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Scan') {
            iconName = 'document-text-outline';
          } else if (route.name === 'Barcode') {
            iconName = 'barcode-outline';
          } else if (route.name === 'Share') {
            iconName = 'share-outline';
          } else if (route.name === 'Pinned') {
            iconName = 'bookmark-outline';
          } else if (route.name === 'Profile') {
            iconName = 'person-outline';  
          } else {
            iconName = 'ellipsis-horizontal-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Barcode" component={ScanBarcodeScreen} />
      <Tab.Screen name="Share">
        {() => <ShareScreen onUnseenCountChange={setUnseenCount} />}
      </Tab.Screen>
      <Tab.Screen name="Pinned" component={PinnedItemsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>

        {/* <StatusBar style="light" /> */}

        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
