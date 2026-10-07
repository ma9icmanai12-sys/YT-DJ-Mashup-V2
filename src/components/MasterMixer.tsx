import React, { useState, useEffect } from 'react';
import { CrossfaderCurve } from '../types/dj';
import { Volume2, VolumeX, Headphones, Play, Sliders } from 'lucide-react';

interface MasterMixerProps {
  volumeA: number;
  volumeB: number;
  masterVolume: number;
  crossfader: number; // -1 (Deck A) to +1 (Deck B)
  crossfaderCurve: CrossfaderCurve;
  pflA: boolean;
  pflB: boolean;
  isDeckAPlaying: boolean;
  isDeckBPlaying: boolean;
  onChangeVolumeA: (vol: number) => void;
  onChangeVolumeB: (vol: number) => void;
  onChangeMasterVolume: (vol: number) => void;
  onChangeCrossfader: (cf: number) => void;
  onChangeCurve: (curve: CrossfaderCurve) => void;
  onTogglePflA: () => void;
  onTogglePflB: () => void;
  onStartAutoTransition: (durationSec: number) => void;
  isAutoTransitioning: boolean;
  autoTransitionProgress: number;
}

export const MasterMixer: React.FC<MasterMixerProps> = ({
  volumeA,
  volumeB,
  masterVolume,
  crossfader,
  crossfaderCurve,
  pflA,
  pflB,
  isDeckAPlaying,
  isDeckBPlaying,
  onChangeVolumeA,
  onChangeVolumeB,
  onChangeMasterVolume,
  onChangeCrossfader,
  onChangeCurve,
  onTogglePflA,
  onTogglePflB,
  onStartAutoTransition,
  isAutoTransitioning,
  autoTransitionProgress,
}) => {
  // Animated simulated peak levels for VU meters
  const [levelA, setLevelA] = useState(0);
  const [levelB, setLevelB] = useState(0);
  const [levelMaster, setLevelMaster] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate pulsating club audio signal when playing
      const rawA = isDeckAPlaying ? (volumeA / 100) * (0.65 + Math.random() * 0.35) : 0;
      const rawB = isDeckBPlaying ? (volumeB / 100) * (0.65 + Math.random() * 0.35) : 0;

      // Crossfader weighting
      const cfPos = (crossfader + 1) / 2; // 0 (Deck A) to 1 (Deck B)
      const outA = rawA * (1 - cfPos * 0.85);
      const outB = rawB * (cfPos * 0.85 + 0.15);
      const masterSig = Math.min(1, (outA + outB) * (masterVolume / 100));

      setLevelA(rawA);
      setLevelB(rawB);
      setLevelMaster(masterSig);
    }, 80);

    return () => clearInterval(interval);
  }, [isDeckAPlaying, isDeckBPlaying, volumeA, volumeB, masterVolume, crossfader]);

  const renderVuMeter = (level: number, label: string) => {
    const totalSegments = 14;
    const activeSegments = Math.round(level * totalSegments);

    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[8px] font-mono text-neutral-500 uppercase">{label}</span>
        <div className="w-2.5 h-36 bg-neutral-950 rounded-sm p-0.5 border border-neutral-800 flex flex-col-reverse justify-between gap-[1px]">
          {Array.from({ length: totalSegments }).map((_, idx) => {
            const isActive = idx < activeSegments;
            let color = 'bg-emerald-500';
            if (idx >= totalSegments - 2) color = 'bg-red-500';
            else if (idx >= totalSegments - 5) color = 'bg-amber-400';

            return (
              <div
                key={idx}
                className={`w-full h-2 rounded-[1px] transition-all duration-75 ${
                  isActive ? `${color} shadow-sm shadow-current` : 'bg-neutral-800/40'
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full lg:w-72 flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-2xl justify-between gap-3">
      {/* Mixer Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5 text-neutral-300">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase">
            MASTER MIXER
          </span>
        </div>

        {/* Master Output Level */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[11px] font-mono text-neutral-300 font-bold">
            {masterVolume}%
          </span>
        </div>
      </div>

      {/* Main Channel Faders & Peak Meters Section */}
      <div className="grid grid-cols-4 gap-2 items-center justify-items-center py-1">
        {/* DECK A Channel Fader */}
        <div className="flex flex-col items-center gap-1 w-full">
          <div className="flex items-center justify-between w-full px-1">
            <span className="text-[10px] font-mono font-bold text-cyan-400">CH-A</span>
            <span className="text-[9px] font-mono text-neutral-400">{volumeA}%</span>
          </div>

          {/* Fader Track */}
          <div className="relative h-36 flex items-center justify-center">
            <input
              type="range"
              min="0"
              max="100"
              value={volumeA}
              onChange={(e) => onChangeVolumeA(parseInt(e.target.value, 10))}
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              className="h-32 w-4 bg-neutral-950 rounded appearance-none cursor-pointer accent-cyan-400 border border-neutral-800"
              title={`Deck A Channel Fader: ${volumeA}%`}
            />
          </div>

          {/* Headphone PFL Toggle */}
          <button
            onClick={onTogglePflA}
            className={`mt-1 p-1 rounded text-[10px] font-mono flex items-center gap-0.5 border transition-colors ${
              pflA
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400 shadow-sm'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
            title="Headphone Cue Listen (Deck A)"
          >
            <Headphones className="w-3 h-3" />
            <span>CUE</span>
          </button>
        </div>

        {/* Channel VU Meters */}
        {renderVuMeter(levelA, 'VU-A')}
        {renderVuMeter(levelB, 'VU-B')}

        {/* DECK B Channel Fader */}
        <div className="flex flex-col items-center gap-1 w-full">
          <div className="flex items-center justify-between w-full px-1">
            <span className="text-[10px] font-mono font-bold text-amber-400">CH-B</span>
            <span className="text-[9px] font-mono text-neutral-400">{volumeB}%</span>
          </div>

          {/* Fader Track */}
          <div className="relative h-36 flex items-center justify-center">
            <input
              type="range"
              min="0"
              max="100"
              value={volumeB}
              onChange={(e) => onChangeVolumeB(parseInt(e.target.value, 10))}
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              className="h-32 w-4 bg-neutral-950 rounded appearance-none cursor-pointer accent-amber-400 border border-neutral-800"
              title={`Deck B Channel Fader: ${volumeB}%`}
            />
          </div>

          {/* Headphone PFL Toggle */}
          <button
            onClick={onTogglePflB}
            className={`mt-1 p-1 rounded text-[10px] font-mono flex items-center gap-0.5 border transition-colors ${
              pflB
                ? 'bg-amber-500/20 text-amber-400 border-amber-400 shadow-sm'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
            title="Headphone Cue Listen (Deck B)"
          >
            <Headphones className="w-3 h-3" />
            <span>CUE</span>
          </button>
        </div>
      </div>

      {/* Auto-Transition Controller */}
      <div className="bg-neutral-950/70 p-2 rounded-lg border border-neutral-800/80 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span className="font-semibold uppercase flex items-center gap-1">
            <Play className="w-2.5 h-2.5 text-amber-400" />
            AUTO TRANSITION
          </span>
          {isAutoTransitioning && (
            <span className="text-amber-400 font-bold animate-pulse">
              TRANSITIONING...
            </span>
          )}
        </div>

        {/* Transition Buttons */}
        <div className="grid grid-cols-4 gap-1">
          {[4, 8, 16, 32].map(secs => (
            <button
              key={secs}
              disabled={isAutoTransitioning}
              onClick={() => onStartAutoTransition(secs)}
              className="py-1 rounded text-[10px] font-mono font-bold bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 hover:text-amber-300 text-neutral-400 disabled:opacity-40 transition-colors"
              title={`Auto-fade to the opposite deck over ${secs} seconds`}
            >
              {secs}s
            </button>
          ))}
        </div>

        {/* Transition progress bar */}
        {isAutoTransitioning && (
          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mt-0.5">
            <div
              className="bg-amber-400 h-full transition-all duration-100"
              style={{ width: `${autoTransitionProgress * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Pro Crossfader Section */}
      <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
            CROSSFADER
          </span>

          {/* Curve Selector */}
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded border border-neutral-800 text-[9px] font-mono">
            {(['smooth', 'linear', 'cut'] as const).map(c => (
              <button
                key={c}
                onClick={() => onChangeCurve(c)}
                className={`px-1.5 py-0.5 rounded uppercase transition-colors ${
                  crossfaderCurve === c
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title={`Crossfader Curve: ${c}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Crossfader Track with Deck indicators */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeCrossfader(-1)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all border ${
              crossfader <= -0.95
                ? 'bg-cyan-500 text-black border-cyan-400'
                : 'bg-neutral-900 text-cyan-400 border-neutral-800 hover:border-cyan-500/50'
            }`}
            title="Snap Crossfader 100% to Deck A"
          >
            A
          </button>

          <div className="flex-1 flex flex-col">
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={crossfader}
              onChange={(e) => onChangeCrossfader(parseFloat(e.target.value))}
              className="w-full h-3 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-amber-400 border border-neutral-800"
              title={`Crossfader: ${crossfader < 0 ? `Deck A ${Math.round(Math.abs(crossfader) * 100)}%` : crossfader > 0 ? `Deck B ${Math.round(crossfader * 100)}%` : 'Center 50/50'}`}
            />
            {/* Center tick */}
            <div className="flex justify-between text-[8px] font-mono text-neutral-500 px-1 mt-0.5">
              <span>DECK A</span>
              <button
                onClick={() => onChangeCrossfader(0)}
                className="hover:text-white transition-colors"
                title="Reset to 50/50 Center"
              >
                [CENTER]
              </button>
              <span>DECK B</span>
            </div>
          </div>

          <button
            onClick={() => onChangeCrossfader(1)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all border ${
              crossfader >= 0.95
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-neutral-900 text-amber-400 border-neutral-800 hover:border-amber-500/50'
            }`}
            title="Snap Crossfader 100% to Deck B"
          >
            B
          </button>
        </div>
      </div>

      {/* Master Volume Slider */}
      <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
        <Volume2 className="w-4 h-4 text-neutral-400 shrink-0" />
        <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold shrink-0">
          MAIN OUT:
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={masterVolume}
          onChange={(e) => onChangeMasterVolume(parseInt(e.target.value, 10))}
          className="flex-1 h-1.5 bg-neutral-950 rounded appearance-none cursor-pointer accent-white border border-neutral-800"
          title={`Master Volume: ${masterVolume}%`}
        />
        <span className="text-[10px] font-mono text-neutral-300 w-8 text-right font-bold">
          {masterVolume}%
        </span>
      </div>
    </div>
  );
};
