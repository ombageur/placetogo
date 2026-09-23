/**
 * Token sesi autocomplete Places: satu per "sesi pencarian" (mulai mengetik sampai memilih
 * tempat atau membatalkan), dikirim ke SETIAP panggilan autocomplete + getPlace dalam sesi
 * itu agar Google menagih sebagai satu sesi, bukan per permintaan. Setelah tempat dipilih
 * (atau pencarian dibatalkan), buat token baru untuk sesi berikutnya — jangan dipakai ulang.
 */
export function createSessionToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback untuk lingkungan tanpa crypto.randomUUID (jarang terjadi di browser modern).
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
