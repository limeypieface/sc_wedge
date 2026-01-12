"use client";

import { cn } from "@/lib/utils";
import { motion, MotionStyle, Transition, useReducedMotion } from "motion/react";

export interface BorderBeamProps {
  /**
   * The size of the border beam.
   */
  size?: number;
  /**
   * The duration of the border beam.
   */
  duration?: number;
  /**
   * The delay of the border beam.
   */
  delay?: number;
  /**
   * The motion transition of the border beam.
   */
  transition?: Transition;
  /**
   * The class name of the border beam.
   */
  className?: string;
  /**
   * The style of the border beam.
   */
  style?: React.CSSProperties;
  /**
   * Whether to reverse the animation direction.
   */
  reverse?: boolean;
  /**
   * The initial offset position (0-100).
   */
  initialOffset?: number;
  /**
   * The border width of the beam.
   */
  borderWidth?: number;
  /**
   * Whether to disable animations when prefers-reduced-motion is set.
   */
  respectReducedMotion?: boolean;
}

export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 8,
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1,
  respectReducedMotion = true,
}: BorderBeamProps) => {
  const shouldReduceMotion = useReducedMotion();
  const disableAnimation = respectReducedMotion && shouldReduceMotion;

  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] border-(length:--border-beam-width)"
      style={
        {
          "--border-beam-width": `${borderWidth}px`,
        } as React.CSSProperties
      }
    >
      <motion.div
        className={cn(
          "absolute aspect-square",
          "bg-gradient-to-l from-[#705E00] via-[#F5D90A] to-[#705E00]",
          className,
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            ...style,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={
          disableAnimation
            ? { offsetDistance: `${initialOffset}%` }
            : {
                offsetDistance: reverse
                  ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
                  : [`${initialOffset}%`, `${100 + initialOffset}%`],
              }
        }
        transition={
          disableAnimation
            ? { duration: 0 }
            : {
                repeat: Infinity,
                ease: "linear",
                duration,
                delay: -delay,
                ...transition,
              }
        }
      />
    </div>
  );
};
