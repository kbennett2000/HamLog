# 0003. Implement runtime themes with CSS custom properties

Date: 2026-05-27
Status: Accepted

## Context

We want three user-selectable color themes — Indigo + Emerald (default), Teal +
Amber, and a Dark mode — that the user can switch at runtime and that persist
across sessions. The UI is built on Tailwind, whose color utilities are normally
resolved to fixed hex values at build time.

## Decision

Define each theme as a set of CSS custom properties scoped to a root class, and
have Tailwind's color tokens reference those variables:

- `index.css` declares `--color-primary-*`, `--color-accent-*`,
  `--color-danger-*`, `--color-surface-*`, and a handful of semantic vars
  (`--color-body-bg`, `--color-text-primary`, etc.) once per theme, under
  `.theme-indigo` / `.theme-teal` / `.theme-dark`.
- `tailwind.config.js` maps `colors.primary.500`, `colors.surface.100`, etc. to
  `var(--color-...)`, so a utility class like `bg-primary-600` resolves through
  the variable and changes meaning per theme.
- `ThemeContext.tsx` swaps exactly one class on `<html>` to switch themes and
  persists the choice in `localStorage` under `hamlog-theme`.
- Shared class strings in `config.ts` use the same tokens (and a few
  `[var(--color-...)]` arbitrary values for semantic surfaces).

## Alternatives considered

- **Tailwind's built-in `dark:` variant.** The idiomatic Tailwind approach, but
  it only models a light/dark binary. Expressing three *named* themes would mean
  duplicating variant-prefixed classes everywhere and still couldn't cleanly
  express a third palette. Rejected as a poor fit for the requirement.
- **A separate compiled stylesheet per theme.** Fully static and IntelliSense-
  friendly, but heavier to build and awkward to switch at runtime (swap a
  `<link>`, flash of unstyled/old colors). Rejected as over-engineered for color-
  only theming.
- **A single hardcoded theme.** Simplest, but the user explicitly wanted a
  choice of themes, so this doesn't meet the requirement.

## Consequences

- One set of utility classes works across all themes; switching is instant and
  needs no rebuild.
- Adding a new theme is just another `.theme-*` block of variables — no
  component or config changes.
- We lose some of Tailwind's static color IntelliSense and analysis, since
  colors are now indirected through CSS variables.
- Arbitrary-value classes like `bg-[var(--color-card-bg)]` show up in the code,
  which is slightly less clean than plain Tailwind tokens and easy to typo.
- Themes can only differ by the variables we've defined (currently colors);
  anything not tokenized is shared across all themes.

## Revisit if

- A theme needs to differ in layout/spacing/typography, not just color (the
  variable-only model won't cover that cleanly).
- A future Tailwind version provides first-class multi-theme support that
  removes the need for the variable indirection.
