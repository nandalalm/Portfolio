import type Lenis from "lenis";
import type { GLApp } from "@/gl/app";

/**
 * Shared per-frame values. Plain mutable object (not React state) so that
 * scroll, text animation and WebGL can all read it inside one animation
 * loop without triggering re-renders.
 */
export const store = {
  lenis: null as Lenis | null,
  /** The shared WebGL canvas, when it is running */
  gl: null as GLApp | null,
  /** Navigate with the liquid page transition (set by PageTransition) */
  navigate: null as ((href: string) => void) | null,
  /** Scroll position in px */
  scroll: 0,
  /** Scroll velocity in px/frame (signed) */
  velocity: 0,
  /** Page progress 0..1 */
  progress: 0,
  cursor: {
    /** Viewport position in px */
    x: 0,
    y: 0,
    /** Normalised 0..1, y up (WebGL-friendly) */
    nx: 0.5,
    ny: 0.5,
    /** Speed in px/frame */
    speed: 0,
    active: false,
  },
};
