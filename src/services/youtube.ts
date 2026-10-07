/**
 * YouTube IFrame API Singleton Loader & Controller
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let apiLoadedPromise: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (apiLoadedPromise) return apiLoadedPromise;

  apiLoadedPromise = new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      resolve();
    };

    // Check if script element already inserted
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  });

  return apiLoadedPromise;
}

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const clean = urlOrId.trim();

  // If already an 11 char alphanumeric string
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }

  // Handle standard YouTube URLs
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = clean.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }

  return null;
}

export interface YTPlayerWrapper {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  loadVideoById: (id: string, startSeconds?: number) => void;
  cueVideoById: (id: string, startSeconds?: number) => void;
  destroy: () => void;
  getRawPlayer: () => any;
}

export async function createYTPlayer(
  elementId: string,
  videoId: string,
  handlers: {
    onReady?: (player: YTPlayerWrapper) => void;
    onStateChange?: (state: number) => void;
    onError?: (error: any) => void;
  } = {}
): Promise<YTPlayerWrapper> {
  await loadYouTubeIframeApi();

  return new Promise((resolve) => {
    let rawPlayer: any = null;

    const wrapper: YTPlayerWrapper = {
      play: () => {
        try {
          if (rawPlayer && typeof rawPlayer.playVideo === 'function') {
            rawPlayer.playVideo();
          }
        } catch (e) {
          console.warn('YT play error', e);
        }
      },
      pause: () => {
        try {
          if (rawPlayer && typeof rawPlayer.pauseVideo === 'function') {
            rawPlayer.pauseVideo();
          }
        } catch (e) {
          console.warn('YT pause error', e);
        }
      },
      seekTo: (seconds: number, allowSeekAhead: boolean = true) => {
        try {
          if (rawPlayer && typeof rawPlayer.seekTo === 'function') {
            rawPlayer.seekTo(seconds, allowSeekAhead);
          }
        } catch (e) {
          console.warn('YT seek error', e);
        }
      },
      setVolume: (vol: number) => {
        try {
          if (rawPlayer && typeof rawPlayer.setVolume === 'function') {
            const clamped = Math.max(0, Math.min(100, Math.round(vol)));
            rawPlayer.setVolume(clamped);
          }
        } catch (e) {
          console.warn('YT volume error', e);
        }
      },
      setPlaybackRate: (rate: number) => {
        try {
          if (rawPlayer && typeof rawPlayer.setPlaybackRate === 'function') {
            rawPlayer.setPlaybackRate(rate);
          }
        } catch (e) {
          console.warn('YT playback rate error', e);
        }
      },
      getCurrentTime: () => {
        try {
          if (rawPlayer && typeof rawPlayer.getCurrentTime === 'function') {
            return rawPlayer.getCurrentTime() || 0;
          }
        } catch (e) {}
        return 0;
      },
      getDuration: () => {
        try {
          if (rawPlayer && typeof rawPlayer.getDuration === 'function') {
            return rawPlayer.getDuration() || 0;
          }
        } catch (e) {}
        return 0;
      },
      getPlayerState: () => {
        try {
          if (rawPlayer && typeof rawPlayer.getPlayerState === 'function') {
            return rawPlayer.getPlayerState();
          }
        } catch (e) {}
        return -1;
      },
      loadVideoById: (id: string, startSeconds: number = 0) => {
        try {
          if (rawPlayer && typeof rawPlayer.loadVideoById === 'function') {
            try {
              rawPlayer.loadVideoById(id, startSeconds);
            } catch {
              rawPlayer.loadVideoById({ videoId: id, startSeconds });
            }
          }
        } catch (e) {
          console.warn('YT loadVideoById error', e);
        }
      },
      cueVideoById: (id: string, startSeconds: number = 0) => {
        try {
          if (rawPlayer && typeof rawPlayer.cueVideoById === 'function') {
            try {
              rawPlayer.cueVideoById(id, startSeconds);
            } catch {
              rawPlayer.cueVideoById({ videoId: id, startSeconds });
            }
          }
        } catch (e) {
          console.warn('YT cueVideoById error', e);
        }
      },
      destroy: () => {
        try {
          if (rawPlayer && typeof rawPlayer.destroy === 'function') {
            rawPlayer.destroy();
          }
        } catch (e) {}
      },
      getRawPlayer: () => rawPlayer,
    };

    rawPlayer = new window.YT.Player(elementId, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          if (handlers.onReady) handlers.onReady(wrapper);
          resolve(wrapper);
        },
        onStateChange: (event: any) => {
          if (handlers.onStateChange) handlers.onStateChange(event.data);
        },
        onError: (err: any) => {
          if (handlers.onError) handlers.onError(err);
        },
      },
    });
  });
}
