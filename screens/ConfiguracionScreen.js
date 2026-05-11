import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Heading, VStack, Box, HStack } from '@gluestack-ui/themed';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { getInventario, getMovimientos } from '../services/inventarioService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const ConfiguracionScreen = ({ navigation }) => {
  const [loadingReporte, setLoadingReporte] = useState(null); 

  // ─── CERRAR SESIÓN ───────────────────────────────────────
  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  // ─── REPORTE INVENTARIO ──────────────────────────────────
 const generarReporteInventario = async () => {
  setLoadingReporte('inventario');
  try {
    const inventario = await getInventario();
    const fecha = new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    const filas = inventario.map(item => `
      <tr>
        <td>${item.producto || item.nombre || '—'}</td>
        <td>${item.marca || '—'}</td>
        <td>${item.talla || '—'}</td>
        <td>${item.condicion || '—'}</td>
        <td>${item.ubicacion || '—'}</td>
        <td style="text-align:center; font-weight:bold; color:${item.cantidad > 0 ? '#10b981' : '#ef4444'}">
          ${item.cantidad ?? 0}
        </td>
      </tr>
    `).join('');

    const html = `
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
          h1 { color: #1e40af; font-size: 22px; margin-bottom: 4px; }
          p.fecha { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #1e40af; color: white; padding: 10px 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          .total { margin-top: 16px; font-size: 13px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Reporte de Inventario</h1>
        <p class="fecha">Generado el ${fecha}</p>
        <table>
          <thead>
            <tr>
              <th>Producto</th><th>Marca</th><th>Talla</th>
              <th>Condición</th><th>Ubicación</th><th>Stock</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <p class="total">Total de productos: ${inventario.length}</p>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      // En web: abre ventana nueva e imprime
      const ventana = window.open('', '_blank');
      ventana.document.write(html);
      ventana.document.close();
      ventana.print();
    } else {
      // En móvil: genera PDF y comparte
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Reporte de Inventario',
      });
    }
  } catch (e) {
    Alert.alert('Error', 'No se pudo generar el reporte');
    console.error(e);
  } finally {
    setLoadingReporte(null);
  }
};

const generarReporteMovimientos = async () => {
  setLoadingReporte('movimientos');
  try {
    const movimientos = await getMovimientos();
    const fecha = new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    const filas = movimientos.map(mov => `
      <tr>
        <td>${mov.productoInfo?.producto || '—'}</td>
        <td>${mov.productoInfo?.condicion || '—'}</td>
        <td style="color:${mov.tipo === 'entrada' ? '#10b981' : '#ef4444'}; font-weight:bold">
          ${mov.tipo === 'entrada' ? '▼ Entrada' : '▲ Salida'}
        </td>
        <td style="text-align:center">${mov.cantidad}</td>
        <td>${mov.cantidadAnterior ?? '—'} → ${mov.cantidadNueva ?? '—'}</td>
        <td>${mov.usuario || '—'}</td>
        <td>${mov.fechaString || '—'}</td>
      </tr>
    `).join('');

    const html = `
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
          h1 { color: #1e40af; font-size: 22px; margin-bottom: 4px; }
          p.fecha { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #1e40af; color: white; padding: 10px 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          .total { margin-top: 16px; font-size: 13px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Reporte de Movimientos</h1>
        <p class="fecha">Generado el ${fecha}</p>
        <table>
          <thead>
            <tr>
              <th>Producto</th><th>Condición</th><th>Tipo</th>
              <th>Cantidad</th><th>Stock</th><th>Usuario</th><th>Fecha</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <p class="total">Total de movimientos: ${movimientos.length}</p>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      const ventana = window.open('', '_blank');
      ventana.document.write(html);
      ventana.document.close();
      ventana.print();
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Reporte de Movimientos',
      });
    }
  } catch (e) {
    Alert.alert('Error', 'No se pudo generar el reporte');
    console.error(e);
  } finally {
    setLoadingReporte(null);
  }
};

  // ─── UI ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Heading size="xl" style={styles.appTitle}>Configuración</Heading>
        <Text style={styles.subtitle}>Reportes y ajustes de la app</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="md" padding="$4">

          {/* Sección Reportes */}
          <Text style={styles.sectionTitle}>REPORTES</Text>

          <TouchableOpacity onPress={generarReporteInventario} disabled={!!loadingReporte}>
            <Box style={styles.menuCard}>
              <HStack space="md" alignItems="center">
                <View style={styles.iconContainer}>
                  {loadingReporte === 'inventario'
                    ? <ActivityIndicator color="#3b82f6" />
                    : <Ionicons name="document-text-outline" size={24} color="#3b82f6" />}
                </View>
                <VStack flex={1}>
                  <Text style={styles.menuTitle}>Reporte de Inventario</Text>
                  <Text style={styles.menuDescription}>Exportar stock actual en PDF</Text>
                </VStack>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </HStack>
            </Box>
          </TouchableOpacity>

          <TouchableOpacity onPress={generarReporteMovimientos} disabled={!!loadingReporte}>
            <Box style={styles.menuCard}>
              <HStack space="md" alignItems="center">
                <View style={styles.iconContainer}>
                  {loadingReporte === 'movimientos'
                    ? <ActivityIndicator color="#3b82f6" />
                    : <Ionicons name="swap-horizontal-outline" size={24} color="#3b82f6" />}
                </View>
                <VStack flex={1}>
                  <Text style={styles.menuTitle}>Reporte de Movimientos</Text>
                  <Text style={styles.menuDescription}>Exportar historial de entradas y salidas</Text>
                </VStack>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </HStack>
            </Box>
          </TouchableOpacity>

          {/* Cerrar sesión */}
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>CUENTA</Text>

          <TouchableOpacity onPress={handleCerrarSesion}>
            <Box style={[styles.menuCard, styles.logoutCard]}>
              <HStack space="md" alignItems="center">
                <View style={[styles.iconContainer, styles.logoutIcon]}>
                  <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                </View>
                <VStack flex={1}>
                  <Text style={[styles.menuTitle, styles.logoutText]}>Cerrar sesión</Text>
                  <Text style={styles.menuDescription}>Salir de la cuenta actual</Text>
                </VStack>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </HStack>
            </Box>
          </TouchableOpacity>

        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  appTitle: { color: '#1f2937', fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#9ca3af',
    letterSpacing: 1, marginLeft: 4, marginBottom: 4,
  },
  menuCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  logoutCard: { borderWidth: 1, borderColor: '#fee2e2' },
  iconContainer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center',
  },
  logoutIcon: { backgroundColor: '#fef2f2' },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  logoutText: { color: '#ef4444' },
  menuDescription: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});

export default ConfiguracionScreen;