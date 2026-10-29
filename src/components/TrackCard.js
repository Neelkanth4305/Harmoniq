import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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

  // 1. GRID VARIANT (Home quick launch)
  if (variant === 'grid') {
    return (
      <TouchableOpacity
        style={[styles.gridCard, isPlayingThis && styles.activeGridCard]}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <Image source={{ uri: track.thumbnail }} style={styles.gridImage} resizeMode="cover" />
        <View style={styles.gridInfo}>
          <Text
            style={[styles.gridTitle, isPlayingThis && { color: colors.accent }]}
            numberOfLines={2}
          >
            {track.title}
          </Text>
        </View>
        <View style={styles.gridPlayBtn}>
          <Ionicons
            name={isPlayingThis ? 'pulse' : 'play'}
            size={18}
            color={isPlayingThis ? colors.accent : colors.textPrimary}
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
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={styles.carouselImageWrapper}>
          <Image source={{ uri: track.thumbnail }} style={styles.carouselImage} resizeMode="cover" />
          {isPlayingThis && (
            <View style={styles.playingBadge}>
              <Ionicons name="pulse" size={14} color="#080B08" />
            </View>
          )}
        </View>
        <Text
          style={[styles.carouselTitle, isPlayingThis && { color: colors.accent }]}
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
        <Text style={[styles.indexNumber, isPlayingThis && { color: colors.accent }]}>
          {isPlayingThis ? '▶' : index + 1}
        </Text>
      )}

      <Image source={{ uri: track.thumbnail }} style={styles.listImage} resizeMode="cover" />

      <View style={styles.listInfo}>
        <Text
          style={[styles.listTitle, isPlayingThis && { color: colors.accent }]}
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
            size={20}
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
            size={20}
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
            <Ionicons name="add-circle-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid
  gridCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: 8,
    marginHorizontal: 4,
    height: 58,
  },
  activeGridCard: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  gridImage: {
    width: 58,
    height: 58,
    backgroundColor: colors.surfaceLight,
  },
  gridInfo: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  gridTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  gridPlayBtn: {
    paddingRight: 12,
  },

  // Carousel
  carouselCard: {
    width: 148,
    marginRight: 14,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  activeCarouselCard: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  carouselImageWrapper: {
    position: 'relative',
    width: 128,
    height: 128,
    marginBottom: 8,
  },
  carouselImage: {
    width: 128,
    height: 128,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
  },
  playingBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 4,
  },
  carouselTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  carouselSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  // List
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  activeRow: {
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  indexNumber: {
    width: 24,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginRight: 8,
  },
  listImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  listTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  listSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
    marginLeft: 4,
  },
});
