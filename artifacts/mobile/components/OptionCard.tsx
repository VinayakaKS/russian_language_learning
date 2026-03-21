import React, { useEffect, useRef } from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { SpeakerButton } from "@/components/SpeakerButton";
import { SentencePair } from "@/models/SentencePair";
import { QuizMode } from "@/models/QuizMode";
import Colors from "@/constants/colors";

type OptionState = "default" | "correct" | "wrong";

interface OptionCardProps {
  pair: SentencePair;
  mode: QuizMode;
  state: OptionState;
  onPress: () => void;
  showTranslation: boolean;
}

const BG_COLORS: Record<OptionState, string> = {
  default: Colors.cardBg,
  correct: Colors.correctGreen,
  wrong: Colors.wrongRed,
};

const TEXT_COLORS: Record<OptionState, string> = {
  default: "#1A1A2E",
  correct: Colors.white,
  wrong: Colors.white,
};

export function OptionCard({ pair, mode, state, onPress, showTranslation }: OptionCardProps) {
  const bgAnim = useRef(new Animated.Value(0)).current;

  const displayText = mode === "englishToRussian" ? pair.russian : pair.english;
  const translationText = mode === "englishToRussian" ? pair.english : pair.russian;
  const speechLang = mode === "englishToRussian" ? "ru-RU" : "en-US";
  const speechText = mode === "englishToRussian" ? pair.russian : pair.english;

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: state === "default" ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [state]);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.cardBg, BG_COLORS[state]],
  });

  const isDisabled = state !== "default" || showTranslation;
  const textColor = TEXT_COLORS[state];

  return (
    <Animated.View style={[styles.card, { backgroundColor: bgColor }]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={styles.inner}
      >
        <View style={styles.leftIcon}>
          <SpeakerButton
            text={speechText}
            language={speechLang}
            size={18}
            color={state === "default" ? Colors.accentBlue : "rgba(255,255,255,0.85)"}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.optionText, { color: textColor }]}>{displayText}</Text>
          {showTranslation && (
            <Text style={[styles.translationText, { color: state === "default" ? Colors.textMuted : "rgba(255,255,255,0.75)" }]}>
              {translationText}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
  },
  translationText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
