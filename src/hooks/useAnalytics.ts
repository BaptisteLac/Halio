'use client';

import { useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';

export function useAnalytics() {
  const posthog = usePostHog();

  const trackFishingScoreViewed = useCallback((score: number, location: string, tidePhase: string) => {
    posthog.capture('fishing_score_viewed', { score, location, tidePhase });
  }, [posthog]);

  const trackSpotSelected = useCallback((spotId: string, spotName: string, spotType: string) => {
    posthog.capture('spot_selected', { spotId, spotName, spotType });
  }, [posthog]);

  const trackSpeciesViewed = useCallback((speciesId: string, speciesName: string) => {
    posthog.capture('species_viewed', { speciesId, speciesName });
  }, [posthog]);

  const trackCatchLogged = useCallback((species: string, weightKg: number, location: string) => {
    posthog.capture('catch_logged', { species, weightKg, location });
  }, [posthog]);

  return { trackFishingScoreViewed, trackSpotSelected, trackSpeciesViewed, trackCatchLogged };
}
