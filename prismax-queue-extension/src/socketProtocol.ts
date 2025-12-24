import { z } from "zod";

const connectPayloadSchema = z.object({
    robotId: z.string(),
    token: z.string(),
    userId: z.string(),
});

const queueEntrySchema = z.object({
    user_id: z.string(),
    position: z.number().int(),
    status: z.string(),
    remaining_time: z.number().int().nullable(),
    username: z.string().nullable(),
    email: z.string().nullable(),
    wallet_address: z.string().nullable(),
    member_class: z.string().nullable(),
});

const queueUpdatePayloadSchema = z.object({
    robotId: z.string(),
    queue: z.array(queueEntrySchema),
});

export type ConnectPayload = z.infer<typeof connectPayloadSchema>;
export type QueueUpdatePayload = z.infer<typeof queueUpdatePayloadSchema>;
export type QueueEntry = z.infer<typeof queueEntrySchema>;


// Minimal Socket.IO/Engine.IO parser for raw WS frame payloads
export type ParsedSocketEvent =
    | { type: "connect"; data: ConnectPayload }
    | { type: "queue_update"; data: QueueUpdatePayload }
    | null;


export function parseSocketIoFrame(frameData: string): ParsedSocketEvent {
    // Messages look like: 0{...}, 40{...}, 42["event", {...}]
    if (typeof frameData !== "string" || frameData.length < 2) return null;

    const first = frameData[0];
    const rest = frameData.slice(1);

    // Engine.IO open frame: 0{"sid": ...} -> ignore
    if (first === "0") return null;

    // We only care about Socket.IO packets (prefixed with "4")
    if (first !== "4") return null;

    const packetType = rest[0];
    const payload = rest.slice(1);
    if (!payload) return null;

    if (packetType === "0") {
        const obj = JSON.parse(payload);
        const parsed = connectPayloadSchema.safeParse(obj);
        if (!parsed.success) return null;
        return { type: "connect", data: parsed.data };
    }

    if (packetType === "2") {
        const arr = JSON.parse(payload);
        if (!Array.isArray(arr) || arr.length < 2) return null;

        const eventName = arr[0];
        const eventData = arr[1];

        if (eventName === "queue_update") {
            const parsed = queueUpdatePayloadSchema.safeParse(eventData);
            if (!parsed.success) return null;
            return { type: "queue_update", data: parsed.data };
        }

        if (eventName === "connection_success") {
            const parsed = connectPayloadSchema.safeParse(eventData);
            if (!parsed.success) return null;
            return { type: "connect", data: parsed.data };
        }
    }

    return null;
}
