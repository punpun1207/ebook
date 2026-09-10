import React from 'react';
import { X, Smartphone, Download, Share, PlusSquare, WifiOff, CheckCircle2 } from 'lucide-react';
import { ReaderTheme } from '../types';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
  theme: ReaderTheme;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  onInstall,
  theme,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark' || theme === 'oled';

  const handleInstallClick = async () => {
    const success = await onInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      id="modal-pwa-install-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="modal-pwa-install-card"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Cài đặt Ứng dụng & Dùng Offline</h2>
              <p className="text-xs opacity-60">Chạy mượt mà ngay cả khi không có mạng</p>
            </div>
          </div>
          <button
            id="btn-close-pwa-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Ưu điểm khi cài đặt ra Màn hình chính:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 opacity-80">
                <li>Mở nhanh toàn màn hình như ứng dụng native, không bị vướng thanh URL.</li>
                <li>Đọc và nghe sách 100% Offline không cần mạng Internet.</li>
                <li>Tối ưu hóa chạy nền khi tắt màn hình điện thoại hoặc sử dụng tai nghe.</li>
              </ul>
            </div>
          </div>

          {isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">
                Hướng dẫn cài đặt trên iPhone / iPad (Safari)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                    <Share className="w-3.5 h-3.5" />
                  </div>
                  <span>1. Nhấn nút <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng Safari</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </div>
                  <span>2. Cuộn xuống và chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong></span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <span>3. Nhấn <strong>Thêm (Add)</strong> ở góc trên bên phải</span>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Chrome Desktop Install Button */
            <div className="space-y-3 pt-2">
              <p className="text-xs opacity-70">
                Nhấn nút bên dưới để thêm ứng dụng vào màn hình điện thoại hoặc máy tính của bạn:
              </p>
              <button
                id="btn-confirm-install-pwa"
                onClick={handleInstallClick}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Cài đặt Ứng Dụng ngay</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-black/10 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
