import React, { useState } from 'react';
import {
  X,
  List,
  Library,
  Sliders,
  Check,
  Trash2,
  BookOpen,
  Plus,
  FileText,
  Clock,
  Sparkles,
  AlignLeft,
  AlignJustify,
} from 'lucide-react';
import { Book, Chapter, FontFamily, ReaderSettings, ReaderTheme } from '../types';

interface SidebarProps {
  isOpen: boolean;
  activeTab: 'chapters' | 'library' | 'appearance';
  onClose: () => void;
  onTabChange: (tab: 'chapters' | 'library' | 'appearance') => void;
  currentBook: Book | null;
  currentChapterIndex: number;
  books: Book[];
  onSelectChapter: (index: number) => void;
  onSelectBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onOpenUpload: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeTab,
  onClose,
  onTabChange,
  currentBook,
  currentChapterIndex,
  books,
  onSelectChapter,
  onSelectBook,
  onDeleteBook,
  onOpenUpload,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const isDark = settings.theme === 'dark' || settings.theme === 'oled';

  const themes: { id: ReaderTheme; label: string; previewBg: string; previewText: string }[] = [
    { id: 'paper', label: 'Giấy Trắng', previewBg: 'bg-[#faf9f6]', previewText: 'text-neutral-900 border-neutral-300' },
    { id: 'sepia', label: 'Trang Sách Ấm', previewBg: 'bg-[#f7f0e3]', previewText: 'text-amber-950 border-[#e5d6be]' },
    { id: 'sage', label: 'Xanh Trầm Mắt', previewBg: 'bg-[#edf3ec]', previewText: 'text-emerald-950 border-[#d2dfd0]' },
    { id: 'dark', label: 'Ban Đêm Dịu', previewBg: 'bg-[#18181b]', previewText: 'text-neutral-200 border-neutral-700' },
    { id: 'oled', label: 'Đen OLED', previewBg: 'bg-[#000000]', previewText: 'text-white border-neutral-800' },
  ];

  const fonts: { id: FontFamily; label: string; preview: string }[] = [
    { id: 'serif', label: 'Serif (Lora)', preview: 'font-reader-serif' },
    { id: 'sans', label: 'Sans (Jakarta)', preview: 'font-reader-sans' },
    { id: 'mono', label: 'Monospace', preview: 'font-reader-mono' },
  ];

  return (
    <div
      id="sidebar-backdrop"
      className="fixed inset-0 z-50 flex justify-start bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="sidebar-panel"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm sm:max-w-md h-full flex flex-col shadow-2xl border-r transition-colors duration-200 ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-1">
            <button
              id="tab-btn-chapters"
              onClick={() => onTabChange('chapters')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'chapters'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Mục lục</span>
            </button>

            <button
              id="tab-btn-library"
              onClick={() => onTabChange('library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'library'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>Tủ sách ({books.length})</span>
            </button>

            <button
              id="tab-btn-appearance"
              onClick={() => onTabChange('appearance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'appearance'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Hiển thị</span>
            </button>
          </div>

          <button
            id="btn-close-sidebar"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: CHAPTERS */}
          {activeTab === 'chapters' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-semibold opacity-60 uppercase tracking-wider">
                  Danh sách chương ({currentBook?.chapters.length || 0})
                </span>
                <span className="text-xs opacity-50 font-medium">
                  {currentBook?.title}
                </span>
              </div>

              {currentBook?.chapters.map((chapter) => {
                const isActive = chapter.index === currentChapterIndex;
                const estMin = Math.max(1, Math.ceil(chapter.wordCount / 140));

                return (
                  <button
                    key={chapter.id}
                    id={`sidebar-chapter-${chapter.index}`}
                    onClick={() => {
                      onSelectChapter(chapter.index);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold shadow-xs'
                        : 'hover:bg-black/5 dark:hover:bg-white/5 text-inherit'
                    }`}
                  >
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-amber-500 text-white'
                          : 'bg-black/5 dark:bg-white/10 opacity-70'
                      }`}
                    >
                      {chapter.index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-2">{chapter.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] opacity-60 font-normal">
                        <span>{chapter.wordCount.toLocaleString()} từ</span>
                        <span>•</span>
                        <span>~{estMin} phút nghe</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold opacity-60 uppercase tracking-wider">
                  Sách của bạn & Sách mẫu
                </span>
                <button
                  id="btn-sidebar-add-book"
                  onClick={() => {
                    onOpenUpload();
                    onClose();
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-400 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm sách
                </button>
              </div>

              <div className="space-y-2">
                {books.map((b) => {
                  const isCurrent = currentBook?.id === b.id;

                  return (
                    <div
                      key={b.id}
                      id={`library-book-${b.id}`}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-500/5'
                          : isDark
                          ? 'border-neutral-800 hover:border-neutral-700 bg-neutral-800/40'
                          : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectBook(b.id);
                          onClose();
                        }}
                        className="flex-1 text-left min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                              b.format === 'epub'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : b.format === 'pdf'
                                ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {b.format}
                          </span>
                          <h4 className="text-sm font-semibold truncate">{b.title}</h4>
                        </div>
                        <p className="text-xs opacity-60 truncate mt-0.5">
                          {b.author} • {b.totalChapters} chương • {b.totalWords.toLocaleString()} từ
                        </p>
                      </button>

                      {b.format !== 'sample' && (
                        <button
                          id={`btn-del-book-${b.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBook(b.id);
                          }}
                          className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Xóa sách này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Color Themes */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Màu nền & Phối cảnh
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      id={`theme-select-${t.id}`}
                      onClick={() => onUpdateSettings({ theme: t.id })}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${t.previewBg} ${t.previewText} ${
                        settings.theme === t.id ? 'ring-2 ring-amber-500 shadow-xs' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span>{t.label}</span>
                      {settings.theme === t.id && <Check className="w-4 h-4 text-amber-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Phông chữ (Font)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {fonts.map((f) => (
                    <button
                      key={f.id}
                      id={`font-select-${f.id}`}
                      onClick={() => onUpdateSettings({ fontFamily: f.id })}
                      className={`py-2 px-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                        settings.fontFamily === f.id
                          ? 'bg-amber-500 border-amber-500 text-white font-bold'
                          : isDark
                          ? 'border-neutral-700 hover:bg-neutral-800'
                          : 'border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <span className={f.preview}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Cỡ chữ:</span>
                  <span className="text-amber-500 font-bold">{settings.fontSize} px</span>
                </div>
                <input
                  id="slider-font-size"
                  type="range"
                  min="14"
                  max="28"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] opacity-40 font-mono">
                  <span>14px</span>
                  <span>18px (Chuẩn)</span>
                  <span>28px</span>
                </div>
              </div>

              {/* Line Spacing */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Giãn cách dòng:</span>
                  <span className="text-amber-500 font-bold">{settings.lineHeight}</span>
                </div>
                <input
                  id="slider-line-height"
                  type="range"
                  min="1.4"
                  max="2.2"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => onUpdateSettings({ lineHeight: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Highlight Style */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Kiểu tô sáng câu đang đọc
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'soft-amber', label: 'Hổ phách ấm' },
                    { id: 'emerald', label: 'Xanh ngọc dịu' },
                    { id: 'sky', label: 'Xanh da trời' },
                    { id: 'underline', label: 'Gạch chân dưới' },
                  ].map((h) => (
                    <button
                      key={h.id}
                      id={`highlight-select-${h.id}`}
                      onClick={() => onUpdateSettings({ highlightStyle: h.id as any })}
                      className={`p-2 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                        settings.highlightStyle === h.id
                          ? 'bg-amber-500 border-amber-500 text-white font-bold'
                          : isDark
                          ? 'border-neutral-700 hover:bg-neutral-800'
                          : 'border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alignment */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Căn lề văn bản
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="align-left"
                    onClick={() => onUpdateSettings({ textAlign: 'left' })}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      settings.textAlign === 'left'
                        ? 'bg-amber-500 border-amber-500 text-white font-bold'
                        : isDark
                        ? 'border-neutral-700 hover:bg-neutral-800'
                        : 'border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Căn trái</span>
                  </button>

                  <button
                    id="align-justify"
                    onClick={() => onUpdateSettings({ textAlign: 'justify' })}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      settings.textAlign === 'justify'
                        ? 'bg-amber-500 border-amber-500 text-white font-bold'
                        : isDark
                        ? 'border-neutral-700 hover:bg-neutral-800'
                        : 'border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                    <span>Căn đều 2 bên</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
