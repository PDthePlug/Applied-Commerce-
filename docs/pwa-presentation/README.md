# PWA Profile presentation correction

The initial release made installation a separate Settings category with long instructions for every platform. This correction follows BIS’s quiet Profile disclosure: `app/profile/profile-dashboard.tsx`, `app/profile/profile.css`, and `components/pwa/install-card.tsx` in `PDthePlug/PDthePlug-bis-behaviour-intelligence` were inspected before implementation (main snapshot `4b2518969f0d7311a1ebecaf192677296f164f75`).

| Before | Corrected experience |
| --- | --- |
| Extra Settings category and extra main-menu row | Existing Profile route, one closed install action under Account; original five-item learner menu |
| All browser/platform instructions shown together | One native install button, or two steps relevant to the detected device |
| Long connection explanation competes with installation | Optional “What works offline?” disclosure |
| No install surface directly on Profile | Install action hides while running as an installed app; no hydration flash |
| Expanded help can sit behind the fixed Menu | Expansion scrolls into view with reserved clearance |

The current brand, offline cache boundary, authentication, account sync, curriculum and response identities are preserved. Browser/device detection changes instructions only. It does not claim support for APIs a browser has not supplied.

## Visual evidence

Screenshots use a local-mode production build, anonymous learner state and simulated native install availability. iPhone instructions use a simulated user agent, not a physical iOS installation.

- [Previous Settings presentation at 360px](before-settings-360.png)
- [Corrected Profile with the install action closed](after-profile-collapsed-360.png)
- [Expanded native installation](after-native-360.png)
- [Expanded native installation in dark mode](after-native-dark-360.png)
- [iPhone instructions](after-ios-360.png)

## Verification scope

The prior release's nine PWA browser journeys passed before changes. Current PWA coverage checks keyboard disclosure, button and help clearance above the Menu, native prompt dismissal/failure, installed-state hiding, iPhone/Android/desktop instructions, 320/360/430/768/1280/1920px widths, light/dark/system appearances, button contrast, unchanged offline answer saving, recovery and reconnect restoration. Runtime preflight and the full existing Node and browser suites remain release gates.

Final local results: runtime preflight, all 245 Node tests, TypeScript, ESLint, local-mode production build and all 279 Chromium browser journeys pass, including 27 PWA checks. The final mobile screenshots above were visually inspected. Browser runs use the same Chromium 153 executable override recorded in `docs/PWA.md`; source dependencies and lockfile remain unchanged.

Physical Android/iOS installation and authenticated account-sync writes are not tested in this pass. All unattended browser runs use local backend mode. No production learner accounts, role assignments or responses are altered.
