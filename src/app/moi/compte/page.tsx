import type { Metadata } from 'next';
import CompteClient from './CompteClient';

export const metadata: Metadata = {
  title: 'Mon compte — Halioapp',
};

export default function Page() {
  return <CompteClient />;
}
