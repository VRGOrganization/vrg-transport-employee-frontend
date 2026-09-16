import type { Transition, Variants } from "framer-motion";

export const overlaySpring: Transition = { type: "spring", damping: 30, stiffness: 300, mass: 0.8 };
export const collapseTransition: Transition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] };

/** Fade+subida leve por campo de formulário, com stagger via `custom={index}`. */
export const fieldStaggerVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  }),
};
