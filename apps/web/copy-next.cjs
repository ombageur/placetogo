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
  if (fs.existsSync(target)) return;

  for (const root of possibleRoots) {
    const src = path.join(root, pkgName);
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.cpSync(src, target, { recursive: true, dereference: true });
      console.log(`Successfully copied ${pkgName} to standalone node_modules`);
      return;
    }
  }
}

const criticalPkgs = [
  'next',
  'react',
  'react-dom',
  'zod',
  'clsx',
  'tailwind-merge',
  'class-variance-authority',
  'lucide-react',
  'firebase',
];

for (const pkg of criticalPkgs) {
  copyPackage(pkg);
}

