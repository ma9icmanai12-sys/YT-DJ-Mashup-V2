import React from 'react';

interface DeckEQProps {
  eq: {
    high: number;
    mid: number;
    low: number;
  };
  eqKill: {
    high: boolean;
    mid: boolean;
    low: boolean;
  };
  filter: number;
  onChangeEQ: (band: 'high' | 'mid' | 'low', val: number) => void;
  onToggleKill: (band: 'high' | 'mid' | 'low') => void;
  onChangeFilter: (val: number) => void;
  accentColor: 'cyan' | 'orange';
}

interface KnobProps {
  label: string;
  value: number; // -100 to 100
  onChange: (val: number) => void;
  isKilled?: boolean;
  accent: 'cyan' | 'orange' | 'amber';
  unit?: string;
}

const Knob: React.FC<KnobProps> = ({ label, value, onChange, isKilled, accent }) => {
  // Angle maps from -100 (at -135 deg) to +100 (at +135 deg)
  const angle = (value / 100) * 135;

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const startY = e.clientY;
    const startVal = value;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const deltaY = startY - moveEvt.clientY; // upward drag increases value
      const newVal = Math.max(-100, Math.min(100, Math.round(startVal + deltaY * 1.5)));
      onChange(newVal);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    onChange(Math.max(-100, Math.min(100, value + delta)));
  };

  const handleDoubleClick = () => {
    onChange(0); // Reset to center detent
  };

  const accentRing =
    accent === 'cyan'
      ? 'border-cyan-400'
      : accent === 'orange'
      ? 'border-amber-400'
      : 'border-emerald-400';

  const accentPointer =
    accent === 'cyan'
      ? 'bg-cyan-400 shadow-cyan-400/50'
      : accent === 'orange'
      ? 'bg-amber-400 shadow-amber-400/50'
      : 'bg-emerald-400 shadow-emerald-400/50';

  const displayDb = value === 0 ? '0' : value > 0 ? `+${(value * 0.06).toFixed(1)}` : `${(value * 0.26).toFixed(1)}`;

  return (
    <div className="flex flex-col items-center select-none" onWheel={handleWheel}>
      <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase mb-1 font-semibold">
        {label}
      </span>

      {/* Rotary Knob Chassis */}
      <div
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        className={`w-10 h-10 rounded-full relative bg-gradient-to-b from-neutral-800 to-neutral-950 border border-neutral-700 cursor-ns-resize shadow-md flex items-center justify-center transition-transform active:scale-95 touch-none ${
          isKilled ? 'opacity-30' : ''
        }`}
        title={`${label}: ${value} (Drag up/down, scroll, or double-click to reset)`}
      >
        {/* Subtle bezel track */}
        <div className="absolute inset-1 rounded-full border border-neutral-700/50 pointer-events-none" />

        {/* Center rotating core */}
        <div
          className="w-full h-full rounded-full relative flex items-center justify-center pointer-events-none"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {/* Knob pointer line */}
          <div className={`absolute top-1 w-1 h-3 rounded-full ${accentPointer} shadow-sm`} />
        </div>

        {/* Center detent notch at top */}
        <div className="absolute -top-1 w-0.5 h-1 bg-neutral-600 rounded-full pointer-events-none" />
      </div>

      {/* Value readout */}
      <span
        className={`text-[9px] font-mono mt-1 ${
          isKilled ? 'text-red-400 font-bold' : value === 0 ? 'text-neutral-500' : 'text-neutral-300'
        }`}
      >
        {isKilled ? 'KILL' : `${displayDb}dB`}
      </span>
    </div>
  );
};

export const DeckEQ: React.FC<DeckEQProps> = ({
  eq,
  eqKill,
  filter,
  onChangeEQ,
  onToggleKill,
  onChangeFilter,
  accentColor,
}) => {
  const accent = accentColor === 'cyan' ? 'cyan' : 'orange';

  return (
    <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800/80 shadow-inner flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
          3-Band EQ & Filter
        </span>
        <button
          onClick={() => {
            onChangeEQ('high', 0);
            onChangeEQ('mid', 0);
            onChangeEQ('low', 0);
            onChangeFilter(0);
          }}
          className="text-[9px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors uppercase"
          title="Reset EQ & Filter to flat"
        >
          Reset Flat
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 items-start justify-items-center">
        {/* HIGH / TREBLE */}
        <div className="flex flex-col items-center">
          <Knob
            label="HI"
            value={eq.high}
            isKilled={eqKill.high}
            onChange={(v) => onChangeEQ('high', v)}
            accent={accent}
          />
          <button
            onClick={() => onToggleKill('high')}
            className={`mt-1.5 px-1.5 py-0.5 text-[9px] font-mono rounded border transition-colors ${
              eqKill.high
                ? 'bg-red-500/20 text-red-400 border-red-500/60 shadow-sm shadow-red-500/30'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
            title="Toggle High Kill"
          >
            KILL
          </button>
        </div>

        {/* MID */}
        <div className="flex flex-col items-center">
          <Knob
            label="MID"
            value={eq.mid}
            isKilled={eqKill.mid}
            onChange={(v) => onChangeEQ('mid', v)}
            accent={accent}
          />
          <button
            onClick={() => onToggleKill('mid')}
            className={`mt-1.5 px-1.5 py-0.5 text-[9px] font-mono rounded border transition-colors ${
              eqKill.mid
                ? 'bg-red-500/20 text-red-400 border-red-500/60 shadow-sm shadow-red-500/30'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
            title="Toggle Mid Kill"
          >
            KILL
          </button>
        </div>

        {/* LOW / BASS */}
        <div className="flex flex-col items-center">
          <Knob
            label="LOW"
            value={eq.low}
            isKilled={eqKill.low}
            onChange={(v) => onChangeEQ('low', v)}
            accent={accent}
          />
          <button
            onClick={() => onToggleKill('low')}
            className={`mt-1.5 px-1.5 py-0.5 text-[9px] font-mono rounded border transition-colors ${
              eqKill.low
                ? 'bg-red-500/20 text-red-400 border-red-500/60 shadow-sm shadow-red-500/30'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
            title="Toggle Bass Kill (Swap beat)"
          >
            KILL
          </button>
        </div>

        {/* FILTER LPF / HPF */}
        <div className="flex flex-col items-center">
          <Knob
            label="COLOR"
            value={filter}
            onChange={onChangeFilter}
            accent="amber"
          />
          <span className="mt-1.5 text-[9px] font-mono text-neutral-500">
            {filter === 0 ? 'LPF/HPF' : filter < 0 ? `LPF ${Math.abs(filter)}%` : `HPF ${filter}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
