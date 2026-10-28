# Readspace

A focused text reader built with Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui components powered by Radix UI.

- Paste or type AI responses, prose, JavaScript, Python, or other text.
- A rounded text area uses the viewport height with an 8px outer inset and stays centered on the full screen, balancing the right sidebar with matching left space. The original logo sits in the upper left. The sidebar becomes a compact rail on mobile.
- Adjust font size from 12–36 px and reading width from 50–100%.
- Choose bundled Manrope, Open Sans, or Inter fonts; code blocks stay monospaced. Font preferences persist in the browser.
- Switch between light and cool gray dark appearances, with a soft aurora background in dark mode.
- Pasting rich text retains headings, emphasis, nested bullet/numbered lists, paragraph indentation, links, code blocks, and tables. Plain-text pastes preserve spaces, tabs, and line breaks. Long lines wrap.
- Clear formatting converts the entire document to plain text, keeping list markers, nesting, code spacing, and line breaks. Undo restores the previous formatting.
- Rich clipboard HTML is sanitized and imported into a restricted editor schema. Scripts, images, frames, and event handlers are discarded; code never executes. Markdown pasted as plain text stays literal.
- Only appearance preferences are stored in localStorage. Text is not persisted or sent to a server; refreshing or closing the page clears it.

## Develop

Use Node.js 20.9+ (Node.js 24 recommended) and npm.

```sh
npm ci
npm run dev
```

## Validate

```sh
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

To use an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` when running tests. The tests start their own development server on port 3100 and verify text preservation, font controls, width adjustment, theme persistence, mobile overflow, full-height layouts with a right sidebar on desktop, mobile, and landscape screens, rich clipboard content, clear formatting/undo, and paste sanitization.

## Deploy to Vercel

Push this repository to GitHub and import it into Vercel. Select the Next.js preset; the default build command (`npm run build`) and output settings work. No database, environment variables, or external services are required.

For a local production server:

```sh
npm run build
npm start
```

UI components live in `src/components/ui`; `components.json` configures the shadcn CLI for future additions.
