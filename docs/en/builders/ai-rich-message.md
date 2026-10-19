# AIRichMessage Builder

`AIRichMessage` constructs structured response cards formatted specifically for AI assistant outputs, technical documentation snippets, and conversational bots.

It supports modular sections including markdown text, highlighted code snippets, source citations, status badges, and interactive buttons.

---

## Basic Example

```javascript
import { AIRichMessage } from 'leaves-guardian';

const aiMsg = new AIRichMessage(client)
  .addHeader('🧠 AI Code Assistant', 'Generated Solution')
  .addMarkdown('Here is how to create a simple HTTP server in Node.js:')
  .addCode(`
import http from 'http';

const server = http.createServer((req, res) => {
  res.end('Hello from Leaves Guardian!');
});

server.listen(3000);
  `.trim(), 'javascript')
  .addSearchSources([
    { title: 'Node.js Docs', url: 'https://nodejs.org' }
  ])
  .addBadge('Verified Solution', '#2e7d32');

await client.sendMessage(msg.chat.id, aiMsg);
```

---

## Methods

| Method | Description |
| :--- | :--- |
| `.addHeader(title, subtitle)` | Adds a visual header banner. |
| `.addMarkdown(text)` | Appends formatted markdown text content. |
| `.addCode(codeString, language)` | Formats a code block with language annotation. |
| `.addSearchSources(sourcesArray)` | Appends citation cards with source URLs. |
| `.addBadge(label, color)` | Adds a visual indicator badge. |
| `.addHtml(htmlString, options)` | Embeds interactive HTML primitive (`FOAHtmlPrimitiveDemoDONOTUSE`) with trusted origin domains `{ trustedSources: [] }`. |

---

## Interactive Meta AI HTML Widgets (`.addHtml()` v0.4.0)

Utilizes WhatsApp Meta AI's official primitive (`FOAHtmlPrimitiveDemoDONOTUSE`) to render mini-app widgets with trusted source origins:

```javascript
import { AIRichMessage } from 'leaves-guardian';

const aiMsg = new AIRichMessage(client)
  .setTitle('Server Performance Statistics')
  .addHtml(`
    <div style="font-family: sans-serif; padding: 12px; background: #f0fdf4; border-radius: 8px;">
      <h3 style="color: #166534; margin: 0;">Server Status: OK</h3>
      <p style="color: #15803d; margin: 4px 0;">Uptime: 99.98% | Latency: 18ms</p>
    </div>
  `.trim(), {
    trustedSources: ['leavesguardian.enginelabs.my.id', 'nixel.dev']
  });

await aiMsg.send(msg.chat.id);
```

---

## Related Documentation

- **[CanvasMessage Builder](/en/builders/canvas-message)**: HTML canvas and mini app builder.
- **[RichMessage Builder](/en/builders/rich-message)**: General rich card generator.
- **[TextMessage Builder](/en/builders/text-message)**: Plain formatted text messaging.
