import React, { useState } from 'react';
import { MixHistoryEvent, DeckState } from '../types/dj';
import { X, Copy, Check, Download, Radio, ListMusic } from 'lucide-react';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRecording: boolean;
  events: MixHistoryEvent[];
  deckA: DeckState;
  deckB: DeckState;
  onToggleRecording: () => void;
  onClearHistory: () => void;
}

export const RecordingModal: React.FC<RecordingModalProps> = ({
  isOpen,
  onClose,
  isRecording,
  events,
  deckA,
  deckB,
  onToggleRecording,
  onClearHistory,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sessionRecipe = {
    title: `DJ YouTube Mashup Session (${new Date().toLocaleDateString()})`,
    date: new Date().toISOString(),
    deckA: {
      videoId: deckA.track?.videoId,
      title: deckA.track?.title,
      artist: deckA.track?.artist,
      bpm: deckA.effectiveBpm,
      key: deckA.track?.key,
      hotCues: deckA.hotCues,
    },
    deckB: {
      videoId: deckB.track?.videoId,
      title: deckB.track?.title,
      artist: deckB.track?.artist,
      bpm: deckB.effectiveBpm,
      key: deckB.track?.key,
      hotCues: deckB.hotCues,
    },
    totalMixEvents: events.length,
    events: events.slice(-50), // last 50 events
  };

  const recipeString = JSON.stringify(sessionRecipe, null, 2);

  const handleCopyRecipe = () => {
    navigator.clipboard.writeText(recipeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadRecipe = () => {
    const blob = new Blob([recipeString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mashup-recipe-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-neutral-500'}`} />
            <h2 className="text-base font-mono font-bold text-white tracking-wide uppercase">
              LIVE SESSION RECORDER & RECIPE
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
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleRecording}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 border ${
                  isRecording
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30 animate-pulse'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
                <span>{isRecording ? 'RECORDING LIVE' : 'START RECORDING'}</span>
              </button>

              <span className="text-xs font-mono text-neutral-400">
                {events.length} actions logged
              </span>
            </div>

            <button
              onClick={onClearHistory}
              className="text-xs font-mono text-neutral-500 hover:text-red-400 transition-colors"
            >
              Clear Log
            </button>
          </div>

          {/* Current Mashup Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-neutral-950 p-3 rounded-lg border border-cyan-500/30">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">
                DECK A TRACK
              </span>
              <p className="font-bold text-white truncate">
                {deckA.track ? deckA.track.title : 'Empty'}
              </p>
              <p className="text-neutral-400 text-[11px] truncate">
                {deckA.track ? deckA.track.artist : '-'}
              </p>
              <p className="text-neutral-500 text-[10px] mt-1">
                {deckA.effectiveBpm.toFixed(1)} BPM · {deckA.track?.key || '-'}
              </p>
            </div>

            <div className="bg-neutral-950 p-3 rounded-lg border border-amber-500/30">
              <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">
                DECK B TRACK
              </span>
              <p className="font-bold text-white truncate">
                {deckB.track ? deckB.track.title : 'Empty'}
              </p>
              <p className="text-neutral-400 text-[11px] truncate">
                {deckB.track ? deckB.track.artist : '-'}
              </p>
              <p className="text-neutral-500 text-[10px] mt-1">
                {deckB.effectiveBpm.toFixed(1)} BPM · {deckB.track?.key || '-'}
              </p>
            </div>
          </div>

          {/* Action History Feed */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono font-bold text-neutral-400 uppercase flex items-center gap-1.5">
              <ListMusic className="w-3.5 h-3.5" />
              Recent Actions Log
            </span>

            <div className="bg-neutral-950 rounded-lg border border-neutral-800 p-2 max-h-36 overflow-y-auto flex flex-col gap-1 text-[11px] font-mono">
              {events.length === 0 ? (
                <div className="text-neutral-600 text-center py-4">
                  No actions logged yet. Play tracks, jump cues, or move crossfader.
                </div>
              ) : (
                events.slice(-12).reverse().map((evt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-neutral-400 py-0.5 border-b border-neutral-900 last:border-none">
                    <span className="text-neutral-500">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-neutral-200">
                      {evt.action}
                    </span>
                    <span className={evt.deck === 'A' ? 'text-cyan-400' : evt.deck === 'B' ? 'text-amber-400' : 'text-neutral-500'}>
                      {evt.deck ? `Deck ${evt.deck}` : evt.details || ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
            <button
              onClick={handleCopyRecipe}
              className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'RECIPE COPIED!' : 'COPY MASHUP RECIPE'}</span>
            </button>

            <button
              onClick={handleDownloadRecipe}
              className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase bg-amber-500 hover:bg-amber-400 text-black transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD RECIPE JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
