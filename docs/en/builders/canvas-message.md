# CanvasMessage Builder

`CanvasMessage` extends `AIRichMessage` to construct HTML-based interactive canvas payloads for WhatsApp.

It allows embedding HTML5, CSS, and inline JavaScript content with domain whitelisting controls.

---

## Basic Example

```javascript
import { CanvasMessage } from 'leaves-guardian';

const htmlPayload = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 20px; background: #f0fdf4; }
    .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    h1 { color: #166534; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🍃 Leaves Guardian</h1>
    <p>Interactive Canvas Template</p>
  </div>
</body>
</html>
`;

const canvas = new CanvasMessage(client)
  .setHtml(htmlPayload, {
    trustedSources: ['leaves-guardian.dev', 'whatsapp.com']
  });

await client.sendMessage(msg.chat.id, canvas);
```

---

## Methods & Options

| Method | Description |
| :--- | :--- |
| `.setHtml(htmlString, options)` | Sets the complete HTML markup payload. |
| `options.trustedSources` | Array of trusted external domain origins allowed to load resources. |

---

## Client Rendering Note

> **Note**: Interactive HTML rendering depends on the recipient's WhatsApp client version and platform support. On platforms without canvas runtime support, WhatsApp falls back to standard message representation.

---

## Related Documentation

- **[AIRichMessage Builder](/en/builders/ai-rich-message)**: AI response structure builder.
- **[RichMessage Builder](/en/builders/rich-message)**: Visual card generator.
- **[MediaMessage Builder](/en/builders/media-message)**: Sending images, video, and documents.
