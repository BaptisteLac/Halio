import { streamText, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildSystemPrompt } from '@/lib/coach/build-system-prompt';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';

const SLIDING_WINDOW = 10;

export async function POST(req: Request) {
  const { messages } = await req.json() as { messages: UIMessage[] };

  if (!context) {
    return new Response(
      JSON.stringify({ error: 'Missing context' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Fenêtre glissante : on ne garde que les N derniers messages
  // puis on convertit au format ModelMessage attendu par streamText
  const recentUIMessages = messages.slice(-SLIDING_WINDOW);
  const recentMessages = await convertToModelMessages(recentUIMessages);

  // Calculer les conditions côté serveur — plus robuste que de dépendre
  // du client pour envoyer le contexte (contourne les problèmes de cache PWA,
  // stale closure, etc.)
  const now = new Date();
  const host = req.headers.get('host') ?? 'pecheboard.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const [tideData, weatherData] = await Promise.all([
    getTideData(now),
    fetchWeatherData(baseUrl),
  ]);
  const solunarData = getSolunarData(now);
  const topSpecies = getTopSpeciesForConditions(
    SPECIES, DASHBOARD_SPOT, weatherData, tideData, solunarData, now, 3,
  );

  const systemPrompt = buildSystemPrompt({ tideData, weatherData, solunarData, topSpecies });

  // Appel streaming au LLM
  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: systemPrompt,
    messages: recentMessages,
  });

  // Retourner le flux au client (AI SDK v6 : toUIMessageStreamResponse)
  return result.toUIMessageStreamResponse();
}
