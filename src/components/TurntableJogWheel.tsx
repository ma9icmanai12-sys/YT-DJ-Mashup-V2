import React, { useState, useRef, useEffect } from 'react';
import { audioFx } from '../services/audioFx';
import { Disc, RotateCcw, RotateCw } from 'lucide-react';

interface TurntableJogWheelProps {
  deckId: 'A' | 'B';
  isPlaying: boolean;
  trackTitle?: string;
  artist?: string;
  thumbnailUrl?: string;
  effectiveBpm: number;
  onScratch: (deltaSeconds: number) => void;
  onNudge: (direction: 1 | -1) => void;
  accentColor: 'cyan' | 'orange';
}

export const TurntableJogWheel: React.FC<TurntableJogWheelProps> = ({
  deckId,
  isPlaying,
  thumbnailUrl,
  effectiveBpm,
  onScratch,
  onNudge,
  accentColor,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastAngleRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const jogWheelRef = useRef<HTMLDivElement>(null);

  // Animate rotation while playing and not actively dragging
  useEffect(() => {
    if (!isPlaying || isDragging) return;

    // Standard 33.3 RPM turntable rotation (approx 200 deg/sec at 120 BPM base)
    const degPerSec = (effectiveBpm / 120) * 190;
    let animId: number;
    let lastStamp = performance.now();

    const step = (now: number) => {
      const delta = (now - lastStamp) / 1000;
      lastStamp = now;
      setRotation(prev => (prev + degPerSec * delta) % 360);
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isDragging, effectiveBpm]);

  // Calculate angle from center of jog wheel
  const getAngle = (clientX: number, clientY: number): number => {
    if (!jogWheelRef.current) return 0;
    const rect = jogWheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rad = Math.atan2(clientY - centerY, clientX - centerX);
    return (rad * 180) / Math.PI;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    lastAngleRef.current = getAngle(e.clientX, e.clientY);
    lastTimeRef.current = Date.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || lastAngleRef.current === null) return;

    const currentAngle = getAngle(e.clientX, e.clientY);
    let deltaAngle = currentAngle - lastAngleRef.current;

    // Handle crossing -180 / +180 boundary
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    const now = Date.now();
    const dt = Math.max(16, now - lastTimeRef.current);
    lastTimeRef.current = now;

    // Sensitivity: 360 degrees = ~1.8 seconds of track scrub
    const deltaSeconds = (deltaAngle / 360) * 1.8;
    const speed = Math.abs(deltaAngle) / (dt * 0.1);

    if (Math.abs(deltaAngle) > 0.8) {
      const dir = deltaAngle > 0 ? 1 : -1;
      audioFx.playScratchChirp(dir, Math.min(2.5, Math.max(0.6, speed)));
      onScratch(deltaSeconds);
      setRotation(prev => (prev + deltaAngle) % 360);
    }

    lastAngleRef.current = currentAngle;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    setIsDragging(false);
    lastAngleRef.current = null;
  };

  const isCyan = accentColor === 'cyan';
  const glowBorder = isCyan ? 'border-cyan-500/60 shadow-cyan-500/30' : 'border-amber-500/60 shadow-amber-500/30';
  const dotColor = isCyan ? 'bg-cyan-400' : 'bg-amber-400';
  const ringAccent = isCyan ? 'border-cyan-500/40' : 'border-amber-500/40';

  return (
    <div className="flex flex-col items-center">
      {/* Turntable Platter Outer Chassis */}
      <div
        ref={jogWheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full cursor-grab active:cursor-grabbing select-none p-2 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black shadow-2xl border-2 transition-all duration-200 touch-none ${
          isDragging ? `${glowBorder} shadow-lg scale-[1.01]` : 'border-neutral-700/80'
        }`}
        title="Interactive Turntable: Drag to scratch and scrub audio"
      >
        {/* Platter outer edge strobe grooves */}
        <div className="absolute inset-2 rounded-full border border-neutral-700/60 pointer-events-none opacity-80" />
        <div className="absolute inset-3 rounded-full border border-neutral-800 pointer-events-none" />

        {/* Vinyl Record Disc Body with Acrylic Smoked Glass Transparency */}
        <div
          className="w-full h-full rounded-full relative flex items-center justify-center overflow-hidden backdrop-blur-[1px]"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: `radial-gradient(circle, rgba(25,25,25,0.45) 0%, rgba(15,15,15,0.6) 45%, rgba(5,5,5,0.75) 100%)`,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), inset 0 0 4px rgba(255,255,255,0.15)',
          }}
        >
          {/* Vinyl micro-groove sheen rings */}
          <div className="absolute inset-4 rounded-full border border-neutral-800/80 pointer-events-none" />
          <div className="absolute inset-7 rounded-full border border-neutral-800/70 pointer-events-none" />
          <div className="absolute inset-10 rounded-full border border-neutral-800/60 pointer-events-none" />
          <div className="absolute inset-14 rounded-full border border-neutral-800/50 pointer-events-none" />

          {/* Light reflection highlights across vinyl grooves */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.2) 60deg, transparent 120deg, rgba(255,255,255,0.2) 240deg, transparent 300deg)',
            }}
          />

          {/* Turntable Platter Outer Visual Cue Marker (White/Cyan strobe notch) */}
          <div className={`absolute top-2 w-1.5 h-4 rounded-full ${dotColor} shadow-md shadow-current pointer-events-none`} />

          {/* Center Record Label / Spindle Artwork */}
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full relative flex items-center justify-center border-2 ${ringAccent} shadow-inner overflow-hidden bg-neutral-900 pointer-events-none`}>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="Track art"
                className="w-full h-full object-cover opacity-85"
              />
            ) : (
              <Disc className={`w-8 h-8 ${isCyan ? 'text-cyan-400' : 'text-amber-400'} opacity-75`} />
            )}

            {/* Inner Center Label Ring */}
            <div className="absolute inset-0 rounded-full border border-black/40 pointer-events-none" />

            {/* Metal Spindle Center Pin */}
            <div className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-neutral-400 via-neutral-100 to-neutral-500 shadow-md border border-neutral-600 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />
            </div>
          </div>
        </div>

        {/* Deck Indicator Pill overlay when scratching */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest bg-black/80 text-white border border-white/20 uppercase animate-pulse">
              SCRATCHING
            </span>
          </div>
        )}
      </div>

      {/* Manual Nudge Buttons */}
      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={() => onNudge(-1)}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors active:scale-95"
          title="Nudge / Bend tempo backwards"
        >
          <RotateCcw className="w-3 h-3" />
          <span>- BEND</span>
        </button>

        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
          isPlaying
            ? isCyan
              ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800'
              : 'text-amber-400 bg-amber-950/60 border-amber-800'
            : 'text-neutral-500 bg-neutral-950 border-neutral-800'
        }`}>
          {isPlaying ? `MOTOR 33 RPM · DECK ${deckId}` : `MOTOR STOPPED · DECK ${deckId}`}
        </span>

        <button
          onClick={() => onNudge(1)}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded transition-colors active:scale-95"
          title="Nudge / Bend tempo forwards"
        >
          <span>+ BEND</span>
          <RotateCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
