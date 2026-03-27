const fs = require('fs');
const path = require('path');

try {
  const srcDir = 'c:\\Users\\ni_vu_ni_connu\\Desktop\\Mathias\\Cours\\GLSI 2025-2026\\Current\\2e_Semestre\\POO_Avancee\\project\\codes\\front\\next\\tour-module\\tour-editor - Copie';
  const destDir = 'c:\\Users\\ni_vu_ni_connu\\Desktop\\Mathias\\Cours\\GLSI 2025-2026\\Current\\2e_Semestre\\POO_Avancee\\project\\codes\\front\\next\\immodesk\\public\\tour';

  if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
  }

  console.log('Copying from', srcDir, 'to', destDir);
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log('Copy complete!');
} catch (e) {
  console.error('Error:', e);
}
