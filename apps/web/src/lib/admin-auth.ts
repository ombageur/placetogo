'use client';

import * as React from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useDeferredEffect } from '@/hooks/use-mount-effect';

/**
 * Apakah pengguna yang sedang masuk berhak membuka menu admin.
 *
 * Jawabannya diambil dari custom claim `admin` pada ID token Firebase — penanda yang sama
 * yang diperiksa backend di `services/api/src/middleware/auth.ts`. Dengan begitu tampilan
 * klien dan otorisasi server memakai satu sumber kebenaran.
 *
 * Nilai ini hanya untuk menampilkan atau menyembunyikan menu. Penjagaan sesungguhnya ada di
 * backend: setiap rute `/v1/admin/*` memverifikasi claim yang sama pada token, sehingga
 * memanipulasi tampilan di klien tidak memberi akses data apa pun.
 *
 * Sebelumnya hak admin ditebak dari string alamat email, termasuk aturan "email yang memuat
 * kata admin". Aturan itu memberi tampilan admin kepada alamat seperti `admin@contoh.com`
 * milik siapa pun, lalu berakhir dengan galat 403 dari backend. Penebakan itu dihapus.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);

  useDeferredEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    void user
      .getIdTokenResult()
      .then((result) => setIsAdmin(result.claims.admin === true))
      .catch(() => setIsAdmin(false));
  }, [user]);

  return isAdmin;
}
