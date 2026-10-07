import { DeckTrack } from '../types/dj';
import { POPULAR_TRACKS } from '../data/presets';
import { extractYouTubeId } from './youtube';

export interface SearchResult {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  duration: number;
  durationFormatted?: string;
  bpm: number;
  key: string;
  genre?: string;
  suggestedCue?: number;
}

/**
 * Normalizes common DJ search terms and typos
 */
export function normalizeDjSearchQuery(rawQuery: string): string {
  let q = rawQuery.trim();
  // Fix common typos for instrumental and accapella
  q = q.replace(/\b(insturmntal|instumental|instrumntal|instru)\b/gi, 'instrumental');
  q = q.replace(/\b(accapella|acappella|acapela|acapell|vocals?)\b/gi, 'acapella');
  return q;
}

export async function searchYouTubeClient(
  query: string,
  customTracks: DeckTrack[] = []
): Promise<SearchResult[]> {
  const cleanQ = normalizeDjSearchQuery(query);
  if (!cleanQ) return [];

  const allLibrary = [...POPULAR_TRACKS, ...customTracks];

  // 1. Direct YouTube URL or 11-char ID check
  const directId = extractYouTubeId(cleanQ);
  if (directId) {
    return [
      {
        id: `yt-${directId}`,
        videoId: directId,
        title: `YouTube Video (${directId})`,
        artist: 'Direct Link',
        thumbnailUrl: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
        duration: 240,
        durationFormatted: '4:00',
        bpm: 124,
        key: '8A / Am',
        genre: 'Direct Link',
        suggestedCue: 0,
      },
    ];
  }

  // 2. Strict all-word match across local library
  const words = cleanQ.toLowerCase().split(/\s+/).filter(Boolean);
  const strictMatches = allLibrary.filter((track) => {
    const haystack = `${track.title} ${track.artist} ${track.genre || ''}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });

  if (strictMatches.length > 0) {
    return strictMatches.map((t) => ({
      ...t,
      durationFormatted: `${Math.floor(t.duration / 60)}:${(t.duration % 60).toString().padStart(2, '0')}`,
    }));
  }

  // If words include "instrumental" or "acapella" and strict match didn't find them in library,
  // DO NOT drop the word! We return an empty array so live YouTube search takes full precedence!
  return [];
}
