import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Appointment, Holiday, BlockedTime, Barber, BusinessHours, BarberSchedule, AdminSettings, Review, CreateReviewData } from '../types';
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
  getAvailableHoursForDate: (date: Date) => string[];
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
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    id: '',
    early_booking_restriction: false,
    early_booking_hours: 12,
    restricted_hours: ['7:00 AM', '8:00 AM'],
    multiple_barbers_enabled: false,
    created_at: '',
    updated_at: ''
  });
  const [userPhone, setUserPhone] = useState<string | null>(() => localStorage.getItem('userPhone'));

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

  // Función para obtener horarios disponibles según configuración
  const getAvailableHoursForDate = useCallback((date: Date): string[] => {
    const dayOfWeek = date.getDay();
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
  }, [businessHours]);

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
        .select('*')
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
        .select('*')
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
        fetchReviews()
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
      
      // Verificar feriados
      const { data: holidaysData } = await supabase
        .from('holidays')
        .select('id')
        .eq('date', formattedDate);
      
      if (holidaysData && holidaysData.length > 0) return false;
      
      // Verificar horarios bloqueados
      const { data: blockedData } = await supabase
        .from('blocked_times')
        .select('time,timeSlots')
        .eq('date', formattedDate);
      
      if (blockedData && blockedData.some(block =>
        (block.time && block.time === time) ||
        (block.timeSlots && Array.isArray(block.timeSlots) && block.timeSlots.includes(time))
      )) return false;
      
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
    const hours = getAvailableHoursForDate(date);
    if (hours.length === 0) return {};

    const [{ data: holidaysData }, { data: blockedData }, { data: appointmentsData }] = await Promise.all([
      supabase.from('holidays').select('id').eq('date', formattedDate),
      supabase.from('blocked_times').select('time,timeSlots').eq('date', formattedDate),
      barberId 
        ? supabase.from('appointments').select('time').eq('date', formattedDate).eq('barber_id', barberId).eq('cancelled', false)
        : supabase.from('appointments').select('time').eq('date', formattedDate).eq('cancelled', false),
    ]);

    const availability: { [hour: string]: boolean } = {};
    if (holidaysData && holidaysData.length > 0) {
      hours.forEach(h => { availability[h] = false; });
      return availability;
    }

    const blockedSlots = new Set<string>();
    if (blockedData) {
      for (const block of blockedData) {
        if (block.timeSlots && Array.isArray(block.timeSlots)) {
          block.timeSlots.forEach((slot: string) => blockedSlots.add(slot));
        }
        if (block.time) blockedSlots.add(block.time);
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
      
      // Usar el barberId que viene en appointmentData, no el por defecto
      const barberId = appointmentData.barber_id || appointmentData.barberId || adminSettings.default_barber_id;
      
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert([{ 
          date: formattedDate,
          time: appointmentData.time,
          clientName: appointmentData.clientName,
          clientPhone: appointmentData.clientPhone,
          service: appointmentData.service,
          confirmed: appointmentData.confirmed,
          barber_id: barberId,
          cancelled: false
        }])
        .select(`
          *,
          barber:barbers(id, name, phone)
        `)
        .single();
      if (error) throw new Error('Error al crear la cita en la base de datos');
      
      try {
        // Obtener el barbero para la notificación
        const barber = barbers.find(b => b.id === barberId) || newAppointment.barber;
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
        // Obtener el barbero para la notificación
        const barber = barbers.find(b => b.id === appointmentToCancel.barber_id);
        const barberPhone = barber?.phone || '+18092033894';
        
        // Enviar notificaciones de cancelación por WhatsApp Web
        await notifyAppointmentCancelled({
          clientPhone: appointmentToCancel.clientPhone,
          clientName: appointmentToCancel.clientName,
          date: format(appointmentToCancel.date, 'dd/MM/yyyy'),
          time: appointmentToCancel.time,
          service: appointmentToCancel.service,
          barberName: barber?.name || 'Barbero',
          barberPhone
        });
      } catch (whatsappError) {
        console.error('Error enviando WhatsApp de cancelación:', whatsappError);
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
      const { data: existingHolidays, error: checkError } = await supabase
        .from('holidays')
        .select('*')
        .eq('date', formattedDate);
      if (checkError) throw checkError;
      if (existingHolidays && existingHolidays.length > 0) throw new Error('Ya existe un feriado en esta fecha');
      const { data, error } = await supabase
        .from('holidays')
        .insert([{ ...holidayData, date: formattedDate }])
        .select()
        .single();
      if (error) throw error;
      const newHoliday = { ...data, date: parseSupabaseDate(data.date) };
      setHolidays(prev => [...prev, newHoliday]);
      return newHoliday;
    } catch (error) {
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

  const createBlockedTime = async (blockedTimeData: Omit<BlockedTime, 'id'>): Promise<BlockedTime> => {
    try {
      const formattedDate = formatDateForSupabase(blockedTimeData.date);
      const dataToInsert = {
        date: formattedDate,
        time: Array.isArray(blockedTimeData.timeSlots) ? blockedTimeData.timeSlots[0] : blockedTimeData.timeSlots,
        timeSlots: blockedTimeData.timeSlots,
        reason: blockedTimeData.reason || 'Horario bloqueado'
      };
      const { data, error } = await supabase
        .from('blocked_times')
        .insert([dataToInsert])
        .select()
        .single();
      if (error) throw error;
      const newBlockedTime = { ...data, date: parseSupabaseDate(data.date) };
      setBlockedTimes(prev => [...prev, newBlockedTime]);
      return newBlockedTime;
    } catch (error) {
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
    try {
      const { error } = await supabase
        .from('barbers')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
      setBarbers(prev => prev.filter(b => b.id !== id));
      toast.success('Barbero desactivado exitosamente');
    } catch (error) {
      toast.error('Error al desactivar barbero');
      throw error;
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

  const value = {
    appointments,
    holidays,
    blockedTimes,
    barbers,
    businessHours,
    barberSchedules,
    adminSettings,
    reviews,
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
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};