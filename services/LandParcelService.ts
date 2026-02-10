class LandParcelService {
  private indexCacheByMaXa: Record<string, Record<string, [number, number]>> = {};
  private indexLoadPromises: Record<string, Promise<void>> = {};
  private communeListCache: string[] | null = null;
  private communeListPromise: Promise<void> | null = null;
  private readonly SHARD_DIR = 'data/parcels';
  private readonly COMMUNE_LIST_URL = 'data/parcels/communes.json';
  private readonly RAW_FALLBACK_BASE =
    'https://raw.githubusercontent.com/hvduoc/xemgiadat-v2/main/public/data/parcels';

  constructor() {
    (window as any).LandParcelService = this;

    const idle = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 0));
    idle(() => {
      this.loadCommuneList().catch(() => undefined);
    });
  }

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

  async loadCommuneList(url: string = this.COMMUNE_LIST_URL) {
    if (this.communeListCache) return;
    if (this.communeListPromise) return this.communeListPromise;

    this.communeListPromise = (async () => {
      try {
        const baseUrl = (import.meta as any).env?.BASE_URL || '/';
        const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const primaryUrl = (normalizedBase + url).replace(/\/\//g, '/');
        const fallbackUrl = `${this.RAW_FALLBACK_BASE}/communes.json`;
        const candidates = [primaryUrl, fallbackUrl];

        let response: Response | null = null;
        for (const candidate of candidates) {
          try {
            const res = await fetch(candidate, { cache: 'no-store' });
            if (res.ok) {
              response = res;
              break;
            }
          } catch (err) {
            console.warn('[LandParcelService] Commune list fetch failed:', candidate, err);
          }
        }

        if (!response) {
          throw new Error('Failed to load commune list');
        }

        const idle = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 0));
        await new Promise((resolve) => idle(resolve));

        const data = await response.json();
        const communes = Array.isArray(data?.communes) ? data.communes : [];
        this.communeListCache = communes.map((c: any) => String(c)).filter(Boolean);
      } catch (err) {
        console.error('[LandParcelService] Commune list load failed:', err);
        this.communeListCache = [];
        (window as any).LandParcelService = this;
      }
    })();

    return this.communeListPromise;
  }

  async getCommuneList(): Promise<string[]> {
    await this.loadCommuneList();
    return this.communeListCache || [];
  }

  async loadIndexForMaXa(maXa: string) {
    const key = String(maXa || '').trim();
    if (!key) return;
    if (this.indexCacheByMaXa[key]) return;
    if (this.indexLoadPromises[key]) return this.indexLoadPromises[key];

    this.indexLoadPromises[key] = (async () => {
      try {
        const baseUrl = (import.meta as any).env?.BASE_URL || '/';
        const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const shardUrl = `${this.SHARD_DIR}/${key}.json`;
        const primaryUrl = (normalizedBase + shardUrl).replace(/\/\//g, '/');
        const fallbackUrl = `${this.RAW_FALLBACK_BASE}/${key}.json`;
        const candidates = [primaryUrl, fallbackUrl];

        let response: Response | null = null;
        for (const candidate of candidates) {
          try {
            const res = await fetch(candidate, { cache: 'no-store' });
            if (res.ok) {
              response = res;
              break;
            }
          } catch (err) {
            console.warn('[LandParcelService] Shard fetch failed:', candidate, err);
          }
        }

        if (!response) {
          throw new Error(`Failed to load shard for ${key}`);
        }

        const idle = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 0));
        await new Promise((resolve) => idle(resolve));

        const data = await response.json();
        const index = data?.index;
        if (index && typeof index === 'object') {
          this.indexCacheByMaXa[key] = index as Record<string, [number, number]>;
        } else {
          console.warn('[LandParcelService] Invalid shard format:', key);
          this.indexCacheByMaXa[key] = {};
        }
      } catch (err) {
        console.error('[LandParcelService] Shard load failed:', err);
        this.indexCacheByMaXa[key] = {};
        (window as any).LandParcelService = this;
      }
    })();

    return this.indexLoadPromises[key];
  }

  async searchParcelByNumber(parcelNumber: string, maXa?: string): Promise<[number, number] | null> {
    if (!parcelNumber || !parcelNumber.trim()) return null;

    const maXaKey = String(maXa || '').trim();
    if (!maXaKey) return null;

    await this.loadIndexForMaXa(maXaKey);
    const key = this.normalizeParcelKey(parcelNumber);
    if (!key) return null;

    const index = this.indexCacheByMaXa[maXaKey] || {};
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
