export interface BlockedTime {
  id?: string;
  date: Date;
  timeSlots: string[];
  reason?: string;
}