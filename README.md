# Islamic Shortcuts

A Windows productivity tool that lets you instantly insert Qur'an verses, Hadith, and common Islamic phrases anywhere on your computer using simple keyboard shortcuts.

Instead of opening websites, searching online, or copying and pasting references, simply type a shortcut and it will automatically be replaced with the corresponding text.

## Examples

| You Type | Automatically Becomes                                |
| -------- | ---------------------------------------------------- |
| `2:255;` | Qur'an 2:255 (Āyat al-Kursī)                         |
| `112;`   | Surah Al-Ikhlāṣ                                      |
| `m11;`   | Sahih Muslim 11 *(or the corresponding hadith text)* |
| `als;`   | ﷺ                                                    |
| `swt;`   | سُبْحَانَهُ وَتَعَالَى                               |
| `ra;`    | رَضِيَ ٱللَّٰهُ عَنْهُ                               |
| `raha;`  | رَحِمَهُ ٱللَّٰهُ                                    |
| `as;`    | عَلَيْهِ ٱلسَّلَامُ                                  |

The application works in almost every Windows application, including:

* Google Chrome
* Microsoft Edge
* Google Docs
* Microsoft Word
* Discord
* WhatsApp Desktop
* Notepad
* Visual Studio Code
* And most other applications that accept keyboard input.

---

## Features

* Instant Qur'an verse lookup
* Instant Hadith lookup
* Common Islamic phrase shortcuts
* Works system-wide across Windows
* Lightweight and fast
* Easy to expand with new shortcuts

---

## Tech Stack

* AutoHotkey v2
* Python
* Flask
* SQLite

---

## Running the Project

1. Install the Python dependencies:

```bash
pip install -r requirements.txt
```

2. Start the Flask server:

```bash
python server.py
```

3. Run `hotkey.ahk`.

The shortcut system is now active across Windows.

---

## Future Plans

* More Hadith collections
* Multiple Qur'an translations
* Tafsīr support
* Offline mode
* Android & iOS apps
* Browser extension
* AI-powered Islamic search

---

May Allah ﷻ accept this effort and make it beneficial for everyone. Āmīn.
