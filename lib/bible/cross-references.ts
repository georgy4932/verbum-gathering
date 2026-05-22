// Static cross-reference data for popular verses.
// Each entry maps a verse passage_ref (e.g. "John 3:16") to a list of related passages.
// Relationship types:
//   parallel  — same idea in different words / a synoptic pair
//   theme     — shared theological motif
//   context   — nearby passage that illuminates this one
//   quote     — OT passage quoted or fulfilled here

export type CrossRefType = 'parallel' | 'theme' | 'context' | 'quote';

export interface CrossRef {
  ref: string;         // Display string: "Romans 5:8"
  bookSlug: string;    // URL slug: "romans"
  chapter: number;
  type: CrossRefType;
  snippet: string;
}

export const CROSS_REFERENCES: Record<string, CrossRef[]> = {
  "John 3:16": [
    { ref: "Romans 5:8",     bookSlug: "romans",     chapter: 5,  type: "parallel", snippet: "God demonstrates his own love for us in this: while we were still sinners, Christ died for us." },
    { ref: "1 John 4:9",     bookSlug: "1-john",     chapter: 4,  type: "theme",    snippet: "This is how God showed his love among us: He sent his one and only Son into the world that we might live through him." },
    { ref: "John 1:14",      bookSlug: "john",        chapter: 1,  type: "context",  snippet: "The Word became flesh and made his dwelling among us. We have seen his glory." },
    { ref: "Romans 8:32",    bookSlug: "romans",     chapter: 8,  type: "theme",    snippet: "He who did not spare his own Son, but gave him up for us all — how will he not also give us all things?" },
    { ref: "Isaiah 53:5",    bookSlug: "isaiah",     chapter: 53, type: "quote",    snippet: "He was pierced for our transgressions, he was crushed for our iniquities." },
  ],
  "Romans 8:28": [
    { ref: "Genesis 50:20",  bookSlug: "genesis",    chapter: 50, type: "parallel", snippet: "You intended to harm me, but God intended it for good to accomplish what is now being done." },
    { ref: "Jeremiah 29:11", bookSlug: "jeremiah",   chapter: 29, type: "theme",    snippet: "\"For I know the plans I have for you,\" declares the LORD, \"plans to prosper you and not to harm you.\"" },
    { ref: "Romans 8:1",     bookSlug: "romans",     chapter: 8,  type: "context",  snippet: "Therefore, there is now no condemnation for those who are in Christ Jesus." },
    { ref: "Philippians 1:6",bookSlug: "philippians",chapter: 1,  type: "theme",    snippet: "Being confident of this, that he who began a good work in you will carry it on to completion." },
  ],
  "Philippians 4:13": [
    { ref: "2 Corinthians 12:9", bookSlug: "2-corinthians", chapter: 12, type: "parallel", snippet: "My grace is sufficient for you, for my power is made perfect in weakness." },
    { ref: "Philippians 4:11",   bookSlug: "philippians",   chapter: 4,  type: "context",  snippet: "I have learned, in whatever state I am, to be content." },
    { ref: "Isaiah 40:31",       bookSlug: "isaiah",        chapter: 40, type: "theme",    snippet: "Those who hope in the LORD will renew their strength. They will soar on wings like eagles." },
  ],
  "Psalm 23:1": [
    { ref: "John 10:11",    bookSlug: "john",     chapter: 10, type: "parallel", snippet: "I am the good shepherd. The good shepherd lays down his life for the sheep." },
    { ref: "Ezekiel 34:15", bookSlug: "ezekiel",  chapter: 34, type: "theme",    snippet: "I myself will tend my sheep and have them lie down, declares the Sovereign LORD." },
    { ref: "Psalm 100:3",   bookSlug: "psalms",   chapter: 100,type: "theme",    snippet: "Know that the LORD is God. It is he who made us, and we are his; we are his people, the sheep of his pasture." },
    { ref: "Hebrews 13:20", bookSlug: "hebrews",  chapter: 13, type: "theme",    snippet: "May the God of peace, who brought up from the dead our Lord Jesus, that great Shepherd of the sheep…" },
  ],
  "Jeremiah 29:11": [
    { ref: "Romans 8:28",      bookSlug: "romans",    chapter: 8,  type: "parallel", snippet: "We know that in all things God works for the good of those who love him." },
    { ref: "Proverbs 3:5",     bookSlug: "proverbs",  chapter: 3,  type: "theme",    snippet: "Trust in the LORD with all your heart and lean not on your own understanding." },
    { ref: "Philippians 4:6",  bookSlug: "philippians",chapter: 4, type: "theme",    snippet: "Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God." },
    { ref: "Isaiah 46:10",     bookSlug: "isaiah",    chapter: 46, type: "theme",    snippet: "I make known the end from the beginning, from ancient times, what is still to come." },
  ],
  "Romans 8:1": [
    { ref: "John 3:18",      bookSlug: "john",     chapter: 3,  type: "parallel", snippet: "Whoever believes in him is not condemned." },
    { ref: "Romans 5:1",     bookSlug: "romans",   chapter: 5,  type: "theme",    snippet: "Therefore, since we have been justified through faith, we have peace with God through our Lord Jesus Christ." },
    { ref: "Galatians 5:1",  bookSlug: "galatians",chapter: 5,  type: "theme",    snippet: "It is for freedom that Christ has set us free. Stand firm, then, and do not let yourselves be burdened again by a yoke of slavery." },
  ],
  "Isaiah 40:31": [
    { ref: "Philippians 4:13",   bookSlug: "philippians",    chapter: 4,  type: "parallel", snippet: "I can do all this through him who gives me strength." },
    { ref: "2 Corinthians 12:9", bookSlug: "2-corinthians",  chapter: 12, type: "theme",    snippet: "My grace is sufficient for you, for my power is made perfect in weakness." },
    { ref: "Psalm 27:1",         bookSlug: "psalms",          chapter: 27, type: "theme",    snippet: "The LORD is my light and my salvation — whom shall I fear?" },
  ],
  "Proverbs 3:5": [
    { ref: "Jeremiah 17:7",  bookSlug: "jeremiah",    chapter: 17, type: "parallel", snippet: "Blessed is the one who trusts in the LORD, whose confidence is in him." },
    { ref: "Psalm 37:5",     bookSlug: "psalms",      chapter: 37, type: "theme",    snippet: "Commit your way to the LORD; trust in him and he will do this." },
    { ref: "Matthew 6:33",   bookSlug: "matthew",     chapter: 6,  type: "theme",    snippet: "But seek first his kingdom and his righteousness, and all these things will be given to you as well." },
  ],
  "John 14:6": [
    { ref: "Acts 4:12",      bookSlug: "acts",         chapter: 4,  type: "parallel", snippet: "Salvation is found in no one else, for there is no other name under heaven given to mankind by which we must be saved." },
    { ref: "John 10:9",      bookSlug: "john",         chapter: 10, type: "context",  snippet: "I am the gate; whoever enters through me will be saved." },
    { ref: "Hebrews 10:19",  bookSlug: "hebrews",      chapter: 10, type: "theme",    snippet: "We have confidence to enter the Most Holy Place by the blood of Jesus, by a new and living way opened for us." },
  ],
  "Matthew 6:33": [
    { ref: "Psalm 37:4",     bookSlug: "psalms",       chapter: 37, type: "parallel", snippet: "Take delight in the LORD, and he will give you the desires of your heart." },
    { ref: "Proverbs 3:6",   bookSlug: "proverbs",     chapter: 3,  type: "theme",    snippet: "In all your ways submit to him, and he will make your paths straight." },
    { ref: "Philippians 4:19",bookSlug: "philippians", chapter: 4,  type: "theme",    snippet: "My God will meet all your needs according to the riches of his glory in Christ Jesus." },
  ],
  "Galatians 2:20": [
    { ref: "Romans 6:4",     bookSlug: "romans",       chapter: 6,  type: "parallel", snippet: "We were therefore buried with him through baptism into death in order that, just as Christ was raised from the dead, we too may live a new life." },
    { ref: "Colossians 3:3", bookSlug: "colossians",   chapter: 3,  type: "theme",    snippet: "For you died, and your life is now hidden with Christ in God." },
    { ref: "2 Corinthians 5:17",bookSlug: "2-corinthians",chapter: 5, type: "theme", snippet: "If anyone is in Christ, the new creation has come: the old has gone, the new is here!" },
  ],
  "Ephesians 2:8": [
    { ref: "Romans 3:24",    bookSlug: "romans",       chapter: 3,  type: "parallel", snippet: "All are justified freely by his grace through the redemption that came by Christ Jesus." },
    { ref: "Titus 3:5",      bookSlug: "titus",        chapter: 3,  type: "theme",    snippet: "He saved us, not because of righteous things we had done, but because of his mercy." },
    { ref: "Romans 5:1",     bookSlug: "romans",       chapter: 5,  type: "theme",    snippet: "Therefore, since we have been justified through faith, we have peace with God." },
  ],
  "Hebrews 11:1": [
    { ref: "Romans 8:25",    bookSlug: "romans",       chapter: 8,  type: "parallel", snippet: "But if we hope for what we do not yet have, we wait for it patiently." },
    { ref: "2 Corinthians 5:7",bookSlug: "2-corinthians",chapter: 5, type: "theme",  snippet: "For we live by faith, not by sight." },
    { ref: "Habakkuk 2:4",   bookSlug: "habakkuk",     chapter: 2,  type: "quote",    snippet: "See, the enemy is puffed up; his desires are not upright — but the righteous person will live by his faithfulness." },
  ],
  "Romans 5:8": [
    { ref: "John 3:16",       bookSlug: "john",        chapter: 3,  type: "parallel", snippet: "For God so loved the world that he gave his one and only Son." },
    { ref: "1 John 4:10",     bookSlug: "1-john",      chapter: 4,  type: "theme",    snippet: "This is love: not that we loved God, but that he loved us and sent his Son as an atoning sacrifice." },
    { ref: "Romans 8:32",     bookSlug: "romans",      chapter: 8,  type: "context",  snippet: "He who did not spare his own Son, but gave him up for us all." },
  ],
  "1 Corinthians 13:4": [
    { ref: "Colossians 3:14", bookSlug: "colossians",  chapter: 3,  type: "theme",    snippet: "And over all these virtues put on love, which binds them all together in perfect unity." },
    { ref: "1 John 4:7",      bookSlug: "1-john",      chapter: 4,  type: "theme",    snippet: "Dear friends, let us love one another, for love comes from God." },
    { ref: "Matthew 22:37",   bookSlug: "matthew",     chapter: 22, type: "context",  snippet: "Love the Lord your God with all your heart and with all your soul and with all your mind." },
  ],
  "Matthew 28:19": [
    { ref: "Acts 1:8",        bookSlug: "acts",        chapter: 1,  type: "parallel", snippet: "You will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth." },
    { ref: "Romans 10:14",    bookSlug: "romans",      chapter: 10, type: "theme",    snippet: "How, then, can they call on the one they have not believed in? And how can they believe in the one of whom they have not heard?" },
    { ref: "Isaiah 49:6",     bookSlug: "isaiah",      chapter: 49, type: "theme",    snippet: "I will also make you a light for the Gentiles, that my salvation may reach to the ends of the earth." },
  ],
  "Psalm 46:1": [
    { ref: "Isaiah 41:10",    bookSlug: "isaiah",      chapter: 41, type: "parallel", snippet: "So do not fear, for I am with you; do not be dismayed, for I am your God." },
    { ref: "Nahum 1:7",       bookSlug: "nahum",       chapter: 1,  type: "theme",    snippet: "The LORD is good, a refuge in times of trouble. He cares for those who trust in him." },
    { ref: "Deuteronomy 31:6",bookSlug: "deuteronomy", chapter: 31, type: "theme",    snippet: "Be strong and courageous. Do not be afraid or terrified, for the LORD your God goes with you." },
  ],
  "Romans 3:23": [
    { ref: "Romans 3:10",     bookSlug: "romans",      chapter: 3,  type: "context",  snippet: "As it is written: 'There is no one righteous, not even one.'" },
    { ref: "Romans 6:23",     bookSlug: "romans",      chapter: 6,  type: "context",  snippet: "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord." },
    { ref: "Isaiah 53:6",     bookSlug: "isaiah",      chapter: 53, type: "quote",    snippet: "We all, like sheep, have gone astray, each of us has turned to our own way." },
  ],
  "Romans 6:23": [
    { ref: "Romans 3:23",     bookSlug: "romans",      chapter: 3,  type: "context",  snippet: "For all have sinned and fall short of the glory of God." },
    { ref: "John 3:16",       bookSlug: "john",        chapter: 3,  type: "theme",    snippet: "For God so loved the world that he gave his one and only Son." },
    { ref: "Ephesians 2:8",   bookSlug: "ephesians",   chapter: 2,  type: "theme",    snippet: "For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God." },
  ],
};
