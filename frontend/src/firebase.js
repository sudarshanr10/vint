// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAp8D0dpZZ9QOEgOW9dMM1K1dnw-5P6mqk",
  authDomain: "vint-budget-trucker.firebaseapp.com",
  projectId: "vint-budget-trucker",
  storageBucket: "vint-budget-trucker.firebasestorage.app",
  messagingSenderId: "495930706872",
  appId: "1:495930706872:web:629647ffd672d9b2cb9d4d",
  measurementId: "G-ZYCTKHECCD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, provider);