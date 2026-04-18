import { streamText, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { buildSystemPrompt } from '@/lib/coach/build-system-prompt';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherDataDirect } from '@/lib/weather/weather-service';
import { getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';
import type { CoachContext } from '@/types';

const SLIDING_WINDOW = 10;
const DAILY_LIMIT = 10;

function getParisDate(): string {
  return new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }); // YYYY-MM-DD
}

function createSupabaseServerClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
}

/**
 * GET /api/coach — diagnostic de santé (public)
 */
export async function GET() {
  const checks: Record<string, string> = {};

  checks.anthropicApiKey = process.env.ANTHROPIC_API_KEY ? 'ok' : 'MANQUANT — définir ANTHROPIC_API_KEY dans Vercel';

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
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'Configuration serveur incomplète' }, { status: 500 });
  }

  // ── 1. Auth ─────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: 'Connexion requise pour utiliser le coach' },
      { status: 401 },
    );
  }

  // ── 2. Rate limiting ─────────────────────────────────────────────────────
  const today = getParisDate();

  // maybeSingle() retourne null sans erreur si la ligne n'existe pas encore
  const { data: usage } = await supabase
    .from('coach_usage')
    .select('messages_today, reset_date')
    .eq('user_id', user.id)
    .maybeSingle();

  const isNewDay = !usage || usage.reset_date < today;
  const currentCount = isNewDay ? 0 : (usage?.messages_today ?? 0);

  if (currentCount >= DAILY_LIMIT) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const resetAt = new Date(
      tomorrow.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }) + 'T00:00:00+01:00'
    ).toISOString();

    return Response.json(
      { error: 'Limite journalière atteinte', resetAt, limit: DAILY_LIMIT },
      { status: 429 },
    );
  }

  // ── 3. Parse body ────────────────────────────────────────────────────────
  let messages: UIMessage[];
  let clientContext: CoachContext | null = null;

  try {
    const body = await req.json() as { messages: UIMessage[]; context?: CoachContext };
    messages = body.messages ?? [];
    clientContext = body.context ?? null;
  } catch (e) {
    return Response.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  // ── 4. Incrémenter avant de streamer ─────────────────────────────────────
  await supabase
    .from('coach_usage')
    .upsert(
      { user_id: user.id, messages_today: currentCount + 1, reset_date: today },
      { onConflict: 'user_id' },
    );

  // ── 5. Convertir les messages ─────────────────────────────────────────────
  let recentMessages;
  try {
    recentMessages = await convertToModelMessages(messages.slice(-SLIDING_WINDOW));
  } catch (e) {
    return Response.json({ error: 'Format de messages invalide' }, { status: 400 });
  }

  // ── 6. Construire le system prompt ───────────────────────────────────────
  // Priorité : contexte envoyé par le client (déjà chargé côté page)
  // Fallback  : re-fetch serveur si le client n'a pas envoyé le contexte
  let systemPrompt: string;
  if (clientContext) {
    try {
      systemPrompt = buildSystemPrompt(clientContext);
    } catch {
      systemPrompt = buildFallbackSystemPrompt();
    }
  } else {
    // Fallback : collecte serveur (compatibilité avec les anciens clients)
    try {
      const now = new Date();
      const [tideData, weatherData] = await Promise.all([
        getTideData(now),
        fetchWeatherDataDirect(),
      ]);
      const solunarData = getSolunarData(now);
      const topSpecies = getTopSpeciesForConditions(
        SPECIES, DASHBOARD_SPOT, weatherData, tideData, solunarData, now, 3,
      );
      systemPrompt = buildSystemPrompt({ tideData, weatherData, solunarData, topSpecies });
    } catch {
      systemPrompt = buildFallbackSystemPrompt();
    }
  }

  // ── 7. Streamer la réponse ────────────────────────────────────────────────
  try {
    const result = streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: systemPrompt,
      messages: recentMessages,
    });
    return result.toUIMessageStreamResponse({
      headers: {
        'X-Coach-Remaining': String(DAILY_LIMIT - (currentCount + 1)),
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
