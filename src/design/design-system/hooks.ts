// Halio Design System v2 — Custom Hooks
// Copie ce fichier dans src/design/hooks.ts

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { scoreColor, scoreLabel } from './tokens';

// ─────────────────────────────────────────
// useScore — logique + couleur score
// ─────────────────────────────────────────
export function useScore(initialScore: number = 0) {
  const [score, setScore] = useState(initialScore);
  const color = scoreColor(score);
  const label = scoreLabel(score);
  return { score, setScore, color, label };
}

// ─────────────────────────────────────────
// useTidePhase — détermine la phase de marée
// Repose sur une timeline de hauteurs horaires
// ─────────────────────────────────────────
export function useTidePhase(heights: number[]) {
  const [phase, setPhase] = useState<'montant' | 'descendant' | 'etale'>('montant');
  
  useEffect(() => {
    if (heights.length < 2) return;
    const current = heights[Math.floor(heights.length / 2)];
    const next = heights[Math.floor(heights.length / 2) + 1];
    
    if (Math.abs(next - current) < 0.1) setPhase('etale');
    else if (next > current) setPhase('montant');
    else setPhase('descendant');
  }, [heights]);

  return phase;
}

// ─────────────────────────────────────────
// useLocalStorage — persist state across refreshes
// (Halio utilise beaucoup localStorage pour la lecture vidéo/position)
// ─────────────────────────────────────────
export function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.error(`Failed to save ${key} to localStorage:`, e);
        }
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

// ─────────────────────────────────────────
// useDebounce — debounce un state pour les inputs
// ─────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ─────────────────────────────────────────
// useFishingWindow — calcule les créneaux optimaux
// Input: score array sur 24h
// Output: array de {start, end, species, color}
// ─────────────────────────────────────────
interface FishingWindow {
  start: number;    // heure décimale (5.5 = 5h30)
  end: number;
  species: string;
  score: number;
  color: string;
}

export function useFishingWindow(scores: number[]): FishingWindow[] {
  const windows: FishingWindow[] = [];
  const THRESHOLD = 70; // score min pour window valide

  let inWindow = false;
  let windowStart = 0;
  let windowScore = 0;

  for (let i = 0; i < scores.length; i++) {
    if (scores[i] >= THRESHOLD) {
      if (!inWindow) {
        inWindow = true;
        windowStart = i;
        windowScore = scores[i];
      } else {
        windowScore = Math.max(windowScore, scores[i]);
      }
    } else {
      if (inWindow) {
        inWindow = false;
        windows.push({
          start: windowStart,
          end: i,
          species: 'Bar', // à adapter selon contexte
          score: Math.round(windowScore),
          color: scoreColor(windowScore),
        });
      }
    }
  }

  // Fermer la dernière window si elle est ouverte
  if (inWindow) {
    windows.push({
      start: windowStart,
      end: scores.length - 1,
      species: 'Bar',
      score: Math.round(windowScore),
      color: scoreColor(windowScore),
    });
  }

  return windows;
}

// ─────────────────────────────────────────
// useFetch — wrapper fetch avec loading/error states
// ─────────────────────────────────────────
interface UseFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export function useFetch<T>(url: string, options: UseFetchOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await fetch(url, {
          method: options.method || 'GET',
          headers: { 'Content-Type': 'application/json', ...options.headers },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [url, options]);

  return { data, loading, error };
}

// ─────────────────────────────────────────
// useMediaQuery — détecte breakpoints
// ─────────────────────────────────────────
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// ─────────────────────────────────────────
// useClickOutside — ferme modals/sheets au click extérieur
// ─────────────────────────────────────────
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  callback: () => void
) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, callback]);
}

// ─────────────────────────────────────────
// usePrevious — garde la valeur précédente
// ─────────────────────────────────────────
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ─────────────────────────────────────────
// useAsync — wrapper pour async operations
// ─────────────────────────────────────────
interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): UseAsyncState<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error instanceof Error ? error : new Error(String(error)) });
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) execute();
  }, [execute, immediate]);

  return state;
}

// ─────────────────────────────────────────
// useTimer — compte à rebours ou chrono
// ─────────────────────────────────────────
export function useTimer(initialSeconds: number = 0, onComplete?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          onComplete?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, onComplete]);

  const start = () => setRunning(true);
  const stop = () => setRunning(false);
  const reset = () => { setSeconds(initialSeconds); setRunning(false); };

  return { seconds, running, start, stop, reset };
}
