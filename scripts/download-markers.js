const https = require('https');
const fs = require('fs');
const path = require('path');

const MARKER_URLS = {
    'need-marker.png': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    'need-marker-2x.png': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    'resource-marker.png': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    'resource-marker-2x.png': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    'marker-icon.png': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    'marker-icon-2x.png': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    'marker-shadow.png': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
};

const MARKERS_DIR = path.join(process.cwd(), 'public', 'markers');

// Create markers directory if it doesn't exist
if (!fs.existsSync(MARKERS_DIR)) {
    fs.mkdirSync(MARKERS_DIR, { recursive: true });
}

// Download each marker
Object.entries(MARKER_URLS).forEach(([filename, url]) => {
    const filepath = path.join(MARKERS_DIR, filename);
    https.get(url, (response) => {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
            console.log(`Downloaded ${filename}`);
        });
    }).on('error', (err) => {
        console.error(`Error downloading ${filename}:`, err);
    });
}); 