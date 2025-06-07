import { DayOfWeek, BusinessHours } from '../types';

// Business hours configuration
export const businessHours: BusinessHours = {
  monday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '21:00' }
  },
  tuesday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '21:00' }
  },
  wednesday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '19:00' }
  },
  thursday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '21:00' }
  },
  friday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '21:00' }
  },
  saturday: {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '15:00', end: '21:00' }
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
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const generateTimeSlots = (date: Date, blockedTimes: string[] = []): string[] => {
  const day = getDayOfWeek(date);
  const hours = businessHours[day];
  const slots: string[] = [];
  
  if (!hours) return slots;
  
  // Generate morning slots with 1-hour intervals
  if (hours.morning) {
    let current = parseTime(hours.morning.start);
    const end = parseTime(hours.morning.end);
    
    while (current < end) {
      const hour = Math.floor(current / 60);
      const minute = current % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      if (!blockedTimes.includes(timeString)) {
        slots.push(timeString);
      }
      
      // 1-hour intervals
      current += 60;
    }
  }
  
  // Generate afternoon slots with 1-hour intervals
  if (hours.afternoon) {
    let current = parseTime(hours.afternoon.start);
    const end = parseTime(hours.afternoon.end);
    
    while (current < end) {
      const hour = Math.floor(current / 60);
      const minute = current % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      if (!blockedTimes.includes(timeString)) {
        slots.push(timeString);
      }
      
      // 1-hour intervals
      current += 60;
    }
  }
  
  return slots;
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${formattedHour}:${minutes} ${period}`;
};