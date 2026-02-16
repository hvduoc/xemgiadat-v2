import type { LandParcel } from '@/types';

type ShardIndex = Record<string, [number, number]>;

type ShardFile = {
  version?: string;
  generated_at?: string;
  ma_xa?: string;
  total?: number;
  index?: ShardIndex;
};

export class LandParcelService {
  private static instance: LandParcelService | null = null;

  private shardCache = new Map<string, LandParcel[]>();
  private indexCache = new Map<string, Map<string, LandParcel>>();
  private loadPromises = new Map<string, Promise<LandParcel[]>>();
  private communeList: string[] | null = null;
  private communeListPromise: Promise<string[]> | null = null;

  private constructor() {
    // Singleton
  }

  static getInstance(): LandParcelService {
    if (!LandParcelService.instance) {
      LandParcelService.instance = new LandParcelService();
    }
    return LandParcelService.instance;
  }

  /**
   * Map properties from PMTiles feature to LandParcel
   * Handles multiple property name variations from different data sources
   */
  private mapPropertiesToParcel(
    soTo: number,
    soThua: number,
    coordinates: [number, number],
    properties?: Record<string, any>
  ): LandParcel {
    const props = properties || {};

    console.log('[LandParcelService] 🔥 RAW PROPERTIES:', {
      keys: Object.keys(props),
      sample: Object.entries(props).slice(0, 10),
      full: props
    });

    const mappedSoTo = Number(
      props.SoHieuToBanDo ?? props.so_to ?? props.soTo ?? soTo ?? 0
    );
    const mappedSoThua = Number(
      props.SoThuTuThua ?? props.so_thua ?? props.soThua ?? soThua ?? 0
    );

    // Map area with multiple fallback options (Danang cadastral schema first)
    const dien_tich = Number(
      props.DienTich ||
      props.dien_tich ||
      props.DIEN_TICH ||
      props.dt ||
      props.DT ||
      props.shape_area ||
      props.SHAPE_Area ||
      props.area ||
      props.Area ||
      0
    );

    // Map land type with multiple fallback options (Danang cadastral schema first)
    const landTypeKeys = [
      'KyHieuMucDichSuDung',
      'loai_dat', 'LoaiDat', 'LOAI_DAT',
      'mdsd', 'MDSD', 'Mục đích sử dụng', 'MucDichSuDung',
      'kh_2030', 'KH_2030', 'KH2030',
      'kh_sdd', 'KH_SDD',
      'txtLoaiDat', 'Loai', 'Type', 'Category',
      'label', 'Label', 'Text'
    ];

    const propsKeyLookup = new Map<string, string>();
    Object.keys(props).forEach((key) => {
      propsKeyLookup.set(key.toLowerCase(), key);
    });

    let loaiDatValue: unknown;
    for (const key of landTypeKeys) {
      const directValue = props[key];
      if (directValue !== undefined && directValue !== null && directValue !== '') {
        loaiDatValue = directValue;
        break;
      }

      const matchedKey = propsKeyLookup.get(key.toLowerCase());
      if (matchedKey) {
        const matchedValue = props[matchedKey];
        if (matchedValue !== undefined && matchedValue !== null && matchedValue !== '') {
          loaiDatValue = matchedValue;
          break;
        }
      }
    }

    const loai_dat = String(loaiDatValue ?? props.KyHieuMucDichSuDung ?? props.loai_dat ?? 'Không xác định').trim();

    // Map address with multiple fallback options (Danang cadastral schema first)
    const dia_chi = String(
      props.DiaChi ||
      props.dia_chi ||
      props.DIA_CHI ||
      props.dc ||
      props.DC ||
      props.address ||
      props.thua_dat_so ||
      `Tờ ${mappedSoTo}, Thửa ${mappedSoThua}`
    ).trim();

    console.log('[LandParcelService] 📍 Mapped parcel:', {
      soTo: mappedSoTo,
      soThua: mappedSoThua,
      dien_tich,
      loai_dat,
      dia_chi,
      coordinates
    });

    return {
      id: props.id || props.OBJECTID || `${mappedSoTo}:${mappedSoThua}`,
      so_to: mappedSoTo,
      so_thua: mappedSoThua,
      dien_tich,
      loai_dat,
      dia_chi,
      coordinates,
    };
  }

  async getCommuneList(): Promise<string[]> {
    if (this.communeList) {
      return this.communeList;
    }

    if (this.communeListPromise) {
      return this.communeListPromise;
    }

    this.communeListPromise = (async () => {
      const response = await fetch('/data/parcels/communes.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`[LandParcelService] Failed to load communes.json (${response.status})`);
      }

      const data = await response.json();
      const communes = Array.isArray(data?.communes) ? data.communes : [];
      this.communeList = communes.map((code: unknown) => String(code)).filter(Boolean);
      return this.communeList;
    })();

    return this.communeListPromise;
  }

  async fetchParcelsByCommune(communeCode: string): Promise<LandParcel[]> {
    const code = String(communeCode || '').trim();
    if (!code) {
      return [];
    }

    if (this.shardCache.has(code)) {
      return this.shardCache.get(code)!;
    }

    if (this.loadPromises.has(code)) {
      return this.loadPromises.get(code)!;
    }

    const promise = this.loadShardInternal(code);
    this.loadPromises.set(code, promise);
    return promise;
  }

  async getParcelDetails(
    soTo: number,
    soThua: number,
    communeCode: string,
    featureProperties?: Record<string, any>
  ): Promise<LandParcel | null> {
    const code = String(communeCode || '').trim();
    if (!code) {
      return null;
    }

    try {
      // If feature properties are provided (from PMTiles click), use them
      if (featureProperties) {
        console.log('[LandParcelService] Using PMTiles feature properties directly');
        // Get coordinates from cache or use defaults
        await this.fetchParcelsByCommune(code);
        const index = this.indexCache.get(code);
        const key = `${soTo}:${soThua}`;
        const cachedParcel = index?.get(key);
        const coordinates: [number, number] = cachedParcel?.coordinates || [0, 0];

        return this.mapPropertiesToParcel(soTo, soThua, coordinates, featureProperties);
      }

      // Otherwise, load from cache
      await this.fetchParcelsByCommune(code);
      const index = this.indexCache.get(code);
      if (!index) {
        console.warn('[LandParcelService] Index not found for commune:', code);
        return null;
      }

      const key = `${soTo}:${soThua}`;
      const parcel = index.get(key);
      if (!parcel) {
        console.warn('[LandParcelService] Parcel not found:', key, 'in commune:', code);
        return null;
      }

      return parcel;
    } catch (error) {
      console.error('[LandParcelService] Error in getParcelDetails:', error);
      return null;
    }
  }

  private async loadShardInternal(communeCode: string): Promise<LandParcel[]> {
    const response = await fetch(`/data/parcels/${communeCode}.json`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`[LandParcelService] Failed to load shard ${communeCode} (${response.status})`);
    }

    const data: ShardFile = await response.json();
    const index: ShardIndex = data?.index || {};

    const parcels: LandParcel[] = [];
    const indexMap = new Map<string, LandParcel>();

    Object.entries(index).forEach(([key, coords]) => {
      const parts = key.split(':');
      if (parts.length !== 2) {
        return;
      }

      const soTo = Number(parts[0]);
      const soThua = Number(parts[1]);
      if (!Number.isFinite(soTo) || !Number.isFinite(soThua)) {
        return;
      }

      // Use mapping function with empty properties (shard files don't contain detailed data)
      const parcel = this.mapPropertiesToParcel(soTo, soThua, [coords[0], coords[1]], {});

      parcels.push(parcel);
      indexMap.set(parcel.id, parcel);
    });

    this.shardCache.set(communeCode, parcels);
    this.indexCache.set(communeCode, indexMap);

    return parcels;
  }
}
