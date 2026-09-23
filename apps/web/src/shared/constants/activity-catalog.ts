/**
 * Dua belas kategori ajakan resmi, diselaraskan 100% dengan 12 Minat Resmi (INTEREST_CATALOG).
 */
export const ACTIVITY_CATEGORY_CATALOG = [
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

export type ActivityCategoryId = (typeof ACTIVITY_CATEGORY_CATALOG)[number]['id'];
export const ACTIVITY_CATEGORY_IDS = ACTIVITY_CATEGORY_CATALOG.map((c) => c.id) as [
  ActivityCategoryId,
  ...ActivityCategoryId[],
];

/** Pemetaan kategori lama/legacy ke 12 minat resmi */
export const LEGACY_ACTIVITY_CATEGORY_MAP: Record<string, ActivityCategoryId> = {
  ngopi: 'kuliner',
  makan: 'kuliner',
  nonton: 'film',
  'jalan-jalan': 'pertemanan',
  hobi: 'seni',
  profesional: 'karier',
  dating: 'pertemanan',
  kreator: 'video',
  belajar: 'buku',
  'aksi-sosial': 'relawan',
  game: 'komunitas',
  lainnya: 'ngobrol',
};

/**
 * Memetakan id kategori lama ke penggantinya, tanpa menebak untuk nilai yang tidak dikenal.
 *
 * Dipakai saat memvalidasi masukan: dokumen lama yang menyimpan `ngopi` tetap diterima dan
 * dipindahkan ke `kuliner`, sementara nilai asing seperti `ngawur` dibiarkan apa adanya agar
 * ditolak oleh enum. Berbeda dari normalizeActivityCategoryId yang selalu mengembalikan
 * kategori valid dan karena itu hanya cocok untuk keperluan tampilan.
 */
export function mapLegacyActivityCategoryId(id: string): string {
  if ((ACTIVITY_CATEGORY_IDS as readonly string[]).includes(id)) return id;
  return LEGACY_ACTIVITY_CATEGORY_MAP[id] ?? id;
}

export function normalizeActivityCategoryId(id?: string | null): ActivityCategoryId {
  if (!id) return 'ngobrol';
  if ((ACTIVITY_CATEGORY_IDS as readonly string[]).includes(id)) {
    return id as ActivityCategoryId;
  }
  return LEGACY_ACTIVITY_CATEGORY_MAP[id] ?? 'ngobrol';
}


/**
 * Sifat ajakan yang bisa dicentang pembuatnya, lalu ditampilkan di halaman detail.
 *
 * Gunanya membantu calon peserta menilai apakah suasananya cocok sebelum bergabung —
 * hal yang sulit dinilai dari judul saja, dan penting untuk pengguna yang introvert.
 * Sebelumnya tiga sifat seperti ini ditampilkan tetap di setiap ajakan tanpa pernah
 * dipilih siapa pun, sehingga tidak berarti apa-apa.
 */
export const ACTIVITY_TRAIT_CATALOG = [
  { id: 'ramah-introvert', label: 'Ramah introvert' },
  { id: 'suasana-santai', label: 'Suasana santai' },
  { id: 'obrolan-bebas', label: 'Obrolan bebas' },
  { id: 'grup-kecil', label: 'Grup kecil' },
  { id: 'tempat-publik', label: 'Di tempat publik' },
  { id: 'ramah-pemula', label: 'Ramah pemula' },
  { id: 'tanpa-alkohol', label: 'Tanpa alkohol' },
  { id: 'ramah-difabel', label: 'Akses ramah difabel' },
] as const;

export type ActivityTraitId = (typeof ACTIVITY_TRAIT_CATALOG)[number]['id'];
export const ACTIVITY_TRAIT_IDS = ACTIVITY_TRAIT_CATALOG.map((t) => t.id) as [
  ActivityTraitId,
  ...ActivityTraitId[],
];

/** Batas jumlah sifat yang boleh dipilih, agar daftarnya tetap terbaca sekilas. */
export const MAX_ACTIVITY_TRAITS = 4;
