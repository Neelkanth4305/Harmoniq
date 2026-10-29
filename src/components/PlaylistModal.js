import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';

export default function PlaylistModal({ visible, track, onClose }) {
  const { playlists, createPlaylist, addToPlaylist } = usePlayer();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  if (!track) return null;

  const handleSelectPlaylist = (playlistId) => {
    addToPlaylist(playlistId, track);
    setAddedIds((prev) => new Set(prev).add(playlistId));
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleCreateNew = () => {
    if (!newPlaylistName.trim()) return;
    const newPl = createPlaylist(newPlaylistName.trim());
    if (newPl) {
      addToPlaylist(newPl.id, track);
      setNewPlaylistName('');
      setIsCreating(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add to Playlist</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Current Track Summary */}
          <View style={styles.trackSummary}>
            <Ionicons name="musical-note" size={20} color={colors.accent} />
            <Text style={styles.trackTitle} numberOfLines={1}>
              {track.title}
            </Text>
          </View>

          {/* Create new playlist toggle/input */}
          {isCreating ? (
            <View style={styles.createBox}>
              <TextInput
                style={styles.input}
                placeholder="Playlist name"
                placeholderTextColor={colors.textMuted}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateNew}
              />
              <View style={styles.createActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => setIsCreating(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn]}
                  onPress={handleCreateNew}
                >
                  <Text style={styles.confirmText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.createButtonRow}
              onPress={() => setIsCreating(true)}
            >
              <View style={styles.plusIconBg}>
                <Ionicons name="add" size={24} color="#080B08" />
              </View>
              <Text style={styles.createButtonText}>New Playlist</Text>
            </TouchableOpacity>
          )}

          {/* Playlist list */}
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const alreadyHas = item.tracks?.some((t) => t.id === track.id) || addedIds.has(item.id);
              return (
                <TouchableOpacity
                  style={styles.playlistRow}
                  onPress={() => handleSelectPlaylist(item.id)}
                  disabled={alreadyHas}
                >
                  <View style={styles.playlistIconBg}>
                    <Ionicons name="musical-notes" size={20} color={colors.textSecondary} />
                  </View>
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName}>{item.name}</Text>
                    <Text style={styles.playlistCount}>
                      {item.tracks?.length || 0} songs
                    </Text>
                  </View>
                  <Ionicons
                    name={alreadyHas ? 'checkmark-circle' : 'add-circle-outline'}
                    size={24}
                    color={alreadyHas ? colors.accent : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 8, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  trackSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  trackTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  createButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 10,
  },
  plusIconBg: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  createBox: {
    backgroundColor: colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginLeft: 8,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: colors.accent,
  },
  confirmText: {
    color: '#080B08',
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 20,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  playlistIconBg: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  playlistCount: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
