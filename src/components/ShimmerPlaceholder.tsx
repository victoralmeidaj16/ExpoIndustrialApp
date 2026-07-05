import React, { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

type ShimmerPlaceholderProps = {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function ShimmerPlaceholder({
  width,
  height,
  borderRadius = 4,
  style,
}: ShimmerPlaceholderProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite repeat
      true // Reverse direction
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.placeholder,
        {
          width: width as any,
          height: height as any,
          borderRadius,
        },
        style,
        animatedStyle,
      ] as any}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#E5E7EB', // gray-200 light theme placeholder color
  },
});
