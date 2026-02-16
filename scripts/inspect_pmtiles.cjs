#!/usr/bin/env node
/**
 * PMTiles Inspector
 * Reads the PMTiles header and metadata to find the actual vector layer ID
 * 
 * Note: This inspects the file locally using fetch/fetch polyfill
 */

const fs = require('fs');
const path = require('path');

// Helper to read file bytes
function readFileBytes(filePath, start, length) {
  const buffer = Buffer.alloc(length);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, length, start);
  fs.closeSync(fd);
  return buffer;
}

// Read PMTiles header (first 512,000 bytes contains header info)
function inspectPMTiles(filePath) {
  try {
    const stats = fs.statSync(filePath);
    console.log(`\n📦 PMTiles File: ${path.basename(filePath)}`);
    console.log(`📊 File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`\n🔍 Inspecting PMTiles metadata...`);

    // Read header (first 7 bytes for version and spec)
    const headerBytes = readFileBytes(filePath, 0, 128);
    
    // Check magic number (should be 0x506d5468 = "PmTh")
    const magic = headerBytes.toString('utf8', 0, 7);
    console.log(`✓ Magic: ${magic}`);
    
    // PMTiles v3 header structure
    // Offset 7-8: Spec version (1 byte)
    const specVersion = headerBytes[7];
    console.log(`✓ Spec Version: ${specVersion}`);

    // Try to read metadata section marker (look for JSON at various offsets)
    // The metadata is usually stored after the directory
    // For now, let's look for the "json" key pattern
    
    const searchBuffer = readFileBytes(filePath, 0, Math.min(100000, stats.size));
    const searchStr = searchBuffer.toString('utf8', 0, searchBuffer.length);
    
    // Look for "vector_layers" in the file
    const jsonMatch = searchStr.match(/"vector_layers"[^]*/);
    if (jsonMatch) {
      // Extract JSON object containing vector_layers
      const jsonStr = jsonMatch[0];
      // Find the closing brace
      let braceCount = 1;
      for (let i = 18; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') braceCount++;
        if (jsonStr[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            const thisJson = '{' + jsonStr.substring(18, i);
            try {
              const metadata = JSON.parse(thisJson);
              console.log(`\n✓ Detected Vector Layers:`);
              if (metadata.vector_layers) {
                metadata.vector_layers.forEach((layer, idx) => {
                  console.log(`  [${idx}] ${layer.id || 'unknown'}`);
                });
              }
            } catch (e) {
              // JSON parsing failed
            }
            break;
          }
        }
      }
    }

    // Also look for common layer name patterns
    const commonLayers = ['parcels', 'default', 'buildings', 'landuse', 'features', 'layer'];
    const detectedLayers = [];
    
    for (const layer of commonLayers) {
      if (searchStr.includes(`"id":"${layer}"`) || searchStr.includes(`"id": "${layer}"`)) {
        detectedLayers.push(layer);
        console.log(`\n⭐ Found layer: "${layer}"`);
      }
    }

    if (detectedLayers.length === 0) {
      console.log(`\n⚠️  Could not auto-detect layer ID. Using default: "parcels"`);
    }

    console.log('\n💡 ACTION: Copy the detected layer ID to MapController.ts');
    
  } catch (error) {
    console.error('❌ Error inspecting PMTiles:', error.message);
    process.exit(1);
  }
}

const pmTilesPath = path.join(__dirname, '../public/tiles/danang_parcels_final.pmtiles');

if (!fs.existsSync(pmTilesPath)) {
  console.error(`❌ PMTiles file not found: ${pmTilesPath}`);
  process.exit(1);
}

inspectPMTiles(pmTilesPath);
