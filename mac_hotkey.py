import time
import re
import requests
import pyperclip
from pynput import keyboard, mouse
import threading
import sys

# Configuration: API URL
API_URL = "https://quran-hadith-lookup-shortcuts.onrender.com"

# The buffer to store typed characters
typed_buffer = ""
buffer_lock = threading.Lock()

# Controller to simulate key presses (like Backspace and Cmd+V)
key_controller = keyboard.Controller()

# Hotstrings mapped exactly as in hotkey.ahk
HOTSTRINGS = {
    "ALLAH": "ALLAH ﷻ",
    "love;": "Prophet Muhammad ﷺ",
    "rs": "رضي الله عنه",
    "als": "عليه السلام",
    "aoa": "Assalamu Alaikum",
    "bis": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "jaz": "JazakAllahu Khayran",
    "allham": "Allhamduillah",
    "day;": "day of judgment ",
    "buk": "Sahih al-Bukhari",
    "mus": "Sahih Muslim",
    "abd": "Sunan Abi Dawud",
    "tir": "Jami' at-Tirmidhi",
}

def normalize_book(abbr):
    abbr = abbr.lower()
    if abbr in ["b", "bukhari"]: return "bukhari"
    if abbr in ["m", "muslim"]: return "muslim"
    if abbr in ["ad", "abudawud"]: return "abudawud"
    if abbr in ["t", "tirmidhi"]: return "tirmidhi"
    if abbr in ["n", "nasai"]: return "nasai"
    if abbr in ["im", "ibnmajah"]: return "ibnmajah"
    return abbr

def process_lookup(book, query, match_len):
    url = f"{API_URL}/lookup?book={book}&query={query}"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            paste_text(response.text, match_len)
    except Exception as e:
        print(f"Error fetching data: {e}")

def paste_text(text, backspaces):
    """
    Deletes the typed shortcut and pastes the replacement text.
    """
    # Wait a tiny bit to ensure the user has fully released their keys
    time.sleep(0.05)
    
    # Send backspaces to erase the typed shortcut
    for _ in range(backspaces):
        key_controller.tap(keyboard.Key.backspace)
        time.sleep(0.01)
        
    # Backup the user's current clipboard
    old_clip = pyperclip.paste()
    
    # Set clipboard to the new text
    pyperclip.copy(text)
    time.sleep(0.05)
    
    # Press Cmd+V to paste on Mac
    with key_controller.pressed(keyboard.Key.cmd):
        key_controller.tap('v')
        
    # Wait for the OS to finish pasting before restoring clipboard
    time.sleep(0.15)
    pyperclip.copy(old_clip)

def clear_buffer():
    global typed_buffer
    with buffer_lock:
        typed_buffer = ""

def on_press(key):
    global typed_buffer
    
    try:
        with buffer_lock:
            # Handle normal typed characters
            if hasattr(key, 'char') and key.char is not None:
                char = key.char
                typed_buffer += char
                
                # Check if the user typed the ';' trigger for Quran/Hadith
                if char == ';':
                    text_to_check = typed_buffer[:-1] # without the ';'
                    
                    # Match Quran (e.g., 2:285)
                    quran_match = re.search(r'\b(\d+):(\d+)$', text_to_check)
                    if quran_match:
                        ref = f"{quran_match.group(1)}:{quran_match.group(2)}"
                        match_len = len(quran_match.group(0))
                        threading.Thread(target=process_lookup, args=("quran", ref, match_len + 1)).start()
                        typed_buffer = ""
                        return
                    
                    # Match Hadith (e.g., bukhari 102)
                    hadith_match = re.search(r'\b(bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah|b|m|ad|t|n|im)\s*(\d+)$', text_to_check, re.IGNORECASE)
                    if hadith_match:
                        book = normalize_book(hadith_match.group(1))
                        num = hadith_match.group(2)
                        match_len = len(hadith_match.group(0))
                        threading.Thread(target=process_lookup, args=(book, num, match_len + 1)).start()
                        typed_buffer = ""
                        return

            elif key == keyboard.Key.backspace:
                typed_buffer = typed_buffer[:-1]
                
            elif key == keyboard.Key.space:
                typed_buffer += " "
                
            elif key == keyboard.Key.enter:
                typed_buffer += "\n"
                
            else:
                # Modifier keys like Shift shouldn't clear the buffer, but arrows/esc should
                if key not in [keyboard.Key.shift, keyboard.Key.shift_r, keyboard.Key.caps_lock]:
                    typed_buffer = ""

            # Check if current buffer ends with any of our standard hotstrings followed by space or enter
            for hs, replacement in HOTSTRINGS.items():
                # AHK triggers on space or enter by default
                if typed_buffer.endswith(hs + " "):
                    # +1 for the space, and append a space to the replacement
                    threading.Thread(target=paste_text, args=(replacement + " ", len(hs) + 1)).start()
                    typed_buffer = ""
                    break
                elif typed_buffer.endswith(hs + "\n"):
                    # +1 for the enter, append enter
                    threading.Thread(target=paste_text, args=(replacement + "\n", len(hs) + 1)).start()
                    typed_buffer = ""
                    break
                    
    except Exception as e:
        print(f"Key listener error: {e}")

def on_click(x, y, button, pressed):
    if pressed:
        clear_buffer()

def main():
    print("Islamic Shortcuts (Mac Version) is running in the background...")
    print("Press Ctrl+C in this terminal to exit.")
    
    # Start mouse listener to clear buffer on clicks
    mouse_listener = mouse.Listener(on_click=on_click)
    mouse_listener.start()
    
    # Start keyboard listener
    with keyboard.Listener(on_press=on_press) as kbd_listener:
        try:
            kbd_listener.join()
        except KeyboardInterrupt:
            print("\nExiting...")
            sys.exit(0)

if __name__ == "__main__":
    main()
