# GroupCache: Group Metadata Caching & Real-Time Sync

`GroupCache` is a reliability subsystem in Leaves Guardian that delivers high-performance group metadata management, transparent caching with singleflight request coalescing, and event-driven real-time synchronization.

---

## 🔍 The Group Metadata Dilemma in WhatsApp Bots

In conventional Baileys-based WhatsApp bots, every group command (such as `.kick`, `.hidetag`, or `.adminonly`) routinely executes:

```javascript
const metadata = await sock.groupMetadata(msg.chat.id);
```

### Why Naive Group Metadata Calls Fail in Production
1. **WhatsApp IQ Rate Limits (Error 429):** WhatsApp aggressively throttles IQ stanzas for group metadata queries. High command concurrency triggers immediate rate limits.
2. **Elevated Network Latency:** Each round-trip to WhatsApp servers takes between 300ms and 2000ms, making bot interaction feel unresponsive.
3. **Complex Admin Identity Resolution:** Modern WhatsApp message identities vary widely: standard phone numbers (`628xxx@s.whatsapp.net`), device-suffixed identities (`628xxx:12@s.whatsapp.net`), and Linked Identities (`@lid`). Matching admin status reliably requires cumbersome boilerplate.
4. **Stale Static Caches:** Simple manual caches fail to track member mutations. When participants join, leave, or receive admin rights, a basic cache remains outdated until bot restart or key expiration.

---

## 🏛️ Leaves Guardian Integrated GroupCache Architecture

Leaves Guardian resolves these challenges through an active, event-synchronized cache architecture:

```
                     Incoming Command (.kick / .tagall)
                                     │
                                     ▼
                         client.groupMetadata(jid)
                                     │
                       ┌─────────────┴─────────────┐
                       ▼                           ▼
              Cache Hit (Valid TTL)        Cache Miss / Expired
                       │                           │
                       │                    Singleflight Coalescing
                       │                           │
                       │                     1 Network Request
                       │                           │
                       │                           ▼
                       └──────────────┬────────────┘
                                      │
                                      ▼
                           Ready-to-Use Metadata
```

### Core Capabilities
* **Singleflight Request Coalescing:** If multiple commands for the same group arrive within the same execution window, GroupCache merges them into a single network call. All callers share the same Promise.
* **Real-Time Event Synchronization:** GroupCache listens directly to `groups.update` and `group-participants.update` socket events. Member additions, removals, promotions, and demotions mutate the local cache in place without requiring network queries.
* **Intelligent Identity Matching:** Admin checks automatically resolve raw phone digits, device-suffixed JIDs, and LID representations.
* **Bounded Memory Footprint:** Cache size is capped (default: 250 groups) and integrates with `MemoryGuard` to evict entries automatically during memory pressure events.

---

## ⚙️ Configuration Options

GroupCache is active by default in `LeavesClient`. Configure its parameters via the `groupCache` (or `groups`) option:

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  groupCache: {
    ttlMs: 5 * 60 * 1000, // Cache expiration time (default: 5 minutes)
    maxGroups: 250        // Maximum number of groups stored in memory (default: 250)
  }
});
```

---

## 💻 API Reference & Methods

LeavesClient exposes top-level helper methods for immediate use:

### 1. Fetching Group Metadata
Retrieve group metadata with automatic cache management:

```javascript
// Retrieve from cache (or fetch if missing / expired)
const metadata = await client.groupMetadata('123456789-987654@g.us');
console.log(`Group Subject: ${metadata.subject}`);
console.log(`Participant Count: ${metadata.participants.length}`);

// Force refresh from WhatsApp network (bypasses cache)
const fresh = await client.groupMetadata('123456789-987654@g.us', true);
```

### 2. Checking Group Admin Status
Determine if a specific user holds admin or superadmin privileges:

```javascript
const isAdmin = await client.isGroupAdmin(msg.chat.id, msg.sender.id);
if (!isAdmin) {
  return client.sendText(msg.chat.id, '❌ This command is restricted to group admins.');
}
```

### 3. Checking Bot Admin Privileges
Verify whether the bot holds administrative rights without writing custom identity matching logic:

```javascript
const isBotAdmin = await client.isBotAdmin(msg.chat.id);
if (!isBotAdmin) {
  return client.sendText(msg.chat.id, '⚠️ The bot must be promoted to admin to execute this action.');
}
```

### 4. Retrieving Group Admins
Retrieve a clean array of normalized JIDs for all admins and superadmins:

```javascript
const admins = await client.getGroupAdmins(msg.chat.id);
// Output: ['628123456789@s.whatsapp.net', '628987654321@s.whatsapp.net']
```

### 5. Retrieving Group Participants
Retrieve an array of all participant JIDs in the group:

```javascript
const participants = await client.getGroupParticipants(msg.chat.id);
```

---

## 🛡️ Production Example: Kick & Tag All Commands

Here is a clean implementation of group moderation commands using GroupCache:

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient();

client.on('message', async (msg) => {
  if (!msg.chat.isGroup) return;

  const [cmd] = (msg.text || '').trim().split(/\s+/);

  // .tagall command
  if (cmd === '.tagall') {
    const isSenderAdmin = await client.isGroupAdmin(msg.chat.id, msg.sender.id);
    if (!isSenderAdmin) {
      return client.sendText(msg.chat.id, 'Only admins may mention all members.');
    }

    const participants = await client.getGroupParticipants(msg.chat.id);
    let messageText = '📢 Attention Everyone:\n\n';
    for (const jid of participants) {
      messageText += `@${jid.split('@')[0]}\n`;
    }

    return client.sendMessage(msg.chat.id, {
      text: messageText,
      mentions: participants
    });
  }

  // .kick command
  if (cmd === '.kick') {
    const isSenderAdmin = await client.isGroupAdmin(msg.chat.id, msg.sender.id);
    if (!isSenderAdmin) {
      return client.sendText(msg.chat.id, 'You must be a group admin.');
    }

    const isBotAdmin = await client.isBotAdmin(msg.chat.id);
    if (!isBotAdmin) {
      return client.sendText(msg.chat.id, 'Bot requires admin permissions to remove members.');
    }

    const target = msg.quoted?.sender?.id || msg.mentions?.[0];
    if (!target) {
      return client.sendText(msg.chat.id, 'Reply to a message or mention a member to remove.');
    }

    const sock = client.getRawSocket();
    await sock.groupParticipantsUpdate(msg.chat.id, [target], 'remove');
    // GroupCache updates its local member roster immediately!
    return client.sendText(msg.chat.id, 'Member successfully removed.');
  }
});
```

---

## 📊 Direct Instance Interaction

Direct access to the underlying cache instance is readily available:

```javascript
// Access underlying cache instance
const cache = client.groupCache; // or client.groups

// Check if metadata exists in memory and is active
const isCached = cache.hasMetadata(groupJid);

// Retrieve all actively cached group metadata
const allGroups = client.getAllCachedGroupMetadata();

// Clear cache entries
cache.clear();
```
