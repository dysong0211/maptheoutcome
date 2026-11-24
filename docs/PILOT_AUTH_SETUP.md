# MapToc pilot sign-in and AI setup

The app supports Supabase Auth email/password with separate administrator and pilot-user allowlists. There is no public sign-up flow. The dashboard and `/api/ai` are gated when `MAPTOC_REQUIRE_AUTH=true`; the signed-in email must appear in either `MAPTOC_PILOT_ADMIN_EMAILS` or `MAPTOC_PILOT_USER_EMAILS`. Admin emails receive the `admin` role; pilot emails receive the `pilot` role.

The public website and browser-only sample stay at `https://maptoc.org`. Deploy this server-backed Next.js app at `https://maptheoutcome.org`; the root redirects to the signed-in workspace, and unauthenticated users are sent to `/login`. Set `NEXT_PUBLIC_MAPTOC_PILOT_MODE=true` to hide demo role switching and reset controls in the pilot app. The app's Website link returns to `https://maptoc.org`.

## Supabase setup

1. Use the Supabase project intended for the MapToc pilot.
2. Enable email/password sign-in and create one administrator account and one UNDP pilot account in Supabase Authentication. Do not add a public sign-up page. Issue/reset passwords in Supabase; do not share passwords in source control or chat.
3. Set the site URL to `https://maptheoutcome.org` and allow redirects to `https://maptheoutcome.org/login` and `https://maptheoutcome.org/dashboard`.
4. Add these deployment environment variables:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
   MAPTOC_REQUIRE_AUTH=true
   NEXT_PUBLIC_MAPTOC_REQUIRE_AUTH=true
   NEXT_PUBLIC_MAPTOC_PILOT_MODE=true
   NEXT_PUBLIC_WEBSITE_HOME=https://maptoc.org
   MAPTOC_PILOT_ADMIN_EMAILS=admin@example.org
   MAPTOC_PILOT_USER_EMAILS=undp-pilot@example.org
   MAPTOC_APP_ORIGIN=https://maptheoutcome.org
   ```

   Use the exact account emails. Multiple admins or pilot users can be comma-separated. Keep secrets in the hosting provider's environment settings, not in source control.

## OpenAI setup

Add the API key as a server-only hosting secret, then configure:

```env
OPENAI_API_KEY=<OpenAI API project key>
MAPTOC_AI_ENABLED=true
OPENAI_MODEL=<model enabled for the API project>
```

The browser calls MapToc's `/api/ai`; the server verifies the Supabase session and authorized-email allowlists, then uses `OPENAI_API_KEY` for the OpenAI request. Never expose that key as a `NEXT_PUBLIC_` variable. Enable billing limits and review API usage in the OpenAI API organization.

## Deployment requirements and limits

- Deploy the regular server-backed Next.js application. Do not set `MAPTOC_STATIC_EXPORT=1`; static export cannot run the authenticated API route or server session check.
- Keep the app and `/api/ai` on the same authenticated origin so the Supabase session cookie is sent to the endpoint.
- Set `MAPTOC_APP_ORIGIN` to the exact HTTPS origin, with no trailing slash; the API rejects cross-origin POST requests.
- Use a strong password and verified email for the pilot-admin account. This implementation does not yet require MFA assurance (AAL2); add that check if the pilot requires MFA.
- This gate controls access to the app and AI endpoint. Program files and metadata are still stored in each browser; this does not provide shared server storage, per-program permissions, or durable team collaboration. Use only anonymized or synthetic pilot data until protected server-side storage and retention controls are implemented.
- Local development remains open when `MAPTOC_REQUIRE_AUTH` is unset or `false`; AI requests remain localhost-only in that mode.
