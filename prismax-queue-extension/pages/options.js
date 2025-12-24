var _a;
document.addEventListener("DOMContentLoaded", restoreOptions);
(_a = document.getElementById("save")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", saveOptions);
function restoreOptions() {
    chrome.storage.sync.get({
        positionThreshold: 3,
        secondsThreshold: 60,
        soundEnabled: true,
        discordWebhookUrl: "",
        telegramConfig: { botToken: "", chatId: "" }
    }, function (items) {
        var _a, _b;
        document.getElementById("positionThreshold").value =
            String(items.positionThreshold);
        document.getElementById("secondsThreshold").value =
            String(items.secondsThreshold);
        document.getElementById("soundEnabled").checked =
            !!items.soundEnabled;
        document.getElementById("discordWebhookUrl").value =
            items.discordWebhookUrl || "";
        document.getElementById("telegramBotToken").value =
            ((_a = items.telegramConfig) === null || _a === void 0 ? void 0 : _a.botToken) || "";
        document.getElementById("telegramChatId").value =
            ((_b = items.telegramConfig) === null || _b === void 0 ? void 0 : _b.chatId) || "";
    });
}
function saveOptions() {
    var positionThreshold = parseInt(document.getElementById("positionThreshold").value, 10);
    var secondsThreshold = parseInt(document.getElementById("secondsThreshold").value, 10);
    var soundEnabled = document.getElementById("soundEnabled").checked;
    var discordWebhookUrl = document.getElementById("discordWebhookUrl").value.trim();
    var botToken = document.getElementById("telegramBotToken").value.trim();
    var chatId = document.getElementById("telegramChatId").value.trim();
    chrome.storage.sync.set({
        positionThreshold: positionThreshold,
        secondsThreshold: secondsThreshold,
        soundEnabled: soundEnabled,
        discordWebhookUrl: discordWebhookUrl,
        telegramConfig: { botToken: botToken, chatId: chatId }
    }, function () {
        var status = document.getElementById("status");
        if (status) {
            status.textContent = "Saved!";
            setTimeout(function () {
                status.textContent = "";
            }, 1500);
        }
    });
}
