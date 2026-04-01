import { streamText, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { buildSystemPrompt } from '@/lib/coach/build-system-prompt';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherDataDirect } from '@/lib/weather/weather-service';
import { getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';

const SLIDING_WINDOW = 10;
const DAILY_LIMIT = 20;

function getParisDate(): string {
  return new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }); // YYYY-MM-DD
}

function createSupabaseServerClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* lecture seule dans une route API */ },
      },
    }
  );
}

function createAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/coach — diagnostic de santé (public)
 */
export async function GET() {
  const checks: Record<string, string> = {};

  checks.anthropicApiKey = process.env.ANTHROPIC_API_KEY
    ? `ok (${process.env.ANTHROPIC_API_KEY.slice(0, 8)}...)`
    : 'MANQUANT — définir ANTHROPIC_API_KEY dans Vercel';

  try {
    const tideData = await getTideData(new Date());
    checks.tides = `ok (coeff=${tideData.coefficient}, phase=${tideData.currentPhase})`;
  } catch (e) {
    checks.tides = `ERREUR: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    const weatherData = await fetchWeatherDataDirect();
    checks.weather = `ok (vent=${weatherData.current.windSpeed}km/h, pression=${weatherData.current.pressure}hPa)`;
  } catch (e) {
    checks.weather = `ERREUR: ${e instanceof Error ? e.message : String(e)}`;
  }

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
 * POST /api/coach — chat avec le coach (authentification requise)
 */
export async function POST(req: Request) {
  // 1. Vérifier la clé API Anthropic
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[coach] ANTHROPIC_API_KEY manquant');
    return Response.json({ error: 'Configuration serveur incomplète' }, { status: 500 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[coach] SUPABASE_SERVICE_ROLE_KEY manquant');
    return Response.json({ error: 'Configuration serveur incomplète' }, { status: 500 });
  }

  // 2. Vérifier l'authentification
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: 'Authentification requise pour utiliser le coach.' },
      { status: 401 },
    );
  }

  // 3. Vérifier la limite quotidienne
  const admin = createAdminSupabase();
  const today = getParisDate();

  const { data: usage } = await admin
    .from('coach_usage')
    .select('messages_today, reset_date')
    .eq('user_id', user.id)
    .single();

  const isNewDay = !usage || usage.reset_date < today;
  const messagesToday = isNewDay ? 0 : (usage?.messages_today ?? 0);

  if (messagesToday >= DAILY_LIMIT) {
    return Response.json(
      {
        error: `Limite quotidienne atteinte (${DAILY_LIMIT} messages/jour). Revenez demain !`,
        remaining: 0,
        limit: DAILY_LIMIT,
      },
      { status: 429 },
    );
  }

  // 4. Incrémenter le compteur avant de streamer
  await admin.from('coach_usage').upsert({
    user_id: user.id,
    messages_today: messagesToday + 1,
    reset_date: today,
  });

  // 5. Parser le body
  let messages: UIMessage[];
  try {
    const body = await req.json() as { messages: UIMessage[] };
    messages = body.messages ?? [];
  } catch (e) {
    console.error('[coach] Erreur parsing body:', e);
    return Response.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  // 6. Convertir les messages
  let recentMessages;
  try {
    const recentUIMessages = messages.slice(-SLIDING_WINDOW);
    recentMessages = await convertToModelMessages(recentUIMessages);
  } catch (e) {
    console.error('[coach] Erreur convertToModelMessages:', e);
    return Response.json({ error: 'Format de messages invalide' }, { status: 400 });
  }

  // 7. Collecter le contexte de pêche
  const now = new Date();

  let tideData;
  try {
    tideData = await getTideData(now);
  } catch (e) {
    console.error('[coach] Erreur getTideData:', e);
  }

  let weatherData;
  try {
    weatherData = await fetchWeatherDataDirect();
  } catch (e) {
    console.error('[coach] Erreur fetchWeatherDataDirect:', e);
  }

  let solunarData;
  try {
    solunarData = getSolunarData(now);
  } catch (e) {
    console.error('[coach] Erreur getSolunarData:', e);
  }

  // 8. Construire le system prompt
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
    systemPrompt = buildFallbackSystemPrompt();
  }

  // 9. Streamer la réponse
  const remaining = DAILY_LIMIT - (messagesToday + 1);
  try {
    const result = streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: systemPrompt,
      messages: recentMessages,
    });
    return result.toUIMessageStreamResponse({
      headers: {
        'X-Coach-Remaining': String(remaining),
        'X-Coach-Limit': String(DAILY_LIMIT),
      },
    });
  } catch (e) {
    console.error('[coach] Erreur streamText:', e);
    return Response.json({ error: 'Erreur lors de la génération de la réponse' }, { status: 500 });
  }
}

function buildFallbackSystemPrompt(): string {
  return `Tu es un guide de pêche expert du Bassin d'Arcachon.
Les données de conditions en temps réel sont temporairement indisponibles.
Réponds en français avec des conseils généraux sur la pêche dans le Bassin d'Arcachon.
Ne jamais inventer de réglementation spécifique.`;
}
