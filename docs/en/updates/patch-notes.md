# Leaves Guardian Patch Notes

Release history and technical updates for Leaves Guardian.

---

## 🚀 Version 0.3.6: GroupCache (Group Metadata Caching & Real-Time Sync)

Reliability and performance update for WhatsApp group management to eliminate repetitive `sock.groupMetadata()` calls, IQ 429 rate limit errors, excessive network latency, and complex admin permission checks.

### 1. Problems Resolved
* **WhatsApp IQ Rate Limits (Error 429):** Rapid successive `sock.groupMetadata()` calls in high-traffic groups trigger temporary WhatsApp query blocks.
* **Elevated Group Command Latency:** Bot response delays (300ms - 2000ms) caused by redundant network queries on every group command invocation.
* **Cumbersome Admin Identity Resolution:** Varied JID formats (plain phone numbers, device suffixes, and LIDs) complicate admin authorization checks.
* **Silent Cache Stale State:** Naive bot caches fail to reflect member joins, leaves, or admin role promotions until process restart.

### 2. Features & Improvements
* **GroupCache Bounded In-Memory Store:** Group metadata cache with configurable TTL (default 5 minutes) and capacity bounds (default 250 groups).
* **Singleflight Request Coalescing:** Concurrent metadata requests for the same group coalesce into exactly one network call.
* **Real-Time Event Synchronization:** Automatically processes socket events `groups.update` and `group-participants.update` (`add`, `remove`, `promote`, `demote`) to update in-memory rosters immediately.
* **Client Helper Convenience Methods:**
  * `client.groupMetadata(jid, forceRefresh)`
  * `client.isGroupAdmin(groupJid, userJid)`
  * `client.isBotAdmin(groupJid)`
  * `client.getGroupAdmins(groupJid)`
  * `client.getGroupParticipants(groupJid)`
  * `client.getAllCachedGroupMetadata()`
* **MemoryGuard Integration:** Registers the mitigation hook `groupCache.clear` to clear cache entries under critical memory pressure.

---

## 🚀 Version 0.3.5: Tiered MessageStore & Anti Memory Leak

Architectural message storage update addressing the classic in-memory heap bloat (*out-of-memory crashes*) on 24/7 long-running WhatsApp bots in active groups.

### 1. Problems Resolved
* Memory leaks caused by traditional in-memory stores hoarding hundreds of thousands of messages in RAM.
* Process crashes (`JavaScript heap out of memory`) on long runtimes in resource-constrained VPS environments.
* Dropped E2EE retry handshakes (`getMessage`) when evicted messages were lost from memory.

### 2. Features & Improvements
* **Tiered Storage (L1 RAM + L2 Disk):** Restricts L1 RAM cache to 50-100 active messages (~2-5 MB RAM, >95% savings), while complete history is asynchronously persisted to disk.
* **Automated `getMessage(key)` Fallback:** Lookups check L1 RAM first; if missed, seamlessly reads from L2 Disk for Baileys E2EE retry handshakes.
* **Binary Buffer Sanitization:** Cleans large binary media buffers prior to disk persistence, maintaining minimal storage footprints.
* **Auto-Pruning:** Background timers automatically delete message files older than the retention threshold (default 3 days).
* **MemoryGuard Integration:** Registers the mitigation hook `messageStore.evictMemory()` to automatically clear L1 RAM to zero under critical process memory pressure.

---

## 🛡️ Version 0.3.4: Native Flow & Silent Drop Fix

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

