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
  
  console.log(`[TimeSlotPicker] Received Date: ${date}, SelectedTime: ${selectedTime}, IsHoliday: ${isHoliday}, AvailableHours Prop: ${JSON.stringify(availableHours)}, BarberId Prop: ${barberId}`);

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
        // La disponibilidad ahora se determina SOLELY por el prop availableHours
        // que ya ha sido calculado por CalendarView usando la lógica del contexto.
        const isActuallyAvailable = availableHours.includes(hour);
        
        let buttonClass = 'p-3 rounded-lg text-center transition-all ';
        // let statusText = ''; // No necesitamos distinguir la causa de la no disponibilidad aquí.
        
        if (selectedTime === hour) {
          buttonClass += 'bg-red-600 text-white';
        } else if (isActuallyAvailable) {
          buttonClass += 'bg-green-100 hover:bg-green-200 text-green-800';
        } else {
          // Si no está en availableHours, está no disponible por alguna razón (bloqueo, cita, feriado ya manejado)
          buttonClass += 'bg-gray-100 text-gray-400 cursor-not-allowed line-through';
          // statusText = 'No Disp.'; // Opcional: si quieres un texto genérico
        }
        
        return (
          <button
            key={hour}
            onClick={() => isActuallyAvailable && onSelectTime(hour)}
            disabled={!isActuallyAvailable || isHoliday} // isHoliday ya se chequea arriba, pero doble seguridad no daña.
            className={buttonClass}
          >
            <div className="font-medium">{hour}</div>
            {/* {statusText && (
              <div className="text-xs mt-1">{statusText}</div>
            )} */}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlotPicker;