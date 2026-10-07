import React, { useState, useEffect } from 'react';
import { DeckTrack } from '../types/dj';
import { getCurrentLyricLine, TRACK_LYRICS } from '../data/lyrics';
import {
  Maximize2,
  Sparkles,
  Subtitles,
  Split,
  Edit3,
  X,
  Tv,
} from 'lucide-react';

interface TopMashupVideoStageProps {
  trackA: DeckTrack | null;
  trackB: DeckTrack | null;
  currentTimeA: number;
  currentTimeB: number;
  isPlayingA: boolean;
  isPlayingB: boolean;
  bpmA: number;
  bpmB: number;
  crossfader: number; // -1 (Deck A) to +1 (Deck B)
  onCrossfaderChange: (val: number) => void;
  loopAActive: boolean;
  loopBActive: boolean;
}

export type BlendVisualMode = 'side-by-side' | 'screen' | 'alpha' | 'focus-a' | 'focus-b';

export const TopMashupVideoStage: React.FC<TopMashupVideoStageProps> = ({
  trackA,
  trackB,
  currentTimeA,
  currentTimeB,
  isPlayingA,
  isPlayingB,
  bpmA,
  bpmB,
  crossfader,
  onCrossfaderChange,
  loopAActive,
  loopBActive,
}) => {
  const [blendMode, setBlendMode] = useState<BlendVisualMode>('side-by-side');
  const [showCc, setShowCc] = useState<boolean>(true);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [customLyricInput, setCustomLyricInput] = useState('');

  // Audio frequency simulation for the center mashup bridge
  const [audioWaves, setAudioWaves] = useState<number[]>([40, 65, 80, 55, 70, 90, 60, 45]);

  useEffect(() => {
    if (!isPlayingA && !isPlayingB) return;
    const interval = setInterval(() => {
      setAudioWaves([
        isPlayingA ? 35 + Math.random() * 55 : 12,
        isPlayingA ? 50 + Math.random() * 50 : 12,
        (isPlayingA || isPlayingB) ? 55 + Math.random() * 45 : 18,
        (isPlayingA || isPlayingB) ? 70 + Math.random() * 30 : 18,
        (isPlayingA || isPlayingB) ? 60 + Math.random() * 40 : 18,
        isPlayingB ? 50 + Math.random() * 50 : 12,
        isPlayingB ? 40 + Math.random() * 55 : 12,
        isPlayingB ? 30 + Math.random() * 45 : 10,
      ]);
    }, 85);
    return () => clearInterval(interval);
  }, [isPlayingA, isPlayingB]);

  // Video blend calculation based on crossfader position (-1 to +1)
  const pos = (crossfader + 1) / 2; // 0 (Deck A full) to 1 (Deck B full)
  const weightA = Math.round((1 - pos) * 100);
  const weightB = Math.round(pos * 100);

  // CC Accapella Lyrics resolution
  const lyricLineA = trackA ? getCurrentLyricLine(trackA.videoId, currentTimeA) : null;
  const lyricLineB = trackB ? getCurrentLyricLine(trackB.videoId, currentTimeB) : null;

  const toggleFullscreen = () => {
    const el = document.getElementById('top-mashup-stage');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSaveCustomLyrics = () => {
    if (!trackA && !trackB) return;
    const targetVideoId = (trackA && trackA.videoId) || (trackB && trackB.videoId);
    if (!targetVideoId) return;

    const lines = customLyricInput.split('\n').filter(Boolean).map((line, idx) => ({
      time: idx * 4,
      text: line.trim(),
    }));

    TRACK_LYRICS[targetVideoId] = lines;
    setIsLyricsModalOpen(false);
  };

  return (
    <section
      id="top-mashup-stage"
      className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl flex flex-col gap-2.5 backdrop-blur-md relative overflow-hidden"
    >
      {/* Top Bar: Blend Mode Selector, CC Accapella Toggle & Fullscreen */}
      <div className="flex flex-wrap items-center justify-between border-b border-neutral-800 pb-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-xs font-mono font-bold text-white shadow-sm">
            <span className={`w-2 h-2 rounded-full ${isPlayingA || isPlayingB ? 'bg-red-500 animate-ping' : 'bg-neutral-600'}`} />
            <span>MASHUP VIDEO STAGE</span>
          </div>

          <span className="hidden sm:inline text-[11px] font-mono text-neutral-400">
            {blendMode === 'side-by-side'
              ? 'Dual Cinema (Production Streams)'
              : blendMode === 'screen'
              ? 'Screen Blend (Additive Lighting)'
              : blendMode === 'alpha'
              ? 'Alpha Dissolve'
              : blendMode === 'focus-a'
              ? 'Deck A Focus'
              : 'Deck B Focus'}
          </span>
        </div>

        {/* Action Controls & Mode Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => setBlendMode('side-by-side')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                blendMode === 'side-by-side'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Dual Screen Side-by-Side Widescreen"
            >
              <Split className="w-3 h-3" />
              <span>Dual Screen</span>
            </button>

            <button
              onClick={() => setBlendMode('screen')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                blendMode === 'screen'
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Screen Blend: Merges concert visuals, lights, and performers additively"
            >
              <Sparkles className="w-3 h-3" />
              <span>Screen Blend</span>
            </button>

            <button
              onClick={() => setBlendMode('alpha')}
              className={`px-2.5 py-1 rounded transition-colors ${
                blendMode === 'alpha'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Alpha Dissolve: Crossfader-controlled opacity blend"
            >
              Alpha
            </button>

            <button
              onClick={() => setBlendMode('focus-a')}
              className={`px-2 py-1 rounded transition-colors text-[10px] ${
                blendMode === 'focus-a'
                  ? 'bg-cyan-900 text-cyan-300 font-bold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Focus on Deck A Video"
            >
              Deck A
            </button>

            <button
              onClick={() => setBlendMode('focus-b')}
              className={`px-2 py-1 rounded transition-colors text-[10px] ${
                blendMode === 'focus-b'
                  ? 'bg-amber-900 text-amber-300 font-bold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Focus on Deck B Video"
            >
              Deck B
            </button>
          </div>

          {/* CC for Accapella Toggle Button */}
          <button
            onClick={() => setShowCc(!showCc)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all active:scale-95 shadow-sm ${
              showCc
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-emerald-500/20'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
            title="Toggle Closed Captions (CC) for Accapella lyrics stream"
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>CC ACCAPELLA</span>
          </button>

          {/* Edit Lyrics / Custom CC Button */}
          <button
            onClick={() => setIsLyricsModalOpen(true)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors"
            title="Edit / Paste Custom Accapella Lyrics"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors"
            title="Toggle Fullscreen Stage"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Presentation Stage with Real Embedded YouTube Players */}
      <div className="w-full relative aspect-video sm:h-72 lg:h-80 rounded-xl overflow-hidden bg-black border border-neutral-800 shadow-2xl flex items-center justify-center select-none">
        {/* Real YouTube Players Layer */}
        <div
          className={`w-full h-full relative ${
            blendMode === 'side-by-side' ? 'grid grid-cols-1 md:grid-cols-2 gap-1.5 p-1 bg-black' : 'relative'
          }`}
        >
          {/* DECK A REAL YOUTUBE PLAYER CONTAINER */}
          <div
            className={`overflow-hidden rounded-lg bg-black relative transition-all duration-150 ${
              blendMode === 'side-by-side'
                ? 'w-full h-full border border-cyan-500/40'
                : blendMode === 'focus-a'
                ? 'absolute inset-0 z-10'
                : blendMode === 'focus-b'
                ? 'absolute inset-0 z-0 opacity-0 pointer-events-none'
                : 'absolute inset-0 z-0'
            }`}
            style={{
              opacity: blendMode === 'alpha' ? Math.max(0.08, 1 - pos) : 1,
            }}
          >
            {/* The Real YouTube Player for Deck A */}
            <div id="deck-a-player" className="w-full h-full pointer-events-auto" />

            {/* Deck A HUD Banner */}
            <div className="absolute top-2 left-2 z-10 pointer-events-none flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-wider uppercase bg-black/80 backdrop-blur border border-cyan-500/50 text-cyan-400">
                DECK A {isPlayingA ? '· LIVE' : '· IDLE'}
              </span>
              {loopAActive && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 border border-purple-500/50 text-purple-300">
                  LOOP ON
                </span>
              )}
            </div>

            {/* Deck A Bottom Track Info Tag */}
            <div className="absolute bottom-2 inset-x-2 z-10 pointer-events-none flex items-center justify-between bg-black/80 backdrop-blur px-2 py-1 rounded border border-neutral-800 text-[10px] font-mono">
              <span className="text-white font-bold truncate max-w-[70%]">
                {trackA ? trackA.title : 'Deck A Empty'}
              </span>
              <span className="text-cyan-400 shrink-0 font-semibold">
                {bpmA.toFixed(1)} BPM
              </span>
            </div>
          </div>

          {/* DECK B REAL YOUTUBE PLAYER CONTAINER */}
          <div
            className={`overflow-hidden rounded-lg bg-black relative transition-all duration-150 ${
              blendMode === 'side-by-side'
                ? 'w-full h-full border border-amber-500/40'
                : blendMode === 'focus-b'
                ? 'absolute inset-0 z-10'
                : blendMode === 'focus-a'
                ? 'absolute inset-0 z-0 opacity-0 pointer-events-none'
                : 'absolute inset-0 z-10'
            }`}
            style={{
              opacity:
                blendMode === 'alpha'
                  ? Math.max(0.08, pos)
                  : blendMode === 'screen'
                  ? Math.max(0.15, pos)
                  : 1,
              mixBlendMode: blendMode === 'screen' ? 'screen' : 'normal',
            }}
          >
            {/* The Real YouTube Player for Deck B */}
            <div id="deck-b-player" className="w-full h-full pointer-events-auto" />

            {/* Deck B HUD Banner */}
            <div className="absolute top-2 right-2 z-10 pointer-events-none flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-wider uppercase bg-black/80 backdrop-blur border border-amber-500/50 text-amber-400">
                DECK B {isPlayingB ? '· LIVE' : '· IDLE'}
              </span>
              {loopBActive && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 border border-purple-500/50 text-purple-300">
                  LOOP ON
                </span>
              )}
            </div>

            {/* Deck B Bottom Track Info Tag */}
            <div className="absolute bottom-2 inset-x-2 z-10 pointer-events-none flex items-center justify-between bg-black/80 backdrop-blur px-2 py-1 rounded border border-neutral-800 text-[10px] font-mono">
              <span className="text-white font-bold truncate max-w-[70%]">
                {trackB ? trackB.title : 'Deck B Empty'}
              </span>
              <span className="text-amber-400 shrink-0 font-semibold">
                {bpmB.toFixed(1)} BPM
              </span>
            </div>
          </div>
        </div>

        {/* Center Live Reactive Audio Spectrum Bridge */}
        <div className="absolute top-3 inset-x-0 flex items-center justify-center gap-1 pointer-events-none z-20">
          <div className="bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-neutral-800 flex items-center gap-2 shadow-lg">
            <span className="text-[10px] font-mono font-bold text-cyan-400">
              A: {weightA}%
            </span>
            <div className="flex items-end gap-1 h-3.5">
              {audioWaves.map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    i < 3 ? 'bg-cyan-400' : i < 5 ? 'bg-amber-400' : 'bg-orange-400'
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400">
              B: {weightB}%
            </span>
          </div>
        </div>

        {/* CC FOR ACCAPELLA: REAL-TIME KARAOKE LYRICS SUBTITLE STREAMER */}
        {showCc && (
          <div className="absolute bottom-3 inset-x-3 sm:inset-x-8 z-30 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
            {/* If Deck A Vocal is singing */}
            {lyricLineA && (
              <div className="w-full max-w-2xl bg-black/85 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/50 text-center shadow-2xl mb-1 flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>VOCAL A · {trackA?.artist}</span>
                </div>
                <p className="text-sm sm:text-base md:text-lg font-mono font-black text-white tracking-wide drop-shadow-[0_2px_10px_rgba(6,182,212,0.9)]">
                  "{lyricLineA}"
                </p>
              </div>
            )}

            {/* If Deck B Vocal is singing */}
            {lyricLineB && lyricLineB !== lyricLineA && (
              <div className="w-full max-w-2xl bg-black/85 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/50 text-center shadow-2xl flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>VOCAL B · {trackB?.artist}</span>
                </div>
                <p className="text-sm sm:text-base md:text-lg font-mono font-black text-white tracking-wide drop-shadow-[0_2px_10px_rgba(245,158,11,0.9)]">
                  "{lyricLineB}"
                </p>
              </div>
            )}

            {/* Standby indicator when intro/outro or instrumental */}
            {!lyricLineA && !lyricLineB && (
              <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <Subtitles className="w-3 h-3 text-emerald-400" />
                <span>CC Accapella Standby · Live Vocals Ready</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Lyrics / Accapella Editor Modal */}
      {isLyricsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-4 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Subtitles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase">
                  Custom CC Accapella Lyrics
                </h3>
              </div>
              <button
                onClick={() => setIsLyricsModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-mono text-neutral-400">
              Paste song lyrics or rap verses below (one line per bar). The CC streamer will display them across the live video mashup screen in real time!
            </p>

            <textarea
              rows={8}
              value={customLyricInput}
              onChange={(e) => setCustomLyricInput(e.target.value)}
              placeholder="Verse 1:&#10;Line 1 lyrics...&#10;Line 2 lyrics...&#10;Chorus hook..."
              className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/60"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setIsLyricsModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs font-mono text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomLyrics}
                className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-black uppercase transition-colors"
              >
                Save Lyrics to CC
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
