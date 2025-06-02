import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Appointment, Holiday, BlockedTime } from '../types';
import { supabase } from '../lib/supabase';
import { notifyAppointmentCreated, notifyAppointmentCancelled } from '../utils/whatsapp';

interface AppointmentContextType {
  appointments: Appointment[];
  holidays: Holiday[];
  blockedTimes: BlockedTime[];
  userPhone: string | null;
  createAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<Appointment>;
  createHoliday: (holiday: Omit<Holiday, 'id'>) => Promise<Holiday>;
  createBlockedTime: (blockedTime: Omit<BlockedTime, 'id'>) => Promise<BlockedTime>;
  deleteAppointment: (id: string) => Promise<void>;
  removeHoliday: (id: string) => Promise<void>;
  removeBlockedTime: (id: string) => Promise<void>;
  setUserPhone: (phone: string) => void;
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

    setAppointments(data.map(app => ({
      ...app,
      date: new Date(app.date)
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

  const createAppointment = async (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) throw error;

    const newAppointment = {
      ...data,
      date: new Date(data.date)
    };

    setAppointments(prev => [...prev, newAppointment]);
    setUserPhone(newAppointment.clientPhone); // <-- Agrega esta línea
    await notifyAppointmentCreated(newAppointment);

    return newAppointment;
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
    const appointment = appointments.find(app => app.id === id);
    if (!appointment) return;

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setAppointments(prev => prev.filter(app => app.id !== id));
    await notifyAppointmentCancelled(appointment, appointments);
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
      removeHoliday,
      removeBlockedTime,
      setUserPhone
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};