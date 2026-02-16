/**
 * Type Definitions for LandManager Pro
 * Single Source of Truth for all data models
 */

export interface LandParcel {
  id: string; // Tờ-Thửa (e.g., "33:48")
  so_to: number;
  so_thua: number;
  dien_tich: number;
  loai_dat: string;
  dia_chi: string;
  coordinates: [number, number]; // [lng, lat] centroid
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  permissions: string[];
}

export interface AppState {
  isLoading: boolean;
  selectedParcel: LandParcel | null;
  isSidebarOpen: boolean;
}
