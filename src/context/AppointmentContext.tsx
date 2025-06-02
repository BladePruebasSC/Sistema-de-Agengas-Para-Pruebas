import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Appointment, Holiday, BlockedTime } from '../types';
import { supabase } from '../lib/supabase';
import { notifyAppointmentCreated, notifyAppointmentCancelled } from '../utils/whatsapp';

interface AppointmentContextType {
  appointments: Appointment[];
  holidays: Holiday[];
  blockedTimes: BlockedTime[];
  userPhone: string | null;
  setUserPhone: (phone: string) => void;
  deleteAppointment: (id: string) => Promise<void>;
  createAppointment: (appointmentData: CreateAppointmentData) => Promise<Appointment>; // Agregar esta línea
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [userPhone, setUserPhone] = useState<string | null>(() => {
    return localStorage.getItem('userPhone');
  });

  useEffect(() => {
    fetchAppointments();
    fetchHolidays();
    fetchBlockedTimes();
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return;
    }

    // Log para verificar los datos que vienen de Supabase
    console.log('Datos crudos de Supabase:', data);

    const formattedAppointments = data.map(appointment => ({
      ...appointment,
      date: new Date(appointment.date)
    }));

    // Log para verificar el formateo
    console.log('Citas formateadas:', formattedAppointments);

    setAppointments(formattedAppointments);
  };

  const fetchHolidays = async () => {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching holidays:', error);
      return;
    }

    setHolidays(data.map(holiday => ({
      ...holiday,
      date: new Date(holiday.date)
    })));
  };

  const fetchBlockedTimes = async () => {
    const { data, error } = await supabase
      .from('blocked_times')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching blocked times:', error);
      return;
    }

    setBlockedTimes(data.map(block => ({
      ...block,
      date: new Date(block.date)
    })));
  };

  const createAppointment = async (appointmentData: CreateAppointmentData) => {
    try {
      const { error, data } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      // Update local state
      setAppointments(prev => [...prev, { ...data, date: new Date(data.date) }]);

      return data;
    } catch (error) {
      console.error('Error in createAppointment:', error);
      throw error;
    }
  };

  const createHoliday = async (holidayData: Omit<Holiday, 'id'>): Promise<Holiday> => {
    const { data, error } = await supabase
      .from('holidays')
      .insert([holidayData])
      .select()
      .single();

    if (error) throw error;

    const newHoliday = {
      ...data,
      date: new Date(data.date)
    };

    setHolidays(prev => [...prev, newHoliday]);
    return newHoliday;
  };

  const createBlockedTime = async (blockedTimeData: Omit<BlockedTime, 'id'>): Promise<BlockedTime> => {
    const { data, error } = await supabase
      .from('blocked_times')
      .insert([blockedTimeData])
      .select()
      .single();

    if (error) throw error;

    const newBlockedTime = {
      ...data,
      date: new Date(data.date)
    };

    setBlockedTimes(prev => [...prev, newBlockedTime]);
    return newBlockedTime;
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      // Primero verificamos que la cita existe
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (!existingAppointment) {
        throw new Error('La cita no existe');
      }

      // Intentamos eliminar la cita
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error en Supabase:', error);
        throw new Error('No se pudo eliminar la cita');
      }

      // Si llegamos aquí, la eliminación fue exitosa
      // Actualizamos el estado local
      setAppointments(prevAppointments => 
        prevAppointments.filter(app => app.id !== id)
      );

      // Volvemos a cargar las citas para asegurarnos de estar sincronizados
      const { data: updatedData, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (!fetchError && updatedData) {
        setAppointments(updatedData.map(app => ({
          ...app,
          date: new Date(app.date)
        })));
      }

    } catch (error) {
      console.error('Error completo:', error);
      throw error;
    }
  };

  const removeHoliday = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setHolidays(prev => prev.filter(holiday => holiday.id !== id));
  };

  const removeBlockedTime = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('blocked_times')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setBlockedTimes(prev => prev.filter(block => block.id !== id));
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
      createAppointment, // Agregar esta línea
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};