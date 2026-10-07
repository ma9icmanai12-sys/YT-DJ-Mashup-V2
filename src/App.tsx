import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DeckState, DeckTrack, CrossfaderCurve, MashupPreset, MixHistoryEvent } from './types/dj';
import { POPULAR_TRACKS, MASHUP_PRESETS } from './data/presets';
import { createYTPlayer, YTPlayerWrapper } from './services/youtube';
import { audioFx } from './services/audioFx';
import { Header } from './components/Header';
import { TopMashupVideoStage } from './components/TopMashupVideoStage';
import { Deck } from './components/Deck';
import { MasterMixer } from './components/MasterMixer';
import { SamplerPads } from './components/SamplerPads';
import { VideoBlendViewer } from './components/VideoBlendViewer';
import { CrateModal } from './components/CrateModal';
import { RecordingModal } from './components/RecordingModal';
import { ShortcutsModal } from './components/ShortcutsModal';

export default function App() {
  // Preset default tracks
  const defaultTrackA = POPULAR_TRACKS[4]; // The Weeknd - Blinding Lights (171 BPM)
  const defaultTrackB = POPULAR_TRACKS[5]; // a-ha - Take On Me (168 BPM)

  // Deck A State
  const [deckA, setDeckA] = useState<DeckState>({
    id: 'A',
    track: defaultTrackA,
    isPlaying: false,
    currentTime: 0,
    duration: defaultTrackA.duration,
    volume: 85,
    gain: 0,
    pitch: 0,
    pitchRange: 8,
    keyLock: true,
    effectiveBpm: defaultTrackA.bpm,
    tapBpmTimes: [],
    eq: { high: 0, mid: 0, low: 0 },
    eqKill: { high: false, mid: false, low: false },
    filter: 0,
    hotCues: [
      { id: 1, time: 15, label: 'Drop', color: '#06b6d4' },
      { id: 2, time: 45, label: 'Chorus', color: '#f59e0b' },
    ],
    loop: { active: false, lengthBeats: 4, startTime: null },
    pfl: false,
    isScratching: false,
    vinylAngle: 0,
  });

  // Deck B State
  const [deckB, setDeckB] = useState<DeckState>({
    id: 'B',
    track: defaultTrackB,
    isPlaying: false,
    currentTime: 0,
    duration: defaultTrackB.duration,
    volume: 85,
    gain: 0,
    pitch: 0,
    pitchRange: 8,
    keyLock: true,
    effectiveBpm: defaultTrackB.bpm,
    tapBpmTimes: [],
    eq: { high: 0, mid: 0, low: 0 },
    eqKill: { high: false, mid: false, low: false },
    filter: 0,
    hotCues: [
      { id: 1, time: 20, label: 'Intro Synth', color: '#10b981' },
      { id: 2, time: 55, label: 'Vocals', color: '#ec4899' },
    ],
    loop: { active: false, lengthBeats: 4, startTime: null },
    pfl: false,
    isScratching: false,
    vinylAngle: 0,
  });

  // Master Mixer State
  const [masterVolume, setMasterVolume] = useState<number>(90);
  const [crossfader, setCrossfader] = useState<number>(0); // -1 (Deck A) to +1 (Deck B)
  const [crossfaderCurve, setCrossfaderCurve] = useState<CrossfaderCurve>('smooth');
  const [isAutoTransitioning, setIsAutoTransitioning] = useState<boolean>(false);
  const [autoTransitionProgress, setAutoTransitionProgress] = useState<number>(0);

  // App Display & Navigation State
  const [displayMode, setDisplayMode] = useState<'dual' | 'blend' | 'audio-only'>('dual');
  const [isCrateModalOpen, setIsCrateModalOpen] = useState<boolean>(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Mix Session Recorder State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mixEvents, setMixEvents] = useState<MixHistoryEvent[]>([]);
  const [customTracks, setCustomTracks] = useState<DeckTrack[]>([]);

  // YouTube Player References
  const playerARef = useRef<YTPlayerWrapper | null>(null);
  const playerBRef = useRef<YTPlayerWrapper | null>(null);

  // Cue point backup reference for CDJ Cue behavior
  const cuePointARef = useRef<number>(15);
  const cuePointBRef = useRef<number>(20);

  // Helper to log actions when recording
  const logMixAction = useCallback((action: string, deck?: 'A' | 'B', details?: string) => {
    if (!isRecording) return;
    setMixEvents(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        action,
        deck,
        details,
      },
    ]);
  }, [isRecording]);

  // Calculate and apply physical output volumes to YouTube players
  useEffect(() => {
    // Crossfader curves:
    // pos ranges from 0 (Deck A full) to 1 (Deck B full)
    const pos = (crossfader + 1) / 2;
    let cfWeightA = 1;
    let cfWeightB = 1;

    if (crossfaderCurve === 'smooth') {
      // Equal-power constant loudness curve
      cfWeightA = Math.cos(pos * (Math.PI / 2));
      cfWeightB = Math.sin(pos * (Math.PI / 2));
    } else if (crossfaderCurve === 'linear') {
      cfWeightA = 1 - pos;
      cfWeightB = pos;
    } else if (crossfaderCurve === 'cut') {
      // Scratch cut curve: instant full level unless slammed all the way
      cfWeightA = pos > 0.95 ? 0 : 1;
      cfWeightB = pos < 0.05 ? 0 : 1;
    }

    // EQ Kill and channel volume adjustments
    const eqAttenA = (deckA.eqKill.high ? 0.3 : 1) * (deckA.eqKill.mid ? 0.3 : 1) * (deckA.eqKill.low ? 0.3 : 1);
    const eqAttenB = (deckB.eqKill.high ? 0.3 : 1) * (deckB.eqKill.mid ? 0.3 : 1) * (deckB.eqKill.low ? 0.3 : 1);

    const masterFactor = masterVolume / 100;
    const finalVolA = Math.round((deckA.volume / 100) * cfWeightA * eqAttenA * masterFactor * 100);
    const finalVolB = Math.round((deckB.volume / 100) * cfWeightB * eqAttenB * masterFactor * 100);

    if (playerARef.current) {
      playerARef.current.setVolume(finalVolA);
    }
    if (playerBRef.current) {
      playerBRef.current.setVolume(finalVolB);
    }
  }, [
    crossfader,
    crossfaderCurve,
    deckA.volume,
    deckB.volume,
    deckA.eqKill,
    deckB.eqKill,
    masterVolume,
  ]);

  // Initialize YouTube Players when mounted
  useEffect(() => {
    let mounted = true;

    const initPlayers = async () => {
      try {
        // Player A
        if (!playerARef.current && deckA.track) {
          await createYTPlayer('deck-a-player', deckA.track.videoId, {
            onReady: (wrapper) => {
              if (!mounted) return;
              playerARef.current = wrapper;
              wrapper.setVolume(85);
            },
            onStateChange: (state) => {
              if (!mounted) return;
              // 1 = playing, 2 = paused
              if (state === 1) {
                setDeckA(prev => ({ ...prev, isPlaying: true }));
              } else if (state === 2 || state === 0) {
                setDeckA(prev => ({ ...prev, isPlaying: false }));
              }
            },
          });
        }

        // Player B
        if (!playerBRef.current && deckB.track) {
          await createYTPlayer('deck-b-player', deckB.track.videoId, {
            onReady: (wrapper) => {
              if (!mounted) return;
              playerBRef.current = wrapper;
              wrapper.setVolume(85);
            },
            onStateChange: (state) => {
              if (!mounted) return;
              if (state === 1) {
                setDeckB(prev => ({ ...prev, isPlaying: true }));
              } else if (state === 2 || state === 0) {
                setDeckB(prev => ({ ...prev, isPlaying: false }));
              }
            },
          });
        }
      } catch (err) {
        console.warn('Error loading YouTube players', err);
      }
    };

    initPlayers();

    return () => {
      mounted = false;
    };
  }, [deckA.track, deckB.track]);

  // Periodic poll for time update, loop enforcement, and duration
  useEffect(() => {
    const timer = setInterval(() => {
      // Deck A Update
      if (playerARef.current && deckA.isPlaying) {
        const time = playerARef.current.getCurrentTime();
        const dur = playerARef.current.getDuration();

        // Loop check
        if (deckA.loop.active && deckA.loop.startTime !== null) {
          const loopDuration = (60 / Math.max(20, deckA.effectiveBpm)) * deckA.loop.lengthBeats;
          if (time >= deckA.loop.startTime + loopDuration) {
            playerARef.current.seekTo(deckA.loop.startTime);
          }
        }

        setDeckA(prev => ({
          ...prev,
          currentTime: time,
          duration: dur > 0 ? dur : prev.duration,
        }));
      }

      // Deck B Update
      if (playerBRef.current && deckB.isPlaying) {
        const time = playerBRef.current.getCurrentTime();
        const dur = playerBRef.current.getDuration();

        // Loop check
        if (deckB.loop.active && deckB.loop.startTime !== null) {
          const loopDuration = (60 / Math.max(20, deckB.effectiveBpm)) * deckB.loop.lengthBeats;
          if (time >= deckB.loop.startTime + loopDuration) {
            playerBRef.current.seekTo(deckB.loop.startTime);
          }
        }

        setDeckB(prev => ({
          ...prev,
          currentTime: time,
          duration: dur > 0 ? dur : prev.duration,
        }));
      }
    }, 250);

    return () => clearInterval(timer);
  }, [deckA.isPlaying, deckA.loop, deckA.effectiveBpm, deckB.isPlaying, deckB.loop, deckB.effectiveBpm]);

  // Deck Transport Handlers: Play / Pause
  const handlePlayPause = (deckId: 'A' | 'B') => {
    if (deckId === 'A') {
      if (deckA.isPlaying) {
        playerARef.current?.pause();
        setDeckA(prev => ({ ...prev, isPlaying: false }));
        logMixAction('Pause Deck A', 'A');
      } else {
        playerARef.current?.play();
        setDeckA(prev => ({ ...prev, isPlaying: true }));
        logMixAction('Play Deck A', 'A');
      }
    } else {
      if (deckB.isPlaying) {
        playerBRef.current?.pause();
        setDeckB(prev => ({ ...prev, isPlaying: false }));
        logMixAction('Pause Deck B', 'B');
      } else {
        playerBRef.current?.play();
        setDeckB(prev => ({ ...prev, isPlaying: true }));
        logMixAction('Play Deck B', 'B');
      }
    }
  };

  // Pioneer CDJ-style Cue: Return to cue point and pause
  const handleCue = (deckId: 'A' | 'B') => {
    if (deckId === 'A') {
      const cueTime = cuePointARef.current;
      playerARef.current?.pause();
      playerARef.current?.seekTo(cueTime);
      setDeckA(prev => ({ ...prev, isPlaying: false, currentTime: cueTime }));
      logMixAction(`Cue Return (${cueTime.toFixed(1)}s)`, 'A');
    } else {
      const cueTime = cuePointBRef.current;
      playerBRef.current?.pause();
      playerBRef.current?.seekTo(cueTime);
      setDeckB(prev => ({ ...prev, isPlaying: false, currentTime: cueTime }));
      logMixAction(`Cue Return (${cueTime.toFixed(1)}s)`, 'B');
    }
  };

  // Waveform Seek
  const handleSeek = (deckId: 'A' | 'B', seconds: number) => {
    if (deckId === 'A') {
      playerARef.current?.seekTo(seconds);
      setDeckA(prev => ({ ...prev, currentTime: seconds }));
      cuePointARef.current = seconds;
      logMixAction(`Seek to ${seconds.toFixed(1)}s`, 'A');
    } else {
      playerBRef.current?.seekTo(seconds);
      setDeckB(prev => ({ ...prev, currentTime: seconds }));
      cuePointBRef.current = seconds;
      logMixAction(`Seek to ${seconds.toFixed(1)}s`, 'B');
    }
  };

  // Vinyl Scratch / Scrub
  const handleScratch = (deckId: 'A' | 'B', deltaSec: number) => {
    if (deckId === 'A') {
      const newTime = Math.max(0, Math.min(deckA.duration, deckA.currentTime + deltaSec));
      playerARef.current?.seekTo(newTime);
      setDeckA(prev => ({ ...prev, currentTime: newTime }));
    } else {
      const newTime = Math.max(0, Math.min(deckB.duration, deckB.currentTime + deltaSec));
      playerBRef.current?.seekTo(newTime);
      setDeckB(prev => ({ ...prev, currentTime: newTime }));
    }
  };

  // Nudge / Bend tempo
  const handleNudge = (deckId: 'A' | 'B', dir: 1 | -1) => {
    const delta = dir * 0.4;
    handleScratch(deckId, delta);
  };

  // Pitch / Tempo Adjustment
  const handleChangePitch = (deckId: 'A' | 'B', pitch: number) => {
    if (deckId === 'A') {
      const baseBpm = deckA.track?.bpm || 120;
      const effectiveBpm = baseBpm * (1 + pitch / 100);
      setDeckA(prev => ({ ...prev, pitch, effectiveBpm }));
      // Adjust YouTube player playback rate if supported (clamped 0.5 to 2.0)
      const rate = Math.max(0.5, Math.min(2.0, 1 + pitch / 100));
      playerARef.current?.setPlaybackRate(rate);
      logMixAction(`Pitch ${pitch > 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1)}%`, 'A');
    } else {
      const baseBpm = deckB.track?.bpm || 120;
      const effectiveBpm = baseBpm * (1 + pitch / 100);
      setDeckB(prev => ({ ...prev, pitch, effectiveBpm }));
      const rate = Math.max(0.5, Math.min(2.0, 1 + pitch / 100));
      playerBRef.current?.setPlaybackRate(rate);
      logMixAction(`Pitch ${pitch > 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1)}%`, 'B');
    }
  };

  // BPM Sync: Match target deck's effective BPM
  const handleSyncBpm = (targetDeck: 'A' | 'B') => {
    if (targetDeck === 'A') {
      // Sync Deck A to match Deck B
      const targetBpm = deckB.effectiveBpm;
      const baseA = deckA.track?.bpm || 120;
      const neededPitch = ((targetBpm / baseA) - 1) * 100;
      const clamped = Math.max(-deckA.pitchRange, Math.min(deckA.pitchRange, neededPitch));
      handleChangePitch('A', clamped);
      logMixAction(`BPM Sync to ${targetBpm.toFixed(1)}`, 'A');
    } else {
      // Sync Deck B to match Deck A
      const targetBpm = deckA.effectiveBpm;
      const baseB = deckB.track?.bpm || 120;
      const neededPitch = ((targetBpm / baseB) - 1) * 100;
      const clamped = Math.max(-deckB.pitchRange, Math.min(deckB.pitchRange, neededPitch));
      handleChangePitch('B', clamped);
      logMixAction(`BPM Sync to ${targetBpm.toFixed(1)}`, 'B');
    }
  };

  // Tap BPM Detector
  const handleTapBpm = (deckId: 'A' | 'B') => {
    const now = Date.now();
    const target = deckId === 'A' ? deckA : deckB;
    const history = [...target.tapBpmTimes, now].filter(t => now - t < 3000).slice(-6);

    if (history.length >= 2) {
      const intervals = [];
      for (let i = 1; i < history.length; i++) {
        intervals.push(history[i] - history[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);

      if (calculatedBpm >= 50 && calculatedBpm <= 220) {
        if (deckId === 'A') {
          setDeckA(prev => ({
            ...prev,
            effectiveBpm: calculatedBpm,
            tapBpmTimes: history,
            track: prev.track ? { ...prev.track, bpm: calculatedBpm } : null,
          }));
        } else {
          setDeckB(prev => ({
            ...prev,
            effectiveBpm: calculatedBpm,
            tapBpmTimes: history,
            track: prev.track ? { ...prev.track, bpm: calculatedBpm } : null,
          }));
        }
        return;
      }
    }

    if (deckId === 'A') {
      setDeckA(prev => ({ ...prev, tapBpmTimes: history }));
    } else {
      setDeckB(prev => ({ ...prev, tapBpmTimes: history }));
    }
  };

  // Hot Cues: Set or Jump
  const handleTriggerCue = (deckId: 'A' | 'B', id: number) => {
    const deck = deckId === 'A' ? deckA : deckB;
    const existing = deck.hotCues.find(c => c.id === id);

    if (existing) {
      // Jump to existing cue
      handleSeek(deckId, existing.time);
      logMixAction(`Jump Hot Cue ${id} (${existing.time.toFixed(1)}s)`, deckId);
    } else {
      // Set new cue at current time
      const colors = ['#06b6d4', '#f59e0b', '#10b981', '#ec4899'];
      const newCue = {
        id,
        time: deck.currentTime,
        label: `Cue ${id}`,
        color: colors[id - 1] || '#06b6d4',
      };
      if (deckId === 'A') {
        setDeckA(prev => ({ ...prev, hotCues: [...prev.hotCues, newCue] }));
      } else {
        setDeckB(prev => ({ ...prev, hotCues: [...prev.hotCues, newCue] }));
      }
      logMixAction(`Set Hot Cue ${id} at ${deck.currentTime.toFixed(1)}s`, deckId);
    }
  };

  const handleDeleteCue = (deckId: 'A' | 'B', id: number) => {
    if (deckId === 'A') {
      setDeckA(prev => ({ ...prev, hotCues: prev.hotCues.filter(c => c.id !== id) }));
    } else {
      setDeckB(prev => ({ ...prev, hotCues: prev.hotCues.filter(c => c.id !== id) }));
    }
  };

  // Beat Loop Handlers
  const handleSetLoop = (deckId: 'A' | 'B', beats: number) => {
    const deck = deckId === 'A' ? deckA : deckB;
    if (deckId === 'A') {
      setDeckA(prev => ({
        ...prev,
        loop: {
          active: true,
          lengthBeats: beats,
          startTime: prev.loop.active && prev.loop.startTime !== null ? prev.loop.startTime : prev.currentTime,
        },
      }));
    } else {
      setDeckB(prev => ({
        ...prev,
        loop: {
          active: true,
          lengthBeats: beats,
          startTime: prev.loop.active && prev.loop.startTime !== null ? prev.loop.startTime : prev.currentTime,
        },
      }));
    }
    logMixAction(`Set Loop ${beats} Beats`, deckId);
  };

  const handleToggleLoop = (deckId: 'A' | 'B') => {
    const deck = deckId === 'A' ? deckA : deckB;
    if (deckId === 'A') {
      setDeckA(prev => ({
        ...prev,
        loop: {
          ...prev.loop,
          active: !prev.loop.active,
          startTime: !prev.loop.active ? prev.currentTime : prev.loop.startTime,
        },
      }));
    } else {
      setDeckB(prev => ({
        ...prev,
        loop: {
          ...prev.loop,
          active: !prev.loop.active,
          startTime: !prev.loop.active ? prev.currentTime : prev.loop.startTime,
        },
      }));
    }
  };

  // Automated Smooth Crossfader Transition
  const handleStartAutoTransition = (durationSec: number) => {
    if (isAutoTransitioning) return;
    setIsAutoTransitioning(true);

    const startCf = crossfader;
    // If on Deck A side, fade to Deck B (+1); otherwise fade to Deck A (-1)
    const targetCf = startCf <= 0 ? 1 : -1;
    const startTime = performance.now();
    const durationMs = durationSec * 1000;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      setAutoTransitionProgress(progress);

      // Smooth cosine easing
      const eased = (1 - Math.cos(progress * Math.PI)) / 2;
      const currentVal = startCf + (targetCf - startCf) * eased;
      setCrossfader(currentVal);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setCrossfader(targetCf);
        setIsAutoTransitioning(false);
        setAutoTransitionProgress(0);
        logMixAction(`Auto Transition Complete to Deck ${targetCf > 0 ? 'B' : 'A'}`);
      }
    };

    requestAnimationFrame(tick);
  };

  // Load Mashup Preset (Loads both Deck A and Deck B with preset matching)
  const handleLoadMashupPreset = (preset: MashupPreset) => {
    // Deck A
    setDeckA(prev => ({
      ...prev,
      track: preset.deckA,
      effectiveBpm: preset.recommendedBpm,
      currentTime: preset.deckA.suggestedCue || 0,
      isPlaying: false,
    }));
    cuePointARef.current = preset.deckA.suggestedCue || 0;
    playerARef.current?.loadVideoById(preset.deckA.videoId, preset.deckA.suggestedCue || 0);

    // Deck B
    setDeckB(prev => ({
      ...prev,
      track: preset.deckB,
      effectiveBpm: preset.recommendedBpm,
      currentTime: preset.deckB.suggestedCue || 0,
      isPlaying: false,
    }));
    cuePointBRef.current = preset.deckB.suggestedCue || 0;
    playerBRef.current?.loadVideoById(preset.deckB.videoId, preset.deckB.suggestedCue || 0);

    logMixAction(`Loaded Mashup Preset: "${preset.title}"`);
  };

  // Load individual track to specific deck
  const handleLoadTrackToDeck = (deckId: 'A' | 'B', track: DeckTrack) => {
    // Add to custom tracks if not already present
    setCustomTracks(prev => (prev.some(t => t.id === track.id) ? prev : [track, ...prev]));

    if (deckId === 'A') {
      setDeckA(prev => ({
        ...prev,
        track,
        effectiveBpm: track.bpm,
        currentTime: track.suggestedCue || 0,
        isPlaying: false,
      }));
      cuePointARef.current = track.suggestedCue || 0;

      if (playerARef.current) {
        playerARef.current.loadVideoById(track.videoId, track.suggestedCue || 0);
      } else {
        createYTPlayer('deck-a-player', track.videoId, {
          onReady: (wrapper) => {
            playerARef.current = wrapper;
            wrapper.setVolume(85);
          },
          onStateChange: (state) => {
            if (state === 1) setDeckA(prev => ({ ...prev, isPlaying: true }));
            else if (state === 2 || state === 0) setDeckA(prev => ({ ...prev, isPlaying: false }));
          },
        });
      }
      logMixAction(`Loaded Track: ${track.title}`, 'A');
    } else {
      setDeckB(prev => ({
        ...prev,
        track,
        effectiveBpm: track.bpm,
        currentTime: track.suggestedCue || 0,
        isPlaying: false,
      }));
      cuePointBRef.current = track.suggestedCue || 0;

      if (playerBRef.current) {
        playerBRef.current.loadVideoById(track.videoId, track.suggestedCue || 0);
      } else {
        createYTPlayer('deck-b-player', track.videoId, {
          onReady: (wrapper) => {
            playerBRef.current = wrapper;
            wrapper.setVolume(85);
          },
          onStateChange: (state) => {
            if (state === 1) setDeckB(prev => ({ ...prev, isPlaying: true }));
            else if (state === 2 || state === 0) setDeckB(prev => ({ ...prev, isPlaying: false }));
          },
        });
      }
      logMixAction(`Loaded Track: ${track.title}`, 'B');
    }
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toLowerCase();

      // Deck A Transport
      if (key === 'w') {
        e.preventDefault();
        handlePlayPause('A');
      } else if (key === 'q') {
        e.preventDefault();
        handleCue('A');
      } else if (key === 'e') {
        e.preventDefault();
        handleSyncBpm('A');
      } else if (['1', '2', '3', '4'].includes(key)) {
        e.preventDefault();
        handleTriggerCue('A', parseInt(key, 10));
      }

      // Deck B Transport
      else if (key === 'i') {
        e.preventDefault();
        handlePlayPause('B');
      } else if (key === 'u') {
        e.preventDefault();
        handleCue('B');
      } else if (key === 'o') {
        e.preventDefault();
        handleSyncBpm('B');
      } else if (['7', '8', '9', '0'].includes(key)) {
        e.preventDefault();
        const num = key === '0' ? 4 : parseInt(key, 10) - 6;
        handleTriggerCue('B', num);
      }

      // Mixer Crossfader
      else if (key === '[') {
        e.preventDefault();
        setCrossfader(prev => Math.max(-1, prev - 0.1));
      } else if (key === ']') {
        e.preventDefault();
        setCrossfader(prev => Math.min(1, prev + 0.1));
      } else if (key === ' ') {
        e.preventDefault();
        setCrossfader(0);
      }

      // Sampler Sound FX Pads
      else if (key === 'h') {
        audioFx.playAirhorn();
      } else if (key === 'b') {
        audioFx.play808Drop();
      } else if (key === 'n') {
        audioFx.playSiren();
      } else if (key === 't') {
        audioFx.playVinylBrake();
      } else if (key === 'l') {
        audioFx.playLaser();
      } else if (key === 'r') {
        audioFx.playBackspin();
      } else if (key === 's') {
        audioFx.playRaveStab();
      } else if (key === 'm') {
        audioFx.playBeatClick(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <Header
        displayMode={displayMode}
        onChangeDisplayMode={setDisplayMode}
        keyA={deckA.track?.key}
        keyB={deckB.track?.key}
        isRecording={isRecording}
        onOpenCrateModal={() => setIsCrateModalOpen(true)}
        onOpenRecordingModal={() => setIsRecordingModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => {
          setIsMuted(!isMuted);
          audioFx.setMute(!isMuted);
        }}
      />

      {/* Main Console Layout */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-2.5 sm:p-4 flex flex-col gap-4">
        {/* Top Mashup Video Stage: Dual YouTube videos mashed up at the top with Screen blend and CC for Accapella */}
        <TopMashupVideoStage
          trackA={deckA.track}
          trackB={deckB.track}
          currentTimeA={deckA.currentTime}
          currentTimeB={deckB.currentTime}
          isPlayingA={deckA.isPlaying}
          isPlayingB={deckB.isPlaying}
          bpmA={deckA.effectiveBpm}
          bpmB={deckB.effectiveBpm}
          crossfader={crossfader}
          onCrossfaderChange={setCrossfader}
          loopAActive={deckA.loop.active}
          loopBActive={deckB.loop.active}
        />

        {/* Dual Decks & Central Master Mixer */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* DECK A */}
          <Deck
            state={deckA}
            oppositeDeckTrack={deckB.track}
            oppositeEffectiveBpm={deckB.effectiveBpm}
            onPlayPause={() => handlePlayPause('A')}
            onCue={() => handleCue('A')}
            onSeek={(secs) => handleSeek('A', secs)}
            onScratch={(delta) => handleScratch('A', delta)}
            onNudge={(dir) => handleNudge('A', dir)}
            onChangePitch={(p) => handleChangePitch('A', p)}
            onSetPitchRange={(rng) => setDeckA(prev => ({ ...prev, pitchRange: rng }))}
            onToggleKeyLock={() => setDeckA(prev => ({ ...prev, keyLock: !prev.keyLock }))}
            onSyncBpm={() => handleSyncBpm('A')}
            onTapBpm={() => handleTapBpm('A')}
            onChangeEQ={(band, val) => setDeckA(prev => ({ ...prev, eq: { ...prev.eq, [band]: val } }))}
            onToggleKill={(band) => setDeckA(prev => ({ ...prev, eqKill: { ...prev.eqKill, [band]: !prev.eqKill[band] } }))}
            onChangeFilter={(val) => setDeckA(prev => ({ ...prev, filter: val }))}
            onTriggerCue={(id) => handleTriggerCue('A', id)}
            onDeleteCue={(id) => handleDeleteCue('A', id)}
            onSetLoop={(beats) => handleSetLoop('A', beats)}
            onToggleLoop={() => handleToggleLoop('A')}
            onHalveLoop={() => handleSetLoop('A', Math.max(0.25, deckA.loop.lengthBeats / 2))}
            onDoubleLoop={() => handleSetLoop('A', Math.min(32, deckA.loop.lengthBeats * 2))}
            onOpenCrateModal={() => setIsCrateModalOpen(true)}
            onLoadTrack={(t) => handleLoadTrackToDeck('A', t)}
            customTracks={customTracks}
            showVideo={false}
          />

          {/* MASTER MIXER CONSOLE */}
          <div className="flex justify-center">
            <MasterMixer
              volumeA={deckA.volume}
              volumeB={deckB.volume}
              masterVolume={masterVolume}
              crossfader={crossfader}
              crossfaderCurve={crossfaderCurve}
              pflA={deckA.pfl}
              pflB={deckB.pfl}
              isDeckAPlaying={deckA.isPlaying}
              isDeckBPlaying={deckB.isPlaying}
              onChangeVolumeA={(vol) => setDeckA(prev => ({ ...prev, volume: vol }))}
              onChangeVolumeB={(vol) => setDeckB(prev => ({ ...prev, volume: vol }))}
              onChangeMasterVolume={setMasterVolume}
              onChangeCrossfader={setCrossfader}
              onChangeCurve={setCrossfaderCurve}
              onTogglePflA={() => setDeckA(prev => ({ ...prev, pfl: !prev.pfl }))}
              onTogglePflB={() => setDeckB(prev => ({ ...prev, pfl: !prev.pfl }))}
              onStartAutoTransition={handleStartAutoTransition}
              isAutoTransitioning={isAutoTransitioning}
              autoTransitionProgress={autoTransitionProgress}
            />
          </div>

          {/* DECK B */}
          <Deck
            state={deckB}
            oppositeDeckTrack={deckA.track}
            oppositeEffectiveBpm={deckA.effectiveBpm}
            onPlayPause={() => handlePlayPause('B')}
            onCue={() => handleCue('B')}
            onSeek={(secs) => handleSeek('B', secs)}
            onScratch={(delta) => handleScratch('B', delta)}
            onNudge={(dir) => handleNudge('B', dir)}
            onChangePitch={(p) => handleChangePitch('B', p)}
            onSetPitchRange={(rng) => setDeckB(prev => ({ ...prev, pitchRange: rng }))}
            onToggleKeyLock={() => setDeckB(prev => ({ ...prev, keyLock: !prev.keyLock }))}
            onSyncBpm={() => handleSyncBpm('B')}
            onTapBpm={() => handleTapBpm('B')}
            onChangeEQ={(band, val) => setDeckB(prev => ({ ...prev, eq: { ...prev.eq, [band]: val } }))}
            onToggleKill={(band) => setDeckB(prev => ({ ...prev, eqKill: { ...prev.eqKill, [band]: !prev.eqKill[band] } }))}
            onChangeFilter={(val) => setDeckB(prev => ({ ...prev, filter: val }))}
            onTriggerCue={(id) => handleTriggerCue('B', id)}
            onDeleteCue={(id) => handleDeleteCue('B', id)}
            onSetLoop={(beats) => handleSetLoop('B', beats)}
            onToggleLoop={() => handleToggleLoop('B')}
            onHalveLoop={() => handleSetLoop('B', Math.max(0.25, deckB.loop.lengthBeats / 2))}
            onDoubleLoop={() => handleSetLoop('B', Math.min(32, deckB.loop.lengthBeats * 2))}
            onOpenCrateModal={() => setIsCrateModalOpen(true)}
            onLoadTrack={(t) => handleLoadTrackToDeck('B', t)}
            customTracks={customTracks}
            showVideo={false}
          />
        </div>

        {/* Sampler Sound FX Performance Bank */}
        <SamplerPads />
      </main>

      {/* Modals */}
      <CrateModal
        isOpen={isCrateModalOpen}
        onClose={() => setIsCrateModalOpen(false)}
        onLoadTrackToDeck={handleLoadTrackToDeck}
        onLoadMashupPreset={handleLoadMashupPreset}
        onAddCustomTrack={(t) => setCustomTracks(prev => [t, ...prev])}
        customTracks={customTracks}
      />

      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        isRecording={isRecording}
        events={mixEvents}
        deckA={deckA}
        deckB={deckB}
        onToggleRecording={() => setIsRecording(!isRecording)}
        onClearHistory={() => setMixEvents([])}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
