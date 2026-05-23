// API.Bible integration — server-only, never imported from client code.
// Docs: https://scripture.api.bible
// Set BIBLE_API_KEY in .env.local (free tier: 2000 req/day).

export type BibleVersion = 'KJV' | 'NKJV' | 'NIV' | 'NLT' | 'ESV' | 'MSG' | 'TPT' | 'WEB' | 'ASV';

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface PassageResult {
  verses: BibleVerse[];
  reference: string;
  fullText: string; // joined plain text, used as AI companion context
  version: BibleVersion;
}

// ── Translation → API.Bible Bible ID ─────────────────────────────────────────
// Verify / update IDs from your API.Bible dashboard:
// https://scripture.api.bible/profile → "My API Keys" → "Allowed Bibles"
// Public-domain IDs (always available on free tier):
//   KJV  de4e12af7f28f599-02   King James Version
//   WEB  9879dbb7cfe39e4d-04   World English Bible
//   ASV  685d1470fe4d5c3b-01   American Standard Version 1901
// Licensed IDs (require content-partner agreement in your API.Bible account):
//   NKJV 'de4e12af7f28f599-01'  (Thomas Nelson — verify ID)
//   NIV  '06125adad2d5898a-01'  (Biblica — verify ID)
//   ESV  'f421fe261da7624f-01'  (Crossway — verify ID)
//   NLT  'f72b840c855f362c-04'  (Tyndale — verify ID)
//   MSG  '65eec8e0b60e656b-01'  (NavPress — verify ID)
//   TPT  Not yet indexed on API.Bible; falls back to KJV
const TRANSLATION_IDS: Record<BibleVersion, string | null> = {
  KJV:  'de4e12af7f28f599-02',
  WEB:  '9879dbb7cfe39e4d-04',
  ASV:  '685d1470fe4d5c3b-01',
  NKJV: 'de4e12af7f28f599-01',
  NIV:  '06125adad2d5898a-01',
  ESV:  'f421fe261da7624f-01',
  NLT:  'f72b840c855f362c-04',
  MSG:  '65eec8e0b60e656b-01',
  TPT:  null, // not on API.Bible; will fall back to KJV
};

// ── Slug → USFM book code ─────────────────────────────────────────────────────
// API.Bible chapter IDs use standard USFM codes, e.g. "JHN.3" for John 3.
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

// ── Parse API.Bible JSON content (structured AST) into verse array ────────────
// API.Bible with content-type=json returns an AST where verse nodes carry
// attrs.number and their child nodes contain the text. This is far more
// reliable than text-mode [N] marker splitting.

interface ApiJsonNode {
  type?: string;
  name?: string;
  text?: string;
  items?: ApiJsonNode[];
  attrs?: Record<string, string>;
}

function nodeText(node: ApiJsonNode): string {
  if (node.name === 'note') return '';        // skip footnotes
  if (node.name === 'ref') return '';         // skip cross-ref tags
  if (typeof node.text === 'string') return node.text;
  if (node.items) return node.items.map(nodeText).join('');
  return '';
}

function parseApiBibleJson(content: ApiJsonNode[]): BibleVerse[] {
  const verses: BibleVerse[] = [];

  function walk(node: ApiJsonNode) {
    if (node.name === 'verse' && node.attrs?.number) {
      const num = parseInt(node.attrs.number, 10);
      if (!isNaN(num)) {
        const raw = node.items ? node.items.map(nodeText).join('') : '';
        const text = raw.replace(/\s+/g, ' ').trim();
        if (text) verses.push({ verse: num, text });
      }
    } else if (node.items) {
      node.items.forEach(walk);
    }
  }

  content.forEach(walk);
  return verses;
}

// Legacy text-mode parser kept as a last-resort fallback.
function parseApiBibleText(content: string): BibleVerse[] {
  const cleaned = content.replace(/¶\s*/g, '').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(/\[(\d+)\]/);
  const verses: BibleVerse[] = [];
  // Include the final segment: loop to parts.length (not parts.length - 1)
  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i], 10);
    const text = (parts[i + 1] ?? '').trim();
    if (!isNaN(num) && text) verses.push({ verse: num, text });
  }
  return verses;
}

// ── Fetch from API.Bible ──────────────────────────────────────────────────────
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
  // Prefer JSON content-type — returns a structured AST with explicit verse nodes,
  // eliminating the need to split a text blob on [N] markers (which is fragile).
  const url = `${API_BASE}/bibles/${bibleId}/chapters/${chapterId}` +
    `?content-type=json&include-verse-numbers=true&include-titles=false` +
    `&include-chapter-numbers=false&include-notes=false`;

  try {
    const res = await fetch(url, {
      headers: { 'api-key': apiKey },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const json = await res.json() as {
      data: { content: ApiJsonNode[] | string; reference: string };
    };

    let verses: BibleVerse[];
    const content = json.data?.content;

    if (Array.isArray(content)) {
      // Structured JSON path — preferred
      verses = parseApiBibleJson(content);
    } else if (typeof content === 'string') {
      // Unexpected text response — fall back to legacy parser
      verses = parseApiBibleText(content);
    } else {
      return null;
    }

    if (verses.length === 0) return null;

    const fullText = verses.map((v) => v.text).join(' ');
    return { verses, reference: json.data.reference, fullText, version };
  } catch {
    return null;
  }
}

// ── Fallback: bible-api.com (KJV only, no API key needed) ────────────────────
async function fetchFromBibleApiCom(bookSlug: string, chapter: number): Promise<PassageResult | null> {
  const apiParam = bookSlug.replace(/-/g, '+');
  try {
    const res = await fetch(
      `https://bible-api.com/${apiParam}+${chapter}?translation=kjv`,
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
    return {
      verses: data.verses.map((v) => ({ verse: v.verse, text: v.text.trim() })),
      reference: data.reference,
      fullText: data.text,
      version: 'KJV',
    };
  } catch {
    return null;
  }
}

// ── Public entry point ────────────────────────────────────────────────────────
// Resolves: API.Bible (if key present) → bible-api.com KJV fallback → null
export async function getPassageText(
  bookSlug: string,
  chapter: number,
  version: BibleVersion = 'KJV',
): Promise<PassageResult | null> {
  // Try API.Bible first (supports all translations)
  const fromApiBible = await fetchFromApiBible(bookSlug, chapter, version);
  if (fromApiBible) return fromApiBible;

  // If API.Bible failed or key absent, fall back to bible-api.com for KJV
  // (other translations are unavailable without API.Bible)
  if (version !== 'KJV') {
    // Attempt KJV from API.Bible, then fallback
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
