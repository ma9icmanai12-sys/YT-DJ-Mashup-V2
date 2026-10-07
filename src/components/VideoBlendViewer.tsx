import React from 'react';
import { DeckTrack } from '../types/dj';
import { Eye, Layers, Maximize2 } from 'lucide-react';

interface VideoBlendViewerProps {
  deckATrack: DeckTrack | null;
  deckBTrack: DeckTrack | null;
  crossfader: number; // -1 to +1
  isPlayingA: boolean;
  isPlayingB: boolean;
  onToggleFullscreen: () => void;
}

export const VideoBlendViewer: React.FC<VideoBlendViewerProps> = ({
  deckATrack,
  deckBTrack,
  crossfader,
  isPlayingA,
  isPlayingB,
  onToggleFullscreen,
}) => {
  // Map crossfader (-1 to +1) to opacity weights (0 to 1)
  // At -1: A=1, B=0. At 0: A=0.7, B=0.7 (additive / screen blend). At +1: A=0, B=1.
  const pos = (crossfader + 1) / 2; // 0 to 1
  const opacityA = Math.max(0.1, 1 - pos * 0.9);
  const opacityB = Math.max(0.1, pos * 0.9 + 0.1);

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-2xl flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-300">
            LIVE VJ VIDEO BLEND SCREEN
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            (Crossfader-controlled visual blend)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-cyan-400">
            A: {Math.round(opacityA * 100)}%
          </span>
          <span className="text-[10px] font-mono text-neutral-600">/</span>
          <span className="text-[10px] font-mono text-amber-400">
            B: {Math.round(opacityB * 100)}%
          </span>
          <button
            onClick={onToggleFullscreen}
            className="p-1 rounded text-neutral-400 hover:text-white bg-neutral-800 border border-neutral-700 transition-colors"
            title="Toggle fullscreen projector mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Screen Container */}
      <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden bg-black border border-neutral-800 flex items-center justify-center">
        {/* Deck A Video Projection Overlay */}
        {deckATrack && (
          <div
            className="absolute inset-0 transition-opacity duration-75 mix-blend-screen flex items-center justify-center overflow-hidden"
            style={{ opacity: opacityA }}
          >
            <img
              src={deckATrack.thumbnailUrl}
              alt={deckATrack.title}
              className={`w-full h-full object-cover filter contrast-125 saturate-150 ${isPlayingA ? 'animate-pulse' : ''}`}
            />
            <div className="absolute inset-0 bg-cyan-950/20 mix-blend-color" />
          </div>
        )}

        {/* Deck B Video Projection Overlay */}
        {deckBTrack && (
          <div
            className="absolute inset-0 transition-opacity duration-75 mix-blend-screen flex items-center justify-center overflow-hidden"
            style={{ opacity: opacityB }}
          >
            <img
              src={deckBTrack.thumbnailUrl}
              alt={deckBTrack.title}
              className={`w-full h-full object-cover filter contrast-125 saturate-150 ${isPlayingB ? 'animate-pulse' : ''}`}
            />
            <div className="absolute inset-0 bg-amber-950/20 mix-blend-color" />
          </div>
        )}

        {/* CRT Scanline & Vignette Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/70 pointer-events-none" />

        {/* Live HUD Watermark */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 pointer-events-none text-[10px] font-mono text-white/80 bg-black/70 px-2 py-0.5 rounded backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>MASHUP BROADCAST ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
