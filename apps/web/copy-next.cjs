const fs = require('fs');
const path = require('path');

const possibleRoots = [
  path.join(__dirname, 'node_modules'),
  path.join(__dirname, '..', '..', 'node_modules'),
  path.join('/workspace', 'apps', 'web', 'node_modules'),
  path.join('/workspace', 'node_modules'),
];

const destModules = path.join(__dirname, '.next', 'standalone', 'node_modules');
fs.mkdirSync(destModules, { recursive: true });

function copyPackage(pkgName) {
  const target = path.join(destModules, pkgName);
  const checkFile = pkgName === 'next' ? path.join(target, 'dist', 'server', 'next-server.js') : target;

  try {
    if (fs.existsSync(checkFile)) {
      console.log(`${pkgName} is already fully present in standalone node_modules`);
      return;
    }
  } catch {}

  for (const root of possibleRoots) {
    const src = path.join(root, pkgName);
    if (fs.existsSync(src)) {
      try {
        fs.mkdirSync(target, { recursive: true });
        fs.cpSync(src, target, { recursive: true, dereference: true, force: true });
        console.log(`Successfully copied full ${pkgName} to standalone node_modules`);
        return;
      } catch (e) {
        console.warn(`Warning copying ${pkgName}:`, e.message);
      }
    }
  }
}

copyPackage('next');


