import { HSKWord } from '@/types/hsk';

const cachedData: Record<number, HSKWord[]> = {};

/**
 * Fetch vocabulary for a specific HSK level (1 to 5)
 */
export async function getHSKWords(level: number): Promise<HSKWord[]> {
  if (level < 1 || level > 5) return [];

  if (cachedData[level]) {
    return cachedData[level];
  }

  try {
    const res = await fetch(`/data/hsk${level}.json`);
    if (!res.ok) {
      throw new Error(`Failed to load HSK ${level} data: ${res.statusText}`);
    }
    const data: HSKWord[] = await res.json();
    cachedData[level] = data;
    return data;
  } catch (error) {
    console.error(`Error loading HSK ${level}:`, error);
    return [];
  }
}

/**
 * Fetch vocabulary across all HSK 1-5 levels
 */
export async function getAllHSKWords(): Promise<HSKWord[]> {
  const levels = [1, 2, 3, 4, 5];
  const results = await Promise.all(levels.map((lvl) => getHSKWords(lvl)));
  return results.flat();
}

/**
 * Normalize tone marks to plain ASCII for flexible search
 * e.g., "nǐ hǎo" -> "ni hao"
 */
export function normalizePinyin(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filter words by search query matching Hanzi, Pinyin, or English translation
 */
export function searchWords(words: HSKWord[], query: string): HSKWord[] {
  if (!query || !query.trim()) return words;

  const q = query.trim().toLowerCase();
  const normalizedQ = normalizePinyin(q);

  return words.filter((word) => {
    // Hanzi match
    if (word.hanzi.includes(q)) return true;

    // Direct pinyin match
    if (word.pinyin.toLowerCase().includes(q)) return true;

    // Normalized pinyin match without tone marks
    const normPinyin = normalizePinyin(word.pinyin);
    if (normPinyin.includes(normalizedQ) || normPinyin.replace(/\s+/g, '').includes(normalizedQ.replace(/\s+/g, ''))) {
      return true;
    }

    // English translation match
    if (word.translations.some((t) => t.toLowerCase().includes(q))) {
      return true;
    }

    return false;
  });
}
