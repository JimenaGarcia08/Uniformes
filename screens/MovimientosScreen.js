import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Modal, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Heading, HStack, VStack, Box, Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent,
  SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, Input, InputField, Button, ButtonText } from '@gluestack-ui/themed';
import { registrarMovimiento, getMovimientos, getInventario } from '../services/inventarioService';
import { useAuth } from '../context/AuthContext'; 

const MovimientosScreen = () => {
  const { rol } = useAuth();
  const esAdmin = rol === 'admin';

  const [filterTipo, setFilterTipo] = useState('');
  const [movimientos, setMovimientos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState('entrada');
  
  const [formData, setFormData] = useState({
    inventarioId: '',
    cantidad: '',
    quienEntrega: '',  
    quienRecibe: '',   
    observaciones: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [inventarioData, movimientosData] = await Promise.all([
        getInventario(),
        getMovimientos()
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

  const filteredMovimientos = movimientos.filter((mov) => {
    return filterTipo === '' || mov.tipo === filterTipo;
  });

  const getSelectedInventory = () => {
    return inventario.find(i => i.id === formData.inventarioId);
  };

  const handleRegistrarMovimiento = async () => {
    if (!formData.inventarioId) {
      Alert.alert('Error', 'Selecciona un producto');
      return;
    }
    if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }

    const cantidadNum = parseInt(formData.cantidad);
    const inventarioItem = getSelectedInventory();
    
    try {
      const resultado = await registrarMovimiento({
        inventarioId: formData.inventarioId,
        tipo: movimientoTipo,
        cantidad: cantidadNum,
        quienEntrega: formData.quienEntrega || '—', 
        quienRecibe: formData.quienRecibe || '—',   
        observaciones: formData.observaciones,
        productoInfo: {
          producto: inventarioItem.producto,
          talla: inventarioItem.talla,
          condicion: inventarioItem.condicion,
          ubicacion: inventarioItem.ubicacion
        }
      });
      
      await cargarDatos();
      setModalVisible(false);
      resetFormulario();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const resetFormulario = () => {
    setFormData({
      inventarioId: '',
      cantidad: '',
      quienEntrega: '',
      quienRecibe: '',
      observaciones: '',
    });
    setMovimientoTipo('entrada');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      
      <View style={styles.header}>
        <Heading size="xl" style={styles.appTitle}>Movimientos</Heading>
        <Text style={styles.subtitle}>Historial de entradas y salidas</Text>
      </View>

      <View style={styles.filterSection}>
        <Select selectedValue={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger variant="rounded" size="md" style={styles.selectTrigger}>
            <SelectInput
              placeholder="Todos los movimientos"
              value={
                filterTipo === 'entrada' ? 'Solo entradas' :
                filterTipo === 'salida' ? 'Solo salidas' :
                'Todos los movimientos'
              }
            />
            <SelectIcon as={Ionicons} name="chevron-down-outline" mr="$2" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
              <SelectItem label="Todos los movimientos" value="" />
              <SelectItem label="Solo entradas" value="entrada" />
              <SelectItem label="Solo salidas" value="salida" />
            </SelectContent>
          </SelectPortal>
        </Select>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <VStack space="md" paddingBottom="$20">
          {filteredMovimientos.length === 0 ? (
            <Box style={styles.emptyState}>
              <Ionicons name="swap-horizontal-outline" size={60} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No hay movimientos</Text>
              <Text style={styles.emptyText}>Registra tu primer movimiento</Text>
            </Box>
          ) : (
            filteredMovimientos.map((mov) => (
              <Box key={mov.id} bg="$white" borderRadius="$lg" padding="$4"
                marginHorizontal="$4" marginVertical="$2" style={styles.card}>
                <HStack space="md" alignItems="flex-start">
                  <View style={[styles.tipoIcon, mov.tipo === 'entrada' ? styles.entradaIcon : styles.salidaIcon]}>
                    <Ionicons name={mov.tipo === 'entrada' ? 'arrow-down' : 'arrow-up'} size={20} color="#ffffff" />
                  </View>
                  <VStack flex={1}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <Heading size="sm">{mov.productoInfo?.producto || 'Producto'}</Heading>
                      <Text style={[styles.cantidadMovimiento, mov.tipo === 'entrada' ? styles.entradaText : styles.salidaText]}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                      </Text>
                    </HStack>
                    <Text style={styles.detailText}>
                      Talla: {mov.productoInfo?.talla || 'N/A'} | Condición: {mov.productoInfo?.condicion || 'N/A'}
                    </Text>
                    {mov.quienEntrega && <Text style={styles.detailText}>Entrega: {mov.quienEntrega}</Text>}
                    {mov.quienRecibe && <Text style={styles.detailText}>Recibe: {mov.quienRecibe}</Text>}
                    <Text style={styles.motivoText}> {mov.observaciones || 'Sin observaciones'}</Text>
                    <Text style={styles.fechaText}>{mov.fechaString}</Text>
                    {mov.cantidadAnterior !== undefined && (
                      <Text style={styles.stockText}>Stock: {mov.cantidadAnterior} → {mov.cantidadNueva}</Text>
                    )}
                  </VStack>
                </HStack>
              </Box>
            ))
          )}
        </VStack>
      </ScrollView>

      {esAdmin && (
        <TouchableOpacity style={styles.fabButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}

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
                <Heading size="lg">Registrar Movimiento</Heading>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetFormulario(); }}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <VStack space="lg" paddingBottom="$4">

                  {/* Tipo de movimiento */}
                  <VStack space="xs">
                    <Text style={styles.label}>Tipo de movimiento *</Text>
                    <HStack space="md">
                      <TouchableOpacity
                        style={[styles.tipoButton, movimientoTipo === 'entrada' && styles.tipoButtonActiveEntrada]}
                        onPress={() => setMovimientoTipo('entrada')}
                      >
                        <Ionicons name="arrow-down" size={20} color={movimientoTipo === 'entrada' ? '#ffffff' : '#10b981'} />
                        <Text style={[styles.tipoButtonText, movimientoTipo === 'entrada' && styles.tipoButtonTextActive]}>Entrada</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tipoButton, movimientoTipo === 'salida' && styles.tipoButtonActiveSalida]}
                        onPress={() => setMovimientoTipo('salida')}
                      >
                        <Ionicons name="arrow-up" size={20} color={movimientoTipo === 'salida' ? '#ffffff' : '#ef4444'} />
                        <Text style={[styles.tipoButtonText, movimientoTipo === 'salida' && styles.tipoButtonTextActive]}>Salida</Text>
                      </TouchableOpacity>
                    </HStack>
                  </VStack>

                  {/* Producto */}
                  <VStack space="xs">
                    <Text style={styles.label}>Producto *</Text>
                    <Select
                      selectedValue={formData.inventarioId}
                      onValueChange={(value) => setFormData({...formData, inventarioId: value})}
                    >
                      <SelectTrigger variant="rounded" size="md" style={styles.modalSelect}>
                        <SelectInput placeholder="Seleccionar producto" />
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
                      <Text style={styles.infoTitle}>Información del producto:</Text>
                      <Text style={styles.infoText}>Producto: {getSelectedInventory()?.producto}</Text>
                      <Text style={styles.infoText}>Marca: {getSelectedInventory()?.marca}</Text>
                      <Text style={styles.infoText}>Talla: {getSelectedInventory()?.talla}</Text>
                      <Text style={styles.infoText}>Condición: {getSelectedInventory()?.condicion}</Text>
                      <Text style={styles.infoText}>Ubicación: {getSelectedInventory()?.ubicacion}</Text>
                      <Text style={[styles.infoText, styles.stockText]}>
                        Stock actual: {getSelectedInventory()?.cantidad || 0} unidades
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
                        onChangeText={(text) => setFormData({...formData, cantidad: text})}
                      />
                    </Input>
                  </VStack>

                  {/* ✅ Quién entrega y quién recibe separados */}
                  <VStack space="xs">
                    <Text style={styles.label}>Quién entrega</Text>
                    <Input variant="rounded" size="md" style={styles.modalInput}>
                      <InputField
                        placeholder="Nombre de quien entrega"
                        value={formData.quienEntrega}
                        onChangeText={(text) => setFormData({...formData, quienEntrega: text})}
                      />
                    </Input>
                  </VStack>

                  <VStack space="xs">
                    <Text style={styles.label}>Quién recibe</Text>
                    <Input variant="rounded" size="md" style={styles.modalInput}>
                      <InputField
                        placeholder="Nombre de quien recibe"
                        value={formData.quienRecibe}
                        onChangeText={(text) => setFormData({...formData, quienRecibe: text})}
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
                        onChangeText={(text) => setFormData({...formData, observaciones: text})}
                      />
                    </Input>
                  </VStack>

                  {/* Botones */}
                  <HStack space="md" marginTop="$4">
                    <Button flex={1} style={styles.modalCancelButton}
                      onPress={() => { setModalVisible(false); resetFormulario(); }}>
                      <ButtonText style={styles.modalCancelButtonText}>Cancelar</ButtonText>
                    </Button>
                    <Button flex={1}
                      style={[styles.modalSubmitButton, movimientoTipo === 'entrada' ? styles.modalSubmitEntrada : styles.modalSubmitSalida]}
                      onPress={handleRegistrarMovimiento}>
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
  // ... todos tus estilos igual, sin cambios
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: '#ffffff' },
  appTitle: { color: '#1f2937', fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  filterSection: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  selectTrigger: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', height: 44 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tipoIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  entradaIcon: { backgroundColor: '#10b981' },
  salidaIcon: { backgroundColor: '#ef4444' },
  cantidadMovimiento: { fontSize: 16, fontWeight: 'bold' },
  entradaText: { color: '#10b981' },
  salidaText: { color: '#ef4444' },
  detailText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  motivoText: { fontSize: 13, color: '#4b5563', marginTop: 4 },
  fechaText: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  stockText: { fontSize: 12, color: '#3b82f6', fontWeight: '500', marginTop: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#4b5563', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
  fabButton: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#3b82f6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 },
  tipoButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff' },
  tipoButtonActiveEntrada: { backgroundColor: '#10b981', borderColor: '#10b981' },
  tipoButtonActiveSalida: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  tipoButtonText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  tipoButtonTextActive: { color: '#ffffff' },
  modalSelect: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', height: 44 },
  modalInput: { backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  modalTextArea: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', height: 80 },
  modalCancelButton: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
  modalCancelButtonText: { color: '#6b7280' },
  modalSubmitButton: { borderRadius: 8, height: 48 },
  modalSubmitEntrada: { backgroundColor: '#10b981' },
  modalSubmitSalida: { backgroundColor: '#ef4444' },
  modalSubmitButtonText: { color: '#ffffff', fontWeight: '600' },
  infoBox: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginVertical: 8 },
  infoTitle: { fontSize: 13, fontWeight: '600', color: '#1e40af', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#1e40af', marginVertical: 2 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default MovimientosScreen;