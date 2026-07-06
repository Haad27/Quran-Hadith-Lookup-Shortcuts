import sqlite3
import os

DB_PATH = os.path.join("database", "texts.db")

def test_lookups():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. Please wait for compilation to complete.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Test Quran
    cursor.execute("SELECT COUNT(*) FROM quran")
    quran_count = cursor.fetchone()[0]
    print(f"Quran verses in DB: {quran_count}")

    # Test Hadith
    cursor.execute("SELECT book, COUNT(*) FROM hadith GROUP BY book")
    hadith_counts = cursor.fetchall()
    print("Hadiths in DB:")
    for book, count in hadith_counts:
        print(f"  - {book}: {count}")

    # Test lookups
    print("\n--- Testing Lookups ---")
    
    # Quran lookup
    cursor.execute("SELECT * FROM quran WHERE reference = '2:285'")
    row = cursor.fetchone()
    if row:
        print(f"Quran 2:285: Found! Surah Name: {row[3]}")
    else:
        print("Quran 2:285: Not found!")

    # Hadith lookup
    for book in ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah"]:
        cursor.execute("SELECT * FROM hadith WHERE book = ? AND hadith_number = 1", (book,))
        row = cursor.fetchone()
        if row:
            print(f"Hadith {book} #1: Found!")
            # Print a snippet of english
            eng = row[3][:100] + "..." if row[3] else "[No English]"
            # Safe print for Windows terminal encoding
            safe_eng = eng.encode("ascii", errors="replace").decode("ascii")
            print(f"  Text snippet: {safe_eng}")
        else:
            print(f"Hadith {book} #1: Not found!")

    conn.close()

if __name__ == "__main__":
    test_lookups()