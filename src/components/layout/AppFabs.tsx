'use client';

import { useRouter } from 'next/navigation';
import { CoachFAB } from '@/design/primitives';

export default function AppFabs() {
  const router = useRouter();
  return <CoachFAB onClick={() => router.push('/coach')} />;
}
