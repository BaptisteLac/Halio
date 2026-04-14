import type { Metadata } from 'next';
import EspecesClient from './EspecesClient';

export const metadata: Metadata = {
  title: 'Espèces — Halioapp',
};

export default function Page() {
  return <EspecesClient />;
}
