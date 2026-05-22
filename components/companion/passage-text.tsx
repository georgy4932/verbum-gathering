import { VerseBlock } from './verse-block';

export interface VerseData {
  num: number;
  text: string;
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
          translation={translation}
          highlightColor={v.highlightColor}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}
