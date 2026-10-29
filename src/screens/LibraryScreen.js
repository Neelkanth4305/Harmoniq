import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import TrackCard from '../components/TrackCard';

export default function LibraryScreen() {
  const {
    likes,
    downloads,
    playlists,
    createPlaylist,
    deletePlaylist,
    removeFromPlaylist,
    playTrack,
    currentTrack,
    isPlaying,
    importSpotify,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'playlists' | 'likes' | 'downloads'
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [spotifyModalVisible, setSpotifyModalVisible] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [spotifyLinkInput, setSpotifyLinkInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleCreate = () => {
    if (!newPlaylistTitle.trim()) return;
    createPlaylist(newPlaylistTitle.trim());
    setNewPlaylistTitle('');
    setCreateModalVisible(false);
  };

  const handleSpotifyImport = async () => {
    if (!spotifyLinkInput.trim()) return;
    setIsImporting(true);
    try {
      const imported = await importSpotify(spotifyLinkInput.trim());
      setIsImporting(false);
      setSpotifyLinkInput('');
      setSpotifyModalVisible(false);
      if (imported) {
        setSelectedPlaylist(imported);
      }
    } catch (err) {
      setIsImporting(false);
      const msg = err.message || 'Import failed. Check link.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Import Error', msg);
      }
    }
  };

  const handleDeletePlaylist = (playlist) => {
    const doDelete = () => {
      deletePlaylist(playlist.id);
      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete playlist "${playlist.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Playlist',
        `Are you sure you want to delete "${playlist.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  if (selectedPlaylist) {
    const freshPlaylist = playlists.find((p) => p.id === selectedPlaylist.id) || selectedPlaylist;
    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedPlaylist(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.detailHeaderTitleContainer}>
            <Text style={styles.detailPlaylistTitle} numberOfLines={1}>
              {freshPlaylist.name}
            </Text>
            <Text style={styles.detailSubtitle}>
              {freshPlaylist.tracks?.length || 0} tracks {freshPlaylist.isSpotifyImport ? '• Imported from Spotify' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.moreBtn} onPress={() => handleDeletePlaylist(freshPlaylist)}>
            <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {freshPlaylist.tracks?.length > 0 && (
          <View style={styles.playHeroRow}>
            <TouchableOpacity
              style={styles.bigPlayBtn}
              onPress={() => playTrack(freshPlaylist.tracks[0], freshPlaylist.tracks)}
            >
              <Ionicons name="play" size={26} color="#080B08" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={freshPlaylist.tracks || []}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyDetail}>
              <Ionicons name="musical-notes-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyDetailText}>No tracks in this playlist yet.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.playlistTrackItem}>
              <View style={{ flex: 1 }}>
                <TrackCard
                  track={item}
                  index={index}
                  variant="list"
                  isPlayingThis={currentTrack?.id === item.id && isPlaying}
                  onPress={() => playTrack(item, freshPlaylist.tracks)}
                />
              </View>
              <TouchableOpacity
                style={styles.removeTrackBtn}
                onPress={() => removeFromPlaylist(freshPlaylist.id, item.id)}
              >
                <Ionicons name="remove-circle-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  }

  // Choose list dataset based on active tab
  let activeData = playlists;
  if (activeTab === 'likes') activeData = likes;
  if (activeTab === 'downloads') activeData = downloads;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Vault</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setSpotifyModalVisible(true)}
            title="Import Spotify Playlist"
          >
            <Ionicons name="logo-electron" size={20} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setCreateModalVisible(true)}
            title="Create Playlist"
          >
            <Ionicons name="add" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[styles.chip, activeTab === 'all' && styles.activeChip]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.chipText, activeTab === 'all' && styles.activeChipText]}>Playlists</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, activeTab === 'likes' && styles.activeChip]}
          onPress={() => setActiveTab('likes')}
        >
          <Text style={[styles.chipText, activeTab === 'likes' && styles.activeChipText]}>
            Liked ({likes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, activeTab === 'downloads' && styles.activeChip]}
          onPress={() => setActiveTab('downloads')}
        >
          <Text style={[styles.chipText, activeTab === 'downloads' && styles.activeChipText]}>
            Downloaded ({downloads.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          activeTab === 'all' ? (
            <>
              {/* Spotify Import Quick Shortcut */}
              <TouchableOpacity
                style={styles.spotifyShortcutCard}
                onPress={() => setSpotifyModalVisible(true)}
              >
                <View style={styles.spotifyIconBg}>
                  <Ionicons name="link" size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spotifyCardTitle}>Import Spotify Playlist</Text>
                  <Text style={styles.spotifyCardSubtitle}>Paste link & sync all tracks into Harmoniq</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text style={styles.sectionHeading}>Family Playlists</Text>
            </>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyDetail}>
            <Ionicons
              name={activeTab === 'downloads' ? 'cloud-download-outline' : 'heart-outline'}
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyDetailText}>
              {activeTab === 'downloads' ? 'No downloaded songs yet.' : 'No saved songs in this list.'}
            </Text>
            <Text style={styles.emptyDetailSubtext}>
              {activeTab === 'downloads'
                ? 'Tap the download icon on any song to save it for offline listening.'
                : 'Explore tracks and save your favorites to your vault!'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          if (activeTab === 'likes' || activeTab === 'downloads') {
            return (
              <TrackCard
                track={item}
                index={index}
                variant="list"
                isPlayingThis={currentTrack?.id === item.id && isPlaying}
                onPress={() => playTrack(item, activeData)}
              />
            );
          }

          return (
            <TouchableOpacity
              style={styles.playlistItem}
              activeOpacity={0.7}
              onPress={() => setSelectedPlaylist(item)}
            >
              <View style={styles.playlistIconBg}>
                <Ionicons
                  name={item.isSpotifyImport ? 'logo-electron' : 'musical-notes'}
                  size={22}
                  color={colors.accent}
                />
              </View>
              <View style={styles.playlistItemInfo}>
                <Text style={styles.playlistItemTitle}>{item.name}</Text>
                <Text style={styles.playlistItemSubtitle}>
                  {item.tracks?.length || 0} tracks {item.isSpotifyImport ? '• Spotify Sync' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          );
        }}
      />

      {/* Create Playlist Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name Your Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Family Roadtrip Hits"
              placeholderTextColor={colors.textMuted}
              value={newPlaylistTitle}
              onChangeText={setNewPlaylistTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setNewPlaylistTitle('');
                  setCreateModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalConfirmBtn]} onPress={handleCreate}>
                <Text style={styles.modalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Spotify Import Modal */}
      <Modal
        visible={spotifyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSpotifyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="logo-electron" size={24} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Import Spotify Playlist</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Paste any public Spotify playlist link below to import all its songs into Harmoniq:
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://open.spotify.com/playlist/..."
              placeholderTextColor={colors.textMuted}
              value={spotifyLinkInput}
              onChangeText={setSpotifyLinkInput}
              autoFocus
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSpotifyImport}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setSpotifyLinkInput('');
                  setSpotifyModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={handleSpotifyImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#080B08" />
                ) : (
                  <Text style={styles.modalConfirmText}>Import Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  activeChip: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  activeChipText: {
    color: '#080B08',
    fontWeight: '900',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  spotifyShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: colors.cardBorderGlow,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  spotifyIconBg: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  spotifyCardTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  spotifyCardSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  playlistIconBg: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  playlistItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistItemTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  playlistItemSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  detailHeaderTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  detailPlaylistTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  detailSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  moreBtn: {
    padding: 6,
  },
  playHeroRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  bigPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
  },
  playlistTrackItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeTrackBtn: {
    padding: 8,
  },
  emptyDetail: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyDetailText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyDetailSubtext: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 8, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.surface,
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorderGlow,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginLeft: 10,
  },
  modalCancelBtn: {
    backgroundColor: 'transparent',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    backgroundColor: colors.accent,
  },
  modalConfirmText: {
    color: '#080B08',
    fontWeight: '900',
  },
});
