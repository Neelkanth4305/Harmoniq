import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';

export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function CustomSeekBar({
  position = 0,
  duration = 180,
  onSeek,
  showTimes = true,
  barHeight = 4,
  thumbSize = 12,
}) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const barRef = useRef(null);

  const effectiveDuration = duration > 0 ? duration : 180;
  const currentPos = isScrubbing ? scrubPosition : position;
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentPos / effectiveDuration) * 100)
  );

  const calculatePositionFromEvent = (evt) => {
    if (layoutWidth <= 0) return currentPos;

    let clickX = evt.nativeEvent.locationX;

    // Accurate Web coordinate calculation (accounts for clicking on thumb or fill bar)
    if (Platform.OS === 'web' && barRef.current) {
      try {
        const rect = barRef.current.getBoundingClientRect
          ? barRef.current.getBoundingClientRect()
          : null;
        if (rect && evt.nativeEvent.clientX !== undefined) {
          clickX = evt.nativeEvent.clientX - rect.left;
        }
      } catch (e) {}
    }

    const clampedX = Math.max(0, Math.min(clickX, layoutWidth));
    const newPos = (clampedX / layoutWidth) * effectiveDuration;
    return newPos;
  };

  const handleGrant = (evt) => {
    setIsScrubbing(true);
    const newPos = calculatePositionFromEvent(evt);
    setScrubPosition(newPos);
  };

  const handleMove = (evt) => {
    const newPos = calculatePositionFromEvent(evt);
    setScrubPosition(newPos);
  };

  const handleRelease = (evt) => {
    setIsScrubbing(false);
    const finalPos = calculatePositionFromEvent(evt);
    if (onSeek) {
      onSeek(finalPos);
    }
  };

  return (
    <View style={styles.container}>
      <View
        ref={barRef}
        style={[styles.touchArea, { height: Math.max(barHeight * 5, 24) }]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setLayoutWidth(w);
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleGrant}
        onResponderMove={handleMove}
        onResponderRelease={handleRelease}
        onResponderTerminate={handleRelease}
      >
        <View style={[styles.trackBg, { height: barHeight }]}>
          <View
            style={[
              styles.trackFill,
              { width: `${progressPercent}%`, height: barHeight },
            ]}
          />
          <View
            style={[
              styles.thumb,
              {
                left: `${progressPercent}%`,
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                marginLeft: -thumbSize / 2,
                marginTop: -thumbSize / 2 + barHeight / 2,
                opacity: isScrubbing || Platform.OS === 'web' ? 1 : 0.85,
              },
            ]}
          />
        </View>
      </View>

      {showTimes && (
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(currentPos)}</Text>
          <Text style={styles.timeText}>{formatTime(effectiveDuration)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 2,
  },
  touchArea: {
    width: '100%',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  trackBg: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  trackFill: {
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    top: '50%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
