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
  availableHours: string[];
  barberId?: string;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ 
  date, 
  onSelectTime,
  selectedTime, 
  isHoliday,
  availableHours,
  barberId // Aunque barberId ya no se usará directamente aquí para filtrar citas/bloqueos
}) => {
  const { getAvailableHoursForDate } = useAppointments(); // Solo necesitamos esto para obtener allHours
  
  console.log(`[TimeSlotPicker Init] Props received - Date: ${date}, SelectedTime: ${selectedTime}, IsHoliday: ${isHoliday}, AvailableHours: ${JSON.stringify(availableHours)}, BarberId: ${barberId}`);

  if (isHoliday) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-600 font-medium">Este día está marcado como feriado.</p>
        <p className="text-red-500 mt-1">No hay citas disponibles.</p>
      </div>
    );
  }
  
  // Usar los horarios dinámicos basados en la configuración de negocio
  const allHours = getAvailableHoursForDate(date);

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
        const isActuallyAvailable = availableHours.includes(hour);
        
        // Log para cada hora dentro del map
        if (hour === "10:00 AM" || hour === "9:00 AM") { // Log específico para horas de interés o para todas si es necesario
           console.log(`[TimeSlotPicker map] Hour: "${hour}", availableHours.includes("${hour}"): ${availableHours.includes(hour)}, isActuallyAvailable: ${isActuallyAvailable}, selectedTime: "${selectedTime}"`);
        }

        let buttonClass = 'p-3 rounded-lg text-center transition-all ';
        
        if (selectedTime === hour) {
          buttonClass += 'bg-red-600 text-white';
        } else if (isActuallyAvailable) {
          buttonClass += 'bg-green-100 hover:bg-green-200 text-green-800';
        } else {
          buttonClass += 'bg-gray-100 text-gray-400 cursor-not-allowed line-through';
        }
        
        // Log de la clase final aplicada (opcional, pero puede ser útil)
        // if (hour === "10:00 AM" || hour === "9:00 AM") {
        //   console.log(`[TimeSlotPicker map] Hour: "${hour}", final buttonClass: "${buttonClass}"`);
        // }

        return (
          <button
            key={hour}
            onClick={() => isActuallyAvailable && onSelectTime(hour)}
            disabled={!isActuallyAvailable || isHoliday}
            className={buttonClass}
          >
            <div className="font-medium">{hour}</div>
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlotPicker;