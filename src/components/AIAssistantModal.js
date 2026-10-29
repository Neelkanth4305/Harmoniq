import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import { searchYouTubeMusic } from '../api/youtube';
import TrackCard from './TrackCard';

const PRESET_MOODS = [
  { id: 'family', label: '👨‍👩‍👧‍👦 Family Vibes & Dinner', query: 'Feel Good Family Dinner Acoustic Hits' },
  { id: 'roadtrip', label: '🚗 Family Roadtrip Singalong', query: 'Best Family Roadtrip Sing Along Songs' },
  { id: 'chill', label: '🌙 Evening Chillout', query: 'Evening Chill Lofi Relaxing Beats' },
  { id: 'focus', label: '💻 Work & Study Focus', query: 'Deep Focus Ambient Study Music' },
  { id: 'hype', label: '⚡ Energy & Workout', query: 'High Energy Motivation Hits' },
  { id: 'rainy', label: '🌧️ Rainy Day Acoustic', query: 'Cozy Rainy Day Acoustic Guitar' },
  { id: 'happy', label: '☀️ Sunny Happy Pop', query: 'Upbeat Feel Good Family Pop Hits' },
  { id: 'sleep', label: '💤 Calm Sleep & Bedtime', query: 'Calm Bedtime Lullaby Soft Instrumental' },
];

export default function AIAssistantModal({ visible, onClose }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [selectedMoodId, setSelectedMoodId] = useState('chill');
  const [customMoodInput, setCustomMoodInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTracks, setSuggestedTracks] = useState([]);
  const [aiMessage, setAiMessage] = useState(
    'Tell me how you are feeling or what you are doing, and I will curate a personalized soundscape for your vibe.'
  );

  const handleGenerate = async (moodQuery = null, moodLabel = null) => {
    let finalQuery = moodQuery;
    let label = moodLabel;

    if (!finalQuery) {
      if (customMoodInput.trim()) {
        finalQuery = `${customMoodInput.trim()} music vibes playlist`;
        label = `"${customMoodInput.trim()}"`;
      } else {
        const found = PRESET_MOODS.find((m) => m.id === selectedMoodId) || PRESET_MOODS[0];
        finalQuery = found.query;
        label = found.label;
      }
    }

    setIsGenerating(true);
    setSuggestedTracks([]);
    setAiMessage(`Tuning into your mood for ${label}...`);

    try {
      const result = await searchYouTubeMusic(finalQuery);
      setIsGenerating(false);

      if (result.tracks && result.tracks.length > 0) {
        setSuggestedTracks(result.tracks);
        setAiMessage(
          `Curated ${result.tracks.length} tracks to harmonize with ${label}. Tap "Play Mood Mix" or select any song below.`
        );
      } else {
        setAiMessage(`Could not find music for this mood. Try typing something else!`);
      }
    } catch (e) {
      setIsGenerating(false);
      setAiMessage(`AI connection hiccup. Please try again!`);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedMoodId(preset.id);
    setCustomMoodInput('');
    handleGenerate(preset.query, preset.label);
  };

  const handlePlayAll = () => {
    if (suggestedTracks.length > 0) {
      playTrack(suggestedTracks[0], suggestedTracks);
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
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiEmblem}>
                <Ionicons name="sparkles" size={18} color="#0B0F0C" />
              </View>
              <View>
                <Text style={styles.title}>Harmoniq AI Family DJ</Text>
                <Text style={styles.subtitle}>Mood & vibe curation for everyone</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* AI Thought / Message Bubble */}
          <View style={styles.aiBubble}>
            <Ionicons name="bulb-outline" size={18} color={colors.accentLight} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.aiBubbleText}>{aiMessage}</Text>
          </View>

          {/* Custom Mood Input Bar */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. rainy Sunday, high energy coding, nostalgic Hindi..."
              placeholderTextColor={colors.textMuted}
              value={customMoodInput}
              onChangeText={setCustomMoodInput}
              returnKeyType="search"
              onSubmitEditing={() => handleGenerate()}
            />
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={() => handleGenerate()}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#0B0F0C" />
              ) : (
                <Ionicons name="arrow-forward" size={18} color="#0B0F0C" />
              )}
            </TouchableOpacity>
          </View>

          {/* Preset Mood Chips */}
          <View style={styles.presetsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
              {PRESET_MOODS.map((mood) => {
                const isActive = selectedMoodId === mood.id && !customMoodInput;
                return (
                  <TouchableOpacity
                    key={mood.id}
                    style={[styles.moodChip, isActive && styles.activeMoodChip]}
                    onPress={() => handleSelectPreset(mood)}
                  >
                    <Text style={[styles.moodChipText, isActive && styles.activeMoodChipText]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Play Mix Action Banner */}
          {suggestedTracks.length > 0 && (
            <View style={styles.playMixBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.playMixTitle}>Mood Mix Ready</Text>
                <Text style={styles.playMixSub}>{suggestedTracks.length} tracks hand-selected for you</Text>
              </View>
              <TouchableOpacity style={styles.playMixBtn} onPress={handlePlayAll}>
                <Ionicons name="play" size={16} color="#0B0F0C" style={{ marginRight: 6 }} />
                <Text style={styles.playMixBtnText}>Play All</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Recommended Tracklist */}
          {isGenerating ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="large" color={colors.accentLight} />
              <Text style={styles.loadingText}>Synthesizing your mood soundscape...</Text>
            </View>
          ) : (
            <FlatList
              data={suggestedTracks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.trackListContent}
              renderItem={({ item, index }) => (
                <TrackCard
                  track={item}
                  index={index}
                  variant="list"
                  isPlayingThis={currentTrack?.id === item.id && isPlaying}
                  onPress={() => playTrack(item, suggestedTracks)}
                />
              )}
              ListEmptyComponent={
                !isGenerating && (
                  <View style={styles.emptyState}>
                    <Ionicons name="color-wand-outline" size={44} color={colors.surfaceLight} />
                    <Text style={styles.emptyTitle}>Pick a mood or type your vibe</Text>
                    <Text style={styles.emptySub}>
                      The AI will search live audio and construct a custom queue matching your exact feeling.
                    </Text>
                  </View>
                )
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// Floating Small Circle Button placed at bottom-right corner
export function AIAssistantFAB({ onPress, bottomOffset = 80 }) {
  return (
    <TouchableOpacity
      style={[styles.fabCircle, { bottom: bottomOffset }]}
      activeOpacity={0.8}
      onPress={onPress}
      title="AI Mood DJ"
    >
      <View style={styles.fabInner}>
        <Ionicons name="sparkles" size={22} color="#0B0F0C" />
      </View>
      <View style={styles.fabPulseRing} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // FAB Floating Action Button (Small circle at bottom right corner)
  fabCircle: {
    position: 'absolute',
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentLight, // Dim soft mint green
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPulseRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: 'rgba(110, 231, 183, 0.4)',
  },

  // Modal Sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 12, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorderGlow,
    borderBottomWidth: 0,
    maxHeight: '85%',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiEmblem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  aiBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(110, 231, 183, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.16)',
    marginBottom: 14,
  },
  aiBubbleText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 8,
  },
  generateBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsWrapper: {
    marginBottom: 14,
  },
  presetsScroll: {
    paddingVertical: 2,
  },
  moodChip: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  activeMoodChip: {
    backgroundColor: colors.accent,
    borderColor: colors.accentLight,
  },
  moodChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  activeMoodChipText: {
    color: '#0B0F0C',
    fontWeight: '800',
  },
  playMixBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(46, 168, 102, 0.14)',
    borderWidth: 1,
    borderColor: colors.cardBorderGlow,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  playMixTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  playMixSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  playMixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  playMixBtnText: {
    color: '#0B0F0C',
    fontSize: 12,
    fontWeight: '800',
  },
  loadingArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 10,
  },
  trackListContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
