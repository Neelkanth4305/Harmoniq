import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CACHE_PREFIX = '@melodify_cache_';
const CACHE_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours

// Public YouTube API endpoints for live direct search without needing an API key
const PUBLIC_YOUTUBE_ENDPOINTS = [
  'https://yt.chocolatemoo53.com',
  'https://invidious.jing.rocks',
  'https://iv.melmac.space',
  'https://invidious.drgns.space',
  'https://inv.vern.cc',
];

const memoryCache = new Map();

// Helper to decode HTML entities
export const decodeHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
};

/**
 * Direct search on YouTube without an API key using public mirrors
 */
async function searchViaPublicMirrors(query) {
  for (const endpoint of PUBLIC_YOUTUBE_ENDPOINTS) {
    try {
      const url = `${endpoint}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const tracks = data
            .filter((item) => item.videoId && item.title)
            .map((item) => {
              const durSec = item.lengthSeconds;
              const formattedDuration = durSec
                ? `${Math.floor(durSec / 60)}:${durSec % 60 < 10 ? '0' : ''}${durSec % 60}`
                : '3:30';

              const thumb =
                item.videoThumbnails?.find((t) => t.quality === 'high' || t.quality === 'medium')?.url ||
                `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

              return {
                id: item.videoId,
                title: decodeHtml(item.title),
                channel: decodeHtml(item.author || 'YouTube Artist'),
                thumbnail: thumb.startsWith('http') ? thumb : `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
                duration: formattedDuration,
                durationSeconds: durSec || 210,
              };
            });

          if (tracks.length > 0) {
            return tracks;
          }
        }
      }
    } catch (e) {
      // Try next mirror
    }
  }
  return null;
}

/**
 * Direct YouTube search scraping on Native (iOS/Android) where CORS does not apply
 */
async function searchViaNativeScraping(query) {
  if (Platform.OS === 'web') return null;

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeoutId);

    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (!match) return null;

    const parsed = JSON.parse(match[1]);
    const contents =
      parsed.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
        ?.itemSectionRenderer?.contents || [];

    const tracks = [];
    for (const item of contents) {
      const v = item.videoRenderer;
      if (v && v.videoId && v.title?.runs?.[0]?.text) {
        const title = v.title.runs[0].text;
        const channel = v.ownerText?.runs?.[0]?.text || 'YouTube Artist';
        const duration = v.lengthText?.simpleText || '3:30';
        const thumbs = v.thumbnail?.thumbnails || [];
        const thumb =
          thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

        tracks.push({
          id: v.videoId,
          title: decodeHtml(title),
          channel: decodeHtml(channel),
          thumbnail: thumb,
          duration,
          durationSeconds: 210,
        });
      }
    }

    if (tracks.length > 0) return tracks;
  } catch (e) {
    // Silent catch
  }
  return null;
}

/**
 * Search via official Google YouTube Data API v3 if key exists in .env
 */
async function searchViaOfficialApiKey(query, apiKey) {
  try {
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&q=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    const res = await fetch(endpoint);
    const data = await res.json();

    if (res.ok && data.items?.length > 0) {
      return data.items
        .filter((item) => item.id?.videoId)
        .map((item) => ({
          id: item.id.videoId,
          title: decodeHtml(item.snippet.title),
          channel: decodeHtml(item.snippet.channelTitle),
          thumbnail:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.medium?.url ||
            `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
          duration: '3:30',
          durationSeconds: 210,
        }));
    }
  } catch (e) {}
  return null;
}

/**
 * Universal dynamic live search:
 * 1. Checks memory & AsyncStorage cache
 * 2. If official API key provided in .env, tries official API
 * 3. Fetches live directly from the internet via public mirrors / scraping
 * 4. Never serves static data — always dynamic!
 */
export async function searchYouTubeMusic(query) {
  const clean = (query || '').trim();
  if (!clean) return { tracks: [], error: null };

  const cacheKey = clean.toLowerCase();

  // Check in-memory cache
  if (memoryCache.has(cacheKey)) {
    return { tracks: memoryCache.get(cacheKey), error: null };
  }

  // Check persistent cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
        memoryCache.set(cacheKey, parsed.tracks);
        return { tracks: parsed.tracks, error: null };
      }
    }
  } catch (e) {}

  let liveTracks = null;

  // 1. Try official key if set and not placeholder
  const apiKey = process.env.EXPO_PUBLIC_YT_KEY;
  if (apiKey && apiKey !== 'YOUR_API_KEY_HERE' && apiKey.length > 10) {
    liveTracks = await searchViaOfficialApiKey(clean, apiKey);
  }

  // 2. Try native direct scraping if on Android/iOS
  if (!liveTracks && Platform.OS !== 'web') {
    liveTracks = await searchViaNativeScraping(clean);
  }

  // 3. Try live public mirrors (works on Web & Mobile without any API key)
  if (!liveTracks) {
    liveTracks = await searchViaPublicMirrors(clean);
  }

  // If found, save to cache
  if (liveTracks && liveTracks.length > 0) {
    memoryCache.set(cacheKey, liveTracks);
    try {
      await AsyncStorage.setItem(
        CACHE_PREFIX + cacheKey,
        JSON.stringify({ timestamp: Date.now(), tracks: liveTracks })
      );
    } catch (e) {}

    return { tracks: liveTracks, error: null };
  }

  return { tracks: [], error: 'Could not fetch results. Please check your internet connection.' };
}
