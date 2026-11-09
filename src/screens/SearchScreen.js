import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import { searchYouTubeMusic } from '../api/youtube';
import TrackCard from '../components/TrackCard';
import PlaylistModal from '../components/PlaylistModal';

const BROWSE_CATEGORIES = [
  { id: 'b1', title: 'Top Hits', color: '#8400E7', query: 'Top 50 Global Songs' },
  { id: 'b2', title: 'Bollywood', color: '#E1118C', query: 'Bollywood Hit Songs' },
  { id: 'b3', title: 'Pop Magic', color: '#1E3264', query: 'Top Pop English Songs' },
  { id: 'b4', title: 'Gym & Workout', color: '#E91429', query: 'Workout Gym Motivation' },
  { id: 'b5', title: 'Soulful Acoustic', color: '#509BF5', query: 'Acoustic Guitar Hits' },
  { id: 'b6', title: 'Rock Classics', color: '#B02897', query: 'Best Classic Rock Songs' },
];

export default function SearchScreen({ route }) {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = usePlayer();

  const [query, setQuery] = useState(route?.params?.initialQuery || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedModalTrack, setSelectedModalTrack] = useState(null);

  const debounceTimerRef = useRef(null);

  const executeSearch = useCallback(
    async (searchTerm) => {
      const clean = (searchTerm || '').trim();
      if (!clean) {
        setResults([]);
        setLoading(false);
        setErrorMessage(null);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      const res = await searchYouTubeMusic(clean);
      setResults(res.tracks || []);
      setErrorMessage(res.error || null);
      setLoading(false);

      if (res.tracks && res.tracks.length > 0) {
        addRecentSearch(clean);
      }
    },
    [addRecentSearch]
  );

  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim()) {
      setResults([]);
      setErrorMessage(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(text);
    }, 400);
  };

  useEffect(() => {
    if (route?.params?.initialQuery) {
      setQuery(route.params.initialQuery);
      executeSearch(route.params.initialQuery);
    }
  }, [route?.params?.initialQuery]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setErrorMessage(null);
  };

  const handleRecentClick = (term) => {
    setQuery(term);
    executeSearch(term);
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="What do you want to listen to?"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleQueryChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => executeSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Searching music...</Text>
        </View>
      )}

      {/* Results List */}
      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TrackCard
              track={item}
              index={index}
              variant="list"
              isPlayingThis={currentTrack?.id === item.id && isPlaying}
              onPress={() => playTrack(item, results)}
              onAddToPlaylist={(t) => setSelectedModalTrack(t)}
            />
          )}
        />
      )}

      {/* Empty State: Recent Searches + Browse Categories */}
      {!loading && results.length === 0 && (
        <FlatList
          data={[]}
          ListHeaderComponent={
            <View style={styles.emptyContainer}>
              {recentSearches && recentSearches.length > 0 && (
                <View style={styles.recentSection}>
                  <View style={styles.recentHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>Recent Searches</Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={styles.clearRecentText}>Clear all</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.recentTagsWrapper}>
                    {recentSearches.map((term, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.recentTag}
                        onPress={() => handleRecentClick(term)}
                      >
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={styles.recentTagText}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Browse All Categories */}
              <View style={styles.browseSection}>
                <Text style={styles.sectionHeaderTitle}>Browse All</Text>
                <View style={styles.browseGrid}>
                  {BROWSE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.browseCard, { backgroundColor: cat.color }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setQuery(cat.query);
                        executeSearch(cat.query);
                      }}
                    >
                      <Text style={styles.browseCardTitle}>{cat.title}</Text>
                      <Ionicons
                        name="musical-notes"
                        size={28}
                        color="rgba(255, 255, 255, 0.3)"
                        style={styles.browseCardIcon}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          }
          keyExtractor={() => 'empty'}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {/* Add to Playlist Modal */}
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
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 4,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: colors.warning,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 120,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  recentSection: {
    marginBottom: 24,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  clearRecentText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  recentTagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  recentTagText: {
    color: colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '500',
  },
  browseSection: {
    marginTop: 8,
  },
  browseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  browseCard: {
    width: '48%',
    height: 84,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  browseCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    maxWidth: '80%',
  },
  browseCardIcon: {
    position: 'absolute',
    bottom: -4,
    right: 4,
    transform: [{ rotate: '15deg' }],
  },
});
