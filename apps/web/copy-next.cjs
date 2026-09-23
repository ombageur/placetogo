const fs = require('fs');
const path = require('path');

const possibleRoots = [
  path.join(__dirname, 'node_modules'),
  path.join(__dirname, '..', 'node_modules'),
  path.join(__dirname, '..', '..', 'node_modules'),
  path.join('/workspace', 'apps', 'web', 'node_modules'),
  path.join('/workspace', 'node_modules'),
];

const destModules = path.join(__dirname, '.next', 'standalone', 'node_modules');
fs.mkdirSync(destModules, { recursive: true });

function copyPackage(pkgName) {
  const target = path.join(destModules, pkgName);

  for (const root of possibleRoots) {
    const src = path.join(root, pkgName);
    if (fs.existsSync(src)) {
      try {
        const realSrc = fs.realpathSync(src);
        fs.rmSync(target, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.cpSync(realSrc, target, { recursive: true, force: true });
        console.log(`Successfully copied physical ${pkgName} from ${realSrc} to ${target}`);
        return;
      } catch (e) {
        console.warn(`Warning copying ${pkgName} from ${src}:`, e.message);
      }
    }
  }
}

const requiredPackages = [
  'next',
  'react',
  'react-dom',
  'styled-jsx',
  'client-only',
  'zod',
  'clsx',
  'tailwind-merge',
  'class-variance-authority',
  'lucide-react',
  'firebase',
];

for (const pkg of requiredPackages) {
  copyPackage(pkg);
}


