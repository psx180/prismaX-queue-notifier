// options.ts
import {
    ExtensionOptions,
    DEFAULT_OPTIONS,
    loadOptions,
    //saveOptions,
} from "../src/extensionOptions";

// ... existing code ...

function restoreOptions() {
    loadOptions()
        .then((options) => {
            const effective: ExtensionOptions = options;

            // When to notify (only position threshold now)
            (document.getElementById("positionThreshold") as HTMLInputElement).value =
                String(effective.positionThreshold);

            // Chrome: sound + enabled
            (document.getElementById("soundEnabled") as HTMLInputElement).checked =
                !!effective.soundEnabled;
            (document.getElementById("chromeEnabled") as HTMLInputElement).checked =
                !!effective.chromeEnabled;

            // Discord
            (document.getElementById("discordEnabled") as HTMLInputElement).checked =
                !!effective.discordEnabled;
            (document.getElementById("discordWebhookUrl") as HTMLInputElement).value =
                effective.discordWebhookUrl || "";

            // Telegram
            (document.getElementById("telegramEnabled") as HTMLInputElement).checked =
                !!effective.telegramEnabled;
            (document.getElementById("telegramBotToken") as HTMLInputElement).value =
                effective.telegramConfig.botToken;
            (document.getElementById("telegramChatId") as HTMLInputElement).value =
                effective.telegramConfig.chatId;

            // Apply initial channel disabled styling
            applyChannelDisabledStyling();
        })
        .catch((err) => {
            console.error("Failed to load options:", err);

            // Fall back to defaults in the UI if something goes wrong.
            (document.getElementById("positionThreshold") as HTMLInputElement).value =
                String(DEFAULT_OPTIONS.positionThreshold);

            (document.getElementById("soundEnabled") as HTMLInputElement).checked =
                !!DEFAULT_OPTIONS.soundEnabled;

            (document.getElementById("chromeEnabled") as HTMLInputElement).checked =
                !!DEFAULT_OPTIONS.chromeEnabled;
            (document.getElementById("discordEnabled") as HTMLInputElement).checked =
                !!DEFAULT_OPTIONS.discordEnabled;
            (document.getElementById("telegramEnabled") as HTMLInputElement).checked =
                !!DEFAULT_OPTIONS.telegramEnabled;

            (document.getElementById("discordWebhookUrl") as HTMLInputElement).value =
                DEFAULT_OPTIONS.discordWebhookUrl || "";

            (document.getElementById("telegramBotToken") as HTMLInputElement).value =
                DEFAULT_OPTIONS.telegramConfig.botToken;
            (document.getElementById("telegramChatId") as HTMLInputElement).value =
                DEFAULT_OPTIONS.telegramConfig.chatId;

            applyChannelDisabledStyling();
        });
}


function saveOptions() {
    const positionThresholdInput = document.getElementById(
        "positionThreshold"
    ) as HTMLInputElement;
    const soundEnabledInput = document.getElementById(
        "soundEnabled"
    ) as HTMLInputElement;

    const chromeEnabledInput = document.getElementById(
        "chromeEnabled"
    ) as HTMLInputElement;
    const discordEnabledInput = document.getElementById(
        "discordEnabled"
    ) as HTMLInputElement;
    const telegramEnabledInput = document.getElementById(
        "telegramEnabled"
    ) as HTMLInputElement;

    const discordWebhookUrlInput = document.getElementById(
        "discordWebhookUrl"
    ) as HTMLInputElement;
    const telegramBotTokenInput = document.getElementById(
        "telegramBotToken"
    ) as HTMLInputElement;
    const telegramChatIdInput = document.getElementById(
        "telegramChatId"
    ) as HTMLInputElement;

    const positionThreshold =
        parseInt(positionThresholdInput.value, 10) ||
        DEFAULT_OPTIONS.positionThreshold;

    const soundEnabled = !!soundEnabledInput.checked;

    const chromeEnabled = !!chromeEnabledInput.checked;
    const discordEnabled = !!discordEnabledInput.checked;
    const telegramEnabled = !!telegramEnabledInput.checked;

    const discordWebhookUrl = (discordWebhookUrlInput.value || "").trim();
    const botToken = (telegramBotTokenInput.value || "").trim();
    const chatId = (telegramChatIdInput.value || "").trim();

    chrome.storage.sync.set(
        {
            positionThreshold,
            soundEnabled,
            chromeEnabled,
            discordEnabled,
            telegramEnabled,
            discordWebhookUrl,
            telegramConfig: { botToken, chatId },
        },
        () => {
            const status = document.getElementById("status");
            if (status) {
                status.textContent = "Saved!";
                setTimeout(() => {
                    status.textContent = "";
                }, 1500);
            }
        }
    );
}

function applyChannelDisabledStyling() {
    const chromeCard = document.getElementById("chromeCard");
    const discordCard = document.getElementById("discordCard");
    const telegramCard = document.getElementById("telegramCard");

    const chromeEnabled = (document.getElementById("chromeEnabled") as HTMLInputElement)
        .checked;
    const discordEnabled = (document.getElementById("discordEnabled") as HTMLInputElement)
        .checked;
    const telegramEnabled = (document.getElementById("telegramEnabled") as HTMLInputElement)
        .checked;

    if (chromeCard) {
        chromeCard.classList.toggle("channel-disabled", !chromeEnabled);
        // Disable all inputs inside the card except the main toggle
        toggleInputsDisabled(chromeCard, !chromeEnabled, ["chromeEnabled"]);
    }
    if (discordCard) {
        discordCard.classList.toggle("channel-disabled", !discordEnabled);
        // Disable all inputs inside the card except the main toggle
        toggleInputsDisabled(discordCard, !discordEnabled, ["discordEnabled"]);
    }
    if (telegramCard) {
        telegramCard.classList.toggle("channel-disabled", !telegramEnabled);
        // Disable all inputs inside the card except the main toggle
        toggleInputsDisabled(telegramCard, !telegramEnabled, ["telegramEnabled"]);
    }
}

function toggleInputsDisabled(
    container: HTMLElement,
    disabled: boolean,
    excludeIds: string[] = []
) {
    const selectors = ["input[type='text']", "input[type='number']", "input[type='checkbox']"];
    const inputs = container.querySelectorAll<HTMLInputElement>(selectors.join(","));

    inputs.forEach((input) => {
        if (excludeIds.includes(input.id)) {
            // Don't disable the channel's own enable checkbox
            return;
        }
        input.disabled = disabled;
    });
}


// Hook up events once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    restoreOptions();

    const saveButton = document.getElementById("save");
    saveButton?.addEventListener("click", () => {
        saveOptions();
    });

    // Re-apply styling when toggles change
    document.getElementById("chromeEnabled")?.addEventListener("change", applyChannelDisabledStyling);
    document.getElementById("discordEnabled")?.addEventListener("change", applyChannelDisabledStyling);
    document.getElementById("telegramEnabled")?.addEventListener("change", applyChannelDisabledStyling);
});

