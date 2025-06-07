import { Appointment, Holiday, BlockedTime, Service } from '../types';

// Sample services
export const services: Service[] = [
  { id: '1', name: 'Adulto Clasico', price: 1200, duration: 45 },
  { id: '2', name: 'Adulto con Barba', price: 1500, duration: 45 },
  { id: '3', name: 'Joven', price: 800, duration: 45 },
  { id: '4', name: 'Cerquillo', price: 500, duration: 45 },
  { id: '5', name: 'Con Tijeras', price: 2000, duration: 45 },
];

// Initial mock appointments
export const appointments: Appointment[] = [

];

// Sample holidays
export const holidays: Holiday[] = [
  {
    id: '1',
    date: new Date(new Date().getFullYear(), 11, 25), // Christmas
    description: 'Dia de Navidad'
  },
  {
    id: '2',
    date: new Date(new Date().getFullYear(), 0, 1), // New Year's Day
    description: 'Año Nuevo'
  }
];

// Sample blocked times
export const blockedTimes: BlockedTime[] = [
  {
    id: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 3)),
    timeSlots: ['09:00', '09:30', '10:00'],
    reason: 'Diligencias'
  }
];

// Función mejorada para verificar si una fecha es feriado
export const isHolidayDate = (date: Date): boolean => {
  return holidays.some(holiday => 
    holiday.date.getFullYear() === date.getFullYear() && 
    holiday.date.getMonth() === date.getMonth() && 
    holiday.date.getDate() === date.getDate()
  );
};

// Función mejorada para verificar disponibilidad
export const isTimeSlotAvailable = (date: Date, time: string): boolean => {
  // Check if it's a holiday
  if (isHolidayDate(date)) {
    return false;
  }

  // Check blocked times
  const isBlocked = blockedTimes.some(block => {
    const sameDate = 
      block.date.getFullYear() === date.getFullYear() &&
      block.date.getMonth() === date.getMonth() &&
      block.date.getDate() === date.getDate();

    // Only check timeSlots array
    return sameDate && block.timeSlots.includes(time);
  });

  if (isBlocked) {
    return false;
  }

  // Check existing appointments
  const isBooked = appointments.some(appointment => {
    const appointmentDate = new Date(appointment.date);
    const sameDate = 
      appointmentDate.getFullYear() === date.getFullYear() &&
      appointmentDate.getMonth() === date.getMonth() &&
      appointmentDate.getDate() === date.getDate();
    
    return sameDate && appointment.time === time;
  });

  return !isBooked;
};

// Mock functions to simulate database operations
export function addAppointment(data: Omit<Appointment, 'id'>): Appointment {
  return {
    id: crypto.randomUUID(),
    ...data,
  };
}

// Función mejorada para agregar feriados
export function addHoliday(data: Omit<Holiday, 'id'>): Holiday {
  // Verifica si ya existe un feriado en esa fecha
  const exists = isHolidayDate(data.date);
  if (exists) {
    throw new Error('Ya existe un feriado en esta fecha');
  }

  const holiday: Holiday = {
    id: crypto.randomUUID(),
    ...data,
  };
  
  holidays.push(holiday);
  return holiday;
}

export function addBlockedTime(data: Omit<BlockedTime, 'id'>): BlockedTime {
  return {
    id: crypto.randomUUID(),
    ...data,
  };
}

export const deleteHoliday = (id: string): void => {
  const index = holidays.findIndex(holiday => holiday.id === id);
  if (index !== -1) {
    holidays.splice(index, 1);
  }
};

export const deleteBlockedTime = (id: string): void => {
  const index = blockedTimes.findIndex(block => block.id === id);
  if (index !== -1) {
    blockedTimes.splice(index, 1);
  }
};