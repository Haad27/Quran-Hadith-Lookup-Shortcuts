import os
import sqlite3
from flask import Flask, request, jsonify, render_template, send_from_directory

app = Flask(__name__)
DB_PATH = os.path.join("database", "texts.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/download")
def download_exe():
    return send_from_directory("downloads", "IslamicShortcuts.exe", as_attachment=True)

@app.route("/ping")
def ping():
    return jsonify({"status": "ok"}), 200

@app.route("/lookup")
def lookup():
    book = request.args.get("book", "").lower().strip()
    query = request.args.get("query", "").strip()

    if not book or not query:
        return "Missing book or query parameter.", 400

    conn = get_db_connection()
    cursor = conn.cursor()

    if book == "quran":
        cursor.execute(
            "SELECT surah_name, reference, arabic, english FROM quran WHERE reference = ?", 
            (query,)
        )
        row = cursor.fetchone()
        conn.close()

        if not row:
            return "Verse not found.", 404

        formatted = (
            f"Surah {row['surah_name']} ({row['reference']})\n\n"
            f"{row['arabic']}\n\n"
            f"{row['english']}"
        )
        return formatted, 200

    else:
        try:
            hadith_num = int(query)
        except ValueError:
            conn.close()
            return "Hadith number must be an integer.", 400

        cursor.execute(
            "SELECT hadith_number, arabic, english FROM hadith WHERE book = ? AND hadith_number = ?",
            (book, hadith_num)
        )
        row = cursor.fetchone()
        conn.close()

        if not row:
            return f"Hadith {hadith_num} not found in {book.capitalize()}.", 404

        book_names = {
            "bukhari": "Sahih al-Bukhari",
            "muslim": "Sahih Muslim",
            "abudawud": "Sunan Abi Dawud",
            "tirmidhi": "Jami` at-Tirmidhi",
            "nasai": "Sunan an-Nasa'i",
            "ibnmajah": "Sunan Ibn Majah"
        }
        readable_book = book_names.get(book, book.capitalize())

        formatted = (
            f"{readable_book} (Hadith {row['hadith_number']})\n\n"
            f"{row['arabic']}\n\n"
            f"{row['english']}"
        )
        return formatted, 200

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=8765,
        debug=False
    )