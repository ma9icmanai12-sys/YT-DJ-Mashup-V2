import React, { useState, useEffect } from 'react';
import { DeckTrack } from '../types/dj';
import { getCurrentLyricLine, TRACK_LYRICS } from '../data/lyrics';
import {
  Layers,
  Maximize2,
  Sparkles,
  Subtitles,
  Split,
  Sliders,
  Type,
  Edit3,
  X,
  Volume2,
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

export type BlendVisualMode = 'screen' | 'alpha' | 'side-by-side' | 'split';

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
  const [blendMode, setBlendMode] = useState<BlendVisualMode>('screen');
  const [showCc, setShowCc] = useState<boolean>(true);
  const [ccLead, setCcLead] = useState<'auto' | 'deckA' | 'deckB'>('auto');
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [customLyricInput, setCustomLyricInput] = useState('');

  // Audio frequency simulation
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

    // Parse simple line-by-line format or plain text
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
            {blendMode === 'screen' ? 'Screen Blend (Additive Lighting)' : blendMode === 'alpha' ? 'Alpha Dissolve' : blendMode === 'split' ? 'Split Wipe' : 'Dual Cinema'}
          </span>
        </div>

        {/* Action Controls & Mode Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Blend Mode Switcher */}
          <div className="flex items-center p-0.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => setBlendMode('screen')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                blendMode === 'screen'
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Screen Blend: Merges concert visuals, lights, and performers additively!"
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
              onClick={() => setBlendMode('split')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                blendMode === 'split'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Split Wipe: Dynamic diagonal split cut"
            >
              <Split className="w-3 h-3" />
              <span>Split</span>
            </button>

            <button
              onClick={() => setBlendMode('side-by-side')}
              className={`px-2.5 py-1 rounded transition-colors ${
                blendMode === 'side-by-side'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Side-by-Side Dual Widescreen"
            >
              Dual
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
            title="Toggle Fullscreen Mashup Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Mashup Video Projection Stage */}
      <div className="w-full relative aspect-video sm:h-72 lg:h-80 rounded-xl overflow-hidden bg-black border border-neutral-800 shadow-2xl flex items-center justify-center select-none">
        {/* Background Visual Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900/60 via-black to-black pointer-events-none" />

        {/* VIEW 1: SCREEN BLEND MASHUP (Concert Lights & Performers Merged) */}
        {blendMode === 'screen' && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
            {/* Video Layer A (Base) */}
            {trackA?.thumbnailUrl && (
              <div
                className="absolute inset-0 transition-opacity duration-150 flex items-center justify-center overflow-hidden"
                style={{ opacity: Math.max(0.15, 1 - pos * 0.75) }}
              >
                <img
                  src={trackA.thumbnailUrl}
                  alt={trackA.title}
                  className={`w-full h-full object-cover filter contrast-125 saturate-150 ${isPlayingA ? 'animate-pulse' : ''}`}
                />
                <div className="absolute inset-0 bg-cyan-950/20 mix-blend-color" />
              </div>
            )}

            {/* Video Layer B (Screened on top of A) */}
            {trackB?.thumbnailUrl && (
              <div
                className="absolute inset-0 transition-opacity duration-150 flex items-center justify-center overflow-hidden mix-blend-screen"
                style={{ opacity: Math.max(0.15, pos * 0.75 + 0.25) }}
              >
                <img
                  src={trackB.thumbnailUrl}
                  alt={trackB.title}
                  className={`w-full h-full object-cover filter contrast-150 saturate-150 brightness-110 ${isPlayingB ? 'animate-pulse' : ''}`}
                />
                <div className="absolute inset-0 bg-amber-950/30 mix-blend-color" />
              </div>
            )}

            {/* Stage Light Flare Overlay in center */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-40"
              style={{
                background: `radial-gradient(circle at ${pos * 100}% 50%, rgba(245,158,11,0.5) 0%, rgba(6,182,212,0.5) 40%, transparent 70%)`,
              }}
            />
          </div>
        )}

        {/* VIEW 2: ALPHA DISSOLVE */}
        {blendMode === 'alpha' && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
            {trackA?.thumbnailUrl && (
              <div
                className="absolute inset-0 transition-opacity duration-100 flex items-center justify-center overflow-hidden"
                style={{ opacity: 1 - pos }}
              >
                <img
                  src={trackA.thumbnailUrl}
                  alt={trackA.title}
                  className="w-full h-full object-cover filter contrast-125 saturate-125"
                />
              </div>
            )}

            {trackB?.thumbnailUrl && (
              <div
                className="absolute inset-0 transition-opacity duration-100 flex items-center justify-center overflow-hidden"
                style={{ opacity: pos }}
              >
                <img
                  src={trackB.thumbnailUrl}
                  alt={trackB.title}
                  className="w-full h-full object-cover filter contrast-125 saturate-125"
                />
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: SPLIT WIPE */}
        {blendMode === 'split' && (
          <div className="absolute inset-0 w-full h-full grid grid-cols-2 overflow-hidden">
            {/* Left side Deck A */}
            <div className="relative w-full h-full overflow-hidden border-r border-amber-400/60 shadow-lg">
              {trackA?.thumbnailUrl ? (
                <img
                  src={trackA.thumbnailUrl}
                  alt={trackA.title}
                  className="w-full h-full object-cover filter contrast-125"
                />
              ) : (
                <div className="w-full h-full bg-neutral-950" />
              )}
            </div>

            {/* Right side Deck B */}
            <div className="relative w-full h-full overflow-hidden">
              {trackB?.thumbnailUrl ? (
                <img
                  src={trackB.thumbnailUrl}
                  alt={trackB.title}
                  className="w-full h-full object-cover filter contrast-125"
                />
              ) : (
                <div className="w-full h-full bg-neutral-950" />
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: SIDE-BY-SIDE DUAL CINEMA */}
        {blendMode === 'side-by-side' && (
          <div className="absolute inset-0 w-full h-full grid grid-cols-2 gap-1 p-1 bg-black">
            <div className="relative w-full h-full rounded-lg overflow-hidden border border-cyan-500/40">
              {trackA?.thumbnailUrl ? (
                <img
                  src={trackA.thumbnailUrl}
                  alt={trackA.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-950" />
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-400 font-bold border border-cyan-500/40">
                DECK A: {bpmA.toFixed(1)} BPM
              </div>
            </div>

            <div className="relative w-full h-full rounded-lg overflow-hidden border border-amber-500/40">
              {trackB?.thumbnailUrl ? (
                <img
                  src={trackB.thumbnailUrl}
                  alt={trackB.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-950" />
              )}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-400 font-bold border border-amber-500/40">
                DECK B: {bpmB.toFixed(1)} BPM
              </div>
            </div>
          </div>
        )}

        {/* CRT Scanline & Lens Vignette FX */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_black_90%)] pointer-events-none opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />

        {/* Center Live Reactive Audio Spectrum Bridge */}
        <div className="absolute top-3 inset-x-0 flex items-center justify-center gap-1 pointer-events-none z-20">
          <div className="bg-black/75 backdrop-blur px-3 py-1 rounded-full border border-neutral-800 flex items-center gap-2">
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
              <div className="w-full max-w-2xl bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/40 text-center shadow-2xl mb-1 flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>VOCAL A · {trackA?.artist}</span>
                </div>
                <p className="text-sm sm:text-base md:text-lg font-mono font-black text-white tracking-wide drop-shadow-[0_2px_10px_rgba(6,182,212,0.8)]">
                  "{lyricLineA}"
                </p>
              </div>
            )}

            {/* If Deck B Vocal is singing */}
            {lyricLineB && lyricLineB !== lyricLineA && (
              <div className="w-full max-w-2xl bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/40 text-center shadow-2xl flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>VOCAL B · {trackB?.artist}</span>
                </div>
                <p className="text-sm sm:text-base md:text-lg font-mono font-black text-white tracking-wide drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)]">
                  "{lyricLineB}"
                </p>
              </div>
            )}

            {/* Default prompt when instrumental / intro plays */}
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
              Paste song lyrics or rap verses below (one line per bar). The CC streamer will display them across the mashup screen in real time!
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
