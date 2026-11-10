export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type TourSide = "right" | "left" | "bottom" | "top" | "center";

/** Leaves a thin visible margin between the highlight ring and the card. */
export const TOUR_GAP = 20;
export const TOUR_MARGIN = 12;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Where the tour card goes: beside the target (right, else left) when asked, otherwise below it,
 * or above it when there is no room below. Always kept inside the viewport.
 */
export function placeTourCard(target: Rect | null, card: Size, viewport: Size, preferRight: boolean): { top: number; left: number; side: TourSide } {
  const maxLeft = viewport.width - card.width - TOUR_MARGIN;
  const maxTop = viewport.height - card.height - TOUR_MARGIN;

  if (!target) {
    return {
      top: clamp((viewport.height - card.height) / 2, TOUR_MARGIN, maxTop),
      left: clamp((viewport.width - card.width) / 2, TOUR_MARGIN, maxLeft),
      side: "center",
    };
  }

  const right = target.left + target.width + TOUR_GAP;
  if (preferRight && right + card.width <= viewport.width - TOUR_MARGIN) {
    return { top: clamp(target.top + target.height / 2 - card.height / 2, TOUR_MARGIN, maxTop), left: right, side: "right" };
  }
  const leftSide = target.left - TOUR_GAP - card.width;
  if (preferRight && leftSide >= TOUR_MARGIN) {
    return { top: clamp(target.top + target.height / 2 - card.height / 2, TOUR_MARGIN, maxTop), left: leftSide, side: "left" };
  }

  const left = clamp(target.left + target.width / 2 - card.width / 2, TOUR_MARGIN, maxLeft);
  const below = target.top + target.height + TOUR_GAP;
  if (below + card.height <= viewport.height - TOUR_MARGIN) return { top: below, left, side: "bottom" };

  const above = target.top - TOUR_GAP - card.height;
  if (above >= TOUR_MARGIN) return { top: above, left, side: "top" };

  return { top: clamp(below, TOUR_MARGIN, maxTop), left, side: "bottom" };
}
