'use client';

import { usePostHog } from 'posthog-js/react';

export function useAnalytics() {
  const posthog = usePostHog();

  return {
    trackFishingScoreViewed(score: number, location: string, tidePhase: string) {
      posthog.capture('fishing_score_viewed', { score, location, tidePhase });
    },
    trackSpotSelected(spotId: string, spotName: string, spotType: string) {
      posthog.capture('spot_selected', { spotId, spotName, spotType });
    },
    trackSpeciesViewed(speciesId: string, speciesName: string) {
      posthog.capture('species_viewed', { speciesId, speciesName });
    },
    trackCatchLogged(species: string, weightKg: number, location: string) {
      posthog.capture('catch_logged', { species, weightKg, location });
    },
  };
}
