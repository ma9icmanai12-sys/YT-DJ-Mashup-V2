export interface HotCue {
  id: number;
  time: number; // in seconds
  label: string;
  color: string;
}

export interface DeckTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  bpm: number;
  key: string;
  genre?: string;
  suggestedCue?: number;
  durationFormatted?: string;
}

export interface DeckState {
  id: 'A' | 'B';
  track: DeckTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 100
  gain: number; // -12 to +12
  pitch: number; // percentage (-8 to +8, -16 to +16, or -50 to +50)
  pitchRange: 8 | 16 | 50;
  keyLock: boolean;
  effectiveBpm: number;
  tapBpmTimes: number[];
  eq: {
    high: number; // -100 to 100
    mid: number;
    low: number;
  };
  eqKill: {
    high: boolean;
    mid: boolean;
    low: boolean;
  };
  filter: number; // -100 (LPF) to 100 (HPF), 0 is flat
  hotCues: HotCue[];
  loop: {
    active: boolean;
    lengthBeats: number;
    startTime: number | null;
  };
  pfl: boolean; // Headphone cue
  isScratching: boolean;
  vinylAngle: number;
}

export type CrossfaderCurve = 'smooth' | 'linear' | 'cut';

export interface MashupPreset {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  compatibilityScore: number; // percentage match
  keyMatch: string;
  recommendedBpm: number;
  deckA: DeckTrack;
  deckB: DeckTrack;
}

export interface MixHistoryEvent {
  timestamp: number;
  action: string;
  deck?: 'A' | 'B';
  details?: string;
}
