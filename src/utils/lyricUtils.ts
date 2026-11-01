/**
 * Utility functions for lyric and LRC processing
 */

/**
 * Strips LRC timestamp brackets like [01:46.73], [00:15], [00:15.000], [01:23.4] from lyric lines
 * for listener playback view, while preserving clean readable lyric text.
 */
export function cleanLyricText(text?: string | null): string {
  if (!text) return '';
  // Removes leading timestamps like [01:46.73] or multiple stacked timestamps [01:46.73][02:30.00]
  return text
    .replace(/^(\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]\s*)+/g, '')
    .replace(/<\d{1,2}:\d{2}(?:\.\d{1,3})?>/g, '')
    .trim();
}
