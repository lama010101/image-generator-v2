import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";

/**
 * Initializes the Firebase app (web SDK) and exposes a configured Storage instance.
 * All configuration is sourced from Vite environment variables so that the values
 * can be provided via .env.local or the deployment provider's environment settings.
 */
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ?? import.meta.env.FIREBASE_API_KEY,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ??
    import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    import.meta.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
    import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ?? import.meta.env.FIREBASE_APP_ID,
};

// Avoid re-initialising if hot-reloading in development
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseStorage = getStorage(app);
