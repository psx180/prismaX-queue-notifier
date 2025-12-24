
import { z } from "zod";

const telegramConfigSchema = z.object({
  botToken: z.string().optional().default(""),
  chatId: z.string().optional().default(""),
});

const extensionOptionsSchema = z.object({
  enabled: z.boolean().default(true),
  positionThreshold: z.number().int().min(1).default(3),
  soundEnabled: z.boolean().default(true),

  chromeEnabled: z.boolean().default(true),
  discordEnabled: z.boolean().default(false),
  telegramEnabled: z.boolean().default(false),

  discordWebhookUrl: z.string().optional().default(""),
  telegramConfig: telegramConfigSchema.optional()//default({}),
});

// Inferred TS types:
export type TelegramConfig = z.infer<typeof telegramConfigSchema>;
export type ExtensionOptions = z.infer<typeof extensionOptionsSchema>;

// Defaults derived from the schema:
export const DEFAULT_OPTIONS: ExtensionOptions =
  extensionOptionsSchema.parse({});

// Simple normalize using Zod:
export function normalizeOptions(
  raw: unknown,
): ExtensionOptions {
  // safeParse avoids throwing if storage is badly corrupted
  const result = extensionOptionsSchema.safeParse(raw);
  if (result.success) return result.data;
  // fallback: defaults
  return DEFAULT_OPTIONS;
}

export async function loadOptions(): Promise<ExtensionOptions> {
  const raw = await new Promise<unknown>((resolve) => {
    chrome.storage.sync.get(
      DEFAULT_OPTIONS as unknown as { [key: string]: unknown },
      (items) => resolve(items),
    );
  });

  return normalizeOptions(raw);
}

export async function saveOptions(
  options: ExtensionOptions,
): Promise<void> {
  const normalized = extensionOptionsSchema.parse(options);
  await new Promise<void>((resolve, reject) => {
    chrome.storage.sync.set(
      normalized as unknown as { [key: string]: unknown },
      () => {
        const err = chrome.runtime.lastError;
        if (err) reject(err);
        else resolve();
      },
    );
  });
}