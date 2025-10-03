# iAccessible Command Center - Project Conventions

## Grid
- Fluid 12-column; card grids break 4→3→2→1 at 1280/1024/768/≤640.

## Typography
- Base 16px desktop, 15–16px mobile, line-height ≥1.5.

## Themes
- Use provided OKLCH tokens. Respect prefers-color-scheme.

## Focus
- Visible 3px ring using --ring. Never remove focus outlines.

## Motion
- Fade only; honor prefers-reduced-motion.

## Links opening in a new tab
- Show external icon + aria-label="Opens in a new tab".

## Disabled UI
- Use aria-disabled="true", reduce opacity, skip in tab order.

## Tooltips
- Radix Tooltip with aria-describedby.

## Keyboard
- Tab/Shift+Tab, Enter/Space to activate, Esc to close dialogs/menus.

## Error/empty states
- Friendly copy + one next action.

## Cards
- Open modules in new tabs and push to "recent modules."

## Session
- Idle 25m → 2m warning modal (focus trap).

## RBAC
- Show disabled cards with lock icon + tooltip; do not remove from layout.

