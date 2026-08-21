# Mobile sticky search + category row on scroll

Make the mobile top area behave like Daraz: the branding collapses away when scrolling down, while the search bar plus a horizontal category row slide back in and stay pinned as soon as the user scrolls up.

## Behavior

```text
scroll down            scroll up / at top
+------------------+   +------------------------+
| (hidden)         |   | top bar (lang/currency)|
| (hidden)         |   | menu | logo | cart     |
| products...      |   | [ search bar        ]  |
|                  |   | Bath | Beauty | Toys.. |
+------------------+   +------------------------+
        bottom nav stays fixed in both states
```

- Scroll down on mobile: the utility top bar and the logo row collapse upward (height + opacity animate out), giving products more space.
- Scroll up on mobile: the search bar appears immediately, with a compact horizontal, scrollable category row directly beneath it. Both stay sticky at the top while scrolling continues upward.
- At the very top of the page, everything is shown as it is today.
- Smooth slide/collapse animation, no layout jump: the collapsing part animates its own height so the sticky search block never shifts abruptly, and the sticky container keeps a stable position.
- Desktop layout, product cards, and the fixed bottom navigation are untouched.

## Technical notes

- `src/components/zupona/Header.tsx`: split the current markup into two blocks inside the existing `sticky top-0` header:
  1. Collapsible block (utility top bar + menu/logo/cart row) — on mobile gets `max-h`/`opacity`/`-translate-y` transition driven by the collapsed flag; on `md+` always visible via `md:max-h-none md:opacity-100`.
  2. Persistent block (search form) — always visible; stop translating the whole `<header>` so nothing flickers.
- Add a mobile-only category row (`md:hidden`) under the search form: horizontally scrollable chip/icon list built from `categories` in `src/components/zupona/data.ts`, linking to `/category/$slug` plus an "All" link to `/categories`. Reuse existing gold/card tokens; no new colors.
- Keep `useHideOnScroll` from `src/hooks/use-scroll-direction.ts`; it already resets near the top and reacts to direction with a delta guard. Only the consumption changes (collapse inner block instead of the whole header).
- The homepage `CategoryStrip` section stays as-is; the new row is header-level navigation, not a duplicate grid section (no change to `src/routes/index.tsx`).
- Verify with mobile (393px) and desktop Playwright screenshots at top, after scrolling down, and after scrolling back up.
