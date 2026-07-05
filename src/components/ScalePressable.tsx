import * as Haptics from 'expo-haptics';
import React, { type ComponentProps, type ReactNode } from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ScalePressableProps = ComponentProps<typeof Pressable> & {
  children?: ReactNode;
  hapticStyle?: Haptics.ImpactFeedbackStyle | null;
  activeScale?: number;
};

export function ScalePressable({
  children,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  activeScale = 0.96,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (event: GestureResponderEvent) => {
    if (hapticStyle !== null) {
      Haptics.impactAsync(hapticStyle).catch(() => {});
    }
    scale.value = withSpring(activeScale, {
      stiffness: 300,
      damping: 25,
    });
    if (onPressIn) {
      onPressIn(event);
    }
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    scale.value = withSpring(1, {
      stiffness: 300,
      damping: 25,
    });
    if (onPressOut) {
      onPressOut(event);
    }
  };

  // Convert array-style style or regular style to work with Animated.View
  return (
    <AnimatedPressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
