import type {
    CoachContext
} from '@/types';
import { REGULATIONS } from '@/data/regulations';
import { kmhToKnots } from '@/lib/weather/weather-service';
import { formatTideHour } from '@/lib/tides/tide-utils';

export function buildSystemPrompt(ctx: CoachContext): string {
    const { tideData, weatherData, solunarData, topSpecies } = ctx;
    const windKnots = kmhToKnots(weatherData.current.windSpeed);

    return `Tu es un guide de pêche expert du Bassin d'Arcachon.

RÈGLES :
- Réponds UNIQUEMENT à partir des données fournies ci-dessous
- Si une info n'est pas dans le contexte, dis-le honnêtement
- Ne jamais inventer de réglementation
- Réponses en français, concises, actionnables
- Cite toujours le spot et l'espèce par leur nom exact

CONDITIONS ACTUELLES :
- Coefficient : ${tideData.coefficient}
- Phase : ${formatTideHour(tideData.currentHour, tideData.currentPhase)}
- Vent : ${windKnots.toFixed(0)} nœuds (${weatherData.current.windSpeed} km/h), direction ${weatherData.current.windDirection}°
- Pression : ${weatherData.current.pressure} hPa (tendance ${weatherData.current.pressureTrend})
- Lune : ${solunarData.moonPhaseName}

TOP ESPÈCES DU MOMENT :
${topSpecies.map((r, i) =>
        `${i + 1}. ${r.species.name} — score ${r.score.total}/100
   Spot : ${r.spot.name}
   Leurres : ${r.species.lures.slice(0, 3).map(l => l.name).join(', ') || 'appâts naturels'}
   Techniques : ${r.species.techniques.join(', ')}`
    ).join('\n')}

RÉGLEMENTATION :
${REGULATIONS.map(r =>
        `- ${r.speciesId} : ${r.notes}`
    ).join('\n')}
`;
}