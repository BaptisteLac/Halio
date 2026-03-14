import type { Regulation } from '@/types';

export const REGULATIONS: Regulation[] = [
  {
    speciesId: 'bar',
    minSize: 42,
    dailyQuota: 1,
    markingRequired: true,
    closedPeriod: null,
    notes: "1 bar par pêcheur et par jour. Marquage obligatoire à bord. Interdiction de la pêche du bar en dérive moteur coupé à l'exception des embarcations non motorisées.",
  },
  {
    speciesId: 'maigre',
    minSize: 50,
    dailyQuota: null,
    markingRequired: true,
    closedPeriod: null,
    notes: "Marquage obligatoire. Espèce soumise à forte pression. Pratique du no-kill vivement recommandée.",
  },
  {
    speciesId: 'dorade-royale',
    minSize: 23,
    dailyQuota: null,
    markingRequired: true,
    closedPeriod: null,
    notes: "Marquage obligatoire. Taille minimale 23 cm (mesurée de la mâchoire inférieure à la fourche caudale).",
  },
  {
    speciesId: 'seiche',
    minSize: null,
    dailyQuota: null,
    markingRequired: false,
    closedPeriod: null,
    notes: "Pas de taille minimale ni de quota officiel. Il est recommandé de ne pas pêcher les petites seiches en période de reproduction (avril-mai).",
  },
  {
    speciesId: 'sole',
    minSize: 25,
    dailyQuota: null,
    markingRequired: true,
    closedPeriod: null,
    notes: "Taille minimale 25 cm. Marquage obligatoire à bord.",
  },
  {
    speciesId: 'dorade-grise',
    minSize: 23,
    dailyQuota: null,
    markingRequired: false,
    closedPeriod: null,
    notes: "Taille minimale 23 cm.",
  },
  {
    speciesId: 'bar-mouchete',
    minSize: 30,
    dailyQuota: null,
    markingRequired: false,
    closedPeriod: null,
    notes: "Taille minimale 30 cm.",
  },
  {
    speciesId: 'maquereau',
    minSize: 20,
    dailyQuota: 5,
    markingRequired: false,
    closedPeriod: null,
    notes: "Quota de 5 maquereaux par pêcheur et par jour. Taille minimale 20 cm.",
  },
  {
    speciesId: 'chinchard',
    minSize: 15,
    dailyQuota: null,
    markingRequired: false,
    closedPeriod: null,
    notes: "Taille minimale 15 cm. Surtout pêché comme vif.",
  },
  {
    speciesId: 'congre',
    minSize: null,
    dailyQuota: null,
    markingRequired: false,
    closedPeriod: null,
    notes: "Aucune réglementation spécifique en France pour la pêche de loisir.",
  },
];

export function getRegulationBySpecies(speciesId: string): Regulation | undefined {
  return REGULATIONS.find((r) => r.speciesId === speciesId);
}
