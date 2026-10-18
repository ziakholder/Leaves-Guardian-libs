# A2UIMessage Builder

`A2UIMessage` constructs generative Agent-To-User Interface (A2UI) widget payloads based on the Meta Bloks / StarCore Widget protocol for WhatsApp Multi-Device.

It allows AI-driven bots and autonomous agents to assemble generative component trees (text, buttons, columns, cards, images, and choice pickers) rendered natively inside WhatsApp chat screens.

---

## The A2UI Concept

Unlike static text or standard buttons, A2UI registers interface components into an in-memory component map using unique IDs, then designates top-level elements using `.root([id1, id2, ...])`.

---

## Basic Example: Generative UI Form

```javascript
import { A2UIMessage } from 'leaves-guardian';

const a2ui = new A2UIMessage(client);

// 1. Register title text
const titleId = a2ui.text('🌿 Service Confirmation Form', { variant: 'title' });

// 2. Register banner image
const imgId = a2ui.image('https://example.com/cover.jpg', { fit: 'cover' });

// 3. Register body text
const descId = a2ui.text('Please confirm your cloud server configuration:', { variant: 'body' });

// 4. Register a choice picker
const pickerId = a2ui.choicePicker('Select VPS Tier:', [
  { id: 'vps_starter', label: 'Starter (1 vCPU, 2GB RAM)' },
  { id: 'vps_pro', label: 'Pro (2 vCPU, 4GB RAM)' }
], { displayStyle: 'checkbox' });

// 5. Register an action button
const btnTextId = a2ui.text('🚀 Confirm & Deploy');
const btnId = a2ui.button(btnTextId, { variant: 'primary', action: 'submit_order' });

// 6. Layout elements into a root column
const colId = a2ui.column([titleId, imgId, descId, pickerId, btnId]);

// 7. Set root
a2ui.root([colId]);

await client.sendMessage(msg.chat.id, a2ui);
```

---

## Quick Template: `listCard`

For tabular order receipts or quick transaction cards, `A2UIMessage` provides the `.listCard()` shortcut:

```javascript
const orderCard = new A2UIMessage(client)
  .listCard({
    title: '🧾 Cloud Invoice Details',
    fallbackText: 'Your monthly cloud invoice details',
    items: [
      { title: 'VPS Singapore SG-01', price: '$8.00', assetType: 'SERVICE' },
      { title: 'Dedicated IPv4 Address', price: '$2.50', assetType: 'ADDON' },
      { title: 'Automated Daily Snapshots', price: '$1.00', assetType: 'ADDON' }
    ]
  });

await client.sendMessage(msg.chat.id, orderCard);
```

---

## Component Reference

| Method | Description |
| :--- | :--- |
| `.text(text, opts)` | Registers a text component with variant (`'title'`, `'body'`, `'caption'`). |
| `.image(url, opts)` | Registers an image component with fit mode (`'cover'`, `'contain'`). |
| `.video(url, opts)` | Registers a video player component. |
| `.button(childId, opts)` | Registers a button component with styling and action payload. |
| `.card(childId, opts)` | Wraps a child component in an elevated card container. |
| `.column(childrenArray, opts)`| Arranges components vertically. |
| `.row(childrenArray, opts)` | Arranges components horizontally. |
| `.divider(opts)` | Inserts a visual divider line. |
| `.choicePicker(label, options, opts)` | Multi-option picker (`mutuallyExclusive` or multi-select). |
| `.textField(label, opts)` | Text input field component. |
| `.root(childrenArray)` | Specifies root component IDs for the rendered tree. |
| `.listCard(opts)` | Pre-packaged list receipt card shortcut. |

---

## Related Documentation

- **[AIRichMessage Builder](/en/builders/ai-rich-message)**: AI response structure builder.
- **[ButtonMessage Builder](/en/builders/button-message)**: Native flow button flows.
- **[CanvasMessage Builder](/en/builders/canvas-message)**: HTML canvas payload builder.
