import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import SunCalc from "npm:suncalc@1";

const ARCACHON_LAT = 44.66;
const ARCACHON_LNG = -1.17;

// ── Helpers score ─────────────────────────────────────────────────────────────

/**
 * Approximation du coefficient de marée depuis la phase lunaire.
 * Vive-eau (nouvelle/pleine lune, phase 0 ou 0.5) → coeff ~95
 * Morte-eau (quartiers, phase 0.25/0.75) → coeff ~45
 */
function estimateCoefficient(moonPhase: number): number {
  const distFromSyzygy = 1 - Math.abs((moonPhase % 0.5) / 0.25 - 1);
  return Math.round(45 + distFromSyzygy * 50);
}

function gaussianScore(value: number, optimal: number, sigma: number): number {
  return Math.max(0, Math.exp(-((value - optimal) ** 2) / (2 * sigma ** 2)) * 100);
}

function windScore(kn: number): number {
  if (kn > 25) return 0;
  if (kn >= 8 && kn <= 18) return 100;
  if (kn < 8) return (kn / 8) * 80;
  return ((25 - kn) / 7) * 100;
}

function pressureScore(trend: "hausse" | "stable" | "baisse"): number {
  return trend === "baisse" ? 80 : trend === "stable" ? 50 : 20;
}

function scoreLabel(s: number): string {
  if (s >= 85) return "Exceptionnel";
  if (s >= 70) return "Excellent";
  if (s >= 55) return "Bon";
  if (s >= 40) return "Moyen";
  return "Faible";
}

function scoreColor(s: number): string {
  if (s >= 85) return "#22d3ee";
  if (s >= 70) return "#4ade80";
  if (s >= 55) return "#facc15";
  if (s >= 40) return "#fb923c";
  return "#f87171";
}

// ── Météo Open-Meteo ──────────────────────────────────────────────────────────

async function fetchWeather(date: Date): Promise<{
  windKnots: number;
  pressureTrend: "hausse" | "stable" | "baisse";
}> {
  const dateStr = date.toISOString().split("T")[0];
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${ARCACHON_LAT}&longitude=${ARCACHON_LNG}` +
    `&hourly=wind_speed_10m,pressure_msl` +
    `&timezone=Europe%2FParis&start_date=${dateStr}&end_date=${dateStr}` +
    `&wind_speed_unit=kn`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Open-Meteo HTTP ${resp.status}`);
  const data = await resp.json();

  // Moyenne vent matin (6h-10h)
  const morningWinds = [6, 7, 8, 9].map((i) => (data.hourly.wind_speed_10m[i] as number) ?? 10);
  const avgWind = morningWinds.reduce((a, b) => a + b, 0) / morningWinds.length;

  // Tendance pression matin→après-midi
  const p7 = (data.hourly.pressure_msl[7] as number) ?? 1013;
  const p15 = (data.hourly.pressure_msl[15] as number) ?? 1013;
  const diff = p15 - p7;
  const pressureTrend: "hausse" | "stable" | "baisse" =
    diff < -1.5 ? "baisse" : diff > 1.5 ? "hausse" : "stable";

  return { windKnots: avgWind, pressureTrend };
}

// ── Template email ────────────────────────────────────────────────────────────

function buildEmailHtml(params: {
  score: number;
  label: string;
  coefficient: number;
  windKnots: number;
  pressureTrend: string;
  moonLabel: string;
  dateLabel: string;
}): string {
  const { score, label, coefficient, windKnots, pressureTrend, moonLabel, dateLabel } = params;
  const color = scoreColor(score);
  const pressureLabel =
    pressureTrend === "baisse" ? "↘ Baisse" :
    pressureTrend === "hausse" ? "↗ Hausse" : "→ Stable";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px;">

    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:36px;">🎣</div>
      <h1 style="margin:4px 0 0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Halio</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Alerte session de pêche</p>
    </div>

    <div style="background:#1e293b;border-radius:20px;padding:28px 24px;text-align:center;margin-bottom:12px;border:1px solid #334155;">
      <p style="margin:0 0 12px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Demain — ${dateLabel}</p>
      <div style="font-size:72px;font-weight:800;color:${color};line-height:1;">${score}</div>
      <div style="font-size:13px;color:#64748b;margin-top:2px;">/ 100</div>
      <div style="display:inline-block;margin-top:14px;padding:5px 20px;background:${color}20;border:1px solid ${color}55;border-radius:100px;font-size:15px;font-weight:600;color:${color};">${label}</div>
    </div>

    <div style="background:#1e293b;border-radius:20px;padding:20px;margin-bottom:16px;border:1px solid #334155;">
      <p style="margin:0 0 14px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Conditions prévues (matin)</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #263858;width:50%;">
            <div style="font-size:12px;color:#64748b;">Coefficient marée</div>
            <div style="font-size:22px;font-weight:700;color:#fff;margin-top:2px;">${coefficient}</div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #263858;text-align:right;">
            <div style="font-size:12px;color:#64748b;">Vent moyen</div>
            <div style="font-size:22px;font-weight:700;color:#fff;margin-top:2px;">${Math.round(windKnots)} nœuds</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0 0;">
            <div style="font-size:12px;color:#64748b;">Pression</div>
            <div style="font-size:22px;font-weight:700;color:#fff;margin-top:2px;">${pressureLabel}</div>
          </td>
          <td style="padding:10px 0 0;text-align:right;">
            <div style="font-size:12px;color:#64748b;">Lune</div>
            <div style="font-size:22px;font-weight:700;color:#fff;margin-top:2px;">${moonLabel}</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="https://halioapp.com" style="display:inline-block;background:#22d3ee;color:#0f172a;font-weight:700;font-size:15px;padding:14px 36px;border-radius:14px;text-decoration:none;">Voir le tableau de bord →</a>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:12px;color:#334155;line-height:1.7;">Vous recevez cet email car les alertes pêche sont activées dans Halio.<br>
      <a href="https://halioapp.com/reglages" style="color:#22d3ee;text-decoration:none;">Gérer mes notifications →</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");

  if (!brevoApiKey) {
    return new Response(
      JSON.stringify({ error: "BREVO_API_KEY non configurée" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Demain matin
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // 2. Météo + lune
    const weather = await fetchWeather(tomorrow);
    const moonIllum = SunCalc.getMoonIllumination(tomorrow);
    const coefficient = estimateCoefficient(moonIllum.phase);
    const moonLabel =
      moonIllum.phase < 0.1 || moonIllum.phase > 0.9 ? "Nouvelle" :
      moonIllum.phase < 0.35 ? "Croissant" :
      moonIllum.phase < 0.65 ? "Pleine" : "Décroissante";

    // 3. Score composite
    const wScore = windScore(weather.windKnots);
    const pScore = pressureScore(weather.pressureTrend);
    const cScore = gaussianScore(coefficient, 75, 20);
    const score = Math.round(Math.min(100, Math.max(0, wScore * 0.35 + pScore * 0.25 + cScore * 0.40)));
    const label = scoreLabel(score);

    console.log(`Score demain: ${score}/100 (vent=${Math.round(weather.windKnots)}kn, coeff≈${coefficient}, pression=${weather.pressureTrend})`);

    const dateLabel = tomorrow.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    // 4. Utilisateurs avec notifications activées
    const { data: settings, error: settingsErr } = await supabase
      .from("user_settings")
      .select("user_id, notification_min_score")
      .eq("notifications_enabled", true);

    if (settingsErr) throw settingsErr;
    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, score, message: "Aucun abonné" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Filtrer selon seuil individuel
    const qualifying = settings.filter(
      (s) => score >= ((s.notification_min_score as number) ?? 70)
    );

    if (qualifying.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, score, message: `Score ${score} en-dessous de tous les seuils` }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Emails depuis auth.users
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const qualifyingIds = new Set(qualifying.map((s) => s.user_id as string));
    const eligibleUsers = authUsers.filter((u) => qualifyingIds.has(u.id) && u.email);

    // 7. Envoi via Brevo
    const emailHtml = buildEmailHtml({
      score, label, coefficient,
      windKnots: weather.windKnots,
      pressureTrend: weather.pressureTrend,
      moonLabel, dateLabel,
    });
    const subject = `🎣 ${label} demain — ${score}/100 · Halio`;

    let sent = 0;
    for (const user of eligibleUsers) {
      try {
        const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "Halio", email: "noreply@halioapp.com" },
            to: [{ email: user.email! }],
            subject,
            htmlContent: emailHtml,
          }),
        });
        if (resp.ok) {
          sent++;
        } else {
          const err = await resp.text();
          console.error(`Échec ${user.email}: ${err}`);
        }
      } catch (err) {
        console.error(`Erreur email ${user.email}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ sent, score, label, coefficient, recipients: eligibleUsers.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erreur globale:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
