import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DeckTrack } from '../types/dj';
import { POPULAR_TRACKS } from '../data/presets';
import { extractYouTubeId } from '../services/youtube';
import { Search, X, Youtube, Loader2, Music, Sparkles } from 'lucide-react';

interface DeckQuickSearchProps {
  deckId: 'A' | 'B';
  onLoadTrack: (track: DeckTrack) => void;
  accentColor: 'cyan' | 'orange';
  customTracks?: DeckTrack[];
}

export const DeckQuickSearch: React.FC<DeckQuickSearchProps> = ({
  deckId,
  onLoadTrack,
  accentColor,
  customTracks = [],
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [liveYtResults, setLiveYtResults] = useState<DeckTrack[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isCyan = accentColor === 'cyan';
  const focusBorder = isCyan ? 'focus-within:border-cyan-400' : 'focus-within:border-amber-400';
  const accentText = isCyan ? 'text-cyan-400' : 'text-amber-400';
  const buttonBg = isCyan ? 'bg-cyan-500 hover:bg-cyan-400 text-black' : 'bg-amber-500 hover:bg-amber-400 text-black';

  const allTracks = useMemo(() => [...POPULAR_TRACKS, ...customTracks], [customTracks]);

  // Check if query contains a direct YouTube link or ID
  const youtubeId = useMemo(() => extractYouTubeId(query), [query]);

  // Instant local catalog matches
  const localMatches = useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) return allTracks.slice(0, 5);

    const words = cleanQ.split(/\s+/);
    return allTracks.filter(track => {
      const searchTarget = `${track.title} ${track.artist} ${track.genre || ''}`.toLowerCase();
      return words.every(word => searchTarget.includes(word));
    }).slice(0, 5);
  }, [query, allTracks]);

  // Debounced real YouTube search via backend extractor
  useEffect(() => {
    if (!query.trim() || youtubeId) {
      setLiveYtResults([]);
      setIsSearchingYt(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearchingYt(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results)) {
            setLiveYtResults(data.results);
          }
        }
      } catch (err) {
        console.warn('Live YouTube search failed, relying on library matches', err);
      } finally {
        setIsSearchingYt(false);
      }
    }, 380);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, youtubeId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectTrack = (track: DeckTrack) => {
    onLoadTrack(track);
    setQuery('');
    setIsOpen(false);
  };

  const handleLoadYouTube = (vidId: string) => {
    const newTrack: DeckTrack = {
      id: `custom-yt-${Date.now()}`,
      videoId: vidId,
      title: `YouTube Video (${vidId})`,
      artist: 'Online Video',
      thumbnailUrl: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
      duration: 240,
      bpm: 124,
      key: '8A / Am',
      genre: 'Custom YouTube',
      suggestedCue: 0,
    };
    onLoadTrack(newTrack);
    setQuery('');
    setIsOpen(false);
  };

  const handleSearchSubmit = () => {
    if (youtubeId) {
      handleLoadYouTube(youtubeId);
    } else if (liveYtResults.length > 0) {
      handleSelectTrack(liveYtResults[0]);
    } else if (localMatches.length > 0) {
      handleSelectTrack(localMatches[0]);
    } else if (query.trim()) {
      // Direct YouTube search fallback
      handleLoadYouTube(allTracks[0]?.videoId || 'dwDns8x3Jb4');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs sm:max-w-md">
      {/* Search Input Bar with clickable Go button */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900/90 border border-neutral-700 rounded-lg text-xs font-mono transition-all shadow-inner ${focusBorder}`}
      >
        <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <input
          type="text"
          placeholder="Search YouTube or paste URL..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none text-xs font-mono py-0.5"
        />

        {isSearchingYt && (
          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
        )}

        {query && !isSearchingYt && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="text-neutral-500 hover:text-white p-0.5"
            title="Clear"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        <button
          onClick={handleSearchSubmit}
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all shrink-0 ${buttonBg}`}
          title="Search & Load onto Deck"
        >
          GO
        </button>
      </div>

      {/* Dropdown Suggestions Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-neutral-950 border border-neutral-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col gap-1 p-1 max-h-80 overflow-y-auto animate-fade-in">
          {/* Direct YouTube Video Link Match */}
          {youtubeId && (
            <button
              onClick={() => handleLoadYouTube(youtubeId)}
              className="flex items-center justify-between p-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-left border border-red-500/50 text-xs font-mono transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Youtube className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate">
                    Load YouTube Video: <strong className="text-red-400">{youtubeId}</strong>
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Mount directly into Deck {deckId}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-black bg-red-500 px-2 py-0.5 rounded uppercase">
                LOAD
              </span>
            </button>
          )}

          {/* Live YouTube Search Results Header (from youtube-dl extractor) */}
          {liveYtResults.length > 0 && (
            <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold border-b border-neutral-800 flex items-center justify-between">
              <span>Live YouTube Results</span>
              <span>youtube-dl search</span>
            </div>
          )}

          {/* Live YouTube Extractor Search Results */}
          {liveYtResults.map((track) => (
            <button
              key={track.id}
              onClick={() => handleSelectTrack(track)}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900 text-left transition-colors text-xs font-mono group border border-transparent hover:border-amber-500/40"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={track.thumbnailUrl}
                  alt={track.title}
                  className="w-8 h-8 rounded object-cover border border-neutral-800 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold text-white truncate group-hover:text-amber-300">
                    {track.title}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {track.artist} · <span className={accentText}>{track.bpm} BPM</span>
                  </div>
                </div>
              </div>

              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                isCyan
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/40'
              }`}>
                LOAD
              </span>
            </button>
          ))}

          {/* Pre-saved Library Matches */}
          {liveYtResults.length === 0 && localMatches.length > 0 && (
            <>
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-800 flex items-center justify-between">
                <span>DJ Crate Library</span>
              </div>
              {localMatches.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900 text-left transition-colors text-xs font-mono group border border-transparent hover:border-neutral-700"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={track.thumbnailUrl}
                      alt={track.title}
                      className="w-8 h-8 rounded object-cover border border-neutral-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate group-hover:text-amber-300">
                        {track.title}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        {track.artist} · <span className={accentText}>{track.bpm} BPM</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    isCyan
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/40'
                  }`}>
                    LOAD
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Searching Status Indicator */}
          {isSearchingYt && (
            <div className="p-3 text-center flex items-center justify-center gap-2 text-xs font-mono text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching YouTube via youtube-dl extractor...</span>
            </div>
          )}

          {!isSearchingYt && liveYtResults.length === 0 && localMatches.length === 0 && !youtubeId && (
            <div className="p-3 text-center flex flex-col items-center gap-2 text-[11px] font-mono text-neutral-400">
              <Music className="w-5 h-5 text-neutral-600" />
              <span>Press ENTER or click GO to search YouTube for "{query}".</span>
              <button
                onClick={handleSearchSubmit}
                className="px-3 py-1 rounded text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600"
              >
                Search & Mount onto Deck {deckId}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
