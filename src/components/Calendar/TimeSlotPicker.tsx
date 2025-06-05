import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppointments } from '../../context/AppointmentContext';
import { generateTimeSlots } from '../../utils/businessHours';
import { Clock } from 'lucide-react';

interface TimeSlotPickerProps {
  date: Date;
  onSelectTime: (time: string) => void;
  selectedTime: string | null;
  isHoliday: boolean;
  availableHours: string[];
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ 
  date, 
  onSelectTime,
  selectedTime, 
  isHoliday,
  availableHours
}) => {
  const { blockedTimes, appointments } = useAppointments();
  
  if (isHoliday) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-center text-red-600 mb-2">
          <Clock className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-medium">Día No Disponible</h3>
        </div>
        <p className="text-red-500 text-center">
          Este día está marcado como feriado y no hay citas disponibles.
        </p>
      </div>
    );
  }
  
  const allHours = [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {allHours.map((hour) => {
          const isAvailable = availableHours.includes(hour);
          const isSelected = selectedTime === hour;
          
          return (
            <button
              key={hour}
              onClick={() => isAvailable && onSelectTime(hour)}
              disabled={!isAvailable || isHoliday}
              className={`
                relative p-4 rounded-lg text-center transition-all duration-200
                ${isSelected 
                  ? 'bg-red-600 text-white shadow-lg transform scale-105' 
                  : isAvailable
                    ? 'bg-green-50 hover:bg-green-100 text-green-800 hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
            >
              <div className="flex flex-col items-center">
                <Clock className={`w-5 h-5 mb-1 ${isSelected ? 'text-white' : isAvailable ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium">{hour}</span>
                {!isAvailable && (
                  <span className="absolute bottom-1 left-0 right-0 text-xs text-gray-500">
                    No disponible
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 justify-center text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-50 border border-green-600 mr-1"></div>
          <span className="text-gray-600">Disponible</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-600 mr-1"></div>
          <span className="text-gray-600">Seleccionado</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300 mr-1"></div>
          <span className="text-gray-600">No disponible</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotPicker;