import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import Colors from "@/constants/colors";

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: Colors.navyLight,
    borderRadius: 2,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    height: 4,
    backgroundColor: Colors.accentBlue,
    borderRadius: 2,
  },
});
