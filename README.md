# Readspace

A focused text reader built with Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui components powered by Radix UI.

- Paste or type AI responses, prose, JavaScript, Python, or other text.
- Adjust font size from 12–36 px and reading width from 50–100%.
- Switch between light and dark appearances.
- Indentation and line breaks are preserved in a monospaced editor. Long lines wrap.
- Content is literal plain text: Markdown/HTML is not rendered and code never executes.
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

To use an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` when running tests. The tests start their own development server on port 3100 and verify text preservation, font controls, width adjustment, theme persistence, and mobile overflow.

## Deploy to Vercel

Push this repository to GitHub and import it into Vercel. Select the Next.js preset; the default build command (`npm run build`) and output settings work. No database, environment variables, or external services are required.

For a local production server:

```sh
npm run build
npm start
```

UI components live in `src/components/ui`; `components.json` configures the shadcn CLI for future additions.
