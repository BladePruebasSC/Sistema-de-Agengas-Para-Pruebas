import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Appointment, Holiday, BlockedTime } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { sendSMSMessage } from '../services/twilioService';
import { formatDateForSupabase, parseSupabaseDate } from '../utils/dateUtils';
import { format, isSameDay } from 'date-fns';

interface AppointmentContextType {
  appointments: Appointment[];
  holidays: Holiday[];
  blockedTimes: BlockedTime[];
  userPhone: string | null;
  setUserPhone: (phone: string) => void;
  deleteAppointment: (id: string) => Promise<void>;
  createAppointment: (appointmentData: CreateAppointmentData) => Promise<Appointment>;
  createHoliday: (holidayData: Omit<Holiday, 'id'>) => Promise<Holiday>;
  createBlockedTime: (blockedTimeData: Omit<BlockedTime, 'id'>) => Promise<BlockedTime>;
  removeHoliday: (id: string) => Promise<void>;
  removeBlockedTime: (id: string) => Promise<void>;
  isTimeSlotAvailable: (date: Date, time: string) => Promise<boolean>;
  getDayAvailability: (date: Date, allHours: string[]) => Promise<{ [hour: string]: boolean }>;
}

const ADMIN_PHONE = "+18092033894";

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

const fetchWithRetry = async (operation: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Helper para enviar el SMS al cliente y al fijo
async function sendSMSBoth({ clientPhone, body }: { clientPhone: string, body: string }) {
  try {
    await sendSMSMessage({ clientPhone, body });
  } catch {}
  // Si el número de cliente es distinto al fijo, lo mandamos también al fijo
  if (clientPhone !== ADMIN_PHONE) {
    try {
      await sendSMSMessage({ clientPhone: ADMIN_PHONE, body });
    } catch {}
  }
}

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [userPhone, setUserPhone] = useState<string | null>(() => localStorage.getItem('userPhone'));

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
    fetchAppointments();
    fetchHolidays();
    fetchBlockedTimes();
  }, []);

  const isTimeSlotAvailable = useCallback(async (date: Date, time: string): Promise<boolean> => {
    try {
      const formattedDate = formatDateForSupabase(date);
      const isHoliday = holidays.some(holiday =>
        holiday.date.getFullYear() === date.getFullYear() &&
        holiday.date.getMonth() === date.getMonth() &&
        holiday.date.getDate() === date.getDate()
      );
      if (isHoliday) return false;
      const isBlocked = blockedTimes.some(block =>
        block.date.getFullYear() === date.getFullYear() &&
        block.date.getMonth() === date.getMonth() &&
        block.date.getDate() === date.getDate() &&
        (block.timeSlots?.includes(time) || block.time === time)
      );
      if (isBlocked) return false;
      const hasExistingAppointment = appointments.some(app =>
        app.date.getFullYear() === date.getFullYear() &&
        app.date.getMonth() === date.getMonth() &&
        app.date.getDate() === date.getDate() &&
        app.time === time
      );
      if (hasExistingAppointment) return false;
      const { data: existingAppointment, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('date', formattedDate)
        .eq('time', time)
        .maybeSingle();
      if (error) return false;
      return !existingAppointment;
    } catch {
      return false;
    }
  }, [holidays, blockedTimes, appointments]);

  // *** NUEVA FUNCIÓN OPTIMIZADA ***
  const getDayAvailability = useCallback(async (date: Date, allHours: string[]) => {
    const formattedDate = formatDateForSupabase(date);
    const [{ data: dayAppointments }, { data: dayBlocks }, { data: dayHolidays }] = await Promise.all([
      supabase.from('appointments').select('time').eq('date', formattedDate),
      supabase.from('blocked_times').select('time, timeSlots').eq('date', formattedDate),
      supabase.from('holidays').select('id').eq('date', formattedDate),
    ]);
    if (dayHolidays && dayHolidays.length > 0) {
      return Object.fromEntries(allHours.map(h => [h, false]));
    }
    let blockedSlots: string[] = [];
    if (dayBlocks) {
      for (const block of dayBlocks) {
        if (block.timeSlots && Array.isArray(block.timeSlots)) blockedSlots = blockedSlots.concat(block.timeSlots);
        if (block.time) blockedSlots.push(block.time);
      }
    }
    const result: { [hour: string]: boolean } = {};
    for (const hour of allHours) {
      const hasAppointment = dayAppointments?.some(app => app.time === hour);
      const isBlocked = blockedSlots.includes(hour);
      result[hour] = !hasAppointment && !isBlocked;
    }
    return result;
  }, []);

  const createAppointment = async (appointmentData: CreateAppointmentData): Promise<Appointment> => {
    try {
      const formattedDate = formatDateForSupabase(appointmentData.date);
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert([{ ...appointmentData, date: formattedDate }])
        .select()
        .single();
      if (error) throw new Error('Error al crear la cita en la base de datos');
      try {
        await sendSMSBoth({
          clientPhone: appointmentData.clientPhone,
          body: `Gaston Stylo: Tu cita ha sido confirmada para el ${format(appointmentData.date, 'dd/MM/yyyy')} a las ${appointmentData.time}.`
        });
      } catch {}
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
      // Notificar a los clientes con citas en esa fecha
      const appointmentsOnDate = appointments.filter(app => isSameDay(app.date, holidayData.date));
      for (const appointment of appointmentsOnDate) {
        try {
          await sendSMSBoth({
            clientPhone: appointment.clientPhone,
            body: `Gaston Stylo: Este dia no esta disponible para citas (${format(holidayData.date, 'dd/MM/yyyy')}).`
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
            body: `Gaston Stylo: Este dia ahora se encuentra disponible para citas (${format(holidayToRemove.date, 'dd/MM/yyyy')}).`
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
            body: `Gaston Stylo: Esta hora no esta disponible para citas (${format(blockedTimeData.date, 'dd/MM/yyyy')} ${blockedTimeData.timeSlots}).`
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
            body: `Gaston Stylo: Esta hora esta disponible para citas (${format(blockedTimeToRemove.date, 'dd/MM/yyyy')} ${blockedTimeToRemove.timeSlots}).`
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

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      const appointmentToDelete = appointments.find(app => app.id === id);
      if (!appointmentToDelete) return;
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      setAppointments(prev => prev.filter(app => app.id !== id));
      try {
        await sendSMSBoth({
          clientPhone: appointmentToDelete.clientPhone,
          body: `Gaston Stylo: Tu cita para el ${format(appointmentToDelete.date, 'dd/MM/yyyy')} a las ${appointmentToDelete.time} ha sido cancelada.`
        });
      } catch {}
    } catch (error) {}
  };

  const value = {
    appointments,
    holidays,
    blockedTimes,
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
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};