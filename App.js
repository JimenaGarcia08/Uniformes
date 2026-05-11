import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, View, Text, ActivityIndicator } from 'react-native'; // ✅ agrega ActivityIndicator
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';

import LoginScreen from './screens/LoginScreen';
import InventarioScreen from './screens/InventarioScreen';
import MovimientosScreen from './screens/MovimientosScreen';
import AgregarUniformeScreen from './screens/AgregarUniformeScreen';
import ConfiguracionScreen from './screens/ConfiguracionScreen';

import { AuthProvider, useAuth } from './context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomTabBarButton = () => {
  const navigation = useNavigation();
  const state = navigation.getState();
  const activeRouteName = state?.routes[state.index]?.name;

  return (
    <TouchableOpacity
      style={styles.addButtonWrapper}
      onPress={() => navigation.navigate('Agregar', { from: activeRouteName })}
      activeOpacity={0.8}
    >
      <View style={styles.addButton}>
        <Ionicons name="add" size={32} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );
};

const MainTabs = () => {
  const { rol } = useAuth();
  const esAdmin = rol === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inventario') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Movimientos') iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          else if (route.name === 'Configuración') iconName = focused ? 'settings' : 'settings-outline';
          if (iconName) return <Ionicons name={iconName} size={size} color={color} />;
          return null;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: styles.tabBar,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inventario" component={InventarioScreen} />
      <Tab.Screen name="Movimientos" component={MovimientosScreen} />

      {esAdmin && (
        <Tab.Screen
          name="Agregar"
          component={AgregarUniformeScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: () => null,
            tabBarButton: () => <CustomTabBarButton />,
          }}
        />
      )}

      <Tab.Screen name="Configuración" component={ConfiguracionScreen} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {usuario ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <GluestackUIProvider config={config}>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GluestackUIProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addButtonWrapper: {
    top: -20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
});