# Expandable mobile category row

Make the mobile category row in the header behave like the reference: a compact horizontal strip with a "+" button that expands into a full category panel below the search bar.

## Behavior

```text
collapsed                         expanded
+------------------------------+  +------------------------------+
| [ search bar             ]   |  | [ search bar             ]   |
| Bath | Beauty | Men's ... [+] |  | Bath | Beauty | Men's ... [x] |
+------------------------------+  | +----+ +----+ +----+ +----+  |
                                  | |icon| |icon| |icon| |icon|  |
                                  | +----+ +----+ +----+ +----+  |
                                  | (all categories, 2 rows,     |
                                  |  horizontally scrollable)    |
                                  +------------------------------+
```

- The compact row stays as it is today: horizontally scrollable category pills, mobile only.
- A round "+" button pinned at the end of the row (visually attached, not scrolled away) toggles the expanded panel.
- Expanded panel sits directly below the search bar / category row, inside the sticky header, showing all categories as image + label cards in a 2-row horizontally scrollable grid, plus an "All Categories" card.
- Toggle icon rotates from "+" to "x" when open; panel animates height + opacity smoothly (no jump, no flicker).
- Tapping a category navigates and auto-closes the panel.
- Panel auto-closes when the header collapses on scroll down, so the sticky area never grows unexpectedly while scrolling.
- Desktop (`md+`) is unaffected: the row and the toggle stay `md:hidden`.

## Technical notes

- `src/components/zupona/Header.tsx`
  - New `catsOpen` state; toggle button appended after the pill list in a flex wrapper so the pills scroll and the button stays fixed at the right edge.
  - Expanded panel rendered below the existing category nav, mobile only, animated with a `grid-rows-[0fr]` → `grid-rows-[1fr]` (or max-height) transition plus opacity, `overflow-hidden`.
  - Panel content: `categories` from `src/components/zupona/data.ts` — rounded image thumb + short label per item, `grid grid-rows-2 grid-flow-col auto-cols-[64px] gap-3` in an `overflow-x-auto` container with hidden scrollbars, matching the existing `CategoryStrip` visual language.
  - Effect: when `collapsed` (scroll-down hide state) becomes true, close the panel.
  - Existing `shift` measurement for the scroll-collapse transform keeps working since the search bar's `offsetTop` is unchanged by the panel below it.
- Only gold/border/card/secondary tokens already in use; no new colors, no data or route changes.
- Verify at 393px with Playwright: collapsed row, expanded panel, re-collapsed, plus a desktop screenshot to confirm nothing changed.
