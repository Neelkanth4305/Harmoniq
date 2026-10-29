import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { usePlayer } from '../context/PlayerContext';

export default function YouTubeEngine() {
  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    setPlaybackPosition,
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

  // Play / Pause handling: ONLY execute when explicitly changed
  useEffect(() => {
    if (!currentTrack) return;
    if (isPlaying) {
      notifyListening();
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
  }, [isPlaying]);

  // Periodic listener handshake when actively playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      notifyListening();
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying]);

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

        if (data.event === 'infoDelivery' && data.info) {
          const info = data.info;

          // Track state: 0 = ended, 1 = playing, 2 = paused
          if (info.playerState !== undefined) {
            if (info.playerState === 0) {
              handleTrackEnded();
            } else if (info.playerState === 1 && isPlayingRef.current) {
              // Only confirm playing if user actually requested playback
              setIsPlaying(true);
            } else if (info.playerState === 2) {
              setIsPlaying(false);
            }
          }

          if (info.currentTime !== undefined && !isNaN(info.currentTime)) {
            setPlaybackPosition(info.currentTime);
          }

          if (info.duration !== undefined && !isNaN(info.duration) && info.duration > 0) {
            setDuration(info.duration);
          }
        }

        // On IFrame ready: DO NOT AUTOPLAY! Only listen.
        if (data.event === 'onReady') {
          notifyListening();
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
  }, [handleTrackEnded, setIsPlaying, setPlaybackPosition, setDuration]);

  // Track changed
  useEffect(() => {
    if (!currentTrack || !currentTrack.id) return;
    if (currentVideoIdRef.current === currentTrack.id) return;

    const isFirstMount = currentVideoIdRef.current === null;
    currentVideoIdRef.current = currentTrack.id;

    notifyListening();

    if (isFirstMount && !isPlayingRef.current) {
      // First initial track loaded from storage on website visit:
      // CUE the video in paused state so it DOES NOT directly start playing!
      sendCommand('cueVideoById', [currentTrack.id, 0]);
      sendCommand('pauseVideo');
    } else {
      // Explicit user track selection
      sendCommand('loadVideoById', [currentTrack.id, 0]);
      if (isPlayingRef.current) {
        sendCommand('playVideo');
      } else {
        sendCommand('pauseVideo');
      }
    }
  }, [currentTrack]);

  if (!currentTrack || !currentTrack.id) {
    return null;
  }

  // Set autoplay=0 when visiting website so browser never starts audio automatically!
  const autoplayParam = isPlaying ? 1 : 0;
  const embedUrl = `https://www.youtube.com/embed/${currentTrack.id}?autoplay=${autoplayParam}&enablejsapi=1&playsinline=1&controls=0&modestbranding=1&rel=0`;

  // Hidden background audio container (NO floating preview on screen)
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
        onLoad={notifyListening}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenAudioContainer: {
    position: 'fixed',
    top: -9999,
    left: -9999,
    width: 200,
    height: 200,
    opacity: 0.001,
    zIndex: -1,
  },
});
