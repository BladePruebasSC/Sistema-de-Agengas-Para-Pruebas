import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppointments } from '../../context/AppointmentContext';
import { generateTimeSlots, formatTime, isBusinessHour } from '../../utils/businessHours';
import { isTimeSlotAvailable } from '../../utils/mockData';

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
  const { blockedTimes } = useAppointments();

  const blockedTimeSlots = React.useMemo(() => {
    if (!blockedTimes || !date) return [];

    // Find all blocked times for this date
    const blockedForDate = blockedTimes.filter(block => {
      if (!block || !block.date) return false;
      
      const blockDate = new Date(block.date);
      const targetDate = new Date(date);
      
      return blockDate.getFullYear() === targetDate.getFullYear() &&
             blockDate.getMonth() === targetDate.getMonth() &&
             blockDate.getDate() === targetDate.getDate();
    });

    // Combine all blocked times into a Set
    const timeSlots = new Set<string>();
    
    blockedForDate.forEach(block => {
      // Check if timeSlots exists and is an array
      if (block.timeSlots && Array.isArray(block.timeSlots)) {
        block.timeSlots.forEach(time => {
          if (time) timeSlots.add(time);
        });
      }
    });

    return Array.from(timeSlots);
  }, [blockedTimes, date]);

  // Check if a specific time is blocked
  const isTimeBlocked = React.useCallback((time: string) => {
    return blockedTimeSlots.includes(time);
  }, [blockedTimeSlots]);

  // Generate available time slots
  const allTimeSlots = generateTimeSlots(date);

  // Rest of the render logic
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {allTimeSlots.map((time) => {
        const isBlocked = isTimeBlocked(time);
        const available = isTimeSlotAvailable(date, time) && !isBlocked;
        const isValid = isBusinessHour(date, time);
        
        let className = "time-slot p-2 rounded-md text-center cursor-pointer";
        let statusText = "";
        
        if (selectedTime === time) {
          className += " selected";
          statusText = "Seleccionado";
        } else if (!isValid) {
          className += " non-business";
          statusText = "No disponible";
        } else if (!available || isBlocked) {
          className += " booked";
          statusText = "Bloqueado";
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