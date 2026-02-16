/**
 * MapController Service
 * Singleton class for MapLibre GL initialization and interactions
 * 
 * Architecture:
 * - Separates map lifecycle from React component lifecycle
 * - Prevents WebGL context loss on component re-renders
 * - Provides clean API for UI components to interact with map
 * 
 * Usage:
 *   const controller = MapController.getInstance();
 *   controller.initialize('map-container').then(() => {
 *     controller.flyTo([108.2, 16.0], 14);
 *   });
 */

import type { LandParcel } from '@/types';
import { LandParcelService } from '@/services/LandParcelService';

// Dynamic import to avoid build-time errors
let maplibregl: any;
let Protocol: any;

async function loadMapDependencies() {
  if (!maplibregl) {
    maplibregl = (await import('maplibre-gl')).default;
  }
  if (!Protocol) {
    const pmTiles = await import('pmtiles');
    Protocol = pmTiles.Protocol;
  }
}

type MapInstance = any;

export class MapController {
  private static instance: MapController | null = null;
  private map: MapInstance | null = null;
  private protocol: any = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MapController {
    if (!MapController.instance) {
      MapController.instance = new MapController();
    }
    return MapController.instance;
  }

  /**
   * Initialize map and register PMTiles protocol
   * @param containerId - HTML element ID for map container
   * @returns Promise that resolves when map is fully loaded
   */
  async initialize(containerId: string): Promise<void> {
    if (this.isInitialized) {
      console.log('[MapController] Already initialized, skipping');
      return;
    }

    try {
      console.log('[MapController] Starting initialization...');
      
      // Load dependencies dynamically
      await loadMapDependencies();

      // Register PMTiles protocol
      this.protocol = new Protocol();
      
      // Add protocol handler to maplibregl
      if (!maplibregl._protocols) {
        maplibregl._protocols = {};
      }
      
      if (!maplibregl._protocols.pmtiles) {
        maplibregl.addProtocol('pmtiles', (params: any, callback: any) => {
          return this.protocol.tile(params, callback);
        });
        console.log('[MapController] ✓ PMTiles protocol registered');
      }

      // Initialize map
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with id "${containerId}" not found`);
      }

      // Create map with basic style (OSM tiles)
      this.map = new maplibregl.Map({
        container,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap, © CARTO',
            },
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              paint: { 'raster-opacity': 0.85 },
            },
          ],
        },
        center: [108.2022, 16.0544], // Đà Nẵng coordinates
        zoom: 12,
        pitch: 0,
        bearing: 0,
        hash: false, // Disable hash to prevent location tracking issues
        attributionControl: true,
      });

      // Wait for map to be fully loaded
      await new Promise<void>((resolve) => {
        if (this.map!.loaded()) {
          resolve();
        } else {
          this.map!.on('load', () => resolve());
        }
      });

      // Add PMTiles layer (if tiles file exists)
      await this.addPMTilesLayer();

      // Force zoom to ensure PMTiles layer is visible
      if (this.map) {
        this.map.jumpTo({ zoom: 15 });
      }

      this.isInitialized = true;
      console.log('[MapController] ✓ Initialization complete');
    } catch (error) {
      console.error('[MapController] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Add PMTiles vector layer to map with auto-detection of layer ID
   */
  private async addPMTilesLayer(): Promise<void> {
    if (!this.map) return;

    try {
      // Check if layer already exists
      if (this.map.getSource('cadastral-source')) {
        console.log('[MapController] PMTiles source already added');
        return;
      }

      // Add source for PMTiles
      const tileUrl = `pmtiles://${window.location.origin}/tiles/danang_parcels_final.pmtiles`;
      
      this.map.addSource('cadastral-source', {
        type: 'vector',
        url: tileUrl,
        attribution: 'Dữ liệu Địa chính Đà Nẵng',
      });

      // Set the actual layer ID detected from PMTiles metadata (v3)
      // Metadata inspection revealed the vector layer is named "default"
      const layerId = 'default';
      console.log('[MapController] Using PMTiles layer ID:', layerId);

      // Add fill layer (parcels)
      this.map.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'cadastral-source',
        'source-layer': layerId,
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0)',
          'fill-outline-color': '#ff0000',
        },
      });

      this.map.on('mouseenter', 'parcels-fill', () => {
        if (this.map) {
          this.map.getCanvas().style.cursor = 'pointer';
        }
      });

      this.map.on('mouseleave', 'parcels-fill', () => {
        if (this.map) {
          this.map.getCanvas().style.cursor = '';
        }
      });

      this.map.on('click', 'parcels-fill', async (event: any) => {
        const feature = event?.features?.[0];
        if (!feature) {
          console.log('[MapClick] No features clicked');
          return;
        }

        const props = feature.properties || {};
        console.log('[MapClick] Feature properties:', props);

        // Extract parcel identifiers with multiple fallback options
        const soTo = Number(
          props.SoHieuToBanDo || props['Số hiệu tờ bản đồ'] || props.so_to || props.soTo || 
          props.ToBanDo || props.tobanDo || props.to || 0
        );
        const soThua = Number(
          props.SoThuTuThua || props['Số thửa'] || props.so_thua || props.soThua || 
          props.ThuaTu || props.thuaTu || props.thu || 0
        );
        const maXa = String(
          props.ma_xa || props.MaXa || props['Mã xã'] || props.commune_code || 
          props.COMMUNE_CODE || props.commune || ''
        ).trim();

        console.log('[MapClick] Extracted IDs:', { soTo, soThua, maXa });

        if (!Number.isFinite(soTo) || !Number.isFinite(soThua) || !maXa) {
          console.warn('[MapClick] Missing parcel identifiers - cannot proceed');
          return;
        }

        try {
          console.log('[MapClick] Fetching parcel details...');
          const landParcelService = LandParcelService.getInstance();
          const parcel = await landParcelService.getParcelDetails(soTo, soThua, maXa, props);
          
          if (parcel) {
            console.log('[MapClick] ✓ Parcel found:', parcel);
            this.highlightParcel(parcel);
            
            // Dispatch event for React components to listen
            window.dispatchEvent(new CustomEvent('parcel:selected', { detail: parcel }));
            console.log('[MapClick] ✓ Event dispatched: parcel:selected');
          } else {
            console.warn('[MapClick] Parcel not found in database');
          }
        } catch (error) {
          console.error('[MapClick] Error fetching parcel details:', error);
        }
      });

      console.log('[MapController] ✓ PMTiles layers added');
    } catch (error) {
      // PMTiles file may not exist yet (OK during development)
      console.warn('[MapController] PMTiles layer not available:', error);
    }
  }

  /**
   * Fly to coordinates with animation
   */
  flyTo(
    coords: [number, number],
    zoom: number = 16,
    options?: { duration?: number; pitch?: number }
  ): void {
    if (!this.map) {
      console.error('[MapController] Map not initialized');
      return;
    }

    this.map.flyTo({
      center: coords,
      zoom,
      duration: options?.duration || 1500,
      pitch: options?.pitch || 0,
    });

    console.log('[MapController] Flying to', coords, 'zoom:', zoom);
  }

  /**
   * Highlight a parcel on map
   */
  highlightParcel(parcel: LandParcel): void {
    if (!this.map) {
      console.error('[MapController] Map not initialized');
      return;
    }

    // Fly to parcel
    this.flyTo(parcel.coordinates, 18);

    // Optional: Add visual highlight (marker, popup, etc.)
    console.log('[MapController] Highlighted parcel:', parcel.id);
  }

  /**
   * Get current map instance (advanced users only)
   */
  getMap(): MapInstance | null {
    return this.map;
  }

  /**
   * Check if map is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.map !== null;
  }

  /**
   * Cleanup and destroy map
   */
  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.protocol = null;
      this.isInitialized = false;
      console.log('[MapController] ✓ Cleaned up');
    }
  }
}

// Export singleton getter for convenience
export const mapController = MapController.getInstance();
