/**
 * Preprocessing Zod: string kosong atau hanya spasi menjadi `undefined` sebelum divalidasi.
 *
 * Catatan: pola sebelumnya `z.string()...optional().or(z.literal('').transform(() =>
 * undefined))` TIDAK bekerja untuk validator yang menerima string kosong (mis. tanpa
 * `.min(1)` atau regex yang mewajibkan karakter) — cabang pertama union sudah berhasil
 * memvalidasi `''` sebagai string kosong yang sah, sehingga union tidak pernah jatuh ke
 * cabang transform. Gunakan helper ini (via `z.preprocess`) agar perilakunya eksplisit dan
 * tidak bergantung pada efek samping validator lain.
 */
export function emptyToUndefined(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}
