/**
 * LocalStorage Utilities
 * Type-safe wrapper for browser storage
 */

import type { LandParcel } from '@/types';

// Storage key for portfolio
const PORTFOLIO_KEY = 'landmanager_portfolio';

/**
 * Get item from localStorage with type safety
 */
export function getItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`[Storage] Error getting item "${key}":`, error);
    return null;
  }
}

/**
 * Set item in localStorage
 */
export function setItem<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[Storage] Error setting item "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Error removing item "${key}":`, error);
    return false;
  }
}

/**
 * Clear all items from localStorage
 */
export function clear(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing storage:', error);
    return false;
  }
}

/**
 * Check if key exists in localStorage
 */
export function hasItem(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

// ============================================================================
// PORTFOLIO MANAGEMENT (LandManager Pro Specific)
// ============================================================================

/**
 * Get all saved assets from portfolio
 */
export function getAssets(): LandParcel[] {
  const assets = getItem<LandParcel[]>(PORTFOLIO_KEY);
  return assets || [];
}

/**
 * Save a land parcel to portfolio
 */
export function saveAsset(asset: LandParcel): boolean {
  try {
    const currentAssets = getAssets();
    
    // Check if asset already exists
    const existingIndex = currentAssets.findIndex(a => a.id === asset.id);
    
    if (existingIndex >= 0) {
      // Update existing asset
      currentAssets[existingIndex] = asset;
      console.log(`[Storage] Asset updated: ${asset.id}`);
    } else {
      // Add new asset
      currentAssets.push(asset);
      console.log(`[Storage] Asset added: ${asset.id}`);
    }
    
    return setItem(PORTFOLIO_KEY, currentAssets);
  } catch (error) {
    console.error('[Storage] Error saving asset:', error);
    return false;
  }
}

/**
 * Remove a land parcel from portfolio by ID
 */
export function removeAsset(id: string): boolean {
  try {
    const currentAssets = getAssets();
    const filteredAssets = currentAssets.filter(a => a.id !== id);
    
    if (filteredAssets.length === currentAssets.length) {
      console.warn(`[Storage] Asset not found: ${id}`);
      return false;
    }
    
    console.log(`[Storage] Asset removed: ${id}`);
    return setItem(PORTFOLIO_KEY, filteredAssets);
  } catch (error) {
    console.error('[Storage] Error removing asset:', error);
    return false;
  }
}

/**
 * Check if asset is in portfolio
 */
export function hasAsset(id: string): boolean {
  const assets = getAssets();
  return assets.some(a => a.id === id);
}

/**
 * Clear all assets from portfolio
 */
export function clearPortfolio(): boolean {
  console.log('[Storage] Portfolio cleared');
  return removeItem(PORTFOLIO_KEY);
}
