# Interactive Paginator

`Paginator` is an interactive multi-page navigation utility (Layer 4.3) for presenting long lists, catalogs, or search results in WhatsApp without spamming the chat.

It allows users to paginate through items interactively using text keywords (e.g., `next`, `prev`, `1`, `2`) or interactive button clicks.

---

## Basic Paginator Example

```javascript
import { Paginator } from 'leaves-guardian';

const items = [
  'Item 1: Premium Coffee',
  'Item 2: Green Tea Matcha',
  'Item 3: Dark Chocolate Croissant',
  'Item 4: Sourdough Bread',
  'Item 5: Vanilla Latte',
  'Item 6: Espresso Roast',
  'Item 7: Blueberry Muffin',
  'Item 8: Earl Grey Tea'
];

client.on('message', async (msg) => {
  if (msg.text === '!menu') {
    const paginator = new Paginator(client, {
      items,
      itemsPerPage: 3,
      timeout: 60000, // Inactivity timeout in ms
      pageRenderer: async (pageItems, pageInfo) => {
        return `
📜 *Product Catalog* (Page ${pageInfo.currentPage}/${pageInfo.totalPages})
---------------------------------------
${pageItems.map((item, idx) => `${pageInfo.startIndex + idx + 1}. ${item}`).join('\n')}
---------------------------------------
💡 *Navigasi*: Balas \`next\` / \`prev\` atau nomor halaman.
        `.trim();
      }
    });

    // Start pagination in this conversation
    await paginator.start(msg.chat.id, msg.sender.id);
  }
});
```

---

## Paginator Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `Array` | `[]` | The full array of data items to paginate. |
| `itemsPerPage` | `number` | `5` | Number of items displayed per page. |
| `timeout` | `number` | `60000` | Inactivity duration in ms before the paginator automatically closes. |
| `pageRenderer` | `Function` | `Default` | Function `async (pageItems, pageInfo, context) => string \| Builder` generating the page output. |

### The `pageInfo` Object

The `pageRenderer` callback receives `pageInfo` containing:
- `pageInfo.currentPage`: Current 1-based page number.
- `pageInfo.totalPages`: Total calculated pages.
- `pageInfo.totalItems`: Total number of items.
- `pageInfo.startIndex`: Zero-based index of the first item on this page.
- `pageInfo.endIndex`: Zero-based index of the last item on this page.
- `pageInfo.hasNext`: Boolean flag whether a next page exists.
- `pageInfo.hasPrev`: Boolean flag whether a previous page exists.

---

## Navigation Actions (`PAGINATOR_ACTIONS`)

The paginator automatically recognizes navigation triggers from both plain text responses and interactive button payloads:

| Action | Recognized Text Commands & Button Payloads |
| :--- | :--- |
| `PAGINATOR_ACTIONS.NEXT` | `next`, `n`, `>`, `▶`, `selanjutnya`, `lanjut`, `pag_next` |
| `PAGINATOR_ACTIONS.PREV` | `prev`, `p`, `<`, `◀`, `sebelumnya`, `kembali`, `pag_prev` |
| `PAGINATOR_ACTIONS.FIRST` | `first`, `<<`, `⏮`, `awal`, `pertama`, `pag_first` |
| `PAGINATOR_ACTIONS.LAST` | `last`, `>>`, `⏭`, `akhir`, `terakhir`, `pag_last` |
| `PAGINATOR_ACTIONS.JUMP` | Entering any direct page number (e.g., `1`, `2`, `3`) |
| `PAGINATOR_ACTIONS.STOP` | `stop`, `close`, `tutup`, `x`, `⏹`, `batal`, `exit`, `selesai`, `pag_stop` |

---

## Paginator Lifecycle States (`PAGINATOR_STATES`)

| State | Description |
| :--- | :--- |
| `PAGINATOR_STATES.IDLE` | Created, not yet started. |
| `PAGINATOR_STATES.RUNNING` | Actively listening for user page navigation. |
| `PAGINATOR_STATES.STOPPED` | Stopped manually or via close keyword. |
| `PAGINATOR_STATES.TIMEOUT` | Closed due to inactivity timeout. |
| `PAGINATOR_STATES.SHUTDOWN` | Closed because client disconnected. |
| `PAGINATOR_STATES.ERROR` | Stopped due to runtime error. |

---

## Related Documentation

- **[Interactive Prompts](/en/utilities/prompt)**: Multi-step interactive conversation wizard.
- **[Message Collector](/en/utilities/collector)**: Lower-level message collection engine.
- **[Auto-Delete Manager](/en/utilities/autodelete)**: Scheduled message deletion.
