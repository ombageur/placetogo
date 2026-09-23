import type { Metadata } from 'next';
import { PaymentView } from './payment-view';

export const metadata: Metadata = {
  title: 'Pembayaran Top Up',
};

export default async function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <PaymentView orderId={orderId} />;
}
