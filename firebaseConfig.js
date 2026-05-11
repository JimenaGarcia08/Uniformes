import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAc2PIb0EW--HDnAn7V1HKR6H5Zq58BcyE",
  authDomain: "almacen-ab9ee.firebaseapp.com",
  projectId: "almacen-ab9ee",
  storageBucket: "almacen-ab9ee.firebasestorage.app",
  messagingSenderId: "871789756763",
  appId: "1:871789756763:web:a35023f6695b666521da7e"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);