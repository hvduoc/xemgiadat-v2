/**
 * XemGiaDat V2 - Initialization Utilities
 * Browser-compatible standalone JavaScript (no imports/exports)
 * NOTE: Critical CDN tracker functions are now inlined in index.html for reliability
 */

(function() {
  'use strict';

  console.log('[INIT] Extended utilities loading...');

  /**
   * 1. CDN LOAD STATUS TRACKER (Skip if already defined inline)
   */
  if (!window.__CDN_LOAD_STATUS__) {
    window.__CDN_LOAD_STATUS__ = {};
    window.__trackCDN = function(name, success) {
      window.__CDN_LOAD_STATUS__[name] = success;
      console.log('[CDN] ' + name + ': ' + (success ? '✓ OK' : '✗ FAILED'));
    };
  }

  /**
   * 2. SAFE LOCATION BYPASS
   * Bypass "Blocked a frame with origin..." errors
   */
  function setupSafeLocation() {
    // Store the real location for reference
    if (!window.__REAL_LOCATION__) {
      window.__REAL_LOCATION__ = {
        href: window.location.href,
        origin: window.location.origin,
        protocol: window.location.protocol,
        host: window.location.host,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        toString: function() { return window.location.href; }
      };
    }

    // Create a fake location object
    var fakeLoc = {
      href: 'https://xemgiadat.com/',
      origin: 'https://xemgiadat.com',
      protocol: 'https:',
      host: 'xemgiadat.com',
      hostname: 'xemgiadat.com',
      pathname: '/',
      search: '',
      hash: '',
      toString: function() { return 'https://xemgiadat.com/'; }
    };

    try {
      // Attempt to override location properties
      var props = ['href', 'origin', 'protocol', 'host', 'hostname', 'pathname', 'search', 'hash'];
      props.forEach(function(prop) {
        Object.defineProperty(window.location, prop, {
          get: function() { return fakeLoc[prop]; },
          configurable: true
        });
      });
      console.log('[INIT] ✓ window.location override successful');
    } catch (e) {
      // Fallback: Store in a separate window property
      window.__SAFE_LOCATION__ = fakeLoc;
      console.warn('[INIT] window.location override failed, using fallback:', e.message);
    }
  }

  setupSafeLocation();

  /**
   * 3. FIREBASE INITIALIZATION
   * NOTE: Firebase Web API keys are DESIGNED to be public.
   * Real security is enforced by Firestore Security Rules on the server.
   */
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyDu9tYpJdMPT7Hvk2_Ug8XHwxRQXoakRfs",
    authDomain: "xemgiadat-dfe15.firebaseapp.com",
    projectId: "xemgiadat-dfe15",
    storageBucket: "xemgiadat-dfe15.appspot.com",
    messagingSenderId: "361952598367",
    appId: "1:361952598367:web:c1e2e3b1a6d5d8c797beea",
    measurementId: "G-XT932D9N1N"
  };

  var firebaseInitPromise = null;

  window.__initFirebase = function() {
    if (firebaseInitPromise) return firebaseInitPromise;

    firebaseInitPromise = (async function() {
      if (!window.firebase) {
        throw new Error('Firebase SDK not available');
      }

      if (!window.firebase.apps || window.firebase.apps.length === 0) {
        window.firebase.initializeApp(FIREBASE_CONFIG);
      }

      var auth = window.firebase.auth();
      var db = window.firebase.firestore();
      var storage = window.firebase.storage();

      if (window.firebase.analytics) {
        try {
          window.firebase.analytics();
        } catch (e) {
          console.warn('[Firebase] Analytics init skipped:', e?.message || e);
        }
      }

      window.__firebaseAuth = auth;
      window.__firebaseDb = db;
      window.__firebaseStorage = storage;

      return { auth: auth, db: db, storage: storage };
    })();

    return firebaseInitPromise;
  };

  window.__ensureUserDocument = async function(user) {
    var db = window.__firebaseDb;
    if (!db || !user) return;

    var userRef = db.collection('users').doc(user.uid);
    var doc = await userRef.get();
    var now = window.firebase.firestore.FieldValue.serverTimestamp();

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

  window.__initFirebaseUi = function(containerId) {
    if (!window.firebaseui || !window.firebase) {
      console.error('[FirebaseUI] SDK not available');
      return null;
    }

    var uiConfig = {
      callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
          console.log('[Auth] Sign in success:', authResult.user.email);
          return false; // Prevent redirect
        },
        signInFailure: function(error) {
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

  console.log('[INIT] ✓ Core utilities initialized');
})();
