import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Appointment, Holiday, BlockedTime } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

const notifyWhatsApp = async (type: string, data: any) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ type, data })
    });

    if (!response.ok) {
      throw new Error('Error al enviar notificación de WhatsApp');
    }
  } catch (error) {
    console.error('Error en notifyWhatsApp:', error);
    throw error;
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

      if (error) throw error;

      const formattedAppointments = data.map(appointment => ({
        ...appointment,
        date: new Date(appointment.date)
      }));

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
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

  const createAppointment = async (appointmentData: CreateAppointmentData): Promise<Appointment> => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) throw error;

      const newAppointment = { ...data, date: new Date(data.date) };
      setAppointments(prev => [...prev, newAppointment]);

      // Notificar por WhatsApp
      await notifyWhatsApp('appointment_created', { appointment: newAppointment });

      return newAppointment;
    } catch (error) {
      console.error('Error al crear cita:', error);
      throw error;
    }
  };

  const createHoliday = async (holidayData: Omit<Holiday, 'id'>): Promise<Holiday> => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .insert([holidayData])
        .select()
        .single();

      if (error) throw error;

      const newHoliday = { ...data, date: new Date(data.date) };
      setHolidays(prev => [...prev, newHoliday]);

      // Notificar por WhatsApp
      await notifyWhatsApp('holiday_created', { holiday: newHoliday });

      return newHoliday;
    } catch (error) {
      console.error('Error al crear feriado:', error);
      throw error;
    }
  };

  const createBlockedTime = async (blockedTimeData: Omit<BlockedTime, 'id'>): Promise<BlockedTime> => {
    try {
      const { data, error } = await supabase
        .from('blocked_times')
        .insert([blockedTimeData])
        .select()
        .single();

      if (error) throw error;

      const newBlockedTime = { ...data, date: new Date(data.date) };
      setBlockedTimes(prev => [...prev, newBlockedTime]);

      // Notificar por WhatsApp
      await notifyWhatsApp('time_blocked', { blockedTime: newBlockedTime });

      return newBlockedTime;
    } catch (error) {
      console.error('Error al bloquear horario:', error);
      throw error;
    }
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      // Obtener la cita antes de eliminarla
      const appointment = appointments.find(app => app.id === id);
      if (!appointment) {
        throw new Error('Cita no encontrada');
      }

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizar estado local
      setAppointments(prev => prev.filter(app => app.id !== id));

      // Notificar por WhatsApp
      await notifyWhatsApp('appointment_cancelled', { 
        appointment,
        availableSlot: true
      });

      toast.success('Cita cancelada exitosamente');
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      toast.error('Error al cancelar la cita');
      throw error;
    }
  };

  const removeHoliday = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHolidays(prev => prev.filter(holiday => holiday.id !== id));
      toast.success('Feriado eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar feriado:', error);
      toast.error('Error al eliminar el feriado');
      throw error;
    }
  };

  const removeBlockedTime = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBlockedTimes(prev => prev.filter(block => block.id !== id));
      toast.success('Horario desbloqueado exitosamente');
    } catch (error) {
      console.error('Error al desbloquear horario:', error);
      toast.error('Error al desbloquear el horario');
      throw error;
    }
  };

  const handleSetUserPhone = (phone: string) => {
    setUserPhone(phone);
    localStorage.setItem('userPhone', phone);
  };

  return (
    <AppointmentContext.Provider value={{
      appointments,
      holidays,
      blockedTimes,
      userPhone,
      setUserPhone: handleSetUserPhone,
      deleteAppointment,
      createAppointment,
      createHoliday,
      createBlockedTime,
      removeHoliday,
      removeBlockedTime,
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};