"use client";

import { useRef } from "react";
import { useScroll, useTransform, useInView, useSpring } from "framer-motion";

/**
 * Parallax scroll effect using Framer Motion.
 * Returns a ref and the y offset to apply to the element.
 */
export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * -50, speed * 50]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return { ref, y: smoothY };
}

/**
 * Stagger reveal on scroll using Framer Motion.
 * Returns a ref to attach to the container.
 * Children should use `motion.div` with variants.
 */
export function useStaggerReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-20% 0px" });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return { containerRef, isInView, containerVariants, itemVariants };
}
