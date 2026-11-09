import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';

export default function TrackCard({
  track,
  variant = 'list', // 'grid' | 'carousel' | 'list'
  onPress,
  onAddToPlaylist,
  isPlayingThis = false,
  index,
}) {
  const { isLiked, toggleLike, isDownloaded, downloadTrack } = usePlayer();
  const liked = isLiked(track?.id);
  const downloaded = isDownloaded(track?.id);

  if (!track) return null;

  // 1. GRID VARIANT (Home quick launch 2-column)
  if (variant === 'grid') {
    return (
      <TouchableOpacity
        style={[styles.gridCard, isPlayingThis && styles.activeGridCard]}
        activeOpacity={0.75}
        onPress={onPress}
      >
        <Image source={{ uri: track.thumbnail }} style={styles.gridImage} resizeMode="cover" />
        <View style={styles.gridInfo}>
          <Text
            style={[styles.gridTitle, isPlayingThis && styles.activeText]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text style={styles.gridChannel} numberOfLines={1}>
            {track.channel}
          </Text>
        </View>
        <View style={styles.gridPlayBtn}>
          <Ionicons
            name={isPlayingThis ? 'volume-high' : 'play'}
            size={16}
            color={isPlayingThis ? colors.accent : colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  }

  // 2. CAROUSEL VARIANT (Dynamic discovery rows)
  if (variant === 'carousel') {
    return (
      <TouchableOpacity
        style={[styles.carouselCard, isPlayingThis && styles.activeCarouselCard]}
        activeOpacity={0.75}
        onPress={onPress}
      >
        <View style={styles.carouselImageWrapper}>
          <Image source={{ uri: track.thumbnail }} style={styles.carouselImage} resizeMode="cover" />
          {isPlayingThis && (
            <View style={styles.playingBadge}>
              <Ionicons name="volume-high" size={13} color="#121212" />
            </View>
          )}
        </View>
        <Text
          style={[styles.carouselTitle, isPlayingThis && styles.activeText]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text style={styles.carouselSubtitle} numberOfLines={1}>
          {track.channel}
        </Text>
      </TouchableOpacity>
    );
  }

  // 3. LIST VARIANT (Search, playlists & downloads)
  return (
    <TouchableOpacity
      style={[styles.listRow, isPlayingThis && styles.activeRow]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {index !== undefined && (
        <Text style={[styles.indexNumber, isPlayingThis && styles.activeText]}>
          {isPlayingThis ? '▶' : index + 1}
        </Text>
      )}

      <Image source={{ uri: track.thumbnail }} style={styles.listImage} resizeMode="cover" />

      <View style={styles.listInfo}>
        <Text
          style={[styles.listTitle, isPlayingThis && styles.activeText]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text style={styles.listSubtitle} numberOfLines={1}>
          {track.channel}
        </Text>
      </View>

      <View style={styles.listActions}>
        {/* Download Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => downloadTrack(track)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={downloaded ? 'checkmark-circle' : 'cloud-download-outline'}
            size={18}
            color={downloaded ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Like Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => toggleLike(track)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? colors.accentPink : colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Add to Playlist */}
        {onAddToPlaylist && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onAddToPlaylist(track)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  activeText: {
    color: colors.accent,
  },

  // Grid
  gridCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: 8,
    marginHorizontal: 4,
    height: 54,
  },
  activeGridCard: {
    backgroundColor: colors.surfaceLight,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  gridImage: {
    width: 54,
    height: 54,
    backgroundColor: colors.surfaceLight,
  },
  gridInfo: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  gridTitle: {
    color: colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 16,
  },
  gridChannel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  gridPlayBtn: {
    paddingRight: 10,
  },

  // Carousel
  carouselCard: {
    width: 140,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  activeCarouselCard: {
    backgroundColor: colors.surfaceLight,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  carouselImageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  carouselImage: {
    width: 120,
    height: 120,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
  },
  playingBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 4,
  },
  carouselTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  carouselSubtitle: {
    color: colors.textSecondary,
    fontSize: 11.5,
  },

  // List
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  activeRow: {
    backgroundColor: colors.surfaceLight,
  },
  indexNumber: {
    width: 22,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginRight: 6,
  },
  listImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  listTitle: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  listSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
});
