import { searchYouTubeMusic } from './youtube';
import { Platform } from 'react-native';

/**
 * Extracts playlist ID from any Spotify URL:
 * https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
 * spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 */
export function extractSpotifyPlaylistId(url) {
  if (!url) return null;
  const match = url.match(/playlist[\/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Import a Spotify playlist by URL:
 * 1. Fetches Spotify embed metadata (playlist title, cover, track names, artists)
 * 2. Matches each track to YouTube streamable videos
 * 3. Returns ready-to-play playlist object
 */
export async function importSpotifyPlaylist(spotifyUrl, onProgress = null) {
  const playlistId = extractSpotifyPlaylistId(spotifyUrl);
  if (!playlistId) {
    throw new Error('Invalid Spotify playlist URL. Please provide a link like: https://open.spotify.com/playlist/...');
  }

  let embedHtml = null;
  const targetUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;

  // Try fetching embed page directly
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      embedHtml = await res.text();
    }
  } catch (e) {
    // If CORS or network issue on Web, try proxy
    if (Platform.OS === 'web') {
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const pRes = await fetch(proxyUrl);
        if (pRes.ok) {
          embedHtml = await pRes.text();
        }
      } catch (err) {}
    }
  }

  let playlistName = 'Imported Spotify Playlist';
  let rawTracks = [];

  if (embedHtml) {
    // Extract __NEXT_DATA__ JSON from Spotify embed page
    const idx = embedHtml.indexOf('__NEXT_DATA__');
    if (idx !== -1) {
      try {
        const start = embedHtml.indexOf('>', idx) + 1;
        const end = embedHtml.indexOf('</script>', start);
        const jsonStr = embedHtml.substring(start, end);
        const parsed = JSON.parse(jsonStr);
        const entity = parsed.props?.pageProps?.state?.data?.entity;

        if (entity?.name) playlistName = entity.name;
        if (Array.isArray(entity?.trackList)) {
          rawTracks = entity.trackList.map((t) => ({
            title: t.title,
            artist: t.subtitle,
          }));
        }
      } catch (err) {
        console.warn('Error parsing Spotify embed JSON:', err);
      }
    }
  }

  // Fallback to oEmbed if track list is empty
  if (rawTracks.length === 0) {
    try {
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`);
      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        if (odata.title) playlistName = odata.title;
      }
    } catch (e) {}
  }

  if (rawTracks.length === 0) {
    throw new Error('Could not read tracks from this Spotify playlist. Make sure the playlist is public.');
  }

  // Convert raw track names to streamable YouTube tracks (take top 20 for fast snappy import)
  const tracksToImport = rawTracks.slice(0, 20);
  const resolvedTracks = [];

  for (let i = 0; i < tracksToImport.length; i++) {
    const item = tracksToImport[i];
    if (onProgress) {
      onProgress(Math.round(((i + 1) / tracksToImport.length) * 100));
    }

    try {
      const query = `${item.title} ${item.artist || ''}`.trim();
      const searchRes = await searchYouTubeMusic(query);
      if (searchRes.tracks && searchRes.tracks.length > 0) {
        resolvedTracks.push(searchRes.tracks[0]);
      }
    } catch (err) {
      // Continue to next track
    }
  }

  return {
    id: `spotify_${playlistId}_${Date.now()}`,
    name: playlistName,
    createdAt: Date.now(),
    isSpotifyImport: true,
    originalUrl: spotifyUrl,
    tracks: resolvedTracks,
  };
}
