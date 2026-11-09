import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CACHE_PREFIX = '@harmoniq_yt_cache_v2_';
const CACHE_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours

// Active Public Endpoints with CORS support (Piped instances have Access-Control-Allow-Origin: * by design)
const PUBLIC_ENDPOINTS = [
  { url: 'https://pipedapi.kavin.rocks', type: 'piped' },
  { url: 'https://api.piped.privacydev.net', type: 'piped' },
  { url: 'https://piped-api.garudalinux.org', type: 'piped' },
  { url: 'https://api-piped.mha.fi', type: 'piped' },
  { url: 'https://inv.nadeko.net', type: 'invidious' },
  { url: 'https://invidious.nerdvpn.de', type: 'invidious' },
  { url: 'https://invidious.private.coffee', type: 'invidious' },
  { url: 'https://yt.artemislena.eu', type: 'invidious' },
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

function parsePipedItem(item) {
  if (!item || !item.url || !item.title) return null;
  const videoId = item.url.replace('/watch?v=', '').split('&')[0];
  if (!videoId || videoId.length < 5) return null;

  const durSec = typeof item.duration === 'number' && item.duration > 0 ? item.duration : 210;
  const formattedDuration = `${Math.floor(durSec / 60)}:${durSec % 60 < 10 ? '0' : ''}${durSec % 60}`;
  const thumb = item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    id: videoId,
    title: decodeHtml(item.title),
    channel: decodeHtml(item.uploaderName || 'YouTube Artist'),
    thumbnail: thumb.startsWith('http') ? thumb : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: formattedDuration,
    durationSeconds: durSec,
  };
}

function parseInvidiousItem(item) {
  if (!item || !item.videoId || !item.title) return null;
  const durSec = typeof item.lengthSeconds === 'number' && item.lengthSeconds > 0 ? item.lengthSeconds : 210;
  const formattedDuration = `${Math.floor(durSec / 60)}:${durSec % 60 < 10 ? '0' : ''}${durSec % 60}`;
  const thumb =
    item.videoThumbnails?.find((t) => t.quality === 'high' || t.quality === 'medium')?.url ||
    `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

  return {
    id: item.videoId,
    title: decodeHtml(item.title),
    channel: decodeHtml(item.author || 'YouTube Artist'),
    thumbnail: thumb.startsWith('http') ? thumb : `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
    duration: formattedDuration,
    durationSeconds: durSec,
  };
}

/**
 * Fetch from a single endpoint with a strict timeout
 */
async function fetchEndpoint(endpointObj, query) {
  const isPiped = endpointObj.type === 'piped';
  const url = isPiped
    ? `${endpointObj.url}/search?q=${encodeURIComponent(query)}&filter=videos`
    : `${endpointObj.url}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3800);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawList = isPiped ? (data.items || []) : (Array.isArray(data) ? data : []);
      const tracks = rawList
        .map((item) => (isPiped ? parsePipedItem(item) : parseInvidiousItem(item)))
        .filter(Boolean);

      if (tracks.length > 0) {
        return tracks;
      }
    }
  } catch (e) {
    clearTimeout(timeoutId);
  }
  throw new Error('Endpoint failed');
}

/**
 * Fast concurrent search: races endpoints in parallel batches
 */
async function searchViaPublicMirrors(query) {
  const chunkSize = 3;
  for (let i = 0; i < PUBLIC_ENDPOINTS.length; i += chunkSize) {
    const batch = PUBLIC_ENDPOINTS.slice(i, i + chunkSize);
    try {
      const winner = await Promise.any(batch.map((ep) => fetchEndpoint(ep, query)));
      if (winner && winner.length > 0) {
        return winner;
      }
    } catch (batchErr) {
      // Continue to next batch
    }
  }
  return null;
}

/**
 * Direct YouTube search scraping on Native (iOS/Android)
 */
async function searchViaNativeScraping(query) {
  if (Platform.OS === 'web') return null;

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

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
    const match = html.match(/(?:window\["ytInitialData"\]|var ytInitialData|ytInitialData)\s*=\s*({.+?});/);
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
  } catch (e) {}
  return null;
}

/**
 * Official YouTube Data API v3 search
 */
async function searchViaOfficialApiKey(query, apiKey) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        return data.items.map((item) => ({
          id: item.id.videoId,
          title: decodeHtml(item.snippet.title),
          channel: decodeHtml(item.snippet.channelTitle),
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
          duration: '3:30',
          durationSeconds: 210,
        }));
      }
    }
  } catch (e) {}
  return null;
}

// Helper to identify and filter out unwanted Lo-Fi / study chill background tracks
export const isLofiTrack = (item) => {
  if (!item) return false;
  const str = `${item.title || ''} ${item.channel || ''}`.toLowerCase();
  return /\blo-?fi\b|lofi girl|chillhop|study beats|relaxing beats|sleep beats|study sleep/i.test(str);
};

/**
 * 1. Today's Biggest Hits — Top Global Viral Chartbusters
 */
export const TODAYS_BIGGEST_HITS = [
  { id: '450p7goxZqg', title: 'Blinding Lights', channel: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/450p7goxZqg/hqdefault.jpg', duration: '3:20', durationSeconds: 200 },
  { id: 'TUVcZfQe-Kw', title: 'Levitating', channel: 'Dua Lipa', thumbnail: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg', duration: '3:23', durationSeconds: 203 },
  { id: 'H5v3kku4y6Q', title: 'As It Was', channel: 'Harry Styles', thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg', duration: '2:47', durationSeconds: 167 },
  { id: 'd5gxZEYdpKw', title: 'Birds of a Feather', channel: 'Billie Eilish', thumbnail: 'https://i.ytimg.com/vi/d5gxZEYdpKw/hqdefault.jpg', duration: '3:05', durationSeconds: 185 },
  { id: 'Oa_RSwwpPaA', title: 'Beautiful Things', channel: 'Benson Boone', thumbnail: 'https://i.ytimg.com/vi/Oa_RSwwpPaA/hqdefault.jpg', duration: '3:00', durationSeconds: 180 },
  { id: 'fu9p_Y_HqS8', title: 'I Had Some Help', channel: 'Post Malone, Morgan Wallen', thumbnail: 'https://i.ytimg.com/vi/fu9p_Y_HqS8/hqdefault.jpg', duration: '2:58', durationSeconds: 178 },
  { id: 'kPa7bsKwL-c', title: 'Die With A Smile', channel: 'Lady Gaga, Bruno Mars', thumbnail: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg', duration: '4:11', durationSeconds: 251 },
  { id: '34Na4j8AVgA', title: 'Starboy', channel: 'The Weeknd, Daft Punk', thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg', duration: '3:50', durationSeconds: 230 },
  { id: 'GZ3zL7kT6_c', title: 'Lose Control', channel: 'Teddy Swims', thumbnail: 'https://i.ytimg.com/vi/GZ3zL7kT6_c/hqdefault.jpg', duration: '3:30', durationSeconds: 210 },
  { id: 'kJQP7kiw5Fk', title: 'Despacito', channel: 'Luis Fonsi, Daddy Yankee', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg', duration: '3:47', durationSeconds: 227 },
];

/**
 * 2. Bollywood Chartbusters — Pure Authentic Hindi & Bollywood Mega Hits
 */
export const BOLLYWOOD_CHARTBUSTERS = [
  { id: 'BddP6PYo2gs', title: 'Kesariya', channel: 'Arijit Singh, Pritam', thumbnail: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg', duration: '4:28', durationSeconds: 268 },
  { id: 'Umqb9KENgmk', title: 'Apna Bana Le', channel: 'Arijit Singh, Sachin-Jigar', thumbnail: 'https://i.ytimg.com/vi/Umqb9KENgmk/hqdefault.jpg', duration: '4:21', durationSeconds: 261 },
  { id: 'IJq0cRJ94X0', title: 'Channa Mereya', channel: 'Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/IJq0cRJ94X0/hqdefault.jpg', duration: '4:49', durationSeconds: 289 },
  { id: 'iAIBF2ngbWY', title: 'Pehle Bhi Main', channel: 'Vishal Mishra, Harshavardhan', thumbnail: 'https://i.ytimg.com/vi/iAIBF2ngbWY/hqdefault.jpg', duration: '4:10', durationSeconds: 250 },
  { id: 'V7LwfY5U5WI', title: 'Ranjha', channel: 'Jasleen Royal, B Praak', thumbnail: 'https://i.ytimg.com/vi/V7LwfY5U5WI/hqdefault.jpg', duration: '3:48', durationSeconds: 228 },
  { id: 'RLzC55ai0eo', title: 'Heeriye', channel: 'Jasleen Royal, Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/RLzC55ai0eo/hqdefault.jpg', duration: '3:15', durationSeconds: 195 },
  { id: 'gvyUuxdRdR4', title: 'Raataan Lambiyan', channel: 'Jubin Nautiyal, Tanishk Bagchi', thumbnail: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg', duration: '3:50', durationSeconds: 230 },
  { id: 'mt9xg0mmt68', title: 'Tum Se Hi', channel: 'Mohit Chauhan, Pritam', thumbnail: 'https://i.ytimg.com/vi/mt9xg0mmt68/hqdefault.jpg', duration: '5:23', durationSeconds: 323 },
  { id: 'rTuxUAuJRyY', title: 'Tera Hone Laga Hoon', channel: 'Atif Aslam, Pritam', thumbnail: 'https://i.ytimg.com/vi/rTuxUAuJRyY/hqdefault.jpg', duration: '5:00', durationSeconds: 300 },
  { id: 'ZskZ0f2bWk4', title: 'O Maahi', channel: 'Arijit Singh, Pritam', thumbnail: 'https://i.ytimg.com/vi/ZskZ0f2bWk4/hqdefault.jpg', duration: '3:53', durationSeconds: 233 },
];

/**
 * 3. Global Pop — English Pop Icons & Global Classics
 */
export const GLOBAL_POP_HITS = [
  { id: 'JGwWNGJdvx8', title: 'Shape of You', channel: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg', duration: '3:53', durationSeconds: 233 },
  { id: 'yKNxeF4KMsY', title: 'Yellow', channel: 'Coldplay', thumbnail: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg', duration: '4:29', durationSeconds: 269 },
  { id: 'ic8j13piAhQ', title: 'Cruel Summer', channel: 'Taylor Swift', thumbnail: 'https://i.ytimg.com/vi/ic8j13piAhQ/hqdefault.jpg', duration: '2:58', durationSeconds: 178 },
  { id: '09R8_2nJtjg', title: 'Sugar', channel: 'Maroon 5', thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg', duration: '3:55', durationSeconds: 235 },
  { id: '2Vv-BfVoq4g', title: 'Perfect', channel: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg', duration: '4:23', durationSeconds: 263 },
  { id: 'k4V3Mo61fJM', title: 'Fix You', channel: 'Coldplay', thumbnail: 'https://i.ytimg.com/vi/k4V3Mo61fJM/hqdefault.jpg', duration: '4:55', durationSeconds: 295 },
  { id: 'e-ORhEE9VVg', title: 'Blank Space', channel: 'Taylor Swift', thumbnail: 'https://i.ytimg.com/vi/e-ORhEE9VVg/hqdefault.jpg', duration: '3:51', durationSeconds: 231 },
  { id: 'YQHsXMglC9A', title: 'Hello', channel: 'Adele', thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg', duration: '4:55', durationSeconds: 295 },
  { id: 'hT_nvWreIhg', title: 'Counting Stars', channel: 'OneRepublic', thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg', duration: '4:17', durationSeconds: 257 },
  { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', channel: 'Queen', thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg', duration: '5:55', durationSeconds: 355 },
];

const ALL_CURATED_TRACKS = [
  ...TODAYS_BIGGEST_HITS,
  ...BOLLYWOOD_CHARTBUSTERS,
  ...GLOBAL_POP_HITS,
];

/**
 * Universal dynamic live music search
 */
export async function searchYouTubeMusic(query) {
  const clean = (query || '').trim();
  if (!clean) {
    return { tracks: [], error: null };
  }

  const cacheKey = clean.toLowerCase();

  // 1. Check memory cache
  if (memoryCache.has(cacheKey)) {
    return { tracks: memoryCache.get(cacheKey), error: null };
  }

  // 2. Check AsyncStorage cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS && parsed.tracks?.length > 0) {
        memoryCache.set(cacheKey, parsed.tracks);
        return { tracks: parsed.tracks, error: null };
      }
    }
  } catch (e) {}

  let liveTracks = null;

  // 3. Try official API key if set in environment
  const apiKey = process.env.EXPO_PUBLIC_YT_KEY;
  if (apiKey && apiKey !== 'YOUR_API_KEY_HERE' && apiKey.length > 10) {
    liveTracks = await searchViaOfficialApiKey(clean, apiKey);
  }

  // 4. Try native direct scraping if on Android/iOS
  if (!liveTracks && Platform.OS !== 'web') {
    liveTracks = await searchViaNativeScraping(clean);
  }

  // 5. Try fast concurrent public mirrors
  if (!liveTracks || liveTracks.length === 0) {
    liveTracks = await searchViaPublicMirrors(clean);
  }

  // 6. Intelligent category-aware fallback matching
  if (!liveTracks || liveTracks.length === 0) {
    const qLower = clean.toLowerCase();

    if (qLower.includes('bollywood') || qLower.includes('hindi') || qLower.includes('arijit')) {
      liveTracks = BOLLYWOOD_CHARTBUSTERS;
    } else if (qLower.includes('pop') || qLower.includes('english')) {
      liveTracks = GLOBAL_POP_HITS;
    } else if (
      qLower.includes('trending') ||
      qLower.includes('biggest') ||
      qLower.includes('hits') ||
      qLower.includes('chartbuster')
    ) {
      liveTracks = TODAYS_BIGGEST_HITS;
    } else {
      const words = qLower.split(/\s+/).filter((w) => w.length > 1);
      const matched = ALL_CURATED_TRACKS.filter((t) => {
        const combined = `${t.title} ${t.channel}`.toLowerCase();
        return words.some((w) => combined.includes(w)) || combined.includes(qLower);
      });

      if (matched.length > 0) {
        liveTracks = matched;
      } else {
        liveTracks = TODAYS_BIGGEST_HITS;
      }
    }
  }

  // Filter out any unwanted lofi tracks unless explicitly searched for
  if (liveTracks && liveTracks.length > 0) {
    const isExplicitLofiSearch = /\blo-?fi\b/i.test(clean);
    if (!isExplicitLofiSearch) {
      liveTracks = liveTracks.filter((t) => !isLofiTrack(t));
    }
  }

  // Save to cache
  if (liveTracks && liveTracks.length > 0) {
    memoryCache.set(cacheKey, liveTracks);
    try {
      AsyncStorage.setItem(
        CACHE_PREFIX + cacheKey,
        JSON.stringify({ tracks: liveTracks, timestamp: Date.now() })
      ).catch(() => {});
    } catch (e) {}

    return { tracks: liveTracks, error: null };
  }

  return { tracks: [], error: 'Could not fetch results. Please try another search.' };
}
