import { TTSSettings, PlaybackPosition, Sentence, Chapter } from '../types';

export interface TTSVoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
  isVietnamese: boolean;
  engineProvider: 'samsung' | 'google' | 'microsoft' | 'apple' | 'system';
  providerLabel: string;
  isLocalService: boolean;
}

export type TTSStatus = 'idle' | 'playing' | 'paused' | 'buffering';

export interface TTSEventCallbacks {
  onStatusChange: (status: TTSStatus) => void;
  onPositionChange: (pos: PlaybackPosition) => void;
  onWordBoundary?: (charIndex: number, charLength: number) => void;
  onChapterEnd?: (chapterIndex: number) => void;
  onBookEnd?: () => void;
  onError?: (err: string) => void;
}

// Minimal valid silent WAV audio track (loopable) for mobile background media pipeline preservation
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP//AA==';

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private status: TTSStatus = 'idle';
  private callbacks: TTSEventCallbacks | null = null;

  private currentChapter: Chapter | null = null;
  private chapters: Chapter[] = [];
  private position: PlaybackPosition = { chapterIndex: 0, paragraphIndex: 0, sentenceIndex: 0 };
  private bookTitle: string = '';
  private bookAuthor: string = '';

  private settings: TTSSettings = {
    voiceUri: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    sentencePauseMs: 250,
    paragraphPauseMs: 500,
    expandAbbreviations: true,
    removeCitations: true,
  };

  private pauseTimeoutId: number | null = null;
  private keepAliveIntervalId: number | null = null;
  private sleepTimerId: number | null = null;
  private sleepTimerEndTime: number | null = null;

  // Background Audio Keep-Alive for Screen Off / Lock Screen
  private silentAudio: HTMLAudioElement | null = null;
  private wakeLockSentinel: any = null;
  private keepScreenAwakeEnabled: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }

      // Initialize silent audio loop element for mobile background playback
      try {
        const audio = new Audio(SILENT_WAV_BASE64);
        audio.loop = true;
        audio.volume = 0.01;
        this.silentAudio = audio;
      } catch (e) {
        console.warn('Could not initialize silent audio keep-alive', e);
      }

      // Handle visibility changes (screen turn on/off or tab switch)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.keepScreenAwakeEnabled && this.status === 'playing') {
          this.requestWakeLock();
        }
      });
    }
  }

  public setCallbacks(callbacks: TTSEventCallbacks) {
    this.callbacks = callbacks;
  }

  public updateSettings(settings: Partial<TTSSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  public getSettings(): TTSSettings {
    return { ...this.settings };
  }

  public setKeepScreenAwake(enabled: boolean) {
    this.keepScreenAwakeEnabled = enabled;
    if (enabled && this.status === 'playing') {
      this.requestWakeLock();
    } else {
      this.releaseWakeLock();
    }
  }

  public isKeepScreenAwake(): boolean {
    return this.keepScreenAwakeEnabled;
  }

  public async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      } catch (err) {
        // Can fail if battery saver is active or tab not active
      }
    }
  }

  public releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
    }
  }

  public isSamsungDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('samsung') || ua.includes('sm-') || ua.includes('samsungbrowser');
  }

  public getVoices(): Promise<TTSVoiceInfo[]> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve([]);
        return;
      }

      const isSamsung = this.isSamsungDevice();

      const mapVoices = () => {
        const rawVoices = this.synth!.getVoices();
        const mapped: TTSVoiceInfo[] = rawVoices.map((v) => {
          const lowerName = v.name.toLowerCase();
          const lowerUri = v.voiceURI.toLowerCase();
          const lowerLang = v.lang.toLowerCase();

          const isVi =
            lowerLang.startsWith('vi') ||
            lowerName.includes('vietnam') ||
            lowerName.includes('tiếng việt') ||
            lowerName.includes('hoaimy') ||
            lowerName.includes('namminh');

          let engineProvider: TTSVoiceInfo['engineProvider'] = 'system';
          let providerLabel = 'Hệ thống';

          if (lowerName.includes('samsung') || lowerUri.includes('samsung') || lowerUri.includes('smt')) {
            engineProvider = 'samsung';
            providerLabel = 'Samsung TTS (Cục bộ)';
          } else if (lowerName.includes('google') || lowerUri.includes('google')) {
            engineProvider = 'google';
            providerLabel = 'Google Speech';
          } else if (lowerName.includes('microsoft') || lowerUri.includes('microsoft') || lowerName.includes('edge')) {
            engineProvider = 'microsoft';
            providerLabel = 'Microsoft Neural';
          } else if (lowerName.includes('siri') || lowerName.includes('apple') || lowerUri.includes('com.apple')) {
            engineProvider = 'apple';
            providerLabel = 'Apple Siri';
          }

          const isLocal = v.localService !== undefined ? v.localService : true;

          return {
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI,
            default: v.default,
            isVietnamese: isVi,
            engineProvider,
            providerLabel,
            isLocalService: isLocal,
          };
        });

        // Priority sorting:
        // If on Samsung phone, prioritize Vietnamese Samsung voices first!
        // Then other Vietnamese voices (Google, Microsoft, Siri)
        // Then remaining system voices
        mapped.sort((a, b) => {
          if (a.isVietnamese && !b.isVietnamese) return -1;
          if (!a.isVietnamese && b.isVietnamese) return 1;

          if (a.isVietnamese && b.isVietnamese) {
            if (isSamsung) {
              if (a.engineProvider === 'samsung' && b.engineProvider !== 'samsung') return -1;
              if (a.engineProvider !== 'samsung' && b.engineProvider === 'samsung') return 1;
            }
            if (a.engineProvider === 'google' && b.engineProvider === 'system') return -1;
            if (a.engineProvider === 'system' && b.engineProvider === 'google') return 1;
          }

          return a.name.localeCompare(b.name);
        });

        return mapped;
      };

      const voices = mapVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        const handler = () => {
          this.synth?.removeEventListener('voiceschanged', handler);
          resolve(mapVoices());
        };
        this.synth.addEventListener('voiceschanged', handler);
        setTimeout(() => {
          this.synth?.removeEventListener('voiceschanged', handler);
          resolve(mapVoices());
        }, 1500);
      }
    });
  }

  public loadBookChapters(
    chapters: Chapter[],
    initialPosition: PlaybackPosition = { chapterIndex: 0, paragraphIndex: 0, sentenceIndex: 0 },
    bookTitle: string = '',
    bookAuthor: string = ''
  ) {
    this.stop();
    this.chapters = chapters;
    this.position = { ...initialPosition };
    this.currentChapter = chapters[initialPosition.chapterIndex] || null;
    this.bookTitle = bookTitle;
    this.bookAuthor = bookAuthor;
    this.callbacks?.onPositionChange(this.position);
    this.syncMediaSession();
  }

  public setPosition(pos: PlaybackPosition, startPlayingImmediately = false) {
    const wasPlaying = this.status === 'playing';
    this.clearPauseTimeout();
    if (this.synth) {
      this.synth.cancel();
    }

    this.position = { ...pos };
    this.currentChapter = this.chapters[pos.chapterIndex] || null;
    this.callbacks?.onPositionChange(this.position);
    this.syncMediaSession();

    if (startPlayingImmediately || wasPlaying) {
      this.speakCurrent();
    }
  }

  public play() {
    if (!this.synth) {
      this.callbacks?.onError?.('Trình duyệt của bạn không hỗ trợ Speech Synthesis (Web Speech API).');
      return;
    }

    // Activate mobile background audio pipeline
    this.startBackgroundAudioPipe();

    if (this.keepScreenAwakeEnabled) {
      this.requestWakeLock();
    }

    if (this.status === 'paused') {
      this.synth.resume();
      this.status = 'playing';
      this.callbacks?.onStatusChange('playing');
      this.startKeepAlive();
      this.syncMediaSession();
      return;
    }

    this.speakCurrent();
  }

  public pause() {
    this.clearPauseTimeout();
    this.stopKeepAlive();
    this.stopBackgroundAudioPipe();
    this.releaseWakeLock();

    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
    this.status = 'paused';
    this.callbacks?.onStatusChange('paused');
    this.syncMediaSession();
  }

  public stop() {
    this.clearPauseTimeout();
    this.stopKeepAlive();
    this.stopBackgroundAudioPipe();
    this.releaseWakeLock();

    if (this.synth) {
      this.synth.cancel();
    }
    this.status = 'idle';
    this.currentUtterance = null;
    this.callbacks?.onStatusChange('idle');
    this.syncMediaSession();
  }

  public nextSentence() {
    this.advancePosition(false);
  }

  public prevSentence() {
    if (this.position.sentenceIndex > 0) {
      this.setPosition(
        {
          ...this.position,
          sentenceIndex: this.position.sentenceIndex - 1,
        },
        this.status === 'playing'
      );
    } else if (this.position.paragraphIndex > 0) {
      const prevPIdx = this.position.paragraphIndex - 1;
      const prevPara = this.currentChapter?.paragraphs[prevPIdx];
      const sIdx = Math.max(0, (prevPara?.sentences.length || 1) - 1);
      this.setPosition(
        {
          chapterIndex: this.position.chapterIndex,
          paragraphIndex: prevPIdx,
          sentenceIndex: sIdx,
        },
        this.status === 'playing'
      );
    } else if (this.position.chapterIndex > 0) {
      const prevCIdx = this.position.chapterIndex - 1;
      const prevChap = this.chapters[prevCIdx];
      const pIdx = Math.max(0, prevChap.paragraphs.length - 1);
      const sIdx = Math.max(0, (prevChap.paragraphs[pIdx]?.sentences.length || 1) - 1);
      this.setPosition(
        {
          chapterIndex: prevCIdx,
          paragraphIndex: pIdx,
          sentenceIndex: sIdx,
        },
        this.status === 'playing'
      );
    }
  }

  public nextParagraph() {
    if (!this.currentChapter) return;
    if (this.position.paragraphIndex < this.currentChapter.paragraphs.length - 1) {
      this.setPosition(
        {
          chapterIndex: this.position.chapterIndex,
          paragraphIndex: this.position.paragraphIndex + 1,
          sentenceIndex: 0,
        },
        this.status === 'playing'
      );
    } else {
      this.nextChapter();
    }
  }

  public prevParagraph() {
    if (this.position.paragraphIndex > 0) {
      this.setPosition(
        {
          chapterIndex: this.position.chapterIndex,
          paragraphIndex: this.position.paragraphIndex - 1,
          sentenceIndex: 0,
        },
        this.status === 'playing'
      );
    } else if (this.position.chapterIndex > 0) {
      this.prevChapter();
    }
  }

  public nextChapter() {
    if (this.position.chapterIndex < this.chapters.length - 1) {
      this.setPosition(
        {
          chapterIndex: this.position.chapterIndex + 1,
          paragraphIndex: 0,
          sentenceIndex: 0,
        },
        this.status === 'playing'
      );
    } else {
      this.stop();
      this.callbacks?.onBookEnd?.();
    }
  }

  public prevChapter() {
    if (this.position.chapterIndex > 0) {
      this.setPosition(
        {
          chapterIndex: this.position.chapterIndex - 1,
          paragraphIndex: 0,
          sentenceIndex: 0,
        },
        this.status === 'playing'
      );
    }
  }

  // Sleep timer helpers
  public setSleepTimer(minutes: number | null) {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
      this.sleepTimerEndTime = null;
    }

    if (minutes && minutes > 0) {
      this.sleepTimerEndTime = Date.now() + minutes * 60 * 1000;
      this.sleepTimerId = window.setTimeout(() => {
        this.pause();
        this.sleepTimerId = null;
        this.sleepTimerEndTime = null;
      }, minutes * 60 * 1000);
    }
  }

  public getSleepTimerRemainingSeconds(): number | null {
    if (!this.sleepTimerEndTime) return null;
    const remainingMs = this.sleepTimerEndTime - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : null;
  }

  private getCurrentSentence(): Sentence | null {
    if (!this.currentChapter) return null;
    const paragraph = this.currentChapter.paragraphs[this.position.paragraphIndex];
    if (!paragraph) return null;
    return paragraph.sentences[this.position.sentenceIndex] || null;
  }

  private speakCurrent() {
    if (!this.synth) return;

    this.clearPauseTimeout();
    this.synth.cancel();

    const sentence = this.getCurrentSentence();
    if (!sentence) {
      this.advancePosition(true);
      return;
    }

    const textToSpeak = sentence.cleanText || sentence.text;
    if (!textToSpeak.trim()) {
      this.advancePosition(true);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;

    const allVoices = this.synth.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (this.settings.voiceUri) {
      selectedVoice = allVoices.find((v) => v.voiceURI === this.settings.voiceUri);
    }

    if (!selectedVoice) {
      selectedVoice = allVoices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('vi') ||
          v.name.toLowerCase().includes('vietnam') ||
          v.name.toLowerCase().includes('tiếng việt') ||
          v.name.toLowerCase().includes('hoaimy') ||
          v.name.toLowerCase().includes('namminh')
      );
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'vi-VN';
    }

    utterance.onstart = () => {
      this.status = 'playing';
      this.callbacks?.onStatusChange('playing');
      this.callbacks?.onPositionChange(this.position);
      this.startKeepAlive();
      this.syncMediaSession();
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word' && this.callbacks?.onWordBoundary) {
        this.callbacks.onWordBoundary(event.charIndex, event.charLength || 0);
      }
    };

    utterance.onend = () => {
      this.handleUtteranceEnd();
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.warn('TTS utterance error:', event.error);
        this.handleUtteranceEnd();
      }
    };

    this.currentUtterance = utterance;
    this.status = 'playing';
    this.callbacks?.onStatusChange('playing');
    this.synth.speak(utterance);
    this.syncMediaSession();
  }

  private handleUtteranceEnd() {
    if (this.status !== 'playing') return;

    const isLastSentenceInParagraph =
      this.currentChapter &&
      this.currentChapter.paragraphs[this.position.paragraphIndex] &&
      this.position.sentenceIndex >=
        this.currentChapter.paragraphs[this.position.paragraphIndex].sentences.length - 1;

    const pauseDuration = isLastSentenceInParagraph
      ? this.settings.paragraphPauseMs
      : this.settings.sentencePauseMs;

    this.pauseTimeoutId = window.setTimeout(() => {
      this.advancePosition(true);
    }, pauseDuration);
  }

  private advancePosition(continuePlaying: boolean) {
    if (!this.currentChapter) return;

    const curPara = this.currentChapter.paragraphs[this.position.paragraphIndex];
    if (curPara && this.position.sentenceIndex < curPara.sentences.length - 1) {
      this.position.sentenceIndex++;
      this.callbacks?.onPositionChange(this.position);
      this.syncMediaSession();
      if (continuePlaying) {
        this.speakCurrent();
      }
    } else if (this.position.paragraphIndex < this.currentChapter.paragraphs.length - 1) {
      this.position.paragraphIndex++;
      this.position.sentenceIndex = 0;
      this.callbacks?.onPositionChange(this.position);
      this.syncMediaSession();
      if (continuePlaying) {
        this.speakCurrent();
      }
    } else if (this.position.chapterIndex < this.chapters.length - 1) {
      this.callbacks?.onChapterEnd?.(this.position.chapterIndex);
      this.position.chapterIndex++;
      this.position.paragraphIndex = 0;
      this.position.sentenceIndex = 0;
      this.currentChapter = this.chapters[this.position.chapterIndex];
      this.callbacks?.onPositionChange(this.position);
      this.syncMediaSession();
      if (continuePlaying) {
        this.speakCurrent();
      }
    } else {
      this.stop();
      this.callbacks?.onBookEnd?.();
    }
  }

  private clearPauseTimeout() {
    if (this.pauseTimeoutId) {
      clearTimeout(this.pauseTimeoutId);
      this.pauseTimeoutId = null;
    }
  }

  // Audio Pipeline Bridge: plays silent track so OS doesn't kill audio when screen is turned off
  private startBackgroundAudioPipe() {
    if (this.silentAudio) {
      this.silentAudio.play().catch(() => {});
    }
  }

  private stopBackgroundAudioPipe() {
    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
      } catch {}
    }
  }

  // MediaSession API: Lock screen widgets & remote earphone buttons
  private syncMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const curSentence = this.getCurrentSentence();
      const chapterTitle = this.currentChapter?.title || 'Ebook Reader';
      const bookTitle = this.bookTitle || 'Sách Nói TTS';
      const sentenceText = curSentence?.text ? `"${curSentence.text.substring(0, 80)}..."` : chapterTitle;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: chapterTitle,
        artist: bookTitle,
        album: this.bookAuthor ? `${this.bookAuthor} • ${sentenceText}` : sentenceText,
        artwork: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = this.status === 'playing' ? 'playing' : 'paused';

      // Attach media keys
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prevSentence());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.nextSentence());
    } catch (e) {
      // Ignore unsupported browsers
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveIntervalId = window.setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused && this.status === 'playing') {
        this.synth.pause();
        this.synth.resume();
      }
      // Re-trigger silent audio pipe if stopped
      if (this.silentAudio && this.silentAudio.paused && this.status === 'playing') {
        this.silentAudio.play().catch(() => {});
      }
    }, 10000);
  }

  private stopKeepAlive() {
    if (this.keepAliveIntervalId) {
      clearInterval(this.keepAliveIntervalId);
      this.keepAliveIntervalId = null;
    }
  }
}

export const ttsEngine = new TTSService();
