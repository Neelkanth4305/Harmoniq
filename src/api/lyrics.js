import AsyncStorage from '@react-native-async-storage/async-storage';

const LYRICS_CACHE_PREFIX = '@harmoniq_lyrics_v5_';
const memoryLyricsCache = new Map();

// Known publishing channels and record labels that are NOT artist names
const RECORD_LABELS = new Set([
  't-series', 'tseries', 't-series bhakti sagar', 'zee music company', 'zee music',
  'sony music india', 'sony music entertainment', 'sony music', 'sonymusicindiavevo',
  'yrf', 'tips official', 'tips music', 'speed records', 'saregama music', 'saregama',
  'eros now', 'warner records', 'warner music', 'atlantic records', 'universal music group',
  'vevo', 'topic', 'various artists', 'coke studio', 'geet mp3', 'white hill music',
  'aditya music', 'lahari music', 't-series regional'
]);

/**
 * Remove YouTube clutter, bracketed video tags, and technical noise
 */
function cleanVideoNoise(text) {
  if (!text) return '';
  return text
    .replace(/\((official|music|video|audio|lyrics|lyric video|hd|4k|remastered|full song|visualizer|live|acoustic|slowed|reverb|from [^\)]*)[^\)]*\)/gi, '')
    .replace(/\[(official|music|video|audio|lyrics|lyric video|hd|4k|remastered|full song|visualizer|live|acoustic|slowed|reverb|from [^\]]*)[^\]]*\]/gi, '')
    .replace(/ft\..*/gi, '')
    .replace(/feat\..*/gi, '')
    .replace(/featuring\..*/gi, '')
    .replace(/prod\..*/gi, '')
    .replace(/full\s+song/gi, '')
    .replace(/video\s+song/gi, '')
    .replace(/lyric\s+video/gi, '')
    .replace(/official\s+video/gi, '')
    .replace(/official\s+audio/gi, '')
    .replace(/audio\s+song/gi, '')
    .replace(/video/gi, '')
    .replace(/["“”'']/g, '')
    .trim();
}

/**
 * Generate intelligent query candidates for LRCLIB
 */
export function extractTitleAndArtistPairs(rawTitle, rawArtist) {
  if (!rawTitle) return [];

  const cleanT = cleanVideoNoise(rawTitle);
  let cleanA = (rawArtist || '')
    .replace(/(vevo|official|music|channel|records|topic)[^\w]*/gi, '')
    .trim();

  // If the channel name is a record label, ignore it as artist
  if (
    RECORD_LABELS.has((rawArtist || '').toLowerCase().trim()) ||
    RECORD_LABELS.has(cleanA.toLowerCase().trim())
  ) {
    cleanA = '';
  }

  const candidates = [];

  // 1. Split on pipe '|'
  const pipeSegments = cleanT.split('|').map((s) => s.trim()).filter(Boolean);
  pipeSegments.forEach((seg) => {
    candidates.push({ title: seg, artist: cleanA });
  });

  const mainSegment = pipeSegments[0] || cleanT;

  // 2. Split on dash ' - ' or colon ':'
  const sepRegex = / - | – | — |: /;
  if (sepRegex.test(mainSegment)) {
    const parts = mainSegment.split(sepRegex).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const p0 = parts[0];
      const p1 = parts[1];
      candidates.push({ title: p1, artist: p0 });
      candidates.push({ title: p0, artist: cleanA || p1 });
      if (cleanA) {
        candidates.push({ title: p1, artist: cleanA });
        candidates.push({ title: p0, artist: cleanA });
      }
    }
  }

  // 3. Clean main segment without separators
  const cleanMain = mainSegment.replace(/[:|]/g, ' ').replace(/\s+/g, ' ').trim();
  candidates.push({ title: cleanMain, artist: cleanA });

  // 4. First 2-3 words of title
  const words = cleanMain.split(/\s+/);
  if (words.length > 3) {
    const firstThree = words.slice(0, 3).join(' ').trim();
    candidates.push({ title: firstThree, artist: cleanA });
  }

  // Deduplicate
  const seen = new Set();
  const deduped = [];
  for (const c of candidates) {
    const t = c.title.trim();
    const a = (c.artist || '').trim();
    const key = `${t.toLowerCase()}___${a.toLowerCase()}`;
    if (t.length >= 2 && !seen.has(key)) {
      seen.add(key);
      deduped.push({ title: t, artist: a });
    }
  }

  return deduped;
}

/**
 * Parse standard LRC format string into array of { time: seconds, text: string }
 * Handles multiple timestamps per line and fractional milliseconds
 */
export function parseLrcLyrics(lrcString) {
  if (!lrcString) return [];
  const lines = lrcString.split('\n');
  const result = [];
  const timeTagRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeTagRegex)];
    if (matches.length > 0) {
      const cleanText = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
      if (cleanText) {
        for (const match of matches) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const millis = match[3] ? parseFloat(`0.${match[3]}`) : 0;
          const totalTime = minutes * 60 + seconds + millis;
          result.push({ time: parseFloat(totalTime.toFixed(2)), text: cleanText });
        }
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * Score track match against LRCLIB candidate
 */
function scoreTrackMatch(candidateTitle, candidateArtist, item, trackDuration) {
  if (!item || !item.trackName) return 0;

  const itemTrack = item.trackName.toLowerCase().trim();
  const itemArtist = (item.artistName || '').toLowerCase().trim();
  const queryTitle = candidateTitle.toLowerCase().trim();
  const queryArtist = (candidateArtist || '').toLowerCase().trim();

  let score = 0;

  // Real Synced Lyrics: Major priority
  if (item.syncedLyrics && item.syncedLyrics.trim().length > 30) {
    score += 80;
  }

  // Duration proximity match
  if (item.duration && trackDuration > 0) {
    const diff = Math.abs(item.duration - trackDuration);
    if (diff <= 6) {
      score += 40;
    } else if (diff <= 15) {
      score += 20;
    }
  }

  // Exact or prefix title match
  if (itemTrack === queryTitle) {
    score += 60;
  } else if (itemTrack.startsWith(queryTitle) || queryTitle.startsWith(itemTrack)) {
    score += 40;
  } else if (itemTrack.includes(queryTitle) || queryTitle.includes(itemTrack)) {
    score += 30;
  }

  // Artist match
  if (queryArtist && itemArtist) {
    if (itemArtist === queryArtist) {
      score += 40;
    } else if (itemArtist.includes(queryArtist) || queryArtist.includes(itemArtist)) {
      score += 25;
    }
  }

  return score;
}

/**
 * Fetch lyrics with verified synced karaoke timing from LRCLIB & fallbacks
 * Computes intelligent video intro offset delta between video and studio audio
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

    // Strategy 1: Targeted LRCLIB exact get
    if (cleanArtist) {
      try {
        const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(getUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const item = await res.json();
          if (item && item.syncedLyrics && item.syncedLyrics.length > 20) {
            const synced = parseLrcLyrics(item.syncedLyrics);
            if (synced && synced.length > 0) {
              let suggestedIntroOffset = 0;
              if (item.duration && trackDuration > 0) {
                const delta = trackDuration - item.duration;
                if (delta >= 1.5 && delta <= 20) {
                  suggestedIntroOffset = parseFloat(delta.toFixed(1));
                }
              }

              const payload = {
                trackName: item.trackName,
                artistName: item.artistName,
                duration: item.duration,
                suggestedIntroOffset,
                synced,
                plain: item.plainLyrics || null,
                isSynced: true,
              };
              memoryLyricsCache.set(cacheKey, payload);
              AsyncStorage.setItem(LYRICS_CACHE_PREFIX + cacheKey, JSON.stringify(payload)).catch(() => {});
              return payload;
            }
          }
        }
      } catch (e) {}
    }

    // Strategy 2: LRCLIB search query
    const searchQueries = [
      cleanArtist ? `${cleanTitle} ${cleanArtist}` : cleanTitle,
      cleanTitle,
    ];

    for (const q of searchQueries) {
      try {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(searchUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const scored = data
              .map((item) => ({
                item,
                score: scoreTrackMatch(cleanTitle, cleanArtist, item, trackDuration),
              }))
              .filter((entry) => entry.score >= 30)
              .sort((a, b) => b.score - a.score);

            if (scored.length > 0) {
              const bestSynced = scored.find((s) => s.item.syncedLyrics && s.item.syncedLyrics.length > 20);
              const chosen = bestSynced ? bestSynced.item : scored[0].item;

              const synced = chosen.syncedLyrics ? parseLrcLyrics(chosen.syncedLyrics) : null;
              const hasValidSynced = synced && synced.length > 0;

              let suggestedIntroOffset = 0;
              if (chosen.duration && trackDuration > 0) {
                const delta = trackDuration - chosen.duration;
                if (delta >= 1.5 && delta <= 20) {
                  suggestedIntroOffset = parseFloat(delta.toFixed(1));
                }
              }

              const payload = {
                trackName: chosen.trackName,
                artistName: chosen.artistName,
                duration: chosen.duration,
                suggestedIntroOffset,
                synced: hasValidSynced ? synced : null,
                plain: chosen.plainLyrics || null,
                isSynced: hasValidSynced,
              };

              if (payload.synced || payload.plain) {
                memoryLyricsCache.set(cacheKey, payload);
                AsyncStorage.setItem(LYRICS_CACHE_PREFIX + cacheKey, JSON.stringify(payload)).catch(() => {});
                return payload;
              }
            }
          }
        }
      } catch (subErr) {}
    }
  }

  // Strategy 3: Secondary plain lyrics provider fallback (lyrics.ovh)
  try {
    const firstTitle = pairs[0]?.title || rawTitle;
    const cleanArtist = rawArtist && !RECORD_LABELS.has(rawArtist.toLowerCase().trim())
      ? rawArtist.split(/[-|]/)[0].trim()
      : '';

    if (cleanArtist && firstTitle) {
      const rOvh = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(firstTitle)}`
      );
      if (rOvh.ok) {
        const dOvh = await rOvh.json();
        if (dOvh.lyrics) {
          const payload = {
            trackName: firstTitle,
            artistName: cleanArtist,
            duration: null,
            suggestedIntroOffset: 0,
            synced: null,
            plain: dOvh.lyrics,
            isSynced: false,
          };
          memoryLyricsCache.set(cacheKey, payload);
          return payload;
        }
      }
    }
  } catch (e) {}

  return { synced: null, plain: null, isSynced: false, suggestedIntroOffset: 0 };
}
