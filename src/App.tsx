import React, { useState, useEffect, useCallback } from 'react';
import { Book, PlaybackPosition, ReaderSettings, TTSSettings } from './types';
import { SAMPLE_BOOKS } from './utils/sampleBooks';
import { ttsEngine, TTSStatus, TTSVoiceInfo } from './services/ttsService';
import { Navbar } from './components/Navbar';
import { ReaderView } from './components/ReaderView';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { Sidebar } from './components/Sidebar';
import { UploadModal } from './components/UploadModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { usePWA } from './hooks/usePWA';

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  theme: 'sepia',
  fontFamily: 'serif',
  fontSize: 18,
  lineHeight: 1.8,
  maxWidth: 'md',
  textAlign: 'justify',
  highlightStyle: 'soft-amber',
  autoScroll: true,
};

const DEFAULT_TTS_SETTINGS: TTSSettings = {
  voiceUri: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  sentencePauseMs: 250,
  paragraphPauseMs: 500,
  expandAbbreviations: true,
  removeCitations: true,
};

export default function App() {
  const { isInstallable, isIOS, isOnline, installApp } = usePWA();

  // Books library
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('ebook_tts_saved_books');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with sample books
          const allIds = new Set(parsed.map((b: Book) => b.id));
          const uniqueSamples = SAMPLE_BOOKS.filter((s) => !allIds.has(s.id));
          return [...parsed, ...uniqueSamples];
        }
      }
    } catch (e) {
      console.warn('Error reading saved books from storage', e);
    }
    return SAMPLE_BOOKS;
  });

  const [currentBookId, setCurrentBookId] = useState<string>(() => {
    try {
      const lastId = localStorage.getItem('ebook_tts_last_book_id');
      if (lastId) return lastId;
    } catch {}
    return SAMPLE_BOOKS[0].id;
  });

  // Current active book
  const currentBook = books.find((b) => b.id === currentBookId) || books[0] || SAMPLE_BOOKS[0];

  // Playback & TTS state
  const [position, setPosition] = useState<PlaybackPosition>({
    chapterIndex: 0,
    paragraphIndex: 0,
    sentenceIndex: 0,
  });
  const [ttsStatus, setTtsStatus] = useState<TTSStatus>('idle');
  const [voices, setVoices] = useState<TTSVoiceInfo[]>([]);

  // Keep screen awake (Wake Lock)
  const [keepScreenAwake, setKeepScreenAwake] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ebook_tts_keep_screen_awake') === 'true';
    } catch {
      return false;
    }
  });

  // Settings
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => {
    try {
      const saved = localStorage.getItem('ebook_tts_reader_settings');
      if (saved) return { ...DEFAULT_READER_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_READER_SETTINGS;
  });

  const [ttsSettings, setTtsSettings] = useState<TTSSettings>(() => {
    try {
      const saved = localStorage.getItem('ebook_tts_speech_settings');
      if (saved) return { ...DEFAULT_TTS_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_TTS_SETTINGS;
  });

  const handleRefreshVoices = useCallback(async () => {
    const loadedVoices = await ttsEngine.getVoices();
    setVoices(loadedVoices);
    // If current selected voice is not found or not set, pick best Vietnamese
    if (!ttsSettings.voiceUri || !loadedVoices.some((v) => v.voiceURI === ttsSettings.voiceUri)) {
      const viVoice = loadedVoices.find((v) => v.isVietnamese);
      if (viVoice) {
        setTtsSettings((prev) => ({ ...prev, voiceUri: viVoice.voiceURI }));
        ttsEngine.updateSettings({ voiceUri: viVoice.voiceURI });
      }
    }
  }, [ttsSettings.voiceUri]);

  // Modals & Panels
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chapters' | 'library' | 'appearance'>('chapters');

  // Load available voices from system
  useEffect(() => {
    ttsEngine.getVoices().then((loadedVoices) => {
      setVoices(loadedVoices);
      // Auto-select best Vietnamese voice if none selected
      if (!ttsSettings.voiceUri && loadedVoices.length > 0) {
        const viVoice = loadedVoices.find((v) => v.isVietnamese);
        if (viVoice) {
          setTtsSettings((prev) => ({ ...prev, voiceUri: viVoice.voiceURI }));
          ttsEngine.updateSettings({ voiceUri: viVoice.voiceURI });
        }
      }
    });
  }, []);

  // Update TTS Engine callbacks
  useEffect(() => {
    ttsEngine.setCallbacks({
      onStatusChange: (status) => setTtsStatus(status),
      onPositionChange: (pos) => setPosition(pos),
      onChapterEnd: () => {},
      onBookEnd: () => {},
      onError: (msg) => {
        console.warn('TTS Error:', msg);
      },
    });
  }, []);

  // Synchronize keep screen awake setting
  useEffect(() => {
    ttsEngine.setKeepScreenAwake(keepScreenAwake);
    try {
      localStorage.setItem('ebook_tts_keep_screen_awake', String(keepScreenAwake));
    } catch {}
  }, [keepScreenAwake]);

  // Initialize TTS Engine when book or chapter changes
  useEffect(() => {
    if (currentBook) {
      ttsEngine.loadBookChapters(
        currentBook.chapters,
        {
          chapterIndex: currentBook.lastReadChapter || 0,
          paragraphIndex: currentBook.lastReadParagraph || 0,
          sentenceIndex: currentBook.lastReadSentence || 0,
        },
        currentBook.title,
        currentBook.author
      );
      setPosition({
        chapterIndex: currentBook.lastReadChapter || 0,
        paragraphIndex: currentBook.lastReadParagraph || 0,
        sentenceIndex: currentBook.lastReadSentence || 0,
      });
    }
  }, [currentBook?.id]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('ebook_tts_reader_settings', JSON.stringify(readerSettings));
    } catch {}
  }, [readerSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('ebook_tts_speech_settings', JSON.stringify(ttsSettings));
    } catch {}
  }, [ttsSettings]);

  useEffect(() => {
    try {
      if (currentBookId) {
        localStorage.setItem('ebook_tts_last_book_id', currentBookId);
      }
    } catch {}
  }, [currentBookId]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if inside inputs or textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (ttsStatus === 'playing') {
          ttsEngine.pause();
        } else {
          ttsEngine.play();
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        ttsEngine.nextSentence();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        ttsEngine.prevSentence();
      } else if (e.code === 'Escape') {
        setIsUploadOpen(false);
        setIsVoiceSettingsOpen(false);
        setIsPWAInstallOpen(false);
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ttsStatus]);

  // Handlers
  const handlePlay = useCallback(() => {
    ttsEngine.play();
  }, []);

  const handlePause = useCallback(() => {
    ttsEngine.pause();
  }, []);

  const handlePrevSentence = useCallback(() => {
    ttsEngine.prevSentence();
  }, []);

  const handleNextSentence = useCallback(() => {
    ttsEngine.nextSentence();
  }, []);

  const handlePrevChapter = useCallback(() => {
    ttsEngine.prevChapter();
  }, []);

  const handleNextChapter = useCallback(() => {
    ttsEngine.nextChapter();
  }, []);

  const handleSelectSentence = useCallback(
    (pIdx: number, sIdx: number) => {
      ttsEngine.setPosition(
        {
          chapterIndex: position.chapterIndex,
          paragraphIndex: pIdx,
          sentenceIndex: sIdx,
        },
        true // Start playing immediately on click
      );
    },
    [position.chapterIndex]
  );

  const handleSelectChapter = useCallback(
    (chapterIndex: number) => {
      ttsEngine.setPosition(
        {
          chapterIndex,
          paragraphIndex: 0,
          sentenceIndex: 0,
        },
        ttsStatus === 'playing'
      );
    },
    [ttsStatus]
  );

  const handleBookLoaded = useCallback((newBook: Book) => {
    setBooks((prev) => {
      const updated = [newBook, ...prev.filter((b) => b.id !== newBook.id)];
      try {
        const toSave = updated.filter((b) => b.format !== 'sample');
        localStorage.setItem('ebook_tts_saved_books', JSON.stringify(toSave));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });
    setCurrentBookId(newBook.id);
  }, []);

  const handleDeleteBook = useCallback(
    (bookId: string) => {
      setBooks((prev) => {
        const filtered = prev.filter((b) => b.id !== bookId);
        try {
          const toSave = filtered.filter((b) => b.format !== 'sample');
          localStorage.setItem('ebook_tts_saved_books', JSON.stringify(toSave));
        } catch {}
        return filtered;
      });
      if (currentBookId === bookId) {
        setCurrentBookId(SAMPLE_BOOKS[0].id);
      }
    },
    [currentBookId]
  );

  const handleUpdateTtsSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    setTtsSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      ttsEngine.updateSettings(updated);
      return updated;
    });
  }, []);

  const handleToggleTheme = useCallback(() => {
    setReaderSettings((prev) => {
      const nextTheme = prev.theme === 'dark' || prev.theme === 'oled' ? 'sepia' : 'dark';
      return { ...prev, theme: nextTheme };
    });
  }, []);

  const currentChapter = currentBook?.chapters[position.chapterIndex] || null;

  return (
    <div id="ebook-tts-app" className="min-h-screen flex flex-col antialiased">
      {/* Top Navigation */}
      <Navbar
        currentBook={currentBook}
        currentChapterIndex={position.chapterIndex}
        ttsStatus={ttsStatus}
        theme={readerSettings.theme}
        isOnline={isOnline}
        isInstallable={isInstallable}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSidebar={(tab = 'chapters') => {
          setSidebarTab(tab);
          setIsSidebarOpen(true);
        }}
        onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
        onOpenInstallModal={() => setIsPWAInstallOpen(true)}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Reader View */}
      <ReaderView
        currentChapter={currentChapter}
        position={position}
        ttsStatus={ttsStatus}
        settings={readerSettings}
        totalChapters={currentBook?.chapters.length || 1}
        onSelectSentence={handleSelectSentence}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
      />

      {/* Persistent Bottom Audio Player Bar */}
      {currentBook && (
        <AudioPlayerBar
          status={ttsStatus}
          position={position}
          currentChapter={currentChapter}
          totalChapters={currentBook.chapters.length}
          theme={readerSettings.theme}
          voices={voices}
          settings={ttsSettings}
          onPlay={handlePlay}
          onPause={handlePause}
          onPrevSentence={handlePrevSentence}
          onNextSentence={handleNextSentence}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
          onUpdateRate={(rate) => handleUpdateTtsSettings({ rate })}
          onToggleAutoScroll={() =>
            setReaderSettings((prev) => ({ ...prev, autoScroll: !prev.autoScroll }))
          }
          autoScroll={readerSettings.autoScroll}
        />
      )}

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        activeTab={sidebarTab}
        onClose={() => setIsSidebarOpen(false)}
        onTabChange={(tab) => setSidebarTab(tab)}
        currentBook={currentBook}
        currentChapterIndex={position.chapterIndex}
        books={books}
        onSelectChapter={handleSelectChapter}
        onSelectBook={(bId) => {
          setCurrentBookId(bId);
        }}
        onDeleteBook={handleDeleteBook}
        onOpenUpload={() => setIsUploadOpen(true)}
        settings={readerSettings}
        onUpdateSettings={(newSettings) =>
          setReaderSettings((prev) => ({ ...prev, ...newSettings }))
        }
      />

      {/* Upload Ebook Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onBookLoaded={handleBookLoaded}
        theme={readerSettings.theme}
      />

      {/* Voice, Background Mode & Coherence Tuning Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        settings={ttsSettings}
        onUpdateSettings={handleUpdateTtsSettings}
        voices={voices}
        theme={readerSettings.theme}
        onSetSleepTimer={(mins) => ttsEngine.setSleepTimer(mins)}
        keepScreenAwake={keepScreenAwake}
        onToggleKeepScreenAwake={(val) => setKeepScreenAwake(val)}
        onOpenInstallModal={() => {
          setIsVoiceSettingsOpen(false);
          setIsPWAInstallOpen(true);
        }}
        onRefreshVoices={handleRefreshVoices}
      />

      {/* PWA Install & Offline Guide Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallOpen}
        onClose={() => setIsPWAInstallOpen(false)}
        isIOS={isIOS}
        onInstall={installApp}
        theme={readerSettings.theme}
      />
    </div>
  );
}
