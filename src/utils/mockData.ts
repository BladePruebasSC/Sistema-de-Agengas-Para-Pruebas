import { Appointment, Holiday, BlockedTime, Service } from '../types';

// Sample services
export const services: Service[] = [
  { id: '1', name: 'Corte Normal', price: 500, duration: 45 },
  { id: '2', name: 'Corte + Barba', price: 700, duration: 45 },
  { id: '3', name: 'Corte Normal + Cejas', price: 600, duration: 45 },
  { id: '4', name: 'Corte + Barba + Ceja', price: 800, duration: 45 },
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

// Function to check if a time slot is available
export const isTimeSlotAvailable = (date: Date, time: string): boolean => {
  // Check if date is a holiday
  const isHoliday = holidays.some(holiday => 
    holiday.date.getFullYear() === date.getFullYear() && 
    holiday.date.getMonth() === date.getMonth() && 
    holiday.date.getDate() === date.getDate()
  );
  
  if (isHoliday) return false;
  
  // Check if time is blocked
  const isBlocked = blockedTimes.some(block => 
    block.date.getFullYear() === date.getFullYear() && 
    block.date.getMonth() === date.getMonth() && 
    block.date.getDate() === date.getDate() && 
    block.timeSlots.includes(time)
  );
  
  if (isBlocked) return false;
  
  // Check if time is already booked
  const isBooked = appointments.some(appointment => 
    appointment.date.getFullYear() === date.getFullYear() && 
    appointment.date.getMonth() === date.getMonth() && 
    appointment.date.getDate() === date.getDate() && 
    appointment.time === time
  );
  
  return !isBooked;
};

// Mock functions to simulate database operations
export function addAppointment(data: Omit<Appointment, 'id'>): Appointment {
  return {
    id: crypto.randomUUID(),
    ...data,
  };
}

export function addHoliday(data: Omit<Holiday, 'id'>): Holiday {
  return {
    id: crypto.randomUUID(),
    ...data,
  };
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