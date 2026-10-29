import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import { searchYouTubeMusic } from '../api/youtube';
import TrackCard from '../components/TrackCard';
import PlaylistModal from '../components/PlaylistModal';

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
      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.accent} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search any song, artist, album worldwide..."
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
          <Text style={styles.loadingText}>Searching live music...</Text>
        </View>
      )}

      {/* Results List */}
      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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

      {/* Empty State / Recent Searches */}
      {!loading && results.length === 0 && (
        <View style={styles.emptyContainer}>
          {recentSearches && recentSearches.length > 0 ? (
            <View style={styles.recentSection}>
              <View style={styles.recentHeaderRow}>
                <Text style={styles.recentTitle}>Recent Searches</Text>
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
                    <Ionicons name="time-outline" size={15} color={colors.accent} style={{ marginRight: 6 }} />
                    <Text style={styles.recentTagText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.placeholderState}>
              <Ionicons name="radio-outline" size={64} color={colors.surfaceLight} />
              <Text style={styles.placeholderTitle}>Discover Infinite Sound</Text>
              <Text style={styles.placeholderSubtitle}>
                Search any track to stream live music and synced karaoke lyrics.
              </Text>
            </View>
          )}
        </View>
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
    backgroundColor: colors.background,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.cardBorderGlow,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
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
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  recentSection: {
    marginTop: 8,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  recentTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  clearRecentText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  recentTagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  recentTagText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  placeholderState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  placeholderTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
  },
  placeholderSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
