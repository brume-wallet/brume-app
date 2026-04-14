import { useEffect, useRef } from "react";
import lottie from "lottie-web/build/player/lottie_light";
import shieldAnimationData from "@/assets/lottie/shield-animation.json";

export function ShieldAnimation({ size = 64 }: { size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: shieldAnimationData as object,
    });
    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className="shrink-0"
      aria-hidden
    />
  );
}
