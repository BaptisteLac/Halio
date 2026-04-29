import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";
import SunCalc from "npm:suncalc@1";

type RuleType = "species_score" | "global_score" | "wind_speed" | "coefficient" | "tide_phase" | "pressure_trend";
type Operator = ">" | "<" | ">=" | "<=" | "=";

type NotificationRule = {
  id: string;
  user_id: string;
  zone_id: string;
  type: RuleType;
  species_id: string | null;
  operator: Operator;
  value: string;
  enabled: boolean;
};

type ComputedConditions = {
  global_score: number;
  species_scores: Record<string, number>;
  wind_speed: number;
  coefficient: number;
  tide_phase: "montant" | "descendant" | "etale";
  pressure_trend: "hausse" | "stable" | "baisse";
};

type Zone = { id: string; latitude: number; longitude: number; timezone: string };

const SPECIES_WEIGHTS: Record<string, { coeff: { opt: number; sig: number }; wind: { min: number; max: number; safe: number }; temp: { min: number; max: number; absMin: number } }> = {
  bar:    { coeff: { opt: 75, sig: 20 }, wind: { min: 8,  max: 18, safe: 25 }, temp: { min: 14, max: 20, absMin: 10 } },
  dorade: { coeff: { opt: 55, sig: 25 }, wind: { min: 5,  max: 15, safe: 25 }, temp: { min: 16, max: 23, absMin: 12 } },
  maigre: { coeff: { opt: 90, sig: 15 }, wind: { min: 0,  max: 8,  safe: 20 }, temp: { min: 18, max: 25, absMin: 15 } },
  seiche: { coeff: { opt: 50, sig: 20 }, wind: { min: 5,  max: 12, safe: 18 }, temp: { min: 12, max: 18, absMin: 8  } },
  sole:   { coeff: { opt: 80, sig: 15 }, wind: { min: 0,  max: 12, safe: 20 }, temp: { min: 10, max: 17, absMin: 6  } },
  mulet:  { coeff: { opt: 60, sig: 25 }, wind: { min: 0,  max: 15, safe: 22 }, temp: { min: 14, max: 22, absMin: 10 } },
};

const SST_MONTHLY = [10, 9, 10, 12, 15, 18, 21, 22, 20, 17, 14, 11];

function gaussian(v: number, opt: number, sig: number): number {
  return Math.round(Math.max(0, Math.exp(-((v - opt) ** 2) / (2 * sig ** 2)) * 100));
}

function windScore(kn: number, min: number, max: number, safe: number): number {
  if (kn > safe) return 0;
  if (kn >= min && kn <= max) return 100;
  if (kn < min) return min === 0 ? 100 : Math.round((kn / min) * 80);
  return Math.round(((safe - kn) / (safe - max)) * 100);
}

function pressureScore(trend: "hausse" | "stable" | "baisse"): number {
  return trend === "baisse" ? 80 : trend === "stable" ? 50 : 20;
}

function tempScore(temp: number, min: number, max: number, absMin: number): number {
  if (temp < absMin) return 0;
  if (temp >= min && temp <= max) return 100;
  if (temp < min) return Math.round(((temp - absMin) / (min - absMin)) * 100);
  return Math.max(0, Math.round(100 - (temp - max) * 10));
}

function computeSpeciesScore(speciesId: string, coeff: number, windKn: number, trend: "hausse" | "stable" | "baisse", temp: number): number {
  const w = SPECIES_WEIGHTS[speciesId];
  if (!w) return 0;
  return Math.round(
    gaussian(coeff, w.coeff.opt, w.coeff.sig) * 0.40 +
    windScore(windKn, w.wind.min, w.wind.max, w.wind.safe) * 0.35 +
    pressureScore(trend) * 0.15 +
    tempScore(temp, w.temp.min, w.temp.max, w.temp.absMin) * 0.10
  );
}

function estimateCoefficient(moonPhase: number): number {
  const dist = 1 - Math.abs((moonPhase % 0.5) / 0.25 - 1);
  return Math.round(45 + dist * 50);
}

function evaluateRule(rule: NotificationRule, c: ComputedConditions): boolean {
  if (!rule.enabled) return true;
  if (rule.type === "tide_phase") return c.tide_phase === rule.value;
  if (rule.type === "pressure_trend") return c.pressure_trend === rule.value;

  let actual: number;
  if (rule.type === "species_score") actual = c.species_scores[rule.species_id ?? ""] ?? 0;
  else if (rule.type === "global_score") actual = c.global_score;
  else if (rule.type === "wind_speed") actual = c.wind_speed;
  else actual = c.coefficient;

  const threshold = Number(rule.value);
  if (rule.operator === ">")  return actual > threshold;
  if (rule.operator === "<")  return actual < threshold;
  if (rule.operator === ">=") return actual >= threshold;
  if (rule.operator === "<=") return actual <= threshold;
  if (rule.operator === "=")  return actual === threshold;
  return false;
}

function evaluateRules(rules: NotificationRule[], c: ComputedConditions): boolean {
  return rules.every((r) => evaluateRule(r, c));
}

async function fetchConditionsForDates(zone: Zone, dates: Date[]): Promise<Map<string, { windKn: number; trend: "hausse" | "stable" | "baisse" }>> {
  const start = dates[0].toISOString().split("T")[0];
  const end   = dates[dates.length - 1].toISOString().split("T")[0];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${zone.latitude}&longitude=${zone.longitude}&hourly=wind_speed_10m,pressure_msl&timezone=${encodeURIComponent(zone.timezone)}&start_date=${start}&end_date=${end}&wind_speed_unit=kn`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Open-Meteo ${resp.status}`);
  const data = await resp.json();

  const result = new Map<string, { windKn: number; trend: "hausse" | "stable" | "baisse" }>();

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i].toISOString().split("T")[0];
    const baseHour = i * 24;

    const morningWinds = [6, 7, 8, 9].map((h) => (data.hourly.wind_speed_10m[baseHour + h] as number) ?? 10);
    const avgWind = morningWinds.reduce((a: number, b: number) => a + b, 0) / morningWinds.length;

    const p7  = (data.hourly.pressure_msl[baseHour + 7] as number) ?? 1013;
    const p15 = (data.hourly.pressure_msl[baseHour + 15] as number) ?? 1013;
    const diff = p15 - p7;
    const trend: "hausse" | "stable" | "baisse" = diff < -1.5 ? "baisse" : diff > 1.5 ? "hausse" : "stable";

    result.set(dateStr, { windKn: avgWind, trend });
  }
  return result;
}

async function sendPush(
  subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>,
  payload: { title: string; body: string; url: string; tag: string }
): Promise<number> {
  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err) {
      console.error(`Push failed for ${sub.endpoint.slice(0, 40)}:`, err);
    }
  }
  return sent;
}

Deno.serve(async (_req: Request) => {
  const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const vapidPublic    = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate   = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject   = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@halioapp.com";

  if (!vapidPublic || !vapidPrivate) {
    return new Response(JSON.stringify({ error: "VAPID keys manquantes" }), { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: zones } = await supabase.from("zones").select("*").eq("active", true);
  if (!zones?.length) return new Response(JSON.stringify({ sent: 0, message: "Aucune zone active" }));

  const { data: allRules } = await supabase.from("notification_rules").select("*").eq("enabled", true);
  const { data: allSubs }  = await supabase.from("push_subscriptions").select("*");
  const { data: settings } = await supabase.from("user_settings").select("user_id, notification_days, notification_horizons");

  if (!allRules?.length || !allSubs?.length) {
    return new Response(JSON.stringify({ sent: 0, message: "Aucun abonné actif" }));
  }

  let totalSent = 0;

  for (const zone of zones as Zone[]) {
    const maxHorizon = 7;
    const targetDates = Array.from({ length: maxHorizon }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      return d;
    });

    const weatherMap = await fetchConditionsForDates(zone, targetDates);

    const userIds = [...new Set((allRules as NotificationRule[]).map((r) => r.user_id))];

    for (const userId of userIds) {
      const userRules = (allRules as NotificationRule[]).filter((r) => r.user_id === userId && r.zone_id === zone.id);
      if (!userRules.length) continue;

      const userSubs = (allSubs as Array<{ user_id: string; endpoint: string; p256dh: string; auth: string }>)
        .filter((s) => s.user_id === userId);
      if (!userSubs.length) continue;

      const userSettings = settings?.find((s) => s.user_id === userId);
      const horizons: number[] = userSettings?.notification_horizons ?? [1];
      const notifDays: number[] = userSettings?.notification_days ?? [1,2,3,4,5,6,7];

      for (const horizon of horizons) {
        if (horizon < 1 || horizon > maxHorizon) continue;

        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + horizon);

        const dowIso = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
        if (!notifDays.includes(dowIso)) continue;

        const dateStr = targetDate.toISOString().split("T")[0];
        const weather = weatherMap.get(dateStr);
        if (!weather) continue;

        const moonIllum = SunCalc.getMoonIllumination(targetDate);
        const coefficient = estimateCoefficient(moonIllum.phase);
        const temp = SST_MONTHLY[targetDate.getMonth()];

        const speciesScores: Record<string, number> = {};
        for (const speciesId of Object.keys(SPECIES_WEIGHTS)) {
          speciesScores[speciesId] = computeSpeciesScore(speciesId, coefficient, weather.windKn, weather.trend, temp);
        }
        const globalScore = Math.round(Object.values(speciesScores).reduce((a, b) => a + b, 0) / Object.keys(speciesScores).length);

        const conditions: ComputedConditions = {
          global_score: globalScore,
          species_scores: speciesScores,
          wind_speed: weather.windKn,
          coefficient,
          tide_phase: "montant",
          pressure_trend: weather.trend,
        };

        if (!evaluateRules(userRules, conditions)) continue;

        const { data: existing } = await supabase
          .from("notification_log")
          .select("id")
          .eq("user_id", userId)
          .eq("zone_id", zone.id)
          .eq("target_date", dateStr)
          .eq("horizon_days", horizon)
          .gte("triggered_at", today.toISOString())
          .limit(1);

        if (existing?.length) continue;

        const horizonLabel = horizon === 1 ? "demain" : `dans ${horizon} jours`;
        const dateLabel = targetDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
        const topSpecies = Object.entries(speciesScores).sort((a, b) => b[1] - a[1])[0];
        const topSpeciesName = topSpecies[0].charAt(0).toUpperCase() + topSpecies[0].slice(1);

        const sent = await sendPush(userSubs, {
          title: `Halio — Bonnes conditions ${horizonLabel}`,
          body: `${topSpeciesName} ${topSpecies[1]}/100 · Vent ${Math.round(weather.windKn)} nœuds · Coeff ${coefficient} · ${dateLabel}`,
          url: "https://halioapp.com",
          tag: `halio-${zone.id}-${dateStr}`,
        });

        if (sent > 0) {
          totalSent += sent;
          await supabase.from("notification_log").insert({
            user_id: userId,
            zone_id: zone.id,
            target_date: dateStr,
            horizon_days: horizon,
            scores_snapshot: conditions,
          });
        }
      }
    }
  }

  return new Response(JSON.stringify({ sent: totalSent }), { headers: { "Content-Type": "application/json" } });
});
