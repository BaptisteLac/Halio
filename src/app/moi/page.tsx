import type { Metadata } from 'next';
import MoiClient from './MoiClient';

export const metadata: Metadata = {
  title: 'Mon profil — Halioapp',
};

export default function Page() {
  return <MoiClient />;
}
