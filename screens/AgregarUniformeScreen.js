import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Heading, Input, InputField, Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent,
  SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, Button, ButtonText, VStack, HStack } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function AgregarUniformeScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    color: '',
    talla: '',
    condicion: '',
    caja: '',
    bodega: '',
    cantidad: '',
  });

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const condiciones = ['Nuevo', 'Usado'];
  const bodegas = ['Alfa', 'Bravo', 'Coca', 'Delta', 'Eco', 'Fox'];
  const colores = ['Azul', 'Negro'];

  const handleRegresar = () => {
    const origen = route.params?.from;
    if (origen && origen !== 'Agregar') {
      navigation.navigate(origen);
    } else {
      navigation.navigate('Inventario');
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.nombre) {
      setError('El nombre del producto es obligatorio');
      return;
    }
    if (!formData.color) {
      setError('El color es obligatorio');
      return;
    }
    if (!formData.talla) {
      setError('La talla es obligatoria');
      return;
    }
    if (!formData.condicion) {
      setError('La condición es obligatoria');
      return;
    }
    if (!formData.caja) {
      setError('La caja es obligatoria');
      return;
    }
    if (!formData.bodega) {
      setError('La bodega es obligatoria');
      return;
    }
    if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Guardar en Firebase
      await addDoc(collection(db, 'uniformes'), {
        nombre: formData.nombre,
        marca: formData.marca || '',
        color: formData.color,
        talla: formData.talla,
        condicion: formData.condicion,
        caja: formData.caja,
        bodega: formData.bodega,
        cantidad: parseInt(formData.cantidad),
        ubicacion: `Caja ${formData.caja} - Bodega ${formData.bodega}`,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });

      setSuccess(true);
      
      // Mostrar alerta de éxito
      Alert.alert(
        '¡Éxito!',
        'Uniforme guardado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              handleRegresar();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error al guardar:', error);
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
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Heading size="xl" style={styles.appTitle}>
            Agregar Uniforme
          </Heading>
        </HStack>
        <Text style={styles.subtitle}>Completa los datos del producto</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="lg" padding="$4" paddingBottom="$40">
          {/* Mensaje de error */}
          {error !== '' && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.successText}>¡Uniforme guardado con éxito!</Text>
            </View>
          )}

          {/* Nombre del producto */}
          <VStack space="xs">
            <Text style={styles.label}>Nombre del producto *</Text>
            <Input variant="rounded" size="md" style={styles.input}>
              <InputField
                placeholder="Ej: Camisa de Proximidad"
                value={formData.nombre}
                onChangeText={(text) => setFormData({ ...formData, nombre: text })}
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
                onChangeText={(text) => setFormData({ ...formData, marca: text })}
              />
            </Input>
          </VStack>

          {/* Color */}
          <VStack space="xs">
            <Text style={styles.label}>Color *</Text>
            <Select
              selectedValue={formData.color}
              onValueChange={(value) => setFormData({ ...formData, color: value })}
            >
              <SelectTrigger variant="rounded" size="md" style={styles.selectTrigger}>
                <SelectInput placeholder="Seleccionar color" />
                <SelectIcon as={Ionicons} name="chevron-down-outline" mr="$2" />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {colores.map((color) => (
                    <SelectItem key={color} label={color} value={color} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>

          {/* Talla */}
          <VStack space="xs">
            <Text style={styles.label}>Talla *</Text>
            <Input variant="rounded" size="md" style={styles.input}>
              <InputField
                placeholder="Ej: M, L, XL, 32, 34, etc."
                value={formData.talla}
                onChangeText={(text) => setFormData({ ...formData, talla: text })}
              />
            </Input>
          </VStack>

          {/* Condición */}
          <VStack space="xs">
            <Text style={styles.label}>Condición *</Text>
            <Select
              selectedValue={formData.condicion}
              onValueChange={(value) => setFormData({ ...formData, condicion: value })}
            >
              <SelectTrigger variant="rounded" size="md" style={styles.selectTrigger}>
                <SelectInput placeholder="Seleccionar condición" />
                <SelectIcon as={Ionicons} name="chevron-down-outline" mr="$2" />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {condiciones.map((cond) => (
                    <SelectItem key={cond} label={cond} value={cond} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>

          {/* Caja y Bodega */}
          <HStack space="md">
            <VStack flex={1} space="xs">
              <Text style={styles.label}>Caja *</Text>
              <Input variant="rounded" size="md" style={styles.input}>
                <InputField
                  placeholder="Ej: A1, B2"
                  value={formData.caja}
                  onChangeText={(text) => setFormData({ ...formData, caja: text })}
                />
              </Input>
            </VStack>

            <VStack flex={1} space="xs">
              <Text style={styles.label}>Bodega *</Text>
              <Select
                selectedValue={formData.bodega}
                onValueChange={(value) => setFormData({ ...formData, bodega: value })}
              >
                <SelectTrigger variant="rounded" size="md" style={styles.selectTrigger}>
                  <SelectInput placeholder="Seleccionar" />
                  <SelectIcon as={Ionicons} name="chevron-down-outline" mr="$2" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {bodegas.map((bodega) => (
                      <SelectItem key={bodega} label={bodega} value={bodega} />
                    ))}
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
                onChangeText={(text) => setFormData({ ...formData, cantidad: text })}
              />
            </Input>
          </VStack>

          {/* Botones */}
          <VStack space="md" marginTop="$4">
            <Button
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ButtonText style={styles.submitButtonText}>Guardar Uniforme</ButtonText>
              )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  selectTrigger: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    height: 44,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  successText: {
    flex: 1,
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    height: 48,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderColor: '#e5e7eb',
    borderRadius: 8,
    height: 48,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
});