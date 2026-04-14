import type { Metadata } from 'next';
import CarteClient from './CarteClient';

export const metadata: Metadata = {
  title: 'Carte des spots — Halioapp',
};

export default function Page() {
  return <CarteClient />;
}
