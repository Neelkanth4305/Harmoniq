import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { usePlayer } from '../context/PlayerContext';

export default function YouTubeEngine() {
  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    reportEnginePlaybackPosition,
    handleTrackEnded,
    seekTarget,
  } = usePlayer();

  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // High precision position and duration polling (250ms)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(async () => {
        if (playerRef.current) {
          try {
            const currentTime = await playerRef.current.getCurrentTime();
            const totalDuration = await playerRef.current.getDuration();
            if (currentTime !== undefined && !isNaN(currentTime)) {
              reportEnginePlaybackPosition(currentTime, totalDuration);
            }
          } catch (e) {}
        }
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, reportEnginePlaybackPosition]);

  // Turn off playback when phone screen turns off / app is backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsPlaying(false);
      }
    });
    return () => sub.remove();
  }, [setIsPlaying]);

  // Handle seeking
  useEffect(() => {
    if (seekTarget && playerRef.current) {
      try {
        playerRef.current.seekTo(seekTarget.position, true);
      } catch (e) {}
    }
  }, [seekTarget]);

  const handleChangeState = (state) => {
    if (state === 'ended') {
      handleTrackEnded();
    } else if (state === 'playing') {
      if (!isPlayingRef.current) {
        setIsPlaying(true);
      }
    }
    // Note: Do NOT set isPlaying(false) on 'paused' because YouTube emits transient
    // paused events while transitioning/buffering which cancels user-initiated playback!
  };

  const handleError = (error) => {
    console.warn('Native YouTube Player error:', error);
    setTimeout(() => {
      handleTrackEnded();
    }, 1500);
  };

  if (!currentTrack || !currentTrack.id) {
    return null;
  }

  return (
    <View style={styles.nativeContainer} pointerEvents="none">
      <YoutubePlayer
        ref={playerRef}
        height={220}
        width={320}
        play={isPlaying}
        videoId={currentTrack.id}
        onChangeState={handleChangeState}
        onError={handleError}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          androidLayerType: 'hardware',
          mixedContentMode: 'always',
        }}
        initialPlayerParams={{
          controls: false,
          showClosedCaptions: false,
          preventFullScreen: true,
          modestbranding: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nativeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 2,
    height: 2,
    opacity: 0.01,
    zIndex: -999,
    overflow: 'hidden',
  },
});
