import { db } from '../firebaseConfig';
import { collection, getDocs, doc, addDoc, query, orderBy, Timestamp, runTransaction } from 'firebase/firestore';

// Obtener todo el inventario
export const getInventario = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'uniformes')); 
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      producto: doc.data().nombre || doc.data().producto || 'Sin nombre', 
    }));
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    return [];
  }
};

// Obtener movimientos
export const getMovimientos = async () => {
  try {
    const q = query(collection(db, 'movimientos'), orderBy('fecha', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaString: doc.data().fecha?.toDate().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) || 'Sin fecha',
    }));
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    return [];
  }
};

// Registrar movimiento y actualizar stock
export const registrarMovimiento = async (movimientoData) => {
  try {
    const { inventarioId, tipo, cantidad, usuario, observaciones, productoInfo } = movimientoData;
    const uniformeRef = doc(db, 'uniformes', inventarioId); 

    const resultado = await runTransaction(db, async (transaction) => {
      const uniformeDoc = await transaction.get(uniformeRef);

      if (!uniformeDoc.exists()) {
        throw new Error('El producto no existe');
      }

      const cantidadActual = uniformeDoc.data().cantidad || 0;
      const ajuste = tipo === 'entrada' ? cantidad : -cantidad;
      const nuevaCantidad = cantidadActual + ajuste;

      if (nuevaCantidad < 0) {
        throw new Error(`Stock insuficiente. Solo hay ${cantidadActual} unidades`);
      }

      // Actualizar uniforme
      transaction.update(uniformeRef, {
        cantidad: nuevaCantidad,
        ultimaActualizacion: Timestamp.now(),
      });

      return { cantidadActual, nuevaCantidad };
    });

    await addDoc(collection(db, 'movimientos'), {
      inventarioId,
      tipo,
      cantidad: parseInt(cantidad),
      cantidadAnterior: resultado.cantidadActual,
      cantidadNueva: resultado.nuevaCantidad,
      fecha: Timestamp.now(),
      usuario: usuario || 'Admin',
      observaciones: observaciones || 'Sin observaciones',
      productoInfo,
    });

    return { success: true, nuevaCantidad: resultado.nuevaCantidad };
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    throw error;
  }
};

// Agregar nuevo producto al inventario
export const agregarProducto = async (productoData) => {
  try {
    const docRef = await addDoc(collection(db, 'uniformes'), { 
      ...productoData,
      cantidad: parseInt(productoData.cantidad) || 0,
      creadoEn: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al agregar producto:', error);
    throw error;
  }
};