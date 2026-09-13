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
| `.addHtml(htmlString, options)` | Embeds HTML markup content. |

---

## Related Documentation

- **[CanvasMessage Builder](/en/builders/canvas-message)**: HTML canvas and mini app builder.
- **[RichMessage Builder](/en/builders/rich-message)**: General rich card generator.
- **[TextMessage Builder](/en/builders/text-message)**: Plain formatted text messaging.
