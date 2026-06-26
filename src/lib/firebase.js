import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {

  apiKey: "AIzaSyAnzDxZtUOnNMVutbu5q5Io26sHoS07Mf0",
  authDomain: "simulation-club.firebaseapp.com",
  projectId: "simulation-club",
  storageBucket: "simulation-club.firebasestorage.app",
  messagingSenderId: "145283381027",
  appId: "1:145283381027:web:09ea8529738d90e9abbe96",
  measurementId: "G-KZRPXQ526S"

};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);