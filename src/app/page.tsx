import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: "Aujourd'hui — Halioapp",
};

export default function Page() {
  return <DashboardClient />;
}
