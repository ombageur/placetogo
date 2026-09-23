import type { Metadata } from 'next';
import { AdminDashboardView } from './admin-dashboard-view';

export const metadata: Metadata = {
  title: 'Admin Console | placetogo.id',
  description: 'Pusat kelola pengguna, verifikasi mitra venue, moderasi komunitas, dan analisa bisnis placetogo.id.',
};

export default function AdminPage() {
  return <AdminDashboardView />;
}
