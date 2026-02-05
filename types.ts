
declare global {
  interface ParcelProperties {
    so_thua: string;
    so_to: string;
    dien_tich: number;
    muc_dich: string;
    ma_xa: string;
    dia_chi?: string;
  }

  interface ParcelData extends ParcelProperties {
    id: string;
    coordinates: [number, number];
    gia_uoc_tinh?: number;
  }

  interface SearchResult {
    parcel: ParcelData;
    relevance: number;
  }
}

export {};
