import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';

const BAR_COUNT = 16;
const BASE_HEIGHTS = [6, 12, 18, 24, 16, 22, 28, 14, 20, 26, 15, 23, 17, 11, 8, 5];

export default function AudioVisualizer({ isPlaying, barCount = BAR_COUNT, maxHeight = 28, color = colors.accent }) {
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(4))
  ).current;

  useEffect(() => {
    let isMounted = true;
    const animations = [];

    if (isPlaying) {
      animatedValues.forEach((val, i) => {
        const minH = 4;
        const maxH = Math.min(maxHeight, BASE_HEIGHTS[i % BASE_HEIGHTS.length] || 16);
        const duration = 280 + ((i * 47) % 220);

        const anim = Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: maxH,
              duration: duration,
              useNativeDriver: false,
            }),
            Animated.timing(val, {
              toValue: minH + (i % 3) * 2,
              duration: duration,
              useNativeDriver: false,
            }),
          ])
        );
        animations.push(anim);
        anim.start();
      });
    } else {
      animatedValues.forEach((val) => {
        Animated.timing(val, {
          toValue: 4,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      isMounted = false;
      animations.forEach((anim) => anim.stop());
    };
  }, [isPlaying, barCount, maxHeight]);

  return (
    <View style={styles.container}>
      {animatedValues.map((val, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.bar,
            {
              height: val,
              backgroundColor: color,
              opacity: isPlaying ? 0.9 : 0.35,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 30,
    gap: 3,
    paddingHorizontal: 4,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
});
