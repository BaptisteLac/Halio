// Halio Design System v2 — Tokens
// Copie ce fichier dans src/design/tokens.ts

export const T = {
  // ─── BACKGROUNDS (3 niveaux d'élévation) ───
  page:    'oklch(7% .012 230)',   // fond page principale
  l1:      'oklch(11% .011 230)', // header, nav, bottom sheets
  l2:      'oklch(15% .010 230)', // cards
  l3:      'oklch(19% .009 230)', // inner cells / inputs

  // ─── BORDERS ───
  border:  'oklch(100% 0 0 / 7%)',  // border principale des cards
  border2: 'oklch(100% 0 0 / 11%)', // border des inputs / focus

  // ─── TEXTE ───
  t1: '#ffffff',                  // titres, chiffres clés
  t2: 'oklch(85% .006 230)',      // texte secondaire
  t3: 'oklch(63% .008 230)',      // texte muet / labels
  t4: 'oklch(46% .007 230)',      // texte désactivé / placeholders

  // ─── COULEURS SÉMANTIQUES ───
  accent:   '#22d3ee',  // cyan-400 — accent principal, CTA, états actifs
  accentDk: '#0891b2',  // cyan-600 — hover/pressed state
  coach:    '#a78bfa',  // violet-400 — Coach IA uniquement
  danger:   '#f87171',  // red-400
  warn:     '#fb923c',  // orange-400
  ok:       '#4ade80',  // green-400

  // ─── SCORE (0→100) ───
  // Usage: T.score(myScore)
} as const;

/** Retourne la couleur appropriée pour un score 0–100 */
export function scoreColor(s: number): string {
  if (s >= 85) return '#22d3ee'; // exceptionnel
  if (s >= 70) return '#4ade80'; // bon
  if (s >= 55) return '#facc15'; // correct
  if (s >= 40) return '#fb923c'; // modéré
  return '#f87171';               // difficile
}

/** Retourne le label textuel pour un score 0–100 */
export function scoreLabel(s: number): string {
  if (s >= 85) return 'Exceptionnel';
  if (s >= 70) return 'Bonnes conditions';
  if (s >= 55) return 'Correct';
  if (s >= 40) return 'Modéré';
  return 'Difficile';
}

// ─── TYPOGRAPHIE ───
export const TYPE = {
  // Toujours DM Sans — charger via next/font/google
  fontFamily: 'DM Sans, system-ui, sans-serif',

  // 3 tailles effectives + 1 hero
  hero:   { fontSize: '2rem',    fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 },
  title:  { fontSize: '1.125rem',fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 },
  body:   { fontSize: '0.875rem',fontWeight: 400, lineHeight: 1.55 },
  caption:{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.4 },

  // Cas spéciaux
  sectionLabel: {
    fontSize: '0.6875rem', fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em', color: 'oklch(46% .007 230)',
  },
} as const;

// ─── SPACING ───
export const SPACE = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
} as const;

// ─── BORDER RADIUS ───
export const RADIUS = {
  sm:   6,
  md:   10,  // inner cells
  lg:   14,  // cards
  xl:   16,  // bottom sheets top
  full: 9999,// pills, badges
} as const;

// ─── SHADOWS ───
export const SHADOW = {
  marker: '0 2px 8px rgba(0,0,0,.5)',
  fab:    '0 4px 16px rgba(167,139,250,.4)',
} as const;

// ─── ZONE SPOTS (carte) ───
export const ZONE_COLORS: Record<string, string> = {
  passes:      '#22d3ee',
  bancs:       '#4ade80',
  fosses:      '#c084fc',
  parcs:       '#facc15',
  'cap-ferret':'#f472b6',
  plages:      '#94a3b8',
} as const;

// ─── TAILWIND EXTENSIONS ───
// Ajoute dans tailwind.config.ts > theme.extend.colors :
//
// 'page':    'oklch(7% .012 230)',
// 'l1':      'oklch(11% .011 230)',
// 'l2':      'oklch(15% .010 230)',
// 'l3':      'oklch(19% .009 230)',
// 'accent':  '#22d3ee',
// 'coach':   '#a78bfa',
// 't1':      '#ffffff',
// 't2':      'oklch(85% .006 230)',
// 't3':      'oklch(63% .008 230)',
// 't4':      'oklch(46% .007 230)',
