import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import CustomSeekBar from '../components/CustomSeekBar';
import PlaylistModal from '../components/PlaylistModal';
import LyricsView from '../components/LyricsView';

export default function NowPlayingModal() {
  const {
    currentTrack,
    isPlaying,
    playbackPosition,
    duration,
    isShuffle,
    repeatMode,
    isNowPlayingOpen,
    setIsNowPlayingOpen,
    togglePlayPause,
    seekTo,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    isLiked,
    isDownloaded,
    downloadTrack,
  } = usePlayer();

  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState('art'); // 'art' | 'lyrics' | 'video'
  const { height, width } = useWindowDimensions();

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const downloaded = isDownloaded(currentTrack.id);
  const mediaSize = Math.min(width - 48, height * 0.38, 360);

  return (
    <Modal
      visible={isNowPlayingOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setIsNowPlayingOpen(false)}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar with Mode Selector */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.topIconBtn}
              onPress={() => setIsNowPlayingOpen(false)}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.viewModeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, activeViewMode === 'art' && styles.activeModeTab]}
                onPress={() => setActiveViewMode('art')}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    activeViewMode === 'art' && styles.activeModeTabText,
                  ]}
                >
                  Cover
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, activeViewMode === 'lyrics' && styles.activeModeTab]}
                onPress={() => setActiveViewMode('lyrics')}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    activeViewMode === 'lyrics' && styles.activeModeTabText,
                  ]}
                >
                  Lyrics
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, activeViewMode === 'video' && styles.activeModeTab]}
                onPress={() => setActiveViewMode('video')}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    activeViewMode === 'video' && styles.activeModeTabText,
                  ]}
                >
                  Video
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.topIconBtn}
              onPress={() => setPlaylistModalVisible(true)}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Central Stage: Artwork / Synced Lyrics / Video */}
          <View style={styles.centralStage}>
            {activeViewMode === 'art' && (
              <View style={styles.artWrapper}>
                <Image
                  source={{ uri: currentTrack.thumbnail }}
                  style={[styles.albumArt, { width: mediaSize, height: mediaSize }]}
                  resizeMode="cover"
                />
              </View>
            )}

            {activeViewMode === 'lyrics' && (
              <View style={[styles.lyricsWrapper, { height: height * 0.44 }]}>
                <LyricsView track={currentTrack} />
              </View>
            )}

            {activeViewMode === 'video' && (
              <View
                style={[
                  styles.videoContainer,
                  { width: mediaSize, height: (mediaSize * 9) / 16 },
                ]}
              >
                {Platform.OS === 'web' ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&enablejsapi=1&playsinline=1`}
                    title={currentTrack.title}
                    width="100%"
                    height="100%"
                    style={{ border: 'none', borderRadius: 12 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <Image
                    source={{ uri: currentTrack.thumbnail }}
                    style={{ width: '100%', height: '100%', borderRadius: 12 }}
                    resizeMode="cover"
                  />
                )}
              </View>
            )}
          </View>

          {/* Track Meta & Actions Row */}
          <View style={styles.trackInfoRow}>
            <View style={styles.textContainer}>
              <Text style={styles.trackTitle} numberOfLines={2}>
                {currentTrack.title}
              </Text>
              <Text style={styles.channelName} numberOfLines={1}>
                {currentTrack.channel}
              </Text>
            </View>

            <View style={styles.sideActionsRow}>
              {/* Download Action */}
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => downloadTrack(currentTrack)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={downloaded ? 'checkmark-circle' : 'cloud-download-outline'}
                  size={26}
                  color={downloaded ? colors.accent : colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Like Action */}
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => toggleLike(currentTrack)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={liked ? colors.accentPink : colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Seek Bar */}
          <View style={styles.seekContainer}>
            <CustomSeekBar
              position={playbackPosition}
              duration={duration}
              onSeek={seekTo}
              showTimes={true}
              barHeight={4}
              thumbSize={14}
            />
          </View>

          {/* Controls Row */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={toggleShuffle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="shuffle"
                size={24}
                color={isShuffle ? colors.accent : colors.textMuted}
              />
              {isShuffle && <View style={styles.activeDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={prevTrack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="play-skip-back" size={28} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playPauseBtn}
              onPress={togglePlayPause}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={30}
                color="#080B08"
                style={!isPlaying ? { marginLeft: 3 } : null}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={nextTrack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="play-skip-forward" size={28} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={toggleRepeat}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="repeat"
                size={24}
                color={repeatMode !== 'off' ? colors.accent : colors.textMuted}
              />
              {repeatMode === 'one' && <Text style={styles.repeatOneBadge}>1</Text>}
              {repeatMode === 'all' && <View style={styles.activeDot} />}
            </TouchableOpacity>
          </View>

          {/* Bottom Bar: Playlist shortcut & Lyrics toggle */}
          <View style={styles.bottomToolbar}>
            <TouchableOpacity
              style={styles.toolbarAction}
              onPress={() => setPlaylistModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.toolbarText}>Add to Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeShortcut}
              onPress={() => setActiveViewMode(activeViewMode === 'lyrics' ? 'art' : 'lyrics')}
            >
              <Ionicons
                name="sparkles"
                size={16}
                color={activeViewMode === 'lyrics' ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[
                  styles.modeShortcutText,
                  activeViewMode === 'lyrics' && { color: colors.accent },
                ]}
              >
                {activeViewMode === 'lyrics' ? 'Album Art' : 'Live Lyrics'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <PlaylistModal
          visible={playlistModalVisible}
          track={currentTrack}
          onClose={() => setPlaylistModalVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    marginBottom: 8,
  },
  topIconBtn: {
    padding: 6,
  },
  viewModeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modeTab: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  activeModeTab: {
    backgroundColor: colors.accent,
  },
  modeTabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  activeModeTabText: {
    color: '#080B08',
    fontWeight: '900',
  },
  centralStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    minHeight: 220,
  },
  artWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumArt: {
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.cardBorderGlow,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  lyricsWrapper: {
    width: '100%',
  },
  videoContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: colors.cardBorderGlow,
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 4,
  },
  channelName: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  sideActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    padding: 6,
    marginLeft: 6,
  },
  seekContainer: {
    marginVertical: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  controlBtn: {
    padding: 8,
    position: 'relative',
    alignItems: 'center',
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 8,
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  repeatOneBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
  },
  bottomToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  toolbarAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  modeShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modeShortcutText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
});
