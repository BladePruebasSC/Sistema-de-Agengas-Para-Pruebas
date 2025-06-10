import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Appointment, Holiday, BlockedTime } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { sendSMSBoth } from '../services/twilioService';
import { notifyAppointmentCreated, notifyAppointmentCancelled } from '../services/whatsappService';
import { formatDateForSupabase, parseSupabaseDate } from '../utils/dateUtils';
import { format, isSameDay, startOfDay, isBefore } from 'date-fns';

interface AdminSettings {
  early_booking_restriction: boolean;
  early_booking_hours: number;
}

interface AppointmentContextType {
  appointments: Appointment[];
  holidays: Holiday[];
  blockedTimes: BlockedTime[];
  adminSettings: AdminSettings;
  userPhone: string | null;
  setUserPhone: (phone: string) => void;
  deleteAppointment: (id: string) => Promise<void>;
  createAppointment: (appointmentData: CreateAppointmentData) => Promise<Appointment>;
  createHoliday: (holidayData: Omit<Holiday, 'id'>) => Promise<Holiday>;
  createBlockedTime: (blockedTimeData: Omit<BlockedTime, 'id'>) => Promise<BlockedTime>;
  removeHoliday: (id: string) => Promise<void>;
  removeBlockedTime: (id: string) => Promise<void>;
  isTimeSlotAvailable: (date: Date, time: string) => Promise<boolean>;
  getDayAvailability: (date: Date) => Promise<{ [hour: string]: boolean }>;
  getAvailableHoursForDate: (date: Date) => string[];
  formatHour12h: (hour24: string) => string;
  cleanupPastAppointments: () => Promise<void>;
  loadAdminSettings: () => Promise<void>;
}

// Genera un rango de horas en formato HH:00
const generateHoursRange = (start: number, end: number) => {
  const hours: string[] = [];
  for (let h = start; h <= end; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return hours;
};

// HORARIOS ACTUALIZADOS:
// Domingo: 10:00 a 15:00
// Miércoles: 7:00 a 12:00 y 15:00 a 19:00 (cierra a las 7 PM)
// Resto: 7:00 a 12:00 y 15:00 a 21:00
const getAvailableHoursForDate = (date: Date): string[] => {
  const weekday = date.getDay();
  if (weekday === 0) {
    // Domingo: 10:00 AM a 3:00 PM
    return generateHoursRange(10, 15);
  } else if (weekday === 3) {
    // Miércoles: 7:00 AM a 12:00 PM y 3:00 PM a 7:00 PM
    return [
      ...generateHoursRange(7, 12),
      ...generateHoursRange(15, 19)
    ];
  } else {
    // Lunes, martes, jueves, viernes, sábado: 7:00 AM a 12:00 PM y 3:00 PM a 9:00 PM
    return [
      ...generateHoursRange(7, 12),
      ...generateHoursRange(15, 21)
    ];
  }
};

// Convierte "15:00" en "3:00 pm" para mostrar en UI
const formatHour12h = (hour24: string): string => {
  if (!hour24) return '';
  const [h, m] = hour24.split(':');
  let hour = parseInt(h, 10);
  const minute = m || '00';
  const ampm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
};

// Función para verificar restricción de horarios tempranos
const isEarlyHourRestricted = (date: Date, time: string, adminSettings: AdminSettings): boolean => {
  if (!adminSettings.early_booking_restriction) return false;
  
  // Solo aplica para 7:00 AM y 8:00 AM
  if (time !== '7:00 AM' && time !== '8:00 AM') return false;
  
  const now = new Date();
  const appointmentDateTime = new Date(date);
  
  // Convertir tiempo a 24h para comparación
  const hour = time === '7:00 AM' ? 7 : 8;
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
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    early_booking_restriction: false,
    early_booking_hours: 12
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
        setAdminSettings({
          early_booking_restriction: data.early_booking_restriction,
          early_booking_hours: data.early_booking_hours
        });
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  // Función para limpiar citas pasadas
  const cleanupPastAppointments = async () => {
    try {
      const today = startOfDay(new Date());
      const todayFormatted = formatDateForSupabase(today);
      
      // Eliminar citas anteriores a hoy
      const { error } = await supabase
        .from('appointments')
        .delete()
        .lt('date', todayFormatted);
      
      if (error) {
        console.error('Error cleaning up past appointments:', error);
        return;
      }
      
      // Actualizar el estado local
      setAppointments(prev => 
        prev.filter(appointment => !isBefore(appointment.date, today))
      );
      
      console.log('Past appointments cleaned up successfully');
    } catch (error) {
      console.error('Error in cleanupPastAppointments:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
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
        date: new Date(holiday.date)
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
        date: new Date(blockedTime.date)
      }));
      setBlockedTimes(formattedBlockedTimes);
    } catch (error) {
      toast.error('Error al cargar los horarios bloqueados');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      // Primero cargar configuración de admin
      await loadAdminSettings();
      // Luego limpiar citas pasadas
      await cleanupPastAppointments();
      // Finalmente cargar todos los datos
      await Promise.all([
        fetchAppointments(),
        fetchHolidays(),
        fetchBlockedTimes()
      ]);
    };
    
    initializeData();
  }, []);

  const isTimeSlotAvailable = useCallback(async (date: Date, time: string): Promise<boolean> => {
    try {
      // Verificar restricción de horarios tempranos
      if (isEarlyHourRestricted(date, time, adminSettings)) {
        return false;
      }

      const formattedDate = formatDateForSupabase(date);
      const [{ data: holidaysData }, { data: blockedData }, { data: appointmentsData }] = await Promise.all([
        supabase.from('holidays').select('id').eq('date', formattedDate),
        supabase.from('blocked_times').select('time,timeSlots').eq('date', formattedDate),
        supabase.from('appointments').select('id,time').eq('date', formattedDate).eq('time', time)
      ]);
      if (holidaysData && holidaysData.length > 0) return false;
      if (blockedData && blockedData.some(block =>
        (block.time && block.time === time) ||
        (block.timeSlots && Array.isArray(block.timeSlots) && block.timeSlots.includes(time))
      )) return false;
      if (appointmentsData && appointmentsData.length > 0) return false;
      return true;
    } catch (err) {
      return false;
    }
  }, [adminSettings]);

  const getDayAvailability = useCallback(async (date: Date) => {
    const formattedDate = formatDateForSupabase(date);
    const hours = getAvailableHoursForDate(date);
    if (hours.length === 0) return {};

    const [{ data: holidaysData }, { data: blockedData }, { data: appointmentsData }] = await Promise.all([
      supabase.from('holidays').select('id').eq('date', formattedDate),
      supabase.from('blocked_times').select('time,timeSlots').eq('date', formattedDate),
      supabase.from('appointments').select('time').eq('date', formattedDate),
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
      const isRestricted = isEarlyHourRestricted(date, hour, adminSettings);
      availability[hour] = !(blockedSlots.has(hour) || takenSlots.has(hour) || isRestricted);
    }
    return availability;
  }, [adminSettings]);

  const createAppointment = async (appointmentData: CreateAppointmentData): Promise<Appointment> => {
    try {
      // Verificar restricción de horarios tempranos antes de crear
      if (isEarlyHourRestricted(appointmentData.date, appointmentData.time, adminSettings)) {
        throw new Error(`Este horario requiere reserva con ${adminSettings.early_booking_hours} horas de antelación`);
      }

      const formattedDate = formatDateForSupabase(appointmentData.date);
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert([{ ...appointmentData, date: formattedDate }])
        .select()
        .single();
      if (error) throw new Error('Error al crear la cita en la base de datos');
      
      try {
        // Enviar notificaciones por WhatsApp Web
        await notifyAppointmentCreated({
          clientPhone: appointmentData.clientPhone,
          clientName: appointmentData.clientName,
          date: format(appointmentData.date, 'dd/MM/yyyy'),
          time: appointmentData.time,
          service: appointmentData.service
        });
      } catch (whatsappError) {
        console.error('Error enviando WhatsApp:', whatsappError);
        // No fallar la creación de cita si WhatsApp falla
      }

      try {
        // Mantener SMS como respaldo
        await sendSMSBoth({
          clientPhone: appointmentData.clientPhone,
          body: `Gaston Stylo: Tu cita ha sido confirmada para el ${format(appointmentData.date, 'dd/MM/yyyy')} a las ${appointmentData.time}.`,
          adminBody: `Nueva cita creada por ${appointmentData.clientName || 'Cliente'} para el ${format(appointmentData.date, 'dd/MM/yyyy')} a las ${appointmentData.time}.`
        });
      } catch (smsError) {
        console.error('Error enviando SMS:', smsError);
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

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      const appointmentToDelete = appointments.find(app => app.id === id);
      if (!appointmentToDelete) return;
      
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      
      setAppointments(prev => prev.filter(app => app.id !== id));
      
      try {
        // Enviar notificaciones de cancelación por WhatsApp Web
        await notifyAppointmentCancelled({
          clientPhone: appointmentToDelete.clientPhone,
          clientName: appointmentToDelete.clientName,
          date: format(appointmentToDelete.date, 'dd/MM/yyyy'),
          time: appointmentToDelete.time,
          service: appointmentToDelete.service
        });
      } catch (whatsappError) {
        console.error('Error enviando WhatsApp de cancelación:', whatsappError);
      }

      try {
        // Mantener SMS como respaldo
        await sendSMSBoth({
          clientPhone: appointmentToDelete.clientPhone,
          body: `Gaston Stylo: Tu cita para el ${format(appointmentToDelete.date, 'dd/MM/yyyy')} a las ${appointmentToDelete.time} ha sido cancelada.`,
          adminBody: `Cita cancelada por ${appointmentToDelete.clientName || 'Cliente'} para el ${format(appointmentToDelete.date, 'dd/MM/yyyy')} a las ${appointmentToDelete.time}.`
        });
      } catch (smsError) {
        console.error('Error enviando SMS de cancelación:', smsError);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
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
      const appointmentsOnDate = appointments.filter(app => isSameDay(app.date, holidayData.date));
      for (const appointment of appointmentsOnDate) {
        try {
          await sendSMSBoth({
            clientPhone: appointment.clientPhone,
            body: `Gaston Stylo: Este dia no esta disponible para citas (${format(holidayData.date, 'dd/MM/yyyy')}).`,
            adminBody: `Aviso: ${appointment.clientName || 'Cliente'} tenía cita el día bloqueado (${format(holidayData.date, 'dd/MM/yyyy')}).`
          });
        } catch {}
      }
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
      const appointmentsOnDate = appointments.filter(app => isSameDay(app.date, holidayToRemove.date));
      for (const appointment of appointmentsOnDate) {
        try {
          await sendSMSBoth({
            clientPhone: appointment.clientPhone,
            body: `Gaston Stylo: Este dia ahora se encuentra disponible para citas (${format(holidayToRemove.date, 'dd/MM/yyyy')}).`,
            adminBody: `Aviso: ${appointment.clientName || 'Cliente'} puede volver a agendar el día liberado (${format(holidayToRemove.date, 'dd/MM/yyyy')}).`
          });
        } catch {}
      }
    } catch (error) {
      throw error;
    }
  };

  const createBlockedTime = async (blockedTimeData: Omit<BlockedTime, 'id'>): Promise<BlockedTime> => {
    try {
      const formattedDate = formatDateForSupabase(blockedTimeData.date);
      const dataToInsert = {
        ...blockedTimeData,
        date: formattedDate,
        time: blockedTimeData.timeSlots,
        timeSlots: blockedTimeData.timeSlots
      };
      const { data, error } = await supabase
        .from('blocked_times')
        .insert([dataToInsert])
        .select()
        .single();
      if (error) throw error;
      const newBlockedTime = { ...data, date: parseSupabaseDate(data.date) };
      setBlockedTimes(prev => [...prev, newBlockedTime]);
      const appointmentsAtTime = appointments.filter(app =>
        isSameDay(app.date, blockedTimeData.date) && app.time === blockedTimeData.timeSlots
      );
      for (const appointment of appointmentsAtTime) {
        try {
          await sendSMSBoth({
            clientPhone: appointment.clientPhone,
            body: `Gaston Stylo: Esta hora no esta disponible para citas (${format(blockedTimeData.date, 'dd/MM/yyyy')} ${blockedTimeData.timeSlots}).`,
            adminBody: `Aviso: ${appointment.clientName || 'Cliente'} tenía cita en hora bloqueada (${format(blockedTimeData.date, 'dd/MM/yyyy')} ${blockedTimeData.timeSlots}).`
          });
        } catch {}
      }
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
      const appointmentsAtTime = appointments.filter(app =>
        isSameDay(app.date, blockedTimeToRemove.date) && app.time === blockedTimeToRemove.timeSlots
      );
      for (const appointment of appointmentsAtTime) {
        try {
          await sendSMSBoth({
            clientPhone: appointment.clientPhone,
            body: `Gaston Stylo: Esta hora esta disponible para citas (${format(blockedTimeToRemove.date, 'dd/MM/yyyy')} ${blockedTimeToRemove.timeSlots}).`,
            adminBody: `Aviso: ${appointment.clientName || 'Cliente'} puede reservar la hora liberada (${format(blockedTimeToRemove.date, 'dd/MM/yyyy')} ${blockedTimeToRemove.timeSlots}).`
          });
        } catch {}
      }
    } catch (error) {
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
    adminSettings,
    userPhone,
    setUserPhone: handleSetUserPhone,
    deleteAppointment,
    createAppointment,
    createHoliday,
    removeHoliday,
    createBlockedTime,
    removeBlockedTime,
    isTimeSlotAvailable,
    getDayAvailability,
    getAvailableHoursForDate,
    formatHour12h,
    cleanupPastAppointments,
    loadAdminSettings,
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};