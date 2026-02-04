import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { ParcelData } from '../types';

export class MapModule {
  private map: maplibregl.Map | null = null;
  private protocol: Protocol | null = null;

  constructor() {
    try {
      this.protocol = new Protocol();
      const mlgl = maplibregl as any;
      if (mlgl.addProtocol && (!mlgl._protocols || !mlgl._protocols.pmtiles)) {
        mlgl.addProtocol('pmtiles', (params: any, callback: any) => {
          return this.protocol?.tile(params, callback);
        });
      }
    } catch (e) {
      console.warn("Failed to initialize PMTiles protocol:", e);
    }
  }

  initialize(container: HTMLDivElement, options: Partial<maplibregl.MapOptions>) {
    try {
      (maplibregl as any).workerUrl = 'https://unpkg.com/maplibre-gl@5.1.0/dist/maplibre-gl-csp-worker.js';

      this.map = new maplibregl.Map({
        container,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap'
            }
          },
          layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }]
        },
        center: options.center || [108.2022, 16.0544],
        zoom: options.zoom || 13,
        attributionControl: false,
        hash: false,
        validateStyle: false,
        transformRequest: (url: string) => {
          if (url.startsWith('/')) {
            return { url: `https://xemgiadat.com${url}` };
          }
          return { url: url };
        },
        ...options
      });

      this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      return this.map;
    } catch (e) {
      console.error("Map initialization failed:", e);
      return null;
    }
  }

  addMockData(parcels: ParcelData[]) {
    if (!this.map) return;
    
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: parcels.map(p => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: p.coordinates
        },
        properties: { ...p }
      }))
    };

    if (this.map.getSource('mock-parcels')) {
      (this.map.getSource('mock-parcels') as maplibregl.GeoJSONSource).setData(geojson);
      return;
    }

    this.map.addSource('mock-parcels', {
      type: 'geojson',
      data: geojson
    });

    this.map.addLayer({
      id: 'mock-parcels-points',
      type: 'circle',
      source: 'mock-parcels',
      paint: {
        'circle-radius': 8,
        'circle-color': '#3b82f6',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });
  }

  setupSmartLoading(pmtilesUrl: string) {
    if (!this.map) return;

    const onZoom = () => {
      const zoom = this.map?.getZoom() || 0;
      if (zoom > 15 && !this.map?.getSource('parcels')) {
        this.addParcelLayers(pmtilesUrl);
        this.map?.off('zoomend', onZoom);
      }
    };

    this.map.on('zoomend', onZoom);
  }

  private addParcelLayers(url: string) {
    if (!this.map || this.map.getSource('parcels')) return;
    
    let absoluteUrl = url;
    if (!url.startsWith('http')) {
      absoluteUrl = `https://xemgiadat.com/${url}`;
    }

    try {
      this.map.addSource('parcels', {
        type: 'vector',
        url: `pmtiles://${absoluteUrl}`,
      });

      this.map.addLayer({
        id: 'parcels-line',
        type: 'line',
        source: 'parcels',
        'source-layer': 'default',
        paint: { 'line-color': '#3b82f6', 'line-width': 1 }
      });
    } catch (e) {
      console.warn("Failed to add parcel layers:", e);
    }
  }

  getMap() { return this.map; }
}