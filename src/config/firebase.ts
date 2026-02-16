/**
 * Firebase Configuration and Initialization
 * Refactored from inline script for better maintainability
 * 
 * NOTE: Firebase Web API keys are DESIGNED to be public.
 * Real security is enforced by Firestore Security Rules on the server.
 * GitHub's "secret scanning" alert for this key is expected and safe to ignore.
 * See: https://firebase.google.com/docs/projects/api-keys
 */

declare global {
  interface Window {
    firebase: any;
    firebaseui: any;
    __firebaseAuth: any;
    __firebaseDb: any;
    __firebaseStorage: any;
    __firebaseUiInstance: any;
    __initFirebase: () => Promise<any>;
    __ensureUserDocument: (user: any) => Promise<void>;
    __initFirebaseUi: (containerId: string) => any;
  }
}

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDu9tYpJdMPT7Hvk2_Ug8XHwxRQXoakRfs",
  authDomain: "xemgiadat-dfe15.firebaseapp.com",
  projectId: "xemgiadat-dfe15",
  storageBucket: "xemgiadat-dfe15.appspot.com",
  messagingSenderId: "361952598367",
  appId: "1:361952598367:web:c1e2e3b1a6d5d8c797beea",
  measurementId: "G-XT932D9N1N"
};

let firebaseInitPromise: Promise<any> | null = null;

/**
 * Initialize Firebase SDK (lazy initialization)
 */
export const initFirebase = async () => {
  if (firebaseInitPromise) return firebaseInitPromise;

  firebaseInitPromise = (async () => {
    if (!window.firebase) {
      throw new Error('Firebase SDK not available');
    }

    if (!window.firebase.apps || window.firebase.apps.length === 0) {
      window.firebase.initializeApp(FIREBASE_CONFIG);
    }

    const auth = window.firebase.auth();
    const db = window.firebase.firestore();
    const storage = window.firebase.storage();

    if (window.firebase.analytics) {
      try {
        window.firebase.analytics();
      } catch (e: any) {
        console.warn('[Firebase] Analytics init skipped:', e?.message || e);
      }
    }

    window.__firebaseAuth = auth;
    window.__firebaseDb = db;
    window.__firebaseStorage = storage;

    return { auth, db, storage };
  })();

  return firebaseInitPromise;
};

/**
 * Ensure user document exists in Firestore
 */
export const ensureUserDocument = async (user: any) => {
  const db = window.__firebaseDb;
  if (!db || !user) return;

  const userRef = db.collection('users').doc(user.uid);
  const doc = await userRef.get();
  const now = window.firebase.firestore.FieldValue.serverTimestamp();

  if (!doc.exists) {
    await userRef.set({
      displayName: user.displayName || '',
      email: user.email || '',
      phone: '',
      contactFacebook: '',
      photoURL: user.photoURL || '',
      createdAt: now,
      updatedAt: now
    });
  } else {
    await userRef.update({
      updatedAt: now,
      displayName: user.displayName || doc.data()?.displayName || '',
      photoURL: user.photoURL || doc.data()?.photoURL || ''
    });
  }
};

/**
 * Initialize FirebaseUI for authentication
 */
export const initFirebaseUi = (containerId: string) => {
  if (!window.firebaseui || !window.firebase) {
    console.error('[FirebaseUI] SDK not available');
    return null;
  }

  const uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult: any, redirectUrl: any) {
        // Prevent redirect/reload completely
        console.log('[Auth] Sign in success:', authResult.user.email);
        // Return false to prevent redirect
        return false;
      },
      signInFailure: function(error: any) {
        console.warn('[Auth] Sign in failed:', error);
        return Promise.resolve();
      }
    },
    signInFlow: 'popup',
    credentialHelper: window.firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      window.firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      window.firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      window.firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    tosUrl: '#',
    privacyPolicyUrl: '#'
  };

  if (!window.__firebaseUiInstance) {
    window.__firebaseUiInstance = new window.firebaseui.auth.AuthUI(window.firebase.auth());
  }

  window.__firebaseUiInstance.start(containerId, uiConfig);
  return window.__firebaseUiInstance;
};

/**
 * Setup Firebase functions on window object for backward compatibility
 */
export function setupFirebaseGlobals(): void {
  window.__initFirebase = initFirebase;
  window.__ensureUserDocument = ensureUserDocument;
  window.__initFirebaseUi = initFirebaseUi;
}
