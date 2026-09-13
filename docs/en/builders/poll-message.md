# PollMessage Builder

`PollMessage` constructs native WhatsApp voting and polling messages (`proto.Message.PollCreationMessage`).

It supports single-choice and multiple-choice polls in both direct messages and group chats.

---

## Basic Example

```javascript
import { PollMessage } from 'leaves-guardian';

const poll = new PollMessage(client)
  .setQuestion('Which feature should we release next?')
  .addOption('🚀 Media Pipeline SSRF Filter')
  .addOption('📊 Advanced Traffic Metrics')
  .addOption('🎨 Custom Canvas Templates')
  .allowMultipleAnswers(false); // Single-choice vote

await client.sendMessage(msg.chat.id, poll);
```

---

## Methods

| Method | Description |
| :--- | :--- |
| `.setQuestion(question)` | Sets the main poll inquiry (alias for `.setTitle()`). |
| `.addOption(optionName)` | Adds a voting option (minimum 2 options, maximum 12 options). |
| `.allowMultipleAnswers(boolean)` | Sets whether voters can choose more than one option (`true` = multi-select, `false` = single-select). |
| `.setSelectableCount(number)` | Low-level setter for selectable option limit (`0` = multi-select, `1` = single-select). |

---

## Validation Rules

- **Minimum Options**: A poll must contain at least **2 options**.
- **Maximum Options**: WhatsApp enforces a strict limit of **12 options** per poll. Exceeding 12 options throws a `ContentValidationError`.

---

## Related Documentation

- **[ButtonMessage Builder](/en/builders/button-message)**: Interactive button choices.
- **[ListMessage Builder](/en/builders/list-message)**: Multi-section menus.
- **[Incoming Events](/en/messaging/incoming-events)**: Listening for poll updates.
