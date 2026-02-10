class LandParcelService {
  private indexCache: Record<string, [number, number]> | null = null;
  private indexLoadPromise: Promise<void> | null = null;
  private readonly INDEX_URL = './data/search_index.json';

  createEmptyFeatureCollection() {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  getPolygonCenter(geometry: any, fallback: [number, number]): [number, number] {
    if (geometry?.type !== 'Polygon' || !geometry.coordinates?.[0]?.[0]) {
      return fallback;
    }

    const coords = geometry.coordinates[0];
    const lngs = coords.map((c: any) => c[0]);
    const lats = coords.map((c: any) => c[1]);

    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2
    ];
  }

  ensureListingLayers(map: any) {
    if (!map || map.getSource('user-listings')) return;

    map.addSource('user-listings', {
      type: 'geojson',
      data: this.createEmptyFeatureCollection(),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    map.addLayer({
      id: 'user-listings-clusters',
      type: 'circle',
      source: 'user-listings',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          5,
          '#f1f075',
          10,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          5,
          30,
          10,
          40
        ]
      }
    });

    map.addLayer({
      id: 'user-listings-cluster-count',
      type: 'symbol',
      source: 'user-listings',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    map.addLayer({
      id: 'user-listings-points',
      type: 'circle',
      source: 'user-listings',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#ff4444',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });
  }

  buildListingFeatures(snapshot: any, userProfiles: Record<string, any>) {
    return snapshot.docs
      .map((doc: any) => {
        try {
          const data = doc.data() || {};
          if (typeof data.lng !== 'number' || typeof data.lat !== 'number') {
            console.warn(`[LandParcelService] Invalid coordinates for listing ${doc.id}`);
            return null;
          }

          const userProfile = data.userId ? userProfiles[data.userId] : null;
          const userName = userProfile?.displayName || data.userName || 'Nguoi dang';
          const phone = userProfile?.phone || data.phone || '';

          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [data.lng, data.lat]
            },
            properties: {
              id: doc.id,
              userId: data.userId || '',
              so_to: data.soHieuToBanDo || '',
              so_thua: data.soThuTuThua || '',
              dien_tich: data.dienTich || 0,
              priceValue: data.priceValue || 0,
              priceUnit: data.priceUnit || 'VND',
              isNegotiable: data.isNegotiable || false,
              loaiGiaoDich: data.loaiGiaoDich || 'ban-dat',
              userName,
              phone,
              note: data.note || '',
              status: data.status || 'approved'
            }
          };
        } catch (err) {
          console.warn(`[LandParcelService] Error processing listing ${doc.id}:`, err);
          return null;
        }
      })
      .filter(Boolean);
  }

  updateGeoJsonSource(map: any, sourceId: string, features: any[]) {
    if (!map) return;

    const source = map.getSource(sourceId) as any;
    if (source && typeof source.setData === 'function') {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }

  async loadIndex(url: string = this.INDEX_URL) {
    if (this.indexCache) return;
    if (this.indexLoadPromise) return this.indexLoadPromise;

    this.indexLoadPromise = (async () => {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load index: ${response.status}`);
        }

        const data = await response.json();
        const index = data?.index;
        if (index && typeof index === 'object') {
          this.indexCache = index as Record<string, [number, number]>;
        } else {
          console.warn('[LandParcelService] Invalid index format.');
          this.indexCache = {};
        }
      } catch (err) {
        console.error('[LandParcelService] Index load failed:', err);
        this.indexCache = {};
      }
    })();

    return this.indexLoadPromise;
  }

  async searchParcelByNumber(parcelNumber: string): Promise<[number, number] | null> {
    if (!parcelNumber || !parcelNumber.trim()) return null;

    await this.loadIndex();
    const key = this.normalizeParcelKey(parcelNumber);
    if (!key) return null;

    const index = this.indexCache || {};
    const coords = (index as Record<string, [number, number]>)[key];
    if (Array.isArray(coords) && coords.length === 2 && coords.every((n) => typeof n === 'number')) {
      const mapController = (window as any).MapController;
      if (mapController && typeof mapController.flyToCoordinates === 'function') {
        mapController.flyToCoordinates(coords[0], coords[1], 18);
      }
      return coords as [number, number];
    }

    return null;
  }

  private normalizeParcelKey(parcelNumber: string): string | null {
    const trimmed = parcelNumber.trim();
    if (!trimmed) return null;

    if (trimmed.includes(':')) {
      return trimmed;
    }

    const parts = trimmed.split(/[\s/]+/).filter(Boolean);
    if (parts.length < 2) return null;

    const soTo = parseInt(parts[0], 10);
    const soThua = parseInt(parts[1], 10);
    if (Number.isNaN(soTo) || Number.isNaN(soThua)) return null;

    return `${soTo}:${soThua}`;
  }
}

(window as any).LandParcelService = new LandParcelService();
