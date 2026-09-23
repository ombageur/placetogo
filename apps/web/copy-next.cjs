const fs = require('fs');
const path = require('path');

const srcNext = path.join(__dirname, 'node_modules', 'next');
const destNext = path.join(__dirname, '.next', 'standalone', 'node_modules', 'next');

if (fs.existsSync(srcNext)) {
  const realSrc = fs.realpathSync(srcNext);
  console.log(`Copying real next from ${realSrc} to ${destNext}...`);
  fs.rmSync(destNext, { recursive: true, force: true });
  fs.mkdirSync(destNext, { recursive: true });
  fs.cpSync(realSrc, destNext, { recursive: true, force: true });
  console.log('Successfully copied physical next package to standalone node_modules/next!');
}


