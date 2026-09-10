import { Paragraph, Sentence } from '../types';

/**
 * Common abbreviations in Vietnamese and English to prevent accidental sentence splitting
 */
const ABBREVIATIONS = [
  'tp.hcm', 'tp.', 'tp', 'hn', 'gs.ts', 'pgs.ts', 'gs.', 'pgs.', 'ts.', 'ths.', 'bs.', 'kts.',
  'đ/c', 'v.v.', 'v/v', 'thg', 'tt.', 'nxb', 'thcs', 'thpt', 'đh', 'cd',
  'mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'etc.', 'vs.', 'e.g.', 'i.e.', 'jan.', 'feb.', 'mar.',
  'apr.', 'aug.', 'sept.', 'oct.', 'nov.', 'dec.', 'no.', 'vol.', 'p.', 'pp.', 'al.'
];

/**
 * Text normalization mappings for speech clarity
 */
const SPEECH_REPLACEMENTS: [RegExp, string][] = [
  [/\bTP\.HCM\b/gi, 'Thành phố Hồ Chí Minh'],
  [/\bTP\.\s*([A-ZÀ-Ỹ][a-zà-ỹ]+)/g, 'Thành phố $1'],
  [/\bGS\.TS\b/gi, 'Giáo sư Tiến sĩ'],
  [/\bPGS\.TS\b/gi, 'Phó Giáo sư Tiến sĩ'],
  [/\bGS\.\s*/gi, 'Giáo sư '],
  [/\bTS\.\s*/gi, 'Tiến sĩ '],
  [/\bThS\.\s*/gi, 'Thạc sĩ '],
  [/\bBS\.\s*/gi, 'Bác sĩ '],
  [/\bKTS\.\s*/gi, 'Kiến trúc sư '],
  [/\bv\.v\b\.?/gi, 'vân vân'],
  [/\bvd\b\.?/gi, 'ví dụ'],
  [/\be\.g\.,?\s*/gi, 'ví dụ như '],
  [/\bi\.e\.,?\s*/gi, 'tức là '],
  [/\betc\b\.?/gi, 'vân vân'],
  [/(\d+)\s*%/g, '$1 phần trăm'],
  [/(\d+)\s*°C/gi, '$1 độ C'],
  [/(\d+)\s*km\/h/gi, '$1 ki lô mét trên giờ'],
  [/(\d+)\s*m2/gi, '$1 mét vuông'],
  [/(\d+)\s*m3/gi, '$1 mét khối'],
  [/&/g, ' và '],
  [/\+/g, ' cộng '],
  [/=/g, ' bằng '],
  // Replace multiple dashes or underscores with a brief pause
  [/[-_]{2,}/g, '... '],
];

/**
 * Cleans citation marks such as [1], [2-4], [note 3]
 */
export function removeCitations(text: string): string {
  return text
    .replace(/\[\s*\d+\s*(?:[-–,]\s*\d+\s*)*\]/g, '') // [1], [1, 2], [1-3]
    .replace(/\[\s*(?:chú thích|ghi chú|note|ref)\s*\d*\s*\]/gi, '')
    .replace(/\(\s*(?:xem|xem thêm|hình|bảng)\s+[\d\.]+\s*\)/gi, '');
}

/**
 * Cleans PDF wrapped lines and merges hyphenated words
 */
export function cleanRawText(raw: string): string {
  if (!raw) return '';

  let cleaned = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Fix words broken by hyphen at line end: "trường-\n hợp" or "trường- \nhợp" -> "trườnghợp"
  cleaned = cleaned.replace(/([a-zA-ZÀ-ỹ0-9]+)[-–—]\s*\n\s*([a-zA-ZÀ-ỹ0-9]+)/g, '$1$2');

  // Join lines that are broken in mid-sentence
  // If line ends without terminal punctuation, join with next line
  const lines = cleaned.split('\n');
  const mergedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i].trim();
    if (!cur) {
      // Empty line indicates paragraph break
      if (mergedLines.length > 0 && mergedLines[mergedLines.length - 1] !== '') {
        mergedLines.push('');
      }
      continue;
    }

    // Skip pure page number lines (e.g. "12" or "Page 12")
    if (/^(?:page\s+)?\d{1,4}$/i.test(cur)) {
      continue;
    }

    if (mergedLines.length === 0 || mergedLines[mergedLines.length - 1] === '') {
      mergedLines.push(cur);
    } else {
      const prev = mergedLines[mergedLines.length - 1];
      const endsWithTerminal = /[.?!…:;"']$/.test(prev);
      const startsWithBullet = /^[-*•\d+\.]\s+/.test(cur);

      if (!endsWithTerminal && !startsWithBullet && cur.length > 0) {
        // Continue sentence
        mergedLines[mergedLines.length - 1] = prev + ' ' + cur;
      } else {
        mergedLines.push(cur);
      }
    }
  }

  return mergedLines.join('\n');
}

/**
 * Normalizes text for clean, coherent TTS speech
 */
export function prepareTextForSpeech(
  text: string,
  options: { expandAbbreviations?: boolean; removeCitationMarks?: boolean } = {}
): string {
  let processed = text;

  if (options.removeCitationMarks ?? true) {
    processed = removeCitations(processed);
  }

  if (options.expandAbbreviations ?? true) {
    for (const [regex, replacement] of SPEECH_REPLACEMENTS) {
      processed = processed.replace(regex, replacement);
    }
  }

  // Remove URLs or replace with readable summary
  processed = processed.replace(/https?:\/\/[^\s]+/g, 'đường liên kết');

  // Clean excessive punctuation
  processed = processed.replace(/\.{4,}/g, '...');
  processed = processed.replace(/\s+/g, ' ').trim();

  return processed;
}

/**
 * Splits a paragraph into coherent sentences
 */
export function splitIntoSentences(paragraphText: string, paragraphId: string): Sentence[] {
  const trimmed = paragraphText.trim();
  if (!trimmed) return [];

  // Protect abbreviation periods temporarily with a placeholder
  let placeholderText = trimmed;
  const protectedAbbrs: { key: string; orig: string }[] = [];

  ABBREVIATIONS.forEach((abbr, idx) => {
    const escaped = abbr.replace(/\./g, '\\.');
    const regex = new RegExp(`\\b${escaped}`, 'gi');
    placeholderText = placeholderText.replace(regex, (match) => {
      const key = `__ABBR_${idx}_${protectedAbbrs.length}__`;
      protectedAbbrs.push({ key, orig: match });
      return key;
    });
  });

  // Protect decimal numbers like 3.14, 1.5
  placeholderText = placeholderText.replace(/(\d+)\.(\d+)/g, '$1__DOT__$2');

  // Regex to split on terminal punctuation followed by space or quote or end of string
  // Matches . ! ? … followed by whitespace or quotes
  const sentenceRegex = /[^.!?…]+(?:[.!?…]+(?:["'”’»\)]+)?(?=\s+|$)|$)/g;
  const rawSentences: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = sentenceRegex.exec(placeholderText)) !== null) {
    let s = m[0].trim();
    if (s) {
      // Restore abbreviations & decimals
      for (const item of protectedAbbrs) {
        s = s.replace(item.key, item.orig);
      }
      s = s.replace(/__DOT__/g, '.');
      rawSentences.push(s);
    }
  }

  if (rawSentences.length === 0) {
    rawSentences.push(trimmed);
  }

  let charOffset = 0;
  return rawSentences.map((st, index) => {
    const cleanSpeech = prepareTextForSpeech(st);
    const item: Sentence = {
      id: `${paragraphId}-s${index}`,
      text: st,
      cleanText: cleanSpeech,
      charIndexStart: charOffset,
      charIndexEnd: charOffset + st.length,
    };
    charOffset += st.length + 1;
    return item;
  });
}

/**
 * Parses raw text content into structured paragraphs and sentences
 */
export function parseContentToParagraphs(content: string, chapterIndex: number): Paragraph[] {
  const cleaned = cleanRawText(content);
  const rawParagraphs = cleaned
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return rawParagraphs.map((paraText, pIdx) => {
    const pId = `c${chapterIndex}-p${pIdx}`;
    // Check if paragraph is likely a heading
    const isHeading =
      paraText.length < 80 &&
      !/[.?!]$/.test(paraText) &&
      (/^(chương|hồi|tiết|phần|bài|mục|chapter|part)\s+/i.test(paraText) ||
        /^[0-9IVXLCDM]+\.?\s+[A-ZÀ-Ỹ]/.test(paraText) ||
        paraText === paraText.toUpperCase());

    const sentences = splitIntoSentences(paraText, pId);

    return {
      id: pId,
      chapterIndex,
      paragraphIndex: pIdx,
      rawText: paraText,
      sentences,
      isHeading,
    };
  });
}
