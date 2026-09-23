const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'node_modules', 'next');
const dest = path.join(__dirname, '.next', 'standalone', 'node_modules', 'next');

if (fs.existsSync(src)) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, dereference: true });
  console.log('Successfully copied node_modules/next to .next/standalone/node_modules/next');
}
