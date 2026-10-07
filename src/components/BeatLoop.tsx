import React from 'react';
import { Repeat } from 'lucide-react';

interface BeatLoopProps {
  effectiveBpm: number;
  loopActive: boolean;
  loopLengthBeats: number;
  onSetLoop: (beats: number) => void;
  onToggleLoop: () => void;
  onHalveLoop: () => void;
  onDoubleLoop: () => void;
  accentColor: 'cyan' | 'orange';
}

const LOOP_OPTIONS = [0.5, 1, 2, 4, 8, 16];

export const BeatLoop: React.FC<BeatLoopProps> = ({
  loopActive,
  loopLengthBeats,
  onSetLoop,
  onToggleLoop,
  onHalveLoop,
  onDoubleLoop,
  accentColor,
}) => {
  const isCyan = accentColor === 'cyan';
  const activeBg = isCyan ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-amber-500 text-black border-amber-400';
  const activeGlow = isCyan ? 'shadow-cyan-500/40 border-cyan-400' : 'shadow-amber-500/40 border-amber-400';

  return (
    <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800/80 shadow-inner">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-2.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
          <Repeat className="w-3 h-3 text-neutral-400" />
          BEAT LOOP
        </span>

        {/* Master Loop Active Toggle */}
        <button
          onClick={onToggleLoop}
          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase transition-all border active:scale-95 flex items-center gap-1 ${
            loopActive
              ? `${activeBg} shadow-md ${activeGlow} animate-pulse`
              : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
          }`}
          title="Toggle active loop on/off"
        >
          <span>{loopActive ? 'LOOP ON' : 'LOOP OFF'}</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Halve Button */}
        <button
          onClick={onHalveLoop}
          className="px-2 py-1.5 rounded text-[10px] font-mono text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 hover:border-neutral-700 active:scale-95"
          title="Halve loop length (1/2x)"
        >
          1/2x
        </button>

        {/* Beat Length Buttons */}
        <div className="grid grid-cols-6 gap-1 flex-1">
          {LOOP_OPTIONS.map(beats => {
            const isSelected = loopLengthBeats === beats;
            const label = beats < 1 ? `1/${1 / beats}` : `${beats}`;

            return (
              <button
                key={beats}
                onClick={() => onSetLoop(beats)}
                className={`py-1.5 rounded text-[10px] font-mono font-bold transition-all border active:scale-95 text-center ${
                  isSelected && loopActive
                    ? `${activeBg} shadow-sm`
                    : isSelected
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800/80 hover:text-white hover:border-neutral-700'
                }`}
                title={`Loop ${label} beat${beats === 1 ? '' : 's'}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Double Button */}
        <button
          onClick={onDoubleLoop}
          className="px-2 py-1.5 rounded text-[10px] font-mono text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 hover:border-neutral-700 active:scale-95"
          title="Double loop length (2x)"
        >
          2x
        </button>
      </div>
    </div>
  );
};
