const fs = require('fs');
const path = require('path');

// Index mẫu v2.0
const indexData = {
  "version": "2.0",
  "generated": new Date().toISOString(),
  "index": { 
      "33:48": [108.21, 16.03],
      "14:105": [108.22, 16.04] 
  }
};

const outputDir = path.join(__dirname, '../public/data');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'search_index.json'), JSON.stringify(indexData));
console.log("✅ Search Index Created Successfully!");
