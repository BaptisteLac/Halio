'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Sparkles, Send, Loader2, Lock } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { CoachContext } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';
import BottomNav from '@/components/layout/BottomNav';
import ChatMessage from '@/components/coach/ChatMessage';
import SuggestionCards from '@/components/coach/SuggestionCards';
import ConditionBadges from '@/components/coach/ConditionBadges';
import CoachUsageBar from '@/components/coach/CoachUsageBar';
import { useCoachUsage } from '@/hooks/useCoachUsage';

function LoadingCoach() {
  return (
    <div className="min-h-dvh bg-slate-950 pb-20 flex flex-col">
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <div className="w-7 h-7 rounded-full bg-violet-500/20 animate-pulse" />
          <div className="h-5 w-36 bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles size={18} className="text-violet-400" />
          </div>
          <p className="text-slate-400 text-sm">Chargement…</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function UnauthenticatedCoach() {
  return (
    <div className="h-dvh flex flex-col bg-slate-950">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center relative">
          <Sparkles size={28} className="text-violet-400" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
            <Lock size={11} className="text-slate-400" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Coach Halio</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            Connectez-vous pour accéder au coach IA — conseils personnalisés sur les conditions du Bassin en temps réel.
          </p>
        </div>
        <Link
          href="/journal"
          className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl px-8 py-3 text-sm transition-colors"
        >
          Se connecter
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}

export default function CoachClient() {
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [coachContext, setCoachContext] = useState<CoachContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
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
        const tideData = tideResult.value;
        const weatherData = weatherResult.value;
        const solunarData = getSolunarData(now);
        const topSpecies = getTopSpeciesForConditions(
          SPECIES, DASHBOARD_SPOT, weatherData, tideData, solunarData, now, 3,
        );
        setCoachContext({ tideData, weatherData, solunarData, topSpecies });
      });
  }, [user]);

  const contextRef = useRef(coachContext);
  useEffect(() => { contextRef.current = coachContext; }, [coachContext]);

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/coach',
      body: () => ({ context: contextRef.current }),
    }),
    [],
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === 'streaming' || status === 'submitted';

  const prevStatus = useRef(status);
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;
    if ((prev === 'streaming' || prev === 'submitted') && status === 'ready') {
      usage.refresh();
    }
  }, [status, usage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (user === undefined) return <LoadingCoach />;
  if (user === null) return <UnauthenticatedCoach />;

  if (loadError) {
    return (
      <div className="min-h-dvh bg-slate-950 pb-20 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-400 font-medium">Erreur de chargement</p>
            <p className="text-slate-400 text-sm mt-1">{loadError}</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!coachContext) return <LoadingCoach />;

  const limitReached = usage.isLimitReached;

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading || limitReached) return;
    setInputValue('');
    sendMessage({ text });
  };

  const handleSuggestionSelect = (text: string) => {
    if (limitReached) return;
    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-dvh bg-slate-950 pb-20 flex flex-col">
      <header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800/80">
        <div className="px-4 py-3 max-w-lg mx-auto space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-violet-400" />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <h1 className="text-base font-bold text-white">Coach Halio</h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400">
                Conditions live
              </span>
            </div>
          </div>
          <ConditionBadges context={coachContext} />
        </div>
        <div className="max-w-lg mx-auto pb-3">
          <CoachUsageBar usage={usage} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto touch-pan-y px-4 py-4 max-w-lg mx-auto w-full">
        {messages.length === 0 ? (
          <div className="space-y-6 pt-2">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                <Sparkles size={24} className="text-violet-400" />
              </div>
              <h2 className="text-white font-semibold">Comment puis-je vous aider ?</h2>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                Je connais les conditions actuelles du Bassin — marées, météo, espèces, réglementations.
              </p>
            </div>
            {!limitReached && <SuggestionCards onSelect={handleSuggestionSelect} />}
            {limitReached && (
              <p className="text-center text-orange-400/80 text-sm bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
                Vous avez atteint la limite de {usage.limit} messages pour aujourd&apos;hui.<br />
                <span className="text-slate-400">Revenez demain !</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {messages.map((m) => {
              const textContent = m.parts
                .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                .map((p) => p.text)
                .join('');
              return (
                <ChatMessage
                  key={m.id}
                  role={m.role as 'user' | 'assistant'}
                  content={textContent}
                />
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-2 pl-9 pb-2">
                <Loader2 size={14} className="text-violet-400 animate-spin" />
                <span className="text-slate-400 text-xs">Le coach réfléchit…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className="fixed bottom-[calc(4rem_+_env(safe-area-inset-bottom))] left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800/80 px-4 py-3">
        {limitReached ? (
          <p className="text-center text-slate-400 text-sm py-1">
            Limite quotidienne atteinte — revenez demain
          </p>
        ) : (
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            <input
              id="coach-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)}
              placeholder={limitReached ? 'Limite atteinte — revenez demain' : 'Posez votre question…'}
              disabled={isLoading || limitReached || usage.loading}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim() || limitReached || usage.loading}
              className="w-10 h-10 flex-shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-150 active:scale-95"
              aria-label="Envoyer"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
