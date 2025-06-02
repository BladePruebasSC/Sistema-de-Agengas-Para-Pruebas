import { Appointment, Holiday, BlockedTime, Service } from '../types';

// Sample services
export const services: Service[] = [
  { id: '1', name: 'Corte Normal', price: 500, duration: 45 },
  { id: '2', name: 'Corte + Barba', price: 700, duration: 45 },
  { id: '3', name: 'Corte Normal + Cejas', price: 600, duration: 45 },
  { id: '4', name: 'Corte + Barba + Ceja', price: 800, duration: 45 },
];

// Initial appointments array
export const appointments: Appointment[] = [];

// Sample holidays with proper date handling
export const holidays: Holiday[] = [
  {
    id: '1',
    date: new Date(new Date().getFullYear(), 11, 25), // Christmas
    description: 'Día de Navidad'
  },
  {
    id: '2',
    date: new Date(new Date().getFullYear(), 0, 1), // New Year's Day
    description: 'Año Nuevo'
  }
];

// Blocked times with proper time format
export const blockedTimes: BlockedTime[] = [
  {
    id: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 3)),
    time: '09:00',
    reason: 'Diligencias'
  },
  {
    id: '2',
    date: new Date(new Date().setDate(new Date().getDate() + 3)),
    time: '09:30',
    reason: 'Diligencias'
  }
];

// Updated availability check function
export const isTimeSlotAvailable = (date: Date, time: string): boolean => {
  if (!date || !time) return false;

  const dateString = date.toDateString();
  
  // Debug logs
  console.log('Checking availability for:', { date: dateString, time });
  
  // Check holidays
  const isHolidayDate = holidays.some(holiday => {
    const holidayMatch = holiday.date.toDateString() === dateString;
    if (holidayMatch) console.log('Holiday found:', holiday);
    return holidayMatch;
  });
  
  if (isHolidayDate) return false;

  // Check blocked times
  const isTimeBlocked = blockedTimes.some(block => {
    const blockMatch = block.date.toDateString() === dateString && block.time === time;
    if (blockMatch) console.log('Blocked time found:', block);
    return blockMatch;
  });
  
  if (isTimeBlocked) return false;

  // Check existing appointments
  const isBooked = appointments.some(app => {
    const appointmentMatch = app.date.toDateString() === dateString && 
                           app.time === time && 
                           app.status === 'confirmed';
    if (appointmentMatch) console.log('Existing appointment found:', app);
    return appointmentMatch;
  });
  
  if (isBooked) return false;

  return true;
};

// Updated database operation functions
export const addAppointment = (data: Omit<Appointment, 'id'>): Appointment => ({
  id: crypto.randomUUID(),
  ...data,
});

export const addHoliday = (data: Omit<Holiday, 'id'>): Holiday => ({
  id: crypto.randomUUID(),
  ...data,
});

export const addBlockedTime = (data: Omit<BlockedTime, 'id'>): BlockedTime => {
  const newBlockedTime = {
    id: crypto.randomUUID(),
    ...data,
  };
  blockedTimes.push(newBlockedTime);
  return newBlockedTime;
};

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