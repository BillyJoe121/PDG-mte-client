/**
 * DTO contracts for detailed Initiative view combining KR, Initiative, and Task progress
 * Story: HT-026 (FR-026, Priority: P1)
 * Governed by: AD-1, AD-4, AD-9
 */
import { InitiativeDto } from './InitiativeDto';
import { PlannerTaskRefDto } from './PlannerTaskRefDto';

export interface InitiativeDetailQueryDto {
  initiativeId: number;
}

export interface InitiativeDetailDto {
  initiative: InitiativeDto;
  parentKeyResult: {
    id: number;
    name: string;
    progressPercentage: number;
    status: string;
  };
  manualProgressPercentage: number;
  tasks: PlannerTaskRefDto[];
  historicalProgress: Array<{
    id: number;
    progressPercent: number;
    status: string;
    comment: string;
    actorName: string;
    occurredAt: string;
  }>;
}
