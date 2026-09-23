import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'placetogo.id',
    short_name: 'placetogo',
    description: 'Temukan teman, temukan tempat.',
    start_url: '/',
    display: 'standalone',
    lang: 'id',
    background_color: '#ffffff',
    theme_color: '#136548',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
