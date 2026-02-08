
const workerCode = `
  self.onmessage = function(e) {
    const { query, parcels } = e.data;
    if (!query) {
      self.postMessage([]);
      return;
    }
    
    const q = query.toLowerCase().trim();
    
    // Check if query is in format "XX YY" (sheet plot format)
    const parts = q.split(/\\s+/);
    if (parts.length === 2) {
      const sheet = parseInt(parts[0], 10);
      const plot = parseInt(parts[1], 10);
      
      if (!isNaN(sheet) && !isNaN(plot)) {
        // Exact match for sheet and plot numbers
        const exactMatches = parcels
          .filter(p => {
            const pSheet = parseInt(p.so_to, 10);
            const pPlot = parseInt(p.so_thua, 10);
            return pSheet === sheet && pPlot === plot;
          })
          .map(p => ({ parcel: p, relevance: 1000 }));
        
        if (exactMatches.length > 0) {
          self.postMessage(exactMatches);
          return;
        }
      }
    }
    
    // Fallback to original search logic
    const results = parcels
      .map(p => {
        let score = 0;
        const so_thua = p.so_thua || "";
        const so_to = p.so_to || "";
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
    
    // Check if query is in format "XX YY" (sheet plot format)
    const parts = q.split(/\s+/);
    if (parts.length === 2) {
      const sheet = parseInt(parts[0], 10);
      const plot = parseInt(parts[1], 10);
      
      if (!isNaN(sheet) && !isNaN(plot)) {
        // Exact match for sheet and plot numbers
        const exactMatches = parcels
          .filter(p => {
            const pSheet = parseInt(p.so_to, 10);
            const pPlot = parseInt(p.so_thua, 10);
            return pSheet === sheet && pPlot === plot;
          })
          .map(p => ({ parcel: p, relevance: 1000 }));
        
        if (exactMatches.length > 0) {
          return exactMatches;
        }
      }
    }
    
    // Fallback to original search logic
    return parcels
      .map(p => {
        let score = 0;
        // Fix: Changed property names to snake_case (so_thua, so_to, dia_chi) to match ParcelData
        const so_thua = p.so_thua || "";
        const so_to = p.so_to || "";
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
