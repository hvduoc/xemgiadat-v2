/**
 * XemGiaDat V2 - Module Orchestrator
 * Coordinates initialization of CDN tracking and Firebase configuration.
 * This TypeScript module serves as a bridge between ES6 modules for future use.
 */

import { initCDNTracker } from './utils/cdnTracker';
import { setupFirebaseGlobals } from './config/firebase';

console.log('[INIT] XemGiaDat v2 initialization started (Vector Parcels mode)');

// Initialize CDN tracking
initCDNTracker();

// Setup Firebase global functions
setupFirebaseGlobals();

console.log('[INIT] ✓ Core initialization complete');
