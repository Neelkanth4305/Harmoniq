import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { importSpotifyPlaylist as fetchSpotifyPlaylist } from '../api/spotifyImport';

const STORAGE_KEYS = {
  LIKES: '@harmoniq_likes',
  PLAYLISTS: '@harmoniq_playlists',
  RECENTLY_PLAYED: '@harmoniq_recently_played',
  RECENT_SEARCHES: '@harmoniq_recent_searches',
  DOWNLOADS: '@harmoniq_downloads',
};

const DEFAULT_PLAYLISTS = [
  {
    id: 'pl_family',
    name: 'Family Favorites',
    createdAt: Date.now(),
    tracks: [],
  },
];

export function parseDuration(dur) {
  if (typeof dur === 'number' && dur > 0) return dur;
  if (!dur || typeof dur !== 'string') return 210;

  const parts = dur.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 210;
}

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(210);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [likes, setLikes] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [playlists, setPlaylists] = useState(DEFAULT_PLAYLISTS);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [recentSearches, setRecentSearches] = useState(['Arijit Singh', 'Ed Sheeran', 'Lo-Fi Chill', 'Gym Workout']);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [seekTarget, setSeekTarget] = useState(null);

  const durationRef = useRef(duration);
  durationRef.current = duration;

  // Load stored state
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [storedLikes, storedPlaylists, storedRecent, storedSearches, storedDownloads] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LIKES),
          AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS),
          AsyncStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED),
          AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES),
          AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADS),
        ]);

        if (storedLikes) setLikes(JSON.parse(storedLikes));
        if (storedDownloads) setDownloads(JSON.parse(storedDownloads));
        if (storedPlaylists) setPlaylists(JSON.parse(storedPlaylists));
        if (storedRecent) {
          const parsed = JSON.parse(storedRecent);
          setRecentlyPlayed(parsed);
          if (parsed.length > 0) {
            setCurrentTrack(parsed[0]);
            setQueue(parsed);
            setQueueIndex(0);
            setDuration(parsed[0].durationSeconds || parseDuration(parsed[0].duration));
          }
        }
        if (storedSearches) setRecentSearches(JSON.parse(storedSearches));
      } catch (err) {
        console.warn('Error loading stored state:', err);
      }
    };

    loadStoredData();
  }, []);

  // Save updates
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(likes)).catch(() => {});
  }, [likes]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(downloads)).catch(() => {});
  }, [downloads]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists)).catch(() => {});
  }, [playlists]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(recentlyPlayed)).catch(() => {});
  }, [recentlyPlayed]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(recentSearches)).catch(() => {});
  }, [recentSearches]);

  const seekTo = useCallback((seconds) => {
    const clamped = Math.max(0, Math.min(seconds, durationRef.current));
    setPlaybackPosition(clamped);
    setSeekTarget({ timestamp: Date.now(), position: clamped });
  }, []);

  const nextTrack = useCallback(() => {
    if (repeatMode === 'one' && currentTrack) {
      seekTo(0);
      setIsPlaying(true);
      return;
    }

    if (queue.length === 0) return;

    if (isShuffle && queue.length > 1) {
      let randIndex = Math.floor(Math.random() * queue.length);
      if (randIndex === queueIndex) {
        randIndex = (randIndex + 1) % queue.length;
      }
      const track = queue[randIndex];
      setQueueIndex(randIndex);
      setCurrentTrack(track);
      setDuration(track.durationSeconds || parseDuration(track.duration));
      setPlaybackPosition(0);
      setIsPlaying(true);
      return;
    }

    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      const track = queue[nextIdx];
      setQueueIndex(nextIdx);
      setCurrentTrack(track);
      setDuration(track.durationSeconds || parseDuration(track.duration));
      setPlaybackPosition(0);
      setIsPlaying(true);
    } else if (repeatMode === 'all' && queue.length > 0) {
      const track = queue[0];
      setQueueIndex(0);
      setCurrentTrack(track);
      setDuration(track.durationSeconds || parseDuration(track.duration));
      setPlaybackPosition(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex, isShuffle, repeatMode, currentTrack, seekTo]);

  const prevTrack = useCallback(() => {
    if (playbackPosition > 3) {
      seekTo(0);
      return;
    }

    if (queue.length === 0) return;

    const prevIdx = queueIndex - 1;
    if (prevIdx >= 0) {
      const track = queue[prevIdx];
      setQueueIndex(prevIdx);
      setCurrentTrack(track);
      setDuration(track.durationSeconds || parseDuration(track.duration));
      setPlaybackPosition(0);
      setIsPlaying(true);
    } else {
      seekTo(0);
    }
  }, [playbackPosition, queue, queueIndex, seekTo]);

  const handleTrackEnded = useCallback(() => {
    nextTrack();
  }, [nextTrack]);

  // Active progress ticker
  useEffect(() => {
    let interval = null;

    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackPosition((prev) => {
          const currentDur = durationRef.current;
          const next = prev + 1;
          if (currentDur > 0 && next >= currentDur) {
            handleTrackEnded();
            return 0;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, handleTrackEnded]);

  const playTrack = useCallback(
    (track, newQueue = null) => {
      if (!track || !track.id) return;

      let targetQueue = queue;
      let targetIndex = 0;

      if (newQueue && newQueue.length > 0) {
        targetQueue = newQueue;
        targetIndex = newQueue.findIndex((t) => t.id === track.id);
        if (targetIndex === -1) {
          targetQueue = [track, ...newQueue];
          targetIndex = 0;
        }
        setQueue(targetQueue);
        setQueueIndex(targetIndex);
      } else {
        targetIndex = queue.findIndex((t) => t.id === track.id);
        if (targetIndex === -1) {
          targetQueue = [...queue, track];
          targetIndex = targetQueue.length - 1;
          setQueue(targetQueue);
        }
        setQueueIndex(targetIndex);
      }

      const trackDuration = track.durationSeconds || parseDuration(track.duration);
      setDuration(trackDuration);
      setCurrentTrack(track);
      setPlaybackPosition(0);
      setIsPlaying(true);

      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((t) => t.id !== track.id);
        return [track, ...filtered].slice(0, 25);
      });
    },
    [queue]
  );

  const togglePlayPause = useCallback(() => {
    if (!currentTrack) {
      if (queue.length > 0) {
        playTrack(queue[0]);
      } else if (recentlyPlayed.length > 0) {
        playTrack(recentlyPlayed[0], recentlyPlayed);
      }
      return;
    }
    setIsPlaying((prev) => !prev);
  }, [currentTrack, queue, recentlyPlayed, playTrack]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleLike = useCallback((track) => {
    if (!track || !track.id) return;
    setLikes((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) {
        return prev.filter((t) => t.id !== track.id);
      } else {
        return [track, ...prev];
      }
    });
  }, []);

  const isLiked = useCallback(
    (trackId) => likes.some((t) => t.id === trackId),
    [likes]
  );

  // Download Management
  const downloadTrack = useCallback((track) => {
    if (!track || !track.id) return;
    setDownloads((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) return prev;
      return [{ ...track, downloadedAt: Date.now() }, ...prev];
    });
  }, []);

  const removeDownload = useCallback((trackId) => {
    setDownloads((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  const isDownloaded = useCallback(
    (trackId) => downloads.some((t) => t.id === trackId),
    [downloads]
  );

  // Playlist Management
  const createPlaylist = useCallback((name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;
    const newPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      createdAt: Date.now(),
      tracks: [],
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    return newPlaylist;
  }, []);

  const addToPlaylist = useCallback((playlistId, track) => {
    if (!track || !track.id) return;
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const exists = pl.tracks.some((t) => t.id === track.id);
        if (exists) return pl;
        return { ...pl, tracks: [...pl.tracks, track] };
      })
    );
  }, []);

  const removeFromPlaylist = useCallback((playlistId, trackId) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        return { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId) };
      })
    );
  }, []);

  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== playlistId));
  }, []);

  // Spotify Playlist Import
  const importSpotify = useCallback(async (spotifyUrl, onProgress) => {
    const imported = await fetchSpotifyPlaylist(spotifyUrl, onProgress);
    if (imported) {
      setPlaylists((prev) => [imported, ...prev]);
    }
    return imported;
  }, []);

  const addRecentSearch = useCallback((query) => {
    const trimmed = (query || '').trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 10);
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const value = useMemo(
    () => ({
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      playbackPosition,
      duration,
      isShuffle,
      repeatMode,
      likes,
      downloads,
      playlists,
      recentlyPlayed,
      recentSearches,
      isNowPlayingOpen,
      seekTarget,
      setIsPlaying,
      setPlaybackPosition,
      setDuration,
      setIsNowPlayingOpen,
      playTrack,
      togglePlayPause,
      seekTo,
      nextTrack,
      prevTrack,
      toggleShuffle,
      toggleRepeat,
      toggleLike,
      isLiked,
      downloadTrack,
      removeDownload,
      isDownloaded,
      createPlaylist,
      addToPlaylist,
      removeFromPlaylist,
      deletePlaylist,
      importSpotify,
      addRecentSearch,
      clearRecentSearches,
      handleTrackEnded,
    }),
    [
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      playbackPosition,
      duration,
      isShuffle,
      repeatMode,
      likes,
      downloads,
      playlists,
      recentlyPlayed,
      recentSearches,
      isNowPlayingOpen,
      seekTarget,
      playTrack,
      togglePlayPause,
      seekTo,
      nextTrack,
      prevTrack,
      toggleShuffle,
      toggleRepeat,
      toggleLike,
      isLiked,
      downloadTrack,
      removeDownload,
      isDownloaded,
      createPlaylist,
      addToPlaylist,
      removeFromPlaylist,
      deletePlaylist,
      importSpotify,
      addRecentSearch,
      clearRecentSearches,
      handleTrackEnded,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
