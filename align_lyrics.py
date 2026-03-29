import json
import random
import time
import urllib.request
import urllib.parse
import sys
import os

def translate(text: str) -> str:
    """Translate Russian text to English using MyMemory free API."""
    try:
        encoded = urllib.parse.quote(text)
        url = f"https://api.mymemory.translated.net/get?q={encoded}&langpair=ru|en"
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data["responseData"]["translatedText"]
    except Exception as e:
        print(f"  Translation failed for '{text}': {e}")
        return ""

def pick_blank_word(russian: str) -> str:
    """Pick a random content word (4+ chars) from the phrase."""
    words = [w.strip(",.!?…—\"'") for w in russian.split()]
    candidates = [w for w in words if len(w) >= 4]
    if not candidates:
        candidates = [w for w in words if len(w) >= 2]
    if not candidates:
        return words[-1] if words else ""
    return random.choice(candidates)

def load_lyrics(lyrics_path: str) -> list[str]:
    """Load lyrics from text file, one phrase per line, skip empty lines and headers."""
    lines = []
    with open(lyrics_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # skip empty lines and section headers like [Куплет 1] [Припев]
            if not line or line.startswith("["):
                continue
            lines.append(line)
    return lines

def load_whisper_segments(whisper_path: str) -> list[dict]:
    """Load segments from Whisper JSON output."""
    with open(whisper_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    segments = data.get("segments", [])
    # filter out empty or very short segments
    return [s for s in segments if s.get("text", "").strip()]

def align(lyrics: list[str], segments: list[dict]) -> list[dict]:
    """
    Align correct lyrics lines with Whisper segments by index.
    If lyrics has more lines than segments, remaining lines get
    estimated timestamps based on the last known segment.
    If segments has more entries than lyrics, extra segments are ignored.
    """
    aligned = []
    total_lyrics = len(lyrics)
    total_segments = len(segments)

    print(f"Lyrics lines: {total_lyrics}")
    print(f"Whisper segments: {total_segments}")

    if total_lyrics != total_segments:
        print(f"\nWARNING: Count mismatch — {total_lyrics} lyrics lines vs {total_segments} Whisper segments.")
        print("Aligning by index up to the minimum count.")
        print("You may need to manually check timestamps for misaligned lines.\n")

    count = min(total_lyrics, total_segments)

    for i in range(count):
        seg = segments[i]
        line = lyrics[i]
        aligned.append({
            "russian": line,
            "startMs": int(seg["start"] * 1000),
            "endMs": int(seg["end"] * 1000),
        })

    # if lyrics has more lines than whisper segments, estimate timestamps
    if total_lyrics > total_segments:
        last_end = int(segments[-1]["end"] * 1000)
        avg_duration = 4000  # assume 4 seconds per line
        for i in range(total_segments, total_lyrics):
            start = last_end + (i - total_segments) * avg_duration
            end = start + avg_duration
            aligned.append({
                "russian": lyrics[i],
                "startMs": start,
                "endMs": end,
            })
            print(f"  Estimated timestamps for line {i+1}: {lyrics[i]}")

    return aligned

def build_json(
    aligned: list[dict],
    song_id: str,
    song_title: str,
    artist: str,
    chorus_keywords: list[str] = None
) -> dict:
    """Build full app JSON with translations and blank words."""

    if chorus_keywords is None:
        chorus_keywords = ["свободен", "свобод"]

    phrases = []
    for i, item in enumerate(aligned):
        russian = item["russian"]

        # detect chorus by checking if line contains chorus keywords
        is_chorus = any(kw.lower() in russian.lower() for kw in chorus_keywords)

        print(f"[{i+1}/{len(aligned)}] Translating line: {russian}")
        english = translate(russian)
        time.sleep(0.5)

        blank = pick_blank_word(russian)

        print(f"  Blank word: {blank} — translating...")
        blank_translation = translate(blank)
        time.sleep(0.5)

        phrase = {
            "id": f"p{str(i+1).zfill(2)}",
            "index": i,
            "russian": russian,
            "english": english,
            "startMs": item["startMs"],
            "endMs": item["endMs"],
            "isChorus": is_chorus,
            "blankWord": blank,
            "blankWordTranslation": blank_translation,
        }
        phrases.append(phrase)

    return {
        "id": song_id,
        "title": song_title,
        "artist": artist,
        "audioFile": song_id + ".mp3",
        "difficulty": "intermediate",
        "phrases": phrases,
    }

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage:")
        print("  python align_lyrics.py <whisper_json> <lyrics_txt> <output_json> <song_title> <artist>")
        print("")
        print("Example:")
        print('  python align_lyrics.py ya_svoboden.json ya_svoboden_lyrics.txt app_song.json "Я Свободен" "Кипелов"')
        sys.exit(1)

    whisper_json  = sys.argv[1]
    lyrics_txt    = sys.argv[2]
    output_json   = sys.argv[3]
    title         = sys.argv[4]
    artist        = sys.argv[5]

    song_id = os.path.splitext(os.path.basename(whisper_json))[0]

    print(f"\nLoading lyrics from: {lyrics_txt}")
    lyrics = load_lyrics(lyrics_txt)

    print(f"Loading Whisper segments from: {whisper_json}")
    segments = load_whisper_segments(whisper_json)

    print(f"\nAligning...")
    aligned = align(lyrics, segments)

    print(f"\nBuilding JSON with translations...")
    output = build_json(aligned, song_id, title, artist)

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nDone! {len(output['phrases'])} phrases written to {output_json}")
