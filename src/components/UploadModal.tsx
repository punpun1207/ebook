import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  BookOpen,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { Book, ReaderTheme } from '../types';
import { parseEpubFile } from '../utils/epubParser';
import { parsePdfFile } from '../utils/pdfParser';
import { SAMPLE_BOOKS } from '../utils/sampleBooks';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookLoaded: (book: Book) => void;
  theme: ReaderTheme;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onBookLoaded,
  theme,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark' || theme === 'oled';

  const handleProcessFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'epub' && ext !== 'pdf') {
      setErrorMessage('Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp .epub hoặc .pdf');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setProgressPercent(null);

    try {
      let parsedBook: Book;

      if (ext === 'epub') {
        setProgressText('Đang giải nén và phân tích cấu trúc chương EPUB...');
        parsedBook = await parseEpubFile(file, file.name);
      } else {
        setProgressText('Đang khởi tạo bộ phân tích PDF và tái tạo cấu trúc câu...');
        parsedBook = await parsePdfFile(file, file.name, (current, total) => {
          setProgressText(`Đang xử lý trang ${current} / ${total}...`);
          setProgressPercent(Math.round((current / total) * 100));
        });
      }

      onBookLoaded(parsedBook);
      onClose();
    } catch (err: any) {
      console.error('Error parsing file:', err);
      setErrorMessage(err.message || 'Không thể mở tệp sách này. Vui lòng kiểm tra lại tệp.');
    } finally {
      setLoading(false);
      setProgressText('');
      setProgressPercent(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  return (
    <div
      id="modal-upload-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="modal-upload-card"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Nhập Ebook (EPUB / PDF)</h2>
              <p className="text-xs opacity-60">Tải lên sách để đọc với giọng đọc TTS mạch lạc</p>
            </div>
          </div>
          <button
            id="btn-close-upload-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Drag & Drop Zone */}
          <div
            id="dropzone-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                : loading
                ? 'border-amber-500/40 bg-amber-500/5 cursor-wait'
                : isDark
                ? 'border-neutral-700 hover:border-neutral-500 bg-neutral-800/30'
                : 'border-neutral-300 hover:border-amber-500 bg-neutral-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              id="file-input-ebook"
              type="file"
              accept=".epub,.pdf"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={loading}
            />

            {loading ? (
              <div className="space-y-3 py-4 w-full max-w-sm">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {progressText || 'Đang xử lý tệp ebook...'}
                </p>
                {progressPercent !== null && (
                  <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
                <p className="text-xs opacity-60">
                  Đang lọc sạch rác ngắt dòng, nhận diện câu và ngắt nghỉ tự nhiên...
                </p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-bold">Kéo thả tệp EPUB hoặc PDF vào đây</h3>
                <p className="text-xs opacity-60 mt-1">hoặc nhấn để chọn tệp từ máy tính</p>
                <div className="flex items-center gap-2 mt-4 text-[11px] font-semibold">
                  <span className="px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    .EPUB (Khuyên dùng)
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-red-500/15 text-red-600 dark:text-red-400">
                    .PDF (Tự động nối dòng thông minh)
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preset Sample Books */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-70">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Hoặc trải nghiệm ngay với tuyển tập mẫu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_BOOKS.map((sb) => (
                <button
                  key={sb.id}
                  id={`sample-book-btn-${sb.id}`}
                  onClick={() => {
                    onBookLoaded(sb);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all hover:border-amber-500 hover:shadow-md cursor-pointer flex flex-col justify-between ${
                    isDark
                      ? 'border-neutral-800 bg-neutral-800/40 hover:bg-neutral-800'
                      : 'border-neutral-200 bg-white hover:bg-amber-50/40'
                  }`}
                >
                  <div>
                    <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold line-clamp-2">{sb.title}</h4>
                    <p className="text-[11px] opacity-60 mt-0.5 line-clamp-1">{sb.author}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] opacity-50">
                    <span>{sb.chapters.length} chương</span>
                    <span>{sb.totalWords.toLocaleString()} từ</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
