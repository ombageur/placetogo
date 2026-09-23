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

  // Fallback: search inside .pnpm directory
  for (const root of possibleRoots) {
    const pnpmDir = path.join(root, '.pnpm');
    if (fs.existsSync(pnpmDir)) {
      try {
        const entries = fs.readdirSync(pnpmDir);
        for (const entry of entries) {
          if (entry.startsWith(pkgName + '@') || entry.includes(`+${pkgName}@`)) {
            const nested = path.join(pnpmDir, entry, 'node_modules', pkgName);
            if (fs.existsSync(nested)) {
              const realSrc = fs.realpathSync(nested);
              fs.rmSync(target, { recursive: true, force: true });
              fs.mkdirSync(path.dirname(target), { recursive: true });
              fs.cpSync(realSrc, target, { recursive: true, force: true });
              console.log(`Successfully copied physical ${pkgName} from .pnpm (${realSrc}) to ${target}`);
              return;
            }
          }
        }
      } catch {}
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


