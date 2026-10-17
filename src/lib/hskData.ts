import { HSKWord } from '@/types/hsk';

const cachedData: Record<number, HSKWord[]> = {};

/**
 * Fetch vocabulary for a specific HSK level (1 to 6)
 */
export async function getHSKWords(level: number): Promise<HSKWord[]> {
  if (level < 1 || level > 6) return [];

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
 * Fetch vocabulary across all HSK 1-6 levels (5,000 total words)
 */
export async function getAllHSKWords(): Promise<HSKWord[]> {
  return getHSKWords(6);
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

export interface ClozeToken {
  hanzi: string;
  pinyin?: string;
  isTarget?: boolean;
  isPunctuation?: boolean;
  showPinyin?: boolean;
}

const COMMON_EXTRA_WORDS: Record<string, { level: number; pinyin: string }> = {
  '父母': { level: 4, pinyin: 'fùmǔ' },
  '绿茶': { level: 2, pinyin: 'lǜchá' },
  '饮品': { level: 4, pinyin: 'yǐnpǐn' },
  '路边': { level: 2, pinyin: 'lùbiān' },
  '桌上': { level: 1, pinyin: 'zhuōshàng' },
  '菜肴': { level: 5, pinyin: 'càiyáo' },
  '丰盛': { level: 5, pinyin: 'fēngshèng' },
  '活力': { level: 4, pinyin: 'huólì' },
  '充满': { level: 4, pinyin: 'chōngmǎn' },
  '大城市': { level: 2, pinyin: 'dàchéngshì' },
  '词典': { level: 3, pinyin: 'cídiǎn' },
};

/**
 * Tokenize a cloze example sentence, annotating words that are above the selected level
 * with their pinyin so learners can read the sentence context without struggling.
 */
export function tokenizeClozeSentence(
  sentenceHanzi: string,
  sentencePinyin: string,
  targetWord: string,
  selectedLevel: number,
  allWords?: HSKWord[]
): ClozeToken[] {
  const tokens: ClozeToken[] = [];
  let i = 0;

  // Build quick map of known words if available
  const wordsMap = new Map<string, { level: number; pinyin: string }>();
  if (allWords) {
    allWords.forEach((w) => {
      if (!wordsMap.has(w.hanzi) || wordsMap.get(w.hanzi)!.level > w.level) {
        wordsMap.set(w.hanzi, { level: w.level, pinyin: w.pinyin });
      }
    });
  }

  const pinyinWords = sentencePinyin
    ? sentencePinyin
        .trim()
        .split(/\s+/)
        .map((w) => w.replace(/[.,!?:;\"()]/g, ''))
    : [];

  while (i < sentenceHanzi.length) {
    if (sentenceHanzi.startsWith(targetWord, i)) {
      tokens.push({
        hanzi: targetWord,
        isTarget: true,
        showPinyin: false,
      });
      i += targetWord.length;
      continue;
    }

    const ch = sentenceHanzi[i];
    if (!/[\u4e00-\u9fa5]/.test(ch)) {
      tokens.push({
        hanzi: ch,
        isPunctuation: true,
        showPinyin: false,
      });
      i++;
      continue;
    }

    // Try multi-character match (longest match 4 down to 2)
    let matched: { hanzi: string; level: number; pinyin: string } | null = null;
    for (let len = Math.min(4, sentenceHanzi.length - i); len >= 2; len--) {
      const sub = sentenceHanzi.slice(i, i + len);
      if (sub === targetWord) continue;

      if (COMMON_EXTRA_WORDS[sub]) {
        matched = { hanzi: sub, ...COMMON_EXTRA_WORDS[sub] };
        break;
      }
      if (wordsMap.has(sub)) {
        matched = { hanzi: sub, ...wordsMap.get(sub)! };
        break;
      }
    }

    if (matched) {
      tokens.push({
        hanzi: matched.hanzi,
        pinyin: matched.pinyin,
        showPinyin: matched.level > selectedLevel,
      });
      i += matched.hanzi.length;
    } else {
      // Single character
      const singleInfo = wordsMap.get(ch) || COMMON_EXTRA_WORDS[ch];
      const level = singleInfo ? singleInfo.level : 6;
      tokens.push({
        hanzi: ch,
        pinyin: singleInfo ? singleInfo.pinyin : undefined,
        showPinyin: level > selectedLevel,
      });
      i++;
    }
  }

  // Align any missing pinyin for words that need it from sentence pinyin words
  let pIdx = 0;
  for (const token of tokens) {
    if (token.isPunctuation) continue;
    if (token.isTarget) {
      if (pIdx < pinyinWords.length) pIdx++;
      continue;
    }
    if (pIdx < pinyinWords.length) {
      if (!token.pinyin && token.showPinyin) {
        token.pinyin = pinyinWords[pIdx];
      }
      pIdx++;
    }
  }

  return tokens;
}
