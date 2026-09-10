import React from 'react';
import {
  BookOpen,
  UploadCloud,
  List,
  Sliders,
  Volume2,
  Bookmark,
  Sun,
  Moon,
  Sparkles,
  Wifi,
  WifiOff,
  Download,
  Smartphone,
} from 'lucide-react';
import { Book, ReaderTheme } from '../types';
import { TTSStatus } from '../services/ttsService';

interface NavbarProps {
  currentBook: Book | null;
  currentChapterIndex: number;
  ttsStatus: TTSStatus;
  theme: ReaderTheme;
  isOnline: boolean;
  isInstallable: boolean;
  onOpenUpload: () => void;
  onOpenSidebar: (tab?: 'chapters' | 'library' | 'appearance') => void;
  onOpenVoiceSettings: () => void;
  onOpenInstallModal: () => void;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentBook,
  currentChapterIndex,
  ttsStatus,
  theme,
  isOnline,
  isInstallable,
  onOpenUpload,
  onOpenSidebar,
  onOpenVoiceSettings,
  onOpenInstallModal,
  onToggleTheme,
}) => {
  const currentChapter = currentBook?.chapters[currentChapterIndex];
  const isDark = theme === 'dark' || theme === 'oled';

  return (
    <header
      id="app-header"
      aria-label="Thanh điều hướng chính"
      className={`sticky top-0 z-30 transition-colors duration-200 border-b ${
        isDark
          ? 'bg-neutral-900/90 border-neutral-800 text-neutral-100 backdrop-blur-md'
          : theme === 'sepia'
          ? 'bg-[#f6efe2]/95 border-[#e8ddc9] text-amber-950 backdrop-blur-md'
          : theme === 'sage'
          ? 'bg-[#eef3ed]/95 border-[#d5e0d3] text-emerald-950 backdrop-blur-md'
          : 'bg-white/95 border-neutral-200 text-neutral-900 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand / Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            id="btn-open-library"
            onClick={() => onOpenSidebar('library')}
            className={`flex items-center gap-2 font-semibold text-sm sm:text-base tracking-tight shrink-0 transition-opacity hover:opacity-85 ${
              isDark ? 'text-neutral-100' : 'text-neutral-900'
            }`}
            title="Mở thư viện sách"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="hidden md:inline font-bold">Ebook TTS</span>
          </button>

          {/* Book & Chapter breadcrumb */}
          {currentBook && (
            <div className="flex items-center gap-1.5 min-w-0 text-xs sm:text-sm">
              <span className="opacity-40">/</span>
              <button
                id="btn-toc-breadcrumb"
                onClick={() => onOpenSidebar('chapters')}
                className="font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px] hover:underline text-left"
                title={`${currentBook.title} - ${currentChapter?.title || ''}`}
              >
                {currentBook.title}
              </button>
              {currentChapter && (
                <span className="hidden lg:inline-block opacity-60 text-xs truncate max-w-[160px]">
                  • {currentChapter.title}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Online / Offline Status Badge */}
          {!isOnline ? (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30"
              title="Đang ở chế độ Ngoại tuyến (Offline). Tất cả sách đã lưu và TTS vẫn hoạt động trơn tru."
            >
              <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          ) : (
            <div
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium opacity-60 hover:opacity-100 transition-opacity"
              title="Trực tuyến & Hỗ trợ chạy Offline khi mất mạng"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px]">Online</span>
            </div>
          )}

          {/* Audio Speaking status indicator badge */}
          {ttsStatus === 'playing' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[11px]">Đang đọc</span>
            </div>
          )}

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              id="btn-install-pwa-nav"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 hover:bg-amber-500 hover:text-white text-amber-700 dark:text-amber-400 transition-all cursor-pointer"
              title="Cài đặt ứng dụng để nghe sách Offline"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cài App Offline</span>
            </button>
          )}

          {/* Table of contents button */}
          <button
            id="btn-open-toc"
            onClick={() => onOpenSidebar('chapters')}
            className={`p-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
              isDark
                ? 'hover:bg-neutral-800 text-neutral-300'
                : 'hover:bg-neutral-100 text-neutral-700'
            }`}
            title="Mục lục các chương"
          >
            <List className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-medium">Mục lục</span>
          </button>

          {/* Voice & Screen-off Settings button */}
          <button
            id="btn-voice-settings"
            onClick={onOpenVoiceSettings}
            className={`p-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
              isDark
                ? 'hover:bg-neutral-800 text-amber-400'
                : 'hover:bg-amber-50 text-amber-700'
            }`}
            title="Cài đặt giọng đọc, nhịp thở & nghe khi tắt màn hình"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-medium">Giọng đọc & Nền</span>
          </button>

          {/* Appearance Customizer button */}
          <button
            id="btn-appearance-settings"
            onClick={() => onOpenSidebar('appearance')}
            className={`p-2 rounded-lg text-sm transition-colors ${
              isDark
                ? 'hover:bg-neutral-800 text-neutral-300'
                : 'hover:bg-neutral-100 text-neutral-700'
            }`}
            title="Cài đặt giao diện đọc sách"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Theme Quick Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={onToggleTheme}
            className={`p-2 rounded-lg text-sm transition-colors ${
              isDark
                ? 'hover:bg-neutral-800 text-amber-400'
                : 'hover:bg-neutral-100 text-neutral-700'
            }`}
            title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ ban đêm'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Upload Ebook button */}
          <button
            id="btn-open-upload-modal"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-all shadow-xs shrink-0 cursor-pointer ml-1"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nhập Ebook</span>
          </button>
        </div>
      </div>
    </header>
  );
};
