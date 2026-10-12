/**
 * DTO contracts for Role-Based Contextual Tutorial
 * Story: HT-064
 * Governed by: AD-1, AD-2, AD-5
 */
export interface TutorialStepDto {
  stepId: string;
  roleTarget: string;
  title: string;
  explanation: string;
  targetSelector?: string;
}

export interface TutorialProgressDto {
  userId: string;
  roleContext: string;
  currentStepIndex: number;
  completedSteps: string[];
  isCompleted: boolean;
  isSkipped: boolean;
}

export interface TutorialUpdateDto {
  stepIndex?: number;
  completedStep?: string;
  isCompleted?: boolean;
  isSkipped?: boolean;
  reset?: boolean;
}
