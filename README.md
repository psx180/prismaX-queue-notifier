# PrismaX Queue Notifier

Chrome extension that sends notis when your turn is coming up for PrismaX teleop.

## Install

### Option 1 – Download prebuilt

1. Download the latest `prismax-queue-notifier.zip` from the [Releases](https://github.com/<you>/<repo>/releases) page.
2. Unzip it.
3. In Chrome, open `chrome://extensions/`.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the unzipped folder (the one containing `manifest.json`).

### Option 2 – Build from source

1. Clone this repo and install dependencies:

   ```bash
   git clone https://github.com/psx180/prismaX-queue-notifier.git
   cd ./prismaX-queue-notifier/prismax-queue-extension
   npm install
   npm run build
   ```

2. In Chrome, open `chrome://extensions/` → **Load unpacked** → select the `dist/` folder.

## Usage

1. Make sure the extension is **enabled** in Chrome.
2. Open a PrismaX tele‑op page for any arm and join the queue. Don't close the tab.
3. The extension tracks your position and sends notifications when you get close to the front.

### Options

Open the extension’s options page to configure:

- **Position threshold** – notify at this queue position
  (1 = current active user, 2 = next in line, 3 = third, etc.).
- **Notification channels**:
  - **Chrome notification**
  - **Discord** (via webhook URL)
  - **Telegram** (via bot token + chat ID)

You can enable multiple channels at once.

## Permissions

- **Debugger** – to read prismaX WebSocket traffic and detect queue updates.
- **Tabs / host permissions** – to attach only to prismaX tabs.
- **Notifications** – to show desktop notifications.
- **Storage** – to save your options (threshold, Discord/Telegram settings, etc.).

No data is sent anywhere except to the notification channels you configure.
