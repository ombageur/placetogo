const fs = require('fs');
const path = require('path');

const srcModules = path.join(__dirname, 'node_modules');
const destModules = path.join(__dirname, '.next', 'standalone', 'node_modules');

if (fs.existsSync(srcModules)) {
  console.log(`Copying node_modules from ${srcModules} to ${destModules}...`);
  fs.mkdirSync(destModules, { recursive: true });
  fs.cpSync(srcModules, destModules, { recursive: true, dereference: true, force: true });
  console.log('Successfully copied all node_modules to standalone directory!');
}


