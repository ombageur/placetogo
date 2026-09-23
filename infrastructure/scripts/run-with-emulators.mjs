// Menjalankan perintah di dalam Firebase Emulator sementara (project demo-, tanpa layanan cloud).
//   node infrastructure/scripts/run-with-emulators.mjs --only auth,firestore -- <perintah tanpa tanda kutip>
// emulators:exec menyetel FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST untuk perintah.
//
// PENTING: skrip ini TIDAK BOLEH dijalankan bersamaan dengan `pnpm emulators` (sesi dev
// yang sedang dipakai untuk browsing manual) karena keduanya memakai port yang sama.
// Sebelum memulai, skrip memeriksa apakah port emulator sudah dipakai; jika ya, langsung
// berhenti dengan pesan jelas TANPA mematikan proses apa pun. Proses Java sisa hanya
// dibersihkan setelah run ini sendiri yang membuka portnya (dibuktikan lewat pre-flight
// check di atas) - tidak pernah mematikan emulator yang sudah berjalan sebelum run ini.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PORT_BY_SERVICE = { auth: 9099, firestore: 8080, storage: 9199 };
const UI_PORTS = [9150, 4000];
const root = fileURLToPath(new URL('../../', import.meta.url));

const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const sepIdx = args.indexOf('--');
if (onlyIdx < 0 || sepIdx < 0 || sepIdx + 1 >= args.length) {
  console.error('Pemakaian: run-with-emulators.mjs --only <layanan> -- <perintah>');
  process.exit(2);
}
const services = args[onlyIdx + 1].split(',');
const command = args.slice(sepIdx + 1).join(' ');
const ports = [...services.map((s) => PORT_BY_SERVICE[s]).filter(Boolean), ...UI_PORTS];

function listeningPorts(candidatePorts) {
  if (process.platform !== 'win32') return [];
  const ps = `Get-NetTCPConnection -LocalPort ${candidatePorts.join(',')} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort`;
  const res = spawnSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
  return (res.stdout ?? '')
    .split(/\s+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

const busyBefore = listeningPorts(ports);
if (busyBefore.length > 0) {
  console.error(
    `Port emulator sudah dipakai (${busyBefore.join(', ')}). Kemungkinan sesi dev (\`pnpm emulators\`) sedang berjalan.\n` +
      'Hentikan sesi itu dahulu sebelum menjalankan test emulator ini, lalu jalankan lagi. Tidak ada proses yang dihentikan otomatis.',
  );
  process.exit(1);
}

const run = spawnSync(
  `pnpm exec firebase emulators:exec --only ${services.join(',')} --project demo-placetogo "${command}"`,
  { stdio: 'inherit', shell: true, cwd: root },
);

// Hanya bersihkan orphan Java bila port-port ini KOSONG sebelum run ini (dibuktikan di atas),
// sehingga proses yang masih menempatinya sekarang pasti berasal dari run ini sendiri.
if (process.platform === 'win32') {
  const ps = `Get-NetTCPConnection -LocalPort ${ports.join(',')} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; if ($p -and $p.ProcessName -eq 'java') { Stop-Process -Id $p.Id -Force } }`;
  spawnSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' });
}

process.exit(run.status ?? 1);
