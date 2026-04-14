import { useEffect, useRef } from "react";
import lottie from "lottie-web/build/player/lottie_light";
import confettiAnimationData from "@/assets/lottie/confetti.json";

export function ConfettiOverlay({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: confettiAnimationData as object,
    });
    anim.addEventListener("complete", () => onComplete?.());
    return () => {
      anim.destroy();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden
    />
  );
}
