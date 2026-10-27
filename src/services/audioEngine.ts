export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private step: number = 0;
  private volume: number = 1.0;
  private isMuted: boolean = false;
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
        resolve(180); // default fallback
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

  // Instance method for convenience
  public calculateDurationFromUrl(url: string): Promise<number> {
    return AudioEngine.calculateDurationFromUrl(url);
  }

  public playUrl(url?: string, onDurationLoaded?: (dur: number) => void) {
    this.initContext();
    this.isPlaying = true;

    // Stop synthetic timer if running
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    if (url && url.trim()) {
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';

        try {
          if (this.ctx && this.masterGain) {
            this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
            this.audioSourceNode.connect(this.masterGain);
          }
        } catch (e) {
          // If already connected or CORS limitation, direct HTML5 audio works
        }
      }

      if (this.audioElement.src !== url) {
        this.audioElement.src = url;
        this.audioElement.currentTime = 0;
      }

      this.audioElement.volume = this.isMuted ? 0 : this.volume;

      this.audioElement.onloadedmetadata = () => {
        if (onDurationLoaded && this.audioElement?.duration) {
          onDurationLoaded(Math.round(this.audioElement.duration));
        }
      };

      this.audioElement
        .play()
        .catch((e) => {
          console.warn('HTML5 audio play notice, running musical fallback:', e);
          this.playSynthetic();
        });
    } else {
      if (this.audioElement) {
        this.audioElement.pause();
      }
      this.playSynthetic();
    }
  }

  private playSynthetic() {
    this.initContext();
    this.isPlaying = true;

    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }

    this.scheduleNotes();
    this.timerId = window.setInterval(() => {
      if (this.isPlaying) {
        this.scheduleNotes();
      }
    }, 280);
  }

  private scheduleNotes() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = 261.63;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const semitone = Math.pow(2, 1 / 12);
    const noteFreq = baseFreq * Math.pow(semitone, scale[this.step % scale.length]);

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(noteFreq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.exponentialRampToValueAtTime(0.1, now + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);

    this.step++;
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public seek(seconds: number) {
    if (this.audioElement && !isNaN(seconds)) {
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
