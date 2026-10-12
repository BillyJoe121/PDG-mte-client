/**
 * DTO contract for decoupled three-layer progress visibility
 * Story: HT-034
 * Governed by: AD-2, AD-4, AD-9
 */
export interface ProgressTripletDto {
  keyResultId: number;
  krManualProgress: number | null; // null represents NO_DATA
  krManualStatus: string | null;
  initiativeProgresses: Array<{
    initiativeId: number;
    title: string;
    manualProgress: number;
    status: string;
  }>;
  plannerTaskStatusSummary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    notStartedTasks: number;
    staleTasks: number;
  };
}
