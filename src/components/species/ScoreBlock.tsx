'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import type { Species, FishingScore, Spot } from '@/types';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getBestScoreForSpecies } from '@/lib/scoring/fishing-score';
import { SPOTS } from '@/data/spots';
import { T, scoreColor, scoreLabel } from '@/design/tokens';
import { ScoreArc } from '@/design/primitives';
import { IMapPin } from '@/design/icons';
import InfoTooltip from '@/components/ui/InfoTooltip';

interface Props {
  species: Species;
}

export default function ScoreBlock({ species }: Props) {
  const [result, setResult] = useState<{ score: FishingScore; spot: Spot } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const now = new Date();
    Promise.allSettled([getTideData(now), fetchWeatherData()])
      .then(([tideResult, weatherResult]) => {
        if (tideResult.status === 'fulfilled' && weatherResult.status === 'fulfilled') {
          const solunar = getSolunarData(now);
          setResult(getBestScoreForSpecies(species, SPOTS, weatherResult.value, tideResult.value, solunar, now, SPOTS[0]!));
        } else {
          setError(true);
        }
      });
  }, [species]);

  if (error) {
    return (
      <div style={{ background: T.l2, borderRadius: 14, border: `1px solid ${T.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <WifiOff size={20} color={T.t4} style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0 }}>Score indisponible — météo hors ligne</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ background: T.l2, borderRadius: 14, border: `1px solid ${T.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.l3 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 16, width: 96, background: T.l3, borderRadius: 6 }} />
          <div style={{ height: 12, width: 64, background: T.l3, borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  const { score, spot } = result;
  const color = scoreColor(score.total);
  const label = scoreLabel(score.total);

  return (
    <div style={{
      background: T.l2,
      borderRadius: 14,
      border: `1px solid ${T.border}`,
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <ScoreArc score={score.total} size={100} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <p style={{ fontWeight: 600, color, fontSize: '0.875rem', margin: 0 }}>{label}</p>
          <InfoTooltip content="Score instantané pour cette espèce en ce moment : croise marées, vent, pression et solunaire au meilleur spot disponible. Mis à jour à chaque visite." />
        </div>
        <p style={{ fontSize: '0.75rem', color: T.t3, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <IMapPin size={11} color={T.t3} />
          {spot.name}
        </p>
      </div>
    </div>
  );
}
