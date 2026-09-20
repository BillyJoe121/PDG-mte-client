import { useEffect, useRef, useState, type ReactNode } from "react";

interface DeferredRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
  minHeight?: number;
  rootMargin?: string;
}

/**
 * Delays expensive, below-the-fold UI until it approaches the viewport.
 * The reserved height prevents layout shifts while the user scrolls.
 */
export function DeferredRender({
  children,
  fallback,
  minHeight = 320,
  rootMargin = "320px 0px",
}: DeferredRenderProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (visible || !hostRef.current || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return (
    <div ref={hostRef} style={{ minHeight }}>
      {visible ? children : (fallback ?? <DeferredPlaceholder minHeight={minHeight} />)}
    </div>
  );
}

function DeferredPlaceholder({ minHeight }: { minHeight: number }) {
  return (
    <div
      className="flex animate-pulse items-center justify-center rounded-md border border-[#D9DEE8] bg-[#F8FAFC] text-xs font-bold text-[#717182] motion-reduce:animate-none"
      style={{ minHeight }}
      role="status"
      aria-label="Preparando visualización"
    >
      Preparando visualización…
    </div>
  );
}
