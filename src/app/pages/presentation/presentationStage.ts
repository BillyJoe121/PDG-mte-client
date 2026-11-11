import { useLayoutEffect, useState, type RefObject } from "react";

/** Slides are laid out once at projector resolution and scaled to the screen. */
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

export interface StageFit {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const UNMEASURED: StageFit = { scale: 1, offsetX: 0, offsetY: 0 };

/**
 * Largest scale that keeps the whole stage inside the container, centred, with
 * letterbox bands on the leftover side. Unknown or empty sizes keep scale 1.
 */
export function computeStageFit(
  containerWidth: number,
  containerHeight: number,
  stageWidth = STAGE_WIDTH,
  stageHeight = STAGE_HEIGHT
): StageFit {
  const valid = [containerWidth, containerHeight, stageWidth, stageHeight].every(
    (value) => Number.isFinite(value) && value > 0
  );
  if (!valid) return UNMEASURED;

  const scale = Math.min(containerWidth / stageWidth, containerHeight / stageHeight);
  return {
    scale,
    offsetX: (containerWidth - stageWidth * scale) / 2,
    offsetY: (containerHeight - stageHeight * scale) / 2,
  };
}

/** Keeps the stage fitted to its container while the window or the layout changes. */
export function useStageFit(containerRef: RefObject<HTMLElement | null>): StageFit {
  const [fit, setFit] = useState<StageFit>(UNMEASURED);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => {
      const next = computeStageFit(element.clientWidth, element.clientHeight);
      setFit((current) =>
        current.scale === next.scale && current.offsetX === next.offsetX && current.offsetY === next.offsetY
          ? current
          : next
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerRef]);

  return fit;
}
