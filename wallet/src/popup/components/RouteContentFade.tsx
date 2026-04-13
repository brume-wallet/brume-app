import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export const routeContentTransition = { duration: 0.52, ease } as const;

export type RouteContentVariant =
  | "fade"
  | "home"
  | "send"
  | "secondaryNav"
  | "manageAccounts"
  | "accountSubpage";

type MotionState = Record<string, string | number>;

type EnterOnly = {
  initial: MotionState;
  animate: MotionState;
};

const motionByVariant: Record<RouteContentVariant, EnterOnly> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  home: {
    initial: { opacity: 1, x: "100%" },
    animate: { opacity: 1, x: 0 },
  },
  send: {
    initial: { opacity: 1, y: "100dvh" },
    animate: { opacity: 1, y: 0 },
  },
  secondaryNav: {
    initial: { opacity: 1, x: "-100%" },
    animate: { opacity: 1, x: 0 },
  },
  manageAccounts: {
    initial: { opacity: 1, y: "100dvh" },
    animate: { opacity: 1, y: 0 },
  },
  /** Manage / add / edit / private-key: full-opacity slide in from the right (same feel as `home`). */
  accountSubpage: {
    initial: { opacity: 1, x: "100%" },
    animate: { opacity: 1, x: 0 },
  },
};

/**
 * Enter-only motion; `routeKey` remounts this layer so each navigation replays.
 */
export function RouteContentFade(props: {
  routeKey: string;
  children: ReactNode;
  className?: string;
  variant?: RouteContentVariant;
}) {
  const variant = props.variant ?? "fade";
  const { initial, animate } = motionByVariant[variant];

  return (
    <motion.div
      key={props.routeKey}
      initial={initial}
      animate={animate}
      transition={routeContentTransition}
      className={cn("w-full min-w-0", props.className)}
    >
      {props.children}
    </motion.div>
  );
}
