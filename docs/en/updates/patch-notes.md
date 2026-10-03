# Patch Notes: Native Flow Interactive Messages & Silent Drop Fix

This document details the critical technical patch addressing the **WhatsApp Multi-Device Native Flow Silent Drop** issue where interactive messages (*List Menus, Quick Reply Buttons, and Carousels*) **appeared in the bot sender outbox but were completely invisible on recipient devices**.

---

## 🔍 Problem Analysis: The "Silent Drop" Symptom

### Symptoms Encountered:
1. The bot successfully executes a command (e.g. `.menu`), and the console outputs `[REPLY_SENT]`.
2. The interactive list menu or buttons are **clearly visible in the WhatsApp chat on the bot sender's phone**.
3. However, on the recipient's phone (primary user), **no message bubble appears at all** with zero error notifications.

---

## 🧠 Root Cause

### 1. WhatsApp Multi-Device E2EE & Missing `messageContextInfo`
The sender device renders messages directly from local memory buffers upon creation. The recipient device, however, receives an E2EE decrypted payload from the WhatsApp server and strictly validates its protobuf structure against WhatsApp Multi-Device protocol standards.

Modern WhatsApp clients **require** every `InteractiveMessage` to include a **`messageContextInfo`** node with `deviceListMetadataVersion: 2`. When this node is omitted, the recipient WhatsApp client treats the message as an unauthorized or malformed protocol buffer and **silently drops the payload**.

### 2. Passing Builder Instances to Generic `ctx.reply()`
Standard bot frameworks' `ctx.reply()` helper usually expects a plain string or standard Baileys object. Passing an active class instance into `ctx.reply()` causes Baileys to send an un-relayed raw object.

### 3. Non-Buffer Local Media Paths
Providing a local filesystem string path (e.g. `'./assets/banner.jpg'`) to `.setImage()` causes Baileys to treat it as an external HTTP URL, resulting in media preparation failure.

---

## ⚡ Solution & Patch Details

### 1. Automatic `messageContextInfo` Injection in Builders
Leaves Guardian now automatically injects Device List Metadata v2 into all interactive builders (`ListMessage`, `ButtonMessage`, `CarouselMessage`):

```javascript
viewOnceMessage: {
  message: {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
    },
    interactiveMessage: {
      header: { ... },
      body: { text: '...' },
      nativeFlowMessage: { ... }
    }
  }
}
```

### 2. Binary Node Injection (`biz` & `bot biz_bot="1"`)
WhatsApp enforces strict validation for 1:1 private chats. When interactive messages originate from non-official numbers without bot tagging, the recipient client silently discards them.
Leaves Guardian now automatically constructs dynamic binary stanzas:
- **Private Chats (1:1 / PC):** Appends `<biz><interactive ... /></biz>` along with `<bot biz_bot="1" />`.
- **Group Chats:** Appends `<biz><interactive ... /></biz>`.

### 3. Socket Hook `patchMessageBeforeSending`
Inside `ConnectionManager`, Leaves Guardian registers the `patchMessageBeforeSending` hook on the Baileys socket to guarantee all interactive message types are wrapped with `deviceListMetadataVersion: 2` before Signal E2EE encryption.

### 4. Standalone Direct Relay via `builder.send(targetJid)`
Leaves Guardian's builder `.send()` pipeline directly handles `generateWAMessageFromContent` and `relayMessage` with appropriate binary nodes.

---

## 🛠️ Developer Migration Guide

### ❌ Problematic Pattern:
```javascript
// DO NOT pass local string paths or rely on untyped ctx.reply()
const list = new ListMessage(client)
  .setImage('./assets/banner.jpg')
  .setTitle('Menu')
  .addSection('Category', [...]);

return await ctx.reply(list);
```

### ✅ Recommended Pattern:
```javascript
import fs from 'node:fs';
import path from 'node:path';
import { ListMessage } from 'leaves-guardian';

// 1. Read local banner image into a pure Buffer
const bannerBuffer = fs.readFileSync(path.resolve('./assets/banner.jpg'));

// 2. Build ListMessage
const list = new ListMessage(client)
  .setImage(bannerBuffer)
  .setTitle('Main Menu')
  .setBody('Please select a service below:')
  .setButtonText('📑 Open Menu')
  .addSection('Services', [
    { id: '.ping', title: 'Ping', description: 'Check bot latency' }
  ]);

// 3. Send directly via .send()
await list.send(targetJid);
```

---

## 🚀 Update v0.3.1: Single Tick Delivery Fix, TC-Token LID, & Signal PreKey Retries
 
Update v0.3.1 solves the critical delivery issue where messages remained stuck on **Single Tick (Centang 1)** when sent to strangers or newly migrated numbers:

### 1. JID `@lid` & TC-Token (`tctoken-xxx@lid.json`) Preservation
- **Problem:** In WhatsApp 2025/2026, 1-on-1 private messages arrive as `@lid` format (e.g. `35120501268714:0@lid`). Force-converting this to `@s.whatsapp.net` causes Baileys to omit the Trusted Contact Token (`tctoken`), prompting WhatsApp server to reject delivery with Error **463 (NackCallerReachoutTimelocked)**.
- **Leaves Guardian Fix:** `LeavesClient` sanitization now strips only the device index (`:0`, `:49` using `/:\d+@/gi`), preserving the `@lid` domain intact so security tokens are properly attached.

### 2. Signal PreKey Retry Handshake (`msgRetryCounterCache` & `getMessage`)
- **Problem:** When a recipient changes devices or re-keys E2EE sessions, WhatsApp requests a message key retry. Without a cache handler, Baileys ignores the retry and the message hangs in *Waiting for this message* / single tick.
- **Leaves Guardian Fix:** `ConnectionManager` now embeds `MemoryRetryCache` (5-minute TTL) and automatic `getMessage` resolution from `rawMessageHistory`.

### 3. Human Emulation & Anti-Ban Protection
- Sockets default to `Browsers.macOS('Safari')`, `generateHighQualityLinkPreview: false`, and support read receipt auto-simulation (`readMessages`) and natural presence composing.

---

## 📊 Compatibility Matrix

| Message Type | WhatsApp Android | WhatsApp iOS | WhatsApp Web |
|---|---|---|---|
| **`ListMessage` (Single Select)** | 🟢 100% Rendered | 🟢 100% Rendered | 🟢 100% Rendered |
| **`ButtonMessage` (Quick Reply)** | 🟢 100% Rendered | 🟢 100% Rendered | 🟢 100% Rendered |
| **`CarouselMessage` (Card Slider)** | 🟢 100% Rendered | 🟢 100% Rendered | 🟢 100% Rendered |
| **`TextMessage`** | 🟢 100% Rendered | 🟢 100% Rendered | 🟢 100% Rendered |

