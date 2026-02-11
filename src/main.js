/**
 * Main entry point for Vite
 * This wrapper ensures proper module resolution
 */
import('./index').catch(err => {
  console.error('[App] Failed to load app:', err);
});
