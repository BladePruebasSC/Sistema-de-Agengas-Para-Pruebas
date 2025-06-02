import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Appointment, Holiday, BlockedTime } from '../types';
import { supabase } from '../lib/supabase';
import { notifyAppointmentCreated, notifyAppointmentCancelled } from '../utils/whatsapp';
import toast from 'react-hot-toast'; // Agregar esta importación

interface AppointmentContextType {
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
  setUserPhone: (phone: string | null) => void;
  isTimeSlotAvailable: (date: Date, time: string) => boolean; // Agregar esta línea
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
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return;
    }

    // Convertir las fechas y asegurarnos de que el status sea 'confirmed' por defecto
    setAppointments(data.map(app => ({
      ...app,
      date: new Date(app.date),
      status: app.status || 'confirmed' // Aseguramos que tenga un estado por defecto
    })));
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
    try {
      const { data, error } = await supabase
        .from('blocked_times')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching blocked times:', error);
        return;
      }

      // Convertir las fechas a objetos Date
      const formattedData = data.map(block => ({
        ...block,
        date: new Date(block.date)
      }));

      console.log('Fetched blocked times:', formattedData);
      setBlockedTimes(formattedData);
    } catch (error) {
      console.error('Error in fetchBlockedTimes:', error);
    }
  };

  // Usar un solo useEffect para la carga inicial
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchAppointments(),
        fetchHolidays(),
        fetchBlockedTimes()
      ]);
    };

    initializeData();
  }, []);

  // Añadir esta nueva función para verificar y limpiar citas pasadas
  const cleanupPastAppointments = async () => {
    try {
      const now = new Date();
      const pastAppointments = appointments.filter(app => {
        const appointmentDateTime = new Date(app.date);
        appointmentDateTime.setHours(parseInt(app.time.split(':')[0]));
        appointmentDateTime.setMinutes(parseInt(app.time.split(':')[1]));
        return appointmentDateTime < now;
      });

      if (pastAppointments.length > 0) {
        // Eliminar en la base de datos usando IN para eliminar múltiples registros
        const { error } = await supabase
          .from('appointments')
          .delete()
          .in('id', pastAppointments.map(app => app.id));

        if (error) {
          console.error('Error deleting past appointments:', error);
          return;
        }

        // Actualizar estado local
        setAppointments(prev => 
          prev.filter(app => !pastAppointments.some(past => past.id === app.id))
        );
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  };

  // Modificar el createAppointment para establecer el estado como 'confirmed'
  const createAppointment = async (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
    try {
      const appointmentWithStatus = {
        ...appointmentData,
        status: 'confirmed' as const // Aseguramos que las nuevas citas sean confirmadas
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentWithStatus])
        .select()
        .single();

      if (error) throw error;

      const newAppointment = {
        ...data,
        date: new Date(data.date),
        status: 'confirmed' // Aseguramos el estado aquí también
      } as Appointment;

      setAppointments(prev => [...prev, newAppointment]);
      await notifyAppointmentCreated(newAppointment);
      toast.success('Cita agendada exitosamente');
      
      return newAppointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Error al crear la cita');
      throw error;
    }
  };

  // Agregar un useEffect para limpiar citas pasadas periódicamente
  useEffect(() => {
    // Limpiar citas pasadas al cargar
    cleanupPastAppointments();

    // Configurar un intervalo para verificar cada hora
    const interval = setInterval(cleanupPastAppointments, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [appointments]);

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

  // Modificar createBlockedTime para recargar los datos
  const createBlockedTime = async (blockedTimeData: Omit<BlockedTime, 'id'>): Promise<BlockedTime> => {
    try {
      const { data, error } = await supabase
        .from('blocked_times')
        .insert([{
          ...blockedTimeData,
          time: blockedTimeData.time,
          date: blockedTimeData.date.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newBlockedTime = {
        ...data,
        date: new Date(data.date)
      };

      // Recargar los horarios bloqueados para asegurar consistencia
      await fetchBlockedTimes();
      
      toast.success('Horario bloqueado exitosamente');
      return newBlockedTime;
    } catch (error) {
      console.error('Error creating blocked time:', error);
      toast.error('Error al bloquear el horario');
      throw error;
    }
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      const appointment = appointments.find(app => app.id === id);
      if (!appointment) {
        toast.error('Cita no encontrada');
        return;
      }

      // Eliminamos de la base de datos
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Error al eliminar la cita');
        return;
      }

      // Actualizamos el estado local
      setAppointments(prev => prev.filter(app => app.id !== id));
      
      // Enviar notificación de cancelación
      await notifyAppointmentCancelled(appointment);
      toast.success('Cita cancelada exitosamente');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Error al cancelar la cita');
    }
  };

  const deleteHoliday = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHolidays(prev => prev.filter(holiday => holiday.id !== id));
    } catch (error) {
      console.error('Error deleting holiday:', error);
      throw error;
    }
  };

  // Modificar deleteBlockedTime también
  const deleteBlockedTime = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recargar los horarios bloqueados
      await fetchBlockedTimes();
      toast.success('Horario desbloqueado exitosamente');
    } catch (error) {
      console.error('Error deleting blocked time:', error);
      toast.error('Error al desbloquear el horario');
      throw error;
    }
  };

  const checkForBlockedAndHolidays = async () => {
    try {
      const affected = appointments.filter(app => {
        const isHolidayAffected = holidays.some(h => 
          h.date.toDateString() === app.date.toDateString()
        );
        
        const isBlockedAffected = blockedTimes.some(bt => 
          bt.date.toDateString() === app.date.toDateString() && 
          bt.time === app.time
        );

        return (isHolidayAffected || isBlockedAffected) && app.status === 'confirmed';
      });

      for (const app of affected) {
        // Actualizar en base de datos
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', app.id);

        if (!error) {
          await notifyAppointmentCancelled({
            ...app,
            status: 'cancelled'
          });
        }
      }

      // Actualizar estado local
      setAppointments(prev => prev.map(app => 
        affected.some(a => a.id === app.id)
          ? { ...app, status: 'cancelled' }
          : app
      ));
    } catch (error) {
      console.error('Error checking blocked and holidays:', error);
    }
  };

  // Agregar useEffect para monitorear cambios
  useEffect(() => {
    checkForBlockedAndHolidays();
  }, [holidays, blockedTimes]);

  const isTimeSlotAvailable = useCallback((date: Date, time: string): boolean => {
    console.log('Checking availability for:', { date: date.toISOString(), time });
    console.log('Current blocked times:', blockedTimes);
    console.log('Current appointments:', appointments);

    // Verificar bloqueados
    const isBlocked = blockedTimes.some(block => {
      const sameDate = block.date.toDateString() === date.toDateString();
      const sameTime = block.time === time;
      console.log('Checking block:', { block, sameDate, sameTime });
      return sameDate && sameTime;
    });

    if (isBlocked) {
      console.log('Time is blocked');
      return false;
    }

    // Verificar citas existentes
    const isBooked = appointments.some(app => {
      const sameDate = app.date.toDateString() === date.toDateString();
      const sameTime = app.time === time;
      const isConfirmed = app.status === 'confirmed';
      console.log('Checking appointment:', { app, sameDate, sameTime, isConfirmed });
      return sameDate && sameTime && isConfirmed;
    });

    if (isBooked) {
      console.log('Time is booked');
      return false;
    }

    console.log('Time is available');
    return true;
  }, [blockedTimes, appointments]);

  return (
    <AppointmentContext.Provider value={{
      appointments,
      holidays,
      blockedTimes,
      userPhone,
      createAppointment,
      createHoliday,
      createBlockedTime,
      deleteAppointment,
      deleteHoliday,
      deleteBlockedTime,
      setUserPhone,
      isTimeSlotAvailable,
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};