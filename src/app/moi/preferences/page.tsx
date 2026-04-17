import type { Metadata } from 'next';
import PreferencesClient from './PreferencesClient';

export const metadata: Metadata = {
  title: 'Mes préférences — Halioapp',
};

export default function Page() {
  return <PreferencesClient />;
}
