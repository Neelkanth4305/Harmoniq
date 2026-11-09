import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { usePlayer } from '../context/PlayerContext';

export default function YouTubeEngine() {
  const {
    currentTrack,
    isPlaying,
    playbackRate,
    setIsPlaying,
    reportEnginePlaybackPosition,
    setDuration,
    handleTrackEnded,
    seekTarget,
  } = usePlayer();

  const iframeRef = useRef(null);
  const currentVideoIdRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Send control commands to YouTube IFrame via postMessage
  const sendCommand = (func, args = []) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func,
            args,
          }),
          '*'
        );
      }
    } catch (e) {
      console.warn('Error sending postMessage to YouTube IFrame:', e);
    }
  };

  const notifyListening = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening' }),
          '*'
        );
      }
    } catch (e) {}
  };

  // Ensure unmuted & full volume whenever audio starts
  const ensureAudible = () => {
    sendCommand('unMute');
    sendCommand('setVolume', [100]);
  };

  // Turn off playback when tab/phone screen turns off or backgrounded
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setIsPlaying(false);
          sendCommand('pauseVideo');
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [setIsPlaying]);

  // Play / Pause handling
  useEffect(() => {
    if (!currentTrack) return;
    notifyListening();
    if (isPlaying) {
      ensureAudible();
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
  }, [isPlaying]);

  // Playback Rate (Speed / Slowed / Nightcore)
  useEffect(() => {
    if (playbackRate) {
      sendCommand('setPlaybackRate', [playbackRate]);
    }
  }, [playbackRate]);

  // Periodic listener handshake & time request while playing
  useEffect(() => {
    if (!isPlaying) return;
    notifyListening();

    const interval = setInterval(() => {
      notifyListening();
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Audio start guarantee: retry handshake every 400ms for 2.4s after song starts
  useEffect(() => {
    if (!currentTrack || !currentTrack.id || !isPlaying) return;

    const timer = setInterval(() => {
      notifyListening();
      ensureAudible();
      sendCommand('playVideo');
    }, 400);

    const cancelTimeout = setTimeout(() => {
      clearInterval(timer);
    }, 2400);

    return () => {
      clearInterval(timer);
      clearTimeout(cancelTimeout);
    };
  }, [currentTrack?.id, currentTrack?._playNonce, isPlaying]);

  // Seeking handling
  useEffect(() => {
    if (!seekTarget) return;
    sendCommand('seekTo', [seekTarget.position, true]);
    notifyListening();
  }, [seekTarget]);

  // Message listener from YouTube IFrame
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMessage = (event) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            return;
          }
        }

        if (!data || typeof data !== 'object') return;

        // Handle errors (e.g. video unavailable, embed blocked 150/101)
        if (data.event === 'onError') {
          console.warn('YouTube Web Player error code:', data.info);
          setTimeout(() => {
            handleTrackEnded();
          }, 1500);
          return;
        }

        if (data.event === 'infoDelivery' && data.info) {
          const info = data.info;

          // Track playback state: 0 = ended, 1 = playing, 2 = paused
          if (info.playerState !== undefined) {
            if (info.playerState === 0) {
              handleTrackEnded();
            } else if (info.playerState === 1 && !isPlayingRef.current) {
              setIsPlaying(true);
            }
          }

          if (info.currentTime !== undefined && !isNaN(info.currentTime)) {
            reportEnginePlaybackPosition(info.currentTime, info.duration);
          }

          if (info.duration !== undefined && !isNaN(info.duration) && info.duration > 0) {
            setDuration(info.duration);
          }
        }

        // On IFrame ready
        if (data.event === 'onReady') {
          notifyListening();
          ensureAudible();
          if (isPlayingRef.current) {
            sendCommand('playVideo');
          } else {
            sendCommand('pauseVideo');
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleTrackEnded, setIsPlaying, reportEnginePlaybackPosition, setDuration]);

  // Track changed or replayed: Load or cue video
  useEffect(() => {
    if (!currentTrack || !currentTrack.id) return;

    const isSameId = currentVideoIdRef.current === currentTrack.id;
    currentVideoIdRef.current = currentTrack.id;

    notifyListening();
    ensureAudible();

    if (isSameId) {
      if (isPlayingRef.current) {
        sendCommand('playVideo');
      }
      return;
    }

    sendCommand('loadVideoById', [currentTrack.id, 0]);
    if (isPlayingRef.current) {
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
  }, [currentTrack?.id, currentTrack?._playNonce]);

  if (!currentTrack || !currentTrack.id) {
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&enablejsapi=1&playsinline=1&controls=0&modestbranding=1&rel=0`;

  return (
    <View style={styles.hiddenAudioContainer} pointerEvents="none">
      <iframe
        ref={iframeRef}
        id="harmoniq-yt-iframe"
        src={embedUrl}
        title="Harmoniq Background Audio Player"
        width="200"
        height="200"
        style={{
          border: 'none',
          backgroundColor: '#000000',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={() => {
          notifyListening();
          ensureAudible();
          if (isPlayingRef.current) {
            sendCommand('playVideo');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenAudioContainer: {
    position: 'fixed',
    bottom: 0,
    right: 0,
    width: 200,
    height: 200,
    opacity: 0.005,
    zIndex: -1,
  },
});
