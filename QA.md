# QA Checklist - iAccessible Command Center

## Keyboard Navigation
- [ ] Navigate header using Tab/Shift+Tab
- [ ] Open/close menus with Enter/Space
- [ ] Focus rings are visible on all interactive elements
- [ ] Escape closes dialogs and menus

## Module Cards
- [ ] Open button opens modules in new tabs
- [ ] Modules are added to recent list after opening
- [ ] Disabled cards are skipped in tab order
- [ ] Disabled cards show lock icon and tooltip

## Responsive Design
- [ ] Grid breaks 4→3→2→1 at 1280/1024/768/≤640px
- [ ] Header collapses to kebab menu at ≤640px
- [ ] All content remains accessible at all breakpoints

## Theme System
- [ ] Light/dark theme toggle works
- [ ] Theme persists across page reloads
- [ ] Contrast meets WCAG 2.2 AA standards
- [ ] Colors are consistent across components

## Motion and Accessibility
- [ ] Set prefers-reduced-motion: reduce
- [ ] Confirm only fade animations are used
- [ ] No motion when reduced motion is preferred
- [ ] All animations respect user preferences

## Session Timeout
- [ ] Wait 25 minutes of inactivity
- [ ] Modal appears with 2-minute warning
- [ ] Screen reader announces countdown updates
- [ ] "Continue session" resets timer
- [ ] "Sign out" navigates to /login
- [ ] Focus is trapped in modal

## Login Form
- [ ] Disabled SSO buttons are not focusable
- [ ] Tooltips appear on hover for disabled buttons
- [ ] Email/Password form works correctly
- [ ] "Keep me signed in" checkbox functions
- [ ] Form validation works as expected

## Help Drawer
- [ ] Opens with Enter/Space on help button
- [ ] Closes with Escape or outside click
- [ ] Focus returns to trigger button after close
- [ ] All links work correctly

## General Accessibility
- [ ] All images have alt text or aria-hidden
- [ ] Form labels are properly associated
- [ ] Color is not the only means of conveying information
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] All interactive elements are keyboard accessible



