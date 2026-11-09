import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';
import { askAIAssistant } from '../api/aiAssistant';
import TrackCard from './TrackCard';

const INITIAL_MESSAGES = [
  {
    id: 'msg_welcome',
    sender: 'ai',
    text: "Hey! I'm your Harmoniq AI DJ. Ask me anything about music—the story behind the playing song, lyrical meanings, artist trivia, or tell me your vibe and I'll curate a custom soundscape.",
    tracks: [],
    timestamp: Date.now(),
  },
];

const SUGGESTION_PROMPTS = [
  { id: 'p1', label: '✨ About Current Track', query: 'Tell me about the song playing right now' },
  { id: 'p2', label: '🔥 Songs Like This', query: 'Recommend 5 songs with a similar vibe and energy' },
  { id: 'p3', label: '📖 Explain Lyrics', query: 'What is the deeper meaning and story behind this song?' },
  { id: 'p4', label: '⚡ Gym & Workout', query: 'Give me high energy 130 BPM workout motivation tracks' },
  { id: 'p5', label: '🌟 Top Global Hits', query: 'Recommend 5 trending global top chartbuster songs' },
  { id: 'p6', label: '🎸 Bollywood Romantic', query: 'Recommend the most soulful Bollywood romantic acoustic hits' },
];

export default function AIAssistantModal({ visible, onClose }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isThinking]);

  const handleSend = async (customQuery = null) => {
    const textToSend = (customQuery || inputText).trim();
    if (!textToSend || isThinking) return;

    setInputText('');

    // Add user message to history
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      tracks: [],
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const context = {
        currentTrack,
        isPlaying,
      };

      const result = await askAIAssistant(textToSend, context);

      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: result.answer,
        tracks: result.tracks || [],
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errorMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: "I ran into a connection hiccup. Feel free to try again or pick one of the suggestions below!",
        tracks: [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handlePlayAllTracks = (tracks) => {
    if (tracks && tracks.length > 0) {
      playTrack(tracks[0], tracks);
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
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiEmblem}>
                <Ionicons name="sparkles" size={18} color="#000000" />
              </View>
              <View>
                <Text style={styles.title}>Harmoniq AI Music DJ</Text>
                <Text style={styles.subtitle}>Conversational insights & mood curation</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Current Track Context Badge */}
          {currentTrack && (
            <View style={styles.currentTrackBanner}>
              <Ionicons name="musical-notes" size={14} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={styles.currentTrackText} numberOfLines={1}>
                Active Track: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{currentTrack.title}</Text>
              </Text>
            </View>
          )}

          {/* Quick Prompt Suggestions */}
          <View style={styles.suggestionsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {SUGGESTION_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt.id}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(prompt.query)}
                >
                  <Text style={styles.suggestionText}>{prompt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Conversational Chat Scroll View */}
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((item) => {
              const isAi = item.sender === 'ai';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.messageRow,
                    isAi ? styles.aiMessageRow : styles.userMessageRow,
                  ]}
                >
                  {isAi && (
                    <View style={styles.aiSmallAvatar}>
                      <Ionicons name="sparkles" size={12} color="#000000" />
                    </View>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      isAi ? styles.aiBubble : styles.userBubble,
                    ]}
                  >
                    <Text style={isAi ? styles.aiText : styles.userText}>
                      {item.text}
                    </Text>

                    {/* Attached Recommended Tracks */}
                    {item.tracks && item.tracks.length > 0 && (
                      <View style={styles.attachedTracksContainer}>
                        <View style={styles.tracksHeaderRow}>
                          <Text style={styles.tracksHeaderTitle}>
                            Recommended Tracks ({item.tracks.length})
                          </Text>
                          <TouchableOpacity
                            style={styles.playAllBtn}
                            onPress={() => handlePlayAllTracks(item.tracks)}
                          >
                            <Ionicons name="play" size={12} color="#000000" style={{ marginRight: 4 }} />
                            <Text style={styles.playAllBtnText}>Play All</Text>
                          </TouchableOpacity>
                        </View>

                        {item.tracks.map((track, idx) => (
                          <TrackCard
                            key={track.id || idx}
                            track={track}
                            index={idx}
                            variant="list"
                            isPlayingThis={currentTrack?.id === track.id && isPlaying}
                            onPress={() => playTrack(track, item.tracks)}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {isThinking && (
              <View style={[styles.messageRow, styles.aiMessageRow]}>
                <View style={styles.aiSmallAvatar}>
                  <Ionicons name="sparkles" size={12} color="#000000" />
                </View>
                <View style={[styles.bubble, styles.aiBubble, styles.thinkingBubble]}>
                  <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
                  <Text style={styles.thinkingText}>Harmonizing thoughts & soundscape...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Chat Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask about songs, artists, lyrics, or a vibe..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isThinking}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={inputText.trim() ? '#000000' : 'rgba(0,0,0,0.3)'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    height: '88%',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiEmblem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
  },
  currentTrackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.25)',
  },
  currentTrackText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  suggestionsWrapper: {
    marginBottom: 8,
  },
  suggestionsScroll: {
    paddingVertical: 2,
  },
  suggestionChip: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  suggestionText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingVertical: 8,
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  aiMessageRow: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  aiSmallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 14,
    padding: 12,
  },
  aiBubble: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  userBubble: {
    backgroundColor: colors.accent,
  },
  aiText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  userText: {
    color: '#000000',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  thinkingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  attachedTracksContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  tracksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tracksHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playAllBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  fabInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: '#242424',
  },
});

export function AIAssistantFAB({ onPress, bottomOffset = 80 }) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.fabButton, { bottom: bottomOffset }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open AI Music Assistant"
    >
      <View style={styles.fabInner}>
        <Ionicons name="sparkles" size={19} color={colors.accent} />
        <View style={styles.fabDot} />
      </View>
    </TouchableOpacity>
  );
}

