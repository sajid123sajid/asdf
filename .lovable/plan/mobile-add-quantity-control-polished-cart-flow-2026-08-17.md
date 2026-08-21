# Mobile ADD / Quantity Control + Polished Cart Flow

Upgrade the mobile shopping interaction on ZUPONA product cards, keeping the gold/orange brand look and leaving desktop untouched.

## 1. ADD → quantity control on the product image

- Replace the current mobile "+" circle button with a control pinned to the bottom-right of the product image, overlapping it slightly.
- Not in cart: compact pill labelled "ADD" — gold outline, card background, gold text, uppercase and tight.
- Tap ADD: item goes into the cart instantly and the pill morphs into a "− 1 +" control (gold filled or gold-bordered, rounded-full, same footprint so the grid never shifts).
- "+" and "−" adjust quantity instantly; reaching 0 returns the control to "ADD".
- Subtle press animation (`active:scale-90`, short transition) on every tap target; the swap uses a quick fade/scale so it feels instant, not jumpy.
- Mobile only (`md:hidden`), so the desktop card and its "Order Now" button stay exactly as they are.

## 2. Floating Cart card

The floating cart pill already exists; it gets tightened up:

- Shows cart icon, "Cart", live item count ("1 item" / "6 items"), and the right arrow.
- Whole pill is one tappable link straight to the Cart page.
- Slides up smoothly when the first item is added, hides when the cart empties.
- Sits above the fixed bottom nav so nothing is covered, and stays hidden on the Cart page itself.
- Count updates instantly from the shared cart state as quantities change.

## 3. Product titles

- Mobile titles clamp to a maximum of 3 lines with an ellipsis.
- Title block gets a fixed min-height equal to 3 lines so every card in the row lines up, regardless of title length.
- Cards stay compact — no extra padding added.

## 4. Scope

- Colors, fonts and layout stay as they are; only the card's action control, title clamping, and the floating pill polish change.
- Nothing about the desktop grid or desktop card behavior changes.

## Technical notes

- `src/components/zupona/ProductCard.tsx`: new mobile overlay control reading quantity from `useShop()` (derive from `cart` by slug) and calling `addToCart` / `setQty`; add `line-clamp-3` + min-height on the title.
- `src/components/zupona/shop-store.tsx`: expose a small `qtyOf(slug)` helper so the card can read live quantity without duplicating lookup logic.
- `src/components/zupona/FloatingCart.tsx`: minor styling/animation polish only; logic is already correct.
- `src/styles.css`: add a `line-clamp-3` utility only if Tailwind's built-in one isn't available in this setup.
