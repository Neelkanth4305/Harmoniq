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
      {/* Top neon micro progress line */}
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
        activeOpacity={0.9}
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
              size={22}
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
              size={20}
              color="#080B08"
              style={!isPlaying ? { marginLeft: 2 } : null}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={nextTrack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="play-skip-forward" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0,
    overflow: 'hidden',
    marginHorizontal: 8,
    marginBottom: Platform.OS === 'web' ? 8 : 4,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  progressTrack: {
    height: 2.5,
    width: '100%',
    backgroundColor: colors.divider,
  },
  progressFill: {
    height: 2.5,
    backgroundColor: colors.accent,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 56,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
  },
  trackDetails: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 13,
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
  },
  iconBtn: {
    padding: 6,
    marginLeft: 4,
  },
  playIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});
