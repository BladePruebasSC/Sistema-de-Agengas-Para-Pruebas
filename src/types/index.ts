export interface TimeSlot {
  time: string;
  available: boolean;
  isBusinessHour: boolean;
}

export interface CreateAppointmentData {
  date: Date;
  time: string;
  clientName: string;
  clientPhone: string;
  service: string;
  confirmed: boolean;
  barber_id?: string;
  barberId?: string; // Compatibilidad hacia atrás
}

export interface Appointment extends CreateAppointmentData {
  id: string;
  created_at: string;
  barber_id?: string;
  cancelled?: boolean;
  cancelled_at?: string;
}

export interface Holiday {
  id: string;
  date: Date;
  description: string;
  barber_id?: string; // New field
}

export interface BlockedTime {
  id: string;
  date: Date;
  time: string;
  timeSlots: string[];
  reason: string;
  barber_id?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

export interface Barber {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  access_key?: string; // New field
}

export interface BusinessHours {
  id: string;
  day_of_week: number; // 0=Domingo, 6=Sábado
  is_open: boolean;
  morning_start?: string;
  morning_end?: string;
  afternoon_start?: string;
  afternoon_end?: string;
}

export interface BarberSchedule {
  id: string;
  barber_id: string;
  day_of_week: number;
  is_available: boolean;
  morning_start?: string;
  morning_end?: string;
  afternoon_start?: string;
  afternoon_end?: string;
}

export interface AdminSettings {
  id: string;
  early_booking_restriction: boolean;
  early_booking_hours: number;
  restricted_hours: string[];
  multiple_barbers_enabled: boolean;
  default_barber_id?: string;
  reviews_enabled?: boolean; // Nueva propiedad para controlar reseñas
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  client_name: string;
  client_phone: string;
  rating: number;
  comment: string;
  service_used: string;
  barber_id?: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  barber?: {
    id: string;
    name: string;
  };
}

export interface CreateReviewData {
  client_name: string;
  client_phone: string;
  rating: number;
  comment: string;
  service_used: string;
  barber_id?: string;
}

export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface TwilioError {
  status: number;
  message: string;
  code: string;
  moreInfo: string;
}

export interface TwilioResponse {
  sid: string;
  status: string;
  message: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface TwilioMessageData {
  clientPhone: string;
  body: string;
}

export interface Cita {
  id: number;
  nombre: string;
  telefono: string;
  fecha: string;
  hora: string;
  servicio: string;
}