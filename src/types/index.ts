export interface TimeSlot {
  time: string;
  available: boolean;
  isBusinessHour: boolean;
}

export interface Appointment {
  id: string;
  date: Date;
  time: string;
  clientName: string;
  clientPhone: string;
  service: string;
  confirmed: boolean;
}

export interface Holiday {
  id: string;
  date: Date;
  description: string;
}

export interface BlockedTime {
  id: string;
  date: Date;
  time: string;
  reason: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

export interface BusinessHours {
  [key: string]: {
    morning?: { start: string; end: string };
    afternoon?: { start: string; end: string };
  };
}

export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';