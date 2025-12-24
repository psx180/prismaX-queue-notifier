(function () {
  console.log("[prismax-injected] script loaded");

  const PATCH_FLAG = "__prismaxWebSocketPatched_prismaxExtension";

  // Avoid double-patching if script is injected twice
  if (window[PATCH_FLAG]) {
    console.log("[prismax-injected] already patched, skipping");
    return;
  }
  window[PATCH_FLAG] = true;

  function log() {
    console.log("[prismax-injected]", ...arguments);
  }

  const OriginalWebSocket = window.WebSocket;
  if (!OriginalWebSocket) {
    log("No WebSocket found on window; aborting patch");
    return;
  }

  // Engine.IO / Socket.IO packet constants
  const ENGINE_IO_OPEN = "0";
  const SOCKET_IO_PREFIX = "4";
  const SOCKET_IO_CONNECT = "0";
  const SOCKET_IO_EVENT = "2";

  function isPrismaXSocket(url) {
    try {
      const u = new URL(url, window.location.href);
      // Current tele-op backend:
      // wss://teleop.prismaxserver.com/socket.io/?EIO=4&transport=websocket
      return u.hostname === "teleop.prismaxserver.com";
    } catch {
      return false;
    }
  }

  function parseSocketMessage(data) {
    if (typeof data !== "string" || data.length < 2) return null;

    const first = data[0];
    const rest = data.slice(1);

    if (first === ENGINE_IO_OPEN) return null;
    if (first !== SOCKET_IO_PREFIX) return null;

    const packetType = rest[0];
    const payload = rest.slice(1);
    if (!payload) return null;

    try {
      if (packetType === SOCKET_IO_CONNECT) {
        const obj = JSON.parse(payload);
        if (!obj || typeof obj !== "object") return null;
        return { type: "connect", data: obj };
      }

      if (packetType === SOCKET_IO_EVENT) {
        const arr = JSON.parse(payload);
        if (!Array.isArray(arr) || arr.length < 2) return null;

        const eventName = arr[0];
        const eventData = arr[1];

        if (eventName === "queue_update" && eventData && typeof eventData === "object") {
          return { type: "queue_update", data: eventData };
        }

        return null;
      }
    } catch {
      return null;
    }

    return null;
  }

  class PrismaXWebSocket extends OriginalWebSocket {
    constructor(url, protocols) {
      log("New WebSocket created", url);
      super(url, protocols);

      let matches = false;
      try {
        matches = isPrismaXSocket(url);
      } catch (e) {
        log("Error in isPrismaXSocket", e);
      }
      log("WebSocket URL match check", { url, matches });

      if (!matches) {
        return;
      }

      log("Patched WebSocket created for prismaX socket", url);

      this.addEventListener("message", (event) => {
        const parsed = parseSocketMessage(event.data);
        if (!parsed) return;

        log("Socket message parsed", { type: parsed.type });

        window.postMessage(
          {
            source: "prismax-extension",
            type: parsed.type,   // "connect" or "queue_update"
            payload: parsed.data
          },
          "*"
        );
      });
    }
  }

  window.WebSocket = PrismaXWebSocket;
  log("WebSocket patched");
})();