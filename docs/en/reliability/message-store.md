# MessageStore: Anti Memory Leak & Tiered Storage

`MessageStore` is a tiered storage subsystem in Leaves Guardian that solves the classic out-of-memory (OOM) heap crash problem in 24/7 long-running WhatsApp bots.

---

## 🔍 Background: The In-Memory Store Dilemma

In traditional Baileys-based WhatsApp bots, message history is typically managed using `makeInMemoryStore`. This pattern stores every incoming and outgoing message object inside JavaScript Maps or arrays in RAM.

### Why In-Memory Message Stores Fail in Production
1. **Bulky Protobuf Payloads:** WhatsApp messages are complex nested Protobuf objects (`WebMessageInfo`) that bundle conversation metadata, quoting structures, mention lists, and raw binary media thumbnails.
2. **High Message Velocity in Active Groups:** A bot participating in 10 to 20 active groups regularly encounters 50,000 to 200,000 messages daily.
3. **Catastrophic Out-Of-Memory (OOM) Crashes:** Accumulating messages in RAM inflates the Node.js V8 heap from 100 MB to well over 1.5 GB. Once the heap limit is breached, the process crashes abruptly with `JavaScript heap out of memory`, or gets terminated by the operating system OOM killer on low-RAM VPS instances (512 MB to 1 GB RAM).

---

## 🏛️ Leaves Guardian Tiered Storage Architecture

Leaves Guardian eliminates memory leaks while maintaining fast access through a two-tiered architecture (*L1 Hot Cache + L2 Cold Storage*):

```
                     Incoming / Outgoing Message
                                  │
                                  ▼
                        MessageStore Engine
                         /              \
                        /                \
        [L1: Hot Cache (RAM)]       [L2: Cold Storage (Disk)]
      • Small LRU Cache (50-100)  • Sanitized partition files
      • RAM Footprint: ~2-5 MB    • Asynchronous non-blocking
      • Instant O(1) retrieval    • Automated retention (e.g. 3d)
                        \                /
                         \              /
                          ▼            ▼
                   getMessage(key) Lookup Flow:
                   1. Check L1 RAM (Hit -> Return)
                   2. If Miss -> Read L2 Disk -> Return
```

### Key Advantages
* **>95% RAM Reduction:** Active RAM consumption for message history drops from hundreds of megabytes to just 2-5 MB.
* **Resilient E2EE Retries:** Messages evicted from RAM remain safely stored on disk. When WhatsApp requests a decryption retry, `getMessage(key)` reads seamlessly from disk.
* **Buffer Sanitization:** Bulky binary media buffers are stripped prior to disk persistence, keeping individual file sizes negligible.
* **Automated Retention & Pruning:** Expired message files are automatically cleaned up in the background based on configurable retention limits.

---

## ⚙️ Configuration Options

Configure MessageStore through the `messages` block when instantiating `LeavesClient`:

```javascript
import { LeavesClient, MESSAGE_STORE_MODE } from 'leaves-guardian';

const client = new LeavesClient({
  auth: {
    directory: './session',
    method: 'pairing',
    phoneNumber: '628123456789'
  },
  messages: {
    // Storage mode: 'hybrid' (default), 'disk', 'memory', or 'none'
    mode: MESSAGE_STORE_MODE.HYBRID,

    // On-disk message storage path
    directory: './data/messages',

    // Max message items preserved in RAM L1 Cache
    maxMemoryItems: 100,

    // Retention window in days before disk files are pruned
    retentionDays: 3,

    // Background pruning timer interval (default: 1 hour)
    autoPruneIntervalMs: 3600000,

    // Strip bulky binary buffers before saving to disk
    sanitizeBuffers: true
  }
});
```

### Storage Modes (`MESSAGE_STORE_MODE`)

| Mode | L1 RAM Behavior | L2 Disk Behavior | Best For |
| :--- | :--- | :--- | :--- |
| `hybrid` (Default) | LRU Cache (50-100 items) | Persisted to disk | High-availability 24/7 production bots. |
| `disk` | 0 items (0 MB RAM) | Persisted to disk | Resource-constrained VPS with minimal RAM (e.g. 256 MB). |
| `memory` | Bounded FIFO (RAM only) | No disk I/O | Ephemeral containers or serverless testing. |
| `none` | Disabled | Disabled | Lightweight bots that do not require message history. |

---

## 💻 Practical Usage

### 1. Retrieving Stored Messages
`client.getMessage(key)` accepts standard Baileys key objects or canonical string identifiers:

```javascript
// Retrieve message by Baileys key object
const originalMsg = await client.getMessage({
  remoteJid: '628123456789@s.whatsapp.net',
  id: '3EB0ABC123XYZ'
});

if (originalMsg) {
  console.log('Original text:', originalMsg.conversation || originalMsg.extendedTextMessage?.text);
}
```

### 2. Manual RAM Eviction Under Pressure
Evict the L1 RAM cache on demand without affecting persistent disk files:

```javascript
// Instantly flush L1 RAM to zero items
const evicted = client.messageStore.evictMemory();
console.log(`Evicted ${evicted} messages from RAM.`);
```

### 3. Manual Pruning
```javascript
// Delete message files older than 24 hours (86,400,000 ms)
const deleted = await client.messageStore.prune(86400000);
console.log(`Pruned ${deleted} obsolete message files from disk.`);
```

---

## 🛡️ Seamless MemoryGuard Integration

Leaves Guardian automatically registers `MessageStore` with the `MemoryGuard` subsystem. 

Whenever process-level memory crosses critical alert thresholds, `MemoryGuard` automatically triggers the mitigation hook `messageStore.evictMemory()`. The L1 RAM cache drops to 0 MB instantly while the bot continues operating without interruption.
