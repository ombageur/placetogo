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

function copyOne(src, target) {
  try {
    const real = fs.realpathSync(src);
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(real, target, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }
}

for (const root of possibleRoots) {
  if (!fs.existsSync(root)) continue;
  try {
    const items = fs.readdirSync(root);
    for (const item of items) {
      if (item === '.bin' || item === '.pnpm') continue;
      const srcItem = path.join(root, item);
      if (item.startsWith('@')) {
        try {
          const scopedItems = fs.readdirSync(srcItem);
          for (const sub of scopedItems) {
            const subSrc = path.join(srcItem, sub);
            const subTarget = path.join(destModules, item, sub);
            copyOne(subSrc, subTarget);
          }
        } catch {}
      } else {
        const target = path.join(destModules, item);
        copyOne(srcItem, target);
        try {
          const real = fs.realpathSync(srcItem);
          const parent = path.dirname(real);
          if (fs.existsSync(parent) && path.basename(parent) === 'node_modules') {
            const siblings = fs.readdirSync(parent);
            for (const sib of siblings) {
              if (sib === '.bin' || sib === '.pnpm') continue;
              const sibSrc = path.join(parent, sib);
              if (sib.startsWith('@')) {
                const scopedSiblings = fs.readdirSync(sibSrc);
                for (const ssub of scopedSiblings) {
                  copyOne(path.join(sibSrc, ssub), path.join(destModules, sib, ssub));
                }
              } else {
                copyOne(sibSrc, path.join(destModules, sib));
              }
            }
          }
        } catch {}
      }
    }
  } catch {}
}

console.log('Successfully copied all scoped and regular modules to standalone directory!');


