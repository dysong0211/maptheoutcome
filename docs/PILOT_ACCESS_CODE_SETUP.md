# MapToc pilot access code

The shared-code mode gates the workspace and AI route without creating individual accounts. A successful code entry creates a 12-hour, signed, HTTP-only session cookie. The code and session signing secret stay on the server. The pilot stores workspace data in the browser, so use synthetic or anonymized information only; a shared code does not identify individual users or provide per-person access control.

The intended arrangement is `maptoc.org` for the public website and no-live-AI demo, and `maptheoutcome.org` for the server-backed pilot. On `maptheoutcome.org`, the app root redirects to `/pilot/` until the user enters the code; after entry, the workspace opens on that same domain. Leave `MAPTOC_BASE_PATH` unset for this separate-domain arrangement.

## Configure

Set these server environment variables on the Next.js host:

```env
MAPTOC_ACCESS_CODE_ENABLED=true
MAPTOC_ACCESS_CODE=<shared pilot code>
MAPTOC_ACCESS_SESSION_SECRET=<random secret of at least 32 characters>
NEXT_PUBLIC_MAPTOC_ACCESS_CODE_ENABLED=true
MAPTOC_APP_ORIGIN=https://maptheoutcome.org
OPENAI_API_KEY=<server-side OpenAI API key>
OPENAI_MODEL=<model enabled for the API project>
MAPTOC_AI_ENABLED=true
```

For local development, place the same settings in `.env.local`. Generate a signing secret with `openssl rand -hex 32`. Do not commit `.env.local`, the access code, or API keys.

## Routes and behavior

- `/pilot/` displays the access-code entry page. The app root redirects there until a session exists.
- `/api/pilot/access` verifies the code and issues the expiring cookie; `DELETE` clears it.
- Dashboard routes and `/api/ai` require a valid pilot session when shared-code mode is enabled.
- Set `MAPTOC_APP_ORIGIN` to `https://maptheoutcome.org` (or the exact pilot origin you deploy), without a trailing slash. If the app is later served under a subpath, set `MAPTOC_BASE_PATH` and `NEXT_PUBLIC_MAPTOC_BASE_PATH` to that prefix and configure the host to route it to Next.js.
- Keep `/demo/` as a separate static, no-live-AI public demo.

This is a lightweight pilot gate, not full user authentication. Anyone with the shared code can enter, and rotating the code revokes future access but does not attribute past activity to a person.
