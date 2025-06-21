import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Appointment, Holiday, BlockedTime, Barber, BusinessHours, BarberSchedule, AdminSettings, Review, CreateReviewData, Service } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { notifyAppointmentCreated, notifyAppointmentCancelled } from '../services/whatsappService';
import { formatDateForSupabase, parseSupabaseDate, isSameDate, isDateBefore, isFutureDate } from '../utils/dateUtils';
import { format, startOfDay } from 'date-fns';

interface AppointmentContextType {
  appointments: Appointment[];
  holidays: Holiday[];
  blockedTimes: BlockedTime[];
  barbers: Barber[];
  businessHours: BusinessHours[];
  barberSchedules: BarberSchedule[];
  adminSettings: AdminSettings;
  reviews: Review[];
  services: Service[]; // Added services
  userPhone: string | null;
  setUserPhone: (phone: string) => void;
  cancelAppointment: (id: string) => Promise<void>;
  createAppointment: (appointmentData: CreateAppointmentData) => Promise<Appointment>;
  createHoliday: (holidayData: Omit<Holiday, 'id'>) => Promise<Holiday>;
  createBlockedTime: (blockedTimeData: Omit<BlockedTime, 'id'>) => Promise<BlockedTime>;
  removeHoliday: (id: string) => Promise<void>;
  removeBlockedTime: (id: string) => Promise<void>;
  isTimeSlotAvailable: (date: Date, time: string, barberId?: string) => Promise<boolean>;
  getDayAvailability: (date: Date, barberId?: string) => Promise<{ [hour: string]: boolean }>;
  getAvailableHoursForDate: (date: Date, barberId?: string) => string[];
  formatHour12h: (hour24: string) => string;
  loadAdminSettings: () => Promise<void>;
  getFutureAppointments: () => Appointment[];
  getActiveAppointments: () => Appointment[];
  // Funciones para barberos
  createBarber: (barberData: Omit<Barber, 'id' | 'created_at' | 'updated_at'>) => Promise<Barber>;
  updateBarber: (id: string, barberData: Partial<Barber>) => Promise<void>;
  deleteBarber: (id: string) => Promise<void>;
  // Funciones para horarios de negocio
  updateBusinessHours: (dayOfWeek: number, hours: Partial<BusinessHours>) => Promise<void>;
  // Funciones para horarios de barberos
  updateBarberSchedule: (barberId: string, dayOfWeek: number, schedule: Partial<BarberSchedule>) => Promise<void>;
  // Función para actualizar configuración
  updateAdminSettings: (settings: Partial<AdminSettings>) => Promise<void>;
  // Funciones para reseñas
  createReview: (reviewData: CreateReviewData) => Promise<Review>;
  updateReview: (id: string, reviewData: Partial<Review>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  getApprovedReviews: () => Review[];
  getAverageRating: () => number;
  // Barber Access Key Auth
  loggedInBarber: Barber | null;
  verifyBarberAccessKey: (accessKey: string) => Promise<Barber | null>;
  logoutBarber: () => void;
  getAppointmentsForBarber: (barberId: string) => Appointment[];
}

// Genera un rango de horas en formato HH:00
const generateHoursRange = (start: number, end: number) => {
  const hours: string[] = [];
  for (let h = start; h <= end; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return hours;
};

// Convierte "15:00" en "3:00 PM" para mostrar en UI
const formatHour12h = (hour24: string): string => {
  if (!hour24) return '';
  const [h, m] = hour24.split(':');
  let hour = parseInt(h, 10);
  const minute = m || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
};

// Función para verificar restricción de horarios con antelación
const isRestrictedHourWithAdvance = (date: Date, time: string, adminSettings: AdminSettings): boolean => {
  if (!adminSettings.early_booking_restriction) return false;
  
  // Verificar si el horario está en la lista de horarios restringidos
  if (!adminSettings.restricted_hours?.includes(time)) return false;
  
  const now = new Date();
  const appointmentDateTime = new Date(date);
  
  // Convertir tiempo de 12h a 24h para comparación
  let hour = 0;
  if (time.includes('AM')) {
    hour = parseInt(time.split(':')[0]);
    if (hour === 12) hour = 0;
  } else if (time.includes('PM')) {
    hour = parseInt(time.split(':')[0]);
    if (hour !== 12) hour += 12;
  }
  
  appointmentDateTime.setHours(hour, 0, 0, 0);
  
  const diffMs = appointmentDateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours < adminSettings.early_booking_hours;
};

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [barberSchedules, setBarberSchedules] = useState<BarberSchedule[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]); // Added services state
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    id: '',
    early_booking_restriction: false,
    early_booking_hours: 12,
    restricted_hours: ['7:00 AM', '8:00 AM'],
    multiple_barbers_enabled: false,
    reviews_enabled: true,
    created_at: '',
    updated_at: ''
  });
  const [userPhone, setUserPhone] = useState<string | null>(() => localStorage.getItem('userPhone'));
  const [loggedInBarber, setLoggedInBarber] = useState<Barber | null>(null);

  // Función para cargar configuración de admin
  const loadAdminSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAdminSettings(data);
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  // Función para obtener solo citas futuras activas (no canceladas)
  const getFutureAppointments = useCallback((): Appointment[] => {
    const today = new Date();
    return appointments.filter(appointment => {
      return !appointment.cancelled && (isSameDate(appointment.date, today) || isFutureDate(appointment.date));
    });
  }, [appointments]);

  // Función para obtener citas activas (no canceladas)
  const getActiveAppointments = useCallback((): Appointment[] => {
    return appointments.filter(appointment => !appointment.cancelled);
  }, [appointments]);

  // Función para obtener horarios disponibles según configuración (con soporte para barberos específicos)
  const getAvailableHoursForDate = useCallback((date: Date, barberId?: string): string[] => {
    const dayOfWeek = date.getDay();
    
    // Si hay barberId específico y horarios de barbero habilitados, usar horarios del barbero
    if (barberId && adminSettings.multiple_barbers_enabled) {
      const barberSchedule = barberSchedules.find(bs => 
        bs.barber_id === barberId && bs.day_of_week === dayOfWeek
      );
      
      if (barberSchedule && !barberSchedule.is_available) {
        return []; // Barbero no disponible este día
      }
      
      if (barberSchedule) {
        const hours: string[] = [];
        
        // Horarios de mañana del barbero
        if (barberSchedule.morning_start && barberSchedule.morning_end) {
          const startHour = parseInt(barberSchedule.morning_start.split(':')[0]);
          const endHour = parseInt(barberSchedule.morning_end.split(':')[0]);
          hours.push(...generateHoursRange(startHour, endHour - 1));
        }
        
        // Horarios de tarde del barbero
        if (barberSchedule.afternoon_start && barberSchedule.afternoon_end) {
          const startHour = parseInt(barberSchedule.afternoon_start.split(':')[0]);
          const endHour = parseInt(barberSchedule.afternoon_end.split(':')[0]);
          hours.push(...generateHoursRange(startHour, endHour - 1));
        }
        
        return hours.map(formatHour12h);
      }
    }
    
    // Usar horarios generales del negocio
    const dayHours = businessHours.find(bh => bh.day_of_week === dayOfWeek);
    
    if (!dayHours || !dayHours.is_open) return [];
    
    const hours: string[] = [];
    
    // Horarios de mañana
    if (dayHours.morning_start && dayHours.morning_end) {
      const startHour = parseInt(dayHours.morning_start.split(':')[0]);
      const endHour = parseInt(dayHours.morning_end.split(':')[0]);
      hours.push(...generateHoursRange(startHour, endHour - 1));
    }
    
    // Horarios de tarde
    if (dayHours.afternoon_start && dayHours.afternoon_end) {
      const startHour = parseInt(dayHours.afternoon_start.split(':')[0]);
      const endHour = parseInt(dayHours.afternoon_end.split(':')[0]);
      hours.push(...generateHoursRange(startHour, endHour - 1));
    }
    
    return hours.map(formatHour12h);
  }, [businessHours, barberSchedules, adminSettings.multiple_barbers_enabled]);

  // Función para obtener reseñas aprobadas
  const getApprovedReviews = useCallback((): Review[] => {
    return reviews.filter(review => review.is_approved);
  }, [reviews]);

  // Función para calcular calificación promedio
  const getAverageRating = useCallback((): number => {
    const approvedReviews = getApprovedReviews();
    if (approvedReviews.length === 0) return 0;
    
    const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / approvedReviews.length) * 10) / 10;
  }, [getApprovedReviews]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          barber:barbers(id, name)
        `)
        .order('date', { ascending: true });
      if (error) throw error;
      const formattedAppointments = data.map(appointment => ({
        ...appointment,
        date: parseSupabaseDate(appointment.date)
      }));
      setAppointments(formattedAppointments);
    } catch (error) {
      toast.error('Error al cargar las citas');
    }
  };

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*, barber_id') // Ensure barber_id is selected
        .order('date', { ascending: true });
      if (error) throw error;
      const formattedHolidays = data.map(holiday => ({
        ...holiday,
        date: parseSupabaseDate(holiday.date)
      }));
      setHolidays(formattedHolidays);
    } catch (error) {
      toast.error('Error al cargar los feriados');
    }
  };

  const fetchBlockedTimes = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_times')
        .select('*, barber_id') // Ensure barber_id is selected
        .order('date', { ascending: true });
      if (error) throw error;
      const formattedBlockedTimes = data.map(blockedTime => ({
        ...blockedTime,
        date: parseSupabaseDate(blockedTime.date)
      }));
      setBlockedTimes(formattedBlockedTimes);
    } catch (error) {
      toast.error('Error al cargar los horarios bloqueados');
    }
  };

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      setBarbers(data || []);
    } catch (error) {
      toast.error('Error al cargar los barberos');
    }
  };

  const fetchBusinessHours = async () => {
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      setBusinessHours(data || []);
    } catch (error) {
      toast.error('Error al cargar los horarios de negocio');
    }
  };

  const fetchBarberSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('barber_schedules')
        .select('*')
        .order('barber_id, day_of_week', { ascending: true });
      if (error) throw error;
      setBarberSchedules(data || []);
    } catch (error) {
      toast.error('Error al cargar los horarios de barberos');
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          barber:barbers(id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      toast.error('Error al cargar las reseñas');
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Error al cargar los servicios');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await loadAdminSettings();
      await Promise.all([
        fetchAppointments(),
        fetchHolidays(),
        fetchBlockedTimes(),
        fetchBarbers(),
        fetchBusinessHours(),
        fetchBarberSchedules(),
        fetchReviews(),
        fetchServices() // Added fetchServices
      ]);
    };
    
    initializeData();
  }, []);

  const isTimeSlotAvailable = useCallback(async (date: Date, time: string, barberId?: string): Promise<boolean> => {
    try {
      // Verificar restricción de horarios con antelación
      if (isRestrictedHourWithAdvance(date, time, adminSettings)) {
        return false;
      }

      const formattedDate = formatDateForSupabase(date);
      
      // Verify holidays considering barber_id
      let holidayQueryBuilder = supabase
        .from('holidays')
        .select('id, barber_id')
        .eq('date', formattedDate);

      const { data: holidaysOnDate, error: holidaysError } = await holidayQueryBuilder;

      if (holidaysError) {
        console.error("Error fetching holidays in isTimeSlotAvailable:", holidaysError);
        return false; // Fail safe, assume unavailable if error
      }

      if (holidaysOnDate && holidaysOnDate.length > 0) {
        const isGeneralHoliday = holidaysOnDate.some(h => h.barber_id === null);
        if (isGeneralHoliday) {
          return false; // General holiday makes it unavailable for everyone
        }
        if (barberId) {
          const isBarberSpecificHoliday = holidaysOnDate.some(h => h.barber_id === barberId);
          if (isBarberSpecificHoliday) {
            return false; // Specific holiday for this barber
          }
        }
      }
      
      // Verificar horarios bloqueados
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_times')
        .select('time, timeSlots, barber_id') // Fetch barber_id
        .eq('date', formattedDate);

      if (blockedError) {
        console.error("Error fetching blocked times in isTimeSlotAvailable:", blockedError);
        return false; // Fail safe
      }
      
      if (blockedData && blockedData.some(block => {
        const isSlotMatch = (block.time && block.time === time) ||
                           (block.timeSlots && Array.isArray(block.timeSlots) && block.timeSlots.includes(time));
        if (!isSlotMatch) return false; // This specific block doesn't match the time slot.

        let queryBarberIdAsNumber: number | null = null;
        if (barberId && typeof barberId === 'string') {
          const parsed = parseInt(barberId, 10);
          if (!isNaN(parsed)) {
            queryBarberIdAsNumber = parsed;
          }
        } else if (typeof barberId === 'number') { // Should not happen if barberId comes from select value, but good for robustness
          queryBarberIdAsNumber = barberId;
        }


        console.log(`[LOG isTimeSlotAvailable] Date: ${formattedDate}, Time: ${time}, Querying for barberId (string): "${barberId}", ParsedAsNumber: ${queryBarberIdAsNumber}, Current Block: ${JSON.stringify(block)}`);

        // Correct logic: callback returns true if THIS block makes the slot unavailable for the query.
        if (block.barber_id === null) {
          console.log(`[LOG isTimeSlotAvailable] -> General block applies.`);
          return true; // General block applies
        }
        if (queryBarberIdAsNumber !== null && block.barber_id === queryBarberIdAsNumber) {
          console.log(`[LOG isTimeSlotAvailable] -> Specific block for barber ${queryBarberIdAsNumber} applies.`);
          return true; // Specific block for the queried barber applies
        }
        console.log(`[LOG isTimeSlotAvailable] -> Block for barber ${block.barber_id} does not apply to query for ${queryBarberIdAsNumber}.`);
        return false; // Specific block for a different barber, or general query for a specific block (doesn't make slot unavailable for this rule)
      })) {
        console.log(`[LOG isTimeSlotAvailable] Slot ${time} on ${formattedDate} for barber ${queryBarberIdAsNumber} is BLOCKED by a rule.`);
        return false; // If .some() found an applicable block, the slot is NOT available.
      }
      console.log(`[LOG isTimeSlotAvailable] Slot ${time} on ${formattedDate} for barber ${queryBarberIdAsNumber} is AVAILABLE (after all blocks).`);
      
      // Verificar citas existentes
      let appointmentQuery = supabase
        .from('appointments')
        .select('id,time')
        .eq('date', formattedDate)
        .eq('time', time)
        .eq('cancelled', false);
      
      if (barberId) {
        appointmentQuery = appointmentQuery.eq('barber_id', barberId);
      }
      
      const { data: appointmentsData } = await appointmentQuery;
      
      if (appointmentsData && appointmentsData.length > 0) return false;
      
      return true;
    } catch (err) {
      return false;
    }
  }, [adminSettings]);

  const getDayAvailability = useCallback(async (date: Date, barberId?: string) => {
    const formattedDate = formatDateForSupabase(date);
    const hours = getAvailableHoursForDate(date, barberId);
    if (hours.length === 0) return {};

    const [{ data: holidaysData }, { data: blockedData }, { data: appointmentsData }] = await Promise.all([
      supabase.from('holidays').select('id, barber_id').eq('date', formattedDate),
      supabase.from('blocked_times').select('time, timeSlots, barber_id').eq('date', formattedDate), // Fetch barber_id
      barberId 
        ? supabase.from('appointments').select('time').eq('date', formattedDate).eq('barber_id', barberId).eq('cancelled', false)
        : supabase.from('appointments').select('time').eq('date', formattedDate).eq('cancelled', false),
    ]);

    const availability: { [hour: string]: boolean } = {};

    // Process holidays considering barber_id
    let activeHolidaysForContext = false;
    if (holidaysData && holidaysData.length > 0) {
      const isGeneralHoliday = holidaysData.some(h => h.barber_id === null);
      if (isGeneralHoliday) {
        activeHolidaysForContext = true;
      } else if (barberId) { // Only check barber-specific if no general holiday
        const isBarberSpecificHoliday = holidaysData.some(h => h.barber_id === barberId);
        if (isBarberSpecificHoliday) {
          activeHolidaysForContext = true;
        }
      }
      // If not multiple_barbers_enabled, any holiday (even barber specific) might count as general
      // For now, sticking to the logic: general holidays block all, specific holidays block specific barber.
    }

    if (activeHolidaysForContext) {
      hours.forEach(h => { availability[h] = false; });
      return availability; // If it's a holiday for the current context, all hours are unavailable.
    }

    const blockedSlots = new Set<string>();
    if (blockedData) {
      let queryBarberIdAsNumber: number | null = null;
      if (barberId && typeof barberId === 'string') {
        const parsed = parseInt(barberId, 10);
        if (!isNaN(parsed)) {
          queryBarberIdAsNumber = parsed;
        }
      } else if (typeof barberId === 'number') { // Should not happen
        queryBarberIdAsNumber = barberId;
      }
      console.log(`[LOG getDayAvailability] Date: ${formattedDate}, Querying for barberId (string): "${barberId}", ParsedAsNumber: ${queryBarberIdAsNumber}`);
      console.log(`[LOG getDayAvailability] All blockedData for date ${formattedDate}:`, JSON.stringify(blockedData));

      for (const block of blockedData) {
        console.log(`[LOG getDayAvailability] Processing Block: queryForBarber=${queryBarberIdAsNumber}, blockInfo=${JSON.stringify(block)}`);
        const isApplicableBlock = block.barber_id === null || (queryBarberIdAsNumber !== null && block.barber_id === queryBarberIdAsNumber);
        console.log(`[LOG getDayAvailability] -> Is block applicable? ${isApplicableBlock}`);

        if (isApplicableBlock) {
          if (block.timeSlots && Array.isArray(block.timeSlots)) {
            block.timeSlots.forEach((slot: string) => blockedSlots.add(slot));
          }
          if (block.time) { // Ensure single 'time' entries are also added
            blockedSlots.add(block.time);
          }
        }
      }
    }

    const takenSlots = new Set<string>();
    if (appointmentsData) {
      for (const app of appointmentsData) {
        if (app.time) takenSlots.add(app.time);
      }
    }

    for (const hour of hours) {
      const isRestricted = isRestrictedHourWithAdvance(date, hour, adminSettings);
      availability[hour] = !(blockedSlots.has(hour) || takenSlots.has(hour) || isRestricted);
    }
    return availability;
  }, [adminSettings, getAvailableHoursForDate]);

  const createAppointment = async (appointmentData: CreateAppointmentData): Promise<Appointment> => {
    try {
      // Verificar restricción de horarios con antelación antes de crear
      if (isRestrictedHourWithAdvance(appointmentData.date, appointmentData.time, adminSettings)) {
        const restrictedHours = adminSettings.restricted_hours?.join(', ') || 'ciertos horarios';
        throw new Error(`Los horarios ${restrictedHours} requieren reserva con ${adminSettings.early_booking_hours} horas de antelación`);
      }

      const formattedDate = formatDateForSupabase(appointmentData.date);
      
      let determinedBarberId = appointmentData.barber_id || appointmentData.barberId;

      // Check if the determinedBarberId is a valid identifier (non-empty string or a number)
      let isValidBarberId = (typeof determinedBarberId === 'string' && determinedBarberId.trim() !== "") ||
                             (typeof determinedBarberId === 'number' && !isNaN(determinedBarberId));

      if (!isValidBarberId) {
        // If appointmentData didn't provide a valid ID, try the default admin setting.
        const defaultBarberId = adminSettings.default_barber_id;
        const isDefaultBarberIdValid = (typeof defaultBarberId === 'string' && defaultBarberId.trim() !== "") ||
                                       (typeof defaultBarberId === 'number' && !isNaN(defaultBarberId));

        if (isDefaultBarberIdValid) {
          determinedBarberId = defaultBarberId;
          isValidBarberId = true; // Default ID is valid
        } else {
          // No valid ID from appointmentData, and no valid default_barber_id either.
          if (adminSettings.multiple_barbers_enabled) {
            console.error("Error: No barber ID provided in appointmentData, and no valid default_barber_id is set, while multiple barbers are enabled.");
            throw new Error('No se pudo determinar un barbero para la cita. Por favor, seleccione un barbero o configure un barbero por defecto.');
          } else {
            // Single barber mode, but default_barber_id is missing or invalid.
            // Or, if not multiple_barbers_enabled, but determinedBarberId was still somehow invalid (e.g. null from a bug)
            console.error("Error: default_barber_id is not set or is invalid, or no barberId provided in single barber mode.");
            throw new Error('Error de configuración: El barbero por defecto no está configurado o es inválido, o no se proporcionó barbero.');
          }
        }
      }

      // Final check: After attempting to use appointmentData and default_barber_id,
      // determinedBarberId must be valid.
      if (!isValidBarberId) {
         // This should ideally not be reached if the logic above is correct.
        console.error("Critical Error: determinedBarberId is still not valid after all checks.");
        throw new Error('Error crítico inesperado al determinar el barbero para la cita.');
      }

      // If determinedBarberId was a string, trim it. Numbers don't need trimming.
      if (typeof determinedBarberId === 'string') {
        determinedBarberId = determinedBarberId.trim();
      }

      console.log('Attempting to create appointment with data:', {
        date: formattedDate,
        time: appointmentData.time,
        clientName: appointmentData.clientName,
        clientPhone: appointmentData.clientPhone,
        service: appointmentData.service,
        confirmed: appointmentData.confirmed,
        barber_id: determinedBarberId, // Log the actual value being sent
        cancelled: false
      });
      
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert([{ 
          date: formattedDate,
          time: appointmentData.time,
          clientName: appointmentData.clientName,
          clientPhone: appointmentData.clientPhone,
          service: appointmentData.service,
          confirmed: appointmentData.confirmed,
          barber_id: determinedBarberId,
          cancelled: false
        }])
        .select(`
          *,
          barber:barbers(id, name, phone)
        `)
        .single();
      if (error) {
        console.error('Supabase error creating appointment:', error); // Log the full Supabase error
        throw new Error(`Error al crear la cita en la base de datos: ${error.message}`); // Include Supabase message
      }
      
      try {
        // Obtener el barbero para la notificación
        const barber = barbers.find(b => b.id === determinedBarberId) || newAppointment.barber;
        const barberPhone = barber?.phone || '+18092033894';
        
        // Enviar notificaciones por WhatsApp Web
        await notifyAppointmentCreated({
          clientPhone: appointmentData.clientPhone,
          clientName: appointmentData.clientName,
          date: format(appointmentData.date, 'dd/MM/yyyy'),
          time: appointmentData.time,
          service: appointmentData.service,
          barberName: barber?.name || 'Barbero',
          barberPhone
        });
      } catch (whatsappError) {
        console.error('Error enviando WhatsApp:', whatsappError);
        // No fallar la creación de cita si WhatsApp falla
      }

      const parsedAppointment = {
        ...newAppointment,
        date: parseSupabaseDate(newAppointment.date)
      };
      setAppointments(prev => [...prev, parsedAppointment]);
      toast.success('Cita creada exitosamente');
      return parsedAppointment;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear la cita');
      throw error;
    }
  };

  const cancelAppointment = async (id: string): Promise<void> => {
    try {
      const appointmentToCancel = appointments.find(app => app.id === id);
      if (!appointmentToCancel) return;
      
      // Marcar como cancelada en lugar de borrar
      const { error } = await supabase
        .from('appointments')
        .update({ 
          cancelled: true, 
          cancelled_at: new Date().toISOString() 
        })
        .eq('id', id);
      if (error) throw error;
      
      setAppointments(prev => prev.map(app => 
        app.id === id 
          ? { ...app, cancelled: true, cancelled_at: new Date().toISOString() }
          : app
      ));
      
      try {
        // Notificación al CLIENTE cuando el negocio/barbero cancela
        const barber = barbers.find(b => b.id === appointmentToCancel.barber_id);
        
        await notifyAppointmentCancelled({
          recipientPhone: appointmentToCancel.clientPhone, // Enviar al cliente
          clientName: appointmentToCancel.clientName,
          clientPhone: appointmentToCancel.clientPhone, // Aún necesario para contexto del mensaje si se reutiliza la interfaz
          date: format(appointmentToCancel.date, 'dd/MM/yyyy'),
          time: appointmentToCancel.time,
          service: appointmentToCancel.service,
          barberName: barber?.name || 'la Barbería', // Nombre del barbero o genérico
          cancellationInitiator: 'business', // Cancelación iniciada por el negocio
          // businessName: "D' Gastón Stylo Barbería" // Opcional, si se quiere pasar explícitamente
        });
      } catch (whatsappError) {
        console.error('Error enviando WhatsApp de notificación de cancelación al cliente:', whatsappError);
        // No fallar la cancelación de la cita si la notificación de WhatsApp falla
        toast.error('Cita cancelada, pero hubo un error al notificar al cliente por WhatsApp.');
      }

      toast.success('Cita cancelada exitosamente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Error al cancelar la cita');
    }
  };

  const createHoliday = async (holidayData: Omit<Holiday, 'id'>): Promise<Holiday> => {
    try {
      const formattedDate = formatDateForSupabase(holidayData.date);
      let existingHolidayCheckQuery = supabase.from('holidays').select('id').eq('date', formattedDate);

      if (holidayData.barber_id) {
        // Creating a barber-specific holiday
        // Check if THIS barber already has a holiday on this date
        existingHolidayCheckQuery = existingHolidayCheckQuery.eq('barber_id', holidayData.barber_id);
        const { data: existingSpecificHoliday, error: checkError } = await existingHolidayCheckQuery;
        if (checkError) throw checkError;
        if (existingSpecificHoliday && existingSpecificHoliday.length > 0) {
          throw new Error('Este barbero ya tiene un feriado programado en esta fecha.');
        }
      } else {
        // Creating a general holiday
        // Check if a GENERAL holiday already exists on this date
        existingHolidayCheckQuery = existingHolidayCheckQuery.is('barber_id', null);
        const { data: existingGeneralHoliday, error: checkError } = await existingHolidayCheckQuery;
        if (checkError) throw checkError;
        if (existingGeneralHoliday && existingGeneralHoliday.length > 0) {
          throw new Error('Ya existe un feriado general programado en esta fecha.');
        }
      }

      // Proceed to insert if no conflicting holiday found based on the new logic
      const insertData: any = {
        date: formattedDate,
        description: holidayData.description,
        barber_id: holidayData.barber_id || null // Ensure barber_id is explicitly null if not provided
      };

      const { data, error } = await supabase
        .from('holidays')
        .insert([insertData]) // holidayData might contain barber_id
        .select('*, barber_id') // Ensure barber_id is selected on return
        .single();
      if (error) throw error;

      const newHoliday = { ...data, date: parseSupabaseDate(data.date) };
      setHolidays(prev => [...prev, newHoliday].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())); // Keep sorted
      toast.success(holidayData.barber_id ? 'Feriado específico para barbero agregado.' : 'Feriado general agregado.');
      return newHoliday;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el feriado');
      throw error;
    }
  };

  const removeHoliday = async (id: string): Promise<void> => {
    try {
      const holidayToRemove = holidays.find(h => h.id === id);
      if (!holidayToRemove) return;
      const { error } = await supabase.from('holidays').delete().eq('id', id);
      if (error) throw error;
      setHolidays(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      throw error;
    }
  };

  const createBlockedTime = async (blockedTimeData: Omit<BlockedTime, 'id' | 'barber_id'> & { barber_id?: string }): Promise<BlockedTime> => {
    console.log('[createBlockedTime] Received blockedTimeData:', JSON.stringify(blockedTimeData)); // DEBUG LOG
    try {
      const formattedDate = formatDateForSupabase(blockedTimeData.date);
      const dataToInsert = {
        date: formattedDate,
        time: Array.isArray(blockedTimeData.timeSlots) ? blockedTimeData.timeSlots[0] : blockedTimeData.timeSlots,
        timeSlots: blockedTimeData.timeSlots,
        reason: blockedTimeData.reason || 'Horario bloqueado',
        // Ensure barber_id is a number if present, otherwise null
        barber_id: blockedTimeData.barber_id ? Number(blockedTimeData.barber_id) : null
      };
      console.log('[createBlockedTime] Data to insert into Supabase:', JSON.stringify(dataToInsert)); // DEBUG LOG
      const { data, error } = await supabase
        .from('blocked_times')
        .insert([dataToInsert])
        .select('*, barber_id') // Ensure barber_id is selected
        .single();
      if (error) throw error;

      const newBlockedTime = { ...data, date: parseSupabaseDate(data.date) };
      setBlockedTimes(prev => [...prev, newBlockedTime]);

      // Optional: Update toast message
      const barberName = blockedTimeData.barber_id ? barbers.find(b => b.id === blockedTimeData.barber_id)?.name : null;
      if (barberName) {
        toast.success(`Horario bloqueado para ${barberName}`);
      } else {
        toast.success('Horario bloqueado (general)');
      }
      return newBlockedTime;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el bloqueo de horario');
      throw error;
    }
  };

  const removeBlockedTime = async (id: string): Promise<void> => {
    try {
      const blockedTimeToRemove = blockedTimes.find(bt => bt.id === id);
      if (!blockedTimeToRemove) return;
      const { error } = await supabase.from('blocked_times').delete().eq('id', id);
      if (error) throw error;
      setBlockedTimes(prev => prev.filter(bt => bt.id !== id));
    } catch (error) {
      throw error;
    }
  };

  // Funciones para barberos
  const createBarber = async (barberData: Omit<Barber, 'id' | 'created_at' | 'updated_at'>): Promise<Barber> => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .insert([barberData])
        .select()
        .single();
      if (error) throw error;
      setBarbers(prev => [...prev, data]);
      toast.success('Barbero agregado exitosamente');
      return data;
    } catch (error) {
      toast.error('Error al agregar barbero');
      throw error;
    }
  };

  const updateBarber = async (id: string, barberData: Partial<Barber>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('barbers')
        .update(barberData)
        .eq('id', id);
      if (error) throw error;
      setBarbers(prev => prev.map(b => b.id === id ? { ...b, ...barberData } : b));
      toast.success('Barbero actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar barbero');
      throw error;
    }
  };

  const deleteBarber = async (id: string): Promise<void> => {
    console.log(`[deleteBarber] Attempting to delete barber with id: ${id}`);
    try {
      // First, delete related barber_schedules
      console.log(`[deleteBarber] Deleting barber_schedules for barber_id: ${id}`);
      const { error: scheduleError } = await supabase
        .from('barber_schedules')
        .delete()
        .eq('barber_id', id);

      if (scheduleError) {
        console.error(`[deleteBarber] Error deleting barber schedules for barber_id: ${id}`, scheduleError);
        throw new Error(`Error al eliminar los horarios del barbero: ${scheduleError.message}`);
      }
      console.log(`[deleteBarber] Successfully deleted barber_schedules for barber_id: ${id}`);

      // Then, delete the barber
      console.log(`[deleteBarber] Deleting barber from barbers table with id: ${id}`);
      const { error: barberError } = await supabase
        .from('barbers')
        .delete()
        .eq('id', id);

      if (barberError) {
        console.error(`[deleteBarber] Error deleting barber from barbers table with id: ${id}`, barberError);
        throw new Error(`Error al eliminar el barbero: ${barberError.message}`);
      }
      console.log(`[deleteBarber] Successfully deleted barber from barbers table with id: ${id}`);

      setBarbers(prev => prev.filter(b => b.id !== id));
      // Also update barberSchedules state locally if needed, though re-fetch might be simpler
      setBarberSchedules(prev => prev.filter(bs => bs.barber_id !== id));
      toast.success('Barbero y sus horarios eliminados exitosamente');
    } catch (error) {
      console.error(`[deleteBarber] Catch block error for barber_id: ${id}`, error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar barbero');
      throw error; // Re-throw para que el llamador pueda saber que falló
    }
  };

  // Funciones para horarios de negocio
  const updateBusinessHours = async (dayOfWeek: number, hours: Partial<BusinessHours>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('business_hours')
        .upsert({ 
          day_of_week: dayOfWeek, 
          ...hours,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      await fetchBusinessHours();
      toast.success('Horarios actualizados exitosamente');
    } catch (error) {
      toast.error('Error al actualizar horarios');
      throw error;
    }
  };

  // Funciones para horarios de barberos
  const updateBarberSchedule = async (barberId: string, dayOfWeek: number, schedule: Partial<BarberSchedule>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('barber_schedules')
        .upsert({ 
          barber_id: barberId,
          day_of_week: dayOfWeek, 
          ...schedule,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      await fetchBarberSchedules();
      toast.success('Horario del barbero actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar horario del barbero');
      throw error;
    }
  };

  // Función para actualizar configuración
  const updateAdminSettings = async (settings: Partial<AdminSettings>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminSettings.id);
      if (error) throw error;
      setAdminSettings(prev => ({ ...prev, ...settings }));
      toast.success('Configuración actualizada exitosamente');
    } catch (error) {
      toast.error('Error al actualizar configuración');
      throw error;
    }
  };

  // Funciones para reseñas
  const createReview = async (reviewData: CreateReviewData): Promise<Review> => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select(`
          *,
          barber:barbers(id, name)
        `)
        .single();
      if (error) throw error;
      setReviews(prev => [data, ...prev]);
      toast.success('Reseña enviada exitosamente');
      return data;
    } catch (error) {
      toast.error('Error al enviar la reseña');
      throw error;
    }
  };

  const updateReview = async (id: string, reviewData: Partial<Review>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          ...reviewData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
      setReviews(prev => prev.map(r => r.id === id ? { ...r, ...reviewData } : r));
      toast.success('Reseña actualizada exitosamente');
    } catch (error) {
      toast.error('Error al actualizar la reseña');
      throw error;
    }
  };

  const deleteReview = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Reseña eliminada exitosamente');
    } catch (error) {
      toast.error('Error al eliminar la reseña');
      throw error;
    }
  };

  const handleSetUserPhone = (phone: string) => {
    setUserPhone(phone);
    localStorage.setItem('userPhone', phone);
  };

  const verifyBarberAccessKey = useCallback(async (accessKey: string): Promise<Barber | null> => {
    if (!accessKey || accessKey.trim() === '') {
      setLoggedInBarber(null);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('access_key', accessKey.trim())
        .eq('is_active', true) // Only allow active barbers to log in
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          toast.error('Clave de acceso incorrecta o barbero no encontrado.');
        } else {
          toast.error('Error al verificar la clave de acceso.');
        }
        console.error('Error verifying barber access key:', error);
        setLoggedInBarber(null);
        return null;
      }

      if (data) {
        setLoggedInBarber(data as Barber);
        toast.success(`Bienvenido, ${data.name}!`);
        return data as Barber;
      }
      setLoggedInBarber(null); // Should be caught by PGRST116, but as a fallback
      return null;
    } catch (err) {
      toast.error('Ocurrió un error inesperado.');
      console.error('Unexpected error in verifyBarberAccessKey:', err);
      setLoggedInBarber(null);
      return null;
    }
  }, []);

  const logoutBarber = useCallback(() => {
    setLoggedInBarber(null);
    // Potentially clear any related stored data if needed, e.g., from localStorage
    toast.success('Sesión cerrada.');
  }, []);

  const getAppointmentsForBarber = useCallback((barberId: string): Appointment[] => {
    const today = new Date();
    return appointments.filter(appointment =>
      appointment.barber_id === barberId &&
      !appointment.cancelled &&
      (isSameDate(appointment.date, today) || isFutureDate(appointment.date)) // Only future or today's appointments
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time)); // Sort by date then time
  }, [appointments]);

  const value = {
    appointments,
    holidays,
    blockedTimes,
    barbers,
    businessHours,
    barberSchedules,
    adminSettings,
    reviews,
    services, // Added services
    userPhone,
    setUserPhone: handleSetUserPhone,
    cancelAppointment,
    createAppointment,
    createHoliday,
    removeHoliday,
    createBlockedTime,
    removeBlockedTime,
    isTimeSlotAvailable,
    getDayAvailability,
    getAvailableHoursForDate,
    formatHour12h,
    loadAdminSettings,
    getFutureAppointments,
    getActiveAppointments,
    createBarber,
    updateBarber,
    deleteBarber,
    updateBusinessHours,
    updateBarberSchedule,
    updateAdminSettings,
    createReview,
    updateReview,
    deleteReview,
    getApprovedReviews,
    getAverageRating,
    // Barber Access Key Auth
    loggedInBarber,
    verifyBarberAccessKey,
    logoutBarber,
    getAppointmentsForBarber,
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};