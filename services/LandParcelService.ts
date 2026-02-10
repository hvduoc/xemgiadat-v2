interface SearchResult {
  lat: number;
  lng: number;
  maXa: string;
  soTo: number;
  soThua: number;
}

interface ParsedQuery {
  soThua: number | null;
  soTo: number | null;
  raw: string;
}

class LandParcelService {
  private indexCacheByMaXa: Record<string, Record<string, [number, number]>> = {};
  private indexLoadPromises: Record<string, Promise<void>> = {};
  private communeListCache: string[] | null = null;
  private communeListPromise: Promise<void> | null = null;
  private allShardsLoaded = false;
  private allShardsPromise: Promise<void> | null = null;
  private readonly RAW_FALLBACK_BASE =
    'https://raw.githubusercontent.com/hvduoc/xemgiadat-v2/main/public/data/parcels';

  constructor() {
    (window as any).LandParcelService = this;

    const idle = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 0));
    idle(() => {
      this.loadCommuneList().catch(() => undefined);
    });
  }

  // =====================================================
  // V1 PARSER: parseParcelQuery()
  // Hỗ trợ: "123/45", "Thửa 123 Tờ 45", "Tờ 45 Thửa 123", "123" (số thửa đơn)
  // =====================================================
  parseParcelQuery(raw: string): ParsedQuery {
    const input = (raw || '').trim();
    if (!input) return { soThua: null, soTo: null, raw: input };

    // Pattern 1: "123/45" → soThua=123, soTo=45
    const slashMatch = input.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (slashMatch) {
      return {
        soThua: parseInt(slashMatch[1], 10),
        soTo: parseInt(slashMatch[2], 10),
        raw: input
      };
    }

    // Pattern 2: "Thửa 123 Tờ 45" (case-insensitive, flexible whitespace)
    const thuaToMatch = input.match(/th[uứửữụ]a\s*(\d+)\s*t[oờởỡọ]\s*(\d+)/i);
    if (thuaToMatch) {
      return {
        soThua: parseInt(thuaToMatch[1], 10),
        soTo: parseInt(thuaToMatch[2], 10),
        raw: input
      };
    }

    // Pattern 3: "Tờ 45 Thửa 123" (reversed order)
    const toThuaMatch = input.match(/t[oờởỡọ]\s*(\d+)\s*th[uứửữụ]a\s*(\d+)/i);
    if (toThuaMatch) {
      return {
        soThua: parseInt(toThuaMatch[2], 10),
        soTo: parseInt(toThuaMatch[1], 10),
        raw: input
      };
    }

    // Pattern 4: "soTo:soThua" or "soTo soThua" (two numbers)
    const twoNumMatch = input.match(/^(\d+)\s*[:\s]\s*(\d+)$/);
    if (twoNumMatch) {
      return {
        soThua: parseInt(twoNumMatch[2], 10),
        soTo: parseInt(twoNumMatch[1], 10),
        raw: input
      };
    }

    // Pattern 5: Số thửa đơn thuần "123"
    const singleMatch = input.match(/^(\d+)$/);
    if (singleMatch) {
      return {
        soThua: parseInt(singleMatch[1], 10),
        soTo: null,
        raw: input
      };
    }

    return { soThua: null, soTo: null, raw: input };
  }

  // =====================================================
  // Load ALL shards (56 small files) for cross-commune search
  // =====================================================
  async loadAllShards(): Promise<void> {
    if (this.allShardsLoaded) return;
    if (this.allShardsPromise) return this.allShardsPromise;

    this.allShardsPromise = (async () => {
      try {
        await this.loadCommuneList();
        const communes = this.communeListCache || [];
        if (communes.length === 0) {
          console.warn('[LandParcelService] No communes found, cannot load shards');
          return;
        }

        // Load all shards in parallel (56 small files ~200-500KB each)
        await Promise.all(communes.map(maXa => this.loadIndexForMaXa(maXa)));
        this.allShardsLoaded = true;
        console.log(`[LandParcelService] ✅ All ${communes.length} shards loaded`);
      } catch (err) {
        console.error('[LandParcelService] Failed to load all shards:', err);
      }
    })();

    return this.allShardsPromise;
  }

  /**
   * V1 "Tìm là Bay": Quét 56 shard files → flyTo → highlight
   * Tuyệt đối không cần chọn Mã Xã từ dropdown.
   * @returns SearchResult hoặc null
   */
  async searchV1(query: string): Promise<SearchResult | null> {
    const parsed = this.parseParcelQuery(query);
    if (parsed.soThua === null) return null;

    // Ensure all shards are loaded for cross-commune search
    await this.loadAllShards();

    let result: SearchResult | null = null;

    // Quét toàn bộ 56 shard, lookup O(1) per shard
    if (parsed.soTo !== null) {
      // Có cả soTo → key chính xác "soTo:soThua"
      const shardKey = `${parsed.soTo}:${parsed.soThua}`;
      for (const [maXa, index] of Object.entries(this.indexCacheByMaXa)) {
        const coords = index[shardKey];
        if (coords) {
          result = {
            lng: coords[0],
            lat: coords[1],
            maXa,
            soTo: parsed.soTo,
            soThua: parsed.soThua
          };
          break;
        }
      }
    }

    // Fallback: chỉ có soThua → quét tất cả keys trong mỗi shard
    if (!result && parsed.soThua !== null) {
      const thuaSuffix = `:${parsed.soThua}`;
      for (const [maXa, index] of Object.entries(this.indexCacheByMaXa)) {
        for (const [key, coords] of Object.entries(index)) {
          if (key.endsWith(thuaSuffix)) {
            const soTo = parseInt(key.split(':')[0], 10);
            result = {
              lng: coords[0],
              lat: coords[1],
              maXa,
              soTo,
              soThua: parsed.soThua
            };
            break;
          }
        }
        if (result) break;
      }
    }

    if (!result) return null;

    // === FLY TO ===
    const mapController = (window as any).MapController;
    if (mapController && typeof mapController.flyToCoordinates === 'function') {
      mapController.flyToCoordinates(result.lng, result.lat, 18);
    }

    // === AUTO HIGHLIGHT ===
    this.highlightParcelAfterFly(result);

    return result;
  }

  /**
   * Sau khi FlyTo, tự động fetch GeoJSON tương ứng và highlight thửa.
   */
  private async highlightParcelAfterFly(entry: SearchResult): Promise<void> {
    try {
      const maXa = entry.maXa;
      if (!maXa) return;

      // Đảm bảo index cho mã xã đã được load
      await this.loadIndexForMaXa(maXa);

      // Đợi map bay xong (1.6s animation)
      await new Promise(resolve => setTimeout(resolve, 1700));

      const map = (window as any).MapController?.getMap?.();
      if (!map) return;

      const StyleEngine = (window as any).StyleEngine;
      if (!StyleEngine) return;

      // Query features tại viewport mới
      const features = map.querySourceFeatures(StyleEngine.SOURCE_ID, {
        sourceLayer: StyleEngine.SOURCE_LAYER
      });

      if (!features || features.length === 0) return;

      // Tìm feature khớp soTo + soThua
      const target = features.find((f: any) => {
        const props = f.properties || {};
        const fSoTo = parseInt(props['SoHieuToBanDo'] || props['Số hiệu tờ bản đồ'] || props.so_to || '0', 10);
        const fSoThua = parseInt(props['SoThuTuThua'] || props['Số thửa'] || props.so_thua || '0', 10);
        return fSoTo === entry.soTo && fSoThua === entry.soThua;
      });

      if (target) {
        const parcelId = target.id || target.properties?.OBJECTID;
        if (parcelId !== undefined) {
          map.setFilter(StyleEngine.LAYER_HIGHLIGHT, ['==', ['id'], parcelId]);
          console.log(`[LandParcelService] ✅ Highlighted thửa ${entry.soThua}, tờ ${entry.soTo}`);
        }
      }
    } catch (err) {
      console.warn('[LandParcelService] Highlight failed:', err);
    }
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

  async loadCommuneList() {
    if (this.communeListCache) return;
    if (this.communeListPromise) return this.communeListPromise;

    this.communeListPromise = (async () => {
      try {
        const primaryUrl = './data/parcels/communes.json';
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
        const primaryUrl = `./data/parcels/${key}.json`;
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

    // === V1 Priority: Quét shards → FlyTo + Highlight (không cần maXa) ===
    const v1Result = await this.searchV1(parcelNumber);
    if (v1Result) {
      return [v1Result.lng, v1Result.lat];
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
