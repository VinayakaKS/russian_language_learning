# 🇷🇺 Russian Lingua

A personal mobile app for learning spoken Russian, built with Expo and React Native.  
Inspired by Pimsleur's audio-first methodology — designed to make Russian stick through repetition, not rote memorization.

---

## Why I Built This

I'm a Master's student in Embedded Systems at RPTU Kaiserslautern, Germany. Between thesis work on BLE Channel Sounding, HiWi positions, and preparing for an Erasmus exchange at the University of Oulu in Finland — learning a new language wasn't exactly the obvious next project.

But Russian has always intrigued me. The script, the phonetics, the sheer difference from anything I'd learned before. I'd tried apps like Duolingo but found them too gamified and not focused enough on spoken language. Pimsleur was closer to what I wanted — audio-first, sentence-level learning — but I wanted something I could feed my own vocabulary into.

So I built it.

The idea was simple: take an Excel sheet of English–Russian sentence pairs, and turn it into a Pimsleur-style multiple choice quiz on my phone. No fluff, no streaks, no notifications — just sentences, audio, and spaced repetition.

---

## How It Was Built

I had no prior React Native or Expo experience. The entire app was scaffolded using **Replit Agent** with a detailed prompt I designed myself, informed by conversations with **Claude (Anthropic)** to think through the feature set, tech stack, and UX decisions.

### Development Timeline

**v0.1 — Initial scaffold**  
Replit Agent generated the full Expo / React Native project from a detailed prompt. Core quiz loop, spaced repetition logic, Excel parsing, and TTS audio were all in the initial build. Tested via Expo Go on Android by scanning a QR code.

**v0.2 — Icon rendering issues**  
Ionicons and Feather icons weren't rendering on Android — showing checkered boxes instead. Multiple fix attempts: explicit font loading via `Font.loadAsync`, consolidating icon font loading into a single `useFonts` call, trying different load strategies. The issue persisted across several iterations.

**v0.3 — Icons removed, stability restored**  
Rather than keep fighting the icon rendering bug, all visual icons were stripped and replaced with text/emoji equivalents. App became stable and usable again.

**v0.4 — Manual vocabulary entry**  
Added a new screen for manually entering sentence pairs — a native language text box first, then the target language equivalent. No longer dependent solely on Excel uploads for adding vocabulary.

**v0.5 — Vocabulary persistence and viewer**  
Vocabulary was previously lost on app close. Added `AsyncStorage` + JSON file persistence so vocab survives across sessions. Added a dedicated screen to view and manage all saved vocabulary pairs.

**v0.6 — Audio refinement**  
Removed English TTS from option cards before an answer is made. After answering, when all four options are revealed, Russian TTS plays for each option instead of English — reinforcing the spoken Russian form for all distractors, not just the correct answer.

**v0.7 — Info screen + dark theme**  
Moved the "How It Works" explanation off the main screen into a dedicated info screen, accessible via an info icon in the top-right corner. Switched the color scheme to a dark mode inspired theme with grayish hues. Attempted to restore Ionicons by explicitly loading the font — icons still unreliable on Android.

**v0.8 — Pushed to GitHub**  
Migrated from Replit to GitHub for continued local development on Ubuntu + VS Code.

---

## Current Status

| Feature | Status |
|---|---|
| Excel / CSV import | ✅ Working |
| Manual vocabulary entry | ✅ Working |
| Vocabulary persistence | ✅ Working |
| Vocabulary viewer screen | ✅ Working |
| Quiz loop (10 questions/round) | ✅ Working |
| Spaced repetition | ✅ Working |
| Russian TTS on options (post-answer) | ✅ Working |
| Info screen | ✅ Working |
| Dark grayish theme | ✅ Working |
| Vector icons (Ionicons) | ⚠️ Unreliable on Android |

---

## Known Issue — Icons on Android

Ionicons repeatedly fail to render on Android builds — showing blank space or checkered boxes. The agent attempted multiple fixes:
- Explicit `Font.loadAsync` with `require()`
- Consolidating all icon fonts into a single `useFonts` hook
- Switching between Ionicons, Feather, and MaterialIcons

**Root cause (suspected):** Expo's font bundling for icon sets behaves inconsistently between Expo Go and standalone APK builds. The fix likely requires switching to `@expo/vector-icons` with a properly configured `expo-font` plugin in `app.json`, or replacing icon components with custom SVGs.

This is the first thing to fix in local development.

---

## Features

- 📂 **Excel / CSV import** — load vocabulary as `.xlsx` or `.csv` (Column A: source language, Column B: target language)
- ✏️ **Manual entry** — add sentence pairs directly in the app
- 💾 **Persistent vocabulary** — all vocab saved to device storage, survives app restarts
- 📋 **Vocabulary viewer** — browse and manage all saved sentence pairs
- 🔄 **Two quiz modes** — source → target or target → source
- 🎯 **10 questions per round** — focused, completable sessions
- 🧠 **Spaced repetition** — wrong answers surface more frequently; mastered ones fade back
- 🔊 **Russian TTS audio** — every sentence playable; post-answer reveals play Russian for all 4 options
- 📖 **Distractor learning** — translations revealed for all 4 options after answering
- 📊 **Progress tracking** — accuracy stats, weak-words retry mode
- ℹ️ **Info screen** — how-it-works guide accessible via top-right icon

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo) |
| Language | TypeScript |
| Navigation | Expo Router |
| Excel Parsing | SheetJS (xlsx) |
| Audio | Expo Speech (TTS) |
| Storage | AsyncStorage + JSON file |
| State | React Context + useReducer |
| Build | EAS Build (Expo Application Services) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo`)
- Android device or emulator

### Run Locally

```bash
git clone https://github.com/VinayakaKS/russian_language_learning.git
cd russian_language_learning/artifacts/mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your Android phone.

### Build APK (Android)

```bash
npm install -g eas-cli
eas login
cd artifacts/mobile
eas build --platform android --profile preview
```

Download the `.apk` from the EAS dashboard and install directly on your Android device.

---

## Vocabulary Format

Your Excel file should follow this structure:

| Column A (Source Language) | Column B (Target Language) |
|---|---|
| Hello, how are you? | Привет, как дела? |
| Good morning | Доброе утро |
| Thank you very much | Большое спасибо |

A sample vocabulary file with 25 common Russian phrases is included in the repo.

---

## Roadmap

- [ ] Fix Ionicons rendering on Android (switch to SVG icons or fix expo-font plugin config)
- [ ] Make app language-agnostic (not just English–Russian)
- [ ] UI tweaks to personal taste
- [ ] Offline TTS caching
- [ ] iOS build via GitHub Actions + AltStore
- [ ] Session history and long-term retention graphs

---

## About Me

I'm Vinayaka — embedded systems engineer, Master's student, and occasional language enthusiast.  
Currently working on a thesis involving BLE Channel Sounding for indoor ranging using nRF54L15 hardware.  
This app is a side project that scratches a personal itch — and a reminder that the best tools are the ones you build for yourself.

---

*Built with curiosity, caffeine, and a detailed prompt.*
