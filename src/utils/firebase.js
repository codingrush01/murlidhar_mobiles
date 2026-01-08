// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 1. Add this import
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyARfZQOfvJgRvBtKiaoSQkvNITpHYS7UB8",
  authDomain: "murlidhar-mobiles-74019.firebaseapp.com",
  projectId: "murlidhar-mobiles-74019",
  storageBucket: "murlidhar-mobiles-74019.firebasestorage.app",
  messagingSenderId: "631470229564",
  appId: "1:631470229564:web:2baa041d95b73ee1285b39",
  measurementId: "G-ZQ1TGHM548"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);