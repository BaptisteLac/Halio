'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Loader2, Lock } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { CoachContext } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';
import { T } from '@/design/tokens';
import { ISparkles, ISend } from '@/design/icons';
import BottomNav from '@/components/layout/BottomNav';
import ChatMessage from '@/components/coach/ChatMessage';
import SuggestionCards from '@/components/coach/SuggestionCards';
import ConditionBadges from '@/components/coach/ConditionBadges';
import CoachUsageBar from '@/components/coach/CoachUsageBar';
import { useCoachUsage } from '@/hooks/useCoachUsage';

function LoadingCoach() {
  return (
    <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: T.l1, borderBottom: `1px solid ${T.border}`, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 512, margin: '0 auto' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${T.coach}20`, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 20, width: 144, background: T.l3, borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${T.coach}10`, border: `1px solid ${T.coach}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ISparkles size={18} color={T.coach} />
          </div>
          <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0 }}>Chargement…</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function UnauthenticatedCoach() {
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '0 32px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `${T.coach}10`, border: `1px solid ${T.coach}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ISparkles size={28} color={T.coach} />
          </div>
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: T.l1, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={11} color={T.t3} />
          </div>
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: T.t1, margin: '0 0 8px' }}>Coach Halio</h1>
          <p style={{ fontSize: '0.875rem', color: T.t3, lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
            Connectez-vous pour accéder au coach IA — conseils personnalisés sur les conditions du Bassin en temps réel.
          </p>
        </div>
        <Link
          href="/journal"
          style={{ background: T.coach, color: '#fff', fontWeight: 600, borderRadius: 12, padding: '12px 32px', fontSize: '0.875rem', textDecoration: 'none' }}
        >
          Se connecter
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}

export default function CoachClient() {
  const [user,         setUser]         = useState<SupabaseUser | null | undefined>(undefined);
  const [coachContext, setCoachContext] = useState<CoachContext | null>(null);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [inputValue,   setInputValue]   = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const usage = useCoachUsage();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    Promise.allSettled([getTideData(now), fetchWeatherData()])
      .then(([tideResult, weatherResult]) => {
        if (tideResult.status === 'rejected' || weatherResult.status === 'rejected') {
          const failed = [
            tideResult.status === 'rejected' ? 'marées' : null,
            weatherResult.status === 'rejected' ? 'météo' : null,
          ].filter(Boolean).join(' et ');
          setLoadError(`Impossible de charger les données de ${failed}.`);
          return;
        }
        const tideData    = tideResult.value;
        const weatherData = weatherResult.value;
        const solunarData = getSolunarData(now);
        const topSpecies  = getTopSpeciesForConditions(SPECIES, DASHBOARD_SPOT, weatherData, tideData, solunarData, now, 3);
        setCoachContext({ tideData, weatherData, solunarData, topSpecies });
      });
  }, [user]);

  const contextRef = useRef(coachContext);
  useEffect(() => { contextRef.current = coachContext; }, [coachContext]);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/coach', body: () => ({ context: contextRef.current }) }),
    [],
  );

  const { messages, sendMessage, status } = useChat({ transport });
  const isLoading = status === 'streaming' || status === 'submitted';

  const prevStatus = useRef(status);
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;
    if ((prev === 'streaming' || prev === 'submitted') && status === 'ready') usage.refresh();
  }, [status, usage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (user === undefined) return <LoadingCoach />;
  if (user === null)      return <UnauthenticatedCoach />;

  if (loadError) {
    return (
      <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: T.danger, margin: '0 0 4px' }}>Erreur de chargement</p>
            <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0 }}>{loadError}</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!coachContext) return <LoadingCoach />;

  const limitReached = usage.isLimitReached;

  function handleSend() {
    const text = inputValue.trim();
    if (!text || isLoading || limitReached) return;
    setInputValue('');
    sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80, display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: T.l1, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: '12px 16px', maxWidth: 512, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${T.coach}18`, border: `1px solid ${T.coach}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ISparkles size={14} color={T.coach} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0 }}>Coach Halio</h1>
              <span style={{ fontSize: '0.6875rem', fontWeight: 500, padding: '2px 8px', borderRadius: 9999, background: `${T.coach}10`, border: `1px solid ${T.coach}25`, color: T.coach }}>
                Conditions live
              </span>
            </div>
          </div>
          <ConditionBadges context={coachContext} />
        </div>
        <div style={{ maxWidth: 512, margin: '0 auto' }}>
          <CoachUsageBar usage={usage} />
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '16px', maxWidth: 512, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 8 }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `${T.coach}10`, border: `1px solid ${T.coach}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ISparkles size={24} color={T.coach} />
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: T.t1, margin: 0 }}>Comment puis-je vous aider ?</h2>
              <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0, maxWidth: 280 }}>
                Je connais les conditions actuelles du Bassin — marées, météo, espèces, réglementations.
              </p>
            </div>
            {!limitReached && <SuggestionCards onSelect={(text) => sendMessage({ text })} />}
            {limitReached && (
              <p style={{ textAlign: 'center', fontSize: '0.875rem', color: T.warn, background: `${T.warn}10`, border: `1px solid ${T.warn}20`, borderRadius: 12, padding: '12px 16px' }}>
                Vous avez atteint la limite de {usage.limit} messages pour aujourd&apos;hui.<br />
                <span style={{ color: T.t3 }}>Revenez demain !</span>
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8 }}>
            {messages.map((m) => {
              const textContent = m.parts
                .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                .map((p) => p.text)
                .join('');
              return <ChatMessage key={m.id} role={m.role as 'user' | 'assistant'} content={textContent} />;
            })}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 36 }}>
                <Loader2 size={14} color={T.coach} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.75rem', color: T.t4 }}>Le coach réfléchit…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div style={{
        position: 'fixed',
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
        left: 0,
        right: 0,
        zIndex: 30,
        background: `${T.page}f5`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${T.border}`,
        padding: '12px 16px',
      }}>
        {limitReached ? (
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: T.t4, margin: 0, padding: '4px 0' }}>
            Limite quotidienne atteinte — revenez demain
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 512, margin: '0 auto' }}>
            <input
              id="coach-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)}
              placeholder="Posez votre question…"
              disabled={isLoading || limitReached || usage.loading}
              style={{
                flex: 1,
                background: T.l2,
                border: `1px solid ${T.border2}`,
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: '0.875rem',
                color: T.t1,
                outline: 'none',
                opacity: isLoading || limitReached || usage.loading ? 0.5 : 1,
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim() || limitReached || usage.loading}
              aria-label="Envoyer"
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: 12,
                background: T.coach,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: isLoading || !inputValue.trim() || limitReached || usage.loading ? 0.4 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              <ISend size={16} color="#fff" />
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
