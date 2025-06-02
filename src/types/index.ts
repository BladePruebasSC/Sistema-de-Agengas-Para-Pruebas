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
  status: 'confirmed' | 'cancelled';
}

export interface Holiday {
  id: string;
  date: Date;
  description: string;
}

export interface BlockedTime {
  id: string;
  date: Date;
  time: string;  // Esto debe coincidir exactamente con la columna 'time' en Supabase
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

export interface AppointmentContextType {
  appointments: Appointment[];
  holidays: Holiday[];
  blockedTimes: BlockedTime[];
  userPhone: string | null;
  createAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<Appointment>;
  createHoliday: (holiday: Omit<Holiday, 'id'>) => Promise<Holiday>;
  createBlockedTime: (blockedTime: Omit<BlockedTime, 'id'>) => Promise<BlockedTime>;
  deleteAppointment: (id: string) => Promise<void>;  // Cambiado de number a string
  deleteHoliday: (id: string) => Promise<void>;
  deleteBlockedTime: (id: string) => Promise<void>;
  setUserPhone: (phone: string | null) => void;  // Agregado null como posible valor
  isTimeSlotAvailable: (date: Date, time: string) => boolean;
}