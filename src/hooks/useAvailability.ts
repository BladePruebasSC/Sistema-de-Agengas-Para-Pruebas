import { useState, useEffect, useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { useAppointments } from '../context/AppointmentContext';

export const useAvailability = (selectedDate: Date | null, barberId?: string) => {
  const { appointments, holidays, blockedTimes, getAvailableHoursForDate, adminSettings } = useAppointments();
  const [availableHours, setAvailableHours] = useState<string[]>([]);

  // Business hours are now dynamically fetched based on barber/general settings
  const businessHours = useMemo(() => {
    if (!selectedDate) return [];
    // Utilize the logic from AppointmentContext to get appropriate business hours
    // This function already considers general vs. barber-specific schedules
    return getAvailableHoursForDate(selectedDate, barberId);
  }, [selectedDate, barberId, getAvailableHoursForDate]);

  // Memoize blocked hours calculation
  const blockedHours = useMemo(() => {
    if (!selectedDate) return [];

    // Filter appointments for the selected date and barber (if specified)
    const dateAppointments = appointments
      .filter(app =>
        isSameDay(new Date(app.date), selectedDate) &&
        (!barberId || app.barber_id === barberId || !app.barber_id ) // Considers general appointments if no barberId is selected or if appointment is general
      )
      .map(app => app.time);

    // Filter manually blocked times for the selected date, considering barber_id
    const manuallyBlocked = blockedTimes
      .filter(block =>
        isSameDay(new Date(block.date), selectedDate) &&
        (block.barber_id === null || !barberId || block.barber_id === barberId) // Applies if general or matches selected barber
      )
      .flatMap(block => block.timeSlots || (block.time ? [block.time] : [])); // block.timeSlots can be an array

    // Check for holidays, considering barber_id
    const isHolidayForContext = holidays.some(holiday =>
      isSameDay(new Date(holiday.date), selectedDate) &&
      (holiday.barber_id === null || !barberId || holiday.barber_id === barberId) // Applies if general or matches selected barber
    );

    if (isHolidayForContext) {
      return businessHours; // If it's a holiday for the current context, all business hours are considered blocked
    }

    return [...new Set([...dateAppointments, ...manuallyBlocked])];
  }, [selectedDate, barberId, appointments, holidays, blockedTimes, businessHours]);

  // Memoize available hours
  const currentAvailableHours = useMemo(() => {
    if (!selectedDate) return [];

    // Start with business hours appropriate for the date and barber
    let hours = businessHours;

    // Filter out globally restricted hours if applicable
    if (adminSettings.early_booking_restriction && adminSettings.restricted_hours) {
        const now = new Date();
        const appointmentDateTime = new Date(selectedDate);

        hours = hours.filter(time => {
            if (!adminSettings.restricted_hours?.includes(time)) return true; // Not a restricted hour type

            let hour24 = 0;
            if (time.includes('AM')) {
                hour24 = parseInt(time.split(':')[0]);
                if (hour24 === 12) hour24 = 0; // Midnight case
            } else if (time.includes('PM')) {
                hour24 = parseInt(time.split(':')[0]);
                if (hour24 !== 12) hour24 += 12; // Noon case is 12, others add 12
            } else { // Assuming 24h format if no AM/PM
                hour24 = parseInt(time.split(':')[0]);
            }

            appointmentDateTime.setHours(hour24, 0, 0, 0);

            const diffMs = appointmentDateTime.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            return diffHours >= adminSettings.early_booking_hours;
        });
    }

    return hours.filter(hour => !blockedHours.includes(hour));
  }, [selectedDate, businessHours, blockedHours, adminSettings]);

  // Update available hours only when currentAvailableHours changes
  useEffect(() => {
    setAvailableHours(currentAvailableHours);
  }, [currentAvailableHours]);

  const isHoliday = useMemo(() => {
    if (!selectedDate) return false;
    return holidays.some(holiday =>
      isSameDay(new Date(holiday.date), selectedDate) &&
      (holiday.barber_id === null || !barberId || holiday.barber_id === barberId)
    );
  }, [selectedDate, holidays, barberId]);

  return {
    availableHours,
    blockedHours, // This now correctly reflects barber-specific and general blocks
    isHoliday,    // This now correctly reflects barber-specific and general holidays
  };
};