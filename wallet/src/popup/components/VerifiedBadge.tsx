import { Tick02Icon } from "@hugeicons/core-free-icons";
import { BrumeIcon } from "./BrumeIcon";

export function VerifiedBadge() {
  return (
    <span
      className="inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      title="Native asset"
      aria-hidden
    >
      <BrumeIcon icon={Tick02Icon} size={10} className="text-primary-foreground" />
    </span>
  );
}
