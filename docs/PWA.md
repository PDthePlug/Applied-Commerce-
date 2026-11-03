# Applied Commerce PWA

This release makes the existing Applied Commerce site installable, with the current AC brand and safe offline recovery. It does not change curriculum, response identities, authentication, roles, database schema or the account-scoped saving protocol.

## Learner experience

- Open Menu → Profile → Install Applied Commerce. The install action is a compact, closed disclosure under Account, following BIS’s Profile pattern. Expanding it offers one native install button when available, otherwise two short steps for the current device. Offline information stays behind a separate disclosure. Installed app windows hide the install action.
- The installed app launches at `/` in a standalone window. Its home screen icons use the existing `app/icon.svg` AC mark, rasterised at 192, 512 and Apple 180 pixels; a separate 512-pixel maskable icon has a full background.
- Losing connectivity displays a notice. An already loaded lesson can keep using the existing local save controls. Successful device saves are preserved, and the existing learning store retries pending account changes on reconnect with its revision/conflict rules.
- A full document navigation or refresh that fails without a network displays a self-contained recovery page. Its retry link retries the original URL; the page does not inspect or expose saved learner data.

**Installation does not download lessons.** Opening pages, loading curriculum, signing in and staff tools need a connection. In-app RSC requests retain their network errors; the worker never substitutes HTML for RSC or API responses. Downloadable, release-consistent curriculum and offline reopening of lessons require a separate implementation and acceptance pass.

## Cache and update contract

`public/sw.js` registers once in production over HTTPS (localhost is accepted for local verification), with browser HTTP caching disabled for the worker. PWA assets bypass the Supabase session-refresh proxy.

The worker stores only `/offline.html` and the four public `/pwa/` icons in `applied-commerce-pwa-v1`. Those exact assets are served from that cache. Other document navigations use the network and fall back only when fetching throws. HTTP errors keep their actual status. Auth routes, API requests, RSC, curriculum, non-GET requests and cross-origin traffic are not intercepted or cached. No teacher content, authenticated page, answer, token, account response or signed file URL enters this cache.

Replacement workers wait for existing app windows to close. No `skipWaiting`, forced refresh or in-flight-write interruption is introduced. Activation removes only older caches with this app's PWA prefix, preserving localStorage and unrelated caches. Change `CACHE_NAME` when changing the offline page or icon release; include that change in the worker so browsers detect it.

## Validation

- Runtime preflight: five grades, 395 lessons, four assessments and all 20,766 stable content blocks verified.
- 245 Node tests pass, including five PWA tests exercising public-only caching, scoped cache cleanup, online freshness, offline fallback/icons and excluded request classes.
- TypeScript, ESLint and a local-mode production build pass.
- All 261 repository-wide Chromium journeys pass in the final run, covering existing learner/presentation/settings/portfolio/auth-gate behaviour as well as the new PWA tests. Final command: `AC_BROWSER_EXECUTABLE=/tmp/ac-pwa-chromium/chromium npx playwright test --config=playwright.config.mjs --workers=4 --output=test-results/pwa-final-acceptance`.
- Nine dedicated Chromium PWA journeys pass at 1280, 430 and 360 CSS pixels. They check manifest/icon dimensions and worker headers, prompt dismissal and installed state, offline device saving, refresh recovery, original-URL retry, restored answers, cache contents and viewport overflow. The settings/menu overflow check also covers 320, 768 and 1920 pixels. The install event is simulated; this is not a claim of OS-level installation testing.
- The recovery screen and 360-pixel screenshots were visually inspected. Screenshots and transient logs are in `test-results` during verification; they are not curriculum artifacts.

| Surface | Role/session | Widths | Coverage |
| --- | --- | --- | --- |
| Profile → Install Applied Commerce | Local guest | 320, 360, 430, 768, 1280, 1920 | Compact disclosure, keyboard operation, device-specific guidance, native prompt recovery, installed-state hiding; light/dark/system contrast and overflow |
| Grade 8 Lesson 1 | Local guest | 1280, 430, 360 | Answer saved while offline, retained after recovery/reconnect |
| Original lesson URL → recovery screen | Local guest | 1280, 430, 360 | Offline navigation, cached icon, retry, overflow |
| Manifest, icons, worker | Public | All three browser projects | Resolution, PNG dimensions, cache headers and active worker |
| Authenticated sync and role workspaces | Dedicated real accounts | NOT TESTED | Existing protocol preserved; no production learner tests run |
| Actual Android/iOS/desktop installation | Physical devices | NOT TESTED | Requires HTTPS preview/production and device acceptance |

The repository-wide Chromium suite also runs as the existing CI pull-request acceptance gate, including these new PWA journeys. Production release and live-device acceptance remain separate from this implementation.

The Profile presentation refinement and its current verification are documented in [the before/after review](pwa-presentation/README.md). Its new browser checks replace the initial Settings-based install checks above; the initial release counts remain a historical baseline.

### Repaired defects found during verification

| Severity | Reproduction / defect | Repair and regression evidence |
| --- | --- | --- |
| P2 | Offline document refresh displayed recovery copy but its AC image failed to load | Serve only the explicitly precached public recovery assets; Node regression plus browser natural-width assertion |
| P2 | Apple touch-icon metadata displaced the existing browser icon link | Explicitly retain `/icon.svg` alongside the Apple icon; existing site-icon regression and new PWA metadata assertion |

## Verification environment

The local setup script installed the pinned npm dependencies. Its operating-system browser dependency installer failed under the container's UID restrictions, and the standard Playwright browser download returned invalid archives. Local browser checks therefore used an npm-packaged Chromium 153 executable via the repository's existing `AC_BROWSER_EXECUTABLE` override, against the production build with `NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=local` and Supabase public configuration unset. This did not add a package dependency or change a lockfile. CI retains the repository's pinned Playwright browser installation path.

Official implementation reference: [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps), retrieved 3 November 2026.

## Release and recovery

Review through an isolated branch and pull request. No database migration is required. For production acceptance, verify `/manifest.webmanifest`, `/sw.js`, icons and metadata over HTTPS, install on Android and iOS, and repeat the offline-open-lesson/reconnect flow using isolated test accounts. Check that answers and pending revisions survive app closure and account changes.

Reverting the UI/manifest changes does not unregister a worker already installed on user devices. If disabling the worker is necessary, ship a replacement `/sw.js` that removes only this PWA's caches and unregisters itself after activation. Keep it available long enough for installed clients to check for an update. Never clear learner storage as part of PWA rollback.
