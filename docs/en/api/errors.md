# Error Hierarchy & Error Codes

Leaves Guardian provides a comprehensive, structured exception architecture rooted in the base class `LeavesError`. All errors emitted across the client, message builders, developer utilities, and reliability subsystems inherit from this foundation.

By combining **semantic error classes** with **machine-readable error codes** and contextual metadata, the library allows applications to implement fine-grained, context-appropriate error handling.

---

## 1. Error Architecture & Philosophy

Errors in Leaves Guardian are designed with three fundamental principles:

1. **Explicit Inheritance**: Every domain and subsystem provides dedicated error classes inheriting from `LeavesError` (which extends Node.js `Error`).
2. **Discriminated Error Codes**: Every error instance carries a string `code` property indicating the specific failure mode.
3. **Contextual Metadata**: Errors carry an optional `meta` payload containing relevant diagnostic identifiers, such as failed targets, JIDs, task IDs, step IDs, or the underlying `cause`.

```
Error (Node.js native)
   └── LeavesError (code = 'LEAVES_ERROR', meta = {})
         ├── ConnectionError
         ├── AuthenticationError
         ├── SessionError
         │     └── SessionRecoveryError
         ├── PromptError
         │     ├── PromptTimeoutError
         │     ├── PromptCancelledError
         │     └── PromptMaxRetriesError
         ├── TrafficError
         ├── MediaError
         └── ... (33 specialized error classes)
```

---

## 2. Base Class: `LeavesError`

All custom errors in Leaves Guardian extend `LeavesError`.

### Constructor & Signature

```javascript
export class LeavesError extends Error {
  constructor(message, code = 'LEAVES_ERROR', meta = {}) {
    super(message);
    this.name = 'LeavesError';
    this.code = code;
    this.meta = meta;
    if (meta && meta.cause) {
      this.cause = meta.cause;
    }
    Object.assign(this, meta);
  }
}
```

### Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | The name of the error class (e.g. `'LeavesError'`, `'TrafficError'`). |
| `message` | `string` | Human-readable explanation of the error condition. |
| `code` | `string` | Machine-readable error code string (e.g. `'TRAFFIC_QUEUE_FULL'`). |
| `meta` | `Object` | Frozen or plain dictionary containing contextual metadata. Defaults to `{}`. |
| `cause` | `Error | undefined` | When `meta.cause` is provided, `LeavesError` exposes it as `error.cause` for error-chain inspection. |

### Metadata Direct Projection

The constructor applies `Object.assign(this, meta)`. Properties supplied through `meta` are assigned directly to the error instance, allowing convenient, ergonomic access to context fields when provided by the originating subsystem:

```javascript
try {
  await prompt.run('62812345678@s.whatsapp.net');
} catch (err) {
  if (err instanceof LeavesError) {
    console.error('Code:', err.code);          // e.g. 'PROMPT_STEP_TIMEOUT'
    console.error('Step ID:', err.stepId);     // Direct property projected from meta
    console.error('Full Meta:', err.meta);     // { stepId: 'age_input', timeoutMs: 30000 }
  }
}
```

---

## 3. Error Class Reference

Leaves Guardian exports **33 specialized error classes** from the package root.

### A. Core Client & Connection Layer

| Error Class | Base Class | Default Code | Documented Context / Metadata |
| :--- | :--- | :--- | :--- |
| `LeavesError` | `Error` | `'LEAVES_ERROR'` | General base class for all package errors. Accepts `meta`. |
| `ConnectionError` | `LeavesError` | `'CONNECTION_ERROR'` | Socket connection failures, disconnects, or stream drops. |
| `AuthenticationError` | `LeavesError` | `'AUTHENTICATION_ERROR'` | QR failure, invalid credentials, or 401 unrecoverable auth errors. |
| `SessionError` | `LeavesError` | `'SESSION_ERROR'` | Session corruption, missing credentials directory, or auth I/O failures. |
| `SessionRecoveryError` | `SessionError` | `'SESSION_RECOVERY_ERROR'` | Granular session recovery and snapshot restoration errors (uses `SESSION_RECOVERY_CODES`). |
| `PairingError` | `LeavesError` | `'PAIRING_ERROR'` | Pairing code generation failure, invalid phone number, or pairing timeout. |
| `MessageNormalizationError` | `LeavesError` | `'MESSAGE_NORMALIZATION_ERROR'` | Failure when converting raw Baileys proto payloads into normalized `Message` instances. |
| `ShutdownError` | `LeavesError` | `'SHUTDOWN_ERROR'` | Operations attempted after client or subsystem has entered shutdown state. |
| `StateError` | `LeavesError` | `'STATE_ERROR'` | Invalid state transitions in lifecycle managers. |
| `LeavesValidationError` | `LeavesError` | `'VALIDATION_ERROR'` | Generic parameter validation errors across client options and utility helpers. |

---

### B. Message Builders & Content Validation

| Error Class | Base Class | Default Code | Documented Context / Metadata |
| :--- | :--- | :--- | :--- |
| `ItemNotFoundError` | `LeavesError` | `'ITEM_NOT_FOUND'` | Thrown when mutating/deleting builder items by ID that do not exist. Meta: `{ id, availableIds }`. |
| `DuplicateIdError` | `LeavesError` | `'DUPLICATE_ID'` | Thrown when adding builder items with conflicting IDs. Meta: `{ id }`. |
| `InvalidTargetError` | `LeavesError` | `'INVALID_TARGET'` | Thrown when a destination JID is missing, malformed, or invalid for the message type. |
| `ContentValidationError` | `LeavesError` | `'CONTENT_VALIDATION'` | Thrown when builder content fails protocol constraints (e.g. empty buttons, excessive options). |

---

### C. Interactive Utilities & Developer Tools

| Error Class | Base Class | Default Code | Documented Context / Metadata |
| :--- | :--- | :--- | :--- |
| `CollectorError` | `LeavesError` | `'COLLECTOR_ERROR'` | Base error for `MessageCollector` failures. |
| `CollectorTimeoutError` | `CollectorError` | `'COLLECTOR_TIMEOUT'` | Emitted when collector times out before receiving matching messages. |
| `PromptError` | `LeavesError` | `'PROMPT_ERROR'` | Base error for `Prompt` conversation wizard failures. |
| `PromptTimeoutError` | `PromptError` | `'PROMPT_TIMEOUT'` / `'PROMPT_STEP_TIMEOUT'` | Emitted when prompt step or entire wizard expires without user input. Meta: `{ stepId, timeoutMs }`. |
| `PromptCancelledError` | `PromptError` | `'PROMPT_CANCELLED'` | Emitted when user sends a cancellation keyword (e.g. "batal", "cancel"). Meta: `{ stepId }`. |
| `PromptMaxRetriesError` | `PromptError` | `'PROMPT_MAX_RETRIES'` | Emitted when user exceeds step validation attempt limit. Meta: `{ stepId, attempts }`. |
| `PaginatorError` | `LeavesError` | `'PAGINATOR_ERROR'` | Base error for `Paginator` failures. |
| `PaginatorStateError` | `PaginatorError` | `'PAGINATOR_STATE_ERROR'` | Thrown on invalid paginator lifecycle operations (e.g. navigating stopped paginator). |
| `PaginatorTimeoutError` | `PaginatorError` | `'PAGINATOR_TIMEOUT'` / `'PAGINATOR_IDLE_TIMEOUT'` | Emitted when interactive paginator expires due to total time or idle silence. |
| `EphemeralError` | `LeavesError` | `'EPHEMERAL_ERROR'` | Thrown when ephemeral timer configuration or target message key is invalid. |
| `AutoDeleteError` | `LeavesError` | `'AUTODELETE_ERROR'` | Thrown when scheduling auto-deletion fails or target key cannot be normalized. |

---

### D. Reliability & Runtime Subsystems

| Error Class | Base Class | Default Code | Documented Context / Metadata |
| :--- | :--- | :--- | :--- |
| `SmartStoreError` | `LeavesError` | `'SMARTSTORE_ERROR'` | Key validation, namespace isolation, serialization, or sweep errors. |
| `HealthError` | `LeavesError` | `'HEALTH_ERROR'` | Health monitor probe registration or threshold validation failures (uses `HEALTH_ERROR_CODES`). |
| `WatchdogError` | `LeavesError` | `'WATCHDOG_ERROR'` | Watchdog socket liveness verification failures (uses `WATCHDOG_ERROR_CODES`). |
| `MemoryError` | `LeavesError` | `'MEMORY_ERROR'` | Memory Guard threshold validation or mitigation hook errors (uses `MEMORY_ERROR_CODES`). |

---

### E. Traffic, Media, Limiter & Terminal Subsystems

| Error Class | Base Class | Default Code | Documented Context / Metadata |
| :--- | :--- | :--- | :--- |
| `TrafficError` | `LeavesError` | `'TRAFFIC_ERROR'` | Egress queue overflow, invalid priority, or cancelled task errors (uses `TRAFFIC_ERROR_CODES`). |
| `MediaError` | `LeavesError` | `'MEDIA_ERROR'` | Media preparation, SSRF block, timeout, or format errors (uses `MEDIA_ERROR_CODES`). |
| `RateLimitError` | `LeavesError` | `'RATE_LIMIT_ERROR'` | Rate limiter option validation or key extraction errors (uses `RATE_LIMIT_ERROR_CODES`). |
| `DeduplicationError` | `LeavesError` | `'DEDUP_ERROR'` | Deduplicator option validation or identity extraction errors (uses `DEDUP_ERROR_CODES`). |
| `TerminalError` | `LeavesError` | `'TERMINAL_ERROR'` | Presentation option validation, invalid events, or renderer replacement errors (uses `TERMINAL_ERROR_CODES`). |

---

## 4. Subsystem Error Code Constants

In addition to error classes, Leaves Guardian exports **9 frozen error code enums**. These constants provide stable, machine-readable string values assigned to `err.code` across subsystems.

> [!NOTE]
> **Error Classes vs. Error Code Constants**:
> - **Error Classes** (e.g. `MediaError`) form the JavaScript prototype inheritance hierarchy.
> - **Error Code Constants** (e.g. `MEDIA_ERROR_CODES.SIZE_EXCEEDED`) are categorized string dictionaries used for granular code-level discrimination.

---

### `SESSION_RECOVERY_CODES`

Exported from `leaves-guardian`:

| Constant Key | String Value (`err.code`) | Trigger Condition |
| :--- | :--- | :--- |
| `SESSION_CORRUPTED` | `'SESSION_CORRUPTED'` | Detected zero-byte, invalid JSON, or broken schema in active session files. |
| `SNAPSHOT_CREATION_FAILED` | `'SNAPSHOT_CREATION_FAILED'` | Failed to write or archive atomic session snapshot. |
| `SNAPSHOT_INCONSISTENT` | `'SNAPSHOT_INCONSISTENT'` | Snapshot contains partial or checksum-mismatched files. |
| `SNAPSHOT_CORRUPTED` | `'SNAPSHOT_CORRUPTED'` | Stored snapshot archive failed integrity verification. |
| `SESSION_UNRECOVERABLE` | `'SESSION_UNRECOVERABLE'` | No valid snapshots available and session files are irrecoverably damaged. |
| `RESTORE_FAILED` | `'RESTORE_FAILED'` | Failed to extract snapshot files into session directory. |
| `RESTORE_ACTIVATION_FAILED` | `'RESTORE_ACTIVATION_FAILED'` | Restored credentials failed to initialize socket connection. |
| `RECOVERY_BLOCKED_401` | `'RECOVERY_BLOCKED_401'` | Auto-recovery aborted because session received unrecoverable 401 logged out from WhatsApp. |
| `RECOVERY_BUSY` | `'RECOVERY_BUSY'` | Recovery process triggered while an active recovery is already in flight. |
| `INVALID_PARAMETER` | `'INVALID_PARAMETER'` | Invalid options supplied to SessionRecovery constructor or methods. |

---

### `HEALTH_ERROR_CODES`

| Constant Key | String Value (`err.code`) | Trigger Condition |
| :--- | :--- | :--- |
| `HEALTH_INVALID_THRESHOLD` | `'HEALTH_INVALID_THRESHOLD'` | Degraded threshold value is not strictly less than critical threshold. |
| `HEALTH_INVALID_OPTION` | `'HEALTH_INVALID_OPTION'` | Non-numeric or invalid configuration supplied to `HealthMonitor`. |
| `HEALTH_PROBE_ERROR` | `'HEALTH_PROBE_ERROR'` | Custom registered health probe handler threw an unhandled exception. |

---

### `WATCHDOG_ERROR_CODES`

| Constant Key | String Value (`err.code`) | Trigger Condition |
| :--- | :--- | :--- |
| `WATCHDOG_INVALID_OPTION` | `'WATCHDOG_INVALID_OPTION'` | Configuration parameters failed integer or positive bounds check. |
| `WATCHDOG_SOCKET_ERROR` | `'WATCHDOG_SOCKET_ERROR'` | Socket ping check failed or socket stream was unresponsive beyond threshold. |

---

### `MEMORY_ERROR_CODES`

| Constant Key | String Value (`err.code`) | Trigger Condition |
| :--- | :--- | :--- |
| `MEMORY_INVALID_OPTION` | `'MEMORY_INVALID_OPTION'` | Invalid configuration parameters passed to `MemoryGuard`. |
| `MEMORY_INVALID_THRESHOLD` | `'MEMORY_INVALID_THRESHOLD'` | Warning threshold is not strictly less than critical threshold. |
| `MEMORY_HOOK_ERROR` | `'MEMORY_HOOK_ERROR'` | Registered memory mitigation hook timed out or threw an error. |

---

### `TRAFFIC_ERROR_CODES`

| Constant Key | String Value (`err.code`) | Trigger Condition |
| :--- | :--- | :--- |
| `TRAFFIC_QUEUE_FULL` | `'TRAFFIC_QUEUE_FULL'` | Outgoing message rejected because egress priority queue has reached `maxQueueSize`. |
| `TRAFFIC_TASK_CANCELLED` | `'TRAFFIC_TASK_CANCELLED'` | Queued dispatch task was cancelled by user ID or recipient JID before execution. |
| `TRAFFIC_CONTROLLER_STOPPED` | `'TRAFFIC_CONTROLLER_STOPPED'` | Dispatch attempted on a stopped `TrafficController` instance. |
| `TRAFFIC_INVALID_OPTION` | `'TRAFFIC_INVALID_OPTION'` | Invalid configuration parameters or invalid priority level supplied. |

---

### `MEDIA_ERROR_CODES`

| Constant Key | String Value (`err.code`) | Trigger Condition |
| :--- | :--- | :--- |
| `INVALID_SOURCE` | `'MEDIA_INVALID_SOURCE'` | Source is not a valid URL, Buffer, Readable Stream, or local filepath. |
| `SIZE_EXCEEDED` | `'MEDIA_SIZE_EXCEEDED'` | Media payload size exceeds configured maximum byte threshold. |
| `UNSUPPORTED_TYPE` | `'MEDIA_UNSUPPORTED_TYPE'` | Inferred MIME type is not allowed or supported by WhatsApp. |
| `FETCH_FAILED` | `'MEDIA_FETCH_FAILED'` | Remote media download failed with non-2xx HTTP status. |
| `FETCH_TIMEOUT` | `'MEDIA_FETCH_TIMEOUT'` | Remote media download exceeded configured fetch timeout. |
| `SSRF_BLOCKED` | `'MEDIA_SSRF_BLOCKED'` | Destination IP resolves to private, loopback, link-local, or metadata cloud IP. |
| `REDIRECT_LIMIT` | `'MEDIA_REDIRECT_LIMIT'` | Remote URL exceeded maximum allowed HTTP redirect hops. |
| `TRANSFORM_FAILED` | `'MEDIA_TRANSFORM_FAILED'` | Image/Video transformer (e.g. WebP sticker conversion) failed execution. |
| `QUEUE_FULL` | `'MEDIA_QUEUE_FULL'` | Media preparation pipeline concurrency queue is full. |
| `PIPELINE_ABORTED` | `'MEDIA_PIPELINE_ABORTED'` | Media preparation was aborted before completion. |
| `REPRESENTATION_UNAVAILABLE` | `'MEDIA_REPRESENTATION_UNAVAILABLE'` | Requested single active representation (e.g. stream) has already been consumed or closed. |
| `RESOURCE_RELEASED` | `'MEDIA_RESOURCE_RELEASED'` | Attempted to access media buffers after `release()` was called. |

---

### `RATE_LIMIT_ERROR_CODES`

| Constant Key | String Value (`err.code`) | Trigger Condition |
| :--- | :--- | :--- |
| `INVALID_OPTION` | `'RATE_LIMIT_INVALID_OPTION'` | Invalid configuration supplied to `IngressRateLimiter`. |
| `INTERNAL_ERROR` | `'RATE_LIMIT_ERROR'` | Key extractor returned an empty string or threw an exception. |

---

### `DEDUP_ERROR_CODES`

| Constant Key | String Value (`err.code`) | Trigger Condition |
| :--- | :--- | :--- |
| `INVALID_OPTION` | `'DEDUP_INVALID_OPTION'` | Invalid configuration supplied to `IngressDeduplicator`. |
| `INVALID_KEY` | `'DEDUP_INVALID_KEY'` | Extracted message deduplication key is empty or invalid. |
| `INTERNAL_ERROR` | `'DEDUP_ERROR'` | Deduplication cache storage failure or internal lookup error. |

---

### `TERMINAL_ERROR_CODES`

| Constant Key | String Value (`err.code`) | Trigger Condition |
| :--- | :--- | :--- |
| `INVALID_OPTION` | `'TERMINAL_INVALID_OPTION'` | Invalid configuration options or invalid renderer instance passed. |
| `INVALID_EVENT` | `'TERMINAL_INVALID_EVENT'` | Dispatch input is not a valid event object or contains invalid severity level. |
| `RENDERER_ERROR` | `'TERMINAL_RENDERER_ERROR'` | Renderer method threw an unhandled presentation formatting error. |
| `INTERNAL_ERROR` | `'TERMINAL_ERROR'` | Internal terminal presentation subsystem failure. |

---

## 5. Consumer Error Handling Patterns

Applications can combine class-based type checking, code matching, and metadata inspection to handle errors safely.

### Pattern 1: Class-Based Discrimination (`instanceof`)

Ideal when you need to match specific functional categories:

```javascript
import { 
  PromptTimeoutError, 
  PromptCancelledError, 
  PromptMaxRetriesError,
  LeavesError 
} from 'leaves-guardian';

try {
  const result = await prompt.run(userJid);
} catch (err) {
  if (err instanceof PromptTimeoutError) {
    await client.sendText(userJid, '⏱ Waktu pengisian formulir telah habis. Silakan ketik /start untuk memulai kembali.');
  } else if (err instanceof PromptCancelledError) {
    await client.sendText(userJid, '❌ Proses pendaftaran dibatalkan.');
  } else if (err instanceof PromptMaxRetriesError) {
    await client.sendText(userJid, '🚫 Anda telah mencapai batas maksimal kesalahan input. Hubungi admin.');
  } else if (err instanceof LeavesError) {
    console.error(`Leaves Error [${err.code}]:`, err.message);
  } else {
    console.error('Unexpected non-library error:', err);
  }
}
```

---

### Pattern 2: Code-Based Matching (`err.code`)

Ideal for fine-grained handling of specific subsystem conditions:

```javascript
import { 
  TrafficError, 
  TRAFFIC_ERROR_CODES, 
  MediaError, 
  MEDIA_ERROR_CODES 
} from 'leaves-guardian';

try {
  await client.media.prepareMedia(sourceUrl);
} catch (err) {
  if (err instanceof MediaError) {
    switch (err.code) {
      case MEDIA_ERROR_CODES.SSRF_BLOCKED:
        console.warn('Security Alert: Blocked attempted SSRF destination URL');
        break;
      case MEDIA_ERROR_CODES.SIZE_EXCEEDED:
        console.warn('File rejected: Media exceeds size limit');
        break;
      case MEDIA_ERROR_CODES.FETCH_TIMEOUT:
        console.warn('Network issue: Remote media download timed out');
        break;
      default:
        console.error('Media preparation failed:', err.message);
    }
  }
}
```

---

### Pattern 3: Metadata & Cause Inspection

Inspect context fields and error chains:

```javascript
try {
  await client.send(jid, messageBuilder);
} catch (err) {
  if (err instanceof TrafficError) {
    console.error('Traffic dispatch failed for task:', err.taskId);
    console.error('Destination JID:', err.jid);
    if (err.cause) {
      console.error('Root socket cause:', err.cause);
    }
  }
}
```

---

## 6. Error Handling Boundaries & Guidelines

- **Structured Diagnostic Classification**: Leaves Guardian classifies errors by category and code to provide clear observability.
- **Consumer Responsibility**: The library does not automatically force process exit or retry operations unless explicitly governed by a configured subsystem option (such as `TrafficController` dispatch pacing or `SessionRecovery` snapshots).
- **Application Recovery Strategies**: Application-specific handling strategies—such as prompting the user again, alerting developers, or falling back to alternate transports—can be implemented cleanly based on the documented error classes and codes.
