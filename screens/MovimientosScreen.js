import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Modal, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Heading, HStack, VStack, Box, Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent,
  SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, Input, InputField, Button, ButtonText } from '@gluestack-ui/themed';
import { registrarMovimiento, getMovimientos, getInventario } from '../services/inventarioService';
import { useAuth } from '../context/AuthContext';
import { scale, clamp } from '../utils/responsive'; 

const MovimientosScreen = () => {
  const { rol } = useAuth();
  const esAdmin = rol === 'admin';

  const [filterTipo,     setFilterTipo]     = useState('');
  const [movimientos,    setMovimientos]    = useState([]);
  const [inventario,     setInventario]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [modalVisible,   setModalVisible]   = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState('entrada');
  const [formData, setFormData] = useState({
    inventarioId: '', cantidad: '', quienEntrega: '', quienRecibe: '', observaciones: '',
  });

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [inventarioData, movimientosData] = await Promise.all([
        getInventario(), getMovimientos()
      ]);
      setInventario(inventarioData);
      setMovimientos(movimientosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const filteredMovimientos = movimientos.filter(
    (mov) => filterTipo === '' || mov.tipo === filterTipo
  );

  const getSelectedInventory = () =>
    inventario.find((i) => i.id === formData.inventarioId);

  const update = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const resetFormulario = () => {
    setFormData({ inventarioId: '', cantidad: '', quienEntrega: '', quienRecibe: '', observaciones: '' });
    setMovimientoTipo('entrada');
  };

  const handleRegistrarMovimiento = async () => {
    if (!formData.inventarioId) { Alert.alert('Error', 'Selecciona un producto'); return; }
    if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida'); return;
    }
    const inventarioItem = getSelectedInventory();
    try {
      await registrarMovimiento({
        inventarioId: formData.inventarioId,
        tipo: movimientoTipo,
        cantidad: parseInt(formData.cantidad),
        quienEntrega: formData.quienEntrega || '—',
        quienRecibe:  formData.quienRecibe  || '—',
        observaciones: formData.observaciones,
        productoInfo: {
          producto:  inventarioItem.producto,
          talla:     inventarioItem.talla,
          condicion: inventarioItem.condicion,
          ubicacion: inventarioItem.ubicacion,
        },
      });
      await cargarDatos();
      setModalVisible(false);
      resetFormulario();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      {/* Header */}
      <View style={styles.header}>
        <Heading size="lg" style={styles.appTitle}>Movimientos</Heading>
        <Text style={styles.subtitle}>Historial de entradas y salidas</Text>
      </View>

      {/* Filtro */}
      <View style={styles.filterSection}>
        <Select selectedValue={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger variant="rounded" size="md" style={styles.selectTrigger}>
            <SelectInput
              placeholder="Todos los movimientos"
              value={
                filterTipo === 'entrada' ? 'Solo entradas' :
                filterTipo === 'salida'  ? 'Solo salidas'  :
                'Todos los movimientos'
              }
              style={styles.inputText}
            />
            <SelectIcon as={Ionicons} name="chevron-down-outline" mr="$2" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
              <SelectItem label="Todos los movimientos" value="" />
              <SelectItem label="Solo entradas"         value="entrada" />
              <SelectItem label="Solo salidas"          value="salida" />
            </SelectContent>
          </SelectPortal>
        </Select>
      </View>

      {/* Lista */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      >
        <VStack space="sm" paddingBottom="$20">
          {filteredMovimientos.length === 0 ? (
            <Box style={styles.emptyState}>
              <Ionicons name="swap-horizontal-outline" size={scale(52)} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No hay movimientos</Text>
              <Text style={styles.emptyText}>Registra tu primer movimiento</Text>
            </Box>
          ) : (
            filteredMovimientos.map((mov) => (
              <Box
                key={mov.id}
                bg="$white"
                borderRadius="$lg"
                padding="$3"
                marginHorizontal="$3"
                marginVertical="$1"
                style={styles.card}
              >
                <HStack space="sm" alignItems="flex-start">
                  {/* Ícono entrada/salida */}
                  <View style={[
                    styles.tipoIcon,
                    mov.tipo === 'entrada' ? styles.entradaIcon : styles.salidaIcon
                  ]}>
                    <Ionicons
                      name={mov.tipo === 'entrada' ? 'arrow-down' : 'arrow-up'}
                      size={scale(18)}
                      color="#ffffff"
                    />
                  </View>

                  <VStack flex={1}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <Heading
                        size="sm"
                        numberOfLines={1}
                        style={styles.productoNombre}
                      >
                        {mov.productoInfo?.producto || 'Producto'}
                      </Heading>
                      <Text style={[
                        styles.cantidadMovimiento,
                        mov.tipo === 'entrada' ? styles.entradaText : styles.salidaText
                      ]}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                      </Text>
                    </HStack>

                    <Text style={styles.detailText} numberOfLines={1}>
                      Talla: {mov.productoInfo?.talla || 'N/A'} | Cond: {mov.productoInfo?.condicion || 'N/A'}
                    </Text>
                    {mov.quienEntrega && (
                      <Text style={styles.detailText}>Entrega: {mov.quienEntrega}</Text>
                    )}
                    {mov.quienRecibe && (
                      <Text style={styles.detailText}>Recibe: {mov.quienRecibe}</Text>
                    )}
                    <Text style={styles.motivoText} numberOfLines={2}>
                      {mov.observaciones || 'Sin observaciones'}
                    </Text>
                    <HStack justifyContent="space-between" marginTop="$1">
                      <Text style={styles.fechaText}>{mov.fechaString}</Text>
                      {mov.cantidadAnterior !== undefined && (
                        <Text style={styles.stockText}>
                          {mov.cantidadAnterior} → {mov.cantidadNueva}
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))
          )}
        </VStack>
      </ScrollView>

      {/* FAB */}
      {esAdmin && (
        <TouchableOpacity style={styles.fabButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={scale(24)} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Modal */}
      {esAdmin && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => { setModalVisible(false); resetFormulario(); }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>

              <View style={styles.modalHeader}>
                <Heading size="md" style={styles.modalTitle}>Registrar Movimiento</Heading>
                <TouchableOpacity
                  onPress={() => { setModalVisible(false); resetFormulario(); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={scale(22)} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <VStack space="md" paddingBottom="$4">

                  {/* Tipo */}
                  <VStack space="xs">
                    <Text style={styles.label}>Tipo de movimiento *</Text>
                    <HStack space="sm">
                      <TouchableOpacity
                        style={[styles.tipoButton, movimientoTipo === 'entrada' && styles.tipoButtonActiveEntrada]}
                        onPress={() => setMovimientoTipo('entrada')}
                      >
                        <Ionicons name="arrow-down" size={scale(18)} color={movimientoTipo === 'entrada' ? '#ffffff' : '#10b981'} />
                        <Text style={[styles.tipoButtonText, movimientoTipo === 'entrada' && styles.tipoButtonTextActive]}>
                          Entrada
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tipoButton, movimientoTipo === 'salida' && styles.tipoButtonActiveSalida]}
                        onPress={() => setMovimientoTipo('salida')}
                      >
                        <Ionicons name="arrow-up" size={scale(18)} color={movimientoTipo === 'salida' ? '#ffffff' : '#ef4444'} />
                        <Text style={[styles.tipoButtonText, movimientoTipo === 'salida' && styles.tipoButtonTextActive]}>
                          Salida
                        </Text>
                      </TouchableOpacity>
                    </HStack>
                  </VStack>

                  {/* Producto */}
                  <VStack space="xs">
                    <Text style={styles.label}>Producto *</Text>
                    <Select
                      selectedValue={formData.inventarioId}
                      onValueChange={(v) => update('inventarioId', v)}
                    >
                      <SelectTrigger variant="rounded" size="md" style={styles.modalSelect}>
                        <SelectInput placeholder="Seleccionar producto" style={styles.inputText} />
                        <SelectIcon as={Ionicons} name="chevron-down-outline" mr="$2" />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectBackdrop />
                        <SelectContent>
                          <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                          {inventario.map((item) => (
                            <SelectItem
                              key={item.id}
                              label={`${item.producto} - ${item.talla} - ${item.condicion} (Stock: ${item.cantidad})`}
                              value={item.id}
                            />
                          ))}
                        </SelectContent>
                      </SelectPortal>
                    </Select>
                  </VStack>

                  {/* Info producto seleccionado */}
                  {formData.inventarioId && (
                    <Box style={styles.infoBox}>
                      <Text style={styles.infoTitle}>Información del producto</Text>
                      {[
                        ['Producto',   getSelectedInventory()?.producto],
                        ['Marca',      getSelectedInventory()?.marca],
                        ['Talla',      getSelectedInventory()?.talla],
                        ['Condición',  getSelectedInventory()?.condicion],
                        ['Ubicación',  getSelectedInventory()?.ubicacion],
                      ].map(([k, v]) => v ? (
                        <Text key={k} style={styles.infoText}>{k}: {v}</Text>
                      ) : null)}
                      <Text style={[styles.infoText, styles.stockText]}>
                        Stock actual: {getSelectedInventory()?.cantidad ?? 0} unidades
                      </Text>
                    </Box>
                  )}

                  {/* Cantidad */}
                  <VStack space="xs">
                    <Text style={styles.label}>Cantidad *</Text>
                    <Input variant="rounded" size="md" style={styles.modalInput}>
                      <InputField
                        placeholder="Número de unidades"
                        keyboardType="numeric"
                        value={formData.cantidad}
                        onChangeText={(t) => update('cantidad', t)}
                        style={styles.inputText}
                      />
                    </Input>
                  </VStack>

                  {/* Quién entrega */}
                  <VStack space="xs">
                    <Text style={styles.label}>Quién entrega</Text>
                    <Input variant="rounded" size="md" style={styles.modalInput}>
                      <InputField
                        placeholder="Nombre de quien entrega"
                        value={formData.quienEntrega}
                        onChangeText={(t) => update('quienEntrega', t)}
                        style={styles.inputText}
                      />
                    </Input>
                  </VStack>

                  {/* Quién recibe */}
                  <VStack space="xs">
                    <Text style={styles.label}>Quién recibe</Text>
                    <Input variant="rounded" size="md" style={styles.modalInput}>
                      <InputField
                        placeholder="Nombre de quien recibe"
                        value={formData.quienRecibe}
                        onChangeText={(t) => update('quienRecibe', t)}
                        style={styles.inputText}
                      />
                    </Input>
                  </VStack>

                  {/* Observaciones */}
                  <VStack space="xs">
                    <Text style={styles.label}>Observaciones</Text>
                    <Input variant="rounded" size="md" style={styles.modalTextArea}>
                      <InputField
                        placeholder="Notas adicionales..."
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        value={formData.observaciones}
                        onChangeText={(t) => update('observaciones', t)}
                        style={styles.inputText}
                      />
                    </Input>
                  </VStack>

                  {/* Botones */}
                  <HStack space="sm" marginTop="$3">
                    <Button
                      flex={1}
                      style={styles.modalCancelButton}
                      onPress={() => { setModalVisible(false); resetFormulario(); }}
                    >
                      <ButtonText style={styles.modalCancelButtonText}>Cancelar</ButtonText>
                    </Button>
                    <Button
                      flex={1}
                      style={[
                        styles.modalSubmitButton,
                        movimientoTipo === 'entrada'
                          ? styles.modalSubmitEntrada
                          : styles.modalSubmitSalida,
                      ]}
                      onPress={handleRegistrarMovimiento}
                    >
                      <ButtonText style={styles.modalSubmitButtonText}>
                        {movimientoTipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
                      </ButtonText>
                    </Button>
                  </HStack>

                </VStack>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f3f4f6' },
  centerContent:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:    { fontSize: clamp(13, 12, 15), color: '#6b7280' },

  header: {
    paddingHorizontal: clamp(14, 12, 24),
    paddingTop:        clamp(14, 12, 22),
    paddingBottom:     8,
    backgroundColor:   '#ffffff',
  },
  appTitle: {
    color:      '#1f2937',
    fontWeight: '700',
    fontSize:   clamp(17, 15, 22),
  },
  subtitle: {
    fontSize:  clamp(12, 11, 14),
    color:     '#6b7280',
    marginTop: 2,
  },

  filterSection: {
    paddingHorizontal: clamp(14, 12, 24),
    paddingVertical:   10,
    backgroundColor:   '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectTrigger: {
    backgroundColor: '#f9fafb',
    borderColor:     '#e5e7eb',
    height:          clamp(42, 40, 48),
  },
  inputText: { fontSize: clamp(13, 12, 15) },

  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius:  2,
    elevation:     2,
  },
  tipoIcon: {
    width:           clamp(36, 32, 44),
    height:          clamp(36, 32, 44),
    borderRadius:    clamp(18, 16, 22),
    justifyContent:  'center',
    alignItems:      'center',
    flexShrink:      0,            // ← no se comprime en pantallas chicas
  },
  entradaIcon: { backgroundColor: '#10b981' },
  salidaIcon:  { backgroundColor: '#ef4444' },

  productoNombre:    { fontSize: clamp(13, 12, 15), color: '#1f2937', flex: 1, marginRight: 6 },
  cantidadMovimiento:{ fontSize: clamp(14, 13, 16), fontWeight: 'bold' },
  entradaText:       { color: '#10b981' },
  salidaText:        { color: '#ef4444' },
  detailText:        { fontSize: clamp(11, 10, 13), color: '#6b7280', marginTop: 3 },
  motivoText:        { fontSize: clamp(12, 11, 13), color: '#4b5563', marginTop: 3 },
  fechaText:         { fontSize: clamp(10, 10, 12), color: '#9ca3af' },
  stockText:         { fontSize: clamp(11, 10, 13), color: '#3b82f6', fontWeight: '500' },

  emptyState:  { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle:  { fontSize: clamp(15, 14, 18), fontWeight: '600', color: '#4b5563', marginTop: 10 },
  emptyText:   { fontSize: clamp(12, 11, 14), color: '#9ca3af', textAlign: 'center', marginTop: 6 },

  fabButton: {
    position:       'absolute',
    bottom:         clamp(20, 16, 28),
    right:          clamp(20, 16, 28),
    backgroundColor:'#3b82f6',
    width:           clamp(52, 48, 60),
    height:          clamp(52, 48, 60),
    borderRadius:    clamp(26, 24, 30),
    justifyContent: 'center',
    alignItems:     'center',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.3,
    shadowRadius:   5,
    elevation:      8,
  },

  // Modal
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent:  'flex-end',
  },
  modalContent: {
    backgroundColor:     '#ffffff',
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    padding:             clamp(16, 14, 24),
    maxHeight:           '92%',
  },
  modalHeader: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    marginBottom:     clamp(14, 12, 20),
    paddingBottom:    10,
    borderBottomWidth:1,
    borderBottomColor:'#e5e7eb',
  },
  modalTitle: {
    fontSize:   clamp(15, 14, 18),
    fontWeight: '700',
    color:      '#1f2937',
  },
  label: {
    fontSize:     clamp(13, 12, 15),
    fontWeight:   '500',
    color:        '#374151',
    marginBottom: 2,
  },
  tipoButton: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    paddingVertical:clamp(10, 9, 13),
    borderRadius:   8,
    borderWidth:    1,
    borderColor:    '#e5e7eb',
    backgroundColor:'#ffffff',
  },
  tipoButtonActiveEntrada: { backgroundColor: '#10b981', borderColor: '#10b981' },
  tipoButtonActiveSalida:  { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  tipoButtonText:          { fontSize: clamp(13, 12, 15), fontWeight: '500', color: '#374151' },
  tipoButtonTextActive:    { color: '#ffffff' },

  modalSelect:   { backgroundColor: '#ffffff', borderColor: '#e5e7eb', height: clamp(42, 40, 48) },
  modalInput:    { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  modalTextArea: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', minHeight: 72 },

  infoBox:   { backgroundColor: '#eff6ff', borderRadius: 10, padding: clamp(10, 8, 14) },
  infoTitle: { fontSize: clamp(12, 11, 14), fontWeight: '600', color: '#1e40af', marginBottom: 6 },
  infoText:  { fontSize: clamp(12, 11, 14), color: '#1e40af', marginVertical: 2 },

  modalCancelButton:     { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
  modalCancelButtonText: { color: '#6b7280', fontSize: clamp(13, 12, 15) },
  modalSubmitButton:     { borderRadius: 8, height: clamp(46, 44, 52) },
  modalSubmitEntrada:    { backgroundColor: '#10b981' },
  modalSubmitSalida:     { backgroundColor: '#ef4444' },
  modalSubmitButtonText: { color: '#ffffff', fontWeight: '600', fontSize: clamp(13, 12, 15) },
});

export default MovimientosScreen;