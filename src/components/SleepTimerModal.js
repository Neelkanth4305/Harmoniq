import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';

const TIMER_OPTIONS = [
  { label: '5 Minutes', value: 5 },
  { label: '15 Minutes', value: 15 },
  { label: '30 Minutes', value: 30 },
  { label: '45 Minutes', value: 45 },
  { label: '60 Minutes (1 Hour)', value: 60 },
  { label: 'End of Current Track', value: 'track_end' },
];

export default function SleepTimerModal({ visible, onClose }) {
  const {
    sleepTimerMinutes,
    sleepTimerSecondsLeft,
    setSleepTimer,
  } = usePlayer();

  const formatCountdown = (secs) => {
    if (!secs) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (value) => {
    setSleepTimer(value);
    onClose();
  };

  const handleClearTimer = () => {
    setSleepTimer(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                  <Ionicons name="moon" size={18} color={colors.accent} style={{ marginRight: 8 }} />
                  <Text style={styles.title}>Sleep Timer</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {sleepTimerSecondsLeft && sleepTimerSecondsLeft > 0 ? (
                <View style={styles.activeTimerBanner}>
                  <Ionicons name="time-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.activeTimerText}>
                    Audio stopping in {formatCountdown(sleepTimerSecondsLeft)}
                  </Text>
                </View>
              ) : sleepTimerMinutes === 'track_end' ? (
                <View style={styles.activeTimerBanner}>
                  <Ionicons name="musical-notes" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.activeTimerText}>Stopping at end of current track</Text>
                </View>
              ) : null}

              <View style={styles.optionsList}>
                {TIMER_OPTIONS.map((opt) => {
                  const isSelected = sleepTimerMinutes === opt.value;
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={[styles.optionItem, isSelected && styles.activeOptionItem]}
                      onPress={() => handleSelectOption(opt.value)}
                    >
                      <Text style={[styles.optionLabel, isSelected && styles.activeOptionLabel]}>
                        {opt.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {(sleepTimerMinutes !== null || (sleepTimerSecondsLeft && sleepTimerSecondsLeft > 0)) && (
                  <TouchableOpacity style={styles.turnOffBtn} onPress={handleClearTimer}>
                    <Text style={styles.turnOffText}>Turn Off Sleep Timer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#242424',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1F',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  activeTimerText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E22',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeOptionItem: {
    borderColor: colors.accent,
    backgroundColor: '#2A2A30',
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '600',
  },
  activeOptionLabel: {
    color: colors.accent,
    fontWeight: '700',
  },
  turnOffBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  turnOffText: {
    color: colors.accentPink || '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
