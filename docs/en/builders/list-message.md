# ListMessage Builder

`ListMessage` constructs multi-section, interactive list selection menus (`single_select` native flow) for WhatsApp.

It is ideal for presenting menus, service selections, settings, or multi-option catalogs.

---

## Basic Example

```javascript
import { ListMessage } from 'leaves-guardian';

const list = new ListMessage(client)
  .setTitle('🏪 {{storeName}}')
  .setBody('Hello {{name}}, please choose a category below:')
  .setFooter('Select an item to continue')
  .setButtonText('📋 View Menu')
  .setVars({ storeName: 'Leaves Cafe', name: 'Rafa' })
  .addSection('☕ Coffee & Drinks', [
    { id: 'item_latte', title: 'Vanilla Latte', description: 'Fresh espresso with vanilla milk' },
    { id: 'item_americano', title: 'Caffe Americano', description: 'Rich double shot espresso' }
  ])
  .addSection('🥐 Pastries', [
    { id: 'item_croissant', title: 'Butter Croissant', description: 'Warm French pastry' }
  ]);

await client.sendMessage(msg.chat.id, list);
```

---

## Methods

| Method | Description |
| :--- | :--- |
| `.setTitle(title)` | Sets the header title. |
| `.setBody(body)` | Sets the message body. |
| `.setFooter(footer)` | Sets the footer text. |
| `.setButtonText(text)` | Sets the label on the list menu trigger button (default: `'Pilih'`). |
| `.addSection(title, rows)` | Adds a categorized section containing one or more menu rows. |
| `.addRow(sectionTitle, row)` | Appends a single row to an existing or new section. |

### Row Object Structure

Each row in a section accepts:
- `id`: Unique row identifier string.
- `title`: Primary row title text.
- `description`: Optional sub-description text.
- `header`: Optional small section header badge.

---

## Capturing List Selection Responses

When a user selects an item from the list, Leaves Guardian emits a `message` event with `msg.type === 'LIST'`:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'LIST') {
    console.log('Selected Row Title:', msg.text);

    // Access the exact selectedRowId via msg.raw escape hatch
    const selectedRowId = msg.raw?.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
    console.log('Selected Row ID:', selectedRowId);

    if (selectedRowId === 'item_latte') {
      await client.sendText(msg.chat.id, '☕ One Vanilla Latte added to your order!');
    }
  }
});
```

---

## Related Documentation

- **[Handling Interactive Responses](/en/builders/handling-responses)**: Full guide to interactive event parsing.
- **[ButtonMessage Builder](/en/builders/button-message)**: Quick reply buttons.
- **[CarouselMessage Builder](/en/builders/carousel-message)**: Horizontal card carousel.
