/**
 * DTO contracts for Responsive Layout & Viewport Adaptation
 * Story: HT-065
 * Governed by: AD-10, AD-13
 */
export type ViewportBreakpoint = 'MOBILE' | 'TABLET' | 'DESKTOP';

export interface ResponsiveViewportDto {
  widthPx: number;
  heightPx: number;
  breakpoint: ViewportBreakpoint;
}

export interface ResponsiveStateDto {
  breakpoint: ViewportBreakpoint;
  useCardView: boolean;
  announceHorizontalScroll: boolean;
}
