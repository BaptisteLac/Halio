'use client';

import { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon } from 'lucide-react';
import type { TideData, WeatherData } from '@/types';
import { SPECIES } from '@/data/species';
import { SPOTS } from '@/data/spots';
import { calculateFishingScore } from '@/lib/scoring/fishing-score';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { createClient } from '@/lib/supabase/client';
import type { CatchInsert } from '@/lib/supabase/types';

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

export default function CatchForm({ tideData, weatherData, onSaved, onClose, visible }: Props) {
  const now = new Date();

  const [speciesId,  setSpeciesId]  = useState(SPECIES[0].id);
  const [spotId,     setSpotId]     = useState(SPOTS[0].id);
  const [caughtAt,   setCaughtAt]   = useState(toDatetimeLocal(now));
  const [sizeCm,     setSizeCm]     = useState('');
  const [weightKg,   setWeightKg]   = useState('');
  const [technique,  setTechnique]  = useState('');
  const [lureOrBait, setLureOrBait] = useState('');
  const [released,   setReleased]   = useState(false);
  const [notes,      setNotes]      = useState('');
  const [photoFile,  setPhotoFile]  = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const spot = SPOTS.find((s) => s.id === spotId) ?? SPOTS[0];
    const caughtDate = new Date(caughtAt);
    const solunar = getSolunarData(caughtDate);
    const fishingScore =
      tideData && weatherData
        ? calculateFishingScore(selectedSpecies, spot, weatherData, tideData, solunar, caughtDate).total
        : null;

    // Upload photo si sélectionnée
    let photoUrl: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('catch-photos')
        .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
      if (uploadError) {
        setError('Erreur upload photo : ' + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('catch-photos').getPublicUrl(path);
      photoUrl = publicUrl;
    }

    const payload: CatchInsert = {
      user_id:       user.id,
      species_id:    speciesId,
      spot_id:       spotId,
      caught_at:     caughtDate.toISOString(),
      size_cm:       sizeCm     ? parseFloat(sizeCm)     : null,
      weight_kg:     weightKg   ? parseFloat(weightKg)   : null,
      technique:     technique  || null,
      lure_or_bait:  lureOrBait || null,
      released,
      notes:         notes      || null,
      photo_url:     photoUrl,
      // Conditions auto-remplies
      coefficient:   tideData?.coefficient                       ?? null,
      tide_phase:    tideData?.currentPhase                      ?? null,
      tide_hour:     tideData?.currentHour                       ?? null,
      wind_speed:    weatherData?.current.windSpeed               ?? null,
      wind_direction: weatherData?.current.windDirection          ?? null,
      pressure:      weatherData?.current.pressure                ?? null,
      moon_phase:    solunar.moonPhase,
      fishing_score: fishingScore,
    };

    const { error: dbError } = await supabase.from('catches').insert(payload);
    setSaving(false);

    if (dbError) {
      setError(dbError.message);
    } else {
      resetForm();
      onSaved();
    }
  }

  const selectClass =
    'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors';
  const inputClass =
    'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors';

  return (
    <div
      className={`fixed left-0 right-0 bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))] z-40 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[80dvh] overflow-y-auto overscroll-contain">
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1 sticky top-0 bg-slate-900 z-10">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        <div className="px-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Nouvelle prise</h3>
            <button
              onClick={() => { resetForm(); onClose(); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Espèce */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Espèce</label>
              <select
                value={speciesId}
                onChange={(e) => { setSpeciesId(e.target.value); setTechnique(''); }}
                className={selectClass}
              >
                {SPECIES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Spot */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Spot</label>
              <select value={spotId} onChange={(e) => setSpotId(e.target.value)} className={selectClass}>
                {SPOTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Date/heure */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date et heure</label>
              <input
                type="datetime-local"
                value={caughtAt}
                onChange={(e) => setCaughtAt(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {/* Taille + Poids */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Taille (cm)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={sizeCm}
                  onChange={(e) => setSizeCm(e.target.value)}
                  placeholder="ex: 55"
                  min="0"
                  max="300"
                  step="0.5"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Poids (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="ex: 1.2"
                  min="0"
                  max="100"
                  step="0.1"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Technique */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Technique</label>
              <select value={technique} onChange={(e) => setTechnique(e.target.value)} className={selectClass}>
                <option value="">— Choisir —</option>
                {selectedSpecies.techniques.map((t) => (
                  <option key={t} value={t}>{TECHNIQUE_LABELS[t] ?? t}</option>
                ))}
              </select>
            </div>

            {/* Leurre / Appât */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Leurre / Appât</label>
              <input
                type="text"
                value={lureOrBait}
                onChange={(e) => setLureOrBait(e.target.value)}
                placeholder="ex: Black Minnow 120, crabe…"
                className={inputClass}
              />
            </div>

            {/* Relâché */}
            <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
              <span className="text-sm text-white">Poisson relâché</span>
              <button
                type="button"
                onClick={() => setReleased(!released)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  released ? 'bg-cyan-400' : 'bg-slate-600'
                }`}
                aria-label="Relâché"
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    released ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Photo */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Photo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPhotoFile(file);
                  setPhotoPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              {photoPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Aperçu"
                    className="w-full h-40 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => { if (photoPreview) URL.revokeObjectURL(photoPreview); setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 bg-slate-900/80 text-slate-300 rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 bg-slate-700 border border-slate-600 border-dashed rounded-xl py-4 text-slate-400 text-sm hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                >
                  <Camera size={16} />
                  <span>Prendre une photo</span>
                  <ImageIcon size={14} className="ml-1 opacity-60" />
                </button>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conditions, comportement, anecdote…"
                rows={2}
                maxLength={500}
                className={`${inputClass} resize-none`}
              />
            </div>

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-cyan-400 text-slate-900 font-semibold rounded-xl py-3 text-sm disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer la prise'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
