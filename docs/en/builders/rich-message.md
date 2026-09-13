# RichMessage Builder

`RichMessage` constructs visual card payloads with structured headers, body paragraphs, highlighted callouts, status badges, and interactive action buttons.

---

## Basic Example

```javascript
import { RichMessage } from 'leaves-guardian';

const richCard = new RichMessage(client)
  .setHeader('📢 System Announcement', 'Maintenance Completed')
  .setBody('All infrastructure upgrades for Leaves Guardian v0.2.0 are now live!')
  .addBadge('Version 0.2.0', '#15803d')
  .setFooter('Royal Engine Studio')
  .addButton('📖 View Changelog', 'view_changelog')
  .addButton('🌐 Visit Website', 'https://leaves-guardian.dev', 'url');

await client.sendMessage(msg.chat.id, richCard);
```

---

## Methods

| Method | Description |
| :--- | :--- |
| `.setHeader(title, subtitle)` | Sets a prominent title and subtitle header. |
| `.setBody(text)` | Sets the primary body text content. |
| `.setFooter(footer)` | Sets the card footer note. |
| `.addBadge(label, color)` | Adds a visual status indicator badge. |
| `.addButton(text, idOrUrl, type)` | Adds an action button (`'reply'`, `'url'`, or `'copy'`). |

---

## Related Documentation

- **[AIRichMessage Builder](/en/builders/ai-rich-message)**: AI response structure builder.
- **[ButtonMessage Builder](/en/builders/button-message)**: Interactive button message builder.
- **[TextMessage Builder](/en/builders/text-message)**: Plain formatted text messaging.
