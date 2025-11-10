# Handle Chat Widget

A floating chat experience that any site can install with a single `<script>` tag. The widget is built with React + TypeScript, renders inside a Shadow DOM to avoid CSS conflicts, and ships as an IIFE bundle (`dist/widget.js`) ready for a CDN.

## Features
- Auto-detects its embed script, reads `data-client-id`, and silently aborts if it is missing.
- Fetches client configuration from `https://api.byhandle.ai/client-config/{clientId}` (or an overridden endpoint) to theme the UI.
- Shadow DOM isolation plus Tailwind-generated CSS scoped to the widget.
- Smooth bubble → panel animation, closable modal, and simple optimistic messaging flow powered by a React context store.
- Emits `CustomEvent`s (`byhandle-chat-event`) so hosts can hook into analytics (`chat_opened`, `chat_closed`, `message_sent`).

## Local Development
```bash
npm install      # first run
npm run dev      # serves index.html for the demo harness
```

- Update `public/mock-config.json` to preview different branding locally.
- The dev harness (`src/main.tsx`) simply renders instructions and calls `initHandleChat` so you can interact with the floating widget in the bottom-right corner.

## Production Build
```bash
npm run build
```
Outputs `dist/widget.js` (IIFE + sourcemap) which is ready to upload to `https://cdn.byhandle.ai/widget.js`.

## Embedding
```html
<script
  src="https://cdn.byhandle.ai/widget.js"
  data-client-id="abc123"
  data-config-url="https://api.byhandle.ai/client-config/abc123"  <!-- optional -->
  data-logo-url="https://kleknnxdnspllqliaong.supabase.co/storage/v1/object/public/handle/logo.jpeg"  <!-- optional -->
  data-brand-name="Handle"  <!-- optional -->
></script>
```

- `data-client-id` – **required**. Logged as a warning and the widget aborts if missing.
- `data-config-url` – optional override (useful for staging or testing). If omitted, the widget fetches `https://api.byhandle.ai/client-config/{clientId}` automatically.
- `data-logo-url` – optional. URL to your brand logo to display in the widget header.
- `data-brand-name` – optional. Your brand name to display in the widget header.

The script exposes `window.ByHandleChat.init({ clientId, configEndpoint?, logoUrl?, brandName? })` in case you need to initialize manually.

## Analytics Events
Listen for `window.addEventListener('byhandle-chat-event', handler)` to receive:

| Event          | Shape                                                 |
| -------------- | ----------------------------------------------------- |
| `chat_opened`  | `{ type: 'chat_opened', clientId }`                   |
| `chat_closed`  | `{ type: 'chat_closed', clientId }`                   |
| `message_sent` | `{ type: 'message_sent', clientId, content: string }` |

## Implementation Notes
- The widget mounts itself via `ReactDOM.createRoot` inside a Shadow DOM host so styles never bleed into the host page.
- The UI styling is powered by Tailwind CSS utilities plus CSS variables for runtime branding.
- Message history and optimistic bot replies are handled through a lightweight context (`MessageProvider`).
- Errors while fetching client configuration fall back to a safe default theme and log a warning, ensuring the embed never crashes the host site.
