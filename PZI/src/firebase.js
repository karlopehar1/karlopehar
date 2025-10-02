import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyD74QBodtjuITpQqqxtwNT-8qwfgpC0fk4",
  authDomain: "udruga-za-volontiranje.firebaseapp.com",
  projectId: "udruga-za-volontiranje",
  storageBucket: "udruga-za-volontiranje.firebasestorage.app",
  messagingSenderId: "328835569187",
  appId: "1:328835569187:web:6ce7200866328292980396"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;