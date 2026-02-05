
class StyleEngine {
  static readonly SOURCE_ID = 'danang-parcels';
  static readonly SOURCE_LAYER = 'default';
  static readonly PMTILES_URL = 'https://xemgiadat.com/tiles/danang_parcels_final.pmtiles';

  static readonly LAYER_DOTS = 'parcels-dots';
  static readonly LAYER_LINES = 'parcels-lines';
  static readonly LAYER_FILL = 'parcels-fill';
  static readonly LAYER_HIGHLIGHT = 'parcels-highlight';

  static applyLODStyle(map: any) {
    if (map.getSource(this.SOURCE_ID)) return;

    map.addSource(this.SOURCE_ID, {
      type: 'vector',
      url: `pmtiles://${this.PMTILES_URL}`,
      minzoom: 10,
      maxzoom: 20
    });

    // Layer hiển thị ranh giới tổng quát
    map.addLayer({
      id: this.LAYER_LINES,
      type: 'line',
      source: this.SOURCE_ID,
      'source-layer': this.SOURCE_LAYER,
      minzoom: 14,
      paint: {
        'line-color': '#475569',
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.2, 18, 0.8],
        'line-opacity': 0.5
      }
    });

    // Layer vùng đệm tương tác
    map.addLayer({
      id: this.LAYER_FILL,
      type: 'fill',
      source: this.SOURCE_ID,
      'source-layer': this.SOURCE_LAYER,
      minzoom: 14,
      paint: {
        'fill-color': 'transparent'
      }
    });

    // LAYER HIGHLIGHT: Vàng chanh (#ccff00) - Mắt thần
    map.addLayer({
      id: this.LAYER_HIGHLIGHT,
      type: 'line',
      source: this.SOURCE_ID,
      'source-layer': this.SOURCE_LAYER,
      paint: {
        'line-color': '#ccff00',
        'line-width': 4,
        'line-blur': 0.5,
        'line-opacity': 1
      },
      filter: ['==', ['id'], '']
    });
  }
}

(window as any).StyleEngine = StyleEngine;
