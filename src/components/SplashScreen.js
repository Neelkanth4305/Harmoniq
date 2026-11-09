import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function SplashScreen({ onFinish }) {
  // Entrance spring animations
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoRotate = useRef(new Animated.Value(-0.06)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Concentric resonant soundwave rings
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.7)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0.5)).current;

  // Staggered Sound Core Waveform Heights (5 bars)
  const coreWave1 = useRef(new Animated.Value(0.4)).current;
  const coreWave2 = useRef(new Animated.Value(0.8)).current;
  const coreWave3 = useRef(new Animated.Value(0.6)).current;
  const coreWave4 = useRef(new Animated.Value(0.95)).current;
  const coreWave5 = useRef(new Animated.Value(0.5)).current;

  // 7 Bottom Equalizer Audio Frequency Bars
  const barHeights = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.85)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.7)).current,
    useRef(new Animated.Value(0.35)).current,
  ];

  // 2.4-Second Progress Bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);
  const finishedRef = useRef(false);

  const finishSplash = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (onFinish) onFinish();
  };

  useEffect(() => {
    // 1. Spring Entrance of Emblem
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.spring(logoRotate, {
        toValue: 0,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous Acoustic Ring Pulses
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring1Scale, {
            toValue: 2.2,
            duration: 1900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ring1Opacity, {
            toValue: 0,
            duration: 1900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ring1Scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(ring1Opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring2Scale, {
              toValue: 2.4,
              duration: 1900,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(ring2Opacity, {
              toValue: 0,
              duration: 1900,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring2Scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }, 450);

    // 3. Staggered Waveform motion inside the core
    const createWaveLoop = (anim, min, max, duration) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: max,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: min,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createWaveLoop(coreWave1, 0.3, 0.85, 400).start();
    createWaveLoop(coreWave2, 0.4, 1.0, 360).start();
    createWaveLoop(coreWave3, 0.35, 0.9, 440).start();
    createWaveLoop(coreWave4, 0.5, 1.0, 380).start();
    createWaveLoop(coreWave5, 0.25, 0.75, 420).start();

    // 4. Equalizer Frequency Bars
    barHeights.forEach((bar, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 1,
            duration: 380 + idx * 60,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.2,
            duration: 380 + idx * 60,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // 5. 2.4-Second Progress Timer
    const durationMs = 2400;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setPercent(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 30);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.bezier(0.2, 0, 0.2, 1),
      useNativeDriver: false,
    }).start(() => {
      setTimeout(finishSplash, 80);
    });

    // Guaranteed fallback timer (never get stuck)
    const safetyTimer = setTimeout(() => {
      finishSplash();
    }, 2600);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, []);

  const logoRotation = logoRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-360deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={finishSplash}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Modern Acoustic Resonance Core Emblem */}
        <View style={styles.emblemContainer}>
          {/* Outward Acoustic Expansion Rings */}
          <Animated.View
            style={[
              styles.acousticRing,
              {
                transform: [{ scale: ring1Scale }],
                opacity: ring1Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.acousticRing,
              {
                transform: [{ scale: ring2Scale }],
                opacity: ring2Opacity,
              },
            ]}
          />

          {/* Sound Core Disc with Rotating Entrance */}
          <Animated.View
            style={[
              styles.soundCore,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }, { rotate: logoRotation }],
              },
            ]}
          >
            <View style={styles.coreGlowBackdrop} />

            {/* Dynamic Sound Frequency Waveform Bars */}
            <View style={styles.crestRow}>
              <Animated.View style={[styles.crestBar, { transform: [{ scaleY: coreWave1 }] }]} />
              <Animated.View style={[styles.crestBar, { transform: [{ scaleY: coreWave2 }] }]} />
              <Animated.View
                style={[
                  styles.crestBar,
                  styles.crestBarCenter,
                  { transform: [{ scaleY: coreWave4 }] },
                ]}
              />
              <Animated.View style={[styles.crestBar, { transform: [{ scaleY: coreWave3 }] }]} />
              <Animated.View style={[styles.crestBar, { transform: [{ scaleY: coreWave5 }] }]} />
            </View>

            {/* Corner Sound Sparkle */}
            <View style={styles.sparkleBadge}>
              <Ionicons name="sparkles" size={12} color="#000000" />
            </View>
          </Animated.View>
        </View>

        {/* Sophisticated Brand Typography */}
        <Text style={styles.brandTitle}>H A R M O N I Q</Text>
        <Text style={styles.brandTagline}>FAMILY AUDIO SANCTUARY</Text>

        {/* Visualizer Equalizer Frequency Bars */}
        <View style={styles.equalizerRow}>
          {barHeights.map((bar, i) => (
            <Animated.View
              key={i}
              style={[
                styles.equalizerBar,
                {
                  transform: [{ scaleY: bar }],
                  backgroundColor: i % 2 === 0 ? colors.accent : colors.accentLight,
                },
              ]}
            />
          ))}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.statusLabel}>Harmonizing audio sanctuary…</Text>
            <Text style={styles.percentLabel}>{percent}%</Text>
          </View>
        </View>

        <Text style={styles.skipHint}>Tap anywhere to skip</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 380,
  },
  emblemContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    width: 124,
    height: 124,
  },
  acousticRing: {
    position: 'absolute',
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  soundCore: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E1E22',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
    position: 'relative',
  },
  coreGlowBackdrop: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.glowGreen,
    opacity: 0.6,
  },
  crestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
  },
  crestBar: {
    width: 4.5,
    height: 36,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
    marginHorizontal: 3,
  },
  crestBarCenter: {
    backgroundColor: colors.accentLight,
    height: 40,
  },
  sparkleBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 3,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  brandTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 6,
  },
  brandTagline: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 22,
    marginVertical: 20,
  },
  equalizerBar: {
    width: 3.5,
    height: 20,
    borderRadius: 2,
    marginHorizontal: 3,
  },
  progressContainer: {
    width: '100%',
    marginTop: 6,
  },
  progressBarTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 9999,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  percentLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  skipHint: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 11,
    marginTop: 16,
    letterSpacing: 0.5,
  },
});
