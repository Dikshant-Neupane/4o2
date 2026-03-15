// ═══════════════════════════════════════════════════════════════
// Jana Sunuwaai — Shared Motion Library
// All variants, tokens, hooks, and motion utilities live here.
// Import from '@/lib/motion' (or '../lib/motion') everywhere.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

// ─── MOTION TOKENS ──────────────────────────────────────────
export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  stagger: 0.06,
};

export const easing = {
  entrance: [0.0, 0.0, 0.2, 1.0],
  exit: [0.4, 0.0, 1.0, 1.0],
  smooth: [0.4, 0.0, 0.2, 1.0],
};

export const spring = {
  default: { type: 'spring', stiffness: 300, damping: 30 },
  bounce: { type: 'spring', stiffness: 400, damping: 17 },
};

// ─── VARIANTS ───────────────────────────────────────────────

/** Page entrance — use on every page mount */
export const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.slow,
      ease: easing.entrance,
      staggerChildren: duration.stagger,
    },
  },
};

/** Card entrance — report cards, category cards */
export const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easing.entrance,
    },
  },
};

/** Stagger container — wrap lists of cards */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: duration.stagger },
  },
};

/** Hero text — letter by letter for headline */
export const letterVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: duration.slow,
      ease: easing.entrance,
    },
  },
};

/** Fade up — for sections scrolling into view */
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: 'easeOut' },
  },
};

/** Button spring — for primary action buttons */
export const buttonSpring = {
  rest: { scale: 1 },
  hover: {
    scale: 1.03,
    transition: spring.bounce,
  },
  tap: { scale: 0.97 },
};

/** Wizard step — leaving step */
export const stepExit = {
  initial: { x: 0, opacity: 1 },
  exit: {
    x: -40,
    opacity: 0,
    transition: { duration: duration.fast, ease: easing.exit },
  },
};

/** Wizard step — entering step */
export const stepEnter = {
  initial: { x: 40, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: easing.entrance },
  },
  exit: {
    x: -40,
    opacity: 0,
    transition: { duration: duration.fast, ease: easing.exit },
  },
};

/** Scale-in bounce — for checkmark circles, avatar etc */
export const scaleBounce = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: spring.default,
  },
};

/** Slide from left — sidebar */
export const slideFromLeft = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: duration.normal, ease: easing.entrance },
  },
};

/** Coming-soon shake animation */
export const shakeAnimation = {
  x: [0, -4, 4, -2, 2, 0],
  transition: { duration: 0.3 },
};

// ─── HOOKS ──────────────────────────────────────────────────

/**
 * Safe wrapper around useReducedMotion.
 * Returns true if user prefers reduced motion.
 */
export function useReducedMotionSafe() {
  const prefersReduced = useReducedMotion();
  return !!prefersReduced;
}

/**
 * Counts up from 0 to `target` when element scrolls into view.
 * Returns [ref, displayValue].
 */
export function useCountUp(target, durationMs = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);
  const prefersReduced = useReducedMotionSafe();

  useEffect(() => {
    if (prefersReduced) {
      setValue(target);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // Ease-out quad
            const eased = 1 - (1 - progress) * (1 - progress);
            setValue(Math.round(eased * target));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, durationMs, prefersReduced]);

  return [ref, value];
}

// ─── VIEWPORT SETTINGS ──────────────────────────────────────

/** Standard viewport trigger — once, 20% visible */
export const viewportOnce = { once: true, amount: 0.2 };

// ─── SHINE BUTTON CSS CLASSES ───────────────────────────────

/** Tailwind classes: add to any button for the shine hover effect */
export const shineClasses =
  'relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] before:bg-[length:250%_250%] before:bg-[position:200%_0] before:bg-no-repeat before:transition-[background-position] before:duration-700 hover:before:bg-[position:-100%_0]';
