export type SoundType = 'A' | 'B' | 'C' | 'D';

interface SoundConfig {
  volume: number;
  muted: boolean;
  currentSound: SoundType;
}

class SoundManager {
  private config: SoundConfig = {
    volume: 0.5,
    muted: false,
    currentSound: 'C',
  };

  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.config.volume;
  }

  setMuted(muted: boolean) {
    this.config.muted = muted;
  }

  isMuted(): boolean {
    return this.config.muted;
  }

  toggleMute(): boolean {
    this.config.muted = !this.config.muted;
    return this.config.muted;
  }

  setCurrentSound(sound: SoundType) {
    this.config.currentSound = sound;
  }

  getCurrentSound(): SoundType {
    return this.config.currentSound;
  }

  playPopSound() {
    if (this.config.muted) return;

    switch (this.config.currentSound) {
      case 'A':
        this.playSoundA();
        break;
      case 'B':
        this.playSoundB();
        break;
      case 'C':
        this.playSoundC();
        break;
      case 'D':
        this.playSoundD();
        break;
    }
  }

  // A音效：清脆"啪"声
  private playSoundA() {
    this.playNoiseSound({ filterFreq: 800, attack: 0.005, decay: 0.06, duration: 0.08 });
  }

  // B音效：低沉"砰"声
  private playSoundB() {
    this.playNoiseSound({ filterFreq: 400, attack: 0.008, decay: 0.1, duration: 0.12 });
  }

  // C音效：尖锐"啵"声（默认）
  private playSoundC() {
    this.playNoiseSound({ filterFreq: 1500, attack: 0.003, decay: 0.04, duration: 0.06 });
  }

  // D音效：可爱"啵"声 - 使用正弦波模拟
  private playSoundD() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // 使用正弦波产生圆润的音色
      oscillator.type = 'sine';
      // 频率快速上升然后下降，模拟可爱的"啵"声
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.03);
      oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.12);

      // 音量包络 - 圆润的起音和衰减
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.config.volume * 0.5, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      oscillator.start(now);
      oscillator.stop(now + 0.18);
    } catch (error) {
      console.warn('播放音效失败:', error);
    }
  }

  private playNoiseSound(params: {
    filterFreq: number;
    attack: number;
    decay: number;
    duration: number;
    volume?: number;
  }) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const bufferSize = ctx.sampleRate * params.duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = params.filterFreq;

      const gainNode = ctx.createGain();

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      const vol = params.volume !== undefined ? params.volume : this.config.volume * 0.8;

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(vol, now + params.attack);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + params.attack + params.decay);

      noise.start(now);
      noise.stop(now + params.duration);
    } catch (error) {
      console.warn('播放音效失败:', error);
    }
  }

  // 快门音效
  playShutterSound() {
    if (this.config.muted) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // 主快门声 - 短促的"咔嚓"
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;

      const gainNode = ctx.createGain();

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // 快速起音和衰减，模拟机械快门
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.config.volume * 0.6, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      noise.start(now);
      noise.stop(now + 0.15);

      // 第二段 - 快门回弹的轻微声音
      setTimeout(() => {
        const noise2 = ctx.createBufferSource();
        noise2.buffer = buffer;

        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'lowpass';
        filter2.frequency.value = 800;

        const gainNode2 = ctx.createGain();

        noise2.connect(filter2);
        filter2.connect(gainNode2);
        gainNode2.connect(ctx.destination);

        gainNode2.gain.setValueAtTime(0, now + 0.08);
        gainNode2.gain.linearRampToValueAtTime(this.config.volume * 0.2, now + 0.085);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise2.start(now + 0.08);
        noise2.stop(now + 0.2);
      }, 80);
    } catch (error) {
      console.warn('播放快门音效失败:', error);
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const soundManager = new SoundManager();
