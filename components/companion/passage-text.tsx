import { VerseBlock } from './verse-block';
import type { VerseLine } from '@/lib/bible/api-bible';

export interface VerseData {
  num: number;
  text: string;
  lines: VerseLine[];
  isPoetry: boolean;
  isParagraphStart: boolean;
  isStanzaBreak: boolean;
  highlightColor?: string;
}

interface PassageTextProps {
  bookSlug: string;
  bookName: string;
  chapter: number;
  verses: VerseData[];
  translation: string;
  isAuthenticated: boolean;
}

// Server component — renders verse list.
// All interactivity is contained within VerseBlock (client component).
export default function PassageText({
  bookSlug,
  bookName,
  chapter,
  verses,
  translation,
  isAuthenticated,
}: PassageTextProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {verses.map((v) => (
        <VerseBlock
          key={v.num}
          book={bookSlug}
          bookName={bookName}
          chapter={chapter}
          verseNum={v.num}
          text={v.text}
          lines={v.lines}
          isPoetry={v.isPoetry}
          isParagraphStart={v.isParagraphStart}
          isStanzaBreak={v.isStanzaBreak}
          translation={translation}
          highlightColor={v.highlightColor}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}
