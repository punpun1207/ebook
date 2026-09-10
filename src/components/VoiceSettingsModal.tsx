import React, { useState } from 'react';
import {
  X,
  Volume2,
  Play,
  Square,
  Sparkles,
  Sliders,
  Check,
  Clock,
  Settings2,
  Info,
  Timer,
  Moon,
  Sun,
  ShieldCheck,
  Radio,
  Wifi,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { TTSSettings, ReaderTheme } from '../types';
import { TTSVoiceInfo, ttsEngine } from '../services/ttsService';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TTSSettings;
  onUpdateSettings: (newSettings: Partial<TTSSettings>) => void;
  voices: TTSVoiceInfo[];
  theme: ReaderTheme;
  onSetSleepTimer: (minutes: number | null) => void;
  keepScreenAwake: boolean;
  onToggleKeepScreenAwake: (enabled: boolean) => void;
  onOpenInstallModal?: () => void;
  onRefreshVoices?: () => Promise<void>;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  voices,
  theme,
  onSetSleepTimer,
  keepScreenAwake,
  onToggleKeepScreenAwake,
  onOpenInstallModal,
  onRefreshVoices,
}) => {
  const [testingAudio, setTestingAudio] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSamsungGuide, setShowSamsungGuide] = useState(false);
  const [sleepTimerValue, setSleepTimerValue] = useState<number | null>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark' || theme === 'oled';
  const isSamsungDevice = ttsEngine.isSamsungDevice();

  const vietnameseVoices = voices.filter((v) => v.isVietnamese);
  const otherVoices = voices.filter((v) => !v.isVietnamese);

  const selectedVoice = voices.find((v) => v.voiceURI === settings.voiceUri);

  const handleRefresh = async () => {
    if (!onRefreshVoices || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshVoices();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const testSampleSentence = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (testingAudio) {
      setTestingAudio(false);
      return;
    }

    const testText =
      'Xin chào! Đây là giọng đọc mẫu với nhịp điệu ngắt nghỉ tự nhiên, giúp bạn tiếp thu kiến thức một cách mạch lạc và êm ái nhất.';
    const utterance = new SpeechSynthesisUtterance(testText);

    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    const matchedVoice = voices.find((v) => v.voiceURI === settings.voiceUri);
    if (matchedVoice) {
      const allSysVoices = window.speechSynthesis.getVoices();
      const realVoice = allSysVoices.find((v) => v.voiceURI === matchedVoice.voiceURI);
      if (realVoice) {
        utterance.voice = realVoice;
      }
    }

    utterance.onstart = () => setTestingAudio(true);
    utterance.onend = () => setTestingAudio(false);
    utterance.onerror = () => setTestingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSelectSleepTimer = (minutes: number | null) => {
    setSleepTimerValue(minutes);
    onSetSleepTimer(minutes);
  };

  return (
    <div
      id="modal-voice-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="modal-voice-settings-card"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Cài đặt Giọng đọc & Chế độ Nền</h2>
              <p className="text-xs opacity-60">Tinh chỉnh âm sắc, nhịp thở và nghe khi tắt màn hình</p>
            </div>
          </div>
          <button
            id="btn-close-voice-settings"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mobile Screen-off & Offline Capabilities Banner */}
          <section className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Duy trì đọc khi Tắt Màn Hình Điện Thoại
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Đã kích hoạt
              </span>
            </div>
            <p className="text-xs opacity-80 leading-relaxed">
              Bạn có thể nhấn nút nguồn để <strong>khóa hoặc tắt màn hình điện thoại</strong>, hoặc chuyển sang ứng dụng khác. Giọng đọc vẫn tiếp tục chạy mạch lạc và hiển thị widget điều khiển trực tiếp trên <strong>Màn hình khóa (Lock screen)</strong> hoặc tai nghe Bluetooth.
            </p>

            {/* Screen Awake toggle */}
            <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
              <div>
                <label
                  htmlFor="chk-screen-awake"
                  className="text-xs font-semibold cursor-pointer block"
                >
                  Giữ màn hình luôn sáng khi mở ứng dụng
                </label>
                <p className="text-[11px] opacity-60">
                  Ngăn điện thoại tự động tắt màn hình khi để trên bàn đọc sách
                </p>
              </div>
              <input
                id="chk-screen-awake"
                type="checkbox"
                checked={keepScreenAwake}
                onChange={(e) => onToggleKeepScreenAwake(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded-sm cursor-pointer ml-3 shrink-0"
              />
            </div>
          </section>

          {/* Voice Selector */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Chọn Giọng Đọc (Voice)
                </label>
                {selectedVoice && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      selectedVoice.engineProvider === 'samsung'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        : selectedVoice.engineProvider === 'google'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : selectedVoice.engineProvider === 'microsoft'
                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                        : selectedVoice.engineProvider === 'apple'
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                        : 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30'
                    }`}
                  >
                    {selectedVoice.providerLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {onRefreshVoices && (
                  <button
                    id="btn-refresh-voices"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    title="Làm mới lại danh sách giọng từ hệ thống"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline text-[11px]">Quét lại giọng</span>
                  </button>
                )}

                <button
                  id="btn-test-voice-sample"
                  onClick={testSampleSentence}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-400 transition-colors shadow-xs cursor-pointer"
                >
                  {testingAudio ? (
                    <>
                      <Square className="w-3 h-3 fill-current" /> Dừng thử
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" /> Nghe thử giọng
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <select
                id="select-voice"
                value={settings.voiceUri}
                onChange={(e) => onUpdateSettings({ voiceUri: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                  isDark
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-100'
                    : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                }`}
              >
                <option value="">-- Chọn giọng đọc phù hợp --</option>
                {vietnameseVoices.length > 0 && (
                  <optgroup label="🇻🇳 Giọng Tiếng Việt">
                    {vietnameseVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.engineProvider === 'samsung'
                          ? `[Samsung TTS] ${v.name}`
                          : v.engineProvider === 'google'
                          ? `[Google Speech] ${v.name}`
                          : v.engineProvider === 'microsoft'
                          ? `[Microsoft Neural] ${v.name}`
                          : v.engineProvider === 'apple'
                          ? `[Apple Siri] ${v.name}`
                          : v.name}{' '}
                        {v.default ? '(Mặc định)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherVoices.length > 0 && (
                  <optgroup label="🌐 Giọng Đa Ngôn Ngữ Khác">
                    {otherVoices.slice(0, 20).map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Guide to install & switch to Samsung TTS or Google TTS */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-2.5">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowSamsungGuide((prev) => !prev)}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <Cpu className="w-4 h-4" />
                  <span>
                    {isSamsungDevice
                      ? 'Cách bật Giọng Samsung TTS chất lượng cao trên máy Samsung'
                      : 'Cách bật Giọng Samsung TTS hoặc Google TTS chất lượng cao'}
                  </span>
                </div>
                {showSamsungGuide ? (
                  <ChevronUp className="w-4 h-4 text-blue-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-blue-500" />
                )}
              </div>

              {showSamsungGuide && (
                <div className="pt-2 text-xs space-y-2 text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-blue-500/10 animate-in fade-in">
                  <p>
                    Ứng dụng trực tiếp sử dụng bộ máy chuyển văn bản thành giọng nói (TTS) cục bộ của điện thoại. Để có giọng đọc truyền cảm, ấm áp nhất:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 marker:text-blue-500 marker:font-bold">
                    <li>
                      <strong>Mở Cài đặt điện thoại (Settings)</strong> ➔ <strong>Quản lý chung (General management)</strong>.
                    </li>
                    <li>
                      Chọn <strong>Chuyển văn bản thành giọng nói (Text-to-speech)</strong>.
                    </li>
                    <li>
                      Tại mục <strong>Công cụ ưu tiên (Preferred engine)</strong>:
                      <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[11px] opacity-90">
                        <li>
                          Nếu dùng Samsung: Chọn <strong>Công cụ TTS của Samsung (Samsung text-to-speech)</strong>.
                        </li>
                        <li>
                          Hoặc chọn <strong>Dịch vụ giọng nói của Google (Speech Services by Google)</strong>.
                        </li>
                      </ul>
                    </li>
                    <li>
                      Nhấn vào biểu tượng bánh răng <strong>⚙️</strong> cạnh công cụ ➔ <strong>Cài đặt dữ liệu thoại</strong> ➔ Tìm và tải gói <strong>Tiếng Việt (Việt Nam)</strong> chất lượng cao.
                    </li>
                    <li>
                      Quay lại ứng dụng này và nhấn nút <strong>"Quét lại giọng"</strong> ở trên để thưởng thức giọng Samsung tự nhiên 100% offline!
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </section>

          {/* Speed & Pitch Controls */}
          <section className="space-y-4 pt-1">
            {/* Speed slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Tốc độ đọc (Rate):</span>
                <span className="text-amber-500 font-bold">{settings.rate}x</span>
              </div>
              <input
                id="slider-tts-rate"
                type="range"
                min="0.6"
                max="1.8"
                step="0.05"
                value={settings.rate}
                onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] opacity-40">
                <span>0.6x (Chậm rãi)</span>
                <span>1.0x (Tiêu chuẩn)</span>
                <span>1.8x (Nhanh)</span>
              </div>
            </div>

            {/* Pitch slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Cao độ giọng (Pitch):</span>
                <span className="text-amber-500 font-bold">{settings.pitch}</span>
              </div>
              <input
                id="slider-tts-pitch"
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={settings.pitch}
                onChange={(e) => onUpdateSettings({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] opacity-40">
                <span>Trầm ấm</span>
                <span>Tự nhiên</span>
                <span>Thanh thoát</span>
              </div>
            </div>
          </section>

          {/* Coherence & Natural Cadence Settings */}
          <section className="space-y-4 pt-2 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">
                Tinh chỉnh Độ Mạch Lạc (Nhịp thở & Ngắt nghỉ)
              </h3>
            </div>

            {/* Sentence Pause */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Khoảng nghỉ giữa các câu:</span>
                <span className="text-amber-500 font-bold">{settings.sentencePauseMs} ms</span>
              </div>
              <input
                id="slider-sentence-pause"
                type="range"
                min="100"
                max="800"
                step="50"
                value={settings.sentencePauseMs}
                onChange={(e) => onUpdateSettings({ sentencePauseMs: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] opacity-60">
                Tạo nhịp thở tự nhiên giữa các câu, ngăn chặn tình trạng câu đọc dồn dập, đứt quãng khó chịu.
              </p>
            </div>

            {/* Paragraph Pause */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Khoảng nghỉ khi chuyển đoạn văn:</span>
                <span className="text-amber-500 font-bold">{settings.paragraphPauseMs} ms</span>
              </div>
              <input
                id="slider-para-pause"
                type="range"
                min="300"
                max="1500"
                step="50"
                value={settings.paragraphPauseMs}
                onChange={(e) => onUpdateSettings({ paragraphPauseMs: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] opacity-60">
                Cho người nghe khoảng lặng để suy ngẫm ý tưởng trước khi bước sang luận điểm mới.
              </p>
            </div>

            {/* Smart normalizations */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  id="chk-expand-abbr"
                  type="checkbox"
                  checked={settings.expandAbbreviations}
                  onChange={(e) => onUpdateSettings({ expandAbbreviations: e.target.checked })}
                  className="mt-0.5 rounded-sm accent-amber-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-semibold block group-hover:text-amber-500 transition-colors">
                    Tự động mở rộng từ viết tắt
                  </span>
                  <span className="opacity-60 block mt-0.5">
                    Phát âm rõ nghĩa: "TP.HCM" ➔ "Thành phố Hồ Chí Minh", "GS.TS" ➔ "Giáo sư Tiến sĩ", "v.v." ➔ "vân vân".
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  id="chk-remove-citations"
                  type="checkbox"
                  checked={settings.removeCitations}
                  onChange={(e) => onUpdateSettings({ removeCitations: e.target.checked })}
                  className="mt-0.5 rounded-sm accent-amber-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-semibold block group-hover:text-amber-500 transition-colors">
                    Tự động lọc bỏ trích dẫn và số chú thích [1], [2]
                  </span>
                  <span className="opacity-60 block mt-0.5">
                    Loại bỏ các ký hiệu tham chiếu tài liệu học thuật và số trang rác, giúp dòng đọc liên tục không bị ngắt ngang.
                  </span>
                </div>
              </label>
            </div>
          </section>

          {/* Sleep Timer */}
          <section className="space-y-3 pt-2 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">
                Hẹn giờ dừng đọc (Sleep Timer)
              </h3>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[null, 15, 30, 45, 60].map((mins) => (
                <button
                  key={mins ?? 'off'}
                  id={`btn-sleep-${mins ?? 'off'}`}
                  onClick={() => handleSelectSleepTimer(mins)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                    sleepTimerValue === mins
                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                      : isDark
                      ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300'
                      : 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {mins === null ? 'Tắt' : `${mins} phút`}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-black/10 dark:border-white/10 flex justify-end">
          <button
            id="btn-apply-voice-settings"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-colors cursor-pointer"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};
