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

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'likes' | 'downloads'
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
              {freshPlaylist.tracks?.length || 0} tracks {freshPlaylist.isSpotifyImport ? '• Spotify Import' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.moreBtn} onPress={() => handleDeletePlaylist(freshPlaylist)}>
            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {freshPlaylist.tracks?.length > 0 && (
          <View style={styles.playHeroRow}>
            <TouchableOpacity
              style={styles.bigPlayBtn}
              onPress={() => playTrack(freshPlaylist.tracks[0], freshPlaylist.tracks)}
            >
              <Ionicons name="play" size={24} color="#121212" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={freshPlaylist.tracks || []}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyDetail}>
              <Ionicons name="musical-notes-outline" size={44} color={colors.textMuted} />
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
                <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
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
        <Text style={styles.headerTitle}>Your Library</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setSpotifyModalVisible(true)}
            accessibilityLabel="Import Spotify Playlist"
          >
            <Ionicons name="link-outline" size={19} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setCreateModalVisible(true)}
            accessibilityLabel="Create Playlist"
          >
            <Ionicons name="add" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs / Filter Pills */}
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
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          activeTab === 'all' ? (
            <>
              {/* Spotify Import Quick Shortcut Card */}
              <TouchableOpacity
                style={styles.spotifyShortcutCard}
                onPress={() => setSpotifyModalVisible(true)}
                activeOpacity={0.75}
              >
                <View style={styles.spotifyIconBg}>
                  <Ionicons name="logo-electron" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spotifyCardTitle}>Import Spotify Playlist</Text>
                  <Text style={styles.spotifyCardSubtitle}>Paste link & sync all tracks</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text style={styles.sectionHeading}>Playlists</Text>
            </>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyDetail}>
            <Ionicons
              name={activeTab === 'downloads' ? 'cloud-download-outline' : 'heart-outline'}
              size={44}
              color={colors.textMuted}
            />
            <Text style={styles.emptyDetailText}>
              {activeTab === 'downloads' ? 'No downloaded songs yet.' : 'No saved songs in this list.'}
            </Text>
            <Text style={styles.emptyDetailSubtext}>
              {activeTab === 'downloads'
                ? 'Tap the download icon on any song to save it for quick access.'
                : 'Explore tracks and save your favorites to your library!'}
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
                  size={20}
                  color={colors.accent}
                />
              </View>
              <View style={styles.playlistItemInfo}>
                <Text style={styles.playlistItemTitle}>{item.name}</Text>
                <Text style={styles.playlistItemSubtitle}>
                  {item.tracks?.length || 0} tracks {item.isSpotifyImport ? '• Spotify Sync' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
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
            <Text style={styles.modalTitle}>Give your playlist a name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="My Playlist"
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="musical-notes" size={22} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Import Spotify Playlist</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Paste any public Spotify playlist link below to import all its tracks:
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
                  <ActivityIndicator size="small" color="#121212" />
                ) : (
                  <Text style={styles.modalConfirmText}>Import</Text>
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
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 10,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#242424',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  activeChipText: {
    color: '#121212',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  spotifyShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  spotifyIconBg: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  spotifyCardTitle: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  spotifyCardSubtitle: {
    color: colors.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  playlistIconBg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  playlistItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistItemTitle: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  playlistItemSubtitle: {
    color: colors.textSecondary,
    fontSize: 11.5,
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
    fontWeight: '800',
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
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  bigPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyDetailSubtext: {
    color: colors.textSecondary,
    fontSize: 12.5,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#242424',
    width: '100%',
    maxWidth: 400,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12.5,
    marginBottom: 12,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#181818',
    color: colors.textPrimary,
    padding: 10,
    borderRadius: 8,
    fontSize: 13.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    gap: 8,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
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
    color: '#121212',
    fontWeight: '800',
  },
});
