import { Layout01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import sidePanelIcon from "@/assets/side-panel.png";
import { BrumeIcon } from "./BrumeIcon";
import { applyUiSurfaceClass, type UiSurface } from "../lib/ui-shell";
import * as msg from "../messaging";

export function SurfaceToggle(props: {
  className?: string;
  uiSurface: UiSurface;
  onSurfaceChange: (s: UiSurface) => void;
}) {
  const isSide = props.uiSurface === "sidepanel";
  const label = isSide ? "Open as popup next time" : "Open as side panel next time";

  async function onClick() {
    const next: UiSurface = isSide ? "popup" : "sidepanel";
    try {
      await msg.setUiSurface(next);
      applyUiSurfaceClass(next);
      props.onSurfaceChange(next);
      window.close();
    } catch {
            // ignore

    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        props.className,
      )}
      aria-label={label}
      title={label}
      onClick={() => void onClick()}
    >
      {isSide ? (
        <BrumeIcon icon={Layout01Icon} size={22} className="text-muted-foreground" />
      ) : (
        <img
          src={sidePanelIcon}
          alt=""
          className="h-[22px] w-[22px] object-contain opacity-90"
          width={22}
          height={22}
        />
      )}
    </Button>
  );
}
