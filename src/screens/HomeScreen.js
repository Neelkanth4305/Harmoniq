import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import {
  searchYouTubeMusic,
  TODAYS_BIGGEST_HITS,
  BOLLYWOOD_CHARTBUSTERS,
  GLOBAL_POP_HITS,
} from '../api/youtube';
import TrackCard from '../components/TrackCard';
import PlaylistModal from '../components/PlaylistModal';

const CATEGORY_PILLS = [
  { id: 'all', label: 'All', query: 'Top Global Hits' },
  { id: 'biggest', label: "Today's Biggest Hits", query: 'Top 50 Global Hits' },
  { id: 'bollywood', label: 'Bollywood Chartbusters', query: 'Bollywood Hit Songs' },
  { id: 'pop', label: 'Global Pop', query: 'Top Pop English Hits' },
];

export default function HomeScreen({ navigation }) {
  const { currentTrack, playTrack, recentlyPlayed, isPlaying } = usePlayer();
  const [selectedPill, setSelectedPill] = useState('all');
  const [biggestHitsTracks, setBiggestHitsTracks] = useState(TODAYS_BIGGEST_HITS);
  const [bollywoodTracks, setBollywoodTracks] = useState(BOLLYWOOD_CHARTBUSTERS);
  const [globalPopTracks, setGlobalPopTracks] = useState(GLOBAL_POP_HITS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModalTrack, setSelectedModalTrack] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadAllCategories = async () => {
    try {
      const [trendRes, bollyRes, popRes] = await Promise.all([
        searchYouTubeMusic('Top 50 Global Hits Official'),
        searchYouTubeMusic('Latest Bollywood Hindi Hits Songs'),
        searchYouTubeMusic('Top English Pop Hits Billboard'),
      ]);

      // Strict Cross-Category Deduplication: Guarantees 100% unique tracks across all 3 sections!
      const seenTrackIds = new Set();
      const dedupeAndFill = (fetchedList, fallbackList) => {
        const result = [];
        const combined = [...(fetchedList || []), ...fallbackList];
        for (const track of combined) {
          if (track && track.id && !seenTrackIds.has(track.id)) {
            seenTrackIds.add(track.id);
            result.push(track);
          }
        }
        return result;
      };

      // 1. Today's Biggest Hits (Primary)
      const uniqueBiggest = dedupeAndFill(trendRes.tracks, TODAYS_BIGGEST_HITS);
      // 2. Bollywood Chartbusters (Guaranteed zero collision with Biggest Hits)
      const uniqueBollywood = dedupeAndFill(bollyRes.tracks, BOLLYWOOD_CHARTBUSTERS);
      // 3. Global Pop (Guaranteed zero collision with Biggest Hits or Bollywood)
      const uniqueGlobalPop = dedupeAndFill(popRes.tracks, GLOBAL_POP_HITS);

      if (uniqueBiggest.length > 0) setBiggestHitsTracks(uniqueBiggest);
      if (uniqueBollywood.length > 0) setBollywoodTracks(uniqueBollywood);
      if (uniqueGlobalPop.length > 0) setGlobalPopTracks(uniqueGlobalPop);
    } catch (err) {
      console.warn('Error loading dynamic categories:', err);
      setBiggestHitsTracks(TODAYS_BIGGEST_HITS);
      setBollywoodTracks(BOLLYWOOD_CHARTBUSTERS);
      setGlobalPopTracks(GLOBAL_POP_HITS);
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

  const handlePillPress = (pill) => {
    setSelectedPill(pill.id);
    if (pill.id !== 'all' && navigation) {
      navigation.navigate('Search', { initialQuery: pill.query });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <TouchableOpacity
            style={styles.searchIconBtn}
            onPress={() => navigation?.navigate('Search')}
            accessibilityLabel="Search music"
          >
            <Ionicons name="search" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {CATEGORY_PILLS.map((pill) => {
            const isActive = selectedPill === pill.id;
            return (
              <TouchableOpacity
                key={pill.id}
                style={[styles.pill, isActive && styles.activePill]}
                onPress={() => handlePillPress(pill)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, isActive && styles.activePillText]}>
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recently Played (2-Column Grid) */}
        {recentlyPlayed && recentlyPlayed.length > 0 && (
          <View style={styles.section}>
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
          </View>
        ) : (
          <>
            {/* 1. Today's Biggest Hits */}
            {biggestHitsTracks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Today's Biggest Hits</Text>
                  <TouchableOpacity
                    onPress={() => navigation?.navigate('Search', { initialQuery: "Today's Biggest Hits" })}
                  >
                    <Text style={styles.seeAllText}>Show all</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                  {biggestHitsTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      variant="carousel"
                      isPlayingThis={currentTrack?.id === track.id && isPlaying}
                      onPress={() => playTrack(track, biggestHitsTracks)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 2. Bollywood Chartbusters */}
            {bollywoodTracks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Bollywood Chartbusters</Text>
                  <TouchableOpacity
                    onPress={() => navigation?.navigate('Search', { initialQuery: 'Bollywood Chartbusters' })}
                  >
                    <Text style={styles.seeAllText}>Show all</Text>
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

            {/* 3. Global Pop */}
            {globalPopTracks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Global Pop</Text>
                  <TouchableOpacity
                    onPress={() => navigation?.navigate('Search', { initialQuery: 'Global Pop Hits' })}
                  >
                    <Text style={styles.seeAllText}>Show all</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                  {globalPopTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      variant="carousel"
                      isPlayingThis={currentTrack?.id === track.id && isPlaying}
                      onPress={() => playTrack(track, globalPopTracks)}
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
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsScroll: {
    paddingBottom: 16,
    gap: 8,
  },
  pill: {
    backgroundColor: '#242424',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  activePill: {
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  activePillText: {
    color: '#121212',
    fontWeight: '800',
  },
  section: {
    marginBottom: 26,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridItemWrapper: {
    width: '50%',
  },
  horizontalRow: {
    paddingRight: 16,
    gap: 12,
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
