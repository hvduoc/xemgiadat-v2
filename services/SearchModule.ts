
const workerCode = `
  self.onmessage = function(e) {
    const { query, parcels } = e.data;
    if (!query) {
      self.postMessage([]);
      return;
    }
    
    const q = query.toLowerCase().trim();
    const results = parcels
      .map(p => {
        let score = 0;
        // Fix: Changed property names to snake_case to match ParcelData
        // Convert to String to handle numeric values from PMTiles
        const so_thua = String(p.so_thua || "").trim().toLowerCase();
        const so_to = String(p.so_to || "").trim().toLowerCase();
        const dia_chi = p.dia_chi || "";

        if (so_thua === q) score += 100;
        else if (so_thua.startsWith(q)) score += 50;
        
        if (so_to === q) score += 80;
        
        const addrMatch = dia_chi.toLowerCase().indexOf(q);
        if (addrMatch !== -1) score += (20 - addrMatch / 10);
        
        return { parcel: p, relevance: score };
      })
      .filter(r => r.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);

    self.postMessage(results);
  };
`;

class SearchModule {
  private worker: Worker | null = null;
  private currentResolve: ((value: SearchResult[]) => void) | null = null;

  constructor() {
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      this.worker.onmessage = (e) => {
        if (this.currentResolve) {
          this.currentResolve(e.data);
          this.currentResolve = null;
        }
      };
      this.worker.onerror = (err) => {
        console.error("Search worker error:", err);
        this.worker = null;
      };
    } catch (e) {
      console.warn('Search Worker fallback active.');
      this.worker = null;
    }
  }

  private searchSync(query: string, parcels: ParcelData[]): SearchResult[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return parcels
      .map(p => {
        let score = 0;
        // Fix: Changed property names to snake_case (so_thua, so_to, dia_chi) to match ParcelData
        // Convert to String to handle numeric values from PMTiles
        const so_thua = String(p.so_thua || "").trim().toLowerCase();
        const so_to = String(p.so_to || "").trim().toLowerCase();
        const dia_chi = p.dia_chi || "";

        if (so_thua === q) score += 100;
        else if (so_thua.startsWith(q)) score += 50;
        if (so_to === q) score += 80;
        const addrMatch = dia_chi.toLowerCase().indexOf(q);
        if (addrMatch !== -1) score += (20 - addrMatch / 10);
        return { parcel: p, relevance: score };
      })
      .filter(r => r.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  async search(query: string, parcels: ParcelData[]): Promise<SearchResult[]> {
    if (!this.worker) {
      return this.searchSync(query, parcels);
    }
    
    return new Promise((resolve) => {
      this.currentResolve = resolve;
      this.worker?.postMessage({ query, parcels });
    });
  }

  terminate() {
    this.worker?.terminate();
  }
}

(window as any).SearchModule = SearchModule;
