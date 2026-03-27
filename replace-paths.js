const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, 'public/tour');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    const replacements = {
        '"/scripts/': '"/tour/scripts/',
        '"/styles/': '"/tour/styles/',
        '"/assets/': '"/tour/assets/',
        '"/pages/': '"/tour/pages/',
        "'/scripts/": "'/tour/scripts/",
        "'/styles/": "'/tour/styles/",
        "'/assets/": "'/tour/assets/",
        "'/pages/": "'/tour/pages/"
    };

    for (const [search, replace] of Object.entries(replacements)) {
        if (content.includes(search)) {
            content = content.split(search).join(replace);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
        const fullPath = path.join(currentDir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (['.html', '.js', '.css'].includes(path.extname(fullPath))) {
            replaceInFile(fullPath);
        }
    }
}

traverse(dir);
console.log('Path replacement complete');
