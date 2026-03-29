import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { SONGS } from "@/constants/songs";

export default function SongSelectScreen() {
  const insets = useSafeAreaInsets();
  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 + webTopPadding }]}> 
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Song Mode</Text>
        <Text style={styles.subtitle}>Learn Russian through music</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {SONGS.map((song) => (
          <TouchableOpacity
            key={song.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/song-quiz", params: { songId: song.id } })}
          >
            <Image source={song.albumArt} style={styles.albumArt} />

            <View style={styles.metaWrap}>
              <Text style={styles.titleRussian}>{song.titleRussian}</Text>
              <Text style={styles.titleEnglish}>{song.titleEnglish}</Text>
              <Text style={styles.artist}>{song.artist}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  topBar: {
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 10,
  },
  backText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.navyCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  albumArt: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  metaWrap: {
    flex: 1,
  },
  titleRussian: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    marginBottom: 2,
  },
  titleEnglish: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginBottom: 2,
  },
  artist: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.accentBlue,
  },
});
