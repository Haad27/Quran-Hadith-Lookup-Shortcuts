import json

arabic_file = "quran-uthmani.txt"
english_file = "en.sahih.txt"

database = {}

# -----------------------------
# Read Arabic file
# -----------------------------
with open(arabic_file, "r", encoding="utf-8-sig") as f:
    for line_number, line in enumerate(f, start=1):
        line = line.strip()

        if not line:
            continue

        parts = line.split("|", 2)

        if len(parts) != 3:
            print(f"[Arabic] Bad line {line_number}: {repr(line)}")
            continue

        surah, ayah, arabic = parts

        key = f"{surah}:{ayah}"

        database[key] = {
            "surah": int(surah),
            "ayah": int(ayah),
            "arabic": arabic
        }

# -----------------------------
# Read English file
# -----------------------------
with open(english_file, "r", encoding="utf-8-sig") as f:
    for line_number, line in enumerate(f, start=1):
        line = line.strip()

        if not line:
            continue

        parts = line.split("|", 2)

        if len(parts) != 3:
            print(f"[English] Bad line {line_number}: {repr(line)}")
            continue

        surah, ayah, english = parts

        key = f"{surah}:{ayah}"

        if key in database:
            database[key]["english"] = english
        else:
            print(f"[Warning] Verse {key} found in English but not Arabic.")

# -----------------------------
# Save JSON
# -----------------------------
with open("quran.json", "w", encoding="utf-8") as f:
    json.dump(database, f, ensure_ascii=False, indent=4)

print()
print("✅ Done!")
print(f"Total verses: {len(database)}")
print("Database saved as quran.json")