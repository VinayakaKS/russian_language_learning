import json
import sys
import os
import subprocess
import time

def play_segment(audio_path: str, start_ms: int, end_ms: int):
    """Play a segment of audio using ffplay."""
    start_sec = start_ms / 1000
    duration_sec = (end_ms - start_ms) / 1000
    subprocess.run([
        "ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet",
        "-ss", str(start_sec),
        "-t", str(duration_sec),
        audio_path
    ])

def parse_time(input_str: str) -> int:
    """
    Parse time input to milliseconds.
    Accepts formats:
      - 67000       (raw milliseconds)
      - 67.5        (seconds as float)
      - 1:07        (mm:ss)
      - 1:07.5      (mm:ss.ms)
    """
    input_str = input_str.strip()
    try:
        if ":" in input_str:
            parts = input_str.split(":")
            minutes = int(parts[0])
            seconds = float(parts[1])
            return int((minutes * 60 + seconds) * 1000)
        elif "." in input_str:
            return int(float(input_str) * 1000)
        else:
            val = int(input_str)
            # if value looks like raw ms (>1000) use as-is, else treat as seconds
            if val > 1000:
                return val
            else:
                return val * 1000
    except ValueError:
        return -1

def ms_to_display(ms: int) -> str:
    """Convert ms to mm:ss.ms display string."""
    total_sec = ms / 1000
    minutes = int(total_sec // 60)
    seconds = total_sec % 60
    return f"{minutes}:{seconds:05.2f}"

def check_timestamps(json_path: str, audio_path: str):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    phrases = data["phrases"]
    total = len(phrases)
    changed = 0

    print(f"\nSong: {data['title']} — {data['artist']}")
    print(f"Total phrases: {total}")
    print(f"Audio: {audio_path}")
    print("\nControls:")
    print("  y       — timestamp is correct, move on")
    print("  n       — enter new start and end times")
    print("  r       — replay current segment")
    print("  s       — skip this phrase for now")
    print("  q       — save and quit")
    print("\nTime format: 1:07  or  67.5  or  67500 (ms)")
    print("-" * 50)

    i = 0
    while i < total:
        phrase = phrases[i]
        print(f"\n[{i+1}/{total}] {phrase['russian']}")
        print(f"  English: {phrase['english']}")
        print(f"  Current: {ms_to_display(phrase['startMs'])} → {ms_to_display(phrase['endMs'])}")
        print(f"  Playing segment...")

        play_segment(audio_path, phrase["startMs"], phrase["endMs"])

        while True:
            choice = input("  Correct? (y/n/r/s/q): ").strip().lower()

            if choice == "y":
                i += 1
                break

            elif choice == "r":
                print("  Replaying...")
                play_segment(audio_path, phrase["startMs"], phrase["endMs"])

            elif choice == "s":
                print("  Skipped.")
                i += 1
                break

            elif choice == "q":
                print("\nSaving and quitting...")
                save(json_path, data, changed)
                return

            elif choice == "n":
                # get new start
                while True:
                    start_input = input("  New start time (e.g. 1:07 or 67.5): ").strip()
                    start_ms = parse_time(start_input)
                    if start_ms >= 0:
                        break
                    print("  Invalid format. Try again.")

                # get new end
                while True:
                    end_input = input("  New end time (e.g. 1:11 or 71.0): ").strip()
                    end_ms = parse_time(end_input)
                    if end_ms >= 0:
                        break
                    print("  Invalid format. Try again.")

                phrase["startMs"] = start_ms
                phrase["endMs"] = end_ms
                changed += 1

                print(f"  Updated: {ms_to_display(start_ms)} → {ms_to_display(end_ms)}")
                print("  Replaying with new timestamps...")
                play_segment(audio_path, start_ms, end_ms)

                confirm = input("  Sounds good? (y/n): ").strip().lower()
                if confirm == "y":
                    i += 1
                    break
                # else loop again to re-enter

            else:
                print("  Unknown input. Use y / n / r / s / q")

    save(json_path, data, changed)

def save(json_path: str, data: dict, changed: int):
    # save to a new file to avoid overwriting original accidentally
    base, ext = os.path.splitext(json_path)
    out_path = base + "_corrected" + ext

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nDone! {changed} timestamps updated.")
    print(f"Saved to: {out_path}")
    print(f"\nTo use in the app, copy it:")
    print(f"  cp {out_path} <your app>/assets/data/ya_svoboden.json")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 check_timestamps.py <song_json> <audio_mp3>")
        print("Example: python3 check_timestamps.py app_song.json ya_svoboden.mp3")
        sys.exit(1)

    json_path  = sys.argv[1]
    audio_path = sys.argv[2]

    if not os.path.exists(json_path):
        print(f"Error: JSON file not found: {json_path}")
        sys.exit(1)

    if not os.path.exists(audio_path):
        print(f"Error: Audio file not found: {audio_path}")
        sys.exit(1)

    check_timestamps(json_path, audio_path)
