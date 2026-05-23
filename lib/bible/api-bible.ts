// API.Bible integration — server-only, never imported from client code.
// Docs: https://scripture.api.bible
// Set BIBLE_API_KEY in .env.local (free tier: 2000 req/day).

import { getVerseCount, VERSE_COUNTS } from './verse-counts';

export type BibleVersion = 'KJV' | 'NKJV' | 'NIV' | 'NLT' | 'ESV' | 'MSG' | 'TPT' | 'WEB' | 'ASV';

export interface TextSegment {
  text: string;
  isJesus: boolean;
}

export interface VerseLine {
  segments: TextSegment[];
  indentLevel: number; // 0=prose, 1=q1, 2=q2, 3=q3
}

export interface VerseContent {
  verse: number;
  text: string; // plain joined text, used for search/copy/AI context
  lines: VerseLine[];
  isPoetry: boolean;
  isParagraphStart: boolean;
  isStanzaBreak: boolean;
  hasRedLetter: boolean;
}

export interface PassageResult {
  verses: VerseContent[];
  reference: string;
  fullText: string; // joined plain text, used as AI companion context
  version: BibleVersion;
}

// ── Translation → API.Bible Bible ID ─────────────────────────────────────────
const TRANSLATION_IDS: Record<BibleVersion, string | null> = {
  KJV:  'de4e12af7f28f599-02',
  WEB:  '9879dbb7cfe39e4d-04',
  ASV:  '685d1470fe4d5c3b-01',
  NKJV: 'de4e12af7f28f599-01',
  NIV:  '06125adad2d5898a-01',
  ESV:  'f421fe261da7624f-01',
  NLT:  'f72b840c855f362c-04',
  MSG:  '65eec8e0b60e656b-01',
  TPT:  null,
};

// ── Slug → USFM book code ─────────────────────────────────────────────────────
export const SLUG_TO_USFM: Record<string, string> = {
  'genesis':          'GEN', 'exodus':            'EXO', 'leviticus':       'LEV',
  'numbers':          'NUM', 'deuteronomy':        'DEU', 'joshua':          'JOS',
  'judges':           'JDG', 'ruth':               'RUT', '1-samuel':        '1SA',
  '2-samuel':         '2SA', '1-kings':            '1KI', '2-kings':         '2KI',
  '1-chronicles':     '1CH', '2-chronicles':       '2CH', 'ezra':            'EZR',
  'nehemiah':         'NEH', 'esther':             'EST', 'job':             'JOB',
  'psalms':           'PSA', 'proverbs':           'PRO', 'ecclesiastes':    'ECC',
  'song-of-solomon':  'SNG', 'isaiah':             'ISA', 'jeremiah':        'JER',
  'lamentations':     'LAM', 'ezekiel':            'EZK', 'daniel':          'DAN',
  'hosea':            'HOS', 'joel':               'JOL', 'amos':            'AMO',
  'obadiah':          'OBA', 'jonah':              'JON', 'micah':           'MIC',
  'nahum':            'NAM', 'habakkuk':           'HAB', 'zephaniah':       'ZEP',
  'haggai':           'HAG', 'zechariah':          'ZEC', 'malachi':         'MAL',
  'matthew':          'MAT', 'mark':               'MRK', 'luke':            'LUK',
  'john':             'JHN', 'acts':               'ACT', 'romans':          'ROM',
  '1-corinthians':    '1CO', '2-corinthians':      '2CO', 'galatians':       'GAL',
  'ephesians':        'EPH', 'philippians':        'PHP', 'colossians':      'COL',
  '1-thessalonians':  '1TH', '2-thessalonians':    '2TH', '1-timothy':       '1TI',
  '2-timothy':        '2TI', 'titus':              'TIT', 'philemon':        'PHM',
  'hebrews':          'HEB', 'james':              'JAS', '1-peter':         '1PE',
  '2-peter':          '2PE', '1-john':             '1JN', '2-john':          '2JN',
  '3-john':           '3JN', 'jude':               'JUD', 'revelation':      'REV',
};

const API_BASE = 'https://api.scripture.api.bible/v1';

// ── JSON node types ───────────────────────────────────────────────────────────
interface ApiJsonNode {
  type?: string;
  name?: string;
  text?: string;
  items?: ApiJsonNode[];
  attrs?: Record<string, string>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function paraStyleToIndent(style: string): number {
  if (style === 'q' || style === 'q1') return 1;
  if (style === 'q2') return 2;
  if (style === 'q3') return 3;
  if (style === 'qr' || style === 'qc') return 2;
  return 0;
}

// Collect all para nodes in document order regardless of nesting depth.
// Some API.Bible translations wrap para nodes inside a <chapter> container
// while others return a flat array. This handles both without fragility.
function collectParas(nodes: ApiJsonNode[], result: ApiJsonNode[] = []): ApiJsonNode[] {
  for (const node of nodes) {
    if (node.name === 'para') {
      result.push(node);
    } else if (node.items) {
      collectParas(node.items, result);
    }
  }
  return result;
}

// ── Rich JSON parser — USX/AST format ────────────────────────────────────────
// API.Bible content-type=json returns a USX Abstract Syntax Tree.
// CRITICAL: In USX, a <verse> node is a BOUNDARY MARKER, not a container.
// The verse text lives as SIBLING nodes after the marker, not inside it.
// We walk para nodes in document order:
//   - Each <para> node defines a line (style = q1/q2/q3/p/b/etc.)
//   - <b> para nodes are stanza breaks
//   - <char style="wj"> nodes mark words of Jesus
function parseApiBibleJsonRich(content: ApiJsonNode[]): VerseContent[] {
  let currentNum: number | null = null;
  let currentParaStyle = 'p';
  let inJesus = false;
  let stanzaBreakPending = false;
  let paragraphStartPending = false;
  let currentLineSegs: TextSegment[] = [];

  const verseData = new Map<number, {
    lines: VerseLine[];
    isParagraphStart: boolean;
    isStanzaBreak: boolean;
  }>();

  function ensureVerse(num: number) {
    if (!verseData.has(num)) {
      verseData.set(num, { lines: [], isParagraphStart: false, isStanzaBreak: false });
    }
    return verseData.get(num)!;
  }

  function flushLine() {
    if (currentNum === null || currentLineSegs.length === 0) {
      currentLineSegs = [];
      return;
    }
    const joinedText = currentLineSegs.map((s) => s.text).join('');
    if (!joinedText.trim()) { currentLineSegs = []; return; }
    const v = ensureVerse(currentNum);
    v.lines.push({ segments: currentLineSegs, indentLevel: paraStyleToIndent(currentParaStyle) });
    currentLineSegs = [];
  }

  function collectInPara(node: ApiJsonNode) {
    if (node.name === 'note' || node.name === 'ref') return;

    if (node.name === 'verse') {
      if (node.attrs?.eid) return; // end marker — skip
      const raw = node.attrs?.number ?? node.attrs?.sid?.match(/:(\d+)$/)?.[1];
      const num = raw ? parseInt(raw, 10) : NaN;
      if (!isNaN(num)) {
        flushLine(); // close any line accumulated so far (for multi-verse paras)
        currentNum = num;
        const v = ensureVerse(num);
        if (stanzaBreakPending) { v.isStanzaBreak = true; stanzaBreakPending = false; }
        if (paragraphStartPending) { v.isParagraphStart = true; paragraphStartPending = false; }
      }
      return;
    }

    if (node.name === 'char') {
      const wasJesus = inJesus;
      if (node.attrs?.style === 'wj') inJesus = true;
      if (node.items) node.items.forEach(collectInPara);
      inJesus = wasJesus;
      return;
    }

    if (typeof node.text === 'string' && currentNum !== null) {
      currentLineSegs.push({ text: node.text, isJesus: inJesus });
    }

    if (node.items) node.items.forEach(collectInPara);
  }

  for (const node of collectParas(content)) {
    const style = node.attrs?.style ?? 'p';

    // New para = end of previous para's line
    flushLine();

    if (style === 'b') {
      stanzaBreakPending = true;
      continue;
    }

    currentParaStyle = style;

    if (style === 'p' || style === 'pi' || style === 'pi1' || style === 'm') {
      paragraphStartPending = true;
    }

    if (node.items) node.items.forEach(collectInPara);
  }

  flushLine(); // final verse's last line

  const sortedNums = Array.from(verseData.keys()).sort((a, b) => a - b);
  return sortedNums.map((num) => {
    const v = verseData.get(num)!;
    const allSegs = v.lines.flatMap((l) => l.segments);
    const text = allSegs.map((s) => s.text).join('').replace(/\s+/g, ' ').trim();
    const isPoetry = v.lines.some((l) => l.indentLevel > 0);
    const hasRedLetter = allSegs.some((s) => s.isJesus);
    return {
      verse: num,
      text,
      lines: v.lines,
      isPoetry,
      isParagraphStart: v.isParagraphStart,
      isStanzaBreak: v.isStanzaBreak,
      hasRedLetter,
    };
  });
}

// ── Text parser — [N] marker format ──────────────────────────────────────────
// API.Bible content-type=text embeds verse numbers as [N] markers.
// Returns VerseContent with no structural metadata (prose/no red letter).
function parseApiBibleTextRich(content: string): VerseContent[] {
  const cleaned = content.replace(/¶\s*/g, '').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(/\[(\d+)\]/);
  const verses: VerseContent[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i], 10);
    const text = (parts[i + 1] ?? '').replace(/\s+/g, ' ').trim();
    if (!isNaN(num) && text) {
      verses.push({
        verse: num,
        text,
        lines: [{ segments: [{ text, isJesus: false }], indentLevel: 0 }],
        isPoetry: false,
        isParagraphStart: false,
        isStanzaBreak: false,
        hasRedLetter: false,
      });
    }
  }
  return verses;
}

// ── Completeness check ────────────────────────────────────────────────────────
function isComplete(verses: VerseContent[], bookSlug: string, chapter: number): boolean {
  const expected = getVerseCount(bookSlug, chapter);
  return verses.length >= Math.ceil(expected * 0.9);
}

// ── Fetch from API.Bible ──────────────────────────────────────────────────────
// Strategy:
//   1. Try JSON content-type (structured USX AST, rich formatting data)
//   2. If JSON yields < 90% of expected verses, retry with text content-type
async function fetchFromApiBible(
  bookSlug: string,
  chapter: number,
  version: BibleVersion,
): Promise<PassageResult | null> {
  const apiKey = process.env.BIBLE_API_KEY;
  const bibleId = TRANSLATION_IDS[version];
  if (!apiKey || !bibleId) return null;

  const usfm = SLUG_TO_USFM[bookSlug];
  if (!usfm) return null;

  const chapterId = `${usfm}.${chapter}`;
  const baseParams = `&include-titles=false&include-chapter-numbers=false&include-notes=false`;

  async function request(contentType: 'json' | 'text'): Promise<VerseContent[] | null> {
    const url = `${API_BASE}/bibles/${bibleId}/chapters/${chapterId}` +
      `?content-type=${contentType}&include-verse-numbers=true${baseParams}`;
    try {
      const res = await fetch(url, {
        headers: { 'api-key': apiKey as string },
        next: { revalidate: 86400 },
      });
      if (!res.ok) return null;

      const json = await res.json() as { data: { content: ApiJsonNode[] | string } };
      const content = json.data?.content;
      if (!content) return null;

      if (Array.isArray(content)) return parseApiBibleJsonRich(content);
      if (typeof content === 'string') return parseApiBibleTextRich(content);
      return null;
    } catch {
      return null;
    }
  }

  // First pass: JSON (structured AST with poetry/red-letter data)
  let verses = await request('json') ?? [];

  // Second pass: text mode if JSON produced an incomplete result
  if (!isComplete(verses, bookSlug, chapter)) {
    const textVerses = await request('text') ?? [];
    if (textVerses.length > verses.length) verses = textVerses;
  }

  if (verses.length === 0) return null;

  const fullText = verses.map((v) => v.text).join(' ');
  const reference = `${bookSlug.replace(/-/g, ' ')} ${chapter}`;
  return { verses, reference, fullText, version };
}

// ── Fallback: bible-api.com (KJV only, no API key needed) ────────────────────
async function fetchFromBibleApiCom(bookSlug: string, chapter: number): Promise<PassageResult | null> {
  const apiParam = bookSlug.replace(/-/g, '+');
  // bible-api.com parses /obadiah+1 as "verse 1" not "chapter 1" for
  // single-chapter books. Use the explicit chapter:verse-range format so
  // the 1 is unambiguous as a chapter number: /obadiah+1:1-200
  const isSingleChapter = (VERSE_COUNTS[bookSlug]?.length ?? 2) === 1;
  const path = isSingleChapter
    ? `${apiParam}+1:1-200`
    : `${apiParam}+${chapter}`;
  try {
    const res = await fetch(
      `https://bible-api.com/${path}?translation=kjv`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      reference: string;
      verses: { verse: number; text: string }[];
      text: string;
      error?: string;
    };
    if (data.error || !data.verses?.length) return null;

    const verses: VerseContent[] = data.verses.map((v) => {
      const text = v.text.replace(/\s+/g, ' ').trim();
      return {
        verse: v.verse,
        text,
        lines: [{ segments: [{ text, isJesus: false }], indentLevel: 0 }],
        isPoetry: false,
        isParagraphStart: false,
        isStanzaBreak: false,
        hasRedLetter: false,
      };
    });
    return { verses, reference: data.reference, fullText: data.text, version: 'KJV' };
  } catch {
    return null;
  }
}

// ── Public entry point ────────────────────────────────────────────────────────
export async function getPassageText(
  bookSlug: string,
  chapter: number,
  version: BibleVersion = 'KJV',
): Promise<PassageResult | null> {
  const fromApiBible = await fetchFromApiBible(bookSlug, chapter, version);
  if (fromApiBible) return fromApiBible;

  if (version !== 'KJV') {
    const kjvFallback = await fetchFromApiBible(bookSlug, chapter, 'KJV');
    if (kjvFallback) return { ...kjvFallback, version: 'KJV' };
  }
  return fetchFromBibleApiCom(bookSlug, chapter);
}

export const SUPPORTED_VERSIONS: BibleVersion[] = ['KJV', 'NKJV', 'NIV', 'NLT', 'ESV', 'MSG', 'TPT', 'WEB', 'ASV'];

export const VERSION_LABEL: Record<BibleVersion, string> = {
  KJV:  'KJV — King James',
  NKJV: 'NKJV — New King James',
  NIV:  'NIV — New International',
  NLT:  'NLT — New Living',
  ESV:  'ESV — English Standard',
  MSG:  'MSG — The Message',
  TPT:  'TPT — The Passion',
  WEB:  'WEB — World English',
  ASV:  'ASV — American Standard',
};

export function isValidVersion(v: string | undefined | null): v is BibleVersion {
  return typeof v === 'string' && SUPPORTED_VERSIONS.includes(v as BibleVersion);
}
