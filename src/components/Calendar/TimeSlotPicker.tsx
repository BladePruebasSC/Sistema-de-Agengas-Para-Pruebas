import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppointments } from '../../context/AppointmentContext';
import { isSameDate } from '../../utils/dateUtils';

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
    block => isSameDate(block.date, date)
  );
  
  // Encontrar las citas para la fecha seleccionada
  const appointmentsForDate = appointments.filter(
    app => isSameDate(app.date, date)
  );
  
  const isTimeSlotBlocked = (time: string): boolean => {
    // Verificar si el horario está bloqueado manualmente
    if (blockedTimesForDate) {
      // Verificar en timeSlots (array)
      if (Array.isArray(blockedTimesForDate.timeSlots) && blockedTimesForDate.timeSlots.includes(time)) {
        return true;
      }
      // Verificar en time (string individual) - compatibilidad hacia atrás
      if (blockedTimesForDate.time === time) {
        return true;
      }
    }
    return false;
  };
  
  const isTimeSlotBooked = (time: string): boolean => {
    // Verificar si hay una cita en ese horario
    return appointmentsForDate.some(app => app.time === time);
  };
  
  const isTimeSlotAvailable = (time: string): boolean => {
    return !isTimeSlotBlocked(time) && !isTimeSlotBooked(time);
  };
  
  if (isHoliday) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-600 font-medium">Este día está marcado como feriado.</p>
        <p className="text-red-500 mt-1">No hay citas disponibles.</p>
      </div>
    );
  }
  
  // Horarios específicos por día de la semana
  const getHoursForDay = (date: Date): string[] => {
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0) {
      // Domingo: 10:00 AM a 3:00 PM
      return ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'];
    } else if (dayOfWeek === 3) {
      // Miércoles: 7:00 AM a 12:00 PM y 3:00 PM a 7:00 PM
      return [
        '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM' , '7:00 PM'
      ];
    } else {
      // Resto de días: horarios normales
      return [
        '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
      ];
    }
  };

  const allHours = getHoursForDay(date);

  if (allHours.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600 font-medium">No hay horarios laborables para este día.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {allHours.map((hour) => {
        const isBlocked = isTimeSlotBlocked(hour);
        const isBooked = isTimeSlotBooked(hour);
        const isAvailable = isTimeSlotAvailable(hour) && availableHours.includes(hour);
        
        let buttonClass = 'p-3 rounded-lg text-center transition-all ';
        let statusText = '';
        
        if (selectedTime === hour) {
          buttonClass += 'bg-red-600 text-white';
        } else if (isBlocked) {
          buttonClass += 'bg-orange-100 text-orange-800 cursor-not-allowed';
          statusText = 'Bloqueado';
        } else if (isBooked) {
          buttonClass += 'bg-red-100 text-red-800 cursor-not-allowed';
          statusText = 'Ocupado';
        } else if (isAvailable) {
          buttonClass += 'bg-green-100 hover:bg-green-200 text-green-800';
        } else {
          buttonClass += 'bg-gray-100 text-gray-400 cursor-not-allowed';
          statusText = 'No disponible';
        }
        
        return (
          <button
            key={hour}
            onClick={() => isAvailable && onSelectTime(hour)}
            disabled={!isAvailable || isHoliday}
            className={buttonClass}
          >
            <div className="font-medium">{hour}</div>
            {statusText && (
              <div className="text-xs mt-1">{statusText}</div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlotPicker;