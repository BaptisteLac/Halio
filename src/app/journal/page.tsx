import type { Metadata } from 'next';
import JournalClient from './JournalClient';

export const metadata: Metadata = {
  title: 'Journal — Halioapp',
};

export default function Page() {
  return <JournalClient />;
}
