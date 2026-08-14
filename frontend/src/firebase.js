import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBtJQ-lLHWjHi-F4f0Q_v8EEn8k4NlQFTo",
  authDomain: "bingohub-fdba7.firebaseapp.com",
  projectId: "bingohub-fdba7",
  storageBucket: "bingohub-fdba7.firebasestorage.app",
  messagingSenderId: "796543997792",
  appId: "1:796543997792:web:bb705bea44eb431fa1b005",
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);
export default app;