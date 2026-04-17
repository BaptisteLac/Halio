/**
 * Utilitaires de formatage de dates — Halio
 */

/**
 * Formate une heure en HH:MM (heure locale)
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formate une date en DD/MM
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

/**
 * Formate une date en "Lundi 11 mars"
 */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Formate une date en "Lun. 11/03"
 */
export function formatShortWeekday(date: Date): string {
  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'short' });
  const dayMonth = formatShortDate(date);
  return `${weekday} ${dayMonth}`;
}

/**
 * Retourne "Aujourd'hui", "Demain", ou la date courte
 */
export function formatRelativeDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === tomorrow.toDateString()) return 'Demain';
  return formatShortWeekday(date);
}

/**
 * Nom du mois en français
 */
export function getMonthName(month: number): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
  return months[month - 1] ?? '';
}

/**
 * Retourne le début de la journée (00:00:00)
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Retourne la fin de la journée (23:59:59)
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
