export type LearningSourceMode = 'provided' | 'research';

const OUTLINE_PREFIX = /^(?:unit|chapter|module|week|lesson|topic|section)\s*(?:\d+|[ivxlcdm]+)?\s*[:.)-]/i;

export function isResearchTopicPrompt(value: string) {
  const text = value.trim();
  if (text.length < 4 || text.length > 180) return false;
  if (text.split(/\r?\n/).filter(Boolean).length !== 1) return false;
  if (/[•●▪◦]/.test(text) || OUTLINE_PREFIX.test(text)) return false;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return wordCount <= 24 && (wordCount >= 2 || text.length >= 8);
}
