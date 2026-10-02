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

### 2. Standalone Direct Relay via `builder.send(targetJid)`
Leaves Guardian's builder `.send()` pipeline directly handles `generateWAMessageFromContent` and `relayMessage` with required `biz/interactive` nodes.

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

## 📊 Compatibility Matrix

| Message Type | WhatsApp Android | WhatsApp iOS | WhatsApp Web |
|---|---|---|---|
| **`ListMessage` (Single Select)** | 🟢 100% Rendered | 🟢 100% Rendered | 🟢 100% Rendered |
| **`ButtonMessage` (Quick Reply)** | 🟢 100% Rendered | 🟢 100% Rendered | 🟢 100% Rendered |
| **`CarouselMessage` (Card Slider)** | 🟢 100% Rendered | 🟢 100% Rendered | 🟢 100% Rendered |
| **`TextMessage`** | 🟢 100% Rendered | 🟢 100% Rendered | 🟢 100% Rendered |
