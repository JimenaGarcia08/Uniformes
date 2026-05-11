import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, InputField, InputSlot, InputIcon, Heading, VStack, Box, Image } from '@gluestack-ui/themed';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
  setError('');

  if (!username.trim()) {
    setError('Por favor ingresa tu usuario');
    return;
  }
  if (!password.trim()) {
    setError('Por favor ingresa tu contraseña');
    return;
  }

  Keyboard.dismiss();
  setIsLoading(true);

  try {
    const emailFake = username.trim() + "@app.com";
    await signInWithEmailAndPassword(auth, emailFake, password);
    // ✅ Sin navigation.replace — el RootNavigator detecta el login y navega solo

  } catch (e) {
    switch (e.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        setError('Usuario o contraseña incorrectos');
        break;
      case 'auth/too-many-requests':
        setError('Demasiados intentos. Intenta más tarde');
        break;
      default:
        setError('Ocurrió un error. Intenta de nuevo');
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <VStack space="xl" style={styles.content}>

          {/* Logo */}
          <Box style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../assets/file.png')}
                style={styles.logoImage}
                alt="Logo de la app"
              />
            </View>
            <Heading size="2xl" style={styles.appTitle}>
              Almacén
            </Heading>
            <Text style={styles.subtitle}>
              Sistema de inventario de uniformes
            </Text>
          </Box>

          {/* Formulario */}
          <VStack space="md" style={styles.formContainer}>

            {/* Usuario */}
            <Input variant="outline" size="lg" style={styles.input}>
              <InputSlot pl="$3">
                <InputIcon as={Ionicons} name="person-outline" />
              </InputSlot>
              <InputField
                placeholder="Usuario"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>

            {/* Contraseña */}
            <Input variant="outline" size="lg" style={styles.input}>
              <InputSlot pl="$3">
                <InputIcon as={Ionicons} name="lock-closed-outline" />
              </InputSlot>
              <InputField
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </Input>

            {/* Error en pantalla */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Botón login */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

          </VStack>

        </VStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  appTitle: {
    color: '#1f2937',
    marginBottom: 8,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    height: 55,
  },
  eyeIcon: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoBox: {
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  demoText: {
    fontSize: 11,
    color: '#6b7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});

export default LoginScreen;