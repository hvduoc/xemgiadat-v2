/**
 * Wrapper entry point for XemGiaDat v2
 * This .js file ensures the module loads correctly in all environments
 * It simply re-exports the main.tsx module
 */

export { default } from './main.tsx';

// Import and initialize everything from main.tsx
import('./main.tsx');
