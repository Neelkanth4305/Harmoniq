import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import { fetchLyrics } from '../api/lyrics';

const OFFSET_STORAGE_PREFIX = '@harmoniq_offset_v2_';

export default function LyricsView({ track }) {
  const { playbackPosition, duration, seekTo } = usePlayer();
  const [lyricsData, setLyricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualOffset, setManualOffset] = useState(0);
  const scrollRef = useRef(null);
  const activeLineIndexRef = useRef(-1);

  // Load lyrics and saved custom offset for this track
  useEffect(() => {
    let isMounted = true;
    if (!track || !track.id) return;

    setLoading(true);
    setLyricsData(null);
    setManualOffset(0);

    // 1. Fetch lyrics
    fetchLyrics(track.title, track.channel, duration).then(async (data) => {
      if (!isMounted) return;
      setLyricsData(data);
      setLoading(false);

      // 2. Check for previously saved user offset for this track
      try {
        const saved = await AsyncStorage.getItem(OFFSET_STORAGE_PREFIX + track.id);
        if (saved !== null && isMounted) {
          setManualOffset(parseFloat(saved));
        } else if (data?.suggestedIntroOffset && isMounted) {
          // If video is longer than studio audio, set suggested intro offset
          setManualOffset(-data.suggestedIntroOffset);
        }
      } catch (e) {}
    });

    return () => {
      isMounted = false;
    };
  }, [track?.id, duration]);

  const syncedLines = lyricsData?.synced;
  const isRealSynced = lyricsData?.isSynced && syncedLines && syncedLines.length > 0;

  // Effective time calculated with sub-second precision
  const effectiveTime = Math.max(0, playbackPosition + manualOffset);

  let activeIndex = -1;
  if (isRealSynced) {
    for (let i = 0; i < syncedLines.length; i++) {
      if (effectiveTime >= syncedLines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Auto-scroll to center the active line
  useEffect(() => {
    if (activeIndex !== activeLineIndexRef.current) {
      activeLineIndexRef.current = activeIndex;
      if (scrollRef.current) {
        if (activeIndex >= 0) {
          const targetY = Math.max(0, activeIndex * 52 - 120);
          scrollRef.current.scrollTo({ y: targetY, animated: true });
        } else {
          scrollRef.current.scrollTo({ y: 0, animated: true });
        }
      }
    }
  }, [activeIndex]);

  const saveOffset = (newOffset) => {
    setManualOffset(newOffset);
    if (track?.id) {
      AsyncStorage.setItem(OFFSET_STORAGE_PREFIX + track.id, String(newOffset)).catch(() => {});
    }
  };

  const handleAdjustOffset = (delta) => {
    const updated = parseFloat((manualOffset + delta).toFixed(2));
    saveOffset(updated);
  };

  const handleResetOffset = () => {
    saveOffset(0);
  };

  const handleSeekToLine = (line) => {
    // Jump the audio player to where this line starts in the video
    const targetVideoTime = Math.max(0, line.time - manualOffset);
    seekTo(targetVideoTime);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.loadingText}>Synchronizing lyrics…</Text>
      </View>
    );
  }

  if (isRealSynced) {
    const isIntro = activeIndex === -1 && syncedLines.length > 0 && effectiveTime < syncedLines[0].time;

    return (
      <View style={styles.container}>
        {/* Sync Status & Calibration Bar */}
        <View style={styles.headerBar}>
          <View style={styles.syncedBadge}>
            <Ionicons name="sparkles" size={12} color={colors.accent} />
            <Text style={styles.syncedBadgeText}>Live Karaoke Sync</Text>
          </View>

          <View style={styles.offsetControlsRow}>
            <TouchableOpacity
              style={styles.offsetBtn}
              onPress={() => handleAdjustOffset(-0.5)}
              accessibilityLabel="Delay lyrics by 0.5 seconds"
            >
              <Text style={styles.offsetBtnText}>-0.5s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.offsetBtn}
              onPress={() => handleAdjustOffset(-0.2)}
              accessibilityLabel="Delay lyrics by 0.2 seconds"
            >
              <Text style={styles.offsetBtnText}>-0.2s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.offsetStatusPill, manualOffset !== 0 && styles.activeOffsetStatusPill]}
              onPress={handleResetOffset}
              accessibilityLabel="Reset lyrics sync offset"
            >
              <Text style={styles.offsetStatusPillText}>
                {manualOffset === 0 ? 'Sync 0.0s' : `${manualOffset > 0 ? '+' : ''}${manualOffset}s`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.offsetBtn}
              onPress={() => handleAdjustOffset(0.2)}
              accessibilityLabel="Advance lyrics by 0.2 seconds"
            >
              <Text style={styles.offsetBtnText}>+0.2s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.offsetBtn}
              onPress={() => handleAdjustOffset(0.5)}
              accessibilityLabel="Advance lyrics by 0.5 seconds"
            >
              <Text style={styles.offsetBtnText}>+0.5s</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.lyricsScroll}
          contentContainerStyle={styles.lyricsContent}
          showsVerticalScrollIndicator={false}
        >
          {isIntro && (
            <View style={styles.introBox}>
              <Ionicons name="musical-notes" size={15} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.introText}>Musical Intro · Singing starts in a moment</Text>
            </View>
          )}

          {syncedLines.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.65}
                onPress={() => handleSeekToLine(line)}
                style={[styles.lineWrapper, isActive && styles.activeLineWrapper]}
              >
                {isActive && (
                  <View style={styles.activeBarIndicator} />
                )}
                <Text
                  style={[
                    styles.lyricLine,
                    isActive && styles.activeLyricLine,
                    isPast && styles.pastLyricLine,
                  ]}
                >
                  {line.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (lyricsData?.plain) {
    return (
      <View style={styles.container}>
        <View style={styles.plainHeader}>
          <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.plainHeaderText}>Standard Track Lyrics</Text>
        </View>

        <ScrollView
          style={styles.lyricsScroll}
          contentContainerStyle={styles.lyricsContent}
          showsVerticalScrollIndicator={false}
        >
          {lyricsData.plain.split('\n').map((line, idx) => (
            <Text key={idx} style={styles.plainLyricLine}>
              {line || ' '}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="mic-off-outline" size={36} color={colors.surfaceLight} />
      <Text style={styles.emptyTitle}>Lyrics Not Available</Text>
      <Text style={styles.emptySubtitle}>
        No community lyrics found yet for this specific track title.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 8,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.25)',
  },
  syncedBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  offsetControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offsetBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  offsetBtnText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  offsetStatusPill: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  activeOffsetStatusPill: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    borderColor: colors.accent,
  },
  offsetStatusPillText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsContent: {
    paddingVertical: 18,
    paddingHorizontal: 4,
  },
  introBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.08)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.2)',
  },
  introText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  lineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  activeLineWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeBarIndicator: {
    width: 3.5,
    height: '80%',
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginRight: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  lyricLine: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 24,
    flex: 1,
  },
  activeLyricLine: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 27,
  },
  pastLyricLine: {
    color: colors.textMuted,
    opacity: 0.65,
  },
  plainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  plainHeaderText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  plainLyricLine: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 26,
    marginBottom: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
