// Quran & Hadith Shortcuts - Popup Control Script

// Static Expansions list for the UI cheat sheet
const phrasesData = [
  { trigger: "ALLAH", text: "ALLAH ﷻ" },
  { trigger: "love;", text: "Prophet Muhammad ﷺ" },
  { trigger: "rs", text: "رضي الله عنه" },
  { trigger: "als", text: "عليه السلام" },
  { trigger: "aoa", text: "Assalamu Alaikum" },
  { trigger: "bis", text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
  { trigger: "jaz", text: "JazakAllahu Khayran" },
  { trigger: "allham", text: "Allhamduillah" },
  { trigger: "day;", text: "day of judgment" }
];

const booksData = [
  { trigger: "buk", text: "Sahih al-Bukhari" },
  { trigger: "mus", text: "Sahih Muslim" },
  { trigger: "abd", text: "Sunan Abi Dawud" },
  { trigger: "tir", text: "Jami' at-Tirmidhi" }
];

document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const phrasesGrid = document.getElementById("phrases-grid");
  const booksGrid = document.getElementById("books-grid");
  const searchInput = document.getElementById("search-input");
  const connectionStatus = document.getElementById("connection-status");
  const statusDot = connectionStatus.querySelector(".status-dot");
  const statusText = connectionStatus.querySelector(".status-text");
  
  const settingsToggle = document.getElementById("settings-toggle");
  const settingsPanel = document.getElementById("settings-panel");
  const settingsClose = document.getElementById("settings-close");
  const serverUrlInput = document.getElementById("server-url");
  const saveSettingsBtn = document.getElementById("save-settings");

  // Sandbox elements & handlers
  const testSandbox = document.getElementById("test-sandbox");
  const clearSandboxBtn = document.getElementById("clear-sandbox");
  const copySandboxBtn = document.getElementById("copy-sandbox");

  if (clearSandboxBtn && testSandbox) {
    clearSandboxBtn.addEventListener("click", () => {
      testSandbox.value = "";
      testSandbox.focus();
    });
  }

  if (copySandboxBtn && testSandbox) {
    copySandboxBtn.addEventListener("click", () => {
      const text = testSandbox.value;
      if (!text.trim()) return;
      
      navigator.clipboard.writeText(text).then(() => {
        const originalText = copySandboxBtn.innerHTML;
        copySandboxBtn.innerHTML = "✓ Copied!";
        copySandboxBtn.style.background = "linear-gradient(135deg, #10b981, #059669)";
        copySandboxBtn.style.boxShadow = "0 4px 10px rgba(16, 185, 129, 0.3)";
        
        setTimeout(() => {
          copySandboxBtn.innerHTML = originalText;
          copySandboxBtn.style.background = "linear-gradient(135deg, #6366f1, #4f46e5)";
          copySandboxBtn.style.boxShadow = "0 4px 10px rgba(99, 102, 241, 0.3)";
        }, 1500);
      }).catch(err => {
        console.error("Failed to copy text: ", err);
      });
    });
  }

  // Load Expansions dynamically into UI grids
  populateGrid(phrasesGrid, phrasesData);
  populateGrid(booksGrid, booksData);

  // Settings: Load Saved Server URL
  let serverUrl = "http://127.0.0.1:8765";
  try {
    const settings = await chrome.storage.local.get("serverUrl");
    if (settings.serverUrl) {
      serverUrl = settings.serverUrl;
      serverUrlInput.value = serverUrl;
    }
  } catch (e) {
    console.error("Error retrieving settings from storage:", e);
  }

  // Ping Server to check online status
  checkServerConnection(serverUrl);

  // Search Filter Handler
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterShortcuts(query);
  });

  // Settings Panel Toggles
  settingsToggle.addEventListener("click", () => {
    settingsPanel.classList.remove("hidden");
  });

  settingsClose.addEventListener("click", () => {
    settingsPanel.classList.add("hidden");
  });

  // Save Settings
  saveSettingsBtn.addEventListener("click", async () => {
    let url = serverUrlInput.value.trim();
    if (!url) {
      url = "http://127.0.0.1:8765";
      serverUrlInput.value = url;
    }
    
    // Save to storage
    await chrome.storage.local.set({ serverUrl: url });
    
    // Re-check connection and close panel
    checkServerConnection(url);
    settingsPanel.classList.add("hidden");
  });

  // ----------------------------------------------------------------------------
  // Helper Functions
  // ----------------------------------------------------------------------------
  
  // Populates grid elements with expansions
  function populateGrid(gridElement, data) {
    gridElement.innerHTML = "";
    data.forEach(item => {
      const div = document.createElement("div");
      div.className = "grid-item";
      div.innerHTML = `
        <span class="grid-trigger">${item.trigger}</span>
        <span class="grid-expansion" title="${item.text}">${item.text}</span>
      `;
      gridElement.appendChild(div);
    });
  }

  // Pings the local Flask/Hosted server
  async function checkServerConnection(url) {
    connectionStatus.className = "status-badge checking";
    statusText.textContent = "Connecting...";

    chrome.runtime.sendMessage({ action: "pingServer", url: url }, (response) => {
      if (response && response.online) {
        connectionStatus.className = "status-badge online";
        statusText.textContent = "Server Online";
      } else {
        connectionStatus.className = "status-badge offline";
        statusText.textContent = "Server Offline";
      }
    });
  }

  // Filters shortcuts in the popup view
  function filterShortcuts(query) {
    // 1. Filter cards (Database Lookups)
    const cards = document.querySelectorAll(".shortcut-card");
    cards.forEach(card => {
      const trigger = card.querySelector(".trigger-badge").textContent.toLowerCase();
      const desc = card.querySelector(".desc").textContent.toLowerCase();
      const exp = card.querySelector(".expansion-text").textContent.toLowerCase();
      
      if (trigger.includes(query) || desc.includes(query) || exp.includes(query)) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });

    // 2. Filter grid items (Phrases and Books)
    const gridItems = document.querySelectorAll(".grid-item");
    gridItems.forEach(item => {
      const trigger = item.querySelector(".grid-trigger").textContent.toLowerCase();
      const expansion = item.querySelector(".grid-expansion").textContent.toLowerCase();
      
      if (trigger.includes(query) || expansion.includes(query)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });

    // 3. Hide entire sections if they have no visible elements
    const sections = document.querySelectorAll(".shortcut-group");
    sections.forEach(section => {
      const visibleCards = Array.from(section.querySelectorAll(".shortcut-card")).filter(c => c.style.display !== "none");
      const visibleGridItems = Array.from(section.querySelectorAll(".grid-item")).filter(gi => gi.style.display !== "none");
      
      if (visibleCards.length === 0 && visibleGridItems.length === 0) {
        section.style.display = "none";
      } else {
        section.style.display = "block";
      }
    });
  }
});
