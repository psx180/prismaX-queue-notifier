// Simple logger for the content script
const csLog = (...args: any[]) => {
    console.log("[prismax-cs]", ...args);
};

// Inject injected.js into the page context
(function injectScript() {
    csLog("injecting injected.js");


        const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected.js");
    script.type = "text/javascript";
    (document.head || document.documentElement).appendChild(script);
    script.remove();

    csLog("Injected script into page");

    // __INJECTED_WS_PATCH__
})();

// Listen for messages from the injected page script
window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;

    const msg = event.data;
    if (!msg || msg.source !== "prismax-extension") return;

    const url = new URL(window.location.href);
    const armIdFromUrl = url.pathname.split("/").pop() || null;

    csLog("Forwarding message from page to background", {
        wsType: msg.type,
        armIdFromUrl
    });

    chrome.runtime.sendMessage({
        type: "PRISMAX_WS_MESSAGE",
        armIdFromUrl,
        wsType: msg.type, // "connect" or "queue_update"
        payload: msg.payload
    });
});