# 🍃 LEAVES GUARDIAN v0.2.0 — DOCUMENTATION SOURCE MAP

> **Purpose:** Trace every planned documentation page to its verified source implementation, frozen architectural contract, and test suite.  
> **Rule:** No documentation statement shall be authored without direct traceability to an existing source file and verified contract.

---

## 🗺️ Master Source Map Table

### 1. Getting Started & Core Concepts
| Target Page Path | Title | Source Implementation | Frozen Contract / Layer | Test Suite Reference | Status |
|---|---|---|---|---|---|
| `en/getting-started/overview.md` | Overview & Philosophy | `main/index.js`, `main/client/LeavesClient.js` | Layer 2 Facade Contract | `tests/client.test.js` | ⏳ Pending Authoring |
| `en/getting-started/installation.md`| Installation & Setup | `package.json` | Node >= 18, ESM | `package.json` engines | ⏳ Pending Authoring |
| `en/getting-started/quickstart.md` | Quick Start Guide | `main/client/LeavesClient.js` | Layer 2 Facade | `tests/client.test.js` | ⏳ Pending Authoring |
| `en/getting-started/authentication.md`| Authentication Modes | `main/client/SessionManager.js`, `ConnectionManager.js` | QR & Pairing Contract | `tests/client.test.js`, `tests/reconnect.test.js` | ⏳ Pending Authoring |
| `en/getting-started/architecture.md`| Architecture & Lifecycle | `main/client/LeavesClient.js`, `ConnectionManager.js` | State Machine (`CLIENT_STATES`) | `tests/hardening-lifecycle.test.js` | ⏳ Pending Authoring |

---

### 2. Core Messaging
| Target Page Path | Title | Source Implementation | Frozen Contract / Layer | Test Suite Reference | Status |
|---|---|---|---|---|---|
| `en/messaging/schema.md` | Normalized Message Schema | `main/message/Message.js`, `MessageNormalizer.js` | Message Contract | `tests/normalizer.test.js`, `tests/hardening-normalizer.test.js` | ⏳ Pending Authoring |
| `en/messaging/sending-text.md` | Sending Text Messages | `main/client/LeavesClient.js` (`sendText`) | Outbound Message Contract | `tests/client.test.js` | ⏳ Pending Authoring |
| `en/messaging/dispatching.md` | Message Dispatching | `main/client/LeavesClient.js` (`sendMessage`, `send`) | Egress Dispatch Contract | `tests/traffic-controller.test.js` | ⏳ Pending Authoring |
| `en/messaging/incoming-events.md`| Incoming Messages & Events | `main/client/EventManager.js`, `LeavesClient.js` | Event Pipeline Contract | `tests/client.test.js` | ⏳ Pending Authoring |
| `en/messaging/deleting.md` | Deleting Messages | `main/client/LeavesClient.js` (`deleteMessage`) | Delete Protocol Contract | `tests/autodelete.test.js` | ⏳ Pending Authoring |

---

### 3. Message Builders (12 Concrete Builders + BaseBuilder)
| Target Page Path | Title | Source Implementation | Frozen Contract / Layer | Test Suite Reference | Status |
|---|---|---|---|---|---|
| `en/builders/overview.md` | Builders & `BaseBuilder` | `main/models/base-builder.js` | Layer 1 BaseBuilder | `tests/new-builders.test.js` | ⏳ Pending Authoring |
| `en/builders/text-message.md` | `TextMessage` | `main/models/text-message.js` | Layer 1 Builder | `tests/new-builders.test.js` | ⏳ Pending Authoring |
| `en/builders/button-message.md` | `ButtonMessage` | `main/models/button-message.js` | Layer 1 Native Flow Buttons | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/list-message.md` | `ListMessage` | `main/models/list-message.js` | Layer 1 Native Flow Lists | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/carousel-message.md`| `CarouselMessage` | `main/models/carousel-message.js` | Layer 1 Cards Carousel | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/media-message.md` | `MediaMessage` | `main/models/media-message.js` | Layer 1 Media Unified | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/sticker-message.md`| `StickerMessage` | `main/models/sticker-message.js` | Layer 1 WebP EXIF Sticker | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/product-message.md`| `ProductMessage` | `main/models/product-message.js` | Layer 1 Product Catalog | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/poll-message.md` | `PollMessage` | `main/models/poll-message.js` | Layer 1 WhatsApp Polls | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/ai-rich-message.md`| `AIRichMessage` | `main/models/ai-rich-message.js` | Layer 1 Meta AI Cards | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/canvas-message.md` | `CanvasMessage` | `main/models/canvas-message.js` | Layer 1 Mini App Container | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/event-message.md` | `EventMessage` | `main/models/event-message.js` | Layer 1 Group Events | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/rich-message.md` | `RichMessage` | `main/models/rich-message.js` | Layer 1 ASCII Box/Tables | `tests/new-builders.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |
| `en/builders/handling-responses.md`| Interactive Responses | `main/message/MessageNormalizer.js` | Button/List Ingress Contract | `tests/normalizer.test.js`, `HANDLER_GUIDE.md` | ⏳ Pending Authoring |

---

### 4. Developer Utilities
| Target Page Path | Title | Source Implementation | Frozen Contract / Layer | Test Suite Reference | Status |
|---|---|---|---|---|---|
| `en/utilities/collector.md` | Message Collector | `main/collector/MessageCollector.js` | Layer 4.1 Collector Contract | `tests/collector.test.js` | ⏳ Pending Authoring |
| `en/utilities/prompt.md` | Interactive Prompts | `main/prompt/Prompt.js` | Layer 4.2 Prompt Wizard | `tests/prompt.test.js` | ⏳ Pending Authoring |
| `en/utilities/paginator.md` | Interactive Paginator | `main/paginator/Paginator.js` | Layer 4.3 Paginator Contract | `tests/paginator.test.js` | ⏳ Pending Authoring |
| `en/utilities/autodelete.md` | Auto-Delete Manager | `main/autodelete/AutoDeleteManager.js` | Layer 4.4 Auto-Delete (`delay >= 0`) | `tests/autodelete.test.js` | ⏳ Pending Authoring |
| `en/utilities/ephemeral.md` | Ephemeral Messages | `main/ephemeral/EphemeralMessage.js` | Layer 4.5 Protocol Disappearing | `tests/ephemeral.test.js` | ⏳ Pending Authoring |

---

### 5. Reliability & Runtime Subsystems
| Target Page Path | Title | Source Implementation | Frozen Contract / Layer | Test Suite Reference | Status |
|---|---|---|---|---|---|
| `en/reliability/smartstore.md` | SmartStore KV Store | `main/smartstore/SmartStore.js` | Layer 3.1 Store Contract | `tests/smartstore.test.js` | ⏳ Pending Authoring |
| `en/reliability/session-recovery.md`| Session Recovery | `main/recovery/SessionRecovery.js` | Layer 3.2 Recovery Contract | `tests/session-recovery.test.js` | ⏳ Pending Authoring |
| `en/reliability/health-monitor.md`| Health Monitor | `main/health/HealthMonitor.js` | Layer 3.3 Health Observability | `tests/health-monitor.test.js` | ⏳ Pending Authoring |
| `en/reliability/watchdog.md` | Socket Watchdog | `main/watchdog/Watchdog.js` | Layer 3.4 Liveness Watchdog | `tests/watchdog.test.js` | ⏳ Pending Authoring |
| `en/reliability/memory-guard.md`| Memory Guard | `main/memory/MemoryGuard.js` | Layer 3.5 Memory Mitigations | `tests/memory-guard.test.js` | ⏳ Pending Authoring |

---

### 6. Traffic, Media & Ingress Infrastructure
| Target Page Path | Title | Source Implementation | Frozen Contract / Layer | Test Suite Reference | Status |
|---|---|---|---|---|---|
| `en/traffic/controller.md` | Traffic Controller | `main/traffic/TrafficController.js` | Layer 5.1 Egress Traffic Control | `tests/traffic-controller.test.js` | ⏳ Pending Authoring |
| `en/traffic/media-pipeline.md` | Media Pipeline & SSRF | `main/media/MediaPipeline.js`, `SourceResolver.js` | Layer 5.2 Media Pipeline | `tests/media-pipeline.test.js` | ⏳ Pending Authoring |
| `en/traffic/rate-limiter.md` | Inbound Rate Limiting | `main/limiter/IngressRateLimiter.js` | Layer 5.3 Ingress Rate Limiter | `tests/ingress-rate-limiter.test.js` | ⏳ Pending Authoring |
| `en/traffic/deduplicator.md` | Ingress Deduplication | `main/dedup/IngressDeduplicator.js` | Layer 5.4 Ingress Deduplicator | `tests/ingress-deduplicator.test.js` | ⏳ Pending Authoring |

---

### 7. Terminal & Presentation
| Target Page Path | Title | Source Implementation | Frozen Contract / Layer | Test Suite Reference | Status |
|---|---|---|---|---|---|
| `en/terminal/presentation.md` | Terminal Presentation | `main/terminal/TerminalManager.js` | Layer 5.5 Presentation Engine | `tests/terminal-presentation.test.js` | ⏳ Pending Authoring |
| `en/terminal/privacy-scrubber.md`| Privacy Scrubber | `main/terminal/PresentationSanitizer.js` | PII Phone Masking Contract | `tests/terminal.test.js` | ⏳ Pending Authoring |
| `en/terminal/custom-sinks.md` | Custom Sinks & Sinks | `main/terminal/OutputSink.js`, `TerminalRenderer.js` | Sinks & Renderers Contract | `tests/terminal-presentation.test.js` | ⏳ Pending Authoring |

---

### 8. API Reference & Error Appendix
| Target Page Path | Title | Source Implementation | Frozen Contract / Layer | Test Suite Reference | Status |
|---|---|---|---|---|---|
| `en/api/leaves-client.md` | `LeavesClient` Full API | `main/client/LeavesClient.js` | Facade Public Contract | `tests/client.test.js` | ⏳ Pending Authoring |
| `en/api/builder-methods.md` | Builder Methods Cheatsheet | `main/models/base-builder.js` | BaseBuilder Fluent Surface | `tests/new-builders.test.js` | ⏳ Pending Authoring |
| `en/api/subsystems.md` | Subsystems & Constants | `main/index.js` (Constants & Enums) | 165 Named Exports Map | All test suites | ⏳ Pending Authoring |
| `en/api/errors.md` | Complete Error Hierarchy | `main/errors/LeavesError.js` | Error Hierarchy Contract | All test suites | ⏳ Pending Authoring |

---

### 9. Indonesian Guides & Recipes
| Target Page Path | Title | Source Implementation | Frozen Contract / Layer | Test Suite Reference | Status |
|---|---|---|---|---|---|
| `id/quickstart/overview.md` | Pengenalan & Filosofi | `main/index.js`, `README.md` | Core Philosophy | — | ⏳ Pending Authoring |
| `id/quickstart/quickstart.md`| Instalasi & Quick Start | `main/client/LeavesClient.js` | Quickstart Contract | `tests/client.test.js` | ⏳ Pending Authoring |
| `id/quickstart/authentication.md`| Mode Autentikasi | `main/client/SessionManager.js` | Auth Contract | `tests/client.test.js` | ⏳ Pending Authoring |
| `id/guides/builders.md` | Panduan 12 Builders | `main/models/*.js`, `HANDLER_GUIDE.md` | 12 Concrete Builders | `tests/new-builders.test.js` | ⏳ Pending Authoring |
| `id/guides/handling-responses.md`| Menangkap Respon Tombol | `main/message/MessageNormalizer.js` | Button/List Ingress Contract | `tests/normalizer.test.js` | ⏳ Pending Authoring |
| `id/guides/prompts.md` | Tanya Jawab (Prompt) | `main/prompt/Prompt.js` | Prompt Contract | `tests/prompt.test.js` | ⏳ Pending Authoring |
| `id/guides/autodelete.md` | Auto-Delete & Ephemeral | `main/autodelete/AutoDeleteManager.js` | Auto-Delete Contract | `tests/autodelete.test.js` | ⏳ Pending Authoring |
| `id/guides/smartstore.md` | SmartStore Data Ringan | `main/smartstore/SmartStore.js` | SmartStore Contract | `tests/smartstore.test.js` | ⏳ Pending Authoring |
| `id/recipes/production.md` | Bot Produksi 24/7 | `main/client/LeavesClient.js` | Layer 3 & Layer 5 Integration | All test suites | ⏳ Pending Authoring |
| `id/recipes/registration.md`| Bot Registrasi Multi-Step| `main/prompt/Prompt.js`, `SmartStore.js`| Prompt + Store Workflow | `tests/prompt.test.js` | ⏳ Pending Authoring |
| `id/recipes/catalog.md` | Bot Menu Katalog | `main/models/product-message.js`, `list-message.js`| Builder Interactive | `tests/new-builders.test.js` | ⏳ Pending Authoring |
| `id/recipes/troubleshooting.md`| Troubleshooting & FAQ | `main/client/ReconnectManager.js`, `LeavesError.js` | Disconnect & Error Codes | `tests/hardening-disconnect.test.js` | ⏳ Pending Authoring |
