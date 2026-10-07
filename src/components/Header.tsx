import React from 'react';
import { checkKeyCompatibility } from '../data/presets';
import {
  Disc,
  FolderOpen,
  Radio,
  Keyboard,
  Layers,
  Sliders,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  displayMode: 'dual' | 'blend' | 'audio-only';
  onChangeDisplayMode: (mode: 'dual' | 'blend' | 'audio-only') => void;
  keyA?: string;
  keyB?: string;
  isRecording: boolean;
  onOpenCrateModal: () => void;
  onOpenRecordingModal: () => void;
  onOpenShortcutsModal: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  displayMode,
  onChangeDisplayMode,
  keyA,
  keyB,
  isRecording,
  onOpenCrateModal,
  onOpenRecordingModal,
  onOpenShortcutsModal,
  isMuted,
  onToggleMute,
}) => {
  const compatibility = keyA && keyB ? checkKeyCompatibility(keyA, keyB) : null;

  return (
    <header className="w-full bg-neutral-950 border-b border-neutral-800 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl select-none">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
            <Disc className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-mono font-black tracking-tight text-white uppercase">
              DJ YOUTUBE MASHUP
            </h1>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
            <span>DUAL-DECK MIXING STUDIO</span>
            <span aria-hidden="true">·</span>
            <span>PRO AUDIO & VJ CONSOLE</span>
          </div>
        </div>
      </div>

      {/* Harmonic Key Compatibility Pill */}
      {compatibility && (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-neutral-400 font-medium">Harmonic Compatibility:</span>
          <span
            className={`font-bold ${
              compatibility.match ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {compatibility.type}
          </span>
          <span className="text-neutral-500 text-[10px]">
            ({keyA} &times; {keyB})
          </span>
        </div>
      )}

      {/* View Mode Segmented Controls & Action Tools */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Display Mode Switcher */}
        <div className="flex items-center p-0.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono">
          <button
            onClick={() => onChangeDisplayMode('dual')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
              displayMode === 'dual'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Side-by-side Dual Decks with live video screens"
          >
            Dual Decks
          </button>

          <button
            onClick={() => onChangeDisplayMode('blend')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
              displayMode === 'blend'
                ? 'bg-neutral-800 text-cyan-300 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Live Crossfader Video Blend (VJ Projection Mode)"
          >
            <Layers className="w-3 h-3" />
            <span>VJ Blend</span>
          </button>

          <button
            onClick={() => onChangeDisplayMode('audio-only')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
              displayMode === 'audio-only'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Audio Hardware Console (Maximizes jog wheels and faders)"
          >
            Audio Only
          </button>
        </div>

        {/* Crate Modal Button */}
        <button
          onClick={onOpenCrateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all active:scale-95 shadow-md"
          title="Browse Curated Mashups & Crate Tracks"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>CRATES</span>
        </button>

        {/* Record / Recipe Button */}
        <button
          onClick={onOpenRecordingModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border active:scale-95 ${
            isRecording
              ? 'bg-red-500 text-white border-red-400 shadow-md shadow-red-500/30 animate-pulse'
              : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800'
          }`}
          title="Record live DJ set and export mashup recipe"
        >
          <Radio className={`w-3.5 h-3.5 ${isRecording ? 'text-white' : 'text-red-400'}`} />
          <span className="hidden sm:inline">{isRecording ? 'REC ON' : 'RECIPE'}</span>
        </button>

        {/* Shortcuts Button */}
        <button
          onClick={onOpenShortcutsModal}
          className="p-2 rounded-lg text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
          title="Keyboard Shortcuts Map"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Sound FX Mute Toggle */}
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-lg border transition-colors ${
            isMuted
              ? 'bg-red-950/60 border-red-800 text-red-400'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
          title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
