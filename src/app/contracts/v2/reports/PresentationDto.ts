/**
 * DTO contracts for Interactive Presentation Mode
 * Story: HT-054
 * Governed by: AD-1, AD-10, AD-12
 */
export type PresentationSlideType = 'SUMMARY' | 'RISKS' | 'KRS' | 'FINAL_REPORT';

export interface PresentationDataDto {
  cycleId: number;
  cutId?: number;
  asOfDate: string;
  isEmpty: boolean;
  summarySlide: {
    totalGoals: number;
    totalBets: number;
    totalKrs: number;
    totalInitiatives: number;
  };
  risksSlide: Array<{
    id: number;
    title: string;
    severity: string;
    status: string;
  }>;
  krsSlide: Array<{
    id: number;
    title: string;
    manualProgress: number | null;
    status: string;
  }>;
  finalReportSlide?: {
    title: string;
    executiveSummary: string;
    achievements: string;
  } | null;
}

export interface PresentationNavigationDto {
  activeSlide: PresentationSlideType;
  canGoNext: boolean;
  canGoPrev: boolean;
  zoomPercent: number;
}
