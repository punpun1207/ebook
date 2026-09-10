import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  Clock,
  Gauge,
  Sliders,
  ChevronUp,
  ChevronDown,
  Navigation2,
} from 'lucide-react';
import { PlaybackPosition, Chapter, ReaderTheme, TTSSettings } from '../types';
import { TTSStatus, TTSVoiceInfo, ttsEngine } from '../services/ttsService';

interface AudioPlayerBarProps {
  status: TTSStatus;
  position: PlaybackPosition;
  currentChapter: Chapter | null;
  totalChapters: number;
  theme: ReaderTheme;
  voices: TTSVoiceInfo[];
  settings: TTSSettings;
  onPlay: () => void;
  onPause: () => void;
  onPrevSentence: () => void;
  onNextSentence: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenVoiceSettings: () => void;
  onUpdateRate: (rate: number) => void;
  onToggleAutoScroll: () => void;
  autoScroll: boolean;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  status,
  position,
  currentChapter,
  totalChapters,
  theme,
  voices,
  settings,
  onPlay,
  onPause,
  onPrevSentence,
  onNextSentence,
  onPrevChapter,
  onNextChapter,
  onOpenVoiceSettings,
  onUpdateRate,
  onToggleAutoScroll,
  autoScroll,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);

  // Monitor sleep timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = ttsEngine.getSleepTimerRemainingSeconds();
      setSleepRemaining(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isDark = theme === 'dark' || theme === 'oled';
  const isPlaying = status === 'playing';

  // Get active sentence text
  const currentPara = currentChapter?.paragraphs[position.paragraphIndex];
  const currentSentence = currentPara?.sentences[position.sentenceIndex];
  const sentenceText = currentSentence?.text || currentPara?.rawText || 'Sẵn sàng đọc...';

  // Calculate chapter progress
  const totalSentencesInChapter =
    currentChapter?.paragraphs.reduce((sum, p) => sum + p.sentences.length, 0) || 1;
  const currentSentenceFlatIndex =
    (currentChapter?.paragraphs.slice(0, position.paragraphIndex).reduce((sum, p) => sum + p.sentences.length, 0) || 0) +
    position.sentenceIndex;
  const chapterProgressPercent = Math.min(
    100,
    Math.round(((currentSentenceFlatIndex + 1) / totalSentencesInChapter) * 100)
  );

  // Find active voice label
  const activeVoice = voices.find((v) => v.voiceURI === settings.voiceUri);
  const voiceLabel = activeVoice
    ? activeVoice.name.replace(/(Google|Microsoft|Apple)\s*/i, '').split(' - ')[0]
    : 'Giọng mặc định';

  const speeds = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const formatSleepTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="audio-player-dock"
      aria-label="Thanh phát âm thanh TTS"
      className={`fixed bottom-0 left-0 right-0 z-40 border-t transition-colors duration-200 shadow-xl ${
        isDark
          ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100 backdrop-blur-lg'
          : theme === 'sepia'
          ? 'bg-[#f4ebd9]/95 border-[#e2d4bc] text-amber-950 backdrop-blur-lg'
          : theme === 'sage'
          ? 'bg-[#ebf2ea]/95 border-[#d0ded0] text-emerald-950 backdrop-blur-lg'
          : 'bg-white/95 border-neutral-200 text-neutral-900 backdrop-blur-lg'
      }`}
    >
      {/* Chapter Progress bar */}
      <div
        className="w-full h-1 bg-black/5 dark:bg-white/5 cursor-pointer relative group"
        title={`Tiến độ chương: ${chapterProgressPercent}%`}
      >
        <div
          className="h-full bg-amber-500 transition-all duration-300 relative"
          style={{ width: `${chapterProgressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-amber-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          {/* Left section: Current sentence snippet & Voice indicator */}
          <div className="w-full sm:w-1/3 min-w-0 flex items-center gap-3">
            {/* Animated sound wave bars when playing */}
            <div className="flex items-end gap-0.5 h-5 w-4 shrink-0 justify-center">
              <span
                className={`w-1 bg-amber-500 rounded-full transition-all duration-150 ${
                  isPlaying ? 'h-5 animate-pulse' : 'h-1.5'
                }`}
              />
              <span
                className={`w-1 bg-amber-500 rounded-full transition-all duration-200 ${
                  isPlaying ? 'h-3 animate-bounce' : 'h-2'
                }`}
              />
              <span
                className={`w-1 bg-amber-500 rounded-full transition-all duration-150 ${
                  isPlaying ? 'h-4 animate-pulse' : 'h-1.5'
                }`}
              />
            </div>

            {/* Sentence ticker */}
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium line-clamp-1 italic opacity-90 select-none">
                "{sentenceText}"
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] opacity-60">
                <span className="truncate max-w-[120px] sm:max-w-[160px] font-semibold">
                  {currentChapter?.title}
                </span>
                <span>•</span>
                <span>Câu {position.sentenceIndex + 1}/{currentPara?.sentences.length || 1}</span>
                {sleepRemaining !== null && (
                  <>
                    <span>•</span>
                    <span className="text-amber-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatSleepTime(sleepRemaining)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Center section: Playback Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Skip Previous Chapter */}
            <button
              id="btn-prev-chapter"
              onClick={onPrevChapter}
              disabled={position.chapterIndex === 0}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                isDark ? 'hover:bg-neutral-800' : 'hover:bg-black/5'
              }`}
              title="Chương trước"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Skip Previous Sentence */}
            <button
              id="btn-prev-sentence"
              onClick={onPrevSentence}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-neutral-800' : 'hover:bg-black/5'
              }`}
              title="Lùi lại 1 câu"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Main Play / Pause Button */}
            <button
              id="btn-main-play-pause"
              onClick={isPlaying ? onPause : onPlay}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
              title={isPlaying ? 'Tạm dừng (Phím Space)' : 'Bắt đầu đọc (Phím Space)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Skip Next Sentence */}
            <button
              id="btn-next-sentence"
              onClick={onNextSentence}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-neutral-800' : 'hover:bg-black/5'
              }`}
              title="Chuyển sang câu tiếp theo"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Skip Next Chapter */}
            <button
              id="btn-next-chapter"
              onClick={onNextChapter}
              disabled={position.chapterIndex >= totalChapters - 1}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                isDark ? 'hover:bg-neutral-800' : 'hover:bg-black/5'
              }`}
              title="Chương kế tiếp"
            >
              <RotateCcw className="w-4 h-4 scale-x-[-1]" />
            </button>
          </div>

          {/* Right section: Speed, Voice & Smart cadence toggles */}
          <div className="w-full sm:w-1/3 flex items-center justify-end gap-2 sm:gap-2.5">
            {/* Auto-scroll toggle */}
            <button
              id="btn-toggle-autoscroll"
              onClick={onToggleAutoScroll}
              className={`p-1.5 px-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                autoScroll
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'opacity-50 hover:opacity-90'
              }`}
              title={autoScroll ? 'Tự động cuộn theo dòng đọc: BẬT' : 'Tự động cuộn: TẮT'}
            >
              <Navigation2 className={`w-3.5 h-3.5 ${autoScroll ? 'text-amber-500' : ''}`} />
              <span className="hidden md:inline">Cuộn</span>
            </button>

            {/* Speed Pill with Dropdown */}
            <div className="relative">
              <button
                id="btn-speed-selector"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                  isDark
                    ? 'border-neutral-700 hover:bg-neutral-800'
                    : 'border-neutral-300 hover:bg-black/5'
                }`}
                title="Tốc độ đọc"
              >
                <Gauge className="w-3.5 h-3.5 opacity-70" />
                <span>{settings.rate}x</span>
              </button>

              {showSpeedMenu && (
                <div
                  className={`absolute bottom-full mb-2 right-0 py-1 rounded-xl shadow-lg border text-xs z-50 flex flex-col min-w-[90px] ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
                      : 'bg-white border-neutral-200 text-neutral-900'
                  }`}
                >
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onUpdateRate(s);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-3 py-1.5 text-left font-medium hover:bg-amber-500/10 transition-colors flex items-center justify-between ${
                        settings.rate === s ? 'text-amber-500 font-bold' : ''
                      }`}
                    >
                      <span>{s}x</span>
                      {settings.rate === s && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Voice & Coherence Settings Trigger */}
            <button
              id="btn-dock-voice-settings"
              onClick={onOpenVoiceSettings}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                isDark
                  ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-200'
                  : 'border-neutral-300 hover:bg-black/5 text-neutral-800'
              }`}
              title="Mở cài đặt giọng đọc & ngắt nghỉ mạch lạc"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline truncate max-w-[100px]">{voiceLabel}</span>
              <Sliders className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
