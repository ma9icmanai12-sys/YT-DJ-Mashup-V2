import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-white tracking-wide uppercase">
              DJ KEYBOARD SHORTCUTS
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-800/80 border border-neutral-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 text-xs font-mono max-h-[75vh] overflow-y-auto">
          {/* Deck A Shortcuts */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-cyan-500/30 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-cyan-400 uppercase">
              DECK A CONTROLS
            </span>
            <div className="grid grid-cols-2 gap-2 text-neutral-300">
              <div className="flex items-center justify-between">
                <span>Play / Pause</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">W</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Cue Point</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">Q</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Sync BPM</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">E</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Hot Cues 1-4</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">1, 2, 3, 4</kbd>
              </div>
            </div>
          </div>

          {/* Deck B Shortcuts */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-amber-500/30 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase">
              DECK B CONTROLS
            </span>
            <div className="grid grid-cols-2 gap-2 text-neutral-300">
              <div className="flex items-center justify-between">
                <span>Play / Pause</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">I</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Cue Point</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">U</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Sync BPM</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">O</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Hot Cues 1-4</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">7, 8, 9, 0</kbd>
              </div>
            </div>
          </div>

          {/* Master Mixer Shortcuts */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-neutral-300 uppercase">
              MIXER & CROSSFADER
            </span>
            <div className="grid grid-cols-2 gap-2 text-neutral-300">
              <div className="flex items-center justify-between">
                <span>Nudge Left (Deck A)</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">[</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Nudge Right (Deck B)</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">]</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Snap 50/50 Center</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">Space</kbd>
              </div>
            </div>
          </div>

          {/* Sound FX Sampler */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-neutral-300 uppercase">
              SAMPLER FX PADS
            </span>
            <div className="grid grid-cols-2 gap-2 text-neutral-300">
              <div className="flex items-center justify-between">
                <span>Airhorn Blast</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">H</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>808 Bass Drop</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">B</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>DJ Siren</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">N</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Tape Stop</span>
                <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-white">T</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
