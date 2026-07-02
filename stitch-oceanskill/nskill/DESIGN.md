---
name: nskill
colors:
  surface: '#111319'
  surface-dim: '#111319'
  surface-bright: '#373940'
  surface-container-lowest: '#0c0e14'
  surface-container-low: '#191b22'
  surface-container: '#1e1f26'
  surface-container-high: '#282a30'
  surface-container-highest: '#33343b'
  on-surface: '#e2e2eb'
  on-surface-variant: '#c4c5d9'
  inverse-surface: '#e2e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#8e90a2'
  outline-variant: '#434656'
  surface-tint: '#b8c3ff'
  primary: '#b8c3ff'
  on-primary: '#002388'
  primary-container: '#2e5bff'
  on-primary-container: '#efefff'
  inverse-primary: '#124af0'
  secondary: '#e9b3ff'
  on-secondary: '#510074'
  secondary-container: '#7d01b1'
  on-secondary-container: '#e5a9ff'
  tertiary: '#00dce5'
  on-tertiary: '#003739'
  tertiary-container: '#00797e'
  on-tertiary-container: '#bbfbff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001356'
  on-primary-fixed-variant: '#0035be'
  secondary-fixed: '#f6d9ff'
  secondary-fixed-dim: '#e9b3ff'
  on-secondary-fixed: '#310048'
  on-secondary-fixed-variant: '#7200a3'
  tertiary-fixed: '#63f7ff'
  tertiary-fixed-dim: '#00dce5'
  on-tertiary-fixed: '#002021'
  on-tertiary-fixed-variant: '#004f53'
  background: '#111319'
  on-background: '#e2e2eb'
  surface-variant: '#33343b'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  max-width: 1440px
---

## Brand & Style

The design system is anchored in a **Sleek, High-Tech Futurism** aesthetic, tailored for a high-performance AI marketplace. It evokes feelings of precision, boundless intelligence, and professional reliability. The visual language merges the clarity of modern minimalism with the immersive depth of glassmorphism.

The objective is to position "nskill" as the premium destination for synthetic talent. The interface should feel like a sophisticated cockpit—dark, high-contrast, and focused. By utilizing deep voids contrasted with electric accents, the system directs user attention toward high-value AI capabilities and "featured" intelligence modules.

## Colors

The palette is built on a "Deep Space" foundation to ensure the interface recedes, allowing AI content to take center stage.

- **Primary (Electric Blue):** Used for core actions, progress indicators, and active states. It represents the "energy" of the AI.
- **Secondary (Neon Violet):** Reserved for premium tiers, special features, and rare skill categories.
- **Tertiary (Cyber Teal):** Used sparingly for success states, data visualizations, and technical labels.
- **Neutrals:** A range of high-density navy and obsidian shades. The background is nearly black to maximize the "glow" effect of glassmorphic layers.

## Typography

This design system utilizes a tiered typographic approach to emphasize technical precision:

- **Geist** for headlines provides a sharp, developer-centric aesthetic that feels engineered and modern.
- **Inter** handles the heavy lifting for body copy, offering unparalleled readability in high-density data environments.
- **JetBrains Mono** is utilized for metadata, tags, and technical specs (e.g., "Latence: 20ms", "Model: GPT-4o"), reinforcing the AI/Code marketplace context.

All display text should use a slightly tightened letter-spacing to maintain a "locked-in" professional look.

## Layout & Spacing

The system follows a **Fluid Grid** model based on an 8px rhythmic scale. 

- **Desktop:** A 12-column grid with generous 24px gutters. Content is centered with a max-width of 1440px to prevent excessive horizontal eye travel.
- **Tablet:** 8-column grid with 16px gutters.
- **Mobile:** 4-column grid with 16px margins.

Spacing between functional groups (like card sections) should be aggressive (64px+) to create a "breathable" high-end feel, while spacing within components (like internal card padding) should be tight and efficient (16px-24px).

## Elevation & Depth

Depth in this design system is achieved through **Glassmorphism and Chromatic Glows** rather than traditional shadows.

1.  **Base Layer:** Solid `#0A0C12` background.
2.  **Surface Layer:** Semi-transparent navy with a 20px `backdrop-blur`. These surfaces use a subtle `1px` white border at 10% opacity to define the edge.
3.  **Featured Layer:** Components that need to pop (like "Top Rated AI") use a **Glowing Border**—a gradient stroke from Electric Blue to Neon Violet with a soft outer bloom (blur radius 12px, 30% opacity).
4.  **Interaction:** On hover, glass surfaces should increase in opacity and the backdrop-blur should intensify, simulating a physical lift.

## Shapes

The design system adopts a **Rounded (Level 2)** shape language. This ensures the technical aesthetic feels approachable and sophisticated rather than aggressive or "industrial."

- Standard components (Buttons, Inputs) use a **0.5rem (8px)** corner radius.
- Large containers (Cards, Modals) use a **1rem (16px)** corner radius to create a distinct framing effect.
- Status pips and specific skill tags may use **Pill-shaped** radii to differentiate them from functional UI controls.

## Components

### Buttons
- **Primary:** High-vibrancy Electric Blue background. White text. No shadow, but a subtle "inner glow" on the top edge.
- **Secondary:** Ghost style. Transparent background with a `1px` Electric Blue border.
- **Featured:** Gradient background (Blue to Violet) with a 4px blur outer glow.

### Cards
All cards must implement the glassmorphism rule: `background: rgba(255, 255, 255, 0.03)` with a `backdrop-filter: blur(20px)`. Featured cards receive a secondary-to-primary gradient border.

### Input Fields
Darker than the background (`#050608`) with a subtle `1px` border. On focus, the border glows Electric Blue and the label (in JetBrains Mono) shifts to a high-contrast white.

### Chips & Tags
Small, pill-shaped elements using JetBrains Mono. Use subtle background tints of the secondary or tertiary colors at 15% opacity to indicate categories (e.g., "NLP", "Computer Vision").

### Featured Items
Items marked as "Featured" or "AI Choice" should have a continuous rotating gradient border or a static neon glow to draw the eye immediately upon page load.