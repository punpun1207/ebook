import React, { useEffect, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, BookOpen, Clock, Sparkles } from 'lucide-react';
import { Chapter, Paragraph, PlaybackPosition, ReaderSettings, Sentence } from '../types';
import { TTSStatus } from '../services/ttsService';

interface ReaderViewProps {
  currentChapter: Chapter | null;
  position: PlaybackPosition;
  ttsStatus: TTSStatus;
  settings: ReaderSettings;
  totalChapters: number;
  onSelectSentence: (paragraphIndex: number, sentenceIndex: number) => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  currentChapter,
  position,
  ttsStatus,
  settings,
  totalChapters,
  onSelectSentence,
  onPrevChapter,
  onNextChapter,
}) => {
  const activeSentenceRef = useRef<HTMLSpanElement | null>(null);

  // Auto-scroll to active sentence smoothly
  useEffect(() => {
    if (settings.autoScroll && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [position.chapterIndex, position.paragraphIndex, position.sentenceIndex, settings.autoScroll]);

  if (!currentChapter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <BookOpen className="w-12 h-12 text-amber-500 mb-3 opacity-60" />
        <h3 className="text-lg font-semibold">Chưa có sách nào được chọn</h3>
        <p className="text-sm opacity-60 mt-1 max-w-md">
          Hãy tải lên tệp sách EPUB, PDF hoặc chọn một trong các sách mẫu để bắt đầu trải nghiệm đọc và nghe TTS mạch lạc.
        </p>
      </div>
    );
  }

  // Theme styling map
  const themeClasses = {
    paper: 'bg-[#faf9f6] text-neutral-900',
    sepia: 'bg-[#f7f0e3] text-[#332211]',
    dark: 'bg-[#18181b] text-[#f4f4f5]',
    oled: 'bg-[#000000] text-[#e5e5e5]',
    sage: 'bg-[#edf3ec] text-[#1c2e20]',
  }[settings.theme];

  // Font family map
  const fontClasses = {
    serif: 'font-reader-serif',
    sans: 'font-reader-sans',
    mono: 'font-reader-mono',
  }[settings.fontFamily];

  // Container max-width map
  const widthClasses = {
    sm: 'max-w-xl',
    md: 'max-w-2xl',
    lg: 'max-w-3xl',
    xl: 'max-w-4xl',
  }[settings.maxWidth];

  // Highlight color style map
  const getHighlightClass = (isActive: boolean) => {
    if (!isActive) return '';
    switch (settings.highlightStyle) {
      case 'emerald':
        return 'bg-emerald-200/70 dark:bg-emerald-500/30 text-emerald-950 dark:text-emerald-100 rounded-sm px-1 py-0.5 shadow-xs';
      case 'sky':
        return 'bg-sky-200/70 dark:bg-sky-500/30 text-sky-950 dark:text-sky-100 rounded-sm px-1 py-0.5 shadow-xs';
      case 'underline':
        return 'underline decoration-amber-500 decoration-2 underline-offset-4';
      case 'soft-amber':
      default:
        return 'bg-amber-200/80 dark:bg-amber-500/35 text-amber-950 dark:text-amber-100 rounded-sm px-1 py-0.5 shadow-xs';
    }
  };

  // Estimated listening time: average reading speed ~150 words per minute
  const estListeningMinutes = Math.max(1, Math.ceil(currentChapter.wordCount / 140));

  return (
    <main
      id="reader-main"
      className={`flex-1 w-full min-h-screen transition-colors duration-200 py-10 px-4 sm:px-8 pb-36 ${themeClasses}`}
    >
      <article className={`mx-auto ${widthClasses} transition-all duration-150`}>
        {/* Chapter Header */}
        <header className="mb-10 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3 text-xs opacity-60 mb-2 font-medium tracking-wide uppercase">
            <span>Chương {position.chapterIndex + 1} / {totalChapters}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> ~{estListeningMinutes} phút nghe
            </span>
            <span>•</span>
            <span>{currentChapter.wordCount.toLocaleString()} từ</span>
          </div>

          <h1
            className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mt-2 ${fontClasses}`}
            style={{ lineHeight: 1.3 }}
          >
            {currentChapter.title}
          </h1>
        </header>

        {/* Content Paragraphs */}
        <div
          className={`space-y-6 ${fontClasses}`}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            textAlign: settings.textAlign,
          }}
        >
          {currentChapter.paragraphs.map((paragraph, pIdx) => {
            const isCurrentParagraph = position.paragraphIndex === pIdx;

            if (paragraph.isHeading) {
              return (
                <h2
                  key={paragraph.id}
                  id={`para-${pIdx}`}
                  className="text-xl sm:text-2xl font-bold mt-8 mb-4 tracking-tight opacity-95"
                >
                  {paragraph.rawText}
                </h2>
              );
            }

            return (
              <p
                key={paragraph.id}
                id={`para-${pIdx}`}
                className={`relative group/para transition-opacity duration-150 rounded-lg p-1 -mx-1 ${
                  isCurrentParagraph ? 'opacity-100' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {paragraph.sentences.map((sentence, sIdx) => {
                  const isActive =
                    position.chapterIndex === currentChapter.index &&
                    position.paragraphIndex === pIdx &&
                    position.sentenceIndex === sIdx;

                  const isPlayingActive = isActive && ttsStatus === 'playing';

                  return (
                    <span
                      key={sentence.id}
                      ref={isActive ? activeSentenceRef : null}
                      onClick={() => onSelectSentence(pIdx, sIdx)}
                      className={`inline cursor-pointer transition-all duration-150 relative group/sent rounded-xs ${
                        isActive ? getHighlightClass(true) : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      title="Nhấn để đọc từ câu này"
                    >
                      {/* Play glyph indicator on hover */}
                      <span className="hidden group-hover/sent:inline-flex items-center -ml-1 mr-1 opacity-60 align-middle">
                        <Play className="w-3 h-3 fill-current text-amber-500 inline" />
                      </span>

                      {/* Active pulse ring if currently sounding */}
                      {isPlayingActive && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-ping align-middle" />
                      )}

                      <span>{sentence.text}</span>
                      {' '}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </div>

        {/* Chapter Navigation Footer */}
        <footer className="mt-16 pt-8 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
          <button
            id="btn-footer-prev-chapter"
            onClick={onPrevChapter}
            disabled={position.chapterIndex === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Chương trước</span>
          </button>

          <span className="text-xs opacity-60 font-medium">
            {position.chapterIndex + 1} / {totalChapters}
          </span>

          <button
            id="btn-footer-next-chapter"
            onClick={onNextChapter}
            disabled={position.chapterIndex >= totalChapters - 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <span>Chương sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </article>
    </main>
  );
};
