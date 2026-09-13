# Handling Interactive Responses

When users interact with messages sent via **`ButtonMessage`**, **`ListMessage`**, **`CarouselMessage`**, or **`PollMessage`**, WhatsApp delivers their selections back to your bot through standard incoming message events.

Leaves Guardian normalizes these events into categorized types while preserving the raw Baileys structures under `msg.raw` for detailed payload inspection.

---

## 1. Handling Button Clicks (`ButtonMessage` & `CarouselMessage`)

When a user taps a quick reply button, the incoming message is normalized with **`msg.type === 'BUTTON'`**:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'BUTTON') {
    let buttonId = null;

    // Try parsing native flow JSON payload (e.g. {"id": "btn_checkout_yes"})
    try {
      const parsed = JSON.parse(msg.text);
      buttonId = parsed.id || parsed.selectedId;
    } catch (_) {
      // Fallback to display text if not a JSON payload
      buttonId = msg.text;
    }

    console.log(`User clicked button with ID / Text: ${buttonId}`);

    // Route button actions
    if (buttonId === 'btn_checkout_yes') {
      await client.sendText(msg.chat.id, '✅ Processing your checkout...');
    } else if (buttonId === 'btn_cancel') {
      await client.sendText(msg.chat.id, '❌ Order cancelled.');
    }
  }
});
```

---

## 2. Handling List Menu Selections (`ListMessage`)

When a user selects an item from a list menu, Leaves Guardian emits a normalized message with **`msg.type === 'LIST'`**:

- **`msg.text`**: Contains the human-readable title of the chosen row.
- **`msg.raw` (Escape Hatch)**: Contains the full Baileys response object, allowing you to extract the exact machine-readable `selectedRowId`.

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'LIST') {
    const rowTitle = msg.text;

    // Extract exact selectedRowId from Baileys raw envelope
    const selectedRowId =
      msg.raw?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.raw?.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;

    console.log(`Selected Row Title: ${rowTitle}`);
    console.log(`Selected Row ID: ${selectedRowId}`);

    if (selectedRowId === 'menu_latte') {
      await client.sendText(msg.chat.id, '☕ One Vanilla Latte added to your order!');
    }
  }
});
```

---

## 3. Handling Poll Votes (`PollMessage`)

When users cast votes on polls, WhatsApp delivers poll update stanzas.

Leaves Guardian exposes the normalized poll representation under `msg.type === 'POLL'`:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'POLL') {
    console.log(`Poll question: ${msg.text}`);
    
    // Detailed poll vote updates can be inspected via msg.raw
    if (msg.raw?.message?.pollUpdateMessage) {
      console.log('Poll update received:', msg.raw.message.pollUpdateMessage);
    }
  }
});
```

---

## Summary of Normalized Interactive Types

| Interactive Element | `msg.type` | Primary Field (`msg.text`) | Raw Escape Hatch (`msg.raw`) |
| :--- | :--- | :--- | :--- |
| **Quick Reply Button** | `'BUTTON'` | Display text or JSON `{"id": "..."}` | `raw.message.interactiveResponseMessage` |
| **List Menu Row** | `'LIST'` | Selected row title | `raw.message.listResponseMessage.singleSelectReply.selectedRowId` |
| **Poll Creation / Vote** | `'POLL'` | Poll title or inquiry | `raw.message.pollCreationMessage` / `pollUpdateMessage` |

---

## Related Documentation

- **[ButtonMessage Builder](/en/builders/button-message)**: Building interactive button payloads.
- **[ListMessage Builder](/en/builders/list-message)**: Building menu lists.
- **[Normalized Message Schema](/en/messaging/schema)**: Understanding the normalized `Message` contract.
