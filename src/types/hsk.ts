export type MasteryStatus = 'new' | 'learning' | 'mastered';

export interface ExampleSentence {
  hanzi: string;
  pinyin: string;
  translation: string;
}

export interface HSKWord {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  hanzi: string;
  pinyin: string;
  translations: string[];
  partOfSpeech?: string;
  exampleSentence?: ExampleSentence;
}

export type QuizMode =
  | 'hanzi-to-meaning' // Character shown -> user identifies pinyin and meaning
  | 'meaning-to-hanzi-desktop' // Meaning shown -> user types IME hanzi
  | 'meaning-to-hanzi-mobile' // Meaning shown -> user writes stroke by stroke
  | 'sentence-context' // Example sentence shown with cloze/context -> identify target
  | 'audio-quiz'; // Audio played -> identify hanzi and meaning

export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5;
// 0: Complete blackout
// 1: Incorrect; remembered upon seeing answer
// 2: Incorrect; easy to recall upon seeing answer
// 3: Correct, but with significant difficulty
// 4: Correct after hesitation
// 5: Perfect recall
