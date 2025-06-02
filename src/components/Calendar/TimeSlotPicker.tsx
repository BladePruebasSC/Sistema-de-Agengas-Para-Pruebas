import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppointments } from '../../context/AppointmentContext';
import { generateTimeSlots, isBusinessHour } from '../../utils/businessHours';

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

  const isTimeAvailable = (timeSlot: string): boolean => {
    // Check if blocked
    const isBlocked = blockedTimes.some(block => 
      block.date.toDateString() === date.toDateString() && 
      block.time === timeSlot
    );

    // Check if booked
    const isBooked = appointments.some(app => 
      app.date.toDateString() === date.toDateString() && 
      app.time === timeSlot && 
      app.status === 'confirmed'
    );

    return !isBlocked && !isBooked;
  };

  const timeSlots = useMemo(() => {
    if (isHoliday) return [];
    
    const slots = generateTimeSlots();
    return slots.map(time => ({
      time,
      available: isTimeAvailable(time),
      valid: isBusinessHour(time)
    }));
  }, [date, isHoliday, blockedTimes, appointments]);

  if (isHoliday) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-600 font-medium">Este día está marcado como feriado.</p>
        <p className="text-red-500 mt-1">No hay citas disponibles.</p>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600 font-medium">No hay horarios disponibles para este día.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {timeSlots.map(({ time, available, valid }) => (
        <button
          key={time}
          onClick={() => {
            if (valid && available) {
              onSelectTime(time);
            }
          }}
          disabled={!valid || !available}
          className={`
            p-2 rounded-md transition-colors
            ${selectedTime === time 
              ? 'bg-blue-600 text-white' 
              : !valid || !available
                ? 'bg-red-100 text-red-800 cursor-not-allowed'
                : 'bg-green-100 text-green-800'
            }
          `}
          title={
            selectedTime === time ? "Hora seleccionada" : 
            !valid ? "Fuera de horario laboral" : 
            !available ? "Horario no disponible" : 
            "Horario disponible"
          }
        >
          {time}
        </button>
      ))}
    </div>
  );
};

export default TimeSlotPicker;