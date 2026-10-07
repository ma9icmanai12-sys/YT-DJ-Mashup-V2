import React, { useState } from 'react';
import { audioFx } from '../services/audioFx';
import { Sparkles, Volume2 } from 'lucide-react';

interface PadConfig {
  id: string;
  name: string;
  subtext: string;
  keyHint: string;
  color: string;
  play: () => void;
}

export const SamplerPads: React.FC = () => {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [samplerVolume, setSamplerVolume] = useState<number>(85);

  const pads: PadConfig[] = [
    {
      id: 'airhorn',
      name: 'AIRHORN',
      subtext: 'Club Blast',
      keyHint: 'H',
      color: '#ef4444', // Red
      play: () => audioFx.playAirhorn(),
    },
    {
      id: 'sub808',
      name: '808 DROP',
      subtext: 'Sub Bass Boom',
      keyHint: 'B',
      color: '#f97316', // Orange
      play: () => audioFx.play808Drop(),
    },
    {
      id: 'siren',
      name: 'DJ SIREN',
      subtext: 'Dub Sweep',
      keyHint: 'N',
      color: '#eab308', // Yellow
      play: () => audioFx.playSiren(),
    },
    {
      id: 'tape-stop',
      name: 'TAPE STOP',
      subtext: 'Vinyl Brake',
      keyHint: 'T',
      color: '#10b981', // Emerald
      play: () => audioFx.playVinylBrake(),
    },
    {
      id: 'laser',
      name: 'LASER ZAP',
      subtext: 'Rave Synth',
      keyHint: 'L',
      color: '#06b6d4', // Cyan
      play: () => audioFx.playLaser(),
    },
    {
      id: 'backspin',
      name: 'BACKSPIN',
      subtext: 'Vinyl Rewind',
      keyHint: 'R',
      color: '#3b82f6', // Blue
      play: () => audioFx.playBackspin(),
    },
    {
      id: 'rave-stab',
      name: 'RAVE STAB',
      subtext: 'House Chord',
      keyHint: 'S',
      color: '#8b5cf6', // Violet
      play: () => audioFx.playRaveStab(),
    },
    {
      id: 'click',
      name: 'BEAT CLICK',
      subtext: 'Sync Tick',
      keyHint: 'M',
      color: '#ec4899', // Pink
      play: () => audioFx.playBeatClick(true),
    },
  ];

  const handleTrigger = (pad: PadConfig) => {
    setActivePad(pad.id);
    pad.play();
    setTimeout(() => {
      setActivePad(prev => (prev === pad.id ? null : prev));
    }, 200);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSamplerVolume(val);
    audioFx.setVolume(val / 100);
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl flex flex-col gap-2.5">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5 text-neutral-300">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase">
            DJ SAMPLER & SOUND FX BANK
          </span>
        </div>

        {/* Sampler Volume Slider */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-[10px] font-mono text-neutral-400">VOL:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={samplerVolume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-neutral-950 rounded appearance-none cursor-pointer accent-cyan-400"
            title={`Sampler Volume: ${samplerVolume}%`}
          />
          <span className="text-[10px] font-mono text-neutral-400 w-7 text-right">
            {samplerVolume}%
          </span>
        </div>
      </div>

      {/* 8 Performance Pads Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {pads.map((pad) => {
          const isTriggered = activePad === pad.id;

          return (
            <button
              key={pad.id}
              onClick={() => handleTrigger(pad)}
              className={`h-16 rounded-lg p-2 flex flex-col justify-between items-start transition-all active:scale-95 border select-none relative overflow-hidden group ${
                isTriggered
                  ? 'brightness-125 scale-[0.98]'
                  : 'hover:brightness-110'
              }`}
              style={{
                backgroundColor: isTriggered ? `${pad.color}44` : '#0d0d0d',
                borderColor: isTriggered ? pad.color : '#262626',
                boxShadow: isTriggered ? `0 0 15px ${pad.color}88` : 'none',
              }}
              title={`Trigger ${pad.name} [Shortcut: ${pad.keyHint}]`}
            >
              {/* Top Row: Name and Key badge */}
              <div className="w-full flex items-center justify-between">
                <span className="text-[11px] font-mono font-black tracking-tight" style={{ color: pad.color }}>
                  {pad.name}
                </span>
                <span className="text-[9px] font-mono text-neutral-500 group-hover:text-neutral-300 bg-neutral-900 px-1 py-0.2 rounded border border-neutral-800">
                  {pad.keyHint}
                </span>
              </div>

              {/* Bottom Subtext */}
              <span className="text-[9px] font-mono text-neutral-400 truncate w-full text-left">
                {pad.subtext}
              </span>

              {/* Glowing Bottom Line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 transition-opacity"
                style={{
                  backgroundColor: pad.color,
                  opacity: isTriggered ? 1 : 0.4,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
