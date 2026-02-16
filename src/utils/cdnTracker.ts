/**
 * CDN Load Status Tracker
 * Tracks and logs the loading status of CDN dependencies
 */

interface CDNLoadStatus {
  [key: string]: boolean;
}

declare global {
  interface Window {
    __CDN_LOAD_STATUS__: CDNLoadStatus;
    __trackCDN: (name: string, success: boolean) => void;
  }
}

/**
 * Initialize CDN tracking system
 */
export function initCDNTracker(): void {
  window.__CDN_LOAD_STATUS__ = {};
  
  window.__trackCDN = (name: string, success: boolean): void => {
    window.__CDN_LOAD_STATUS__[name] = success;
    console.log(`[CDN] ${name}: ${success ? '✓ OK' : '✗ FAILED'}`);
  };
}

/**
 * Get the current CDN load status
 */
export function getCDNStatus(): CDNLoadStatus {
  return window.__CDN_LOAD_STATUS__ || {};
}

/**
 * Check if all required CDNs are loaded
 */
export function areAllCDNsLoaded(requiredCDNs: string[]): boolean {
  const status = getCDNStatus();
  return requiredCDNs.every(cdn => status[cdn] === true);
}
