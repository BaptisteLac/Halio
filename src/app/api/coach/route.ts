import { streamText, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildSystemPrompt } from '@/lib/coach/build-system-prompt';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherDataDirect } from '@/lib/weather/weather-service';
import { getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';

const SLIDING_WINDOW = 10;

/**
 * GET /api/coach — diagnostic de santé
 * Permet de vérifier que chaque dépendance fonctionne correctement.
 */
export async function GET() {
  const checks: Record<string, string> = {};

  // Vérification de la clé API Anthropic
  checks.anthropicApiKey = process.env.ANTHROPIC_API_KEY
    ? `ok (${process.env.ANTHROPIC_API_KEY.slice(0, 8)}...)`
    : 'MANQUANT — définir ANTHROPIC_API_KEY dans Vercel';

  // Vérification des marées
  try {
    const tideData = await getTideData(new Date());
    checks.tides = `ok (coeff=${tideData.coefficient}, phase=${tideData.currentPhase})`;
  } catch (e) {
    checks.tides = `ERREUR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Vérification météo
  try {
    const weatherData = await fetchWeatherDataDirect();
    checks.weather = `ok (vent=${weatherData.current.windSpeed}km/h, pression=${weatherData.current.pressure}hPa)`;
  } catch (e) {
    checks.weather = `ERREUR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Vérification solunaire
  try {
    const solunarData = getSolunarData(new Date());
    checks.solunar = `ok (lune=${solunarData.moonPhaseName})`;
  } catch (e) {
    checks.solunar = `ERREUR: ${e instanceof Error ? e.message : String(e)}`;
  }

  const allOk = Object.values(checks).every((v) => v.startsWith('ok'));
  return Response.json({ status: allOk ? 'ok' : 'degraded', checks });
}

/**
 * POST /api/coach — endpoint de chat avec le coach
 */
export async function POST(req: Request) {
  // 1. Vérifier la clé API avant tout
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[coach] ANTHROPIC_API_KEY manquant');
    return Response.json(
      { error: 'Configuration serveur incomplète (clé API manquante)' },
      { status: 500 },
    );
  }

  // 2. Parser le body
  let messages: UIMessage[];
  try {
    const body = await req.json() as { messages: UIMessage[] };
    messages = body.messages ?? [];
  } catch (e) {
    console.error('[coach] Erreur parsing body:', e);
    return Response.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  // 3. Convertir les messages UI → format modèle
  let recentMessages;
  try {
    const recentUIMessages = messages.slice(-SLIDING_WINDOW);
    recentMessages = await convertToModelMessages(recentUIMessages);
  } catch (e) {
    console.error('[coach] Erreur convertToModelMessages:', e);
    return Response.json({ error: 'Format de messages invalide' }, { status: 400 });
  }

  // 4. Collecter le contexte de pêche — chaque service est optionnel
  const now = new Date();

  let tideData;
  try {
    tideData = await getTideData(now);
  } catch (e) {
    console.error('[coach] Erreur getTideData:', e);
    tideData = null;
  }

  let weatherData;
  try {
    weatherData = await fetchWeatherDataDirect();
  } catch (e) {
    console.error('[coach] Erreur fetchWeatherDataDirect:', e);
    weatherData = null;
  }

  let solunarData;
  try {
    solunarData = getSolunarData(now);
  } catch (e) {
    console.error('[coach] Erreur getSolunarData:', e);
    solunarData = null;
  }

  // 5. Construire le system prompt avec les données disponibles
  let systemPrompt: string;
  if (tideData && weatherData && solunarData) {
    try {
      const topSpecies = getTopSpeciesForConditions(
        SPECIES, DASHBOARD_SPOT, weatherData, tideData, solunarData, now, 3,
      );
      systemPrompt = buildSystemPrompt({ tideData, weatherData, solunarData, topSpecies });
    } catch (e) {
      console.error('[coach] Erreur buildSystemPrompt:', e);
      systemPrompt = buildFallbackSystemPrompt();
    }
  } else {
    console.warn('[coach] Données partielles — system prompt simplifié', {
      tideData: !!tideData,
      weatherData: !!weatherData,
      solunarData: !!solunarData,
    });
    systemPrompt = buildFallbackSystemPrompt();
  }

  // 6. Streamer la réponse
  try {
    const result = streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: systemPrompt,
      messages: recentMessages,
    });
    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error('[coach] Erreur streamText:', e);
    return Response.json(
      { error: 'Erreur lors de la génération de la réponse' },
      { status: 500 },
    );
  }
}

function buildFallbackSystemPrompt(): string {
  return `Tu es un guide de pêche expert du Bassin d'Arcachon.
Les données de conditions en temps réel sont temporairement indisponibles.
Réponds en français avec des conseils généraux sur la pêche dans le Bassin d'Arcachon.
Ne jamais inventer de réglementation spécifique.`;
}
