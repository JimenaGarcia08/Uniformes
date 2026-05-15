import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Input, InputField, InputSlot, InputIcon,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal,
  SelectBackdrop, SelectContent, SelectDragIndicatorWrapper,
  SelectDragIndicator, SelectItem, Heading, HStack, VStack, Box
} from '@gluestack-ui/themed';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// ─── helpers responsivos ────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const BASE_W = 390;                          // diseño base (iPhone 14)
const scale  = (size) => Math.round(size * (SCREEN_W / BASE_W));
const clamp  = (size, min, max) => Math.min(Math.max(scale(size), min), max);
// ────────────────────────────────────────────────────────────────────────────

const InventarioScreen = () => {
  const [searchQuery,       setSearchQuery]       = useState('');
  const [selectedCondicion, setSelectedCondicion] = useState('');
  const [inventario,        setInventario]        = useState([]);
  const [isLoading,         setIsLoading]         = useState(true);
  const [refreshing,        setRefreshing]        = useState(false);
  const [error,             setError]             = useState('');

  const condiciones = ['Nuevo', 'Usado'];

  const cargarUniformes = async () => {
    try {
      setError('');
      const q = query(collection(db, 'uniformes'), orderBy('creadoEn', 'desc'));
      const querySnapshot = await getDocs(q);
      const uniformes = [];
      querySnapshot.forEach((doc) => uniformes.push({ id: doc.id, ...doc.data() }));
      setInventario(uniformes);
    } catch (err) {
      console.error('Error al cargar uniformes:', err);
      setError('No se pudieron cargar los uniformes. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargarUniformes(); }, []);

  const onRefresh = () => { setRefreshing(true); cargarUniformes(); };

  const filteredItems = inventario.filter((item) => {
    const matchesSearch =
      (item.nombre?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.marca?.toLowerCase()  || '').includes(searchQuery.toLowerCase());
    const matchesCondicion =
      selectedCondicion === '' || item.condicion === selectedCondicion;
    return matchesSearch && matchesCondicion;
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
        <View style={styles.header}>
          <Heading size="lg" style={styles.appTitle}>Inventario de Uniformes</Heading>
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

      {/* Header */}
      <View style={styles.header}>
        <Heading size="lg" style={styles.appTitle}>Inventario de Uniformes</Heading>
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
            style={styles.inputText}
          />
        </Input>

        <Select selectedValue={selectedCondicion} onValueChange={setSelectedCondicion}>
          <SelectTrigger variant="rounded" size="md" style={styles.selectTrigger}>
            <SelectInput
              placeholder="Todas las condiciones"
              value={
                selectedCondicion === 'Nuevo' ? 'Nuevo' :
                selectedCondicion === 'Usado' ? 'Usado' :
                'Todas las condiciones'
              }
              style={styles.inputText}
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
              {condiciones.map((c) => (
                <SelectItem key={c} label={c} value={c} />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
      </View>

      {/* Error */}
      {error !== '' && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={scale(18)} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={cargarUniformes}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista vacía */}
      {filteredItems.length === 0 && !error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={scale(52)} color="#9ca3af" />
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
            />
          }
        >
          <VStack space="sm" paddingBottom="$20">
            {filteredItems.map((item) => (
              <Box
                key={item.id}
                bg="$white"
                borderRadius="$lg"
                padding="$3"
                marginHorizontal="$3"
                marginVertical="$1"
                style={styles.card}
              >
                <VStack space="xs">
                  {/* Fila superior: nombre + badge */}
                  <HStack justifyContent="space-between" alignItems="flex-start">
                    <VStack flex={1} style={{ marginRight: 8 }}>
                      <Heading size="sm" numberOfLines={2} style={styles.itemNombre}>
                        {item.nombre || 'Sin nombre'}
                      </Heading>
                      {item.marca && (
                        <Text style={styles.marcaText} numberOfLines={1}>
                          {item.marca}
                        </Text>
                      )}
                    </VStack>
                    <View style={[
                      styles.cantidadBadge,
                      item.cantidad < 5 && styles.cantidadBaja
                    ]}>
                      <Text style={styles.cantidadTexto}>
                        Stock: {item.cantidad ?? 0}
                      </Text>
                    </View>
                  </HStack>

                  {/* Talla y color */}
                  <HStack flexWrap="wrap" style={{ gap: 8, marginTop: 4 }}>
                    {item.talla && (
                      <View style={styles.detailItem}>
                        <Ionicons name="shirt-outline" size={scale(14)} color="#6b7280" />
                        <Text style={styles.detailText}>Talla: {item.talla}</Text>
                      </View>
                    )}
                    {item.color && (
                      <View style={styles.detailItem}>
                        <Ionicons name="color-palette-outline" size={scale(14)} color="#6b7280" />
                        <Text style={styles.detailText}>{item.color}</Text>
                      </View>
                    )}
                  </HStack>

                  {/* Ubicación */}
                  {item.ubicacion && (
                    <View style={styles.detailItem}>
                      <Ionicons name="location-outline" size={scale(14)} color="#6b7280" />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {item.ubicacion}
                      </Text>
                    </View>
                  )}

                  {/* Condición */}
                  <View style={styles.detailItem}>
                    <Ionicons
                      name={item.condicion === 'Nuevo'
                        ? 'checkmark-circle-outline'
                        : 'refresh-circle-outline'}
                      size={scale(14)}
                      color={item.condicion === 'Nuevo' ? '#10b981' : '#f59e0b'}
                    />
                    <Text style={[
                      styles.detailText,
                      item.condicion === 'Nuevo'
                        ? styles.condicionNuevo
                        : styles.condicionUsado
                    ]}>
                      {item.condicion || 'No especificada'}
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
    paddingHorizontal: clamp(14, 12, 24),
    paddingTop: clamp(14, 12, 24),
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  appTitle: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: clamp(17, 15, 22),
  },
  subtitle: {
    fontSize: clamp(12, 11, 15),
    color: '#6b7280',
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: clamp(12, 10, 20),
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  inputText: {
    fontSize: clamp(13, 12, 16),
  },
  selectTrigger: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    height: clamp(40, 38, 48),
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemNombre: {
    fontSize: clamp(13, 12, 16),
    color: '#1f2937',
  },
  marcaText: {
    fontSize: clamp(11, 10, 13),
    color: '#6b7280',
    marginTop: 1,
  },
  cantidadBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: clamp(8, 6, 12),
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',   // ← no estira el badge
  },
  cantidadBaja: {
    backgroundColor: '#ef4444',
  },
  cantidadTexto: {
    color: '#ffffff',
    fontSize: clamp(11, 10, 13),
    fontWeight: '600',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: clamp(11, 10, 13),
    color: '#4b5563',
  },
  condicionNuevo: { color: '#10b981' },
  condicionUsado: { color: '#f59e0b' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: clamp(13, 12, 15),
    color: '#6b7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: clamp(10, 8, 14),
    margin: clamp(12, 10, 20),
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: clamp(12, 11, 14),
  },
  retryText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: clamp(12, 11, 14),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: clamp(15, 14, 19),
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 10,
  },
  emptyText: {
    fontSize: clamp(12, 11, 15),
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 6,
  },
});

export default InventarioScreen;