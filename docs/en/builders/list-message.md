# ListMessage Builder

`ListMessage` constructs multi-section, interactive list selection menus (`single_select` native flow) for WhatsApp with support for header media banners (image, video, document).

It is ideal for presenting menus, service selections, settings, or multi-option catalogs.

---

## Basic Example with Header Banner

```javascript
import { ListMessage } from 'leaves-guardian';

const list = new ListMessage(client)
  .setImage('https://example.com/banner.jpg')
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
| `.setImage(pathOrBuffer)` | Sets an image media banner for the list header. |
| `.setVideo(pathOrBuffer)` | Sets a video media banner for the list header. |
| `.setDocument(pathOrBuffer, opts)` | Sets a document attachment for the list header. |
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

When a user selects an item from the list, Leaves Guardian normalizes the selection and emits a `message` event with `msg.type === 'LIST'`. `msg.text` automatically contains the chosen row `id`:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'LIST') {
    console.log('Selected Row ID:', msg.text);

    if (msg.text === 'item_latte') {
      await client.sendText(msg.chat.id, '☕ One Vanilla Latte added to your order!');
    }
  }
});
```

---

## Related Documentation

- **[Handling Interactive Responses](/en/builders/handling-responses)**: Full guide to interactive event parsing.
- **[ButtonMessage Builder](/en/builders/button-message)**: Quick reply and action buttons.
- **[CarouselMessage Builder](/en/builders/carousel-message)**: Horizontal card carousel.
