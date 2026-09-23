import type { Metadata } from 'next';
import { WalletView } from './wallet-view';

export const metadata: Metadata = {
  title: 'Dompet',
  description: 'Kelola saldo Coin belanja dan Penghasilan yang dapat ditarik di placetogo.',
};

export default function DompetPage() {
  return <WalletView />;
}
