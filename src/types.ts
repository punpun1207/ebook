export type BookFormat = 'epub' | 'pdf' | 'sample';

export interface Sentence {
  id: string;
  text: string;
  cleanText: string;
  charIndexStart: number;
  charIndexEnd: number;
}

export interface Paragraph {
  id: string;
  chapterIndex: number;
  paragraphIndex: number;
  rawText: string;
  sentences: Sentence[];
  isHeading?: boolean;
}

export interface Chapter {
  id: string;
  index: number;
  title: string;
  paragraphs: Paragraph[];
  wordCount: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  language: string;
  totalChapters: number;
  totalWords: number;
  chapters: Chapter[];
  coverUrl?: string;
  dateAdded: number;
  lastReadChapter: number;
  lastReadParagraph: number;
  lastReadSentence: number;
}

export type ReaderTheme = 'paper' | 'sepia' | 'dark' | 'oled' | 'sage';
export type FontFamily = 'serif' | 'sans' | 'mono';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontFamily: FontFamily;
  fontSize: number; // in px, e.g. 18
  lineHeight: number; // e.g. 1.8
  maxWidth: 'sm' | 'md' | 'lg' | 'xl';
  textAlign: 'left' | 'justify';
  highlightStyle: 'soft-amber' | 'emerald' | 'sky' | 'underline';
  autoScroll: boolean;
}

export interface TTSSettings {
  voiceUri: string;
  rate: number; // 0.5 to 2.0
  pitch: number; // 0.8 to 1.3
  volume: number; // 0 to 1
  sentencePauseMs: number; // 150 to 800ms
  paragraphPauseMs: number; // 300 to 1500ms
  expandAbbreviations: boolean;
  removeCitations: boolean;
}

export interface PlaybackPosition {
  chapterIndex: number;
  paragraphIndex: number;
  sentenceIndex: number;
}
