// Sound Manager for DECEIT Online Web

export type SoundEffect =
  | 'click'
  | 'flip'
  | 'tick'
  | 'bell'
  | 'magic'
  | 'impact'
  | 'rooster'
  | 'fanfare'
  | 'votingCountDown'
  | 'nightStart';

export type MusicTrack = 'home' | 'reveal' | 'night' | 'discussion' | 'victory' | 'none';

class SoundManager {
  private static instance: SoundManager;

  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private bgmAudio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack = 'none';
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isUserInteracted: boolean = false;

  private constructor() {
    // Enable audio context on first user click to bypass browser autoplay policies
    if (typeof window !== 'undefined') {
      const handleFirstInteraction = () => {
        this.isUserInteracted = true;
        if (this.bgmAudio && this.bgmAudio.paused && !this.isMusicMuted && !this.isMuted) {
          this.bgmAudio.play().catch(() => {});
        }
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };
      window.addEventListener('click', handleFirstInteraction);
      window.addEventListener('keydown', handleFirstInteraction);
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  // --- Sound Effects (SFX) ---
  public playSfx(effect: SoundEffect, volume: number = 0.6) {
    if (this.isMuted) return;

    const soundPathMap: Record<SoundEffect, string> = {
      click: '/sounds/click.mp3',
      flip: '/sounds/flip.mp3',
      tick: '/sounds/tick.mp3',
      bell: '/sounds/bell.mp3',
      magic: '/sounds/magic.mp3',
      impact: '/sounds/impact.mp3',
      rooster: '/sounds/rooster.mp3',
      fanfare: '/sounds/fanfare.mp3',
      votingCountDown: '/sounds/votingCountDown.mp3',
      nightStart: '/sounds/ar_night_start.mp3',
    };

    const path = soundPathMap[effect];
    if (!path) return;

    try {
      // Create new Audio instance for overlapping SFX
      const audio = new Audio(path);
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('[SoundManager] Failed to play SFX:', effect, e);
    }
  }

  // --- Background Music (BGM) ---
  public playMusic(track: MusicTrack, volume: number = 0.3) {
    if (this.currentTrack === track && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }

    const musicPathMap: Record<MusicTrack, string | null> = {
      home: '/sounds/homeScreen.mp3',
      reveal: '/sounds/distribution.mp3',
      night: '/sounds/night.mp3',
      discussion: '/sounds/voting_tension.mp3',
      victory: '/sounds/victory.mp3',
      none: null,
    };

    const path = musicPathMap[track];
    this.currentTrack = track;

    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }

    if (!path || this.isMusicMuted || this.isMuted) return;

    try {
      this.bgmAudio = new Audio(path);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = volume;

      if (this.isUserInteracted) {
        this.bgmAudio.play().catch(() => {});
      }
    } catch (e) {
      console.warn('[SoundManager] Failed to play Music:', track, e);
    }
  }

  public stopMusic() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }
    this.currentTrack = 'none';
  }

  // --- Mute / Unmute Controls ---
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
    } else if (this.currentTrack !== 'none') {
      const track = this.currentTrack;
      this.currentTrack = 'none';
      this.playMusic(track);
    }
    return this.isMuted;
  }

  public toggleMusic(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      if (this.bgmAudio) this.bgmAudio.pause();
    } else if (this.currentTrack !== 'none') {
      const track = this.currentTrack;
      this.currentTrack = 'none';
      this.playMusic(track);
    }
    return this.isMusicMuted;
  }

  public getMutedState(): { isMuted: boolean; isMusicMuted: boolean } {
    return { isMuted: this.isMuted, isMusicMuted: this.isMusicMuted };
  }
}

export const soundManager = SoundManager.getInstance();
