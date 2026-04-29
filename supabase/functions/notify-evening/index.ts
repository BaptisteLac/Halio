import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";
import {
  type NotificationRule,
  type ComputedConditions,
  evaluateRules,
  computeConditions,
} from "../_shared/scoring.ts";

type Zone = { id: string; latitude: number; longitude: number; timezone: string };

async function fetchWeatherForDates(
  zone: Zone,
  dates: Date[],
): Promise<Map<string, { windKn: number; trend: "hausse" | "stable" | "baisse" }>> {
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

    const p7  = (data.hourly.pressure_msl[baseHour + 7]  as number) ?? 1013;
    const p15 = (data.hourly.pressure_msl[baseHour + 15] as number) ?? 1013;
    const diff = p15 - p7;
    const trend: "hausse" | "stable" | "baisse" = diff < -1.5 ? "baisse" : diff > 1.5 ? "hausse" : "stable";

    result.set(dateStr, { windKn: avgWind, trend });
  }
  return result;
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

  // Derive current Paris date to avoid UTC midnight drift
  const todayStr = new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
  const today = new Date(todayStr);

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

    let weatherMap: Map<string, { windKn: number; trend: "hausse" | "stable" | "baisse" }>;
    try {
      weatherMap = await fetchWeatherForDates(zone, targetDates);
    } catch (err) {
      console.error(`Weather fetch failed for ${zone.id}:`, err);
      continue;
    }

    const userIds = [...new Set((allRules as NotificationRule[]).map((r) => r.user_id))];

    for (const userId of userIds) {
      const userRules = (allRules as NotificationRule[]).filter(
        (r) => r.user_id === userId && r.zone_id === zone.id,
      );
      if (!userRules.length) continue;

      const userSubs = (allSubs as Array<{ user_id: string; endpoint: string; p256dh: string; auth: string }>)
        .filter((s) => s.user_id === userId);
      if (!userSubs.length) continue;

      const userSettings = settings?.find((s) => s.user_id === userId);
      const horizons: number[] = userSettings?.notification_horizons ?? [1];
      const notifDays: number[] = userSettings?.notification_days ?? [1, 2, 3, 4, 5, 6, 7];

      for (const horizon of horizons) {
        if (horizon < 1 || horizon > maxHorizon) continue;

        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + horizon);

        const dowIso = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
        if (!notifDays.includes(dowIso)) continue;

        const dateStr = targetDate.toISOString().split("T")[0];
        const weather = weatherMap.get(dateStr);
        if (!weather) continue;

        const conditions: ComputedConditions = computeConditions(
          zone.latitude,
          zone.longitude,
          targetDate,
          weather.windKn,
          weather.trend,
        );

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
        const topSpecies = Object.entries(conditions.species_scores).sort((a, b) => b[1] - a[1])[0];
        const topSpeciesName = topSpecies[0].charAt(0).toUpperCase() + topSpecies[0].slice(1);

        let sent = 0;
        for (const sub of userSubs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: `Halio — Bonnes conditions ${horizonLabel}`,
                body: `${topSpeciesName} ${topSpecies[1]}/100 · Vent ${Math.round(weather.windKn)} nœuds · Coeff ${conditions.coefficient} · ${dateLabel}`,
                url: "https://halioapp.com",
                tag: `halio-${zone.id}-${dateStr}`,
              }),
            );
            sent++;
          } catch (err: unknown) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status === 410 || status === 404) {
              await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            } else {
              console.error(`Push failed for ${sub.endpoint.slice(0, 40)}:`, err);
            }
          }
        }

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
