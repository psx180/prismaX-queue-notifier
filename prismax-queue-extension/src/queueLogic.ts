import {QueueEntry, QueueUpdatePayload} from "./socketProtocol";
import {ExtensionOptions, loadOptions} from "./extensionOptions";
import {sendNotifications} from "./notifications";

interface UserState {
    userId?: string;
    // Last position we saw this user at.
    lastPosition?: number;
    // Position when we last sent a notification (used to avoid spamming).
    lastNotifiedPosition?: number;
}

const userStateByRobot: Record<string, UserState> = {};
const lastQueueByRobot: Record<string, QueueUpdatePayload> = {};

export function handleConnect(payload: any) {
    const { robotId, userId } = payload as { robotId?: string; userId?: string };
    if (!robotId || !userId) return;

    const state = (userStateByRobot[robotId] ||= {});
    state.userId = userId;

    console.info("Handled connect", { robotId, userId });
}

export async function handleQueueUpdate(payload: any) {
    const { robotId, queue } = payload as QueueUpdatePayload;
    if (!robotId || !Array.isArray(queue)) return;

    lastQueueByRobot[robotId] = payload;

    const state = userStateByRobot[robotId];
    if (!state?.userId) {
        console.debug("Queue update but no known userId yet", { robotId });
        return;
    }

    const me = queue.find((q) => q.user_id === state.userId);
    if (!me) {
        console.debug("User not found in queue", { robotId, userId: state.userId });
        // User left the queue (or finished a turn). Reset state so the next
        // approach to the front can trigger fresh notifications.
        state.lastPosition = undefined;
        state.lastNotifiedPosition = undefined;
        return;
    }

    console.info("Queue update for user", {
        robotId,
        userId: state.userId,
        position: me.position
    });

    const options = await loadOptions();
    await evaluateAndNotify(robotId, me, options, state);
}

async function evaluateAndNotify(
    robotId: string,
    me: QueueEntry,
    options: ExtensionOptions,
    state: UserState
) {
    if (!options.enabled) {
        console.debug("Extension disabled in options; skipping notification", { robotId });
        return;
    }

    const position = me.position;

    if (typeof position !== "number" || position <= 0) {
        console.debug("No notification: invalid or non-positive position", {
            robotId,
            position
        });
        return;
    }

    const prevPosition = state.lastPosition ?? Infinity;
    state.lastPosition = position;

    const withinThreshold = position > 0 && position <= options.positionThreshold;

    if (!withinThreshold) {
        console.debug("No notification: outside position threshold", {
            robotId,
            position,
            positionThreshold: options.positionThreshold
        });
        return;
    }

    //  "way back" logic for treating it as a new turn

    const hasEverNotified = typeof state.lastNotifiedPosition === "number";

    // How far back is considered "definitely a different turn"?
    const RESET_MULTIPLIER = 5;
    const farBackCutoff = options.positionThreshold * RESET_MULTIPLIER;

    const wasFarBack = typeof prevPosition === "number" && prevPosition > farBackCutoff;

    const shouldNotify =
        !hasEverNotified    // first time ever entering threshold
        || wasFarBack;      // re-entering after being pushed way back

    if (!shouldNotify) {
        console.debug("No notification: already notified for this approach and not far-back reset", {
            robotId,
            position,
            prevPosition,
            lastNotifiedPosition: state.lastNotifiedPosition,
            positionThreshold: options.positionThreshold,
            farBackCutoff
        });
        return;
    }

    state.lastNotifiedPosition = position;

    const parts: string[] = [];
    parts.push(`Position: ${position}`);

    const title = `prismaX - almost your turn on ${robotId}`;
    const message = parts.join(" • ") || "Your turn is coming up";

    const ctx = { robotId, me, title, message, options };

    console.info("Sending notifications", {
        robotId,
        userId: me.user_id,
        position
    });

    await sendNotifications(ctx);
}
