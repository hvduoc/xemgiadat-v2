/**
 * SearchService
 * Real-data search engine for land parcels
 *
 * - Uses optional search_index.json if present
 * - Otherwise scopes search to active commune shards only
 */

import type { LandParcel } from '@/types';
import { LandParcelService } from '@/services/LandParcelService';

interface SearchIndexEntry {
  id: string;
  so_to: number;
  so_thua: number;
  dien_tich?: number;
  loai_dat?: string;
  dia_chi?: string;
  coordinates: [number, number];
}

type ParsedQuery = {
  soTo?: number;
  soThua?: number;
  raw: string;
};

export class SearchService {
  private static instance: SearchService | null = null;
  private landParcelService = LandParcelService.getInstance();
  private searchIndex: Map<string, LandParcel> = new Map();
  private hasGlobalIndex = false;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private activeCommunes: string[] = [];

  private constructor() {
    // Singleton
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  async loadIndex(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    if (this.isLoaded) {
      return;
    }

    this.loadPromise = this.loadIndexInternal();
    return this.loadPromise;
  }

  private async loadIndexInternal(): Promise<void> {
    try {
      console.log('[SearchService] Loading search index...');
      const response = await fetch('https://xemgiadat.netlify.app/data/search_index.json', { cache: 'no-store' });
      if (!response.ok) {
        console.warn(`[SearchService] search_index.json not found (${response.status}).`);
        this.hasGlobalIndex = false;
        this.isLoaded = true;
        return;
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        data.forEach((entry: SearchIndexEntry) => {
          this.addIndexEntry(entry);
        });
      } else if (typeof data === 'object') {
        Object.values(data).forEach((entry: any) => {
          if (entry && typeof entry === 'object') {
            this.addIndexEntry(entry as SearchIndexEntry);
          }
        });
      }

      this.hasGlobalIndex = this.searchIndex.size > 0;
      this.isLoaded = true;
      console.log(`[SearchService] ✓ Index loaded with ${this.searchIndex.size} parcels`);
    } catch (error) {
      console.warn('[SearchService] Error loading index:', error);
      this.hasGlobalIndex = false;
      this.isLoaded = true;
    }
  }

  async search(query: string): Promise<LandParcel[]> {
    await this.loadIndex();

    const raw = query?.trim() || '';
    if (!raw) {
      return [];
    }

    const parsed = this.parseParcelQuery(raw);

    if (this.hasGlobalIndex) {
      if (parsed) {
        return this.searchGlobalIndexByParcel(parsed);
      }
      return this.searchGlobalIndexByAddress(raw);
    }

    if (!parsed) {
      console.warn('[SearchService] Address search requires a global index.');
      return [];
    }

    return this.searchWithinCommunes(parsed);
  }

  async findById(id: string): Promise<LandParcel | null> {
    await this.loadIndex();

    const parsed = this.parseParcelQuery(id);
    if (!parsed) {
      return null;
    }

    if (this.hasGlobalIndex && parsed.soTo !== undefined && parsed.soThua !== undefined) {
      const key = this.normalizeKey(`${parsed.soTo}:${parsed.soThua}`);
      return this.searchIndex.get(key) || null;
    }

    const results = await this.searchWithinCommunes(parsed);
    return results[0] || null;
  }

  async getAllParcels(): Promise<LandParcel[]> {
    await this.loadIndex();

    if (!this.hasGlobalIndex) {
      console.warn('[SearchService] Global index is not available.');
      return [];
    }

    return Array.from(this.searchIndex.values());
  }

  isReady(): boolean {
    return this.isLoaded;
  }

  setActiveCommunes(communes: string[]): void {
    this.activeCommunes = communes.map(code => String(code)).filter(Boolean);
  }

  private addIndexEntry(entry: SearchIndexEntry): void {
    const key = this.normalizeKey(`${entry.so_to}:${entry.so_thua}`);
    this.searchIndex.set(key, {
      id: entry.id || `${entry.so_to}:${entry.so_thua}`,
      so_to: entry.so_to,
      so_thua: entry.so_thua,
      dien_tich: entry.dien_tich || 0,
      loai_dat: entry.loai_dat || '',
      dia_chi: entry.dia_chi || '',
      coordinates: entry.coordinates,
    });
  }

  private parseParcelQuery(query: string): ParsedQuery | null {
    const input = query.trim();
    if (!input) {
      return null;
    }

    const twoNumberMatch = input.match(/^(\d+)\s*[:\s/\-]+\s*(\d+)$/);
    if (twoNumberMatch) {
      return {
        soTo: Number(twoNumberMatch[1]),
        soThua: Number(twoNumberMatch[2]),
        raw: input,
      };
    }

    const singleNumberMatch = input.match(/^(\d+)$/);
    if (singleNumberMatch) {
      return {
        soThua: Number(singleNumberMatch[1]),
        raw: input,
      };
    }

    return null;
  }

  private normalizeKey(key: string): string {
    return key
      .trim()
      .replace(/\s+/g, ':')
      .replace(/-/g, ':')
      .replace(/:/g, ':')
      .toLowerCase();
  }

  private async searchGlobalIndexByParcel(parsed: ParsedQuery): Promise<LandParcel[]> {
    if (parsed.soTo !== undefined && parsed.soThua !== undefined) {
      const key = this.normalizeKey(`${parsed.soTo}:${parsed.soThua}`);
      const exact = this.searchIndex.get(key);
      return exact ? [exact] : [];
    }

    if (parsed.soThua !== undefined) {
      const results: LandParcel[] = [];
      const suffix = `:${parsed.soThua}`;
      this.searchIndex.forEach((parcel, key) => {
        if (key.endsWith(suffix)) {
          results.push(parcel);
        }
      });
      return results.slice(0, 20);
    }

    return [];
  }

  private async searchGlobalIndexByAddress(query: string): Promise<LandParcel[]> {
    const needle = query.toLowerCase();
    const results: LandParcel[] = [];

    this.searchIndex.forEach(parcel => {
      const haystack = `${parcel.dia_chi} ${parcel.loai_dat}`.toLowerCase();
      if (haystack.includes(needle)) {
        results.push(parcel);
      }
    });

    return results.slice(0, 20);
  }

  private async searchWithinCommunes(parsed: ParsedQuery): Promise<LandParcel[]> {
    if (this.activeCommunes.length === 0) {
      console.warn('[SearchService] Commune is required before searching parcels.');
      return [];
    }

    if (parsed.soTo !== undefined && parsed.soThua !== undefined) {
      const lookups = await Promise.all(
        this.activeCommunes.map(code =>
          this.landParcelService.getParcelDetails(parsed.soTo!, parsed.soThua!, code)
        )
      );
      return lookups.filter((parcel): parcel is LandParcel => Boolean(parcel));
    }

    if (parsed.soThua !== undefined) {
      const results: LandParcel[] = [];
      for (const code of this.activeCommunes) {
        const parcels = await this.landParcelService.fetchParcelsByCommune(code);
        parcels.forEach(parcel => {
          if (parcel.so_thua === parsed.soThua) {
            results.push(parcel);
          }
        });
      }
      return results.slice(0, 20);
    }

    return [];
  }
}
// Export singleton instance for convenience
export const searchService = SearchService.getInstance();