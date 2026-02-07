/**
 * XemGiaDat V2 - Initialization Script
 * Bootstraps the application with required utilities and configurations
 */

import { initCDNTracker } from './utils/cdnTracker';
import { setupSafeLocation } from './utils/locationBypass';
import { setupFirebaseGlobals } from './config/firebase';

console.log('[INIT] XemGiaDat v2 initialization started (Vector Parcels mode)');

// Initialize CDN tracking
initCDNTracker();

// Setup safe location bypass
setupSafeLocation();

// Setup Firebase global functions
setupFirebaseGlobals();

console.log('[INIT] ✓ Core initialization complete');
