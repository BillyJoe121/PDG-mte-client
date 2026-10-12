/**
 * DTO contracts for Review Cadence Reminders
 * Story: HT-038
 * Governed by: AD-2, AD-4, AD-6
 */
export interface KrReminderDto {
  keyResultId: number;
  reminderActive: boolean;
  cadenceDays: number;
  daysSinceLastCheckIn: number | null;
  responsiblePerson: string;
  dueDate?: string;
  status: 'READY';
}
