import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface DeckPitchBpmProps {
  baseBpm: number;
  effectiveBpm: number;
  pitch: number; // percentage (-8 to +8, etc.)
  pitchRange: 8 | 16 | 50;
  keyLock: boolean;
  musicalKey: string;
  oppositeBpm?: number;
  onChangePitch: (val: number) => void;
  onSetPitchRange: (range: 8 | 16 | 50) => void;
  onToggleKeyLock: () => void;
  onSyncBpm: () => void;
  onTapBpm: () => void;
  accentColor: 'cyan' | 'orange';
}

export const DeckPitchBpm: React.FC<DeckPitchBpmProps> = ({
  baseBpm,
  effectiveBpm,
  pitch,
  pitchRange,
  keyLock,
  musicalKey,
  oppositeBpm,
  onChangePitch,
  onSetPitchRange,
  onToggleKeyLock,
  onSyncBpm,
  onTapBpm,
  accentColor,
}) => {
  const isCyan = accentColor === 'cyan';
  const syncGlow = isCyan
    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30'
    : 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30';

  const isBpmMatched =
    oppositeBpm && Math.abs(effectiveBpm - oppositeBpm) < 0.2;

  // Pitch slider value maps -pitchRange to +pitchRange
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChangePitch(val);
  };

  const handleResetPitch = () => {
    onChangePitch(0);
  };

  return (
    <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800/80 shadow-inner flex flex-col justify-between">
      {/* Top Header: BPM and Key */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight">
              {effectiveBpm.toFixed(1)}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-semibold">
              BPM
            </span>
            {pitch !== 0 && (
              <span className={`text-[10px] font-mono ${pitch > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ({pitch > 0 ? `+${pitch.toFixed(1)}%` : `${pitch.toFixed(1)}%`})
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-2">
            <span>KEY: <strong className="text-neutral-300">{musicalKey || 'N/A'}</strong></span>
            <span>BASE: {baseBpm}</span>
          </div>
        </div>

        {/* Sync & Tap Buttons */}
        <div className="flex flex-col gap-1.5 items-end">
          <button
            onClick={onSyncBpm}
            className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wider border uppercase transition-all shadow-sm active:scale-95 ${
              isBpmMatched
                ? `${isCyan ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-amber-500 text-black border-amber-400'} shadow-md`
                : syncGlow
            }`}
            title={`Sync BPM with opposite deck (${oppositeBpm ? oppositeBpm.toFixed(1) : 'target'} BPM)`}
          >
            SYNC
          </button>

          <button
            onClick={onTapBpm}
            className="px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 hover:border-neutral-700 active:scale-95 uppercase"
            title="Tap along to the beat to calculate BPM"
          >
            TAP BPM
          </button>
        </div>
      </div>

      {/* Pitch Fader & Range Controls */}
      <div className="flex items-center gap-3 mt-3">
        {/* Left Side: Range & Master Tempo */}
        <div className="flex flex-col gap-2">
          {/* Key Lock (Master Tempo) */}
          <button
            onClick={onToggleKeyLock}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
              keyLock
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/60'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
            title="Key Lock / Master Tempo preserves vocal key when changing speed"
          >
            {keyLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span>KEY LOCK</span>
          </button>

          {/* Range Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded border border-neutral-800 text-[10px] font-mono">
            {([8, 16, 50] as const).map(rng => (
              <button
                key={rng}
                onClick={() => onSetPitchRange(rng)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  pitchRange === rng
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                ±{rng}%
              </button>
            ))}
          </div>

          <button
            onClick={handleResetPitch}
            className="text-[9px] font-mono text-neutral-500 hover:text-neutral-300 uppercase text-center mt-1"
            title="Reset pitch slider to 0%"
          >
            0% DETENT
          </button>
        </div>

        {/* Pitch Slider Track */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-[9px] font-mono text-neutral-500 px-1 mb-1">
            <span>-{pitchRange}%</span>
            <span className={pitch === 0 ? 'text-neutral-300 font-bold' : ''}>0%</span>
            <span>+{pitchRange}%</span>
          </div>

          <input
            type="range"
            min={-pitchRange}
            max={pitchRange}
            step="0.05"
            value={pitch}
            onChange={handleSliderChange}
            className="w-full h-2 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-neutral-200 border border-neutral-800 focus:outline-none"
            title={`Tempo Pitch: ${pitch > 0 ? `+${pitch.toFixed(2)}` : pitch.toFixed(2)}%`}
          />
        </div>
      </div>
    </div>
  );
};
