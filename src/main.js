/**
 * Wrapper entry point for XemGiaDat v2
 * This .js file ensures the module loads correctly in all environments
 * Simply imports and initializes main.tsx
 */

console.log('[main.js] WRAPPER ENTRY - Loading main.tsx...');

import('./main.tsx')
  .then(() => {
    console.log('[main.js] ✓ main.tsx loaded and executed successfully');
  })
  .catch(err => {
    console.error('[main.js] ✗ Failed to load main.tsx:', err);
    throw err;
  });
