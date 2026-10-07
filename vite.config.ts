import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

/**
 * YouTube-DL search extraction logic
 * Scrapes YouTube search and extracts videoRenderer items from ytInitialData
 */
async function searchYouTube(query: string, limit: number = 15) {
  let q = query.trim();
  // Normalize common DJ typos
  q = q.replace(/\b(insturmntal|instumental|instrumntal|instru)\b/gi, 'instrumental');
  q = q.replace(/\b(accapella|acappella|acapela|acapell)\b/gi, 'acapella');

  const encoded = encodeURIComponent(q).replace(/%20/g, '+');
  const url = `https://www.youtube.com/results?search_query=${encoded}&sp=EgIQAQ%253D%253D`;
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  const resp = await fetch(url, { headers });
  if (!resp.ok) return [];

  const html = await resp.text();
  let initialData: any = null;

  const scriptRegex = /(?:var\s+ytInitialData|window\["ytInitialData"\]|ytInitialData)\s*=\s*({.+?});(?:\s*var\s+|\s*<\/script>)/s;
  const match = html.match(scriptRegex);
  if (match && match[1]) {
    try {
      initialData = JSON.parse(match[1]);
    } catch {}
  }

  if (!initialData) {
    const marker = 'ytInitialData = ';
    const startIdx = html.indexOf(marker);
    if (startIdx !== -1) {
      const sliceStart = startIdx + marker.length;
      const endIdx = html.indexOf(';</script>', sliceStart);
      if (endIdx !== -1) {
        try {
          initialData = JSON.parse(html.slice(sliceStart, endIdx));
        } catch {}
      }
    }
  }

  const results: any[] = [];
  if (initialData) {
    try {
      const contents =
        initialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents;

      if (Array.isArray(contents)) {
        for (const sec of contents) {
          const items = sec?.itemSectionRenderer?.contents;
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item?.videoRenderer) {
                const vr = item.videoRenderer;
                const videoId = vr.videoId;
                if (!videoId || videoId.length !== 11) continue;

                const title =
                  vr.title?.runs?.map((r: any) => r.text).join('') ||
                  vr.title?.simpleText ||
                  'Unknown Video';
                const artist =
                  vr.ownerText?.runs?.[0]?.text ||
                  vr.shortBylineText?.runs?.[0]?.text ||
                  'YouTube Channel';

                const durationFormatted = vr.lengthText?.simpleText || '3:30';
                const parts = durationFormatted.split(':').map((p: string) => parseInt(p, 10));
                let durationSec = 210;
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  durationSec = parts[0] * 60 + parts[1];
                } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                  durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
                }

                const thumbs = vr.thumbnail?.thumbnails;
                const thumbnailUrl =
                  thumbs && thumbs.length > 0
                    ? thumbs[thumbs.length - 1].url
                    : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

                const hash = videoId.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
                const estimatedBpm = 118 + (hash % 16) * 2;
                const keys = ['8A / Am', '4A / F#m', '7A / Dm', '2A / Ebm', '9A / Em', '11B / A Maj', '5A / Cm', '6A / Gm', '10B / B Maj'];
                const estimatedKey = keys[hash % keys.length];

                results.push({
                  id: `yt-${videoId}`,
                  videoId,
                  title,
                  artist,
                  thumbnailUrl,
                  duration: durationSec,
                  durationFormatted,
                  bpm: estimatedBpm,
                  key: estimatedKey,
                  genre: 'YouTube Search',
                  suggestedCue: 10,
                });

                if (results.length >= limit) break;
              }
            }
          }
          if (results.length >= limit) break;
        }
      }
    } catch (e) {
      console.warn('ytInitialData parse error', e);
    }
  }

  return results;
}

/**
 * Fallback suggestion query
 */
async function fallbackYouTubeSearch(query: string) {
  try {
    const suggestUrl = `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&hl=en&gl=us&q=${encodeURIComponent(query)}`;
    const resp = await fetch(suggestUrl);
    if (resp.ok) {
      const text = await resp.text();
      const jsonMatch = text.match(/\((.+)\)/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        const suggestions: string[] = parsed[1]?.map((s: any) => s[0]) || [];
        if (suggestions.length > 0) {
          return await searchYouTube(suggestions[0], 8);
        }
      }
    }
  } catch {}
  return [];
}

/**
 * Custom Vite Plugin to provide the YouTube-DL search API without needing a separate express server
 */
function youtubeSearchPlugin(): Plugin {
  return {
    name: 'vite-plugin-youtube-search',
    configureServer(server) {
      server.middlewares.use('/api/search', async (req, res) => {
        try {
          const url = new URL(req.url || '', 'http://localhost:3000');
          const q = url.searchParams.get('q') || '';

          if (!q.trim()) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ results: [], query: '' }));
            return;
          }

          // Direct 11-char ID check
          const idMatch = q.match(/(?:youtu\.be\/|watch\?v=|embed\/|shorts\/|^)([a-zA-Z0-9_-]{11})(?:[&?]|$)/);
          if (idMatch && idMatch[1]) {
            const vidId = idMatch[1];
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                results: [
                  {
                    id: `yt-${vidId}`,
                    videoId: vidId,
                    title: `YouTube Video (${vidId})`,
                    artist: 'Direct Link',
                    thumbnailUrl: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
                    duration: 240,
                    durationFormatted: '4:00',
                    bpm: 124,
                    key: '8A / Am',
                    genre: 'YouTube URL',
                    suggestedCue: 0,
                  },
                ],
                query: q,
              })
            );
            return;
          }

          let results = await searchYouTube(q.trim(), 12);
          if (results.length === 0) {
            results = await fallbackYouTubeSearch(q.trim());
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ results, query: q }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Search failed', results: [] }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), youtubeSearchPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
