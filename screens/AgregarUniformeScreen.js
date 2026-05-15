import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import {
  Heading, Input, InputField, Select, SelectTrigger, SelectInput,
  SelectIcon, SelectPortal, SelectBackdrop, SelectContent,
  SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem,
  Button, ButtonText, VStack, HStack
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { scale, clamp } from '../utils/responsive';

export default function AgregarUniformeScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [formData, setFormData] = useState({
    nombre: '', marca: '', color: '', talla: '',
    condicion: '', caja: '', bodega: '', cantidad: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  const condiciones = ['Nuevo', 'Usado'];
  const bodegas     = ['Alfa', 'Bravo', 'Coca', 'Delta', 'Eco', 'Fox'];
  const colores     = ['Azul', 'Negro'];

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleRegresar = () => {
    const origen = route.params?.from;
    navigation.navigate(origen && origen !== 'Agregar' ? origen : 'Inventario');
  };

  const handleSubmit = async () => {
    const checks = [
      [!formData.nombre,                          'El nombre del producto es obligatorio'],
      [!formData.color,                           'El color es obligatorio'],
      [!formData.talla,                           'La talla es obligatoria'],
      [!formData.condicion,                       'La condición es obligatoria'],
      [!formData.caja,                            'La caja es obligatoria'],
      [!formData.bodega,                          'La bodega es obligatoria'],
      [!formData.cantidad || parseInt(formData.cantidad) <= 0, 'La cantidad debe ser mayor a 0'],
    ];
    const fail = checks.find(([cond]) => cond);
    if (fail) { setError(fail[1]); return; }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await addDoc(collection(db, 'uniformes'), {
        nombre:    formData.nombre,
        marca:     formData.marca || '',
        color:     formData.color,
        talla:     formData.talla,
        condicion: formData.condicion,
        caja:      formData.caja,
        bodega:    formData.bodega,
        cantidad:  parseInt(formData.cantidad),
        ubicacion: `Caja ${formData.caja} - Bodega ${formData.bodega}`,
        creadoEn:      serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });
      setSuccess(true);
      Alert.alert('¡Éxito!', 'Uniforme guardado correctamente', [
        { text: 'OK', onPress: handleRegresar },
      ]);
    } catch (err) {
      console.error('Error al guardar:', err);
      setError('No se pudo guardar. Verifica tu conexión e intenta de nuevo');
      Alert.alert('Error', 'No se pudo guardar el uniforme. Intenta de nuevo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <HStack alignItems="center" space="md">
          <TouchableOpacity onPress={handleRegresar} style={styles.backButton}>
            <Ionicons name="arrow-back" size={scale(22)} color="#1f2937" />
          </TouchableOpacity>
          <Heading size="lg" style={styles.appTitle}>Agregar Uniforme</Heading>
        </HStack>
        <Text style={styles.subtitle}>Completa los datos del producto</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="md" padding="$3" paddingBottom="$40">

          {error !== '' && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={scale(18)} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={scale(18)} color="#10b981" />
              <Text style={styles.successText}>¡Uniforme guardado con éxito!</Text>
            </View>
          )}

          {/* Nombre */}
          <VStack space="xs">
            <Text style={styles.label}>Nombre del producto *</Text>
            <Input variant="rounded" size="md" style={styles.input}>
              <InputField
                placeholder="Ej: Camisa de Proximidad"
                value={formData.nombre}
                onChangeText={(t) => update('nombre', t)}
                style={styles.inputText}
              />
            </Input>
          </VStack>

          {/* Marca */}
          <VStack space="xs">
            <Text style={styles.label}>Marca</Text>
            <Input variant="rounded" size="md" style={styles.input}>
              <InputField
                placeholder="Ej: First Tactical"
                value={formData.marca}
                onChangeText={(t) => update('marca', t)}
                style={styles.inputText}
              />
            </Input>
          </VStack>

          {/* Color */}
          <VStack space="xs">
            <Text style={styles.label}>Color *</Text>
            <Select selectedValue={formData.color} onValueChange={(v) => update('color', v)}>
              <SelectTrigger variant="rounded" size="md" style={styles.selectTrigger}>
                <SelectInput placeholder="Seleccionar color" style={styles.inputText} />
                <SelectIcon as={Ionicons} name="chevron-down-outline" mr="$2" />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                  {colores.map((c) => <SelectItem key={c} label={c} value={c} />)}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>

          {/* Talla */}
          <VStack space="xs">
            <Text style={styles.label}>Talla *</Text>
            <Input variant="rounded" size="md" style={styles.input}>
              <InputField
                placeholder="Ej: M, L, XL, 32, 34…"
                value={formData.talla}
                onChangeText={(t) => update('talla', t)}
                style={styles.inputText}
              />
            </Input>
          </VStack>

          {/* Condición */}
          <VStack space="xs">
            <Text style={styles.label}>Condición *</Text>
            <Select selectedValue={formData.condicion} onValueChange={(v) => update('condicion', v)}>
              <SelectTrigger variant="rounded" size="md" style={styles.selectTrigger}>
                <SelectInput placeholder="Seleccionar condición" style={styles.inputText} />
                <SelectIcon as={Ionicons} name="chevron-down-outline" mr="$2" />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                  {condiciones.map((c) => <SelectItem key={c} label={c} value={c} />)}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>

          {/* Caja + Bodega en fila */}
          <HStack space="sm">
            <VStack flex={1} space="xs">
              <Text style={styles.label}>Caja *</Text>
              <Input variant="rounded" size="md" style={styles.input}>
                <InputField
                  placeholder="Ej: A1"
                  value={formData.caja}
                  onChangeText={(t) => update('caja', t)}
                  style={styles.inputText}
                />
              </Input>
            </VStack>

            <VStack flex={1} space="xs">
              <Text style={styles.label}>Bodega *</Text>
              <Select selectedValue={formData.bodega} onValueChange={(v) => update('bodega', v)}>
                <SelectTrigger variant="rounded" size="md" style={styles.selectTrigger}>
                  <SelectInput placeholder="Seleccionar" style={styles.inputText} />
                  <SelectIcon as={Ionicons} name="chevron-down-outline" mr="$2" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                    {bodegas.map((b) => <SelectItem key={b} label={b} value={b} />)}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </VStack>
          </HStack>

          {/* Cantidad */}
          <VStack space="xs">
            <Text style={styles.label}>Cantidad inicial *</Text>
            <Input variant="rounded" size="md" style={styles.input}>
              <InputField
                placeholder="Ej: 10"
                keyboardType="numeric"
                value={formData.cantidad}
                onChangeText={(t) => update('cantidad', t)}
                style={styles.inputText}
              />
            </Input>
          </VStack>

          {/* Botones */}
          <VStack space="sm" marginTop="$3">
            <Button
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#ffffff" />
                : <ButtonText style={styles.submitButtonText}>Guardar Uniforme</ButtonText>
              }
            </Button>

            <Button
              variant="outline"
              style={styles.cancelButton}
              onPress={handleRegresar}
              disabled={isLoading}
            >
              <ButtonText style={styles.cancelButtonText}>Cancelar</ButtonText>
            </Button>
          </VStack>

        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingHorizontal: clamp(14, 12, 24),
    paddingTop: clamp(14, 12, 22),
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  appTitle: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: clamp(17, 15, 22),
  },
  subtitle: {
    fontSize: clamp(12, 11, 14),
    color: '#6b7280',
    marginTop: 4,
    marginLeft: clamp(30, 28, 38),
  },
  label: {
    fontSize: clamp(13, 12, 15),
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  inputText: {
    fontSize: clamp(13, 12, 15),
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  selectTrigger: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    height: clamp(42, 40, 48),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: clamp(10, 8, 14),
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: clamp(12, 11, 14),
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d1fae5',
    padding: clamp(10, 8, 14),
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  successText: {
    flex: 1,
    color: '#059669',
    fontSize: clamp(12, 11, 14),
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    height: clamp(46, 44, 52),
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: clamp(14, 13, 16),
    fontWeight: '600',
  },
  cancelButton: {
    borderColor: '#e5e7eb',
    borderRadius: 8,
    height: clamp(46, 44, 52),
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: clamp(14, 13, 16),
  },
});