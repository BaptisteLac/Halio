'use client';

import { useState, useRef } from 'react';
import type { TideData, WeatherData } from '@/types';
import { SPECIES } from '@/data/species';
import { SPOTS } from '@/data/spots';
import { calculateFishingScore } from '@/lib/scoring/fishing-score';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { createClient } from '@/lib/supabase/client';
import type { CatchInsert } from '@/lib/supabase/types';
import { useAnalytics } from '@/hooks/useAnalytics';
import { T } from '@/design/tokens';
import { IX, IChevDown, ICamera, IImage } from '@/design/icons';

interface Props {
  tideData:    TideData | null;
  weatherData: WeatherData | null;
  onSaved: () => void;
  onClose: () => void;
  visible: boolean;
}

const TECHNIQUE_LABELS: Record<string, string> = {
  'leurre-souple':  'Leurre souple',
  'leurre-surface': 'Surface',
  'poisson-nageur': 'Poisson nageur',
  vif:              'Vif',
  verticale:        'Verticale',
  traine:           'Traîne',
  mouche:           'Mouche',
  surf:             'Surfcasting',
  jigging:          'Jigging',
  posé:             'Posé',
  palangrotte:      'Palangrotte',
  casier:           'Casier',
  sèche:            'Sèche (seiche)',
};

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: T.t4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: T.l3,
  border: `1px solid ${T.border2}`,
  borderRadius: 10,
  padding: '10px 12px',
  color: T.t1,
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectWrap: React.CSSProperties = {
  position: 'relative',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  paddingRight: 32,
  cursor: 'pointer',
};

export default function CatchForm({ tideData, weatherData, onSaved, onClose, visible }: Props) {
  const now = new Date();

  const [speciesId,    setSpeciesId]    = useState(SPECIES[0].id);
  const [spotId,       setSpotId]       = useState(SPOTS[0].id);
  const [caughtAt,     setCaughtAt]     = useState(toDatetimeLocal(now));
  const [sizeCm,       setSizeCm]       = useState('');
  const [weightKg,     setWeightKg]     = useState('');
  const [technique,    setTechnique]    = useState('');
  const [lureOrBait,   setLureOrBait]   = useState('');
  const [released,     setReleased]     = useState(false);
  const [notes,        setNotes]        = useState('');
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { trackCatchLogged } = useAnalytics();
  const selectedSpecies = SPECIES.find((s) => s.id === speciesId) ?? SPECIES[0];

  function resetForm() {
    setSpeciesId(SPECIES[0].id);
    setSpotId(SPOTS[0].id);
    setCaughtAt(toDatetimeLocal(new Date()));
    setSizeCm('');
    setWeightKg('');
    setTechnique('');
    setLureOrBait('');
    setReleased(false);
    setNotes('');
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Session expirée. Reconnectez-vous.'); setSaving(false); return; }

    const spot       = SPOTS.find((s) => s.id === spotId) ?? SPOTS[0];
    const caughtDate = new Date(caughtAt);
    const solunar    = getSolunarData(caughtDate);
    const fishingScore =
      tideData && weatherData
        ? calculateFishingScore(selectedSpecies, spot, weatherData, tideData, solunar, caughtDate).total
        : null;

    let photoUrl: string | null = null;
    if (photoFile) {
      const ext  = photoFile.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('catch-photos')
        .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
      if (uploadError) { setError('Erreur upload photo : ' + uploadError.message); setSaving(false); return; }
      const { data: { publicUrl } } = supabase.storage.from('catch-photos').getPublicUrl(path);
      photoUrl = publicUrl;
    }

    const payload: CatchInsert = {
      user_id:        user.id,
      species_id:     speciesId,
      spot_id:        spotId,
      caught_at:      caughtDate.toISOString(),
      size_cm:        sizeCm     ? parseFloat(sizeCm)     : null,
      weight_kg:      weightKg   ? parseFloat(weightKg)   : null,
      technique:      technique  || null,
      lure_or_bait:   lureOrBait || null,
      released,
      notes:          notes      || null,
      photo_url:      photoUrl,
      coefficient:    tideData?.coefficient                  ?? null,
      tide_phase:     tideData?.currentPhase                 ?? null,
      tide_hour:      tideData?.currentHour                  ?? null,
      wind_speed:     weatherData?.current.windSpeed          ?? null,
      wind_direction: weatherData?.current.windDirection      ?? null,
      pressure:       weatherData?.current.pressure           ?? null,
      moon_phase:     solunar.moonPhase,
      fishing_score:  fishingScore,
    };

    const { error: dbError } = await supabase.from('catches').insert(payload);
    setSaving(false);

    if (dbError) {
      setError(dbError.message);
    } else {
      trackCatchLogged(selectedSpecies!.name, weightKg ? parseFloat(weightKg) : 0, spot.name);
      resetForm();
      onSaved();
    }
  }

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
      zIndex: 40,
      transform: visible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 300ms ease',
    }}>
      <div style={{
        background: T.l1,
        borderTop: `1px solid ${T.border}`,
        borderRadius: '16px 16px 0 0',
        maxHeight: '80dvh',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4, position: 'sticky', top: 0, background: T.l1, zIndex: 10 }}>
          <div style={{ width: 40, height: 4, borderRadius: 9999, background: T.border2 }} />
        </div>

        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, margin: 0 }}>Nouvelle prise</h3>
            <button
              onClick={() => { resetForm(); onClose(); }}
              aria-label="Fermer"
              style={{ padding: 6, borderRadius: 8, background: T.l3, border: 'none', cursor: 'pointer', display: 'flex' }}
            >
              <IX size={18} color={T.t3} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Espèce</label>
              <div style={selectWrap}>
                <select value={speciesId} onChange={(e) => { setSpeciesId(e.target.value); setTechnique(''); }} style={selectStyle}>
                  {SPECIES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <IChevDown size={14} color={T.t4} />
                </span>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Spot</label>
              <div style={selectWrap}>
                <select value={spotId} onChange={(e) => setSpotId(e.target.value)} style={selectStyle}>
                  {SPOTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <IChevDown size={14} color={T.t4} />
                </span>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Date et heure</label>
              <input type="datetime-local" value={caughtAt} onChange={(e) => setCaughtAt(e.target.value)} required style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Taille (cm)</label>
                <input type="number" inputMode="decimal" value={sizeCm} onChange={(e) => setSizeCm(e.target.value)} placeholder="ex: 55" min="0" max="300" step="0.5" style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Poids (kg)</label>
                <input type="number" inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="ex: 1.2" min="0" max="100" step="0.1" style={inputStyle} />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Technique</label>
              <div style={selectWrap}>
                <select value={technique} onChange={(e) => setTechnique(e.target.value)} style={selectStyle}>
                  <option value="">— Choisir —</option>
                  {selectedSpecies.techniques.map((t) => (
                    <option key={t} value={t}>{TECHNIQUE_LABELS[t] ?? t}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <IChevDown size={14} color={T.t4} />
                </span>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Leurre / Appât</label>
              <input type="text" value={lureOrBait} onChange={(e) => setLureOrBait(e.target.value)} placeholder="ex: Black Minnow 120, crabe…" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.l2, borderRadius: 10, padding: '12px 16px', border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: '0.875rem', color: T.t1 }}>Poisson relâché</span>
              <button
                type="button"
                onClick={() => setReleased(!released)}
                aria-label="Relâché"
                style={{
                  position: 'relative',
                  width: 40,
                  height: 24,
                  borderRadius: 9999,
                  border: 'none',
                  cursor: 'pointer',
                  background: released ? T.accent : T.l3,
                  transition: 'background 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 4,
                  left: released ? 20 : 4,
                  width: 16,
                  height: 16,
                  background: '#ffffff',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,.3)',
                  transition: 'left 0.15s ease',
                }} />
              </button>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Photo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPhotoFile(file);
                  setPhotoPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              {photoPreview ? (
                <div style={{ position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Aperçu" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10 }} />
                  <button
                    type="button"
                    onClick={() => {
                      if (photoPreview) URL.revokeObjectURL(photoPreview);
                      setPhotoFile(null);
                      setPhotoPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer', display: 'flex' }}
                  >
                    <IX size={14} color={T.t2} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: T.l3, border: `1px dashed ${T.border2}`, borderRadius: 10, padding: '16px', color: T.t3, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  <ICamera size={16} color={T.t3} />
                  <span>Prendre une photo</span>
                  <IImage size={14} color={T.t4} />
                </button>
              )}
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conditions, comportement, anecdote…"
                rows={2}
                maxLength={500}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            {error && <p style={{ fontSize: '0.75rem', color: T.danger, textAlign: 'center', margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={saving}
              style={{ width: '100%', background: T.accent, color: '#0f172a', fontWeight: 600, borderRadius: 12, padding: '14px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer la prise'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
