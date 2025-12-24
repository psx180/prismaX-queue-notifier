document.addEventListener("DOMContentLoaded", () => {
    const enabledToggle = document.getElementById("enabledToggle");
    const openOptions = document.getElementById("openOptions");
    const status = document.getElementById("status");

    const DEFAULTS = { enabled: true };

    chrome.storage.sync.get(DEFAULTS, (items) => {
        enabledToggle.checked = !!items.enabled;
    });

    enabledToggle.addEventListener("change", () => {
        chrome.storage.sync.set({ enabled: enabledToggle.checked }, () => {
            status.textContent = enabledToggle.checked ? "Enabled" : "Disabled";
            setTimeout(() => (status.textContent = ""), 1500);
        });
    });

    openOptions.addEventListener("click", () => {
        chrome.runtime.openOptionsPage();
        window.close();
    });
});