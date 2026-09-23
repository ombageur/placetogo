import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ToastProvider } from '@/components/ui/toast';
import '../styles/globals.css';

/*
 * Poppins adalah font merek placetogo.id. Dimuat lewat next/font supaya berkasnya disajikan
 * dari domain sendiri (tanpa permintaan ke Google saat halaman dibuka) dan ruangnya sudah
 * dipesan sejak render pertama, sehingga tidak ada pergeseran tata letak saat font selesai
 * dimuat. Tiga bobot sesuai panduan merek: Regular untuk teks, Medium untuk H3/H4 dan tombol,
 * SemiBold untuk H1/H2.
 */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'placetogo.id', template: '%s | placetogo.id' },
  description: 'Temukan teman, temukan tempat. Teman aktivitas untuk kamu yang introvert.',
  icons: { icon: '/icon.png' },
};

export const viewport: Viewport = { themeColor: '#136548', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={poppins.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
