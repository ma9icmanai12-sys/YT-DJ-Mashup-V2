import React from 'react';
import { DeckState, DeckTrack } from '../types/dj';
import { TurntableJogWheel } from './TurntableJogWheel';
import { DeckEQ } from './DeckEQ';
import { DeckPitchBpm } from './DeckPitchBpm';
import { HotCues } from './HotCues';
import { BeatLoop } from './BeatLoop';
import { WaveformScrubber } from './WaveformScrubber';
import { DeckQuickSearch } from './DeckQuickSearch';
import { Play, Pause, Disc3, FolderOpen } from 'lucide-react';

interface DeckProps {
  state: DeckState;
  oppositeDeckTrack: DeckTrack | null;
  oppositeEffectiveBpm?: number;
  onPlayPause: () => void;
  onCue: () => void;
  onSeek: (seconds: number) => void;
  onScratch: (deltaSec: number) => void;
  onNudge: (dir: 1 | -1) => void;
  onChangePitch: (val: number) => void;
  onSetPitchRange: (range: 8 | 16 | 50) => void;
  onToggleKeyLock: () => void;
  onSyncBpm: () => void;
  onTapBpm: () => void;
  onChangeEQ: (band: 'high' | 'mid' | 'low', val: number) => void;
  onToggleKill: (band: 'high' | 'mid' | 'low') => void;
  onChangeFilter: (val: number) => void;
  onTriggerCue: (id: number) => void;
  onDeleteCue: (id: number) => void;
  onSetLoop: (beats: number) => void;
  onToggleLoop: () => void;
  onHalveLoop: () => void;
  onDoubleLoop: () => void;
  onOpenCrateModal: () => void;
  onLoadTrack: (track: DeckTrack) => void;
  customTracks?: DeckTrack[];
  showVideo: boolean;
}

export const Deck: React.FC<DeckProps> = ({
  state,
  oppositeEffectiveBpm,
  onPlayPause,
  onCue,
  onSeek,
  onScratch,
  onNudge,
  onChangePitch,
  onSetPitchRange,
  onToggleKeyLock,
  onSyncBpm,
  onTapBpm,
  onChangeEQ,
  onToggleKill,
  onChangeFilter,
  onTriggerCue,
  onDeleteCue,
  onSetLoop,
  onToggleLoop,
  onHalveLoop,
  onDoubleLoop,
  onOpenCrateModal,
  onLoadTrack,
  customTracks = [],
  showVideo,
}) => {
  const isDeckA = state.id === 'A';
  const accentColor = isDeckA ? 'cyan' : 'orange';
  const accentBorder = isDeckA ? 'border-cyan-500/30' : 'border-amber-500/30';
  const accentBadge = isDeckA
    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

  // Calculate loop length in seconds based on current effective BPM
  const loopDuration = (60 / Math.max(20, state.effectiveBpm)) * state.loop.lengthBeats;

  return (
    <div className={`flex-1 flex flex-col bg-neutral-950 rounded-2xl border-2 ${accentBorder} p-3.5 sm:p-4 shadow-2xl gap-3.5 relative overflow-hidden group`}>
      {/* FULL DECK GUI VIDEO BACKGROUND: Fills the entire table area (cue/pause, spin record, timeline, faders) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Track Video Artwork Backdrop filling the entire deck GUI */}
        {state.track?.thumbnailUrl && (
          <img
            src={state.track.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover scale-110 pointer-events-none filter contrast-125 saturate-125 opacity-35 group-hover:opacity-50 transition-opacity duration-300"
          />
        )}

        {/* Dark frosted glass overlay so all controls, faders, knobs, waveforms, and turntables remain 100% readable */}
        <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-[2px] pointer-events-none" />

        {/* Ambient neon deck accent gradient */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            isDeckA
              ? 'bg-gradient-to-b from-cyan-950/30 via-transparent to-black/85'
              : 'bg-gradient-to-b from-amber-950/30 via-transparent to-black/85'
          }`}
        />
      </div>

      {/* Real GUI controls sit in z-10 with clean frosted glass styling */}
      <div className="relative z-10 flex flex-col gap-3.5 flex-1 justify-between">
        {/* Deck Header: Deck Badge & Track Info & Quick Search & Load Track */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/80 pb-3 gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Deck Badge */}
            <div className={`px-2.5 py-1 rounded text-xs font-mono font-black tracking-widest uppercase border ${accentBadge}`}>
              DECK {state.id}
            </div>

            {/* Track metadata */}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-white truncate leading-snug">
                {state.track ? state.track.title : `Deck ${state.id} Empty`}
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 truncate">
                <span>{state.track ? state.track.artist : 'Load a track to start'}</span>
                {state.track?.genre && (
                  <>
                    <span aria-hidden="true" className="text-neutral-600">·</span>
                    <span className="text-neutral-500">{state.track.genre}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls: Search Input + Load Track Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Search Next to Load Track */}
            <DeckQuickSearch
              deckId={state.id}
              onLoadTrack={onLoadTrack}
              accentColor={accentColor}
              customTracks={customTracks}
            />

            {/* Load Track Button */}
            <button
              onClick={onOpenCrateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-neutral-500 transition-colors shrink-0 active:scale-95 shadow-sm"
              title="Browse Mashup crates & full catalog"
            >
              <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">LOAD TRACK</span>
              <span className="sm:hidden">CRATE</span>
            </button>
          </div>
        </div>

        {/* Waveform Scrubber Timeline */}
        <WaveformScrubber
          currentTime={state.currentTime}
          duration={state.duration}
          isPlaying={state.isPlaying}
          hotCues={state.hotCues}
          loopActive={state.loop.active}
          loopStartTime={state.loop.startTime}
          loopDuration={loopDuration}
          onSeek={onSeek}
          accentColor={accentColor}
        />

        {/* Main DJ Transport: Big CDJ PLAY / CUE and Turntable Spin Record */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Left Side: Massive Pioneer-style CUE & PLAY buttons */}
          <div className="md:col-span-4 flex items-center gap-2">
            {/* CUE Button */}
            <button
              onClick={onCue}
              className={`flex-1 h-14 rounded-xl flex flex-col items-center justify-center font-mono font-black text-sm tracking-wider uppercase border transition-all active:scale-95 shadow-md ${
                isDeckA
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/20 active:bg-cyan-500 active:text-black'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20 active:bg-amber-500 active:text-black'
              }`}
              title="Cue: Return to cue point and pause (Hold to preview)"
            >
              <span>CUE</span>
              <span className="text-[9px] font-normal text-neutral-400">PFL</span>
            </button>

            {/* PLAY / PAUSE Button */}
            <button
              onClick={onPlayPause}
              className={`flex-1 h-14 rounded-xl flex flex-col items-center justify-center font-mono font-black text-sm tracking-wider uppercase border transition-all active:scale-95 shadow-md ${
                state.isPlaying
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/40 animate-pulse'
                  : 'bg-neutral-900/90 text-emerald-400 border-emerald-500/40 hover:bg-neutral-800'
              }`}
              title={state.isPlaying ? 'Pause Deck' : 'Play Deck'}
            >
              <div className="flex items-center gap-1">
                {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{state.isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </div>
              <span className="text-[9px] font-normal opacity-80">
                {state.isPlaying ? 'RUNNING' : 'STANDBY'}
              </span>
            </button>
          </div>

          {/* Middle: Turntable Jog Wheel floating over the glowing full-deck video */}
          <div className="md:col-span-8 flex justify-center">
            <TurntableJogWheel
              deckId={state.id}
              isPlaying={state.isPlaying}
              trackTitle={state.track?.title}
              artist={state.track?.artist}
              thumbnailUrl={state.track?.thumbnailUrl}
              effectiveBpm={state.effectiveBpm}
              onScratch={onScratch}
              onNudge={onNudge}
              accentColor={accentColor}
            />
          </div>
        </div>

        {/* Lower Performance Controls Grid: Pitch/BPM, EQ, Hot Cues, Beat Loops */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pitch / BPM Module */}
          <DeckPitchBpm
            baseBpm={state.track ? state.track.bpm : 120}
            effectiveBpm={state.effectiveBpm}
            pitch={state.pitch}
            pitchRange={state.pitchRange}
            keyLock={state.keyLock}
            musicalKey={state.track ? state.track.key : ''}
            oppositeBpm={oppositeEffectiveBpm}
            onChangePitch={onChangePitch}
            onSetPitchRange={onSetPitchRange}
            onToggleKeyLock={onToggleKeyLock}
            onSyncBpm={onSyncBpm}
            onTapBpm={onTapBpm}
            accentColor={accentColor}
          />

          {/* 3-Band Equalizer & Filter */}
          <DeckEQ
            eq={state.eq}
            eqKill={state.eqKill}
            filter={state.filter}
            onChangeEQ={onChangeEQ}
            onToggleKill={onToggleKill}
            onChangeFilter={onChangeFilter}
            accentColor={accentColor}
          />
        </div>

        {/* Hot Cues & Beat Loops */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <HotCues
            cues={state.hotCues}
            currentTime={state.currentTime}
            onTriggerCue={onTriggerCue}
            onDeleteCue={onDeleteCue}
            accentColor={accentColor}
          />

          <BeatLoop
            effectiveBpm={state.effectiveBpm}
            loopActive={state.loop.active}
            loopLengthBeats={state.loop.lengthBeats}
            onSetLoop={onSetLoop}
            onToggleLoop={onToggleLoop}
            onHalveLoop={onHalveLoop}
            onDoubleLoop={onDoubleLoop}
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  );
};
