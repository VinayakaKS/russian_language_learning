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

  // What the user sees as the main option text
  const displayText = mode === "englishToRussian" ? pair.russian : pair.english;

  // The revealed translation shown after answering
  const translationText = mode === "englishToRussian" ? pair.english : pair.russian;

  // Speaker always reads RUSSIAN:
  // - englishToRussian mode: options show Russian → speak Russian immediately
  // - russianToEnglish mode: options show English → speak Russian only after the Russian is revealed
  const speakerText = pair.russian;
  const speakerLang = "ru-RU" as const;

  // Show speaker:
  // - englishToRussian: always (options are Russian)
  // - russianToEnglish: only after answering (when Russian translation is revealed)
  const showSpeaker = mode === "englishToRussian" || showTranslation;

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
        {showSpeaker && (
          <View style={styles.leftIcon}>
            <SpeakerButton
              text={speakerText}
              language={speakerLang}
              size={18}
              color={state === "default" ? Colors.accentBlue : "rgba(255,255,255,0.85)"}
            />
          </View>
        )}
        <View style={[styles.textContainer, !showSpeaker && styles.textContainerFull]}>
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
  textContainerFull: {
    marginLeft: 0,
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
