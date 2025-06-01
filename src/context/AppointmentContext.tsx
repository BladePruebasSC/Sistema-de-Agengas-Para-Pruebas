import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Appointment, Holiday, BlockedTime } from '../types';
import { 
  appointments as initialAppointments, 
  holidays as initialHolidays, 
  blockedTimes as initialBlockedTimes,
  addAppointment,
  addHoliday,
  addBlockedTime,
  deleteHoliday,
  deleteBlockedTime
} from '../utils/mockData';

interface AppointmentContextType {
  appointments: Appointment[];
  holidays: Holiday[];
  blockedTimes: BlockedTime[];
  createAppointment: (appointment: Omit<Appointment, 'id'>) => Appointment;
  createHoliday: (holiday: Omit<Holiday, 'id'>) => Holiday;
  createBlockedTime: (blockedTime: Omit<BlockedTime, 'id'>) => BlockedTime;
  removeHoliday: (id: string) => void;
  removeBlockedTime: (id: string) => void;
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
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(initialBlockedTimes);

  const createAppointment = (appointmentData: Omit<Appointment, 'id'>) => {
    const newAppointment = addAppointment(appointmentData);
    setAppointments(prev => [...prev, newAppointment]);
    return newAppointment;
  };

  const createHoliday = (holidayData: Omit<Holiday, 'id'>) => {
    const newHoliday = addHoliday(holidayData);
    setHolidays(prev => [...prev, newHoliday]);
    return newHoliday;
  };

  const createBlockedTime = (blockedTimeData: Omit<BlockedTime, 'id'>) => {
    const newBlockedTime = addBlockedTime(blockedTimeData);
    setBlockedTimes(prev => [...prev, newBlockedTime]);
    return newBlockedTime;
  };

  const removeHoliday = (id: string) => {
    setHolidays(prev => prev.filter(holiday => holiday.id !== id));
  };

  const removeBlockedTime = (id: string) => {
    setBlockedTimes(prev => prev.filter(block => block.id !== id));
  };

  return (
    <AppointmentContext.Provider value={{
      appointments,
      holidays,
      blockedTimes,
      createAppointment,
      createHoliday,
      createBlockedTime,
      removeHoliday,
      removeBlockedTime
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};