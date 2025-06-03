import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppointments } from '../../context/AppointmentContext';
import { generateTimeSlots, formatTime, isBusinessHour } from '../../utils/businessHours';

interface TimeSlotPickerProps {
  date: Date;
  onSelectTime: (time: string) => void;
  selectedTime: string | null;
  isHoliday: boolean;
  availableHours: string[]; // Añadir esta prop
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ 
  date, 
  onSelectTime,
  selectedTime, 
  isHoliday,
  availableHours
}) => {
  const { blockedTimes, appointments } = useAppointments();
  
  // Encontrar los horarios bloqueados para la fecha seleccionada
  const blockedTimesForDate = blockedTimes.find(
    block => 
      block.date.getFullYear() === date.getFullYear() &&
      block.date.getMonth() === date.getMonth() &&
      block.date.getDate() === date.getDate()
  );
  
  // Encontrar las citas para la fecha seleccionada
  const appointmentsForDate = appointments.filter(
    app =>
      app.date.getFullYear() === date.getFullYear() &&
      app.date.getMonth() === date.getMonth() &&
      app.date.getDate() === date.getDate()
  );
  
  const isTimeSlotAvailable = (time: string): boolean => {
    // Verificar si el horario está bloqueado
    if (blockedTimesForDate?.timeSlots.includes(time)) {
      return false;
    }
    
    // Verificar si hay una cita en ese horario
    if (appointmentsForDate.some(app => app.time === time)) {
      return false;
    }
    
    return true;
  };
  
  const allTimeSlots = generateTimeSlots(date);
  
  if (isHoliday) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-600 font-medium">Este día está marcado como feriado.</p>
        <p className="text-red-500 mt-1">No hay citas disponibles.</p>
      </div>
    );
  }
  
  if (allTimeSlots.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600 font-medium">No hay horarios disponibles para este día.</p>
      </div>
    );
  }
  
  const allHours = [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {allHours.map((hour) => {
        const isAvailable = availableHours.includes(hour);
        return (
          <button
            key={hour}
            onClick={() => isAvailable && onSelectTime(hour)}
            disabled={!isAvailable || isHoliday}
            className={`
              p-3 rounded-lg text-center transition-all
              ${selectedTime === hour 
                ? 'bg-red-600 text-white' 
                : isAvailable && !isHoliday
                  ? 'bg-green-100 hover:bg-green-200 text-green-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
          >
            {hour}
            {!isAvailable && (
              <span className="block text-xs">No disponible</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlotPicker;