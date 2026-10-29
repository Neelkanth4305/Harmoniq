import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import { fetchLyrics } from '../api/lyrics';

export default function LyricsView({ track }) {
  const { playbackPosition, duration, seekTo } = usePlayer();
  const [lyricsData, setLyricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const activeLineIndexRef = useRef(-1);

  useEffect(() => {
    let isMounted = true;
    if (!track) return;

    setLoading(true);
    setLyricsData(null);

    fetchLyrics(track.title, track.channel, duration).then((data) => {
      if (isMounted) {
        setLyricsData(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [track?.id, duration]);

  const syncedLines = lyricsData?.synced;
  let activeIndex = -1;

  if (syncedLines && syncedLines.length > 0) {
    for (let i = 0; i < syncedLines.length; i++) {
      if (playbackPosition >= syncedLines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smooth auto-scroll to keep active line centered
  useEffect(() => {
    if (activeIndex !== activeLineIndexRef.current) {
      activeLineIndexRef.current = activeIndex;
      if (scrollRef.current) {
        if (activeIndex >= 0) {
          const targetY = Math.max(0, activeIndex * 62 - 120);
          scrollRef.current.scrollTo({ y: targetY, animated: true });
        } else {
          scrollRef.current.scrollTo({ y: 0, animated: true });
        }
      }
    }
  }, [activeIndex]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.loadingText}>Syncing live karaoke lyrics...</Text>
      </View>
    );
  }

  if (syncedLines && syncedLines.length > 0) {
    const isIntro = activeIndex === -1 && syncedLines.length > 0 && playbackPosition < syncedLines[0].time;

    return (
      <View style={styles.container}>
        <View style={styles.syncedBadge}>
          <Ionicons name="sparkles" size={13} color={colors.accent} />
          <Text style={styles.syncedBadgeText}>PURE GREEN KARAOKE SYNC</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.lyricsScroll}
          contentContainerStyle={styles.lyricsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro status indicator if music is playing before first lyric */}
          {isIntro && (
            <View style={styles.introBox}>
              <Ionicons name="musical-notes" size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.introText}>Intro playing • Lyrics starting shortly</Text>
            </View>
          )}

          {syncedLines.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => seekTo(line.time)}
                style={[styles.lineWrapper, isActive && styles.activeLineWrapper]}
              >
                {isActive && (
                  <View style={styles.activeDotIndicator}>
                    <Ionicons name="play" size={12} color={colors.accent} />
                  </View>
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
      <Ionicons name="mic-off-outline" size={44} color={colors.surfaceLight} />
      <Text style={styles.emptyTitle}>Instrumental or Lyrics Unavailable</Text>
      <Text style={styles.emptySubtitle}>
        Enjoy the rhythm and vibe of the soundscape!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 8,
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
    marginTop: 12,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: colors.cardBorderGlow,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 12,
  },
  syncedBadgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 6,
  },
  introBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  introText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsContent: {
    paddingVertical: 16,
    paddingBottom: 90,
  },
  lineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 4,
    position: 'relative',
  },
  activeLineWrapper: {
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    transform: [{ scale: 1.02 }],
  },
  activeDotIndicator: {
    position: 'absolute',
    left: 8,
  },
  lyricLine: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  activeLyricLine: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  pastLyricLine: {
    color: colors.textMuted,
  },
  plainLyricLine: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
    marginVertical: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
