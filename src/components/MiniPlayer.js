import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    playbackPosition,
    duration,
    togglePlayPause,
    nextTrack,
    isLiked,
    toggleLike,
    setIsNowPlayingOpen,
  } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (playbackPosition / duration) * 100 : 0;
  const liked = isLiked(currentTrack.id);

  return (
    <View style={styles.outerContainer}>
      {/* Top thin micro progress line */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(100, Math.max(0, progressPercent))}%` },
          ]}
        />
      </View>

      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.92}
        onPress={() => setIsNowPlayingOpen(true)}
      >
        <Image source={{ uri: currentTrack.thumbnail }} style={styles.thumbnail} />

        <View style={styles.trackDetails}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.channel}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => toggleLike(currentTrack)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? colors.accentPink : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playIconBtn}
            onPress={togglePlayPause}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color="#121212"
              style={!isPlaying ? { marginLeft: 2 } : null}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={nextTrack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="play-skip-forward" size={19} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#242424',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginHorizontal: 8,
    marginBottom: Platform.OS === 'web' ? 8 : 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  progressTrack: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.accent,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 54,
  },
  thumbnail: {
    width: 38,
    height: 38,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
  },
  trackDetails: {
    flex: 1,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  artist: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
  playIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
});
