import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Leaves Guardian',
  description: 'Documentation for Leaves Guardian, a Baileys wrapper and reliability layer for WhatsApp bots built with Node.js.',
  
  head: [
    // Branding & Favicon
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#10b981' }],

    // Search Engines & Indexing
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { name: 'author', content: 'Rafa Dito / Royal Engine Studio' }],

    // OpenGraph Social Sharing (Global)
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Leaves Guardian Documentation' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }],
    ['meta', { property: 'og:image:type', content: 'image/png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],

    // Twitter / X Card (Global)
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: '/og-image.png' }]
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      description: 'Documentation for Leaves Guardian, a Baileys wrapper and reliability layer for WhatsApp bots built with Node.js.',
      head: [
        ['meta', { property: 'og:title', content: 'Leaves Guardian — Baileys Wrapper & Reliability Layer' }],
        ['meta', { property: 'og:description', content: 'Documentation for Leaves Guardian, a Baileys wrapper and reliability layer for WhatsApp bots built with Node.js.' }],
        ['meta', { property: 'og:locale', content: 'en_US' }],
        ['meta', { property: 'og:locale:alternate', content: 'id_ID' }],
        ['meta', { name: 'twitter:title', content: 'Leaves Guardian — Baileys Wrapper & Reliability Layer' }],
        ['meta', { name: 'twitter:description', content: 'Documentation for Leaves Guardian, a Baileys wrapper and reliability layer for WhatsApp bots built with Node.js.' }]
      ],
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/getting-started/overview' },
          { text: 'Builders', link: '/en/builders/overview' },
          { text: 'Reliability', link: '/en/reliability/smartstore' },
          { text: 'API Reference', link: '/en/api/leaves-client' }
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Getting Started',
              collapsed: false,
              items: [
                { text: 'Overview & Philosophy', link: '/en/getting-started/overview' },
                { text: 'Quick Start & Setup', link: '/en/getting-started/quickstart' },
                { text: 'Architecture & Lifecycle', link: '/en/getting-started/architecture' }
              ]
            },
            {
              text: 'Core Messaging',
              collapsed: false,
              items: [
                { text: 'Normalized Message Schema', link: '/en/messaging/schema' },
                { text: 'Sending Text Messages', link: '/en/messaging/sending-text' },
                { text: 'Message Dispatching', link: '/en/messaging/dispatching' },
                { text: 'Incoming Messages & Events', link: '/en/messaging/incoming-events' },
                { text: 'Deleting Messages', link: '/en/messaging/deleting' }
              ]
            },
            {
              text: 'Message Builders',
              collapsed: false,
              items: [
                { text: 'Builders Overview & BaseBuilder', link: '/en/builders/overview' },
                { text: 'TextMessage', link: '/en/builders/text-message' },
                { text: 'ButtonMessage', link: '/en/builders/button-message' },
                { text: 'ListMessage', link: '/en/builders/list-message' },
                { text: 'CarouselMessage', link: '/en/builders/carousel-message' },
                { text: 'MediaMessage', link: '/en/builders/media-message' },
                { text: 'StickerMessage', link: '/en/builders/sticker-message' },
                { text: 'ProductMessage', link: '/en/builders/product-message' },
                { text: 'PollMessage', link: '/en/builders/poll-message' },
                { text: 'AIRichMessage', link: '/en/builders/ai-rich-message' },
                { text: 'CanvasMessage', link: '/en/builders/canvas-message' },
                { text: 'EventMessage', link: '/en/builders/event-message' },
                { text: 'RichMessage', link: '/en/builders/rich-message' },
                { text: 'Interactive Click Responses', link: '/en/builders/handling-responses' }
              ]
            },
            {
              text: 'Developer Utilities',
              collapsed: true,
              items: [
                { text: 'Message Collector', link: '/en/utilities/collector' },
                { text: 'Interactive Prompts', link: '/en/utilities/prompt' },
                { text: 'Interactive Paginator', link: '/en/utilities/paginator' },
                { text: 'Auto-Delete Manager', link: '/en/utilities/autodelete' },
                { text: 'Ephemeral Messages', link: '/en/utilities/ephemeral' }
              ]
            },
            {
              text: 'Reliability & Runtime',
              collapsed: true,
              items: [
                { text: 'SmartStore (KV Store)', link: '/en/reliability/smartstore' },
                { text: 'Session Recovery', link: '/en/reliability/session-recovery' },
                { text: 'Health Monitor', link: '/en/reliability/health-monitor' },
                { text: 'Socket Watchdog', link: '/en/reliability/watchdog' },
                { text: 'Memory Guard', link: '/en/reliability/memory-guard' }
              ]
            },
            {
              text: 'Traffic & Ingress',
              collapsed: true,
              items: [
                { text: 'Traffic Controller', link: '/en/traffic/traffic-controller' },
                { text: 'Media Pipeline & SSRF', link: '/en/media/media-pipeline' },
                { text: 'Inbound Rate Limiting', link: '/en/traffic/rate-limiter' },
                { text: 'Ingress Deduplication', link: '/en/traffic/deduplicator' }
              ]
            },
            {
              text: 'Terminal & Logging',
              collapsed: true,
              items: [
                { text: 'Terminal Presentation', link: '/en/terminal/presentation' },
                { text: 'Privacy Scrubber', link: '/en/terminal/privacy-scrubber' },
                { text: 'Custom Sinks & Renderers', link: '/en/terminal/custom-sinks' }
              ]
            },
            {
              text: 'API Reference',
              collapsed: true,
              items: [
                { text: 'LeavesClient Reference', link: '/en/api/leaves-client' },
                { text: 'Builder Methods Cheatsheet', link: '/en/api/builder-methods' },
                { text: 'Subsystems & Constants', link: '/en/api/subsystems' },
                { text: 'Error Hierarchy & Codes', link: '/en/api/errors' }
              ]
            },
            {
              text: 'Recipes & Production',
              collapsed: true,
              items: [
                { text: 'High-Availability Production Bot', link: '/en/recipes/production-bot' }
              ]
            }
          ]
        }
      }
    },
    id: {
      label: 'Bahasa Indonesia',
      lang: 'id',
      link: '/id/',
      description: 'Dokumentasi Leaves Guardian, wrapper Baileys dan lapisan keandalan untuk bot WhatsApp di Node.js.',
      head: [
        ['meta', { property: 'og:title', content: 'Leaves Guardian — Wrapper Baileys & Lapisan Keandalan WhatsApp' }],
        ['meta', { property: 'og:description', content: 'Dokumentasi Leaves Guardian, wrapper Baileys dan lapisan keandalan untuk bot WhatsApp di Node.js.' }],
        ['meta', { property: 'og:locale', content: 'id_ID' }],
        ['meta', { property: 'og:locale:alternate', content: 'en_US' }],
        ['meta', { name: 'twitter:title', content: 'Leaves Guardian — Wrapper Baileys & Lapisan Keandalan WhatsApp' }],
        ['meta', { name: 'twitter:description', content: 'Dokumentasi Leaves Guardian, wrapper Baileys dan lapisan keandalan untuk bot WhatsApp di Node.js.' }]
      ],
      themeConfig: {
        nav: [
          { text: 'Panduan Cepat', link: '/id/quickstart/overview' },
          { text: 'Message Builders', link: '/id/guides/builders' },
          { text: 'Recipes', link: '/id/recipes/production' },
          { text: 'Referensi API', link: '/id/api/leaves-client' }
        ],
        sidebar: {
          '/id/': [
            {
              text: 'Panduan Cepat',
              collapsed: false,
              items: [
                { text: 'Pengenalan & Filosofi', link: '/id/quickstart/overview' },
                { text: 'Instalasi & Quick Start', link: '/id/quickstart/quickstart' },
                { text: 'Arsitektur & Siklus Hidup', link: '/id/quickstart/architecture' }
              ]
            },
            {
              text: 'Panduan Praktis',
              collapsed: false,
              items: [
                { text: 'Skema Pesan Ternormalisasi', link: '/id/guides/schema' },
                { text: 'Panduan 12 Message Builders', link: '/id/guides/builders' },
                { text: 'Menangkap Respon Tombol & Menu', link: '/id/guides/handling-responses' },
                { text: 'Interaksi & Tanya Jawab (Prompt)', link: '/id/guides/prompts' },
                { text: 'Auto-Delete & Pesan Sementara', link: '/id/guides/autodelete' },
                { text: 'Penyimpanan Data Ringan (SmartStore)', link: '/id/guides/smartstore' }
              ]
            },
            {
              text: 'Keandalan & Trafik',
              collapsed: false,
              items: [
                { text: 'Pemulihan Sesi (Session Recovery)', link: '/id/reliability/session-recovery' },
                { text: 'Health Monitor (Observabilitas)', link: '/id/reliability/health-monitor' },
                { text: 'Socket Watchdog (Liveness)', link: '/id/reliability/watchdog' },
                { text: 'Memory Guard (Mitigasi Memori)', link: '/id/reliability/memory-guard' },
                { text: 'Traffic Controller (Antrean & Pacing)', link: '/id/traffic/traffic-controller' },
                { text: 'Ingress Rate Limiter', link: '/id/traffic/rate-limiter' },
                { text: 'Ingress Deduplicator', link: '/id/traffic/deduplicator' },
                { text: 'Media Pipeline & SSRF', link: '/id/media/media-pipeline' }
              ]
            },
            {
              text: 'Terminal & Logging',
              collapsed: true,
              items: [
                { text: 'Presentasi Terminal', link: '/id/terminal/presentation' },
                { text: 'Penyensor Privasi (Scrubber)', link: '/id/terminal/privacy-scrubber' },
                { text: 'Custom Sinks & Renderers', link: '/id/terminal/custom-sinks' }
              ]
            },
            {
              text: 'Referensi API',
              collapsed: true,
              items: [
                { text: 'LeavesClient', link: '/id/api/leaves-client' },
                { text: 'Message Builders', link: '/id/api/builder-methods' },
                { text: 'Subistem & Konstanta', link: '/id/api/subsystems' },
                { text: 'Hierarki Error & Kode', link: '/id/api/errors' }
              ]
            },
            {
              text: 'Recipes & Contoh Nyata',
              collapsed: false,
              items: [
                { text: 'Bot Produksi 24/7 Tahan Banting', link: '/id/recipes/production' }
              ]
            }
          ]
        }
      }
    }
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Leaves Guardian',
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/royal-engine/leaves-guardian' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/leaves-guardian' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Rafa Dito / Royal Engine Studio'
    }
  }
});
