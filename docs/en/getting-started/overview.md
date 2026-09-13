# Overview & Philosophy

**Leaves Guardian** is an **Enterprise Baileys Wrapper & Infrastructure Library** for building robust, high-reliability WhatsApp bot applications in Node.js.

It sits directly between [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) and your application code, providing connection stability, message normalization, traffic scheduling, observability, and developer utilities.

---

## The Mental Model

Leaves Guardian is not designed to replace your bot's business logic, but to handle the complex, error-prone infrastructure required to run Baileys reliably in production.

```
┌────────────────────────────────────────────────────────┐
│               Developer Application                    │
│      (Your Bot Logic, Commands, Storage & Handlers)    │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Leaves Guardian                       │
│    • Normalized Message Schema  • Traffic Controller   │
│    • Lifecycle State Machine    • Ingress Rate Limiter │
│    • Health & Socket Watchdog   • Message Builders     │
│    • Memory Guard Mitigation    • Developer Utilities  │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 @whiskeysockets/baileys                │
│             (Raw WhatsApp WebSocket Protocol)          │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    WhatsApp Servers                    │
└────────────────────────────────────────────────────────┘
```

---

## What Leaves Guardian Is (And What It Is Not)

To maintain clean architectural boundaries, Leaves Guardian explicitly defines its responsibilities:

### ✅ What Leaves Guardian IS:
- **An Infrastructure Library**: An NPM package providing high-resilience primitives on top of Baileys.
- **A Message Normalizer**: A standardizer that converts complex, nested Baileys protobuf objects into predictable, immutable data structures.
- **A Reliability & Observability Engine**: Built-in subsystems for health monitoring, socket activity watchdog, memory observation, and graceful recovery.
- **A Traffic & Ingress Manager**: Egress message pacing with priority queuing alongside inbound rate-limiting and deduplication.
- **A Message Builder Toolkit**: High-level fluent builders for buttons, lists, carousels, polls, stickers, and interactive media.

### ❌ What Leaves Guardian IS NOT:
- **NOT a Bot Framework**: It does not enforce an opinionated command routing structure or message handler framework.
- **NOT a Plugin Framework**: It does not manage plugin lifecycles, sandbox execution, or plugin dependencies.
- **NOT a Multi-Tenant Orchestrator**: It manages single client sessions and infrastructure; orchestrating multi-account clusters belongs in your application layer.
- **NOT a Database Replacement**: While it includes `SmartStore` for lightweight in-memory/JSON state and session recovery, it is not a primary relational or document database.

---

## Design Principles

### 1. Zero Mutation & Immutability
All incoming messages normalized by Leaves Guardian are deeply frozen. Your application logic cannot accidentally mutate properties of an incoming message, preventing subtle state bugs across asynchronous event listeners.

### 2. Explicit Lifecycle State Machine
WhatsApp connections pass through distinct phases. Leaves Guardian models this via an unambiguous state machine (`IDLE` ➔ `INITIALIZING` ➔ `AUTHENTICATING` ➔ `CONNECTING` ➔ `OPEN` ➔ `READY`). The core invariant **`OPEN !== READY`** guarantees your bot will not attempt message dispatch before session authentication is fully verified.

### 3. Separation of Ingress & Egress Controls
- **Ingress (Inbound)**: Handled by `IngressRateLimiter` using a sliding-window tracker to monitor and limit request bursts per sender.
- **Egress (Outbound)**: Handled by `TrafficController` using priority queuing, pacing, and starvation prevention to coordinate dispatches cleanly to WhatsApp.

### 4. Failure Containment & Subsystem Isolation
Failures within non-critical subsystems (such as a prompt timeout, collector expiration, or temporary rate limit trigger) are strictly contained and will never crash the underlying WebSocket connection.

---

## Next Steps

- **[Quick Start Guide](/en/getting-started/quickstart)**: Create and run your first Leaves Guardian client in under 5 minutes.
- **[Architecture & Lifecycle](/en/getting-started/architecture)**: Explore the 5-layer conceptual architecture and state lifecycle.
- **[Normalized Message Schema](/en/messaging/schema)**: Understand the unified, immutable message contract.
