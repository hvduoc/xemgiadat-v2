/**
 * Location Bypass Utility
 * Bypasses "Blocked a frame with origin..." errors by providing a safe location proxy
 */

interface LocationData {
  href: string;
  origin: string;
  protocol: string;
  host: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  toString: () => string;
}

declare global {
  interface Window {
    __REAL_LOCATION__?: LocationData;
    __SAFE_LOCATION__?: LocationData;
  }
}

/**
 * Setup safe location bypass
 * This helps third-party libraries (like MapLibre) access location information
 * when running in restricted contexts (e.g., file:// protocol)
 */
export function setupSafeLocation(): void {
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
      toString: () => window.location.href
    };
  }

  // Create a fake location object
  const fakeLoc: LocationData = {
    href: 'https://xemgiadat.com/',
    origin: 'https://xemgiadat.com',
    protocol: 'https:',
    host: 'xemgiadat.com',
    hostname: 'xemgiadat.com',
    pathname: '/',
    search: '',
    hash: '',
    toString: () => 'https://xemgiadat.com/'
  };

  try {
    // Attempt to override location properties
    const props: (keyof LocationData)[] = ['href', 'origin', 'protocol', 'host', 'hostname', 'pathname', 'search', 'hash'];
    props.forEach(prop => {
      Object.defineProperty(window.location, prop, {
        get: () => fakeLoc[prop],
        configurable: true
      });
    });
    console.log('[INIT] ✓ window.location override successful');
  } catch (e) {
    // Fallback: Store in a separate window property
    window.__SAFE_LOCATION__ = fakeLoc;
    console.warn('[INIT] window.location override failed, using fallback:', (e as Error).message);
  }
}
