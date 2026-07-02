---
name: Luminous Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434656'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#747688'
  outline-variant: '#c4c5d9'
  surface-tint: '#124af0'
  primary: '#0040e0'
  on-primary: '#ffffff'
  primary-container: '#2e5bff'
  on-primary-container: '#efefff'
  inverse-primary: '#b8c3ff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#006058'
  on-tertiary: '#ffffff'
  tertiary-container: '#007b71'
  on-tertiary-container: '#b2fff3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001356'
  on-primary-fixed-variant: '#0035be'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  stack-xl: 48px
---

## Brand & Style
This design system embodies a high-performance, professional atmosphere tailored for technical excellence. The brand personality is precise, efficient, and forward-thinking, moving away from the "gamer" aesthetic of dark themes toward a "work-bench" clarity. 

The visual style is a blend of **Minimalism** and **Corporate Modern**. It prioritizes high-quality typography and strategic whitespace to reduce cognitive load while maintaining a "high-tech" soul through micro-interactions and sharp geometric precision. The emotional response should be one of clarity, reliability, and technical mastery.

## Colors
The palette is anchored by a high-contrast foundation designed for professional endurance. 

- **Primary (Electric Blue):** The core action color, maintained for brand recognition but optimized for AA/AAA contrast ratios against white surfaces.
- **Accents:** Purple and Teal are utilized as secondary and tertiary signals for categorization and data visualization. Their saturation is tuned to remain vibrant without vibrating against light backgrounds.
- **Neutrals:** A Slate-based scale. The background uses a cool-toned off-white to reduce eye strain, while text utilizes deep charcoal to ensure maximum legibility.
- **Surfaces:** Pure white is reserved for the highest level of the stack (cards and modals) to create clear separation from the background.

## Typography
This design system utilizes **Geist** exclusively to maintain a technical, developer-centric aesthetic. The typeface's systematic nature provides the necessary rhythm for complex data and professional workflows.

Headlines use tighter letter-spacing and heavier weights to create a strong visual hierarchy. Body text is set with generous line-height to ensure comfort during long reading sessions. A dedicated `label-md` style is used for small metadata, utilizing a slight tracking increase for readability at small scales.

## Layout & Spacing
The layout follows a rigorous 8px grid system, ensuring mathematical harmony across all components. 

- **Grid:** A 12-column fixed-width grid for desktop (centered) and a fluid 4-column grid for mobile.
- **Rhythm:** Vertical rhythm is maintained through standardized "stack" variables. `stack-md` (16px) is the default for internal component padding, while `stack-lg` (24px) separates distinct content blocks.
- **Reflow:** On mobile, margins shrink to 16px to maximize screen real estate, and horizontal card layouts stack vertically to maintain legibility.

## Elevation & Depth
In this light-mode iteration, depth is conveyed through a combination of **low-contrast outlines** and **ambient shadows**. 

1.  **Level 0 (Base):** The background color (#F8FAFC).
2.  **Level 1 (Surface):** Cards and containers use a white background with a subtle 1px border (#E2E8F0).
3.  **Level 2 (Raised):** Interactive elements or active cards use a soft, diffused shadow: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.
4.  **Level 3 (Overlay):** Modals and dropdowns use a more pronounced shadow to create distinct separation from the stack: `0 20px 25px -5px rgb(0 0 0 / 0.1)`.

Avoid any neon glows or inner-glow effects; the focus is on physical layering and subtle light interaction.

## Shapes
The shape language is "Soft Geometric." By utilizing a level 2 roundedness (8px base), the design system feels approachable and modern without losing its professional edge.

- **Standard Elements:** 0.5rem (8px) for buttons, inputs, and small cards.
- **Large Containers:** 1rem (16px) for main content areas and large feature cards.
- **Interactive States:** Subtle 1px borders are always used in conjunction with corner radii to define boundaries clearly in the light environment.

## Components

### Buttons
Primary buttons use the Electric Blue background with white text. Secondary buttons use a white background with a 1px slate-200 border and slate-900 text. Hover states should involve a subtle shift in background brightness (5-10% darker) rather than an increase in shadow.

### Input Fields
Fields feature a white background, a 1px border (#CBD5E1), and 8px rounded corners. Upon focus, the border transitions to the Primary Electric Blue with a subtle 3px outer ring of the same color at 20% opacity.

### Cards
Cards are the primary organizational unit. They must have a white background and a 1px border (#E2E8F0). For interactive cards, a soft shadow is applied only on hover to provide tactile feedback.

### Chips & Badges
Use a "soft" color treatment: a desaturated background (10% opacity of the accent color) with high-contrast text of the full-strength accent color. This maintains the "high-tech" look without overwhelming the light interface.

### Lists
Lists should utilize "Zebra" striping only when data density is extreme; otherwise, use simple 1px dividers (#F1F5F9) to maintain the minimalist aesthetic.