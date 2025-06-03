import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppointments } from '../../context/AppointmentContext';
import { generateTimeSlots, formatTime, isBusinessHour } from '../../utils/businessHours';

interface TimeSlotPickerProps {
  date: Date;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  isHoliday: boolean;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ 
  date, 
  selectedTime, 
  onSelectTime,
  isHoliday
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
  
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {allTimeSlots.map((time) => {
        const available = isTimeSlotAvailable(time);
        const isValid = isBusinessHour(date, time);
        
        let className = "time-slot p-2 rounded-md text-center cursor-pointer";
        let statusText = "";
        
        if (selectedTime === time) {
          className += " selected";
          statusText = "Seleccionado";
        } else if (!isValid) {
          className += " non-business";
          statusText = "No disponible";
        } else if (!available) {
          className += " booked";
          statusText = "Ocupado";
        } else {
          className += " available";
          statusText = "Disponible";
        }
        
        return (
          <div
            key={time}
            className={className}
            onClick={() => {
              if (isValid && available) {
                onSelectTime(time);
              }
            }}
            title={statusText}
          >
            {formatTime(time)}
          </div>
        );
      })}
    </div>
  );
};

export default TimeSlotPicker;