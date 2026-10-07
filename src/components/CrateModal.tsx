import React, { useState } from 'react';
import { DeckTrack, MashupPreset } from '../types/dj';
import { MASHUP_PRESETS, POPULAR_TRACKS } from '../data/presets';
import { extractYouTubeId } from '../services/youtube';
import { X, Search, Sparkles, Disc, Plus, Check, Music } from 'lucide-react';

interface CrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTrackToDeck: (deckId: 'A' | 'B', track: DeckTrack) => void;
  onLoadMashupPreset: (preset: MashupPreset) => void;
  onAddCustomTrack: (track: DeckTrack) => void;
  customTracks: DeckTrack[];
}

export const CrateModal: React.FC<CrateModalProps> = ({
  isOpen,
  onClose,
  onLoadTrackToDeck,
  onLoadMashupPreset,
  onAddCustomTrack,
  customTracks,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'tracks' | 'custom'>('presets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  // Custom YouTube input states
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customBpm, setCustomBpm] = useState<number>(124);
  const [customKey, setCustomKey] = useState('8A / Am');
  const [customError, setCustomError] = useState<string | null>(null);

  if (!isOpen) return null;

  const allTracks = [...POPULAR_TRACKS, ...customTracks];

  const genres = ['all', 'House / French Touch', 'Nu-Disco / Pop', 'Funk / Disco', 'Synthwave / Pop', 'Hip Hop', 'Pop Punk', 'Lo-Fi Instrumental'];

  const filteredTracks = allTracks.filter(track => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || track.genre?.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  const handleAddCustom = (deckId?: 'A' | 'B') => {
    setCustomError(null);
    const videoId = extractYouTubeId(customUrl);

    if (!videoId) {
      setCustomError('Please enter a valid YouTube URL or 11-character video ID.');
      return;
    }

    const newTrack: DeckTrack = {
      id: `custom-${Date.now()}`,
      videoId,
      title: customTitle.trim() || `YouTube Video (${videoId})`,
      artist: customArtist.trim() || 'Custom Upload',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: 240,
      bpm: Number(customBpm) || 120,
      key: customKey.trim() || '8A',
      genre: 'Custom',
      suggestedCue: 0,
    };

    onAddCustomTrack(newTrack);

    if (deckId) {
      onLoadTrackToDeck(deckId, newTrack);
      onClose();
    } else {
      setCustomUrl('');
      setCustomTitle('');
      setCustomArtist('');
      setActiveTab('tracks');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wide uppercase">
              DJ CRATE & MASHUP SELECTOR
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-800/80 border border-neutral-700 transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-2 bg-neutral-950 border-b border-neutral-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'presets'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>MASHUP PAIR PRESETS</span>
          </button>

          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'tracks'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>TRACK CRATE LIBRARY</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'custom'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>LOAD CUSTOM YOUTUBE</span>
          </button>
        </div>

        {/* Tab 1: Mashup Presets */}
        {activeTab === 'presets' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <p className="text-xs font-mono text-neutral-400">
              Curated iconic viral mashups. Click <strong>LOAD MASHUP PAIR</strong> to automatically calibrate Deck A & Deck B with harmonically matched BPMs, key adjustments, and recommended cue start points!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {MASHUP_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-neutral-950 rounded-xl border border-neutral-800 p-3.5 flex flex-col justify-between gap-3 hover:border-neutral-700 transition-all shadow-lg group"
                >
                  {/* Preset Title & Compatibility Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-mono font-bold text-white group-hover:text-amber-300 transition-colors">
                        {preset.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                        {preset.compatibilityScore}% HARMONIC MATCH
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {preset.tagline}
                    </p>
                  </div>

                  {/* Deck A vs Deck B Preview Chips */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {/* Deck A Preview */}
                    <div className="bg-neutral-900 p-2 rounded border border-cyan-500/30 flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">
                        DECK A
                      </span>
                      <span className="text-white truncate font-medium">
                        {preset.deckA.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 truncate">
                        {preset.deckA.artist}
                      </span>
                      <div className="text-[10px] text-neutral-500 mt-1">
                        {preset.deckA.bpm} BPM · {preset.deckA.key}
                      </div>
                    </div>

                    {/* Deck B Preview */}
                    <div className="bg-neutral-900 p-2 rounded border border-amber-500/30 flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        DECK B
                      </span>
                      <span className="text-white truncate font-medium">
                        {preset.deckB.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 truncate">
                        {preset.deckB.artist}
                      </span>
                      <div className="text-[10px] text-neutral-500 mt-1">
                        {preset.deckB.bpm} BPM · {preset.deckB.key}
                      </div>
                    </div>
                  </div>

                  {/* Load Action Button */}
                  <button
                    onClick={() => {
                      onLoadMashupPreset(preset);
                      onClose();
                    }}
                    className="w-full py-2 rounded-lg font-mono font-bold text-xs uppercase bg-amber-500 hover:bg-amber-400 text-black transition-colors active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>LOAD MASHUP PAIR (A + B)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Track Crate Library */}
        {activeTab === 'tracks' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {/* Search & Genre Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search by title, artist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Genre Filter */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 focus:outline-none focus:border-cyan-500/50"
              >
                {genres.map(g => (
                  <option key={g} value={g}>
                    {g === 'all' ? 'All Genres' : g}
                  </option>
                ))}
              </select>
            </div>

            {/* Track List */}
            <div className="flex flex-col gap-2">
              {filteredTracks.map(track => (
                <div
                  key={track.id}
                  className="bg-neutral-950 rounded-lg border border-neutral-800 p-2.5 flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={track.thumbnailUrl}
                      alt={track.title}
                      className="w-12 h-12 rounded object-cover border border-neutral-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate font-mono">
                        {track.title}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate">
                        {track.artist}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 mt-0.5">
                        <span className="text-cyan-400 font-semibold">{track.bpm} BPM</span>
                        <span>·</span>
                        <span className="text-amber-400">{track.key}</span>
                        {track.genre && (
                          <>
                            <span>·</span>
                            <span>{track.genre}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Load Buttons for Deck A and Deck B */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onLoadTrackToDeck('A', track);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded text-xs font-mono font-bold uppercase bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 active:scale-95 transition-all"
                      title="Load track to Deck A"
                    >
                      + DECK A
                    </button>

                    <button
                      onClick={() => {
                        onLoadTrackToDeck('B', track);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded text-xs font-mono font-bold uppercase bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 active:scale-95 transition-all"
                      title="Load track to Deck B"
                    >
                      + DECK B
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Custom YouTube Loader */}
        {activeTab === 'custom' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <p className="text-xs font-mono text-neutral-400">
              Load <em>any</em> YouTube video, song, instrumental beat, or vocal accapella directly into your DJ session. Enter the YouTube link below:
            </p>

            <div className="flex flex-col gap-3 max-w-xl">
              <div>
                <label className="text-xs font-mono text-neutral-300 font-bold block mb-1">
                  YouTube URL or Video ID:
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-neutral-300 font-bold block mb-1">
                    Track Title (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Daft Punk - One More Time"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-neutral-300 font-bold block mb-1">
                    Artist (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Daft Punk"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-neutral-300 font-bold block mb-1">
                    Estimated BPM:
                  </label>
                  <input
                    type="number"
                    value={customBpm}
                    onChange={(e) => setCustomBpm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-neutral-300 font-bold block mb-1">
                    Key (Camelot or Musical):
                  </label>
                  <input
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="e.g. 8A / Am"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
              </div>

              {customError && (
                <div className="text-xs font-mono text-red-400 bg-red-950/40 border border-red-800 p-2 rounded">
                  {customError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleAddCustom('A')}
                  className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase bg-cyan-500 hover:bg-cyan-400 text-black transition-colors active:scale-95"
                >
                  Load Directly to Deck A
                </button>

                <button
                  onClick={() => handleAddCustom('B')}
                  className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase bg-amber-500 hover:bg-amber-400 text-black transition-colors active:scale-95"
                >
                  Load Directly to Deck B
                </button>

                <button
                  onClick={() => handleAddCustom()}
                  className="px-4 py-2.5 rounded-lg text-xs font-mono font-bold uppercase bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                >
                  Save to Crate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
