#Requires AutoHotkey v2.0
#SingleInstance Force
SendMode("Input")

; Configuration: Set this to your online hosted URL (e.g. "https://your-app.onrender.com") when deploying.
global API_URL := "https://quran-hadith-lookup-shortcuts.onrender.com"

; Automatically ensure the Flask server is running when this script starts.
EnsureServerRunning()

; Initialize the InputHook.
; - "V" makes input visible (so what the user types is typed in the active window).
; - "I1" prevents the script's own generated keystrokes (like pastes) from re-triggering the hook.
; - ";" is the only EndKey, meaning we trigger when the user types a semicolon.
ih := InputHook("V I1", ";")

; ------------------------------------------------------------------------------
; Text Expansion Hotstrings (Islamic phrases and Hadith book titles)
; ------------------------------------------------------------------------------
::ALLAH::ALLAH ﷻ
::love;::Prophet Muhammad ﷺ
::rs::رضي الله عنه
::als::عليه السلام
::aoa::Assalamu Alaikum
::bis::بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
::jaz::JazakAllahu Khayran
::allham::Allhamduillah
::day;::day of judgment 

::buk::Sahih al-Bukhari
::mus::Sahih Muslim
::abd::Sunan Abi Dawud
::tir::Jami' at-Tirmidhi

; ------------------------------------------------------------------------------
; Quran & Hadith Lookup Loop
; ------------------------------------------------------------------------------
Loop {
    ih.Start()
    ih.Wait()
    
    ; If the hook stopped because the user typed the EndKey (";")
    if (ih.EndReason == "EndKey") {
        inputText := ih.Input
        
        ; Match 1: Quran reference (e.g., "2:285" or "1:1")
        if RegExMatch(inputText, "i)\b(\d+):(\d+)$", &match) {
            ref := match[1] ":" match[2]
            ProcessLookup("quran", ref, StrLen(match[0]))
        }
        ; Match 2: Hadith reference (e.g., "muslim45" or "bukhari 102" or "b102")
        ; Supports: bukhari (b), muslim (m), abudawud (ad), tirmidhi (t), nasai (n), ibnmajah (im)
        else if RegExMatch(inputText, "i)\b(bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah|b|m|ad|t|n|im)\s*(\d+)$", &match) {
            book := NormalizeBook(match[1])
            num := match[2]
            ProcessLookup(book, num, StrLen(match[0]))
        }
    }
}

; Function to clean up book name abbreviations
NormalizeBook(abbr) {
    abbr := StrLower(abbr)
    if (abbr == "b" || abbr == "bukhari")
        return "bukhari"
    if (abbr == "m" || abbr == "muslim")
        return "muslim"
    if (abbr == "ad" || abbr == "abudawud")
        return "abudawud"
    if (abbr == "t" || abbr == "tirmidhi")
        return "tirmidhi"
    if (abbr == "n" || abbr == "nasai")
        return "nasai"
    if (abbr == "im" || abbr == "ibnmajah")
        return "ibnmajah"
    return abbr
}

ProcessLookup(book, query, matchLen) {
    ; Semicolon is already typed, so we need to backspace (matchLen + 1) characters
    backspaces := matchLen + 1
    
    global API_URL
    url := API_URL "/lookup?book=" book "&query=" query
    
    try {
        req := ComObject("Msxml2.XMLHTTP")
        req.open("GET", url, false)
        req.send()
        
        if (req.status == 200) {
            response := req.responseText
            
            ; 1. Delete the typed shortcut in the active text area
            Send("{BS " backspaces "}")
            
            ; 2. Backup clipboard, paste response, restore clipboard
            oldClip := ClipboardAll()
            A_Clipboard := response
            Sleep(50) ; Give clipboard time to update
            Send("^v")
            Sleep(150) ; Give OS time to paste
            A_Clipboard := oldClip
        }
    } catch {
        ; Do nothing if request fails (e.g. server is down)
    }
}

EnsureServerRunning() {
    global API_URL
    ; Only check/start local server if running locally
    if (!InStr(API_URL, "127.0.0.1") && !InStr(API_URL, "localhost")) {
        return
    }
    
    try {
        req := ComObject("Msxml2.XMLHTTP")
        req.open("GET", API_URL "/ping", false)
        req.send()
        if (req.status == 200) {
            return
        }
    } catch {
        ; Server not running. Start it hidden using pythonw.exe if available,
        ; falling back to python.exe if pythonw.exe is not in PATH.
        try {
            Run('pythonw server.py', , "Hide")
        } catch {
            Run('python server.py', , "Hide")
        }
        Sleep(1500) ; Give the server some time to initialize
    }
}

; Dynamic resets of the typing buffer.
; If the user clicks or presses keys that change the cursor position (like Enter, Esc, arrows, Alt-Tab),
; we stop and restart the InputHook. This clears the captured text buffer so old inputs aren't mixed.
~LButton::
~RButton::
~MButton::
~LWin::
~RWin::
~Alt::
~Tab::
~Enter::
~Escape::
~Up::
~Down::
~Left::
~Right::
{
    global ih
    ih.Stop()
}
