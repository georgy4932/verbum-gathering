import { BIBLE_BOOKS } from '@/lib/bible/books';

// name → slug: "1 Corinthians" → "1-corinthians", "Song of Solomon" → "song-of-solomon"
const BOOK_NAME_TO_SLUG = new Map<string, string>(
  BIBLE_BOOKS.map((b) => [b.name, b.slug])
);

// Convert a plan passage reference to the reader URL.
// "Genesis 1"       → "/companion/read/genesis/1"
// "1 Corinthians 3" → "/companion/read/1-corinthians/3"
// Returns null if the reference can't be parsed or the book isn't known.
export function passageToReaderUrl(passage: string): string | null {
  const m = passage.match(/^(.+?)\s+(\d+)$/);
  if (!m) return null;
  const slug = BOOK_NAME_TO_SLUG.get(m[1]);
  if (!slug) return null;
  return `/companion/read/${slug}/${m[2]}`;
}
