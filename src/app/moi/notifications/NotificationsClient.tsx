'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Bell, BellOff, Plus, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { T } from '@/design/tokens';
import { IChevRight } from '@/design/icons';
import BottomNav from '@/components/layout/BottomNav';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import type { NotificationRuleRow, NotificationRuleInsert } from '@/lib/supabase/types';
import { SPECIES } from '@/data/species';

const JOURS = [
  { id: 1, label: 'Lu' }, { id: 2, label: 'Ma' }, { id: 3, label: 'Me' },
  { id: 4, label: 'Je' }, { id: 5, label: 'Ve' }, { id: 6, label: 'Sa' }, { id: 7, label: 'Di' },
];

const HORIZONS: { days: number; label: string; sublabel: string }[] = [
  { days: 0, label: "Aujourd'hui", sublabel: 'matin J' },
  { days: 1, label: 'La veille',   sublabel: 'J-1' },
  { days: 2, label: '2 jours',     sublabel: 'J-2' },
  { days: 3, label: '3 jours',     sublabel: 'J-3' },
  { days: 5, label: '5 jours',     sublabel: 'J-5' },
  { days: 7, label: '1 semaine',   sublabel: 'J-7' },
];

type RuleType = NotificationRuleRow['type'];
type Operator = NotificationRuleRow['operator'];

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  species_score:  'Score espèce',
  global_score:   'Score global',
  wind_speed:     'Vent (nœuds)',
  coefficient:    'Coefficient',
  tide_phase:     'Phase de marée',
  pressure_trend: 'Tendance pression',
};

const NUMERIC_OPERATORS: { op: Operator; label: string }[] = [
  { op: '>=', label: '≥' },
  { op: '<=', label: '≤' },
  { op: '>',  label: '>' },
  { op: '<',  label: '<' },
];

const TIDE_PHASES     = ['montant', 'descendant', 'etale'];
const PRESSURE_TRENDS = ['hausse', 'stable', 'baisse'];

const sectionLabel: React.CSSProperties = {
  fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.t4, marginBottom: 6,
};

type NewRuleState = {
  type: RuleType;
  species_id: string;
  operator: Operator;
  value: string;
};

export default function NotificationsClient() {
  const router = useRouter();
  const { permission, isSubscribed, loading: pushLoading, subscribe, unsubscribe } = useNotificationPermission();

  const [user,      setUser]      = useState<User | null | undefined>(undefined);
  const [rules,     setRules]     = useState<NotificationRuleRow[]>([]);
  const [notifDays, setNotifDays] = useState<number[]>([1,2,3,4,5,6,7]);
  const [horizons,  setHorizons]  = useState<number[]>([1]);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [newRule,   setNewRule]   = useState<NewRuleState>({ type: 'species_score', species_id: 'bar', operator: '>=', value: '70' });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) return;
      Promise.all([
        supabase.from('notification_rules').select('*').eq('user_id', data.user.id).order('created_at'),
        supabase.from('user_settings').select('notification_days, notification_horizons').eq('user_id', data.user.id).single(),
      ]).then(([rulesRes, settingsRes]) => {
        if (rulesRes.data) setRules(rulesRes.data);
        if (settingsRes.data) {
          if (settingsRes.data.notification_days) setNotifDays(settingsRes.data.notification_days);
          if (settingsRes.data.notification_horizons) setHorizons(settingsRes.data.notification_horizons);
        }
      });
    });
  }, []);

  useEffect(() => { if (user === null) router.push('/moi'); }, [user, router]);

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push('/moi');
  }

  async function saveSettings(overrides?: { days?: number[]; hs?: number[] }) {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('user_settings').upsert(
      { user_id: user.id, notification_days: overrides?.days ?? notifDays, notification_horizons: overrides?.hs ?? horizons },
      { onConflict: 'user_id' },
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleDay(id: number) {
    const next = notifDays.includes(id) ? notifDays.filter((d) => d !== id) : [...notifDays, id].sort((a, b) => a - b);
    setNotifDays(next);
    saveSettings({ days: next });
  }

  function toggleHorizon(days: number) {
    const next = horizons.includes(days) ? horizons.filter((h) => h !== days) : [...horizons, days].sort((a, b) => a - b);
    if (next.length === 0) return;
    setHorizons(next);
    saveSettings({ hs: next });
  }

  async function deleteRule(id: string) {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase.from('notification_rules').delete().eq('id', id);
    if (!error) setRules((prev) => prev.filter((r) => r.id !== id));
  }

  async function addRule() {
    if (!user) return;
    setRuleError(null);
    const supabase = createClient();
    const insert: NotificationRuleInsert = {
      user_id:    user.id,
      zone_id:    'arcachon',
      type:       newRule.type,
      species_id: newRule.type === 'species_score' ? newRule.species_id : null,
      operator:   newRule.operator,
      value:      newRule.value,
      enabled:    true,
    };
    const { data, error } = await supabase.from('notification_rules').insert(insert).select().single();
    if (error) {
      setRuleError('Impossible d\'ajouter la règle. Réessaie.');
      return;
    }
    if (data) setRules((prev) => [...prev, data]);
    setShowForm(false);
    setNewRule({ type: 'species_score', species_id: 'bar', operator: '>=', value: '70' });
  }

  function ruleLabel(rule: NotificationRuleRow): string {
    const typeLabel = RULE_TYPE_LABELS[rule.type];
    if (rule.type === 'species_score') {
      const sp = SPECIES.find((s) => s.id === rule.species_id);
      return `${sp?.name ?? rule.species_id} ${rule.operator} ${rule.value}/100`;
    }
    if (rule.type === 'tide_phase') return `Marée = ${rule.value}`;
    if (rule.type === 'pressure_trend') return `Pression = ${rule.value}`;
    return `${typeLabel} ${rule.operator} ${rule.value}`;
  }

  const isStringType = newRule.type === 'tide_phase' || newRule.type === 'pressure_trend';

  if (user === undefined) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80 }}>
      <header style={{ background: T.l1, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: '12px 16px', maxWidth: 512, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack} aria-label="Retour" style={{ padding: 6, marginLeft: -6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <IChevRight size={22} color={T.t3} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0, flex: 1 }}>Notifications</h1>
          {saving && <span style={{ fontSize: '0.75rem', color: T.t4 }}>Enregistrement…</span>}
          {saved  && <span style={{ fontSize: '0.75rem', color: T.ok, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Sauvegardé</span>}
        </div>
      </header>

      <main style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 512, margin: '0 auto' }}>

        <section>
          <p style={sectionLabel}>Notifications push</p>
          <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isSubscribed ? <Bell size={16} color={T.accent} /> : <BellOff size={16} color={T.t4} />}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: '0.875rem', color: T.t1, margin: 0 }}>Alertes de pêche</p>
                    {isSubscribed && <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: T.ok, background: `${T.ok}15`, border: `1px solid ${T.ok}30`, borderRadius: 9999, padding: '2px 8px' }}>Actif</span>}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: T.t3, margin: 0 }}>
                    {permission === 'unsupported' ? 'Non supporté sur ce navigateur'
                      : permission === 'denied' ? 'Bloqué — autorise dans les réglages du navigateur'
                      : 'Notification quand les conditions sont remplies'}
                  </p>
                </div>
              </div>
              {permission !== 'unsupported' && permission !== 'denied' && (
                <button
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  disabled={pushLoading}
                  aria-label={isSubscribed ? 'Désactiver' : 'Activer'}
                  style={{ position: 'relative', width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: pushLoading ? 'default' : 'pointer', background: isSubscribed ? T.accent : T.l3, opacity: pushLoading ? 0.6 : 1, transition: 'background 0.2s ease', flexShrink: 0 }}
                >
                  <span style={{ position: 'absolute', top: 2, left: isSubscribed ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,.3)', transition: 'left 0.2s ease' }} />
                </button>
              )}
            </div>
          </div>
        </section>

        {isSubscribed && (
          <section>
            <p style={sectionLabel}>Mes règles d'alerte</p>
            <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>

              {rules.length === 0 && !showForm && (
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8125rem', color: T.t4, margin: 0 }}>Aucune règle — toutes les sessions seront alertées</p>
                </div>
              )}

              {rules.map((rule, i) => (
                <div key={rule.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < rules.length - 1 || showForm ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ fontSize: '0.8125rem', color: T.t1 }}>{ruleLabel(rule)}</span>
                  <button onClick={() => deleteRule(rule.id)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: T.t4 }}>
                    <X size={14} />
                  </button>
                </div>
              ))}

              {showForm && (
                <div style={{ padding: '12px 16px', borderTop: rules.length > 0 ? `1px solid ${T.border}` : 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <select
                    value={newRule.type}
                    onChange={(e) => {
                      const type = e.target.value as RuleType;
                      const defaultValue = type === 'tide_phase' ? 'montant' : type === 'pressure_trend' ? 'baisse' : '70';
                      setNewRule({ type, species_id: 'bar', operator: '>=', value: defaultValue });
                    }}
                    style={{ padding: '8px 10px', borderRadius: 8, background: T.l3, border: `1px solid ${T.border}`, color: T.t1, fontSize: '0.8125rem' }}
                  >
                    {(Object.keys(RULE_TYPE_LABELS) as RuleType[]).map((t) => (
                      <option key={t} value={t}>{RULE_TYPE_LABELS[t]}</option>
                    ))}
                  </select>

                  {newRule.type === 'species_score' && (
                    <select
                      value={newRule.species_id}
                      onChange={(e) => setNewRule((r) => ({ ...r, species_id: e.target.value }))}
                      style={{ padding: '8px 10px', borderRadius: 8, background: T.l3, border: `1px solid ${T.border}`, color: T.t1, fontSize: '0.8125rem' }}
                    >
                      {SPECIES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}

                  {!isStringType && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={newRule.operator}
                        onChange={(e) => setNewRule((r) => ({ ...r, operator: e.target.value as Operator }))}
                        style={{ width: 70, padding: '8px 10px', borderRadius: 8, background: T.l3, border: `1px solid ${T.border}`, color: T.t1, fontSize: '0.875rem' }}
                      >
                        {NUMERIC_OPERATORS.map(({ op, label }) => <option key={op} value={op}>{label}</option>)}
                      </select>
                      <input
                        type="number"
                        value={newRule.value}
                        onChange={(e) => setNewRule((r) => ({ ...r, value: e.target.value }))}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: T.l3, border: `1px solid ${T.border}`, color: T.t1, fontSize: '0.8125rem' }}
                      />
                    </div>
                  )}

                  {newRule.type === 'tide_phase' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {TIDE_PHASES.map((v) => (
                        <button key={v} onClick={() => setNewRule((r) => ({ ...r, value: v }))}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: `1px solid ${newRule.value === v ? `${T.accent}40` : T.border}`, background: newRule.value === v ? `${T.accent}15` : T.l3, color: newRule.value === v ? T.accent : T.t3 }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}

                  {newRule.type === 'pressure_trend' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {PRESSURE_TRENDS.map((v) => (
                        <button key={v} onClick={() => setNewRule((r) => ({ ...r, value: v }))}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: `1px solid ${newRule.value === v ? `${T.accent}40` : T.border}`, background: newRule.value === v ? `${T.accent}15` : T.l3, color: newRule.value === v ? T.accent : T.t3 }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}

                  {ruleError && (
                    <p style={{ fontSize: '0.75rem', color: T.danger, margin: 0 }}>{ruleError}</p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setShowForm(false); setRuleError(null); }} style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: T.l3, border: `1px solid ${T.border}`, color: T.t3, fontSize: '0.8125rem', cursor: 'pointer' }}>Annuler</button>
                    <button onClick={addRule} style={{ flex: 2, padding: '9px 0', borderRadius: 8, background: T.accent, border: 'none', color: '#0f172a', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>Ajouter</button>
                  </div>
                </div>
              )}

              {!showForm && (
                <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderTop: rules.length > 0 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: T.accent, fontSize: '0.8125rem', fontWeight: 500 }}>
                  <Plus size={14} /> Ajouter une règle
                </button>
              )}
            </div>
          </section>
        )}

        {isSubscribed && (
          <section>
            <p style={sectionLabel}>Quand être prévenu</p>
            <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, padding: '12px 16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {HORIZONS.map((h) => {
                  const active = horizons.includes(h.days);
                  return (
                    <button key={h.days} onClick={() => toggleHorizon(h.days)}
                      style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', border: `1px solid ${active ? `${T.accent}40` : T.border}`, background: active ? `${T.accent}15` : T.l3, color: active ? T.accent : T.t3 }}>
                      {h.label}
                      <span style={{ display: 'block', fontSize: '0.6875rem', opacity: 0.7 }}>{h.sublabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {isSubscribed && (
          <section>
            <p style={sectionLabel}>Jours cibles</p>
            <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, padding: '12px 16px' }}>
              <p style={{ fontSize: '0.75rem', color: T.t3, marginBottom: 8 }}>Alerter uniquement si le jour de pêche est un :</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {JOURS.map((jour) => {
                  const active = notifDays.includes(jour.id);
                  return (
                    <button key={jour.id} onClick={() => toggleDay(jour.id)}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: `1px solid ${active ? `${T.accent}40` : T.border}`, background: active ? `${T.accent}15` : T.l3, color: active ? T.accent : T.t3 }}>
                      {jour.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {isSubscribed && (
          <section>
            <p style={sectionLabel}>Zone</p>
            <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: T.t1 }}>Bassin d'Arcachon</span>
              <span style={{ fontSize: '0.75rem', color: T.t4 }}>D'autres zones bientôt</span>
            </div>
          </section>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
