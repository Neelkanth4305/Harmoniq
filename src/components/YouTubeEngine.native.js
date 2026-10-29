import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
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

  const playerRef = useRef(null);
  const timerRef = useRef(null);

  // Position and duration polling
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(async () => {
        if (playerRef.current) {
          try {
            const currentTime = await playerRef.current.getCurrentTime();
            const totalDuration = await playerRef.current.getDuration();
            if (currentTime !== undefined && !isNaN(currentTime)) {
              setPlaybackPosition(currentTime);
            }
            if (totalDuration !== undefined && !isNaN(totalDuration) && totalDuration > 0) {
              setDuration(totalDuration);
            }
          } catch (e) {}
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

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
      setIsPlaying(true);
    } else if (state === 'paused') {
      setIsPlaying(false);
    }
  };

  const handleError = (error) => {
    console.warn('Native YouTube Player error:', error);
    setTimeout(() => {
      handleTrackEnded();
    }, 2000);
  };

  if (!currentTrack || !currentTrack.id) {
    return null;
  }

  return (
    <View style={styles.nativeContainer} pointerEvents="none">
      <YoutubePlayer
        ref={playerRef}
        height={100}
        width={160}
        play={isPlaying}
        videoId={currentTrack.id}
        onChangeState={handleChangeState}
        onError={handleError}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          androidLayerType: 'hardware',
        }}
        initialPlayerParams={{
          controls: false,
          showClosedCaptions: false,
          preventFullScreen: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nativeContainer: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 160,
    height: 100,
    overflow: 'hidden',
    opacity: 0.05,
  },
});
