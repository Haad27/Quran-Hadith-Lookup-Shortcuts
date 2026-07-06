import os
import json
import sqlite3
import urllib.request
import requests
import time
from surah import SURAHS

DB_DIR = "database"
DB_PATH = os.path.join(DB_DIR, "texts.db")
RAW_DIR = os.path.join(DB_DIR, "raw")

# Kutub al-Sittah books and their edition suffixes
BOOKS = {
    "bukhari": {"ara": "ara-bukhari", "eng": "eng-bukhari"},
    "muslim": {"ara": "ara-muslim", "eng": "eng-muslim"},
    "abudawud": {"ara": "ara-abudawud", "eng": "eng-abudawud"},
    "tirmidhi": {"ara": "ara-tirmidhi", "eng": "eng-tirmidhi"},
    "nasai": {"ara": "ara-nasai", "eng": "eng-nasai"},
    "ibnmajah": {"ara": "ara-ibnmajah", "eng": "eng-ibnmajah"}
}

def ensure_dirs():
    os.makedirs(DB_DIR, exist_ok=True)
    os.makedirs(RAW_DIR, exist_ok=True)

def download_file(url, local_path):
    print(f"Downloading {url} to {local_path}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    for attempt in range(1, 4):
        try:
            r = requests.get(url, headers=headers, timeout=20)
            r.raise_for_status()
            with open(local_path, "wb") as f:
                f.write(r.content)
            print("Success.")
            return
        except Exception as e:
            print(f"Attempt {attempt} failed to download {url}: {e}")
            if attempt < 3:
                time.sleep(2)
            else:
                raise e

def get_edition_json(edition_name):
    local_path = os.path.join(RAW_DIR, f"{edition_name}.min.json")
    if not os.path.exists(local_path):
        url = f"https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{edition_name}.min.json"
        download_file(url, local_path)
    
    with open(local_path, "r", encoding="utf-8") as f:
        return json.load(f)

def build_database():
    ensure_dirs()
    
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Create tables
    print("Creating tables...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quran (
            reference TEXT PRIMARY KEY,
            surah INTEGER,
            ayah INTEGER,
            surah_name TEXT,
            arabic TEXT,
            english TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hadith (
            book TEXT,
            hadith_number INTEGER,
            arabic TEXT,
            english TEXT,
            PRIMARY KEY (book, hadith_number)
        )
    """)
    
    # 2. Populate Quran table
    quran_json_path = os.path.join(DB_DIR, "quran.json")
    if not os.path.exists(quran_json_path):
        quran_json_path = os.path.join("extras", "quran.json")
        
    if os.path.exists(quran_json_path):
        print(f"Loading Quran from {quran_json_path}...")
        with open(quran_json_path, "r", encoding="utf-8") as f:
            quran_data = json.load(f)
            
        print("Inserting Quran verses into SQLite...")
        for ref, data in quran_data.items():
            surah_num = data["surah"]
            surah_name = SURAHS.get(surah_num, f"Surah {surah_num}")
            cursor.execute("""
                INSERT OR REPLACE INTO quran (reference, surah, ayah, surah_name, arabic, english)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (ref, surah_num, data["ayah"], surah_name, data["arabic"], data["english"]))
        print(f"Inserted {len(quran_data)} Quran verses.")
    else:
        print("[Warning] quran.json not found! Quran table not updated.")

    # 3. Populate Hadith tables
    for book, editions in BOOKS.items():
        print(f"\nProcessing Hadith book: {book}...")
        try:
            ara_data = get_edition_json(editions["ara"])
            eng_data = get_edition_json(editions["eng"])
            
            # Map Arabic texts by Hadith number
            hadith_map = {}
            for h in ara_data.get("hadiths", []):
                num = h.get("hadithnumber")
                if num is not None:
                    hadith_map[num] = {
                        "arabic": h.get("text", ""),
                        "english": ""
                    }
            
            # Match English texts by Hadith number
            for h in eng_data.get("hadiths", []):
                num = h.get("hadithnumber")
                if num is not None:
                    if num in hadith_map:
                        hadith_map[num]["english"] = h.get("text", "")
                    else:
                        hadith_map[num] = {
                            "arabic": "",
                            "english": h.get("text", "")
                        }
            
            print(f"Inserting {len(hadith_map)} hadiths for {book} into SQLite...")
            for num, texts in hadith_map.items():
                cursor.execute("""
                    INSERT OR REPLACE INTO hadith (book, hadith_number, arabic, english)
                    VALUES (?, ?, ?, ?)
                """, (book, num, texts["arabic"], texts["english"]))
                
        except Exception as e:
            print(f"Error processing book '{book}': {e}")
            
    # 4. Create index for fast lookups
    print("\nCreating indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_hadith_lookup ON hadith(book, hadith_number)")
    
    conn.commit()
    conn.close()
    print("Database compilation finished successfully!")

if __name__ == "__main__":
    build_database()
