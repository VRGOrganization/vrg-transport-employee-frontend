import type { Transition } from "framer-motion";

export const overlaySpring: Transition = { type: "spring", damping: 30, stiffness: 300, mass: 0.8 };
export const collapseTransition: Transition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] };
