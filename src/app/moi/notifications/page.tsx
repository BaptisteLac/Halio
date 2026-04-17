import type { Metadata } from 'next';
import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = {
  title: 'Notifications — Halioapp',
};

export default function Page() {
  return <NotificationsClient />;
}
