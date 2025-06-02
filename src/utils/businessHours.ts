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

// Función auxiliar para formatear la hora
export const formatTime = (time: string): string => {
  return time;
};

// Función para verificar si es horario laboral
export const isBusinessHour = (time: string): boolean => {
  const hour = parseInt(time.split(':')[0]);
  return hour >= 7 && hour < 20;
};

export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  // Horario de 7:00 a 19:00
  for (let hour = 7; hour < 20; hour++) {
    // Formatear la hora correctamente
    const formattedHour = hour.toString().padStart(2, '0');
    slots.push(`${formattedHour}:00`);
  }
  console.log('Generated time slots in utils:', slots);
  return slots;
};