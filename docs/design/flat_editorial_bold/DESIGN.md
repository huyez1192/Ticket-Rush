---
name: Flat Editorial Bold
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#424754'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  h1:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h2:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  h3:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-bold:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin: 32px
  section-padding: 64px
---

## Brand & Style
The design system is built on a "Digital-Print" philosophy—stripping away all artifice to focus on the raw utility of the ticket distribution experience. The brand personality is energetic and hyper-functional, designed to feel as reliable as a physical printed ticket while embracing the speed of a digital-native platform. 

The visual style is a fusion of **High-Contrast Bold** and **Minimalism**. By eliminating shadows, gradients, and bevels, the interface relies entirely on clear geometry, heavy strokes, and vibrant color-blocking to establish hierarchy. The goal is to evoke a sense of immediate clarity and high-velocity action, making the user feel empowered and informed.

## Colors
The palette is rooted in a high-contrast foundation of pure white and deep navy-gray to ensure maximum readability. The primary Blue 500 serves as the main driver for action and navigation, while the Emerald 500 secondary color is reserved for success states and confirmation-led UI. Amber 500 acts as a disruptive accent for alerts and high-priority ticket statuses. 

Large-scale color blocking is used to segment different functional areas of the layout. Backgrounds should remain predominantly white to let the bold strokes and vibrant interactive elements command attention without visual fatigue.

## Typography
This design system utilizes 'Outfit' for its geometric purity and modern proportions. The typographic hierarchy is intentionally aggressive. Headings are set in Extra Bold (800) with tight negative letter-spacing to mimic high-end editorial print layouts, creating a "block-like" visual density.

For body text, the weights transition to Regular (400) to maintain legibility against the heavy border styles of the surrounding UI. Labels and small metadata should be set in Bold (700) with increased letter-spacing and uppercase styling to provide a clear contrast against the dense headline blocks.

## Layout & Spacing
The layout follows a strict 12-column fluid grid system that adheres to an 8px rhythmic unit. Navigation and header elements should span the full width, while content remains centered within a 1280px container. 

A signature element of this design system is the use of **bold color-blocking**. Sections are divided by solid horizontal or vertical 2px lines or by alternating background colors between white and Gray 100. In the background, large geometric shapes (circles and triangles) are placed with an opacity of 5-10% to add a layer of digital texture without interfering with the content's functional clarity.

## Elevation & Depth
This design system rejects all forms of artificial depth. There are no shadows, blurs, or gradients. Hierarchy is instead established through **structural layering and bold borders**.

Depth is conveyed through:
- **Stroke Weight:** Use `border-2` for standard containers and `border-4` for high-priority focus states or primary buttons.
- **Color Stacking:** Darker color blocks (Gray 100) are used to sit "behind" white cards.
- **Scale:** Interactive elements physically expand (scale transformation) rather than lifting with a shadow, maintaining the flat, print-inspired aesthetic while providing tactile feedback.

## Shapes
The shape language is precise and architectural. All interactive components use a medium corner radius (6px) to soften the "Brutalist" edge while maintaining a disciplined look. Larger layout containers, such as hero cards or modal overlays, use a slightly larger radius (8px). 

Every shape must be defined by a solid border. The default stroke is 2px in the Foreground color (#111827). For emphasis, such as selected states or featured event cards, the stroke increases to 4px.

## Components
- **Buttons:** Designed as flat color blocks with a 2px border. On hover, buttons must scale to 105% and the background color should shift to a darker shade (e.g., Blue 500 to Blue 600) while the border remains solid.
- **Color-block Cards:** Use #FFFFFF backgrounds with a 2px solid #111827 border. Headers of cards can be filled with #F3F4F6 to create a distinct section for event titles or dates.
- **Inputs:** Fields are defined by a 2px border. On focus, the border must transition to 4px width or change to the Primary Blue color. Text must never be "ghosted"; placeholder text uses 50% opacity of the foreground color.
- **Chips/Badges:** Small, rectangular blocks with a 6px radius and 2px border. Use the Primary, Secondary, and Accent colors for status indicators (e.g., "Sold Out" in Amber 500).
- **Lists:** Items are separated by 2px horizontal rules. Interactive list items should have a subtle Gray 100 background fill on hover rather than a shadow.
- **Decorative Geometry:** Background elements should consist of oversized, low-opacity Blue or Amber circles that intersect with the edge of the screen, reinforcing the energetic vibe of the platform.