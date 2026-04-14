import type { Metadata } from 'next';
import SemaineClient from './SemaineClient';

export const metadata: Metadata = {
  title: 'Cette semaine — Halioapp',
};

export default function Page() {
  return <SemaineClient />;
}
