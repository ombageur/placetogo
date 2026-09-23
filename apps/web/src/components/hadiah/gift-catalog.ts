export interface GiftItem {
  id: string;
  code: string;
  name: string;
  imageSrc: string;
  coinPrice: number; // Coin yang dipotong dari pengirim
  earningsIdr: number; // Nilai Penghasilan (Rupiah) yang didapat penerima & bisa ditarik
  description: string;
  badgeText?: string;
}

/**
 * 21 Icon Hadiah Dukungan Resmi PlaceToGo (Dari Folder Aset placetogo-icon-hadiah-21):
 * Nominal terendah: 5.000 Coin (Rp5.000)
 * Nominal tertinggi: 250.000 Coin (Rp250.000)
 */
export const ALL_21_GIFTS: readonly GiftItem[] = [
  {
    id: '01_kopi',
    code: 'kopi',
    name: 'Kopi',
    imageSrc: '/hadiah/01-kopi.png',
    coinPrice: 5000,
    earningsIdr: 5000,
    description: 'Secangkir kopi hangat untuk teman ngobrol santai',
    badgeText: 'Populer',
  },
  {
    id: '05_like',
    code: 'like',
    name: 'Like',
    imageSrc: '/hadiah/05-like.png',
    coinPrice: 5000,
    earningsIdr: 5000,
    description: 'Jempol apresiasi untuk inisiator dan peserta yang keren',
    badgeText: 'Favorit',
  },
  {
    id: '03_love',
    code: 'love',
    name: 'Love',
    imageSrc: '/hadiah/03-love.png',
    coinPrice: 10000,
    earningsIdr: 10000,
    description: 'Apresiasi tulus dari hati untuk teman terbaik',
  },
  {
    id: '04_kiss',
    code: 'kiss',
    name: 'Kiss',
    imageSrc: '/hadiah/04-kiss.png',
    coinPrice: 10000,
    earningsIdr: 10000,
    description: 'Kecupan ramah tanda persahabatan hangat',
  },
  {
    id: '14_sayang',
    code: 'sayang',
    name: 'Sayang',
    imageSrc: '/hadiah/14-sayang.png',
    coinPrice: 10000,
    earningsIdr: 10000,
    description: 'Finger heart tanda kasih dan persahabatan akrab',
  },
  {
    id: '06_applause',
    code: 'applause',
    name: 'Applause',
    imageSrc: '/hadiah/06-applause.png',
    coinPrice: 15000,
    earningsIdr: 15000,
    description: 'Tepuk tangan meriah atas pertemuan yang sukses',
  },
  {
    id: '20_meow',
    code: 'meow',
    name: 'Meow',
    imageSrc: '/hadiah/20-meow.png',
    coinPrice: 15000,
    earningsIdr: 15000,
    description: 'Kucing lucu pembawa tawa dan keakraban',
  },
  {
    id: '07_bintang',
    code: 'bintang',
    name: 'Bintang',
    imageSrc: '/hadiah/07-bintang.png',
    coinPrice: 20000,
    earningsIdr: 20000,
    description: 'Bintang bersinar untuk anggota komunitas favorit',
  },
  {
    id: '02_bunga',
    code: 'bunga',
    name: 'Bunga',
    imageSrc: '/hadiah/02-bunga.png',
    coinPrice: 25000,
    earningsIdr: 25000,
    description: 'Buket bunga manis pembawa senyum dan apresiasi',
    badgeText: 'Spesial',
  },
  {
    id: '09_peluk',
    code: 'peluk',
    name: 'Peluk',
    imageSrc: '/hadiah/09-peluk.png',
    coinPrice: 30000,
    earningsIdr: 30000,
    description: 'Pelukan hangat dino ramah penyemangat hari',
  },
  {
    id: '16_good_vibes',
    code: 'good_vibes',
    name: 'Good Vibes',
    imageSrc: '/hadiah/16-good-vibes.png',
    coinPrice: 35000,
    earningsIdr: 35000,
    description: 'Matahari ceria pembawa energi positif',
  },
  {
    id: '17_keberuntungan',
    code: 'keberuntungan',
    name: 'Keberuntungan',
    imageSrc: '/hadiah/17-keberuntungan.png',
    coinPrice: 40000,
    earningsIdr: 40000,
    description: 'Semanggi daun empat pembawa hoki dan berkah',
  },
  {
    id: '12_inspirasi',
    code: 'inspirasi',
    name: 'Inspirasi',
    imageSrc: '/hadiah/12-inspirasi.png',
    coinPrice: 50000,
    earningsIdr: 50000,
    description: 'Ide cemerlang dan inspirasi obrolan berbobot',
  },
  {
    id: '13_keren',
    code: 'keren',
    name: 'Keren',
    imageSrc: '/hadiah/13-keren.png',
    coinPrice: 50000,
    earningsIdr: 50000,
    description: 'Api semangat membara untuk orang yang luar biasa',
  },
  {
    id: '19_great_job',
    code: 'great_job',
    name: 'Great Job',
    imageSrc: '/hadiah/19-great-job.png',
    coinPrice: 75000,
    earningsIdr: 75000,
    description: 'Dukungan kekuatan dan ketangguhan pantang menyerah',
  },
  {
    id: '10_selamat',
    code: 'selamat',
    name: 'Selamat',
    imageSrc: '/hadiah/10-selamat.png',
    coinPrice: 75000,
    earningsIdr: 75000,
    description: 'Terompet pesta untuk merayakan momen berharga',
  },
  {
    id: '11_happy_birthday',
    code: 'happy_birthday',
    name: 'Happy Birthday',
    imageSrc: '/hadiah/11-happy-birthday.png',
    coinPrice: 100000,
    earningsIdr: 100000,
    description: 'Kue ulang tahun manis untuk teman istimewa',
    badgeText: 'Spesial',
  },
  {
    id: '15_kado',
    code: 'kado',
    name: 'Kado',
    imageSrc: '/hadiah/15-kado.png',
    coinPrice: 100000,
    earningsIdr: 100000,
    description: 'Kotak kado kejutan penuh kebahagiaan',
  },
  {
    id: '08_semangat',
    code: 'semangat',
    name: 'Semangat',
    imageSrc: '/hadiah/08-semangat.png',
    coinPrice: 150000,
    earningsIdr: 150000,
    description: 'Piala emas untuk inisiator dan super host juara',
    badgeText: 'Super Host',
  },
  {
    id: '18_malaikat',
    code: 'malaikat',
    name: 'Malaikat',
    imageSrc: '/hadiah/18-malaikat.png',
    coinPrice: 200000,
    earningsIdr: 200000,
    description: 'Hati bersayap untuk sahabat berhati mulia',
    badgeText: 'Eksklusif',
  },
  {
    id: '21_gas_terus',
    code: 'gas_terus',
    name: 'Gas Terus',
    imageSrc: '/hadiah/21-gas-terus.png',
    coinPrice: 250000,
    earningsIdr: 250000,
    description: 'Roket peluncur impian melesat menuju kesuksesan tertinggi',
    badgeText: 'Ultimate',
  },
];

export const OFFICIAL_GIFTS = ALL_21_GIFTS;
export const SUPPORT_GIFT_CATALOG = ALL_21_GIFTS;

export function getGiftByCode(code?: string | null): GiftItem | undefined {
  if (!code) return ALL_21_GIFTS[0];
  const normalized = code.toLowerCase().replace('-', '_');

  const direct = ALL_21_GIFTS.find(
    (g) =>
      g.id.toLowerCase() === normalized ||
      g.code.toLowerCase() === normalized ||
      g.id.replace('_', '-') === code.toLowerCase()
  );
  if (direct) return direct;

  if (normalized.includes('kopi')) return ALL_21_GIFTS[0];
  if (normalized.includes('like') || normalized.includes('jempol')) return ALL_21_GIFTS[1];
  if (normalized.includes('love') || normalized.includes('hati')) return ALL_21_GIFTS[2];
  if (normalized.includes('kiss') || normalized.includes('cium')) return ALL_21_GIFTS[3];
  if (normalized.includes('sayang') || normalized.includes('saranghae')) return ALL_21_GIFTS[4];
  if (normalized.includes('bunga')) return ALL_21_GIFTS[8];
  if (normalized.includes('gas')) return ALL_21_GIFTS[20];

  return ALL_21_GIFTS[0];
}
