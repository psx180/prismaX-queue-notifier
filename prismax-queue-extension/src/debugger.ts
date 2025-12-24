import { handleConnect, handleQueueUpdate } from "./queueLogic";
import {parseSocketIoFrame} from "./socketProtocol";
import {loadOptions} from "./extensionOptions";

// Track which tabs we have attached to
const attachedTabs = new Set<number>();

// Track whether we've already started debugger integration
let debuggerStarted = false;

// Keep references to listeners so we can remove them on stopDebugger
// The TabChangeInfo type in @types/chrome is a bit inconsistent across versions,
// so we just treat it as `any` to avoid TS errors.
let tabsOnUpdatedListener:
    ((tabId: number, changeInfo: any, tab: chrome.tabs.Tab) => void) | null = null;
let debuggerOnEventListener:
    ((source: chrome.debugger.Debuggee, method: string, params?: object) => void) | null = null;

// Helpers to recognize relevant URLs
function isTeleOpPage(url: string): boolean {
    try {
        const u = new URL(url);
        return u.origin === "https://app.prismax.ai" && u.pathname.startsWith("/tele-op/");
    } catch {
        return false;
    }
}

// If isPrismaXSocket + prismaXWebSocketUrlsByRequestId were only used in the
// debugger event handler, they can be removed from this file.

async function attachDebuggerToTab(tabId: number) {
    if (attachedTabs.has(tabId)) {
        console.debug("attachDebuggerToTab: already attached", { tabId });
        return;
    }

    try {
        console.info("Attaching debugger to tab", tabId);
        await chrome.debugger.attach({ tabId }, "1.3");
        await chrome.debugger.sendCommand({ tabId }, "Network.enable", {});
        attachedTabs.add(tabId);
        console.info("Debugger attached and Network enabled for tab", tabId);
    } catch (e) {
        console.error("Error attaching debugger", e);
    }
}

async function detachDebuggerFromTab(tabId: number) {
    if (!attachedTabs.has(tabId)) {
        console.debug("detachDebuggerFromTab: not attached", { tabId });
        return;
    }

    try {
        console.info("Detaching debugger from tab", tabId);
        await chrome.debugger.detach({ tabId });
    } catch (e) {
        console.error("Error detaching debugger", e);
    }
    attachedTabs.delete(tabId);
}

async function attachIfMatchingAndEnabled(tabId: number, url?: string | null) {
    if (!url || !isTeleOpPage(url)) return;

    const opts = await loadOptions();
    if (!opts.enabled) {
        console.debug("attachIfMatchingAndEnabled: extension disabled; skipping attach", { tabId, url });
        return;
    }

    console.info("attachIfMatchingAndEnabled: attaching debugger to matching tab", { tabId, url });
    await attachDebuggerToTab(tabId);
}

async function attachToAllMatchingTabs() {
    chrome.tabs.query({ url: "https://app.prismax.ai/tele-op/*" }, async (tabs) => {
        console.info("attachToAllMatchingTabs: found tabs", { count: tabs.length });

        for (const tab of tabs) {
            if (!tab.id || !tab.url) continue;
            await attachIfMatchingAndEnabled(tab.id, tab.url);
        }
    });
}

async function detachFromAllAttachedTabs() {
    const ids = Array.from(attachedTabs);
    for (const tabId of ids) {
        console.info("Auto-detaching debugger from tab due to disable", tabId);
        await detachDebuggerFromTab(tabId);
    }
}

export async function startDebugger() {
    if (debuggerStarted) {
        console.debug("startDebugger: already started, skipping re-init");
        return;
    }
    debuggerStarted = true;

    // Attach to pre-existing tabs
    await attachToAllMatchingTabs();

    // Auto-attach when a matching tab is loaded or navigated
    tabsOnUpdatedListener = (tabId, changeInfo, tab) => {
        if (changeInfo.status === "complete" && tab.url && isTeleOpPage(tab.url)) {
            console.info("tabs.onUpdated: completed navigation to tele-op page", {
                tabId,
                url: tab.url
            });
            attachIfMatchingAndEnabled(tabId, tab.url);
        }
    };
    chrome.tabs.onUpdated.addListener(tabsOnUpdatedListener);

    // Debugger events: track websocket traffic on attached tabs and route messages
    debuggerOnEventListener = (source, method, params) => {
        const tabId = source.tabId;
        if (!tabId || !attachedTabs.has(tabId)) return;

        if (
            method === "Network.webSocketFrameReceived" ||
            method === "Network.webSocketFrameSent"
        ) {

            // @ts-ignore
            const { response } = params;
            if (!response || typeof response.payloadData !== "string") return;

            const frameData: string = response.payloadData;
            const parsed = parseSocketIoFrame(frameData);
            if (!parsed) return;

            if (parsed.type === "connect") {
                const payload = parsed.data;
                console.debug("DevTools connect event", {tabId, robotId: payload?.robotId, userId: payload?.userId});
                if (payload?.robotId && payload?.userId) {
                    handleConnect(payload);
                }
            } else if (parsed.type === "queue_update") {
                const payload = parsed.data;
                console.debug("DevTools queue_update event", {tabId, robotId: payload?.robotId, queueLen: Array.isArray(payload?.queue) ? payload.queue.length : 0});
                handleQueueUpdate(payload);
            }
        }
    };
    chrome.debugger.onEvent.addListener(debuggerOnEventListener);
}

export async function stopDebugger() {
    if (!debuggerStarted) {
        console.debug("stopDebugger: not started, nothing to do");
        return;
    }
    debuggerStarted = false;

    // Stop auto-attaching to tabs
    if (tabsOnUpdatedListener && chrome.tabs.onUpdated.hasListener(tabsOnUpdatedListener)) {
        chrome.tabs.onUpdated.removeListener(tabsOnUpdatedListener);
    }
    tabsOnUpdatedListener = null;

    // Stop listening to DevTools websocket events
    if (debuggerOnEventListener && chrome.debugger.onEvent.hasListener(debuggerOnEventListener)) {
        chrome.debugger.onEvent.removeListener(debuggerOnEventListener);
    }
    debuggerOnEventListener = null;

    // Detach debugger from all tabs we know about
    await detachFromAllAttachedTabs();
}
