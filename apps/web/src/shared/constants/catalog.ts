/**
 * Katalog avatar, kota, dan minat. Data murni (tanpa JSX) agar bisa dipakai backend
 * (validasi) maupun web (render). Web merender ilustrasi SVG per avatarId sendiri;
 * di sini hanya id dan label yang jadi sumber kebenaran untuk validasi.
 *
 * Kota: daftar statis kota besar Indonesia untuk MVP profil (bukan panggilan API pihak
 * ketiga). Fase 05 akan menambah geocoding/Places untuk lokasi ajakan; daftar kota profil
 * ini independen dan dapat diperluas kemudian.
 */

/**
 * Dua belas avatar resmi. Urutannya mengikuti lembar ilustrasi sumber (kiri ke kanan,
 * atas ke bawah), sehingga grid pemilihan avatar tampil dengan susunan yang sama.
 * Berkas gambarnya ada di apps/web/public/avatars/<id>.png.
 */
export const AVATAR_CATALOG = [
  { id: 'cat', label: 'Kucing' },
  { id: 'bear', label: 'Beruang' },
  { id: 'fox', label: 'Rubah' },
  { id: 'owl', label: 'Burung Hantu' },
  { id: 'parrot', label: 'Burung Beo' },
  { id: 'panda', label: 'Panda' },
  { id: 'frog', label: 'Katak' },
  { id: 'raccoon', label: 'Rakun' },
  { id: 'koala', label: 'Koala' },
  { id: 'penguin', label: 'Pinguin' },
  { id: 'rabbit', label: 'Kelinci' },
  { id: 'pig', label: 'Babi' },
] as const;

export type AvatarId = (typeof AVATAR_CATALOG)[number]['id'];
export const AVATAR_IDS = AVATAR_CATALOG.map((a) => a.id) as [AvatarId, ...AvatarId[]];

export const CITY_CATALOG = [
  { id: 'jakarta', label: 'Jakarta' },
  { id: 'bandung', label: 'Bandung' },
  { id: 'surabaya', label: 'Surabaya' },
  { id: 'yogyakarta', label: 'Yogyakarta' },
  { id: 'semarang', label: 'Semarang' },
  { id: 'medan', label: 'Medan' },
  { id: 'makassar', label: 'Makassar' },
  { id: 'denpasar', label: 'Denpasar' },
  { id: 'malang', label: 'Malang' },
  { id: 'bogor', label: 'Bogor' },
  { id: 'depok', label: 'Depok' },
  { id: 'tangerang', label: 'Tangerang' },
  { id: 'bekasi', label: 'Bekasi' },
  { id: 'palembang', label: 'Palembang' },
] as const;

export type CityId = (typeof CITY_CATALOG)[number]['id'];
export const CITY_IDS = CITY_CATALOG.map((c) => c.id) as [CityId, ...CityId[]];

/**
 * Dua belas minat resmi. Urutannya mengikuti lembar ikon sumber (kiri ke kanan,
 * atas ke bawah), sehingga grid pemilihan minat tampil dengan susunan yang sama.
 * Berkas ikonnya ada di apps/web/public/interests/<id>.webp.
 */
export const INTEREST_CATALOG = [
  { id: 'ngobrol', label: 'Ngobrol' },
  { id: 'olahraga', label: 'Olahraga' },
  { id: 'film', label: 'Film' },
  { id: 'seni', label: 'Seni & Kerajinan' },
  { id: 'karier', label: 'Karier & Bisnis' },
  { id: 'komunitas', label: 'Komunitas' },
  { id: 'pertemanan', label: 'Pertemanan' },
  { id: 'kuliner', label: 'Kuliner' },
  { id: 'video', label: 'Video & Konten' },
  { id: 'buku', label: 'Buku' },
  { id: 'relawan', label: 'Relawan & Sosial' },
  { id: 'hewan', label: 'Hewan Peliharaan' },
] as const;

export type InterestId = (typeof INTEREST_CATALOG)[number]['id'];
export const INTEREST_IDS = INTEREST_CATALOG.map((i) => i.id) as [InterestId, ...InterestId[]];
