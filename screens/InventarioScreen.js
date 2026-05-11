import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, InputField, InputSlot, InputIcon, Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop,
  SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, Heading, HStack, VStack, Box } from '@gluestack-ui/themed';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const InventarioScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondicion, setSelectedCondicion] = useState('');
  const [inventario, setInventario] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const condiciones = ['Nuevo', 'Usado'];

  // Cargar uniformes desde Firebase
  const cargarUniformes = async () => {
    try {
      setError('');
      const q = query(collection(db, 'uniformes'), orderBy('creadoEn', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const uniformes = [];
      querySnapshot.forEach((doc) => {
        uniformes.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setInventario(uniformes);
    } catch (error) {
      console.error('Error al cargar uniformes:', error);
      setError('No se pudieron cargar los uniformes. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar al iniciar la pantalla
  useEffect(() => {
    cargarUniformes();
  }, []);

  // Manejar refresh manual
  const onRefresh = () => {
    setRefreshing(true);
    cargarUniformes();
  };

  // Filtrar uniformes según búsqueda y condición
  const filteredItems = inventario.filter((item) => {
    const matchesSearch = 
      (item.nombre?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.marca?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesCondicion = selectedCondicion === '' || item.condicion === selectedCondicion;
    return matchesSearch && matchesCondicion;
  });

  // Mostrar loading mientras carga
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
        <View style={styles.header}>
          <Heading size="xl" style={styles.appTitle}>
            Inventario de Uniformes
          </Heading>
          <Text style={styles.subtitle}>Stock actual por producto</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando inventario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      
      <View style={styles.header}>
        <Heading size="xl" style={styles.appTitle}>
          Inventario de Uniformes
        </Heading>
        <Text style={styles.subtitle}>
          Stock actual {inventario.length > 0 ? `(${inventario.length} productos)` : ''}
        </Text>
      </View>

      {/* Búsqueda y filtros */}
      <View style={styles.searchSection}>
        <Input variant="rounded" size="md" style={styles.searchInput}>
          <InputSlot pl="$3">
            <InputIcon as={Ionicons} name="search-outline" />
          </InputSlot>
          <InputField
            placeholder="Buscar por producto o marca..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Input>

        <Select
          selectedValue={selectedCondicion}
          onValueChange={setSelectedCondicion}
        >
          <SelectTrigger variant="rounded" size="md" style={styles.selectTrigger}>
            <SelectInput
              placeholder="Todas las condiciones"
              value={
                selectedCondicion === 'Nuevo' ? 'Nuevo' :
                selectedCondicion === 'Usado' ? 'Usado' :
                'Todas las condiciones'
              }
            />
            <SelectIcon as={Ionicons} name="chevron-down-outline" mr="$2" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              <SelectItem label="Todas las condiciones" value="" />
              {condiciones.map((condicion) => (
                <SelectItem key={condicion} label={condicion} value={condicion} />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
      </View>

      {/* Mensaje de error */}
      {error !== '' && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={cargarUniformes}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de inventario */}
      {filteredItems.length === 0 && !error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={60} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No hay uniformes</Text>
          <Text style={styles.emptyText}>
            {searchQuery || selectedCondicion
              ? 'No se encontraron resultados con esos filtros'
              : 'Presiona el botón + para agregar tu primer uniforme'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
          }
        >
          <VStack space="md" paddingBottom="$20">
            {filteredItems.map((item) => (
              <Box
                key={item.id}
                bg="$white"
                borderRadius="$lg"
                padding="$4"
                marginHorizontal="$4"
                marginVertical="$2"
                style={styles.card}
              >
                <VStack space="sm">
                  <HStack justifyContent="space-between" alignItems="center">
                    <VStack flex={1}>
                      <Heading size="sm">{item.nombre || 'Sin nombre'}</Heading>
                      {item.marca && (
                        <Text style={styles.marcaText}>{item.marca}</Text>
                      )}
                    </VStack>
                    <View style={[
                      styles.cantidadBadge,
                      item.cantidad < 5 && styles.cantidadBaja
                    ]}>
                      <Text style={styles.cantidadTexto}>Stock: {item.cantidad || 0}</Text>
                    </View>
                  </HStack>
                  
                  <HStack space="md" style={styles.detailsContainer}>
                    {item.talla && (
                      <View style={styles.detailItem}>
                        <Ionicons name="shirt-outline" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>Talla: {item.talla}</Text>
                      </View>
                    )}
                    {item.color && (
                      <View style={styles.detailItem}>
                        <Ionicons name="color-palette-outline" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>Color: {item.color}</Text>
                      </View>
                    )}
                  </HStack>
                  
                  {item.ubicacion && (
                    <View style={styles.detailItem}>
                      <Ionicons name="location-outline" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{item.ubicacion}</Text>
                    </View>
                  )}
                  
                  <View style={styles.detailItem}>
                    <Ionicons 
                      name={item.condicion === 'Nuevo' ? "checkmark-circle-outline" : "refresh-circle-outline"} 
                      size={16} 
                      color={item.condicion === 'Nuevo' ? '#10b981' : '#f59e0b'} 
                    />
                    <Text style={[
                      styles.detailText,
                      item.condicion === 'Nuevo' ? styles.condicionNuevo : styles.condicionUsado
                    ]}>
                      Condición: {item.condicion || 'No especificada'}
                    </Text>
                  </View>
                </VStack>
              </Box>
            ))}
          </VStack>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

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
  },
  appTitle: {
    color: '#1f2937',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  selectTrigger: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    height: 44,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  marcaText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  cantidadBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cantidadBaja: {
    backgroundColor: '#ef4444',
  },
  cantidadTexto: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#4b5563',
  },
  condicionNuevo: {
    color: '#10b981',
  },
  condicionUsado: {
    color: '#f59e0b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
  },
  retryText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});

export default InventarioScreen;