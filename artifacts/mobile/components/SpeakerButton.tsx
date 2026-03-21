import React, { useState } from "react";
import { TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface SpeakerButtonProps {
  text: string;
  language: "ru-RU" | "en-US";
  size?: number;
  color?: string;
}

export function SpeakerButton({ text, language, size = 22, color = Colors.accentBlue }: SpeakerButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  const speak = async () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSpeaking(true);
    Speech.speak(text, {
      language,
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
    });
  };

  return (
    <TouchableOpacity onPress={speak} style={styles.btn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      {speaking ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name="volume-medium" size={size} color={color} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
