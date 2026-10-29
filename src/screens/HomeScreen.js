import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import { searchYouTubeMusic } from '../api/youtube';
import TrackCard from '../components/TrackCard';
import PlaylistModal from '../components/PlaylistModal';

const GENRE_SPHERES = [
  { id: 'all', label: 'All Beats', icon: 'planet', query: 'Top Global Hits' },
  { id: 'trending', label: 'Trending', icon: 'flame', query: 'Trending Music Video 2026' },
  { id: 'bollywood', label: 'Bollywood', icon: 'musical-notes', query: 'Bollywood Hit Songs 2026' },
  { id: 'lofi', label: 'Lo-Fi Chill', icon: 'moon', query: 'Lofi hip hop beats' },
  { id: 'workout', label: 'Hyper Gym', icon: 'barbell', query: 'Workout Gym Motivation Hits' },
];

export default function HomeScreen({ navigation }) {
  const { currentTrack, playTrack, recentlyPlayed, isPlaying, importSpotify } = usePlayer();
  const [selectedPreset, setSelectedPreset] = useState('all');
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [bollywoodTracks, setBollywoodTracks] = useState([]);
  const [lofiTracks, setLofiTracks] = useState([]);
  const [workoutTracks, setWorkoutTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModalTrack, setSelectedModalTrack] = useState(null);

  // Spotify Playlist Importer State
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadAllCategories = async () => {
    try {
      const [trendRes, bollyRes, lofiRes, workRes] = await Promise.all([
        searchYouTubeMusic('Trending Music Hits 2026'),
        searchYouTubeMusic('Bollywood Hit Songs 2026'),
        searchYouTubeMusic('Lo-fi Chill Beats Study Sleep'),
        searchYouTubeMusic('Workout Gym Motivation Songs'),
      ]);

      if (trendRes.tracks?.length) setTrendingTracks(trendRes.tracks);
      if (bollyRes.tracks?.length) setBollywoodTracks(bollyRes.tracks);
      if (lofiRes.tracks?.length) setLofiTracks(lofiRes.tracks);
      if (workRes.tracks?.length) setWorkoutTracks(workRes.tracks);
    } catch (err) {
      console.warn('Error loading dynamic categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllCategories();
    setRefreshing(false);
  };

  const handleChipPress = (preset) => {
    setSelectedPreset(preset.id);
    if (preset.id !== 'all' && navigation) {
      navigation.navigate('Search', { initialQuery: preset.query });
    }
  };

  const handleSpotifyImport = async () => {
    if (!spotifyUrl.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please paste a Spotify playlist URL');
      } else {
        Alert.alert('Missing URL', 'Please paste a Spotify playlist link.');
      }
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    try {
      const importedPlaylist = await importSpotify(spotifyUrl.trim(), (pct) => {
        setImportProgress(pct);
      });

      setIsImporting(false);
      setSpotifyUrl('');

      const msg = `Successfully imported "${importedPlaylist.name}" with ${importedPlaylist.tracks.length} tracks!`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Import Complete!', msg);
      }

      if (importedPlaylist.tracks.length > 0) {
        playTrack(importedPlaylist.tracks[0], importedPlaylist.tracks);
      }
    } catch (err) {
      setIsImporting(false);
      const errMsg = err.message || 'Failed to import playlist. Check that the link is public.';
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert('Import Error', errMsg);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subGreeting}>Welcome to Harmoniq • Family Music Hub</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation?.navigate('Search')}
          >
            <Ionicons name="search" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* SPOTIFY PLAYLIST IMPORTER HERO BANNER */}
        <View style={styles.importerCard}>
          <View style={styles.importerHeader}>
            <View style={styles.spotifyBadge}>
              <Ionicons name="logo-electron" size={16} color={colors.accent} />
              <Text style={styles.spotifyBadgeText}>SPOTIFY PLAYLIST IMPORT</Text>
            </View>
          </View>
          <Text style={styles.importerTitle}>Paste Any Spotify Playlist Link</Text>
          <Text style={styles.importerSubtitle}>
            Import all songs directly into Harmoniq for the whole family
          </Text>

          <View style={styles.importerInputRow}>
            <TextInput
              style={styles.importerInput}
              placeholder="https://open.spotify.com/playlist/..."
              placeholderTextColor={colors.textMuted}
              value={spotifyUrl}
              onChangeText={setSpotifyUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.importerButton}
              onPress={handleSpotifyImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color="#080B08" />
              ) : (
                <Text style={styles.importerButtonText}>Import</Text>
              )}
            </TouchableOpacity>
          </View>

          {isImporting && (
            <View style={styles.importProgressRow}>
              <Text style={styles.importProgressText}>Importing songs: {importProgress}%</Text>
            </View>
          )}
        </View>

        {/* Dynamic Preset Genre Spheres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {GENRE_SPHERES.map((item) => {
            const isActive = selectedPreset === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.sphereChip, isActive && styles.activeSphereChip]}
                onPress={() => handleChipPress(item)}
              >
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={isActive ? '#080B08' : colors.accent}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.sphereText, isActive && styles.activeSphereText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recently Played */}
        {recentlyPlayed && recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Streamed</Text>
            <View style={styles.recentGrid}>
              {recentlyPlayed.slice(0, 6).map((track) => (
                <View key={track.id} style={styles.gridItemWrapper}>
                  <TrackCard
                    track={track}
                    variant="grid"
                    isPlayingThis={currentTrack?.id === track.id && isPlaying}
                    onPress={() => playTrack(track, recentlyPlayed)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Syncing dynamic music catalogue...</Text>
          </View>
        ) : (
          <>
            {/* Trending Now */}
            {trendingTracks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Global Trending</Text>
                  <TouchableOpacity
                    onPress={() => navigation?.navigate('Search', { initialQuery: 'Trending Music Hits' })}
                  >
                    <Text style={styles.seeAllText}>Explore</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                  {trendingTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      variant="carousel"
                      isPlayingThis={currentTrack?.id === track.id && isPlaying}
                      onPress={() => playTrack(track, trendingTracks)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Bollywood Hits */}
            {bollywoodTracks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Bollywood Beats</Text>
                  <TouchableOpacity
                    onPress={() => navigation?.navigate('Search', { initialQuery: 'Bollywood Hit Songs' })}
                  >
                    <Text style={styles.seeAllText}>Explore</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                  {bollywoodTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      variant="carousel"
                      isPlayingThis={currentTrack?.id === track.id && isPlaying}
                      onPress={() => playTrack(track, bollywoodTracks)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Lo-fi Beats */}
            {lofiTracks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Midnight Lo-Fi</Text>
                  <TouchableOpacity
                    onPress={() => navigation?.navigate('Search', { initialQuery: 'Lo-Fi Chill Beats' })}
                  >
                    <Text style={styles.seeAllText}>Explore</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                  {lofiTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      variant="carousel"
                      isPlayingThis={currentTrack?.id === track.id && isPlaying}
                      onPress={() => playTrack(track, lofiTracks)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Workout Energy */}
            {workoutTracks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Hyper Gym Motivation</Text>
                  <TouchableOpacity
                    onPress={() => navigation?.navigate('Search', { initialQuery: 'Workout Gym Motivation' })}
                  >
                    <Text style={styles.seeAllText}>Explore</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                  {workoutTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      variant="carousel"
                      isPlayingThis={currentTrack?.id === track.id && isPlaying}
                      onPress={() => playTrack(track, workoutTracks)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {selectedModalTrack && (
        <PlaylistModal
          visible={!!selectedModalTrack}
          track={selectedModalTrack}
          onClose={() => setSelectedModalTrack(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subGreeting: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  // SPOTIFY IMPORTER CARD
  importerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorderGlow,
    marginBottom: 20,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  importerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spotifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  spotifyBadgeText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 5,
    letterSpacing: 0.6,
  },
  importerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  importerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  importerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importerInput: {
    flex: 1,
    height: 42,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 8,
  },
  importerButton: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importerButtonText: {
    color: '#080B08',
    fontSize: 13,
    fontWeight: '800',
  },
  importProgressRow: {
    marginTop: 8,
  },
  importProgressText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  // GENRE SPHERES
  chipsScroll: {
    paddingBottom: 16,
  },
  sphereChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  activeSphereChip: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sphereText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  activeSphereText: {
    color: '#080B08',
    fontWeight: '900',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 6,
  },
  gridItemWrapper: {
    width: '50%',
  },
  horizontalRow: {
    paddingRight: 16,
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
});
