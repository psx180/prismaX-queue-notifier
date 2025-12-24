import {startDebugger, stopDebugger} from "./debugger";
import {loadOptions} from "./extensionOptions";

(function initDebuggerIntegration() {
    try {
        // 1. React to "enabled" toggles in storage (auto-attach/detach)
        chrome.storage.onChanged.addListener(async (changes, areaName) => {
            if (areaName !== "sync") return;
            if (!changes.enabled) return;

            const newValue = changes.enabled.newValue;
            const enabled = typeof newValue === "boolean" ? newValue : true;

            if (enabled) {
                console.info("Enabled changed to true, auto-attaching to matching tabs");
                await startDebugger();
            } else {
                console.info("Enabled changed to false, detaching from all attached tabs");
                await stopDebugger();
            }
        });

        // 2. On startup, auto-attach to existing matching tabs if enabled
        loadOptions().then(async (opts) => {
            if (opts.enabled) {
                console.info("Extension is enabled on startup, auto-attaching to matching tabs");
                await startDebugger();
            }
        }).catch(e => console.error("Error loading extension options on startup", e));
    } catch(e) {
        console.error("Error initializing debugger integration", e);
    }

})();

//initDebuggerIntegration();


// ---- Message dispatcher ----

/*chrome.runtime.onMessage.addListener((message: any, sender) => {
    if (message.type !== "PRISMAX_WS_MESSAGE") return;

    console.info"Received PRISMAX_WS_MESSAGE", {
        wsType: message.wsType,
        fromTab: sender?.tab?.id,
        armIdFromUrl: message.armIdFromUrl
    });

    if (message.wsType === "connect") {
        handleConnect(message.payload as ConnectPayload);
    } else if (message.wsType === "queue_update") {
        handleQueueUpdate(message.payload as QueueUpdatePayload);
    }
});*/



