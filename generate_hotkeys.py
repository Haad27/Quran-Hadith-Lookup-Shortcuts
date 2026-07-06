import json

with open("database/quran.json", "r", encoding="utf-8") as f:
    quran = json.load(f)

with open("quran_hotkeys.ahk", "w", encoding="utf-8") as ahk:

    ahk.write("#Requires AutoHotkey v2.0\n\n")

    for reference in sorted(
        quran.keys(),
        key=lambda x: tuple(map(int, x.split(":")))
    ):

        ahk.write(f"::{reference};::\n")
        ahk.write("{\n")
        ahk.write(f'    RunWait(\'python lookup_and_paste.py "{reference}"\', , "Hide")\n')
        ahk.write("    return\n")
        ahk.write("}\n\n")

print(f"Generated {len(quran)} hotkeys!")
print("Output: quran_hotkeys.ahk")