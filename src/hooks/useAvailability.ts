import { useState, useEffect, useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { useAppointments } from '../context/AppointmentContext';

export const useAvailability = (selectedDate: Date | null) => {
  const { appointments, holidays, blockedTimes } = useAppointments();
  const [availableHours, setAvailableHours] = useState<string[]>([]);

  // Memoize business hours
  const businessHours = useMemo(() => [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
  ], []);

  // Memoize blocked hours calculation
  const blockedHours = useMemo(() => {
    if (!selectedDate) return [];

    // Get appointments for the selected date
    const dateAppointments = appointments.filter(app => 
      isSameDay(new Date(app.date), selectedDate)
    ).map(app => app.time);

    // Get manually blocked times for the selected date
    const manuallyBlocked = blockedTimes.filter(block => 
      isSameDay(new Date(block.date), selectedDate)
    ).map(block => block.time);

    // Get holiday check
    const isHoliday = holidays.some(holiday => 
      isSameDay(new Date(holiday.date), selectedDate)
    );

    // If it's a holiday, block all hours
    if (isHoliday) {
      return businessHours;
    }

    // Combine all blocked hours
    return [...new Set([...dateAppointments, ...manuallyBlocked])];
  }, [selectedDate, appointments, blockedTimes, holidays, businessHours]);

  // Memoize available hours
  const currentAvailableHours = useMemo(() => {
    if (!selectedDate) return [];
    return businessHours.filter(hour => !blockedHours.includes(hour));
  }, [selectedDate, businessHours, blockedHours]);

  // Update available hours only when currentAvailableHours changes
  useEffect(() => {
    setAvailableHours(currentAvailableHours);
  }, [currentAvailableHours]);

  return {
    availableHours,
    blockedHours,
    isHoliday: blockedHours.length === businessHours.length
  };
};