#!/usr/bin/env node
/**
 * PMTiles Inspector v2
 * Properly parses PMTiles header and metadata JSON
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Read bytes from file
function readFileBytes(filePath, offset, length) {
  const buffer = Buffer.alloc(length);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, length, offset);
  fs.closeSync(fd);
  return buffer;
}

// Parse uint64 little-endian
function readUInt64LE(buffer, offset) {
  const low = buffer.readUInt32LE(offset);
  const high = buffer.readUInt32LE(offset + 4);
  return (high * 0x100000000) + low;
}

function inspectPMTiles(filePath) {
  try {
    const stats = fs.statSync(filePath);
    console.log(`\n📦 PMTiles File: ${path.basename(filePath)}`);
    console.log(`📊 File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Read entire header (512000 bytes max)
    const headerSize = Math.min(512000, stats.size);
    const headerBuffer = readFileBytes(filePath, 0, headerSize);

    // Check magic number
    const magic = headerBuffer.toString('utf8', 0, 7);
    if (magic !== 'PMTiles') {
      console.error('❌ Invalid PMTiles file (wrong magic)');
      return;
    }
    console.log(`✓ Magic: ${magic}`);

    // Spec version at byte 7
    const specVersion = headerBuffer[7];
    console.log(`✓ Spec Version: ${specVersion}`);

    // For PMTiles v3:
    // Offset 8-15: Root directory offset (uint64)
    // Offset 16-23: Root directory length (uint64)
    // Offset 24-31: JSON metadata offset (uint64)
    // Offset 32-39: JSON metadata length (uint64)
    // Offset 40-47: Leaf directories offset (uint64)
    // Offset 48-55: Leaf directories length (uint64)

    const jsonOffset = readUInt64LE(headerBuffer, 24);
    const jsonLength = readUInt64LE(headerBuffer, 32);

    console.log(`\n📍 JSON Metadata:`);
    console.log(`  Offset: ${jsonOffset}`);
    console.log(`  Length: ${jsonLength}`);

    if (jsonOffset && jsonLength && jsonOffset + jsonLength <= stats.size) {
      let jsonBuffer = readFileBytes(filePath, Number(jsonOffset), Number(jsonLength));
      let jsonStr = jsonBuffer.toString('utf8').trim();
      
      // Try decompression if it looks like gzip
      if (jsonBuffer[0] === 0x1f && jsonBuffer[1] === 0x8b) {
        try {
          jsonBuffer = zlib.gunzipSync(jsonBuffer);
          jsonStr = jsonBuffer.toString('utf8').trim();
          console.log(`  (Decompressed)`);
        } catch (e) {
          console.warn('  (Could not decompress with gzip)');
        }
      }
      
      try {
        const metadata = JSON.parse(jsonStr);
        console.log(`\n✓ Parsed Metadata:`);
        
        if (metadata.vector_layers) {
          console.log(`✓ Vector Layers Found: ${metadata.vector_layers.length}`);
          metadata.vector_layers.forEach((layer, idx) => {
            console.log(`  [${idx}] "${layer.id || 'unnamed'}"`);
            if (layer.fields) {
              const fieldCount = Object.keys(layer.fields).length;
              console.log(`      Fields: ${fieldCount}`);
            }
          });

          // Recommend the first layer
          const firstLayer = metadata.vector_layers[0];
          if (firstLayer) {
            console.log(`\n💡 RECOMMENDED source-layer: "${firstLayer.id}"`);
            console.log(`   Update in MapController.ts: 'source-layer': '${firstLayer.id}'`);
          }
        } else {
          console.log(`⚠️  No vector_layers found in metadata`);
        }

        // Show full metadata for debugging
        console.log(`\n📋 Full Metadata:`, JSON.stringify(metadata, null, 2).substring(0, 500));
      } catch (parseErr) {
        console.error('⚠️  Could not parse metadata JSON:', parseErr.message);
        console.log(`Raw bytes (first 200): ${jsonBuffer.toString('utf8', 0, 200)}`);
      }
    } else {
      console.error(`❌ Invalid JSON metadata offset/length`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const pmTilesPath = path.join(__dirname, '../public/tiles/danang_parcels_final.pmtiles');

if (!fs.existsSync(pmTilesPath)) {
  console.error(`❌ PMTiles file not found: ${pmTilesPath}`);
  process.exit(1);
}

inspectPMTiles(pmTilesPath);
