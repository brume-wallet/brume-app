import { ShieldIcon } from "@/components/Icons";
import { cn } from "@/lib/utils";

export function PrivateLegAvatarBadge(props: {
  className?: string;
  large?: boolean;
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
      <ShieldIcon
        width={iconSize}
        height={iconSize}
        className="text-primary p-1 rounded-full bg-primary/10"
      />
    </div>
  );
}
