document.addEventListener("DOMContentLoaded", () => {
    const enabledToggle = document.getElementById("enabledToggle");
    const openOptions = document.getElementById("openOptions");
    const status = document.getElementById("status");
    const statusText = status.querySelector(".status-text");

    const DEFAULTS = { enabled: true };

    chrome.storage.sync.get(DEFAULTS, (items) => {
        const enabled = !!items.enabled;
        enabledToggle.checked = enabled;

        status.dataset.state = enabled ? "on" : "off";
        statusText.textContent = enabled ? "Enabled" : "Disabled";
    });

    enabledToggle.addEventListener("change", () => {
        const enabled = enabledToggle.checked;

        chrome.storage.sync.set({ enabled }, () => {
            status.dataset.state = enabled ? "on" : "off";
            statusText.textContent = enabled ? "Enabled" : "Disabled";
        });
    });

    openOptions.addEventListener("click", () => {
        chrome.runtime.openOptionsPage();
        window.close();
    });
});