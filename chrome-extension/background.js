// Background Service Worker for handling external requests and bypassing CSP/Mixed Content
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchVerse") {
        fetchText(request.book, request.query)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep the message channel open for async response
    }
    
    if (request.action === "pingServer") {
        checkServer(request.url)
            .then(isOnline => sendResponse({ online: isOnline }))
            .catch(() => sendResponse({ online: false }));
        return true;
    }
});

async function fetchText(book, query) {
    let serverUrl = "http://127.0.0.1:8765";
    try {
        const settings = await chrome.storage.local.get("serverUrl");
        if (settings.serverUrl) {
            serverUrl = settings.serverUrl.replace(/\/$/, "");
        }
    } catch (e) {}

    const url = `${serverUrl}/lookup?book=${book}&query=${encodeURIComponent(query)}`;
    
    const res = await fetch(url);
    if (res.status === 200) {
        return await res.text();
    }
    throw new Error(`Server returned ${res.status}`);
}

async function checkServer(url) {
    const cleanUrl = url.replace(/\/$/, "");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    try {
        const res = await fetch(`${cleanUrl}/ping`, { signal: controller.signal });
        clearTimeout(timeoutId);
        return res.status === 200;
    } catch (e) {
        clearTimeout(timeoutId);
        return false;
    }
}
