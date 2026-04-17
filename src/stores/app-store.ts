'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Préférences utilisateur
  favoriteSpecies: string[];
  favoriteSpots: string[];
  homePort: string;
  notificationsEnabled: boolean;

  // Actions
  toggleFavoriteSpecies: (speciesId: string) => void;
  toggleFavoriteSpot: (spotId: string) => void;
  setHomePort: (port: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      favoriteSpecies: [],
      favoriteSpots: [],
      homePort: 'arcachon',
      notificationsEnabled: false,

      toggleFavoriteSpecies: (speciesId) =>
        set((state) => ({
          favoriteSpecies: state.favoriteSpecies.includes(speciesId)
            ? state.favoriteSpecies.filter((id) => id !== speciesId)
            : [...state.favoriteSpecies, speciesId],
        })),

      toggleFavoriteSpot: (spotId) =>
        set((state) => ({
          favoriteSpots: state.favoriteSpots.includes(spotId)
            ? state.favoriteSpots.filter((id) => id !== spotId)
            : [...state.favoriteSpots, spotId],
        })),

      setHomePort: (port) => set({ homePort: port }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: 'halio-settings',
    }
  )
);
