# Mobile Scroll-Aware Header (Daraz-style)

Make the ZUPONA header collapse on scroll down and reappear on scroll up — mobile only. Desktop stays exactly as it is.

## Behavior

- Scroll down past a small threshold (~60px): the top utility bar, logo row and search bar slide up out of view smoothly.
- Scroll up (even slightly): the whole header slides back down immediately.
- At the very top of the page: header is always fully visible.
- Bottom navigation stays pinned at the bottom at all times — untouched.
- Motion uses a CSS transform transition, so there is no flicker, layout jump or content reflow.

## What changes

1. New hook `src/hooks/use-scroll-direction.ts`
   - Tracks scroll position with a `requestAnimationFrame`-throttled listener and a small delta threshold so tiny jitters don't toggle the header.
   - Returns whether the header should be hidden; always `false` near the top of the page.

2. `src/components/zupona/Header.tsx`
   - Keeps `sticky top-0` and all existing markup, classes and colors.
   - Adds a transform class on mobile only: hidden state applies `-translate-y-full` with `transition-transform duration-300`, cleared at `md:` so desktop never transforms.
   - Hook only drives behavior below the `md` breakpoint (via the existing `useIsMobile` hook), so desktop rendering is identical.

## Notes

- No changes to routes, cart drawer, bottom nav, data or styling tokens.
- Header remains in the normal sticky flow, so no extra spacer padding is needed and page content does not shift.
