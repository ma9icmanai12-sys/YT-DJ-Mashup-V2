import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Helper to parse duration like "3:45" or "1:02:15" into seconds
function parseDurationText(str?: string): number {
  if (!str) return 240;
  const parts = str.split(':').map(p => parseInt(p, 10));
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 240;
}

// API endpoint for YouTube video search
app.get('/api/search', async (req, res) => {
  const query = req.query.q as string;
  if (!query || !query.trim()) {
    return res.json({ results: [] });
  }

  const cleanQuery = query.trim();

  // If query is directly an 11-char ID or YouTube URL
  const ytMatch = cleanQuery.match(/(?:youtu\.be\/|watch\?v=|embed\/|shorts\/|^)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return res.json({
      results: [
        {
          id: `yt-${videoId}`,
          videoId,
          title: `YouTube Video (${videoId})`,
          artist: 'YouTube Video',
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: 240,
          bpm: 124,
          key: '8A / Am',
          genre: 'YouTube Direct',
          suggestedCue: 0,
        },
      ],
    });
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    const html = await response.text();
    const match =
      html.match(/var ytInitialData = ({.*?});<\/script>/s) ||
      html.match(/ytInitialData = ({.*?});/s);

    if (!match || !match[1]) {
      return res.json({ results: [] });
    }

    const data = JSON.parse(match[1]);
    const items: any[] = [];
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents;

    if (contents && Array.isArray(contents)) {
      for (const section of contents) {
        const itemSection = section?.itemSectionRenderer?.contents;
        if (itemSection && Array.isArray(itemSection)) {
          for (const item of itemSection) {
            const v = item?.videoRenderer;
            if (v && v.videoId && v.title?.runs?.[0]?.text) {
              const durText = v.lengthText?.simpleText || '';
              const duration = parseDurationText(durText);
              // Filter out long 3+ hour videos if possible, prefer standard tracks
              if (duration < 14400) {
                const title = v.title.runs[0].text;
                const artist = v.ownerText?.runs?.[0]?.text || 'YouTube';
                const thumb =
                  v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
                  `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`;

                // Camelot keys generator for fun DJ mixing
                const camelotKeys = ['4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A', '1A', '2A', '3A'];
                const estimatedKey = camelotKeys[Math.abs(v.videoId.charCodeAt(0) + v.videoId.charCodeAt(1)) % camelotKeys.length];

                // Rough BPM guess between 110 and 135 for danceability
                const estimatedBpm = 110 + (Math.abs(v.videoId.charCodeAt(2)) % 25);

                items.push({
                  id: `yt-${v.videoId}`,
                  videoId: v.videoId,
                  title,
                  artist,
                  thumbnailUrl: thumb,
                  duration,
                  durationText: durText,
                  bpm: estimatedBpm,
                  key: `${estimatedKey}`,
                  genre: 'YouTube Music',
                  suggestedCue: 0,
                });
              }
            }
            if (items.length >= 10) break;
          }
        }
        if (items.length >= 10) break;
      }
    }

    return res.json({ results: items });
  } catch (err) {
    console.error('YouTube search error:', err);
    return res.status(500).json({ error: 'Failed to search YouTube', results: [] });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
