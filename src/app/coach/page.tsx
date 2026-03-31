'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import type { CoachContext } from '@/types';
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

function LoadingCoach() {
  return (
    <div className="min-h-screen bg-slate-950 pb-20 flex flex-col">
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
          <p className="text-slate-500 text-sm">Chargement des conditions live…</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default function CoachPage() {
  const [coachContext, setCoachContext] = useState<CoachContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charge les données live au mount
  useEffect(() => {
    const now = new Date();
    Promise.allSettled([getTideData(now), fetchWeatherData()])
      .then(([tideResult, weatherResult]) => {
        if (tideResult.status === 'rejected') {
          setLoadError('Impossible de charger les données de marées.');
          return;
        }
        if (weatherResult.status === 'rejected') {
          setLoadError('Impossible de charger les données météo.');
          return;
        }
        const tideData = tideResult.value;
        const weatherData = weatherResult.value;
        const solunarData = getSolunarData(now);
        const topSpecies = getTopSpeciesForConditions(
          SPECIES,
          DASHBOARD_SPOT,
          weatherData,
          tideData,
          solunarData,
          now,
          3,
        );
        setCoachContext({ tideData, weatherData, solunarData, topSpecies });
      });
  }, []);

  // Le transport est mémorisé pour éviter de réinstancier (et donc réinitialiser
  // le chat) à chaque re-render. Il change seulement quand coachContext est défini
  // pour la première fois (au mount).
  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/coach',
      body: coachContext ? { context: coachContext } : undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [!!coachContext], // recréer uniquement au passage null → défini
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Autoscroll vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 pb-20">
        <div className="text-center">
          <p className="text-red-400 font-medium">Erreur de chargement</p>
          <p className="text-slate-500 text-sm mt-1">{loadError}</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!coachContext) {
    return <LoadingCoach />;
  }

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue('');
    sendMessage({ text });
  };

  const handleSuggestionSelect = (text: string) => {
    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800/80">
        <div className="px-4 py-3 max-w-lg mx-auto space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-violet-400" />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <h1 className="text-base font-bold text-white">Coach PêcheBoard</h1>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400">
                Conditions live
              </span>
            </div>
          </div>
          <ConditionBadges context={coachContext} />
        </div>
      </header>

      {/* Zone messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {messages.length === 0 ? (
          <div className="space-y-6 pt-2">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                <Sparkles size={24} className="text-violet-400" />
              </div>
              <h2 className="text-white font-semibold">Comment puis-je vous aider ?</h2>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                Je connais les conditions actuelles du Bassin — marées, météo, espèces, réglementations.
              </p>
            </div>
            <SuggestionCards onSelect={handleSuggestionSelect} />
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {messages.map((m) => {
              // En v6, le message a des `parts` ; on reconstruit le texte
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
                <span className="text-slate-500 text-xs">Le coach réfléchit…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input — positionné au-dessus de la BottomNav */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800/80 px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <input
            id="coach-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question…"
            disabled={isLoading || !coachContext}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 disabled:opacity-50 transition-colors"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim() || !coachContext}
            className="w-10 h-10 flex-shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-150 active:scale-95"
            aria-label="Envoyer"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
