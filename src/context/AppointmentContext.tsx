import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Appointment, Holiday, BlockedTime } from '../types';
import { supabase } from '../lib/supabase'; // Importa supabase desde el archivo separado
import toast from 'react-hot-toast';
import { formatPhoneForWhatsApp, formatPhoneForDisplay } from '../utils/phoneUtils';
import { sendSMSMessage } from '../services/twilioService';
import type { TwilioMessageData } from '../types/twilio';
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
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

const notifyWhatsApp = async (type: string, data: any) => {
    try {
        const response = await fetch('http://localhost:3000/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                phone: data.clientPhone || data.phone,
                data: {
                    ...data,
                    date: new Date(data.date).toLocaleDateString('es-ES'),
                }
            })
        });

        if (!response.ok) {
            throw new Error('Error enviando mensaje de WhatsApp');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en notificación WhatsApp:', error);
        return null;
    }
};

const getAllRegisteredPhones = (appointments: Appointment[]): string[] => {
  const phones = new Set(appointments.map(app => app.clientPhone));
  return Array.from(phones);
};

const fetchWithRetry = async (operation: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry attempt ${i + 1} of ${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [userPhone, setUserPhone] = useState<string | null>(() => {
    return localStorage.getItem('userPhone');
  });

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      const formattedAppointments = data.map(appointment => {
        const parsedDate = parseSupabaseDate(appointment.date);
        return {
          ...appointment,
          date: parsedDate
        };
      });

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error in fetchAppointments:', error);
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
      console.error('Error fetching holidays:', error);
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
      console.error('Error fetching blocked times:', error);
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

      // 1. Check for existing appointments
      const { data: existingAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', formattedDate)
        .eq('time', time)
        .maybeSingle();

      if (appointmentError) {
        console.error('Error checking appointments:', appointmentError);
        return false;
      }

      if (existingAppointment) {
        console.log('Time slot has appointment:', existingAppointment);
        return false;
      }

      // 2. Check for blocked times
      const { data: blockedTime, error: blockedError } = await supabase
        .from('blocked_times')
        .select('*')
        .eq('date', formattedDate)
        .contains('timeSlots', [time])
        .maybeSingle();

      if (blockedError) {
        console.error('Error checking blocked times:', blockedError);
        return false;
      }

      if (blockedTime) {
        console.log('Time slot is blocked:', blockedTime);
        return false;
      }

      // 3. Check for holidays
      const isHoliday = holidays.some(holiday => isSameDay(holiday.date, date));
      if (isHoliday) {
        console.log('Date is a holiday');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }, [holidays]);

  const formatPhoneNumber = (phone: string): string => {
    return `+1${phone.replace(/\D/g, '')}`;
  };

  const createAppointment = async (appointmentData: CreateAppointmentData): Promise<Appointment> => {
  try {
    // First create the appointment in the database
    const formattedDate = formatDateForSupabase(appointmentData.date);
    
    const { data: newAppointment, error } = await supabase
      .from('appointments')
      .insert([
        {
          ...appointmentData,
          date: formattedDate
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error Supabase:', error);
      throw new Error('Error al crear la cita en la base de datos');
    }

    // Then try to send the SMS
    try {
      await sendSMSMessage({
        clientPhone: appointmentData.clientPhone,
        body: `Gaston Stylo: Tu cita ha sido confirmada para el ${format(appointmentData.date, 'dd/MM/yyyy')} a las ${appointmentData.time}.`
      });
    } catch (smsError) {
      // Log SMS error but don't fail the appointment creation
      console.error('Error al enviar SMS:', smsError);
      toast.error('La cita se creó pero hubo un error al enviar el SMS');
    }

    const parsedAppointment = {
      ...newAppointment,
      date: parseSupabaseDate(newAppointment.date)
    };

    setAppointments(prev => [...prev, parsedAppointment]);
    toast.success('Cita creada exitosamente');
    
    return parsedAppointment;
  } catch (error) {
    console.error('Error in createAppointment:', error);
    toast.error(error instanceof Error ? error.message : 'Error al crear la cita');
    throw error;
  }
};

  const createHoliday = async (holidayData: Omit<Holiday, 'id'>): Promise<Holiday> => {
  try {
    const formattedDate = formatDateForSupabase(holidayData.date);
    
    // Primero verifica si ya existe un feriado en esa fecha
    const { data: existingHolidays, error: checkError } = await supabase
      .from('holidays')
      .select('*')
      .eq('date', formattedDate);

    if (checkError) {
      console.error('Error checking existing holiday:', checkError);
      throw checkError;
    }

    if (existingHolidays && existingHolidays.length > 0) {
      throw new Error('Ya existe un feriado en esta fecha');
    }

    // Si no existe, crea el nuevo feriado
    const { data, error } = await supabase
      .from('holidays')
      .insert([{ 
        ...holidayData,
        date: formattedDate 
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating holiday:', error);
      throw error;
    }

    const newHoliday = { 
      ...data, 
      date: parseSupabaseDate(data.date) 
    };

    setHolidays(prev => [...prev, newHoliday]);

    // Notificar a los clientes con citas en esa fecha
    const appointmentsOnDate = appointments.filter(app => 
      isSameDay(app.date, holidayData.date)
    );

    for (const appointment of appointmentsOnDate) {
      try {
        await sendSMSMessage({
          clientPhone: appointment.clientPhone,
          body: `Gaston Stylo: Este dia no esta disponible para citas (${format(holidayData.date, 'dd/MM/yyyy')}).`
        });
      } catch (smsError) {
        console.error('Error al enviar SMS:', smsError);
      }
    }

    return newHoliday;
  } catch (error) {
    console.error('Error creating holiday:', error);
    throw error;
  }
};

  const removeHoliday = async (id: string): Promise<void> => {
    try {
      const holidayToRemove = holidays.find(h => h.id === id);
      if (!holidayToRemove) return;

      const { error } = await supabase
          .from('holidays')
          .delete()
          .eq('id', id);

      if (error) throw error;

      setHolidays(prev => prev.filter(h => h.id !== id));

      // Notify clients with appointments on this date
      const appointmentsOnDate = appointments.filter(app => 
        isSameDay(app.date, holidayToRemove.date)
      );

      for (const appointment of appointmentsOnDate) {
        try {
          await sendSMSMessage({
            clientPhone: appointment.clientPhone,
            body: `Gaston Stylo: Este dia ahora se encuentra disponible para citas (${format(holidayToRemove.date, 'dd/MM/yyyy')}).`
          });
        } catch (smsError) {
          console.error('Error al enviar SMS:', smsError);
        }
      }
    } catch (error) {
      console.error('Error removing holiday:', error);
      throw error;
    }
  };

  const createBlockedTime = async (blockedTimeData: Omit<BlockedTime, 'id'>): Promise<BlockedTime> => {
  try {
    const formattedDate = formatDateForSupabase(blockedTimeData.date);
    
    // Ensure timeSlots is an array
    const timeSlots = Array.isArray(blockedTimeData.timeSlots) 
      ? blockedTimeData.timeSlots 
      : [blockedTimeData.timeSlots];

    // Check for existing appointments in these time slots
    const { data: existingAppointments, error: checkError } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', formattedDate)
      .in('time', timeSlots);

    if (checkError) {
      console.error('Error checking existing appointments:', checkError);
      throw checkError;
    }

    if (existingAppointments && existingAppointments.length > 0) {
      const conflictingTimes = existingAppointments.map(app => app.time).join(', ');
      throw new Error(`Ya existen citas en los siguientes horarios: ${conflictingTimes}`);
    }

    // Create the block
    const { data, error } = await supabase
      .from('blocked_times')
      .insert([{
        date: formattedDate,
        timeSlots: timeSlots,
        time: timeSlots.join(', '), // Store all times in the time field
        reason: blockedTimeData.reason || 'Horario bloqueado'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error al crear bloqueo:', error);
      throw error;
    }

    const newBlockedTime = {
      ...data,
      date: parseSupabaseDate(data.date)
    };

    setBlockedTimes(prev => [...prev, newBlockedTime]);

    // Notify affected clients
    const appointmentsAtTime = appointments.filter(app => 
      isSameDay(app.date, blockedTimeData.date) && 
      timeSlots.includes(app.time)
    );

    console.log('Sending notifications to affected appointments:', appointmentsAtTime);

    for (const appointment of appointmentsAtTime) {
      try {
        const message = await sendSMSMessage({
          clientPhone: appointment.clientPhone,
          body: `Gaston Stylo: Los horarios ${timeSlots.join(', ')} del ${format(blockedTimeData.date, 'dd/MM/yyyy')} no están disponibles para citas.`
        });
        console.log('SMS sent:', message);
      } catch (smsError) {
        console.error('Error al enviar SMS:', smsError);
      }
    }

    return newBlockedTime;
  } catch (error) {
    console.error('Error al crear bloqueo:', error);
    throw error;
  }
};

  const removeBlockedTime = async (id: string): Promise<void> => {
  try {
    const blockedTimeToRemove = blockedTimes.find(bt => bt.id === id);
    if (!blockedTimeToRemove) return;

    const { error } = await supabase
      .from('blocked_times')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setBlockedTimes(prev => prev.filter(bt => bt.id !== id));

    // Notificar a los clientes cuando se desbloquea el horario
    const appointmentsAtTime = appointments.filter(app => 
      isSameDay(app.date, blockedTimeToRemove.date) && 
      app.time === blockedTimeToRemove.timeSlots
    );

    for (const appointment of appointmentsAtTime) {
      try {
        await sendSMSMessage({
          clientPhone: appointment.clientPhone,
          body: `Gaston Stylo: La hora ${blockedTimeToRemove.timeSlots} del día ${format(blockedTimeToRemove.date, 'dd/MM/yyyy')} ahora está disponible para citas.`
        });
      } catch (smsError) {
        console.error('Error al enviar SMS:', smsError);
      }
    }
  } catch (error) {
    console.error('Error removing blocked time:', error);
    throw error;
  }
};

  const handleSetUserPhone = (phone: string) => {
    setUserPhone(phone);
    localStorage.setItem('userPhone', phone);
  };

  const checkExistingAppointment = async (date: Date, time: string): Promise<boolean> => {
    try {
      const formattedDate = formatDateForSupabase(date);

      const { data, error } = await fetchWithRetry(() => 
        supabase
          .from('appointments')
          .select('id')
          .eq('date', formattedDate)
          .eq('time', time)
          .single()
      );

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        console.error('Error checking appointments:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking appointments:', {
        message: error.message,
        details: error.stack,
        date: formattedDate,
        time
      });
      return false;
    }
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      const appointmentToDelete = appointments.find(app => app.id === id);
      if (!appointmentToDelete) return;

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAppointments(prev => prev.filter(app => app.id !== id));

      // Send SMS notification
      try {
        await sendSMSMessage({
          clientPhone: appointmentToDelete.clientPhone,
          body: `Gaston Stylo: Tu cita para el ${format(appointmentToDelete.date, 'dd/MM/yyyy')} a las ${appointmentToDelete.time} ha sido cancelada.`
        });
      } catch (smsError) {
        console.error('Error al enviar SMS:', smsError);
      }
    } catch (error) {
      console.error('Error al eliminar la cita:', error);
    }
  };

  const value = {
    appointments,
    holidays,
    blockedTimes,
    userPhone,
    setUserPhone,
    deleteAppointment,  // Make sure it's included here
    createAppointment,
    createHoliday,
    removeHoliday,
    createBlockedTime,
    removeBlockedTime,
    isTimeSlotAvailable
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};