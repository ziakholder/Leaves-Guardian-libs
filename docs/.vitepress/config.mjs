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
    ['meta', { name: 'google-site-verification', content: 'O9wKCsyFHXYApIeFGMjG-vNUHP2GMgvwhjX9ImziUos' }],
    ['meta', { name: 'author', content: 'Rafa Dito / Royal Engine Studio' }],

    // OpenGraph Social Sharing (Global)
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Leaves Guardian' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }],
    ['meta', { property: 'og:image:type', content: 'image/png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],

    // Twitter / X Card (Global)
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: '/og-image.png' }]
  ],

  sitemap: {
    hostname: 'https://leavesguardian.enginelabs.my.id'
  },

  transformHead({ pageData }) {
    const head = [];
    const relativePath = pageData.relativePath || '';
    
    // Calculate normalized clean path for canonical URL
    let cleanPath = relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
    
    const canonicalUrl = cleanPath 
      ? `https://leavesguardian.enginelabs.my.id/${cleanPath}` 
      : 'https://leavesguardian.enginelabs.my.id/';

    // Page-specific Canonical URL
    head.push(['link', { rel: 'canonical', href: canonicalUrl }]);

    // Verified EN <-> ID Pairings Map (25 verified parallel routes)
    const enToIdPairMap = {
      '': 'id/',
      'en/': 'id/',
      'en/getting-started/overview': 'id/quickstart/overview',
      'en/getting-started/quickstart': 'id/quickstart/quickstart',
      'en/getting-started/architecture': 'id/quickstart/architecture',
      'en/messaging/schema': 'id/guides/schema',
      'en/builders/overview': 'id/builders/overview',
      'en/builders/text-message': 'id/builders/text-message',
      'en/builders/button-message': 'id/builders/button-message',
      'en/builders/location-message': 'id/builders/location-message',
      'en/builders/list-message': 'id/builders/list-message',
      'en/builders/carousel-message': 'id/builders/carousel-message',
      'en/builders/media-message': 'id/builders/media-message',
      'en/builders/sticker-message': 'id/builders/sticker-message',
      'en/builders/product-message': 'id/builders/product-message',
      'en/builders/poll-message': 'id/builders/poll-message',
      'en/builders/ai-rich-message': 'id/builders/ai-rich-message',
      'en/builders/canvas-message': 'id/builders/canvas-message',
      'en/builders/event-message': 'id/builders/event-message',
      'en/builders/rich-message': 'id/builders/rich-message',
      'en/builders/a2ui-message': 'id/builders/a2ui-message',
      'en/builders/handling-responses': 'id/builders/handling-responses',
      'en/utilities/prompt': 'id/guides/prompts',
      'en/utilities/autodelete': 'id/guides/autodelete',
      'en/reliability/smartstore': 'id/guides/smartstore',
      'en/reliability/message-store': 'id/reliability/message-store',
      'en/reliability/session-recovery': 'id/reliability/session-recovery',
      'en/reliability/health-monitor': 'id/reliability/health-monitor',
      'en/reliability/watchdog': 'id/reliability/watchdog',
      'en/reliability/memory-guard': 'id/reliability/memory-guard',
      'en/reliability/group-cache': 'id/reliability/group-cache',
      'en/traffic/traffic-controller': 'id/traffic/traffic-controller',
      'en/traffic/rate-limiter': 'id/traffic/rate-limiter',
      'en/traffic/deduplicator': 'id/traffic/deduplicator',
      'en/media/media-pipeline': 'id/media/media-pipeline',
      'en/terminal/presentation': 'id/terminal/presentation',
      'en/terminal/privacy-scrubber': 'id/terminal/privacy-scrubber',
      'en/terminal/custom-sinks': 'id/terminal/custom-sinks',
      'en/api/leaves-client': 'id/api/leaves-client',
      'en/api/builder-methods': 'id/api/builder-methods',
      'en/api/subsystems': 'id/api/subsystems',
      'en/api/errors': 'id/api/errors',
      'en/recipes/production-bot': 'id/recipes/production',
      'en/updates/patch-notes': 'id/updates/patch-notes'
    };

    // Inverse map for ID -> EN
    const idToEnPairMap = {};
    for (const [enPath, idPath] of Object.entries(enToIdPairMap)) {
      idToEnPairMap[idPath] = enPath;
    }

    // Determine if current page has a verified counterpart for hreflang
    if (relativePath === 'index.md') {
      head.push(['link', { rel: 'alternate', hreflang: 'x-default', href: 'https://leavesguardian.enginelabs.my.id/' }]);
      head.push(['link', { rel: 'alternate', hreflang: 'en', href: 'https://leavesguardian.enginelabs.my.id/en/' }]);
      head.push(['link', { rel: 'alternate', hreflang: 'id', href: 'https://leavesguardian.enginelabs.my.id/id/' }]);
    } else if (enToIdPairMap[cleanPath] !== undefined) {
      const idTarget = enToIdPairMap[cleanPath];
      head.push(['link', { rel: 'alternate', hreflang: 'en', href: `https://leavesguardian.enginelabs.my.id/${cleanPath}` }]);
      head.push(['link', { rel: 'alternate', hreflang: 'id', href: `https://leavesguardian.enginelabs.my.id/${idTarget}` }]);
      head.push(['link', { rel: 'alternate', hreflang: 'x-default', href: 'https://leavesguardian.enginelabs.my.id/' }]);
    } else if (idToEnPairMap[cleanPath] !== undefined) {
      const enTarget = idToEnPairMap[cleanPath];
      head.push(['link', { rel: 'alternate', hreflang: 'id', href: `https://leavesguardian.enginelabs.my.id/${cleanPath}` }]);
      head.push(['link', { rel: 'alternate', hreflang: 'en', href: `https://leavesguardian.enginelabs.my.id/${enTarget}` }]);
      head.push(['link', { rel: 'alternate', hreflang: 'x-default', href: 'https://leavesguardian.enginelabs.my.id/' }]);
    }

    // Factual JSON-LD Structured Data for Root / Landing Pages (Google Site Name + SoftwareApplication)
    if (relativePath === 'index.md' || relativePath === 'en/index.md' || relativePath === 'id/index.md') {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://leavesguardian.enginelabs.my.id/#website',
            'url': 'https://leavesguardian.enginelabs.my.id/',
            'name': 'Leaves Guardian',
            'alternateName': ['LeavesGuardian', 'Leaves Guardian Docs'],
            'description': 'Documentation for Leaves Guardian, a Baileys wrapper and reliability layer for WhatsApp bots built with Node.js.',
            'publisher': {
              '@type': 'Organization',
              'name': 'Royal Engine Studio',
              'url': 'https://leavesguardian.enginelabs.my.id/'
            }
          },
          {
            '@type': 'SoftwareApplication',
            '@id': 'https://leavesguardian.enginelabs.my.id/#software',
            'name': 'Leaves Guardian',
            'applicationCategory': 'DeveloperApplication',
            'operatingSystem': 'Node.js',
            'description': 'Baileys wrapper and reliability layer for WhatsApp bots built with Node.js.',
            'url': 'https://leavesguardian.enginelabs.my.id/',
            'downloadUrl': 'https://www.npmjs.com/package/leaves-guardian',
            'author': {
              '@type': 'Person',
              'name': 'Rafa Dito',
              'worksFor': {
                '@type': 'Organization',
                'name': 'Royal Engine Studio'
              }
            },
            'license': 'https://opensource.org/licenses/MIT'
          }
        ]
      };
      head.push(['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)]);
    }

    return head;
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      description: 'Documentation for Leaves Guardian, a Baileys wrapper and reliability layer for WhatsApp bots built with Node.js.',
      head: [
        ['meta', { property: 'og:title', content: 'Leaves Guardian - Baileys Wrapper & Reliability Layer' }],
        ['meta', { property: 'og:description', content: 'Documentation for Leaves Guardian, a Baileys wrapper and reliability layer for WhatsApp bots built with Node.js.' }],
        ['meta', { property: 'og:locale', content: 'en_US' }],
        ['meta', { property: 'og:locale:alternate', content: 'id_ID' }],
        ['meta', { name: 'twitter:title', content: 'Leaves Guardian - Baileys Wrapper & Reliability Layer' }],
        ['meta', { name: 'twitter:description', content: 'Documentation for Leaves Guardian, a Baileys wrapper and reliability layer for WhatsApp bots built with Node.js.' }]
      ],
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/getting-started/overview' },
          { text: 'Builders', link: '/en/builders/overview' },
          { text: 'Reliability', link: '/en/reliability/smartstore' },
          { text: 'API Reference', link: '/en/api/leaves-client' },
          { text: 'Patch Notes', link: '/en/updates/patch-notes' }
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
                { text: 'LocationMessage (v0.3.8)', link: '/en/builders/location-message' },
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
                { text: 'A2UIMessage', link: '/en/builders/a2ui-message' },
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
                { text: 'MessageStore (Anti Memory Leak)', link: '/en/reliability/message-store' },
                { text: 'Session Recovery', link: '/en/reliability/session-recovery' },
                { text: 'Health Monitor', link: '/en/reliability/health-monitor' },
                { text: 'Socket Watchdog', link: '/en/reliability/watchdog' },
                { text: 'Memory Guard', link: '/en/reliability/memory-guard' },
                { text: 'Group Metadata Cache', link: '/en/reliability/group-cache' }
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
            },
            {
              text: 'Updates & Release Notes',
              collapsed: false,
              items: [
                { text: 'Native Flow & Silent Drop Patch', link: '/en/updates/patch-notes' }
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
        ['meta', { property: 'og:title', content: 'Leaves Guardian - Wrapper Baileys & Lapisan Keandalan WhatsApp' }],
        ['meta', { property: 'og:description', content: 'Dokumentasi Leaves Guardian, wrapper Baileys dan lapisan keandalan untuk bot WhatsApp di Node.js.' }],
        ['meta', { property: 'og:locale', content: 'id_ID' }],
        ['meta', { property: 'og:locale:alternate', content: 'en_US' }],
        ['meta', { name: 'twitter:title', content: 'Leaves Guardian - Wrapper Baileys & Lapisan Keandalan WhatsApp' }],
        ['meta', { name: 'twitter:description', content: 'Dokumentasi Leaves Guardian, wrapper Baileys dan lapisan keandalan untuk bot WhatsApp di Node.js.' }]
      ],
      themeConfig: {
        nav: [
          { text: 'Panduan Cepat', link: '/id/quickstart/overview' },
          { text: 'Message Builders', link: '/id/builders/overview' },
          { text: 'Recipes', link: '/id/recipes/production' },
          { text: 'Referensi API', link: '/id/api/leaves-client' },
          { text: 'Update Patch', link: '/id/updates/patch-notes' }
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
              text: 'Message Builders',
              collapsed: false,
              items: [
                { text: 'Ringkasan & BaseBuilder', link: '/id/builders/overview' },
                { text: 'TextMessage', link: '/id/builders/text-message' },
                { text: 'ButtonMessage', link: '/id/builders/button-message' },
                { text: 'LocationMessage (v0.3.8)', link: '/id/builders/location-message' },
                { text: 'ListMessage', link: '/id/builders/list-message' },
                { text: 'CarouselMessage', link: '/id/builders/carousel-message' },
                { text: 'MediaMessage', link: '/id/builders/media-message' },
                { text: 'StickerMessage', link: '/id/builders/sticker-message' },
                { text: 'ProductMessage', link: '/id/builders/product-message' },
                { text: 'PollMessage', link: '/id/builders/poll-message' },
                { text: 'AIRichMessage', link: '/id/builders/ai-rich-message' },
                { text: 'CanvasMessage', link: '/id/builders/canvas-message' },
                { text: 'EventMessage', link: '/id/builders/event-message' },
                { text: 'RichMessage', link: '/id/builders/rich-message' },
                { text: 'A2UIMessage', link: '/id/builders/a2ui-message' },
                { text: 'Menangkap Respon Interaktif', link: '/id/builders/handling-responses' }
              ]
            },
            {
              text: 'Panduan Praktis',
              collapsed: false,
              items: [
                { text: 'Skema Pesan Ternormalisasi', link: '/id/guides/schema' },
                { text: 'Interaksi & Tanya Jawab (Prompt)', link: '/id/guides/prompts' },
                { text: 'Auto-Delete & Pesan Sementara', link: '/id/guides/autodelete' },
                { text: 'Penyimpanan Data Ringan (SmartStore)', link: '/id/guides/smartstore' }
              ]
            },
            {
              text: 'Keandalan & Trafik',
              collapsed: false,
              items: [
                { text: 'Penyimpanan Pesan (MessageStore)', link: '/id/reliability/message-store' },
                { text: 'Pemulihan Sesi (Session Recovery)', link: '/id/reliability/session-recovery' },
                { text: 'Health Monitor (Observabilitas)', link: '/id/reliability/health-monitor' },
                { text: 'Socket Watchdog (Liveness)', link: '/id/reliability/watchdog' },
                { text: 'Memory Guard (Mitigasi Memori)', link: '/id/reliability/memory-guard' },
                { text: 'Group Metadata Cache (GroupCache)', link: '/id/reliability/group-cache' },
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
            },
            {
              text: 'Pembaruan & Patch',
              collapsed: false,
              items: [
                { text: 'Catatan Patch & Solusi Native Flow', link: '/id/updates/patch-notes' }
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
      { icon: 'github', link: 'https://github.com/ziakholder/Leaves-Guardian' },
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
