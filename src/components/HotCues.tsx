import React from 'react';
import { HotCue } from '../types/dj';
import { Trash2, Bookmark } from 'lucide-react';

interface HotCuesProps {
  cues: HotCue[];
  currentTime: number;
  onTriggerCue: (id: number) => void;
  onDeleteCue: (id: number) => void;
  accentColor: 'cyan' | 'orange';
}

const PAD_COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#ec4899']; // Cyan, Amber, Emerald, Pink

export const HotCues: React.FC<HotCuesProps> = ({
  cues,
  currentTime,
  onTriggerCue,
  onDeleteCue,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800/80 shadow-inner">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-2.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
          <Bookmark className="w-3 h-3 text-neutral-400" />
          HOT CUES
        </span>
        <span className="text-[9px] font-mono text-neutral-500">
          Click to Set / Jump
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(padNum => {
          const cue = cues.find(c => c.id === padNum);
          const padColor = PAD_COLORS[padNum - 1];

          return (
            <div key={padNum} className="relative group">
              <button
                onClick={() => onTriggerCue(padNum)}
                className={`w-full h-14 rounded flex flex-col items-center justify-between p-1.5 font-mono text-xs transition-all active:scale-95 border select-none ${
                  cue
                    ? 'shadow-md border-neutral-600 hover:brightness-125'
                    : 'bg-neutral-950/90 border-dashed border-neutral-800 text-neutral-600 hover:border-neutral-700 hover:text-neutral-400'
                }`}
                style={
                  cue
                    ? {
                        backgroundColor: `${padColor}22`,
                        borderColor: `${padColor}88`,
                        color: padColor,
                        boxShadow: `0 0 10px ${padColor}33`,
                      }
                    : {}
                }
                title={
                  cue
                    ? `Jump to Cue ${padNum} (${formatTime(cue.time)})`
                    : `Set Cue ${padNum} at current time (${formatTime(currentTime)})`
                }
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-[11px]">{padNum}</span>
                  {cue && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: padColor }} />
                  )}
                </div>

                <div className="text-[9px] font-semibold truncate w-full text-center">
                  {cue ? formatTime(cue.time) : '+ SET'}
                </div>
              </button>

              {/* Delete Cue Button (visible on hover) */}
              {cue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCue(padNum);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-red-400 hover:border-red-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Clear Cue"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
