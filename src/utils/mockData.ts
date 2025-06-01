import { Appointment, Holiday, BlockedTime, Service } from '../types';

// Sample services
export const services: Service[] = [
  { id: '1', name: 'Haircut', price: 25, duration: 30 },
  { id: '2', name: 'Beard Trim', price: 15, duration: 20 },
  { id: '3', name: 'Haircut & Beard', price: 35, duration: 45 },
  { id: '4', name: 'Hair Styling', price: 20, duration: 25 },
  { id: '5', name: 'Shave', price: 20, duration: 30 },
  { id: '6', name: 'Hair Coloring', price: 50, duration: 60 }
];

// Initial mock appointments
export const appointments: Appointment[] = [
  {
    id: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    time: '10:00',
    clientName: 'John Doe',
    clientPhone: '555-123-4567',
    service: 'Haircut',
    confirmed: true
  },
  {
    id: '2',
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    time: '15:30',
    clientName: 'Mike Smith',
    clientPhone: '555-987-6543',
    service: 'Beard Trim',
    confirmed: true
  }
];

// Sample holidays
export const holidays: Holiday[] = [
  {
    id: '1',
    date: new Date(new Date().getFullYear(), 11, 25), // Christmas
    description: 'Christmas Day'
  },
  {
    id: '2',
    date: new Date(new Date().getFullYear(), 0, 1), // New Year's Day
    description: 'New Year\'s Day'
  }
];

// Sample blocked times
export const blockedTimes: BlockedTime[] = [
  {
    id: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 3)),
    timeSlots: ['09:00', '09:30', '10:00'],
    reason: 'Staff Meeting'
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