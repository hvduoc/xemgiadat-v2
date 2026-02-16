import fs from 'fs';
import path from 'path';

const PARCELS_DIR = 'public/data/parcels';
const OUTPUT_FILE = 'public/data/search_index.json';
const index = {};

const toNumber = value => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const getPolygonCenter = geometry => {
  if (!geometry || !geometry.coordinates) return null;

  const collectCoords = coords => {
    const flat = [];
    const stack = [coords];
    while (stack.length) {
      const current = stack.pop();
      if (!Array.isArray(current)) continue;
      if (typeof current[0] === 'number' && typeof current[1] === 'number') {
        flat.push(current);
      } else {
        current.forEach(item => stack.push(item));
      }
    }
    return flat;
  };

  const points = collectCoords(geometry.coordinates);
  if (points.length === 0) return null;

  let minLng = points[0][0];
  let maxLng = points[0][0];
  let minLat = points[0][1];
  let maxLat = points[0][1];

  points.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });

  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
};

if (fs.existsSync(PARCELS_DIR)) {
  const files = fs
    .readdirSync(PARCELS_DIR)
    .filter(f => f.endsWith('.json') || f.endsWith('.geojson'))
    .filter(f => f !== 'communes.json');

  console.log(`Processing ${files.length} shards...`);

  files.forEach(file => {
    const content = JSON.parse(fs.readFileSync(path.join(PARCELS_DIR, file), 'utf-8'));

    if (content && content.index && typeof content.index === 'object') {
      Object.entries(content.index).forEach(([key, coords]) => {
        if (!Array.isArray(coords) || coords.length < 2) return;
        index[key] = { c: coords, f: file };
      });
      return;
    }

    const features =
      content.features || (content.type === 'FeatureCollection' ? content.features : []);

    features.forEach(feature => {
      const props = feature.properties || {};
      const soTo = toNumber(props.so_to ?? props.SoHieuToBanDo ?? props['Số hiệu tờ bản đồ']);
      const soThua = toNumber(props.so_thua ?? props.SoThuTuThua ?? props['Số thửa']);
      if (soTo === null || soThua === null) return;

      const key = `${soTo}:${soThua}`;
      const center = getPolygonCenter(feature.geometry);
      if (!center) return;

      index[key] = { c: center, f: file };
    });
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index));
  console.log(`Index created with ${Object.keys(index).length} entries.`);
}
