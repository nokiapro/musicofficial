import { Song } from '../types/music';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying: boolean = false;
  private volume: number = 1.0;
  private isMuted: boolean = false;
  private playbackRate: number = 1.0;
  private crossfadeDuration: number = 3; // in seconds (0 = off)
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Calculate audio duration from URL automatically
  public static async calculateDurationFromUrl(url: string): Promise<number> {
    return new Promise((resolve) => {
      if (!url || !url.trim()) {
        resolve(180);
        return;
      }
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          resolve(Math.round(audio.duration));
        } else {
          resolve(180);
        }
      };
      audio.onerror = () => {
        resolve(180);
      };
      audio.src = url;
    });
  }

  public calculateDurationFromUrl(url: string): Promise<number> {
    return AudioEngine.calculateDurationFromUrl(url);
  }

  private currentUrl: string | null = null;

  public playUrl(url?: string, onDurationLoaded?: (dur: number) => void) {
    if (!url || !url.trim()) {
      if (this.audioElement) {
        this.audioElement.pause();
      }
      this.isPlaying = false;
      this.currentUrl = null;
      return;
    }

    this.initContext();
    this.isPlaying = true;

    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      try {
        if (this.ctx && this.masterGain) {
          this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
          this.audioSourceNode.connect(this.masterGain);
        }
      } catch (e) {
        // Direct HTML5 audio works
      }
    }

    const isDifferentTrack = this.currentUrl !== url;
    this.currentUrl = url;

    // Crossfade transition if changing tracks and crossfade is enabled
    if (isDifferentTrack && this.crossfadeDuration > 0 && this.masterGain && this.ctx && this.isPlaying) {
      const now = this.ctx.currentTime;
      const targetGain = this.isMuted ? 0 : this.volume * 0.8;
      // Quick gentle fade out
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.01, now + 0.3);

      setTimeout(() => {
        if (!this.audioElement) return;
        this.audioElement.src = url;
        this.audioElement.currentTime = 0;
        this.audioElement.playbackRate = this.playbackRate;
        this.audioElement.defaultPlaybackRate = this.playbackRate;
        this.audioElement
          .play()
          .then(() => {
            if (this.masterGain && this.ctx) {
              const fadeInNow = this.ctx.currentTime;
              this.masterGain.gain.setValueAtTime(0.01, fadeInNow);
              this.masterGain.gain.linearRampToValueAtTime(targetGain, fadeInNow + Math.min(this.crossfadeDuration, 2.5));
            }
          })
          .catch((e) => {
            console.warn('Crossfade play notice:', e);
            this.isPlaying = false;
          });
      }, 300);
    } else {
      if (isDifferentTrack) {
        this.audioElement.src = url;
        this.audioElement.currentTime = 0;
      }

      this.audioElement.playbackRate = this.playbackRate;
      this.audioElement.defaultPlaybackRate = this.playbackRate;
      this.audioElement.volume = this.isMuted ? 0 : this.volume;

      if (this.masterGain && this.ctx) {
        const targetGain = this.isMuted ? 0 : this.volume * 0.8;
        this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      }

      this.audioElement
        .play()
        .catch((e) => {
          // Graceful pause if autoplay policy blocks or network issue
          this.isPlaying = false;
        });
    }

    this.audioElement.onloadedmetadata = () => {
      if (onDurationLoaded && this.audioElement?.duration && isFinite(this.audioElement.duration)) {
        onDurationLoaded(Math.round(this.audioElement.duration));
      }
    };
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      // Gentle fade out if crossfade enabled
      if (this.crossfadeDuration > 0 && this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        setTimeout(() => {
          this.audioElement?.pause();
        }, 250);
      } else {
        this.audioElement.pause();
      }
    }
  }

  public seek(seconds: number) {
    if (this.audioElement && !isNaN(seconds) && isFinite(seconds)) {
      try {
        this.audioElement.currentTime = seconds;
      } catch (e) {}
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume * 0.8;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.setVolume(this.volume);
  }

  // Playback Speed (0.75x, 1.0x, 1.25x, 1.5x, 2.0x)
  public setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(0.25, Math.min(3.0, rate));
    if (this.audioElement) {
      this.audioElement.playbackRate = this.playbackRate;
    }
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  // Crossfade duration
  public setCrossfadeDuration(seconds: number) {
    this.crossfadeDuration = Math.max(0, Math.min(10, seconds));
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }

  // Media Session API for Lockscreen & System Notification Controls
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

      // Set action handlers
      navigator.mediaSession.setActionHandler('play', () => {
        actions.onPlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        actions.onPause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        actions.onPrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        actions.onNext();
      });
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

  // Live Position scrubber state for Lockscreen & System Notification
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
    } catch (e) {
      // Ignore if browser restricts rapid positionState updates
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(16);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}

export const audioEngine = new AudioEngine();
