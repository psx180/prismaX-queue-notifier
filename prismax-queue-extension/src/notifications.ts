// ---- Notification “plugin” interface ----

import {QueueEntry} from "./socketProtocol";
import {ExtensionOptions} from "./extensionOptions";

interface NotificationContext {
    robotId: string;
    me: QueueEntry;
    title: string;
    message: string;
    options: ExtensionOptions;
}

interface NotificationChannel {
    send(ctx: NotificationContext): Promise<void>;
}

const chromeChannel: NotificationChannel = {
    async send(ctx) {
        await new Promise<void>((resolve) => {
            chrome.notifications.create(
                {
                    type: "basic",
                    iconUrl: "icons/icon-128.png",
                    title: ctx.title,
                    message: ctx.message
                },
                () => resolve()
            );
        });
    }
};

const discordChannel: NotificationChannel = {
    async send(ctx) {
        const url = ctx.options.discordWebhookUrl;
        if (!url) return;

        try {
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: `**${ctx.title}**\n${ctx.message}\nStatus: ${ctx.me.status}`
                })
            });
        } catch (e){
            console.error("Error sending Discord notification", e);
        }
    }
};

const telegramChannel: NotificationChannel = {
    async send(ctx) {
        const cfg = ctx.options.telegramConfig;
        if (!cfg?.botToken || !cfg.chatId) return;

        const url = `https://api.telegram.org/bot${encodeURIComponent(
            cfg.botToken
        )}/sendMessage`;

        const text = `${ctx.title}\n${ctx.message}\nStatus: ${ctx.me.status}`;

        try {
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: cfg.chatId, text })
            });
        } catch (e){
            console.error("Error sending Telegram notification", e);
        }
    }
};

const notificationChannels: NotificationChannel[] = [
    chromeChannel,
    discordChannel,
    telegramChannel
    // todo: add more channels here
];

export async function sendNotifications(ctx: NotificationContext): Promise<void> {
    await Promise.all(notificationChannels.map(ch => ch.send(ctx)));
}
