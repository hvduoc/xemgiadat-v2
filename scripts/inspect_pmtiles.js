#!/usr/bin/env node

/**
 * Inspect PMTiles file to extract metadata
 * This script reads the PMTiles file header and metadata
 */

const fs = require('fs');
const path = require('path');

// Simple PMTiles header parser
function parsePMTilesHeader(buffer) {
  // PMTiles header is 512 bytes
  if (buffer.length < 512) {
    throw new Error('Buffer too small for PMTiles header');
  }

  const magic = buffer.toString('ascii', 7, 15); // bytes 7-15
  console.log(`Magic: ${magic}`);

  if (!magic.startsWith('PMTiles')) {
    throw new Error('Invalid PMTiles magic signature');
  }

  // Byte 15: version
  const version = buffer.readUInt8(15);
  console.log(`Version: ${version}`);

  // Bytes 16-23: specVersion (little-endian uint64)
  const specVersion = buffer.readUInt32LE(16);
  console.log(`Spec Version: ${specVersion}`);

  // Bytes 24-31: indexOffset (little-endian uint64)
  const indexOffset = Number(buffer.readBigUInt64LE(24));
  console.log(`Index Offset: ${indexOffset}`);

  // Bytes 32-39: indexLength (little-endian uint64)
  const indexLength = Number(buffer.readBigUInt64LE(32));
  console.log(`Index Length: ${indexLength}`);

  // Bytes 40-47: jsonMetadataOffset (little-endian uint64)
  const jsonOffset = Number(buffer.readBigUInt64LE(40));
  console.log(`JSON Metadata Offset: ${jsonOffset}`);

  // Bytes 48-55: jsonMetadataLength (little-endian uint64)
  const jsonLength = Number(buffer.readBigUInt64LE(48));
  console.log(`JSON Metadata Length: ${jsonLength}`);

  return { indexOffset, indexLength, jsonOffset, jsonLength, version };
}

async function inspect() {
  const filePath = path.join(__dirname, '../public/tiles/danang_parcels_final.pmtiles');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ PMTiles file not found: ${filePath}`);
    process.exit(1);
  }

  const stats = fs.statSync(filePath);
  console.log(`📦 PMTiles File: ${filePath}`);
  console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

  try {
    // Read header (first 512 bytes)
    const headerBuffer = Buffer.alloc(512);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, headerBuffer, 0, 512, 0);

    console.log('=== PMTiles Header ===\n');
    const header = parsePMTilesHeader(headerBuffer);

    // Read JSON metadata
    console.log('\n=== JSON Metadata ===\n');
    const jsonBuffer = Buffer.alloc(header.jsonLength);
    fs.readSync(fd, jsonBuffer, 0, header.jsonLength, header.jsonOffset);
    fs.closeSync(fd);

    const metadata = JSON.parse(jsonBuffer.toString('utf-8'));
    console.log('Raw Metadata:');
    console.log(JSON.stringify(metadata, null, 2));

    // Extract layer information
    if (metadata.vector_layers) {
      console.log('\n=== Vector Layers ===\n');
      metadata.vector_layers.forEach((layer, idx) => {
        console.log(`Layer ${idx}: "${layer.id}"`);
        if (layer.description) console.log(`  Description: ${layer.description}`);
        if (layer.fields) {
          console.log(`  Fields: ${Object.keys(layer.fields).join(', ')}`);
        }
      });

      // Report first/primary layer
      console.log(
        `\n✅ PRIMARY LAYER ID: "${metadata.vector_layers[0].id}"`
      );
    } else {
      console.log('\n⚠️  No vector_layers found in metadata');
    }
  } catch (error) {
    console.error(`❌ Error reading PMTiles: ${error.message}`);
    process.exit(1);
  }
}

inspect().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
