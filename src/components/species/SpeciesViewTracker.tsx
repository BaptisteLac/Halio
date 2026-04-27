'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface Props {
  speciesId: string;
  speciesName: string;
}

export default function SpeciesViewTracker({ speciesId, speciesName }: Props) {
  const { trackSpeciesViewed } = useAnalytics();

  useEffect(() => {
    trackSpeciesViewed(speciesId, speciesName);
  }, [speciesId, speciesName, trackSpeciesViewed]);

  return null;
}
