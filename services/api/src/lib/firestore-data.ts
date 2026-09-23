/**
 * Firestore menolak `undefined` sebagai nilai field: menulis `{ vaNumber: undefined }`
 * gagal dengan "Cannot use 'undefined' as a Firestore value", berbeda dari menghilangkan
 * kuncinya sama sekali. Sementara itu TypeScript memperlakukan field opsional yang bernilai
 * `undefined` sama saja dengan field yang tidak ada, sehingga galat semacam ini tidak
 * tertangkap saat kompilasi dan baru muncul sebagai kegagalan saat dijalankan.
 *
 * Helper ini membuang kunci bernilai `undefined` tepat sebelum penulisan. Sengaja tidak
 * memakai setelan `ignoreUndefinedProperties` pada Firestore, karena setelan itu berlaku
 * global dan akan membuat field yang keliru tidak terisi menjadi senyap di seluruh aplikasi,
 * bukan cuma di tempat yang memang opsional.
 *
 * Nilai `null` dibiarkan, karena null adalah nilai yang sah di Firestore dan artinya berbeda
 * dari "tidak ada field ini". Hanya kunci di tingkat teratas yang diperiksa.
 */
export function withoutUndefined<T extends Record<string, unknown>>(data: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}
