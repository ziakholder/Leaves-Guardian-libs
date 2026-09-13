# Leaves Guardian Documentation Website 🍃

Documentation website for **Leaves Guardian v0.2.0** — Baileys Wrapper & Reliability Layer for WhatsApp Bots.

Built with [VitePress](https://vitepress.dev/).

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start local dev server (default: http://localhost:5173)
npm run docs:dev

# Build static production bundle to docs/.vitepress/dist
npm run docs:build

# Preview production build locally
npm run docs:preview
```

---

## 🏛️ Project Structure

```text
leaves-guardian-docs/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mjs          # VitePress configuration (i18n, nav, sidebar, search)
│   │   └── theme/              # Custom brand styles & Vue components
│   ├── en/                     # English Documentation (Core Reference & Guides)
│   ├── id/                     # Indonesian Documentation (Quickstart, Guides, Recipes)
│   ├── public/                 # Static assets & diagrams
│   └── index.md                # Root entry / redirect
├── package.json
└── README.md
```

---

## 📄 License
MIT © Rafa Dito / Royal Engine Studio
