import AsyncStorage from '@react-native-async-storage/async-storage';

const LYRICS_CACHE_PREFIX = '@harmoniq_lyrics_';
const memoryLyricsCache = new Map();

/**
 * Intelligent song title & artist candidate parser from YouTube clutter
 */
export function extractTitleAndArtistPairs(rawTitle, rawArtist) {
  if (!rawTitle) return [];

  // Remove YouTube video clutter, bracketed tags, and video metadata
  let clean = rawTitle
    .replace(/\((official|music|video|audio|lyrics|lyric video|hd|4k|remastered|full song|visualizer|live|acoustic)[^\)]*\)/gi, '')
    .replace(/\[(official|music|video|audio|lyrics|lyric video|hd|4k|remastered|full song|visualizer|live|acoustic)[^\]]*\]/gi, '')
    .replace(/ft\..*/gi, '')
    .replace(/feat\..*/gi, '')
    .replace(/prod\..*/gi, '')
    .replace(/\|.*/, '') // Drop secondary pipe credits
    .trim();

  const pairs = [];
  const cleanArtist = (rawArtist || '')
    .replace(/(vevo|official|music|channel|records|topic)[^\w]*/gi, '')
    .trim();

  // If separated by dash or colon
  const separatorRegex = / - | – | — | : /;
  if (separatorRegex.test(clean)) {
    const parts = clean.split(separatorRegex).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const p0 = parts[0];
      const p1 = parts[1];

      // Format A: Western "Artist - Title" (e.g. "Ed Sheeran - Shape of You")
      pairs.push({ title: p1, artist: p0 });

      // Format B: Indian/Bollywood "Title - Movie" (e.g. "Kesariya - Brahmāstra")
      pairs.push({ title: p0, artist: cleanArtist });

      // Format C: "Title - Artist" (e.g. "Shape of You - Ed Sheeran")
      pairs.push({ title: p0, artist: p1 });
    }
  }

  // Pure title fallback
  const firstChunk = clean.split(separatorRegex)[0].trim();
  if (firstChunk && !pairs.some((p) => p.title.toLowerCase() === firstChunk.toLowerCase())) {
    pairs.push({ title: firstChunk, artist: cleanArtist });
  }

  // Full clean title with artist
  if (clean && !pairs.some((p) => p.title.toLowerCase() === clean.toLowerCase())) {
    pairs.push({ title: clean, artist: cleanArtist });
  }

  return pairs;
}

/**
 * Parse standard LRC format string into array of { time: seconds, text: string }
 */
export function parseLrcLyrics(lrcString) {
  if (!lrcString) return [];
  const lines = lrcString.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = match[3] ? parseFloat(`0.${match[3]}`) : 0;
      const totalTime = minutes * 60 + seconds + millis;
      const text = line.replace(timeRegex, '').trim();
      if (text) {
        result.push({ time: parseFloat(totalTime.toFixed(2)), text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * Generate rhythmic auto-synced timestamps for plain lyrics across track duration
 */
export function generateAutoSyncedLyrics(plainText, trackDuration = 210) {
  if (!plainText) return [];
  const rawLines = plainText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('[') && !l.startsWith('Paroles'));

  if (rawLines.length === 0) return [];

  const effectiveDuration = Math.max(60, trackDuration > 0 ? trackDuration : 210);
  const startOffset = Math.min(10, effectiveDuration * 0.05); // Intro pause
  const usableDuration = effectiveDuration - startOffset - 12;
  const interval = usableDuration / rawLines.length;

  return rawLines.map((text, index) => ({
    time: parseFloat((startOffset + index * interval).toFixed(2)),
    text,
  }));
}

/**
 * Compute similarity score between search query and returned track
 */
function scoreTrackMatch(candidateTitle, candidateArtist, item) {
  if (!item || !item.trackName) return 0;

  const itemTrack = item.trackName.toLowerCase().trim();
  const itemArtist = (item.artistName || '').toLowerCase().trim();
  const queryTitle = candidateTitle.toLowerCase().trim();
  const queryArtist = (candidateArtist || '').toLowerCase().trim();

  let score = 0;

  // Exact title match
  if (itemTrack === queryTitle) {
    score += 80;
  } else if (itemTrack.includes(queryTitle) || queryTitle.includes(itemTrack)) {
    score += 50;
  } else {
    // Check word intersection
    const queryWords = queryTitle.split(/\s+/).filter((w) => w.length > 2);
    const itemWords = itemTrack.split(/\s+/).filter((w) => w.length > 2);
    const commonWords = queryWords.filter((w) => itemWords.includes(w));
    if (commonWords.length > 0) {
      score += (commonWords.length / Math.max(queryWords.length, 1)) * 40;
    }
  }

  // Artist match
  if (queryArtist && itemArtist) {
    if (itemArtist.includes(queryArtist) || queryArtist.includes(itemArtist)) {
      score += 30;
    }
  }

  // Synced lyrics bonus
  if (item.syncedLyrics && item.syncedLyrics.length > 20) {
    score += 25;
  }

  return score;
}

/**
 * Fetch lyrics strictly matching the actual song title with verified synced karaoke timing
 */
export async function fetchLyrics(rawTitle, rawArtist, trackDuration = 210) {
  const cacheKey = `${rawTitle}_${rawArtist || ''}`.toLowerCase();

  if (memoryLyricsCache.has(cacheKey)) {
    return memoryLyricsCache.get(cacheKey);
  }

  try {
    const stored = await AsyncStorage.getItem(LYRICS_CACHE_PREFIX + cacheKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      memoryLyricsCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch (e) {}

  const pairs = extractTitleAndArtistPairs(rawTitle, rawArtist);

  for (const pair of pairs) {
    const cleanTitle = pair.title.trim();
    const cleanArtist = (pair.artist || '').trim();
    if (!cleanTitle || cleanTitle.length < 2) continue;

    // Strategy 1: Exact track_name + artist_name lookup on LRCLIB
    if (cleanArtist) {
      try {
        const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(getUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const item = await res.json();
          if (item && (item.syncedLyrics || item.plainLyrics)) {
            let synced = item.syncedLyrics ? parseLrcLyrics(item.syncedLyrics) : null;
            if ((!synced || synced.length === 0) && item.plainLyrics) {
              synced = generateAutoSyncedLyrics(item.plainLyrics, trackDuration);
            }
            if (synced && synced.length > 0) {
              const payload = {
                trackName: item.trackName,
                artistName: item.artistName,
                synced,
                plain: item.plainLyrics || null,
              };
              memoryLyricsCache.set(cacheKey, payload);
              AsyncStorage.setItem(LYRICS_CACHE_PREFIX + cacheKey, JSON.stringify(payload)).catch(() => {});
              return payload;
            }
          }
        }
      } catch (e) {}
    }

    // Strategy 2: Search with candidate title & score results
    try {
      const searchQuery = cleanArtist ? `${cleanTitle} ${cleanArtist}` : cleanTitle;
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Score and rank all results
          const scored = data
            .map((item) => ({
              item,
              score: scoreTrackMatch(cleanTitle, cleanArtist, item),
            }))
            .filter((entry) => entry.score >= 45) // STRICT FILTER: must match song title!
            .sort((a, b) => b.score - a.score);

          if (scored.length > 0) {
            const best = scored[0].item;
            let synced = best.syncedLyrics ? parseLrcLyrics(best.syncedLyrics) : null;

            if ((!synced || synced.length === 0) && best.plainLyrics) {
              synced = generateAutoSyncedLyrics(best.plainLyrics, trackDuration);
            }

            if (synced && synced.length > 0) {
              const payload = {
                trackName: best.trackName,
                artistName: best.artistName,
                synced,
                plain: best.plainLyrics || null,
              };
              memoryLyricsCache.set(cacheKey, payload);
              AsyncStorage.setItem(LYRICS_CACHE_PREFIX + cacheKey, JSON.stringify(payload)).catch(() => {});
              return payload;
            }
          }
        }
      }
    } catch (err) {}
  }

  // Backup fallback: lyrics.ovh
  try {
    const firstTitle = pairs[0]?.title || rawTitle;
    const cleanArtist = rawArtist ? rawArtist.split(/[-|]/)[0].trim() : '';
    if (cleanArtist && firstTitle) {
      const rOvh = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(firstTitle)}`
      );
      if (rOvh.ok) {
        const dOvh = await rOvh.json();
        if (dOvh.lyrics) {
          const synced = generateAutoSyncedLyrics(dOvh.lyrics, trackDuration);
          const payload = {
            trackName: firstTitle,
            artistName: cleanArtist,
            synced,
            plain: dOvh.lyrics,
          };
          memoryLyricsCache.set(cacheKey, payload);
          return payload;
        }
      }
    }
  } catch (e) {}

  return { synced: null, plain: null };
}
