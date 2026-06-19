import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";
import {
  type NotificationRule,
  evaluateRulesAcrossDay,
  buildHourlyConditions,
} from "../_shared/scoring.ts";

type Zone = { id: string; latitude: number; longitude: number; timezone: string };

// Open-ocean swell proxy: Biscarrosse-Plage. The Arcachon zone coords get snapped
// to a sheltered grid cell inside the bay; Biscarrosse sits 25 km south on the
// open Atlantic and gives a representative reading for boats heading out the pass.
const SWELL_PROXY_LAT = 44.43;
const SWELL_PROXY_LNG = -1.25;

type HourlyData = {
  winds: number[];
  clouds: (number | null)[];
  windDirs: (number | null)[];
  swell: (number | null)[];
  trend: "hausse" | "stable" | "baisse";
  dayWindKn: number;
};

async function fetchSwell(dateStr: string, timezone: string): Promise<(number | null)[]> {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${SWELL_PROXY_LAT}&longitude=${SWELL_PROXY_LNG}&hourly=swell_wave_height&timezone=${encodeURIComponent(timezone)}&start_date=${dateStr}&end_date=${dateStr}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Marine ${resp.status}`);
    const data = await resp.json();
    const raw = (data.hourly?.swell_wave_height as (number | null)[] | undefined) ?? [];
    return Array.from({ length: 24 }, (_, h) => raw[h] ?? null);
  } catch (err) {
    console.error("Marine fetch failed:", err);
    return Array.from({ length: 24 }, () => null);
  }
}

async function fetchHourlyData(zone: Zone, dateStr: string): Promise<HourlyData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${zone.latitude}&longitude=${zone.longitude}&hourly=wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover&timezone=${encodeURIComponent(zone.timezone)}&start_date=${dateStr}&end_date=${dateStr}&wind_speed_unit=kn`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Open-Meteo ${resp.status}`);
  const data = await resp.json();

  const windsRaw = (data.hourly.wind_speed_10m as (number | null)[] | undefined) ?? [];
  const cloudsRaw = (data.hourly.cloud_cover as (number | null)[] | undefined) ?? [];
  const pressureRaw = (data.hourly.pressure_msl as (number | null)[] | undefined) ?? [];
  const windDirsRaw = (data.hourly.wind_direction_10m as (number | null)[] | undefined) ?? [];

  const winds: number[] = Array.from({ length: 24 }, (_, h) => windsRaw[h] ?? 10);
  const clouds: (number | null)[] = Array.from({ length: 24 }, (_, h) => cloudsRaw[h] ?? null);
  const windDirs: (number | null)[] = Array.from({ length: 24 }, (_, h) => windDirsRaw[h] ?? null);

  const swell = await fetchSwell(dateStr, zone.timezone);

  const morningWinds = [6, 7, 8, 9].map((h) => winds[h]);
  const dayWindKn = morningWinds.reduce((a, b) => a + b, 0) / morningWinds.length;

  const p7 = pressureRaw[7] ?? 1013;
  const p15 = pressureRaw[15] ?? 1013;
  const diff = p15 - p7;
  const trend: "hausse" | "stable" | "baisse" = diff < -1.5 ? "baisse" : diff > 1.5 ? "hausse" : "stable";

  return { winds, clouds, windDirs, swell, trend, dayWindKn };
}

function formatWindow(matchingHours: number[]): string {
  if (matchingHours.length === 0) return "";
  const sorted = [...matchingHours].sort((a, b) => a - b);
  // Group contiguous runs.
  const runs: Array<[number, number]> = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      runs.push([start, prev]);
      start = sorted[i];
      prev = sorted[i];
    }
  }
  runs.push([start, prev]);
  return runs.map(([s, e]) => `${s}h–${e + 1}h`).join(", ");
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

  const { data: zones }    = await supabase.from("zones").select("*").eq("active", true);
  const { data: allRules } = await supabase.from("notification_rules").select("*").eq("enabled", true);
  const { data: allSubs }  = await supabase.from("push_subscriptions").select("*");
  const { data: settings } = await supabase.from("user_settings").select("user_id, notification_days, notification_horizons");

  if (!zones?.length || !allRules?.length || !allSubs?.length) {
    return new Response(JSON.stringify({ sent: 0 }));
  }

  let totalSent = 0;

  for (const zone of zones as Zone[]) {
    let hourly: HourlyData;
    try {
      hourly = await fetchHourlyData(zone, todayStr);
    } catch (err) {
      console.error(`Weather fetch failed for ${zone.id}:`, err);
      continue;
    }

    const hourlyConditions = buildHourlyConditions(
      zone.latitude,
      zone.longitude,
      todayStr,
      zone.timezone,
      hourly.winds,
      hourly.clouds,
      hourly.windDirs,
      hourly.swell,
      hourly.dayWindKn,
      hourly.trend,
    );

    const userIds = [...new Set((allRules as NotificationRule[]).map((r) => r.user_id))];

    for (const userId of userIds) {
      const userSettings = settings?.find((s) => s.user_id === userId);
      const horizons: number[] = userSettings?.notification_horizons ?? [1];
      if (!horizons.includes(0)) continue;

      const notifDays: number[] = userSettings?.notification_days ?? [1, 2, 3, 4, 5, 6, 7];
      const dowIso = today.getDay() === 0 ? 7 : today.getDay();
      if (!notifDays.includes(dowIso)) continue;

      const userRules = (allRules as NotificationRule[]).filter(
        (r) => r.user_id === userId && r.zone_id === zone.id,
      );
      if (!userRules.length) continue;

      const { matched, matchingHours } = evaluateRulesAcrossDay(userRules, hourlyConditions);
      if (!matched) continue;

      const { data: existing } = await supabase
        .from("notification_log")
        .select("id")
        .eq("user_id", userId)
        .eq("zone_id", zone.id)
        .eq("target_date", todayStr)
        .eq("horizon_days", 0)
        .gte("triggered_at", today.toISOString())
        .limit(1);
      if (existing?.length) continue;

      const userSubs = (allSubs as Array<{ user_id: string; endpoint: string; p256dh: string; auth: string }>)
        .filter((s) => s.user_id === userId);
      if (!userSubs.length) continue;

      const dayConditions = hourlyConditions[0];
      const topSpecies = Object.entries(dayConditions.species_scores).sort((a, b) => b[1] - a[1])[0];
      const topSpeciesName = topSpecies[0].charAt(0).toUpperCase() + topSpecies[0].slice(1);
      const window = formatWindow(matchingHours);

      let sent = 0;
      for (const sub of userSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: "Halio — Bonnes conditions aujourd'hui",
              body: `${topSpeciesName} ${topSpecies[1]}/100 · ${window} · Coeff ${dayConditions.coefficient}`,
              url: "https://halioapp.com",
              tag: `halio-morning-${zone.id}-${todayStr}`,
            }),
          );
          sent++;
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 410 || status === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          } else {
            console.error(`Push failed:`, err);
          }
        }
      }

      if (sent > 0) {
        totalSent += sent;
        await supabase.from("notification_log").insert({
          user_id: userId,
          zone_id: zone.id,
          target_date: todayStr,
          horizon_days: 0,
          scores_snapshot: { ...dayConditions, matchingHours },
        });
      }
    }
  }

  return new Response(JSON.stringify({ sent: totalSent }), { headers: { "Content-Type": "application/json" } });
});
