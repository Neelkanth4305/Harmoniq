import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import CustomSeekBar from './CustomSeekBar';
import PlaylistModal from './PlaylistModal';
import LyricsView from './LyricsView';
import AIAssistantModal from './AIAssistantModal';
import AudioVisualizer from './AudioVisualizer';
import SleepTimerModal from './SleepTimerModal';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';

const SPEED_STEPS = [1.0, 0.8, 1.25, 1.5];

export default function DesktopLayout() {
  const [activeTab, setActiveTab] = useState('Home'); // 'Home' | 'Search' | 'Library'
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [showLyricsPanel, setShowLyricsPanel] = useState(false);
  const [spotifyUrlInput, setSpotifyUrlInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [searchParams, setSearchParams] = useState({});

  const {
    currentTrack,
    isPlaying,
    playbackPosition,
    duration,
    isShuffle,
    repeatMode,
    playlists,
    likes,
    downloads,
    playbackRate,
    setPlaybackRate,
    sleepTimerMinutes,
    sleepTimerSecondsLeft,
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
    createPlaylist,
    importSpotify,
    setIsNowPlayingOpen,
  } = usePlayer();

  const liked = currentTrack ? isLiked(currentTrack.id) : false;
  const downloaded = currentTrack ? isDownloaded(currentTrack.id) : false;

  const handleCreateNewPlaylist = () => {
    const name = window.prompt ? window.prompt('Enter playlist name:', 'Family Mix') : null;
    if (name && name.trim()) {
      createPlaylist(name.trim());
    }
  };

  const handleSidebarSpotifyImport = async () => {
    if (!spotifyUrlInput.trim()) return;
    setIsImporting(true);
    try {
      await importSpotify(spotifyUrlInput.trim());
      setIsImporting(false);
      setSpotifyUrlInput('');
      setActiveTab('Library');
    } catch (e) {
      setIsImporting(false);
      if (window.alert) window.alert('Failed to import Spotify playlist. Please check that link is public.');
    }
  };

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
    <View style={styles.desktopContainer}>
      <View style={styles.mainArea}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          {/* Harmoniq Brand Header */}
          <View style={styles.logoRow}>
            <View style={styles.logoIconBg}>
              <Ionicons name="sparkles" size={18} color="#000000" />
            </View>
            <View>
              <Text style={styles.logoText}>HARMONIQ</Text>
              <Text style={styles.logoSubtext}>FAMILY AUDIO HUB</Text>
            </View>
          </View>

          {/* Navigation Items */}
          <View style={styles.navGroup}>
            <TouchableOpacity
              style={[styles.navItem, activeTab === 'Home' && styles.navItemActive]}
              onPress={() => setActiveTab('Home')}
            >
              <Ionicons
                name={activeTab === 'Home' ? 'home' : 'home-outline'}
                size={22}
                color={activeTab === 'Home' ? colors.textPrimary : colors.textSecondary}
              />
              <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'Search' && styles.navItemActive]}
              onPress={() => setActiveTab('Search')}
            >
              <Ionicons
                name={activeTab === 'Search' ? 'search' : 'search-outline'}
                size={22}
                color={activeTab === 'Search' ? colors.textPrimary : colors.textSecondary}
              />
              <Text style={[styles.navText, activeTab === 'Search' && styles.navTextActive]}>
                Search
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'Library' && styles.navItemActive]}
              onPress={() => setActiveTab('Library')}
            >
              <Ionicons
                name={activeTab === 'Library' ? 'library' : 'library-outline'}
                size={22}
                color={activeTab === 'Library' ? colors.textPrimary : colors.textSecondary}
              />
              <Text style={[styles.navText, activeTab === 'Library' && styles.navTextActive]}>
                Your Library ({playlists.length})
              </Text>
            </TouchableOpacity>

            {/* AI Assistant Navigation */}
            <TouchableOpacity
              style={[styles.navItem, styles.aiNavItem]}
              onPress={() => setAiModalVisible(true)}
            >
              <Ionicons name="sparkles" size={20} color={colors.accent} />
              <Text style={[styles.navText, styles.aiNavText]}>
                AI Music DJ
              </Text>
            </TouchableOpacity>
          </View>

          {/* Spotify Quick Importer Widget */}
          <View style={styles.spotifyWidget}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="musical-notes" size={14} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={styles.spotifyWidgetTitle}>IMPORT SPOTIFY</Text>
            </View>
            <TextInput
              style={styles.spotifyWidgetInput}
              placeholder="Paste playlist link..."
              placeholderTextColor={colors.textMuted}
              value={spotifyUrlInput}
              onChangeText={setSpotifyUrlInput}
              onSubmitEditing={handleSidebarSpotifyImport}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {spotifyUrlInput.length > 0 && (
              <TouchableOpacity
                style={styles.spotifyWidgetBtn}
                onPress={handleSidebarSpotifyImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.spotifyWidgetBtnText}>Import</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Shortcuts */}
          <View style={styles.shortcutGroup}>
            <TouchableOpacity style={styles.shortcutItem} onPress={handleCreateNewPlaylist}>
              <View style={styles.createShortcutIcon}>
                <Ionicons name="add" size={18} color="#000000" />
              </View>
              <Text style={styles.shortcutText}>New Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutItem} onPress={() => setActiveTab('Library')}>
              <View style={styles.likedShortcutIcon}>
                <Ionicons name="heart" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.shortcutText}>Liked Tracks ({likes.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutItem} onPress={() => setActiveTab('Library')}>
              <View style={styles.downloadShortcutIcon}>
                <Ionicons name="cloud-download" size={15} color="#000000" />
              </View>
              <Text style={styles.shortcutText}>Downloaded ({downloads.length})</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.playlistSidebarHeading}>YOUR PLAYLISTS</Text>
          <ScrollView style={styles.sidebarPlaylists} showsVerticalScrollIndicator={false}>
            {playlists.map((pl) => (
              <TouchableOpacity
                key={pl.id}
                style={styles.sidebarPlaylistItem}
                onPress={() => setActiveTab('Library')}
              >
                <Text style={styles.sidebarPlaylistName} numberOfLines={1}>
                  {pl.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Central Content */}
        <View style={styles.centralContent}>
          {activeTab === 'Home' && (
            <HomeScreen
              navigation={{
                navigate: (screen, params) => {
                  if (screen === 'Search') {
                    if (params) setSearchParams(params);
                    setActiveTab('Search');
                  }
                  if (screen === 'Library') setActiveTab('Library');
                },
              }}
            />
          )}
          {activeTab === 'Search' && <SearchScreen route={{ params: searchParams }} />}
          {activeTab === 'Library' && <LibraryScreen />}
        </View>

        {/* Synced Lyrics Drawer */}
        {showLyricsPanel && currentTrack && (
          <View style={styles.lyricsSideDrawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Live Lyrics</Text>
              <TouchableOpacity onPress={() => setShowLyricsPanel(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <LyricsView track={currentTrack} />
          </View>
        )}
      </View>

      {/* Bottom Player Bar */}
      <View style={styles.bottomPlayerBar}>
        {/* Left Side: Track Info & Audio Visualizer */}
        <View style={styles.playerLeft}>
          {currentTrack ? (
            <>
              <Image source={{ uri: currentTrack.thumbnail }} style={styles.playerThumbnail} />
              <View style={styles.playerTrackMeta}>
                <Text style={styles.playerTrackTitle} numberOfLines={1}>
                  {currentTrack.title}
                </Text>
                <Text style={styles.playerTrackArtist} numberOfLines={1}>
                  {currentTrack.channel}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.playerLikeBtn}
                onPress={() => toggleLike(currentTrack)}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={liked ? colors.accentPink : colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playerLikeBtn}
                onPress={() => downloadTrack(currentTrack)}
                title="Download Track"
              >
                <Ionicons
                  name={downloaded ? 'checkmark-circle' : 'cloud-download-outline'}
                  size={20}
                  color={downloaded ? colors.accent : colors.textSecondary}
                />
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noTrackText}>Select a track to stream live</Text>
          )}
        </View>

        {/* Center: Controls & Seekbar */}
        <View style={styles.playerCenter}>
          <View style={styles.playerControlsRow}>
            <TouchableOpacity style={styles.controlIconBtn} onPress={toggleShuffle}>
              <Ionicons
                name="shuffle"
                size={18}
                color={isShuffle ? colors.accent : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlIconBtn} onPress={prevTrack}>
              <Ionicons name="play-skip-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.desktopPlayBtn} onPress={togglePlayPause}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="#000000"
                style={!isPlaying ? { marginLeft: 2 } : null}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlIconBtn} onPress={nextTrack}>
              <Ionicons name="play-skip-forward" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlIconBtn} onPress={toggleRepeat}>
              <Ionicons
                name="repeat"
                size={18}
                color={repeatMode !== 'off' ? colors.accent : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.seekBarDesktopWrapper}>
            <CustomSeekBar
              position={playbackPosition}
              duration={duration}
              onSeek={seekTo}
              showTimes={true}
              barHeight={4}
              thumbSize={12}
            />
          </View>
        </View>

        {/* Right: Speed, Sleep, Lyrics & Modals */}
        <View style={styles.playerRight}>
          {/* Playback Rate / Speed Selector */}
          <TouchableOpacity
            style={styles.speedPill}
            onPress={handleCycleSpeed}
            title="Adjust playback speed"
          >
            <Text style={styles.speedPillText}>
              {playbackRate === 0.8 ? '0.8x 🌙' : playbackRate === 1.25 ? '1.25x ⚡' : `${playbackRate}x`}
            </Text>
          </TouchableOpacity>

          {/* Sleep Timer Button */}
          <TouchableOpacity
            style={[
              styles.rightActionBtn,
              (sleepTimerMinutes !== null || sleepTimerSecondsLeft) && styles.activeRightActionBtn,
            ]}
            onPress={() => setSleepModalVisible(true)}
            title="Sleep Timer"
          >
            <Ionicons
              name="moon-outline"
              size={19}
              color={(sleepTimerMinutes !== null || sleepTimerSecondsLeft) ? colors.accent : colors.textSecondary}
            />
            {formatTimerBadge() && (
              <View style={styles.timerBadge}>
                <Text style={styles.timerBadgeText}>{formatTimerBadge()}</Text>
              </View>
            )}
          </TouchableOpacity>

          {currentTrack && (
            <>
              <TouchableOpacity
                style={[styles.rightActionBtn, showLyricsPanel && styles.activeRightActionBtn]}
                onPress={() => setShowLyricsPanel((prev) => !prev)}
                title="Karaoke Lyrics"
              >
                <Ionicons
                  name="mic-outline"
                  size={20}
                  color={showLyricsPanel ? colors.accent : colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rightActionBtn}
                onPress={() => setPlaylistModalVisible(true)}
                title="Add to playlist"
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.rightActionBtn}
            onPress={() => setAiModalVisible(true)}
            title="AI Music DJ"
          >
            <Ionicons name="sparkles" size={20} color={colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rightActionBtn}
            onPress={() => setIsNowPlayingOpen(true)}
            title="Expand Full Screen"
          >
            <Ionicons name="expand-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      {currentTrack && (
        <PlaylistModal
          visible={playlistModalVisible}
          track={currentTrack}
          onClose={() => setPlaylistModalVisible(false)}
        />
      )}

      <AIAssistantModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
      />

      <SleepTimerModal
        visible={sleepModalVisible}
        onClose={() => setSleepModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sidebar: {
    width: 250,
    backgroundColor: colors.surface,
    padding: 18,
    borderRightWidth: 1,
    borderRightColor: colors.divider,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  logoText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoSubtext: {
    color: colors.accentLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  navGroup: {
    marginBottom: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  navText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  navTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  aiNavItem: {
    marginTop: 6,
    backgroundColor: 'rgba(29, 185, 84, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.25)',
  },
  aiNavText: {
    color: colors.accent,
    fontWeight: '700',
  },
  spotifyWidget: {
    backgroundColor: 'rgba(29, 185, 84, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.2)',
    marginBottom: 16,
  },
  spotifyWidgetTitle: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  spotifyWidgetInput: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontSize: 11,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  spotifyWidgetBtn: {
    marginTop: 6,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifyWidgetBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  shortcutGroup: {
    marginBottom: 14,
  },
  shortcutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  createShortcutIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  likedShortcutIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  downloadShortcutIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shortcutText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },
  playlistSidebarHeading: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  sidebarPlaylists: {
    flex: 1,
  },
  sidebarPlaylistItem: {
    paddingVertical: 6,
  },
  sidebarPlaylistName: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  centralContent: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  lyricsSideDrawer: {
    width: 340,
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
    padding: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  drawerTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  bottomPlayerBar: {
    height: 88,
    backgroundColor: colors.playerBar,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  playerLeft: {
    width: '32%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: colors.surfaceLight,
  },
  playerTrackMeta: {
    marginLeft: 12,
    flex: 1,
    marginRight: 6,
  },
  playerTrackTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  playerTrackArtist: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  visualizerWrap: {
    marginRight: 8,
  },
  playerLikeBtn: {
    padding: 6,
    marginLeft: 2,
  },
  noTrackText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  playerCenter: {
    width: '38%',
    alignItems: 'center',
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  controlIconBtn: {
    padding: 6,
    marginHorizontal: 8,
  },
  desktopPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  seekBarDesktopWrapper: {
    width: '100%',
    maxWidth: 480,
  },
  playerRight: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  speedPill: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 6,
  },
  speedPillText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  rightActionBtn: {
    padding: 8,
    marginRight: 4,
    position: 'relative',
  },
  activeRightActionBtn: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    borderRadius: 20,
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
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
  },
});
