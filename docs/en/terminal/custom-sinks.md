# Custom Sinks & Renderers

Leaves Guardian features a decoupled **Terminal Presentation Subsystem** that separates the **visual formatting of events** from their **physical output transport**. By implementing custom renderers or sinks, you can format logs according to your application's design or route log streams to custom files, test harnesses, or external collectors.

---

## 1. Extension Architecture & Pipeline

The terminal presentation pipeline processes events through distinct architectural layers:

```
Semantic Event Input
        │
        ▼
PresentationSanitizer (Privacy & Masking)
        │
        ▼
TerminalEvent (Immutable Model)
        │
        ▼
TerminalRenderer (render() ──► string | null)
        │
        ▼
OutputSink (write(text, level) ──► Physical Output)
```

### Separation of Concerns

| Component | Responsibility | Input | Output |
| :--- | :--- | :--- | :--- |
| **`TerminalRenderer`** | **Presentation Transformation** — Converts structured semantic events into human-readable strings, colored text, or line-delimited data. | Immutable `TerminalEvent` | `string` (to print) or `null` (to suppress) |
| **`OutputSink`** | **Physical Transport** — Receives rendered text and dispatches it to physical streams, file descriptors, or in-memory arrays. | `text: string`, `level: string` | Stream emission / storage |

> [!NOTE]
> Sinks receive only the pre-rendered `string` and `level`. They never interact directly with raw `TerminalEvent` instances or internal client state.

---

## 2. Output Sinks (Physical Transport Layer)

An **Output Sink** is the final destination for rendered terminal output. Any object implementing the `write()` method satisfies the sink interface contract.

### The Output Sink Interface Contract

```typescript
interface OutputSink {
  /**
   * Writes rendered text to the destination transport.
   * @param text The rendered text string (with or without trailing newline).
   * @param level The log severity level ('DEBUG' | 'INFO' | 'WARN' | 'ERROR').
   */
  write(text: string, level: string): void;

  /**
   * Optional lifecycle hook invoked when the terminal manager is destroyed.
   */
  destroy?(): void;
}
```

---

### Built-in Sink: `DefaultDualSink`

`DefaultDualSink` is the default transport in Leaves Guardian. It provides **level-based stream routing** to standard process streams:

- **`WARN` & `ERROR`** $\rightarrow$ routed to `process.stderr`
- **`DEBUG` & `INFO`** $\rightarrow$ routed to `process.stdout`
- **Newline Normalization**: Automatically appends a trailing `\n` if the rendered string does not already end with one.

```javascript
import { DefaultDualSink } from 'leaves-guardian';

// Default stdout/stderr routing
const dualSink = new DefaultDualSink();

// Custom stream injection (e.g. mock writable streams)
const customDualSink = new DefaultDualSink(myStdoutStream, myStderrStream);
```

---

### Built-in Sink: `MemorySink` (Testing & Headless Inspection)

`MemorySink` records rendered output lines in memory. It is designed specifically for **unit testing, CI assertion suites, and headless debugging** where terminal stream pollution must be prevented.

```javascript
import { MemorySink } from 'leaves-guardian';

const memorySink = new MemorySink();

// TerminalManager writes output to memorySink
memorySink.write('ℹ [INFO] Client ready', 'INFO');

// Retrieve all plain text lines
console.log(memorySink.getLines());
// Output: ['ℹ [INFO] Client ready']

// Retrieve structured entry records
console.log(memorySink.getEntries());
// Output:
// [
//   {
//     text: 'ℹ [INFO] Client ready',
//     output: 'ℹ [INFO] Client ready',
//     level: 'INFO',
//     timestamp: 1773400000000
//   }
// ]

// Clear stored entries
memorySink.clear();

// Destroy sink
memorySink.destroy();
```

#### Verified `MemorySink` Entry Schema

Each record returned by `getEntries()` contains:

| Property | Type | Description |
| :--- | :--- | :--- |
| `text` | `string` | The formatted text written to the sink. |
| `output` | `string` | Exact mirror of `text` for backwards compatibility. |
| `level` | `string` | Severity level string (`DEBUG`, `INFO`, `WARN`, `ERROR`). |
| `timestamp` | `number` | Epoch timestamp (in ms) when the entry was recorded. |

---

## 3. Custom Sink Examples (Integration Patterns)

The following examples illustrate how developers can implement an `OutputSink` to meet custom infrastructure requirements. These patterns are user-implemented integrations rather than built-in package components.

### Example 1: Local File Sink

A custom sink that streams formatted logs to a local disk file using Node.js `fs.createWriteStream`:

```javascript
import fs from 'node:fs';

export class FileSink {
  constructor(filePath) {
    this.name = 'FileSink';
    this.stream = fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf8' });
  }

  write(text, level) {
    if (!this.stream.writable) return;
    const line = text.endsWith('\n') ? text : `${text}\n`;
    this.stream.write(line);
  }

  destroy() {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
  }
}
```

---

### Example 2: Fan-Out / Multi-Destination Sink

A custom sink that broadcasts rendered lines to both the standard terminal and a secondary logging destination:

```javascript
import { DefaultDualSink } from 'leaves-guardian';

export class FanOutSink {
  constructor(secondarySink) {
    this.name = 'FanOutSink';
    this.terminalSink = new DefaultDualSink();
    this.secondarySink = secondarySink;
  }

  write(text, level) {
    // 1. Write to standard terminal (stdout/stderr)
    this.terminalSink.write(text, level);

    // 2. Forward to secondary transport
    if (this.secondarySink && typeof this.secondarySink.write === 'function') {
      try {
        this.secondarySink.write(text, level);
      } catch (_) {
        // Prevent secondary errors from breaking terminal output
      }
    }
  }

  destroy() {
    this.terminalSink.destroy();
    if (this.secondarySink && typeof this.secondarySink.destroy === 'function') {
      this.secondarySink.destroy();
    }
  }
}
```

---

## 4. Visual Renderers (Presentation Layer)

A **Visual Renderer** is responsible for transforming an immutable `TerminalEvent` into a formatted string (or returning `null` to suppress output).

### Model A Synchronous Contract

Leaves Guardian follows a pure **Model A Synchronous String Transformation** contract:

```typescript
interface TerminalRenderer {
  /**
   * Synchronously transforms a semantic event into string output.
   * Return null or an empty string to suppress rendering.
   */
  render(event: TerminalEvent): string | null;

  /**
   * Optional lifecycle hook to initialize capabilities and options.
   */
  init?(context: Readonly<RendererContext>): void;

  /**
   * Optional lifecycle hook for cleanup when replaced or destroyed.
   */
  destroy?(): void;
}
```

> [!IMPORTANT]
> The `render()` method must execute synchronously. Renderers transform data into strings and must never write directly to output streams or manipulate internal client state.

---

### Renderer Safe Context (`RendererContext`)

When a renderer is initialized via `init(context)`, `TerminalManager` provides an isolated, deeply frozen context object:

```javascript
{
  capabilities: {
    isTTY: boolean,
    supportsColor: boolean,
    supportsCursorMovement: boolean,
    columns: number,
    rows: number
  },
  options: {
    enabled: boolean,
    minLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    privacyMasking: boolean
  }
}
```

#### Security & Sandbox Invariant

The context provides **read-only capability information**. Internal system references, sinks, clock functions, and client instances are intentionally stripped to ensure presentation isolation.

---

## 5. DefaultTextRenderer & Theming Hooks

`DefaultTextRenderer` is the standard visual renderer in Leaves Guardian.

### Default Formatting Rules

- **Timestamp**: Formatted as `[HH:MM:SS]` (styled with Chalk gray if color is supported).
- **Domain/Type Tag**: 8-character padded tag (e.g. `CLIENT  `, `MESSAGE `).
- **Severity Badges**:
  - `DEBUG` $\rightarrow$ `🔍 [DEBUG]` (Magenta)
  - `WARN` $\rightarrow$ `⚠ [WARN]` (Yellow)
  - `ERROR` $\rightarrow$ `✖ [ERROR]` (Red)
  - `INFO` $\rightarrow$ `ℹ [INFO]` (Cyan)
  - `INFO` (with `_legacySuccess: true`) $\rightarrow$ `✓ [OK]` (Green)
  - `INFO` (with `type: 'MESSAGE'`) $\rightarrow$ `💬 [MSG] [Group: <chatId>] <sender>: <text>` (Blue)

---

### Custom Theme Extension Hooks

`DefaultTextRenderer` accepts an optional `theme` configuration object in its constructor with custom formatting hooks:

```javascript
import { DefaultTextRenderer } from 'leaves-guardian';

const customRenderer = new DefaultTextRenderer({
  theme: {
    // Custom timestamp formatter hook
    formatTimestamp(timestamp) {
      const d = new Date(timestamp);
      return `[${d.toISOString()}]`;
    },

    // Custom event line formatter hook
    formatEvent(event, { timestamp, color }) {
      if (event.level === 'ERROR') {
        return `${timestamp} [CRITICAL ERROR] (${event.domain}) ${event.message}`;
      }
      return `${timestamp} [${event.level}] ${event.message}`;
    }
  }
});
```

---

## 6. Custom Renderer Examples

Consumers can implement completely custom renderers to format logs for specific hosting environments.

### Example 1: Line-Delimited JSON (NDJSON) Renderer

For containerized environments that ingest structured JSON logs, a renderer can serialize the authoritative fields of `TerminalEvent` to a single JSON line:

```javascript
export class JsonLineRenderer {
  constructor() {
    this.name = 'JsonLineRenderer';
  }

  init(context) {
    this.context = context;
  }

  render(event) {
    if (!event) return null;

    const payload = {
      id: event.id,
      timestamp: event.timestamp,
      iso: new Date(event.timestamp).toISOString(),
      level: event.level,
      domain: event.domain,
      type: event.type,
      message: event.message,
      data: event.data
    };

    return JSON.stringify(payload);
  }

  destroy() {
    this.context = null;
  }
}
```

---

### Example 2: Minimalist / Headless Renderer

A compact renderer for background services or CI logs without ANSI color codes:

```javascript
export class MinimalRenderer {
  constructor() {
    this.name = 'MinimalRenderer';
  }

  render(event) {
    if (!event) return null;
    const time = new Date(event.timestamp).toLocaleTimeString();
    return `${time} |${event.level.padEnd(5)}| ${event.message}`;
  }
}
```

---

## 7. Initialization & Runtime Renderer Replacement

### Configuration via Constructor

You can inject custom renderers and sinks when creating a `LeavesTerminal` or `TerminalManager` instance:

```javascript
import { LeavesTerminal, MemorySink } from 'leaves-guardian';
import { JsonLineRenderer } from './JsonLineRenderer.js';

const terminal = new LeavesTerminal({
  renderer: new JsonLineRenderer(),
  sink: new MemorySink(),
  logLevel: 'debug',
  privacy: true
});
```

---

### Runtime Renderer Replacement (`setRenderer`)

You can dynamically replace the visual renderer at runtime without restarting the bot:

```javascript
import { TerminalManager, DefaultTextRenderer } from 'leaves-guardian';
import { JsonLineRenderer } from './JsonLineRenderer.js';

const manager = new TerminalManager();

// Switch to structured JSON rendering
manager.setRenderer(new JsonLineRenderer());

// Switch back to default visual text renderer
manager.setRenderer(new DefaultTextRenderer());
```

#### What Happens During `setRenderer(newRenderer)`:

1. **Validation**: Asserts that `typeof newRenderer.render === 'function'`. If invalid, throws `TerminalError` with code `TERMINAL_INVALID_OPTION`.
2. **Cleanup**: Invokes `destroy()` on the previous renderer (if implemented).
3. **Health Restoration**: Resets `rendererStatus` to `RENDERER_STATUS.HEALTHY`.
4. **Context Initialization**: Invokes `init(context)` on the new renderer with the current frozen `RendererContext`.

---

## 8. Fault Handling & Degraded Fallback Lifecycle

Leaves Guardian terminal presentation is **fault-resilient**. If a custom renderer throws an unhandled exception during `render()`, the presentation engine protects the host application from crashing:

```
Custom Renderer throws Exception
              │
              ▼
TerminalManager catches error
              │
              ├─► Sets rendererStatus = RENDERER_STATUS.DEGRADED
              │
              └─► Emits emergency [TERR_FALLBACK] line directly to process.stderr
```

### The Fallback Line Structure

When degraded, the manager writes directly to `process.stderr` using an authoritative fallback format:

```text
[TERR_FALLBACK] [ERROR] (CLIENT:GENERAL) Formatter error: Unexpected token | Original message text
```

- The error in the custom renderer is isolated.
- The bot application continues running smoothly.
- Once a healthy renderer is installed via `setRenderer()`, the status automatically returns to `HEALTHY`.

---

## 9. API Reference Summary

### `DefaultDualSink`

| Member | Signature | Description |
| :--- | :--- | :--- |
| `constructor` | `(stdout = process.stdout, stderr = process.stderr)` | Initializes dual sink with standard or injected writable streams. |
| `write` | `(text: string, level: string): void` | Synchronously writes `WARN`/`ERROR` to stderr and `INFO`/`DEBUG` to stdout. |
| `destroy` | `(): void` | Cleans up stream references. |

### `MemorySink`

| Member | Signature | Description |
| :--- | :--- | :--- |
| `constructor` | `()` | Initializes empty in-memory records array. |
| `write` | `(text: string, level: string): void` | Appends `{ text, output, level, timestamp }` record if not destroyed. |
| `getLines` | `(): string[]` | Returns an array of formatted string lines. |
| `getEntries` | `(): Object[]` | Returns a shallow copy array of recorded entry objects. |
| `clear` | `(): void` | Empties the stored records array. |
| `destroy` | `(): void` | Sets internal destroyed flag to suppress subsequent writes. |

### `DefaultTextRenderer`

| Member | Signature | Description |
| :--- | :--- | :--- |
| `constructor` | `(options = { theme: {} })` | Initializes text renderer with optional custom theme formatting hooks. |
| `init` | `(context: Readonly<RendererContext>): void` | Receives safe capability and configuration context. |
| `render` | `(event: TerminalEvent): string | null` | Synchronously renders formatted string output with color badges. |
| `destroy` | `(): void` | Cleans up context reference. |
