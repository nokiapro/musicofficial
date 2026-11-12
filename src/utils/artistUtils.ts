/**
 * Utilities for formatting and normalizing artist names across the app
 */

/**
 * Capitalizes the first letter of each word in an artist's name (e.g. "an clock" -> "An Clock")
 * Handles Vietnamese diacritics, hyphens, and preserves acronyms (e.g. "m-tp" -> "M-TP", "vũ." -> "Vũ.")
 */
export function formatArtistName(name?: string | null): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  return trimmed
    .split(' ')
    .map((word) => {
      if (!word) return '';

      // Preserve special tokens like "ft.", "feat."
      const lower = word.toLowerCase();
      if (lower === 'ft.' || lower === 'feat.') {
        return 'ft.';
      }

      // If word has parentheses like "(J97)" or "(JayTee)"
      if (word.startsWith('(') && word.endsWith(')') && word.length > 2) {
        const inner = word.slice(1, -1);
        return `(${formatArtistName(inner)})`;
      }

      // If word contains hyphen like "m-tp" -> "M-TP"
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => {
            if (!part) return '';
            // If already all-caps acronym like "TP"
            if (part.length <= 2 && part === part.toUpperCase()) return part;
            return part.charAt(0).toUpperCase() + part.slice(1);
          })
          .join('-');
      }

      // If word is completely lowercase, capitalize first letter
      if (word === word.toLowerCase()) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      // If word is already mixed case (like XuanKen, JustaTee, DJ), keep its casing but ensure first char is capitalized
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Formats a comma-separated list of artists (e.g. "an clock, justatee" -> "An Clock, JustaTee")
 */
export function formatArtistsString(artistsStr?: string | null): string {
  if (!artistsStr) return '';
  return artistsStr
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => formatArtistName(a))
    .join(', ');
}
