import { Song } from '../types/music';

export class AudioEngine {
  private audioElement: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private isPlaying: boolean = false;
  private volume: number = 1.0;
  private isMuted: boolean = false;
  private playbackRate: number = 1.0;
  private crossfadeDuration: number = 3; // in seconds (0 = off)
  private currentUrl: string | null = null;
  private isWebAudioConnected: boolean = false;
  private isMobileDevice: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent || ''
      );
      this.initAudioElement();
    }
  }

  private initAudioElement(): HTMLAudioElement {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
      // Do not set crossOrigin unless needed, to prevent strict CORS blocks or decoder pops on Android
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
      this.audioElement.playbackRate = this.playbackRate;

      // Handle errors gracefully without clicking
      this.audioElement.addEventListener('error', (e) => {
        console.warn('AudioElement playback notice:', e);
      });
    }
    return this.audioElement;
  }

  // Safe lazy initializer for Visualizer Analyser (desktop only, to avoid Android AAudio buffer underruns)
  private initAnalyserSafe() {
    if (this.isMobileDevice) {
      // Android / iOS hardware decoders pop/click heavily when HTMLAudioElement is tied to Web Audio context
      return;
    }
    if (this.isWebAudioConnected) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      if (this.audioElement) {
        this.audioElement.crossOrigin = 'anonymous';
        this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
        this.audioSourceNode.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.isWebAudioConnected = true;
      }
    } catch (e) {
      // Fallback cleanly to direct HTML5 Audio
      this.isWebAudioConnected = false;
    }
  }

  public static async calculateDurationFromUrl(url: string): Promise<number> {
    return new Promise((resolve) => {
      if (!url || !url.trim()) {
        resolve(210);
        return;
      }
      const probe = new Audio();
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => {
        if (probe.duration && isFinite(probe.duration) && probe.duration > 0) {
          resolve(Math.round(probe.duration));
        } else {
          resolve(210);
        }
      };
      probe.onerror = () => {
        resolve(210);
      };
      probe.src = url;
    });
  }

  public calculateDurationFromUrl(url: string): Promise<number> {
    return AudioEngine.calculateDurationFromUrl(url);
  }

  public playUrl(url?: string, onDurationLoaded?: (dur: number) => void) {
    if (!url || !url.trim()) {
      this.pause();
      this.currentUrl = null;
      return;
    }

    const audio = this.initAudioElement();
    const isDifferentTrack = this.currentUrl !== url;
    this.currentUrl = url;
    this.isPlaying = true;

    // Wake context if available
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const targetVolume = this.isMuted ? 0 : this.volume;

    if (isDifferentTrack) {
      // Soft fade-out current track to eliminate "lộp bộp" (digital click/pop)
      const currentVol = audio.volume;
      if (!audio.paused && currentVol > 0.05 && this.crossfadeDuration > 0) {
        // Quick 50ms smooth fade down before switching URL
        try {
          audio.volume = Math.max(0, currentVol * 0.3);
        } catch (e) {}
      }

      audio.src = url;
      audio.currentTime = 0;
      audio.playbackRate = this.playbackRate;
      audio.defaultPlaybackRate = this.playbackRate;

      // Ensure full uncompromised dynamic range volume (100% full quality, no artificial 0.8 cut)
      audio.volume = targetVolume;

      audio
        .play()
        .then(() => {
          this.isPlaying = true;
        })
        .catch((err) => {
          console.warn('Playback play request notice:', err);
          this.isPlaying = false;
        });
    } else {
      audio.playbackRate = this.playbackRate;
      audio.defaultPlaybackRate = this.playbackRate;
      audio.volume = targetVolume;
      audio
        .play()
        .then(() => {
          this.isPlaying = true;
        })
        .catch(() => {
          this.isPlaying = false;
        });
    }

    audio.onloadedmetadata = () => {
      if (onDurationLoaded && audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        onDurationLoaded(Math.round(audio.duration));
      }
    };
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      // Smooth micro-fade to avoid abrupt cutoff clicks
      const curVol = this.audioElement.volume;
      if (curVol > 0.1) {
        try {
          this.audioElement.volume = curVol * 0.5;
        } catch (e) {}
      }
      setTimeout(() => {
        if (this.audioElement && !this.isPlaying) {
          this.audioElement.pause();
          this.audioElement.volume = this.isMuted ? 0 : this.volume;
        }
      }, 30);
    }
  }

  public seek(seconds: number) {
    if (this.audioElement && !isNaN(seconds) && isFinite(seconds)) {
      try {
        const clamped = Math.max(0, seconds);
        this.audioElement.currentTime = clamped;
      } catch (e) {
        console.warn('Seek notice:', e);
      }
    }
  }

  public getCurrentTime(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.setVolume(this.volume);
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(0.25, Math.min(3.0, rate));
    if (this.audioElement) {
      this.audioElement.playbackRate = this.playbackRate;
    }
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  public setCrossfadeDuration(seconds: number) {
    this.crossfadeDuration = Math.max(0, Math.min(10, seconds));
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }

  public updateMediaSession(
    song: Song | null,
    isPlaying: boolean,
    actions: {
      onPlay: () => void;
      onPause: () => void;
      onPrev: () => void;
      onNext: () => void;
      onSeek: (seconds: number) => void;
    }
  ) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    if (!song) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    try {
      const defaultArtwork = 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png';
      const artworkSrc = song.coverImage || defaultArtwork;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artists,
        album: song.album || 'XuanKen Music',
        artwork: [
          { src: artworkSrc, sizes: '96x96', type: 'image/png' },
          { src: artworkSrc, sizes: '128x128', type: 'image/png' },
          { src: artworkSrc, sizes: '192x192', type: 'image/png' },
          { src: artworkSrc, sizes: '256x256', type: 'image/png' },
          { src: artworkSrc, sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => actions.onPlay());
      navigator.mediaSession.setActionHandler('pause', () => actions.onPause());
      navigator.mediaSession.setActionHandler('previoustrack', () => actions.onPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => actions.onNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          actions.onSeek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        const current = this.audioElement?.currentTime || 0;
        actions.onSeek(Math.max(0, current - offset));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        const current = this.audioElement?.currentTime || 0;
        actions.onSeek(current + offset);
      });
    } catch (e) {
      console.warn('MediaSession API notice:', e);
    }
  }

  public updatePositionState(position: number, duration: number, rate: number = 1.0) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) {
      return;
    }
    if (!isFinite(duration) || duration <= 0 || !isFinite(position) || position < 0) {
      return;
    }
    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(1, duration),
        playbackRate: Math.max(0.25, Math.min(3.0, rate)),
        position: Math.min(position, duration),
      });
    } catch (e) {}
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      this.initAnalyserSafe();
    }
    if (!this.analyser) {
      return new Uint8Array(16);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

export const audioEngine = new AudioEngine();
