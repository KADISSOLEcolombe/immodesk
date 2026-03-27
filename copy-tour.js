const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../../tour-module/tour-editor - Copie');
const destDir = path.resolve(__dirname, 'public/tour');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.cpSync(srcDir, destDir, { recursive: true });
console.log('Copy complete');
