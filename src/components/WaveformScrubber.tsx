import React, { useRef, useMemo } from 'react';
import { HotCue } from '../types/dj';

interface WaveformScrubberProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  hotCues: HotCue[];
  loopActive: boolean;
  loopStartTime: number | null;
  loopDuration: number;
  onSeek: (seconds: number) => void;
  accentColor: 'cyan' | 'orange';
}

export const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
  currentTime,
  duration,
  isPlaying,
  hotCues,
  loopActive,
  loopStartTime,
  loopDuration,
  onSeek,
  accentColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate pseudo waveform bars based on track length
  const barCount = 70;
  const waveformBars = useMemo(() => {
    const bars: number[] = [];
    let prev = 0.5;
    for (let i = 0; i < barCount; i++) {
      // Create organic club track energy shape (buildup, drop, break)
      const phase = (i / barCount) * Math.PI * 4;
      const energy = 0.4 + 0.4 * Math.sin(phase) + 0.2 * (Math.random() - 0.5);
      const val = Math.max(0.15, Math.min(0.95, 0.7 * prev + 0.3 * energy));
      bars.push(val);
      prev = val;
    }
    return bars;
  }, [barCount]);

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const isCyan = accentColor === 'cyan';
  const barActiveColor = isCyan ? 'bg-cyan-400' : 'bg-amber-400';
  const playheadColor = isCyan ? 'bg-cyan-300 shadow-cyan-400/80' : 'bg-amber-300 shadow-amber-400/80';

  // Calculate loop region
  let loopLeft = 0;
  let loopWidth = 0;
  if (loopActive && loopStartTime !== null && duration > 0) {
    loopLeft = (loopStartTime / duration) * 100;
    loopWidth = (loopDuration / duration) * 100;
  }

  return (
    <div className="w-full flex flex-col gap-1 select-none">
      {/* Time Readout Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-0.5">
        <span className="font-bold text-neutral-200">
          {formatTime(currentTime)}
        </span>
        <span className="text-neutral-500">
          -{formatTime(Math.max(0, duration - currentTime))}
        </span>
      </div>

      {/* Interactive Waveform Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="relative w-full h-11 bg-neutral-950/90 rounded border border-neutral-800 hover:border-neutral-700 cursor-pointer overflow-hidden flex items-center px-1"
        title="Waveform Overview (Click anywhere to jump)"
      >
        {/* Background Grid Lines (Measure markers) */}
        <div className="absolute inset-0 grid grid-cols-8 divide-x divide-neutral-900 pointer-events-none" />

        {/* Center horizontal axis */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-800/80 pointer-events-none" />

        {/* Waveform Bars */}
        <div className="w-full h-full flex items-center justify-between gap-[2px] relative z-10 pointer-events-none">
          {waveformBars.map((height, idx) => {
            const barPercent = (idx / barCount) * 100;
            const isPassed = barPercent <= progressPercent;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-center h-full"
              >
                <div
                  className={`w-full rounded-sm transition-colors duration-150 ${
                    isPassed
                      ? `${barActiveColor} opacity-90`
                      : 'bg-neutral-700/60 opacity-60'
                  }`}
                  style={{
                    height: `${height * 85}%`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Loop Region Box */}
        {loopActive && loopStartTime !== null && (
          <div
            className={`absolute top-0 bottom-0 pointer-events-none border-x-2 border-dashed z-20 ${
              isCyan ? 'bg-cyan-500/15 border-cyan-400' : 'bg-amber-500/15 border-amber-400'
            }`}
            style={{
              left: `${Math.max(0, loopLeft)}%`,
              width: `${Math.max(1, loopWidth)}%`,
            }}
          />
        )}

        {/* Hot Cue Flags on Scrubber */}
        {hotCues.map(cue => {
          if (duration <= 0) return null;
          const cueLeft = (cue.time / duration) * 100;
          return (
            <div
              key={cue.id}
              className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center"
              style={{ left: `${cueLeft}%` }}
              title={`Cue ${cue.id}`}
            >
              <div
                className="w-2.5 h-2.5 rounded-sm text-[8px] font-mono font-bold text-black flex items-center justify-center -translate-x-1/2 shadow-sm"
                style={{ backgroundColor: cue.color }}
              >
                {cue.id}
              </div>
              <div
                className="w-0.5 flex-1 opacity-75 -translate-x-1/2"
                style={{ backgroundColor: cue.color }}
              />
            </div>
          );
        })}

        {/* Moving Playhead Needle */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center"
          style={{ left: `${progressPercent}%` }}
        >
          <div className={`w-1 h-full ${playheadColor} shadow-md -translate-x-1/2 ${isPlaying ? 'animate-pulse' : ''}`} />
        </div>
      </div>
    </div>
  );
};
