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
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';

export default function DesktopLayout() {
  const [activeTab, setActiveTab] = useState('Home'); // 'Home' | 'Search' | 'Library'
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [showLyricsPanel, setShowLyricsPanel] = useState(false);
  const [spotifyUrlInput, setSpotifyUrlInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

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

  return (
    <View style={styles.desktopContainer}>
      <View style={styles.mainArea}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          {/* Harmoniq Brand Header */}
          <View style={styles.logoRow}>
            <View style={styles.logoIconBg}>
              <Ionicons name="sparkles" size={18} color="#0B0F0C" />
            </View>
            <View>
              <Text style={styles.logoText}>
                H A R M O N I Q
              </Text>
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
                name={activeTab === 'Home' ? 'planet' : 'planet-outline'}
                size={22}
                color={activeTab === 'Home' ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>
                Discover
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'Search' && styles.navItemActive]}
              onPress={() => setActiveTab('Search')}
            >
              <Ionicons
                name={activeTab === 'Search' ? 'search' : 'search-outline'}
                size={22}
                color={activeTab === 'Search' ? colors.accent : colors.textSecondary}
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
                name={activeTab === 'Library' ? 'file-tray-full' : 'file-tray-full-outline'}
                size={22}
                color={activeTab === 'Library' ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.navText, activeTab === 'Library' && styles.navTextActive]}>
                Vault ({playlists.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Spotify Quick Importer Widget */}
          <View style={styles.spotifyWidget}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="logo-electron" size={14} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={styles.spotifyWidgetTitle}>IMPORT SPOTIFY</Text>
            </View>
            <TextInput
              style={styles.spotifyWidgetInput}
              placeholder="Paste playlist link..."
              placeholderTextColor={colors.textMuted}
              value={spotifyUrlInput}
              onChangeText={setSpotifyUrlInput}
              onSubmitEditing={handleSidebarSpotifyImport}
            />
            {spotifyUrlInput.length > 0 && (
              <TouchableOpacity
                style={styles.spotifyWidgetBtn}
                onPress={handleSidebarSpotifyImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#080B08" />
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
                <Ionicons name="add" size={18} color="#080B08" />
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
                <Ionicons name="cloud-download" size={15} color="#080B08" />
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
                navigate: (screen) => {
                  if (screen === 'Search') setActiveTab('Search');
                  if (screen === 'Library') setActiveTab('Library');
                },
              }}
            />
          )}
          {activeTab === 'Search' && <SearchScreen route={{}} />}
          {activeTab === 'Library' && <LibraryScreen />}
        </View>

        {/* Synced Lyrics Drawer in Green */}
        {showLyricsPanel && currentTrack && (
          <View style={styles.lyricsSideDrawer}>
            <View style={styles.drawerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.drawerTitle}>Karaoke Live Lyrics</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLyricsPanel(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <LyricsView track={currentTrack} />
          </View>
        )}
      </View>

      {/* Bottom Pure Green Player Bar */}
      <View style={styles.bottomPlayerBar}>
        {/* Left Side: Track Info & Actions */}
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
                color="#080B08"
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

        {/* Right: Lyrics & Modals */}
        <View style={styles.playerRight}>
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
            onPress={() => setIsNowPlayingOpen(true)}
            title="Expand Full Screen"
          >
            <Ionicons name="expand-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {currentTrack && (
        <PlaylistModal
          visible={playlistModalVisible}
          track={currentTrack}
          onClose={() => setPlaylistModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    backgroundColor: colors.surface,
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: colors.divider,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  logoText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
  },
  logoSubtext: {
    color: colors.accentLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  navGroup: {
    marginBottom: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  navText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 14,
  },
  navTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  spotifyWidget: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  spotifyWidgetTitle: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
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
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifyWidgetBtnText: {
    color: '#080B08',
    fontSize: 11,
    fontWeight: '800',
  },
  shortcutGroup: {
    marginBottom: 16,
  },
  shortcutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  createShortcutIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  likedShortcutIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  downloadShortcutIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.accentMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  shortcutText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  playlistSidebarHeading: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
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
  },
  lyricsSideDrawer: {
    width: 330,
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
    height: 90,
    backgroundColor: colors.playerBar,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  playerLeft: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerThumbnail: {
    width: 54,
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorderGlow,
    backgroundColor: colors.surfaceLight,
  },
  playerTrackMeta: {
    marginLeft: 12,
    flex: 1,
  },
  playerTrackTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  playerTrackArtist: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  playerLikeBtn: {
    padding: 8,
    marginLeft: 4,
  },
  noTrackText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  playerCenter: {
    width: '40%',
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  seekBarDesktopWrapper: {
    width: '100%',
    maxWidth: 500,
  },
  playerRight: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  rightActionBtn: {
    padding: 8,
    marginRight: 8,
  },
  activeRightActionBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 20,
  },
});
