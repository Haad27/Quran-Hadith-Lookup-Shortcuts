// Quran & Hadith Shortcut Expansion - Content Script (Manifest V3)

// ------------------------------------------------------------------------------
// Configurations & Database Fallbacks
// ------------------------------------------------------------------------------
let quranDb = null;
const surahNames = [
    "", "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Ta-Ha", "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara'", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kauthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

// Load bundled Quran JSON database for serverless fallback
async function loadLocalQuran() {
    try {
        const url = chrome.runtime.getURL("quran.json");
        const res = await fetch(url);
        quranDb = await res.json();
    } catch (e) {
        console.warn("Could not load offline Quran database:", e);
    }
}
loadLocalQuran();

// Static Text Expansions Map
const expansions = {
    "ALLAH": "ALLAH ﷻ",
    "love;": "Prophet Muhammad ﷺ",
    "rs": "رضي الله عنه",
    "als": "عليه السلام",
    "aoa": "Assalamu Alaikum",
    "bis": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "jaz": "JazakAllahu Khayran",
    "allham": "Allhamduillah",
    "day;": "day of judgment",
    "buk": "Sahih al-Bukhari",
    "mus": "Sahih Muslim",
    "abd": "Sunan Abi Dawud",
    "tir": "Jami' at-Tirmidhi"
};

// ------------------------------------------------------------------------------
// Document Context & Selection Helpers
// ------------------------------------------------------------------------------
function getActiveSelection(target) {
    try {
        const doc = target ? (target.ownerDocument || document) : document;
        const win = doc.defaultView || window;
        return win.getSelection();
    } catch (e) {
        return window.getSelection();
    }
}

// ------------------------------------------------------------------------------
// Input & Keyup Event Handling (Main Trigger)
// ------------------------------------------------------------------------------
function processEvent(event, docContext = document) {
    let target = event.target;
    if (!target) return;

    if (target === docContext || target === window || target.tagName === 'BODY') {
        target = docContext.activeElement;
    }

    if (!target) return;

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        handleStandardInput(target);
    } else if (target.isContentEditable || (target.getAttribute && target.getAttribute('contenteditable') !== null) || (target.ownerDocument && target.ownerDocument.designMode === 'on')) {
        handleContentEditableInput(target, docContext);
    } else if (docContext.activeElement && (docContext.activeElement.tagName === 'INPUT' || docContext.activeElement.tagName === 'TEXTAREA')) {
        handleStandardInput(docContext.activeElement);
    } else if (docContext.activeElement && (docContext.activeElement.isContentEditable || (docContext.activeElement.getAttribute && docContext.activeElement.getAttribute('contenteditable') !== null))) {
        handleContentEditableInput(docContext.activeElement, docContext);
    }
}

document.addEventListener('input', processEvent, true);
document.addEventListener('keyup', (e) => {
    // Check keyup on Space, Enter, or Semicolon to catch apps that suppress input events (like Google Docs / Google Search)
    if (e.key === ' ' || e.key === 'Enter' || e.key === ';' || e.keyCode === 32 || e.keyCode === 13 || e.keyCode === 186 || e.key === 'Unidentified') {
        processEvent(e);
    }
}, true);

// Google Docs specific iframe binding helper
function bindToGoogleDocsIframe() {
    const iframe = document.querySelector('iframe.docs-texteventtarget-iframe');
    if (!iframe || !iframe.contentWindow) return false;
    
    try {
        const iframeDoc = iframe.contentWindow.document;
        if (!iframeDoc) return false;
        
        // Check if we already bound to this document
        if (iframeDoc.__shortcutsBound) return true;
        
        // Attach listeners to the iframe document
        iframeDoc.addEventListener('input', (e) => {
            processEvent(e, iframeDoc);
        }, true);
        
        iframeDoc.addEventListener('keyup', (e) => {
            if (e.key === ' ' || e.key === 'Enter' || e.key === ';' || e.keyCode === 32 || e.keyCode === 13 || e.keyCode === 186) {
                processEvent(e, iframeDoc);
            }
        }, true);
        
        iframeDoc.__shortcutsBound = true;
        console.log("Quran & Hadith Shortcuts: Bound successfully to Google Docs editor iframe!");
        return true;
    } catch (e) {
        return false;
    }
}

// Check for the Google Docs iframe periodically (since Google Docs can load it dynamically)
if (window.location.hostname.includes("docs.google.com")) {
    setInterval(bindToGoogleDocsIframe, 1000);
}

// ------------------------------------------------------------------------------
// Standard Input & Textarea Handler
// ------------------------------------------------------------------------------
function handleStandardInput(target) {
    const text = target.value;
    const cursor = target.selectionStart;
    if (cursor === null || cursor === undefined) return;
    
    const textBefore = text.substring(0, cursor);
    const textAfter = text.substring(cursor);

    const cleanedTextBefore = textBefore.replace(/\u00A0/g, ' ');

    // 1. Static Expansions
    const staticMatch = cleanedTextBefore.match(/(?:^|[^a-zA-Z0-9;])([a-zA-Z0-9;]+)(\s)$/);
    if (staticMatch) {
        const trigger = staticMatch[1];
        const whitespace = staticMatch[2];
        if (expansions[trigger]) {
            const replacement = expansions[trigger] + (whitespace === '\n' ? '\n' : ' ');
            const matchIndex = textBefore.lastIndexOf(trigger);
            
            // Try native browser insertText first to satisfy Google Search / React autocomplete
            target.setSelectionRange(matchIndex, cursor);
            const success = document.execCommand('insertText', false, replacement);
            if (!success) {
                const newTextBefore = textBefore.substring(0, matchIndex) + replacement;
                target.value = newTextBefore + textAfter;
                const newCursor = newTextBefore.length;
                target.setSelectionRange(newCursor, newCursor);
                target.dispatchEvent(new Event('input', { bubbles: true }));
                target.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return;
        }
    }

    // 2. Quran Lookup
    const quranMatch = cleanedTextBefore.match(/(?:^|[^0-9])(\d+:\d+);$/);
    if (quranMatch) {
        const ref = quranMatch[1];
        const matchLength = quranMatch[1].length + 1; // +1 for semicolon
        const offlineText = fetchQuranOffline(ref);
        if (offlineText) {
            replaceTypedText(target, false, matchLength, textBefore, textAfter, offlineText);
            return;
        }
        replaceAndFetch(target, false, ref, matchLength, "quran", textBefore, textAfter);
        return;
    }

    // 3. Hadith Lookup
    const hadithMatch = cleanedTextBefore.match(/(?:^|[^a-zA-Z0-9])(bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah|b|m|ad|t|n|im)\s*(\d+);$/i);
    if (hadithMatch) {
        const book = normalizeBook(hadithMatch[1]);
        const num = hadithMatch[2];
        const matchLength = hadithMatch[0].match(/[a-zA-Z0-9]+\s*\d+;$/)[0].length;
        replaceAndFetch(target, false, `${book} ${num}`, matchLength, book, textBefore, textAfter, num);
    }
}

// ------------------------------------------------------------------------------
// ContentEditable Handler
// ------------------------------------------------------------------------------
function handleContentEditableInput(target, docContext = document) {
    const selection = getActiveSelection(target);
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) return;

    const text = textNode.nodeValue;
    const offset = range.startOffset;
    const textBefore = text.substring(0, offset);
    const textAfter = text.substring(offset);

    const cleanedTextBefore = textBefore.replace(/\u00A0/g, ' ');

    // 1. Static Expansions
    const staticMatch = cleanedTextBefore.match(/(?:^|[^a-zA-Z0-9;])([a-zA-Z0-9;]+)(\s)$/);
    if (staticMatch) {
        const trigger = staticMatch[1];
        const whitespace = staticMatch[2];
        if (expansions[trigger]) {
            const replacement = expansions[trigger] + (whitespace === '\n' ? '\n' : ' ');
            const matchIndex = textBefore.lastIndexOf(trigger);
            
            // Try native rich-text insertion first (essential for Google Docs / Notion / React)
            const doc = textNode.ownerDocument || docContext;
            const replaceRange = doc.createRange();
            replaceRange.setStart(textNode, matchIndex);
            replaceRange.setEnd(textNode, offset);
            selection.removeAllRanges();
            selection.addRange(replaceRange);
            
            const success = doc.execCommand('insertText', false, replacement);
            if (!success) {
                textNode.nodeValue = textBefore.substring(0, matchIndex) + replacement + textAfter;
                const newOffset = matchIndex + replacement.length;
                const newRange = doc.createRange();
                newRange.setStart(textNode, newOffset);
                newRange.setEnd(textNode, newOffset);
                selection.removeAllRanges();
                selection.addRange(newRange);
                target.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return;
        }
    }

    // 2. Quran Lookup
    const quranMatch = cleanedTextBefore.match(/(?:^|[^0-9])(\d+:\d+);$/);
    if (quranMatch) {
        const ref = quranMatch[1];
        const matchLength = quranMatch[1].length + 1; // +1 for semicolon
        const offlineText = fetchQuranOffline(ref);
        if (offlineText) {
            replaceTypedText(textNode, true, matchLength, textBefore, textAfter, offlineText, docContext);
            return;
        }
        replaceAndFetch(textNode, true, ref, matchLength, "quran", textBefore, textAfter, "", docContext);
        return;
    }

    // 3. Hadith Lookup
    const hadithMatch = cleanedTextBefore.match(/(?:^|[^a-zA-Z0-9])(bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah|b|m|ad|t|n|im)\s*(\d+);$/i);
    if (hadithMatch) {
        const book = normalizeBook(hadithMatch[1]);
        const num = hadithMatch[2];
        const matchLength = hadithMatch[0].match(/[a-zA-Z0-9]+\s*\d+;$/)[0].length;
        replaceAndFetch(textNode, true, `${book} ${num}`, matchLength, book, textBefore, textAfter, num, docContext);
    }
}

// ------------------------------------------------------------------------------
// Replace Trigger with Loading and Fetch the Text
// ------------------------------------------------------------------------------
function replaceTypedText(nodeOrInput, isContentEditable, matchLength, textBefore, textAfter, replacement, docContext = document) {
    const startOffset = Math.max(0, textBefore.length - matchLength);
    const doc = nodeOrInput.ownerDocument || docContext;

    if (isContentEditable) {
        const selection = getActiveSelection(nodeOrInput);
        const replaceRange = doc.createRange();
        replaceRange.setStart(nodeOrInput, startOffset);
        replaceRange.setEnd(nodeOrInput, textBefore.length);
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(replaceRange);
        }

        const success = doc.execCommand('insertText', false, replacement);
        if (!success) {
            nodeOrInput.nodeValue = textBefore.substring(0, startOffset) + replacement + textAfter;
            if (selection) {
                const newOffset = startOffset + replacement.length;
                const newRange = doc.createRange();
                newRange.setStart(nodeOrInput, newOffset);
                newRange.setEnd(nodeOrInput, newOffset);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        }
    } else {
        nodeOrInput.setSelectionRange(startOffset, textBefore.length);
        const success = doc.execCommand('insertText', false, replacement);
        if (!success) {
            nodeOrInput.value = textBefore.substring(0, startOffset) + replacement + textAfter;
            const newCursor = startOffset + replacement.length;
            nodeOrInput.setSelectionRange(newCursor, newCursor);
        }
    }

    if (nodeOrInput && nodeOrInput.dispatchEvent) {
        nodeOrInput.dispatchEvent(new Event('input', { bubbles: true }));
        nodeOrInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function replaceAndFetch(nodeOrInput, isContentEditable, displayRef, matchLength, book, textBefore, textAfter, queryParam = "", docContext = document) {
    const placeholder = `[Loading ${displayRef}...]`;
    const originalText = textBefore.slice(-matchLength); 
    const doc = nodeOrInput.ownerDocument || docContext;
    
    if (isContentEditable) {
        const selection = getActiveSelection(nodeOrInput);
        const replaceRange = doc.createRange();
        const startOffset = Math.max(0, textBefore.length - matchLength);
        replaceRange.setStart(nodeOrInput, startOffset);
        replaceRange.setEnd(nodeOrInput, textBefore.length);
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(replaceRange);
        }
        
        const success = doc.execCommand('insertText', false, placeholder);
        if (!success) {
            nodeOrInput.nodeValue = textBefore.substring(0, textBefore.length - matchLength) + placeholder + textAfter;
            if (selection) {
                const newOffset = textBefore.length - matchLength + placeholder.length;
                const newRange = doc.createRange();
                newRange.setStart(nodeOrInput, newOffset);
                newRange.setEnd(nodeOrInput, newOffset);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        }
    } else {
        const startOffset = Math.max(0, textBefore.length - matchLength);
        nodeOrInput.setSelectionRange(startOffset, textBefore.length);
        const success = doc.execCommand('insertText', false, placeholder);
        if (!success) {
            nodeOrInput.value = textBefore.substring(0, textBefore.length - matchLength) + placeholder + textAfter;
            const newCursor = textBefore.length - matchLength + placeholder.length;
            nodeOrInput.setSelectionRange(newCursor, newCursor);
        }
    }

    if (nodeOrInput && nodeOrInput.dispatchEvent) {
        nodeOrInput.dispatchEvent(new Event('input', { bubbles: true }));
        nodeOrInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    fetchText(book, queryParam || displayRef)
        .then((resultText) => {
            const finalReplacement = resultText || `[${book} ${displayRef} not found. Ensure server is running]`;
            updatePlaceholder(nodeOrInput, isContentEditable, placeholder, finalReplacement, docContext);
        })
        .catch((err) => {
            updatePlaceholder(nodeOrInput, isContentEditable, placeholder, `[Extension Error: ${err.message}. Try refreshing the page.]`, docContext);
        });
}

// Helper to swap the placeholder with the final text
function updatePlaceholder(nodeOrInput, isContentEditable, placeholder, replacement, docContext = document) {
    const doc = nodeOrInput.ownerDocument || docContext;
    if (isContentEditable) {
        function findTextNode(node, text) {
            if (!node) return null;
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes(text)) return node;
            for (let child of (node.childNodes || [])) {
                let res = findTextNode(child, text);
                if (res) return res;
            }
            return null;
        }
        
        let activeEl = doc.activeElement || doc.body;
        let foundNode = findTextNode(activeEl, placeholder) || findTextNode(doc.body, placeholder) || nodeOrInput;
        
        if (foundNode && foundNode.nodeType === Node.TEXT_NODE) {
            const currentValue = foundNode.nodeValue;
            const index = currentValue.indexOf(placeholder);
            if (index !== -1) {
                const selection = getActiveSelection(foundNode);
                const replaceRange = doc.createRange();
                replaceRange.setStart(foundNode, index);
                replaceRange.setEnd(foundNode, index + placeholder.length);
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(replaceRange);
                }
                
                const success = doc.execCommand('insertText', false, replacement);
                if (!success) {
                    foundNode.nodeValue = currentValue.substring(0, index) + replacement + currentValue.substring(index + placeholder.length);
                    if (selection) {
                        const newOffset = index + replacement.length;
                        const newRange = doc.createRange();
                        newRange.setStart(foundNode, newOffset);
                        newRange.setEnd(foundNode, newOffset);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    }
                    if (activeEl && activeEl.dispatchEvent) {
                        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        }
    } else {
        const currentValue = nodeOrInput.value;
        const index = currentValue.indexOf(placeholder);
        if (index !== -1) {
            nodeOrInput.setSelectionRange(index, index + placeholder.length);
            const success = doc.execCommand('insertText', false, replacement);
            if (!success) {
                nodeOrInput.value = currentValue.substring(0, index) + replacement + currentValue.substring(index + placeholder.length);
                const newCursor = index + replacement.length;
                nodeOrInput.setSelectionRange(newCursor, newCursor);
                nodeOrInput.dispatchEvent(new Event('input', { bubbles: true }));
                nodeOrInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
}

// ------------------------------------------------------------------------------
// Network & Database Lookup Functions
// ------------------------------------------------------------------------------
async function fetchText(book, query) {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage({ action: "fetchVerse", book: book, query: query }, (response) => {
                if (chrome.runtime.lastError) {
                    // Suppress extension context invalidated errors, but fallback to offline if possible
                    console.warn(chrome.runtime.lastError.message);
                    if (book === "quran") {
                        resolve(fetchQuranOffline(query));
                    } else {
                        reject(new Error("Please refresh this webpage. The extension was updated."));
                    }
                    return;
                }
                
                if (response && response.success) {
                    resolve(response.data);
                } else {
                    if (book === "quran") {
                        resolve(fetchQuranOffline(query));
                    } else {
                        resolve(null);
                    }
                }
            });
        } catch (e) {
            reject(new Error("Please refresh this webpage."));
        }
    });
}

// Offline Quran JSON Fallback
function fetchQuranOffline(ref) {
    if (!quranDb || !quranDb[ref]) return null;
    const entry = quranDb[ref];
    const name = surahNames[entry.surah] || `Surah ${entry.surah}`;
    return `Surah ${name} (${ref})\n\n${entry.arabic}\n\n${entry.english}`;
}

// Normalize book abbreviations
function normalizeBook(abbr) {
    abbr = abbr.toLowerCase();
    if (abbr === "b" || abbr === "bukhari") return "bukhari";
    if (abbr === "m" || abbr === "muslim") return "muslim";
    if (abbr === "ad" || abbr === "abudawud") return "abudawud";
    if (abbr === "t" || abbr === "tirmidhi") return "tirmidhi";
    if (abbr === "n" || abbr === "nasai") return "nasai";
    if (abbr === "im" || abbr === "ibnmajah") return "ibnmajah";
    return abbr;
}
