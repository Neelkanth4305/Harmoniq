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
import SleepTimerModal from '../components/SleepTimerModal';

const SPEED_STEPS = [1.0, 0.8, 1.25, 1.5];

export default function NowPlayingModal() {
  const {
    currentTrack,
    isPlaying,
    playbackPosition,
    duration,
    isShuffle,
    repeatMode,
    playbackRate,
    setPlaybackRate,
    sleepTimerMinutes,
    sleepTimerSecondsLeft,
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
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const { height, width } = useWindowDimensions();

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const downloaded = isDownloaded(currentTrack.id);
  const mediaSize = Math.min(width - 56, height * 0.42, 360);

  const handleCycleSpeed = () => {
    const curIdx = SPEED_STEPS.indexOf(playbackRate);
    const nextIdx = (curIdx + 1) % SPEED_STEPS.length;
    setPlaybackRate(SPEED_STEPS[nextIdx]);
  };

  const formatTimerBadge = () => {
    if (!sleepTimerSecondsLeft) return null;
    const m = Math.floor(sleepTimerSecondsLeft / 60);
    return `${m}m`;
  };

  return (
    <Modal
      visible={isNowPlayingOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setIsNowPlayingOpen(false)}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar (Spotify Style) */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.topIconBtn}
              onPress={() => {
                if (showLyrics) {
                  setShowLyrics(false);
                } else {
                  setIsNowPlayingOpen(false);
                }
              }}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="chevron-down" size={26} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerSubtext}>PLAYING FROM SEARCH</Text>
              <Text style={styles.headerTrackContext} numberOfLines={1}>
                {showLyrics ? 'Live Lyrics' : 'Now Playing'}
              </Text>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={styles.topIconBtn}
                onPress={() => setSleepModalVisible(true)}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              >
                <Ionicons
                  name="moon-outline"
                  size={20}
                  color={(sleepTimerMinutes !== null || sleepTimerSecondsLeft) ? colors.accent : colors.textPrimary}
                />
                {formatTimerBadge() && (
                  <View style={styles.timerBadge}>
                    <Text style={styles.timerBadgeText}>{formatTimerBadge()}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topIconBtn}
                onPress={() => setPlaylistModalVisible(true)}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center Stage: Hero Album Artwork OR Synced Lyrics */}
          <View style={styles.centralStage}>
            {showLyrics ? (
              <View style={[styles.lyricsStage, { height: height * 0.48 }]}>
                <LyricsView track={currentTrack} />
              </View>
            ) : (
              <View style={styles.artWrapper}>
                <Image
                  source={{ uri: currentTrack.thumbnail }}
                  style={[styles.albumArt, { width: mediaSize, height: mediaSize }]}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>

          {/* Track Meta & Like Button */}
          <View style={styles.trackInfoRow}>
            <View style={styles.textContainer}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.channelName} numberOfLines={1}>
                {currentTrack.channel}
              </Text>
            </View>

            <View style={styles.metaActions}>
              <TouchableOpacity
                style={styles.speedPill}
                onPress={handleCycleSpeed}
                activeOpacity={0.7}
              >
                <Text style={styles.speedPillText}>{playbackRate}x</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => toggleLike(currentTrack)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={liked ? colors.accentPink : colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Seek Bar */}
          <View style={styles.seekContainer}>
            <CustomSeekBar
              position={playbackPosition}
              duration={duration}
              onSeek={seekTo}
              showTimes={true}
              barHeight={4}
              thumbSize={13}
            />
          </View>

          {/* Playback Controls (Spotify Style) */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={toggleShuffle}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="shuffle"
                size={22}
                color={isShuffle ? colors.accent : colors.textMuted}
              />
              {isShuffle && <View style={styles.activeDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={prevTrack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="play-skip-back" size={28} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playPauseBtn}
              onPress={togglePlayPause}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={30}
                color="#121212"
                style={!isPlaying ? { marginLeft: 3 } : null}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={nextTrack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="play-skip-forward" size={28} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={toggleRepeat}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="repeat"
                size={22}
                color={repeatMode !== 'off' ? colors.accent : colors.textMuted}
              />
              {repeatMode === 'one' && <Text style={styles.repeatOneBadge}>1</Text>}
              {repeatMode === 'all' && <View style={styles.activeDot} />}
            </TouchableOpacity>
          </View>

          {/* Bottom Toolbar: Lyrics Expand Card & Add to Playlist */}
          <View style={styles.bottomToolbar}>
            <TouchableOpacity
              style={styles.lyricsShortcut}
              onPress={() => setShowLyrics((prev) => !prev)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="mic-outline"
                size={18}
                color={showLyrics ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[
                  styles.lyricsShortcutText,
                  showLyrics && { color: colors.accent, fontWeight: '800' },
                ]}
              >
                {showLyrics ? 'Hide Lyrics' : 'Lyrics'}
              </Text>
            </TouchableOpacity>

            <View style={styles.bottomRightIcons}>
              <TouchableOpacity
                style={styles.bottomIconBtn}
                onPress={() => downloadTrack(currentTrack)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={downloaded ? 'checkmark-circle' : 'cloud-download-outline'}
                  size={20}
                  color={downloaded ? colors.accent : colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomIconBtn}
                onPress={() => setPlaylistModalVisible(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="add-circle-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <PlaylistModal
          visible={playlistModalVisible}
          track={currentTrack}
          onClose={() => setPlaylistModalVisible(false)}
        />

        <SleepTimerModal
          visible={sleepModalVisible}
          onClose={() => setSleepModalVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    marginBottom: 6,
  },
  topIconBtn: {
    padding: 6,
    position: 'relative',
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  headerSubtext: {
    color: colors.textMuted,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTrackContext: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.accent,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  timerBadgeText: {
    color: '#121212',
    fontSize: 8,
    fontWeight: '900',
  },
  centralStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    minHeight: 220,
  },
  artWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumArt: {
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  lyricsStage: {
    width: '100%',
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 14,
  },
  trackTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  channelName: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  metaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedPill: {
    backgroundColor: '#242424',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  speedPillText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  actionIconBtn: {
    padding: 6,
  },
  seekContainer: {
    marginVertical: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
    paddingHorizontal: 6,
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
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
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  lyricsShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  lyricsShortcutText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomIconBtn: {
    padding: 4,
  },
});
