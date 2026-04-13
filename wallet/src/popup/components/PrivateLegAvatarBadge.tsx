import { Shield01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { BrumeIcon } from "./BrumeIcon";

/**
 * Default shield badge on the private / shielded leg (bottom-right of token avatar).
 */
export function PrivateLegAvatarBadge(props: {
  className?: string;
  /** Slightly larger for 44px avatars (e.g. Shield flow). */
  large?: boolean;
  /** Larger badge for ~72px hero (e.g. Send shielded SPL). */
  hero?: boolean;
}) {
  const badge = props.hero
    ? "h-7 w-7"
    : props.large
      ? "h-[19px] w-[19px]"
      : "h-[17px] w-[17px]";
  const iconSize = props.hero ? 16 : props.large ? 12 : 11;

  return (
    <div
      className={cn(
        "pointer-events-none absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-card shadow-sm ring-2 ring-background",
        badge,
        props.className,
      )}
      aria-hidden
    >
      <BrumeIcon icon={Shield01Icon} className="text-primary" size={iconSize} />
    </div>
  );
}
