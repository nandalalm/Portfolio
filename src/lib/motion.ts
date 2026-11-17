/**
 * Motion tokens. Every animation on the site reads from here,
 * the same way colors come from the theme.
 */
export const motion = {
  ease: {
    /** Most reveals */
    flow: "expo.out",
    /** Transitions between sections or pages (GSAP CustomEase-compatible bezier) */
    liquid: "cubic-bezier(.65, 0, .35, 1)",
  },
  dur: {
    fast: 0.4, // hovers, buttons
    base: 0.9, // text and card reveals
    slow: 1.4, // large scene changes
  },
  stagger: {
    char: 0.025,
    line: 0.08,
  },
  lerp: {
    scroll: 0.09, // Lenis smoothing
    cursor: 0.12, // custom cursor and fluid input
  },
} as const;
