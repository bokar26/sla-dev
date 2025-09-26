## Independent Content Scrolling (Dashboard/AppShell)

- Global CSS (`src/index.css`): set `html, body, #root` to `height: 100%` and disable global scroll with `overflow: hidden`. Added `.scroll-panel` for iOS momentum scrolling.
- `components/AppShell.jsx`: refactored into a full-height flex layout. Header area remains fixed (via shrink-0 in consumer), main content (`<main id="app-content">`) is the only scroll container with `overflow-y-auto`, `min-h-0`, and `scroll-smooth`. Added `tabIndex={0}` for keyboard scrolling focus.
- `pages/Dashboard.jsx`: removed extra `overflow-y-auto` on page root to avoid double scrollbars; constrained nested areas to avoid creating second scroll containers.

Result: The content/work area scrolls independently under the fixed header/sidebar, with smooth scrolling, no double scrollbars, and preserved keyboard accessibility.


