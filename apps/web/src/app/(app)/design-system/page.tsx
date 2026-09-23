import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DesignSystemDemo } from './demo';

export const metadata: Metadata = { title: 'Sistem Desain', robots: { index: false, follow: false } };

export default function DesignSystemPage() {
  // Galeri komponen hanya untuk pengembangan/staging.
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production') notFound();
  return <DesignSystemDemo />;
}
