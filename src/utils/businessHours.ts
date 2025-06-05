import { DayOfWeek, BusinessHours } from '../types';

// Business hours configuration
export const businessHours: BusinessHours = {
  monday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '20:00' }
  },
  tuesday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '20:00' }
  },
  wednesday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '19:00' }
  },
  thursday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '20:00' }
  },
  friday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '20:00' }
  },
  saturday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '20:00' }
  },
  sunday: {
    morning: { start: '10:00', end: '15:00' }
  }
};

export const getDayOfWeek = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

export const isBusinessHour = (date: Date, time: string): boolean => {
  const day = getDayOfWeek(date);
  const hours = businessHours[day];
  
  if (!hours) return false;
  
  const timeValue = parseTime(time);
  
  if (hours.morning) {
    const morningStart = parseTime(hours.morning.start);
    const morningEnd = parseTime(hours.morning.end);
    if (timeValue >= morningStart && timeValue < morningEnd) return true;
  }
  
  if (hours.afternoon) {
    const afternoonStart = parseTime(hours.afternoon.start);
    const afternoonEnd = parseTime(hours.afternoon.end);
    if (timeValue >= afternoonStart && timeValue < afternoonEnd) return true;
  }
  
  return false;
};

export const parseTime = (time: string): number => {
  // Convert time like "7:00 AM" to minutes since midnight
  const [timeStr, period] = time.split(' ');
  let [hours, minutes] = timeStr.split(':').map(Number);
  
  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
};

export const formatTimeForDisplay = (time: string): string => {
  // Convert 24-hour time to 12-hour format with AM/PM
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const generateTimeSlots = (date: Date): string[] => {
  const day = getDayOfWeek(date);
  const hours = businessHours[day];
  const slots: string[] = [];
  
  if (!hours) return slots;
  
  const addSlots = (start: string, end: string) => {
    let current = parseTime(start);
    const endTime = parseTime(end);
    
    while (current < endTime) {
      const hour = Math.floor(current / 60);
      const minute = current % 60;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      slots.push(`${displayHour}:${minute.toString().padStart(2, '0')} ${period}`);
      current += 60; // Add 1 hour
    }
  };
  
  if (hours.morning) {
    addSlots(formatTimeForDisplay(hours.morning.start), formatTimeForDisplay(hours.morning.end));
  }
  
  if (hours.afternoon) {
    addSlots(formatTimeForDisplay(hours.afternoon.start), formatTimeForDisplay(hours.afternoon.end));
  }
  
  return slots;
};