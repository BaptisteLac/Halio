import type { Metadata } from 'next';
import CoachClient from './CoachClient';

export const metadata: Metadata = {
  title: 'Coach IA — Halioapp',
};

export default function Page() {
  return <CoachClient />;
}
