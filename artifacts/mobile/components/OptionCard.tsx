import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import Colors from "@/constants/colors";
import { SpeakerButton } from "@/components/SpeakerButton";
import { SentencePair } from "@/models/SentencePair";

interface OptionCardProps {
  pair: SentencePair;
  mode: "englishToRussian" | "russianToEnglish";
  state: "default" | "correct" | "wrong";
  onPress: () => void;
  showTranslation: boolean;
}

export function OptionCard({ pair, mode, state, onPress, showTranslation }: OptionCardProps) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== "default") {
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      borderAnim.setValue(0);
    }
  }, [state, borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      "transparent",
      state === "correct"
        ? Colors.correctGreen
        : state === "wrong"
        ? Colors.wrongRed
        : "transparent",
    ],
  });

  const displayText = mode === "englishToRussian" ? pair.russian : pair.english;
  const translationText = mode === "englishToRussian" ? pair.english : pair.russian;

  const showSpeaker = mode === "englishToRussian" || showTranslation;
  const speakerText = pair.russian;
  const speakerColor =
    state === "default"
      ? Colors.accentBlue
      : state === "correct"
      ? Colors.correctGreen
      : Colors.wrongRed;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Animated.View
        style={[
          styles.card,
          {
            borderLeftColor: borderColor,
            borderLeftWidth: 3,
          },
        ]}
      >
        {showSpeaker && (
          <SpeakerButton
            text={speakerText}
            language="ru-RU"
            size={18}
            color={speakerColor}
          />
        )}

        <View style={styles.textColumn}>
          <Text style={styles.mainText}>{displayText}</Text>
          {showTranslation && (
            <Text style={styles.translationText}>{translationText}</Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  textColumn: { flex: 1 },
  mainText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
  translationText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 4,
  },
});
